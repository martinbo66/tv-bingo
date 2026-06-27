#!/bin/bash
# One-time setup script for a fresh Digital Ocean Ubuntu 24.04 LTS droplet.
# Run as root: bash setup-droplet.sh
#
# After running this script:
#   1. Configure the database — either:
#        a) Run setup-postgres.sh for a local Postgres instance, OR
#        b) Edit /opt/tvbingo/.env with external DB credentials
#   2. Ensure your deploy SSH public key is in ~/.ssh/authorized_keys
#   3. Trigger the "Deploy to Digital Ocean" workflow in GitHub Actions

set -e

if [ -z "$DOMAIN" ]; then
    echo "Usage: DOMAIN=yourdomain.com bash setup-droplet.sh"
    exit 1
fi

echo "=== TV Bingo App - Droplet Setup ==="

# ── Install Eclipse Temurin Java 25 ──────────────────────────────────────────
echo "Installing Eclipse Temurin JRE 25..."
apt-get update -q
apt-get install -y wget apt-transport-https gpg
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor -o /etc/apt/keyrings/adoptium.gpg
echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(. /etc/os-release && echo "$VERSION_CODENAME") main" > /etc/apt/sources.list.d/adoptium.list
apt-get update -q
apt-get install -y temurin-25-jre
java -version

# ── Create dedicated app user and directories ─────────────────────────────────
echo "Creating tvbingo user and directories..."
if ! id -u tvbingo &>/dev/null; then
    useradd -r -s /bin/false tvbingo
fi
mkdir -p /opt/tvbingo/deploy
mkdir -p /opt/tvbingo/logs
chown -R tvbingo:tvbingo /opt/tvbingo

# ── Create .env placeholder ───────────────────────────────────────────────────
if [ ! -f /opt/tvbingo/.env ]; then
    cat > /opt/tvbingo/.env << 'ENVEOF'
# Database connection — fill in before first deploy.
# For local Postgres: run scripts/setup-postgres.sh, which writes these values.
# For external DB: set to your provider's JDBC URL and credentials.
TVBINGO_DB_URL=jdbc:postgresql://localhost:5432/tvbingo?currentSchema=tvbingo_schema
TVBINGO_DB_USERNAME=tvbingo
TVBINGO_DB_PASSWORD=
ENVEOF
    chown tvbingo:tvbingo /opt/tvbingo/.env
    chmod 600 /opt/tvbingo/.env
    echo "Created /opt/tvbingo/.env — edit or run setup-postgres.sh to populate it."
fi

# ── Allow tvbingo service restart without password ───────────────────────────
SUDOERS_FILE="/etc/sudoers.d/tvbingo-restart"
if [ ! -f "$SUDOERS_FILE" ]; then
    echo "%sudo ALL=(ALL) NOPASSWD: /bin/systemctl restart tvbingo, /bin/systemctl is-active tvbingo" > "$SUDOERS_FILE"
    chmod 440 "$SUDOERS_FILE"
fi

# ── Create systemd service ───────────────────────────────────────────────────
cat > /etc/systemd/system/tvbingo.service << 'EOF'
[Unit]
Description=TV Bingo App
After=network.target

[Service]
Type=simple
User=tvbingo
WorkingDirectory=/opt/tvbingo
EnvironmentFile=/opt/tvbingo/.env
ExecStart=/usr/bin/java \
    -Xmx256m \
    -jar /opt/tvbingo/tv-bingo-app.jar \
    --spring.profiles.active=prod \
    --spring.output.ansi.enabled=NEVER
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tvbingo

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tvbingo

# ── Install and configure nginx ───────────────────────────────────────────────
echo "Installing nginx..."
apt-get install -y nginx

# Rate-limit mutating API calls (POST/PUT/DELETE). Defined in the http context
# via conf.d so it is shared across server blocks. The map yields the client IP
# as the limit key for write methods and an empty string otherwise; nginx skips
# limiting when the key is empty, so GET/HEAD reads are never throttled.
# ~10 req/min per client IP curbs anonymous enumeration/mass-write abuse.
cat > /etc/nginx/conf.d/tvbingo-ratelimit.conf << 'RATEEOF'
map $request_method $tvbingo_write_key {
    default "";
    POST    $binary_remote_addr;
    PUT     $binary_remote_addr;
    PATCH   $binary_remote_addr;
    DELETE  $binary_remote_addr;
}
limit_req_zone $tvbingo_write_key zone=tvbingo_api_write:10m rate=10r/m;
RATEEOF

cat > /etc/nginx/sites-available/tvbingo << NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Security headers (applied to all responses on this vhost).
    # HSTS is intentionally omitted here; it is added on the TLS (443) block by
    # setup-certificate.sh / certbot, since it must only be sent over HTTPS.
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    # CSP for the same-origin Vite SPA. 'unsafe-inline' is required for Vue's
    # runtime style bindings; scripts are external ('self') so no script inline.
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;

    # API requests. limit_req is keyed via the request-method map in conf.d, so
    # only mutating methods (POST/PUT/DELETE) are throttled; GET/HEAD reads have
    # an empty key and pass through unthrottled.
    location /api/ {
        limit_req zone=tvbingo_api_write burst=5 nodelay;

        proxy_pass         http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }

    # SPA + everything else proxied to the Spring Boot app.
    location / {
        proxy_pass         http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/tvbingo /etc/nginx/sites-enabled/tvbingo
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Set up the database:"
echo "       Local Postgres:  bash scripts/setup-postgres.sh"
echo "       External DB:     edit /opt/tvbingo/.env"
echo "  2. Ensure your deploy SSH public key is in ~/.ssh/authorized_keys"
echo "  3. Add GitHub Secrets: DO_HOST, DO_USER, DO_SSH_KEY"
echo "  4. Trigger the 'Deploy to Digital Ocean' workflow in GitHub Actions"
echo "  5. Once DNS for ${DOMAIN} points here, run: bash scripts/setup-certificate.sh"
echo ""
echo "After first deploy, verify with:"
echo "  sudo systemctl status tvbingo"
echo "  journalctl -u tvbingo -f"
echo "  curl http://${DOMAIN}/actuator/health"
