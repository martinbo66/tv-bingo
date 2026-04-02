#!/bin/bash
# Sets up a local PostgreSQL instance for the TV Bingo App.
# Run as root on the droplet AFTER setup-droplet.sh: bash setup-postgres.sh
#
# What this script does:
#   - Installs PostgreSQL
#   - Creates the 'tvbingo' role and database with the tvbingo_schema schema
#   - Generates a random password and writes it to /opt/tvbingo/.env
#   - Updates the systemd service to depend on postgresql.service

set -e

echo "=== TV Bingo App - PostgreSQL Setup ==="

# ── Install PostgreSQL ────────────────────────────────────────────────────────
echo "Installing PostgreSQL..."
apt-get update -q
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# ── Create DB role, database, and schema ──────────────────────────────────────
echo "Creating tvbingo role, database, and schema..."
DB_PASSWORD=$(openssl rand -base64 24)

sudo -u postgres psql << SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tvbingo') THEN
    CREATE ROLE tvbingo LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE tvbingo PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE tvbingo OWNER tvbingo'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tvbingo')\gexec

\c tvbingo
CREATE SCHEMA IF NOT EXISTS tvbingo_schema AUTHORIZATION tvbingo;
SQL

echo "Database ready."

# ── Write credentials to .env ─────────────────────────────────────────────────
ENV_FILE=/opt/tvbingo/.env
cat > "$ENV_FILE" << ENVEOF
TVBINGO_DB_URL=jdbc:postgresql://localhost:5432/tvbingo?currentSchema=tvbingo_schema
TVBINGO_DB_USERNAME=tvbingo
TVBINGO_DB_PASSWORD=${DB_PASSWORD}
ENVEOF
chown tvbingo:tvbingo "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "Credentials written to $ENV_FILE"

# ── Update systemd service to require PostgreSQL ──────────────────────────────
# Patches the [Unit] section so the app waits for Postgres on every boot.
SERVICE=/etc/systemd/system/tvbingo.service
if grep -q "After=network.target$" "$SERVICE"; then
    sed -i 's/After=network.target$/After=network.target postgresql.service\nRequires=postgresql.service/' "$SERVICE"
    systemctl daemon-reload
    echo "systemd service updated to depend on postgresql.service"
fi

echo ""
echo "=== PostgreSQL setup complete ==="
echo ""
echo "Generated DB password (already saved to $ENV_FILE):"
echo "  ${DB_PASSWORD}"
echo ""
echo "Connect from your Mac via SSH tunnel:"
echo "  ssh -L 5432:localhost:5432 root@<droplet-ip>"
echo "  Then point your DB client at: localhost:5432 / tvbingo / <password above>"
echo ""
echo "Restart the app to pick up the new credentials:"
echo "  systemctl restart tvbingo"
echo "  journalctl -u tvbingo -f"
