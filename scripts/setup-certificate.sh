#!/bin/bash
# Provisions a free TLS certificate via Let's Encrypt and configures nginx
# to serve the app over HTTPS with automatic HTTP→HTTPS redirect.
#
# Prerequisites:
#   - setup-droplet.sh has been run (nginx is installed and configured)
#   - DNS A record for $DOMAIN points to this droplet's IP
#   - Port 80 is reachable from the internet (required for ACME challenge)
#
# Run as root: DOMAIN=yourdomain.com bash setup-certificate.sh

set -e

if [ -z "$DOMAIN" ]; then
    echo "Usage: DOMAIN=yourdomain.com bash setup-certificate.sh"
    exit 1
fi

echo "=== TV Bingo App - TLS Certificate Setup ==="
echo "Domain: ${DOMAIN}"

# ── Verify DNS resolves to this machine ──────────────────────────────────────
echo "Checking DNS..."
DROPLET_IP=$(curl -s ifconfig.me)
RESOLVED_IP=$(getent hosts "$DOMAIN" | awk '{ print $1 }' | head -1)

if [ "$RESOLVED_IP" != "$DROPLET_IP" ]; then
    echo ""
    echo "WARNING: ${DOMAIN} resolves to ${RESOLVED_IP:-<not found>}"
    echo "         but this droplet's IP is ${DROPLET_IP}"
    echo ""
    echo "DNS has not propagated yet, or the A record is wrong."
    echo "Re-run this script once DNS is correct."
    exit 1
fi
echo "DNS OK: ${DOMAIN} → ${DROPLET_IP}"

# ── Install certbot ───────────────────────────────────────────────────────────
echo "Installing certbot..."
apt-get update -q
apt-get install -y certbot python3-certbot-nginx

# ── Obtain certificate and update nginx config ────────────────────────────────
echo "Requesting certificate for ${DOMAIN}..."
certbot --nginx \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    -d "$DOMAIN"

# ── Verify auto-renewal ───────────────────────────────────────────────────────
echo "Testing auto-renewal..."
certbot renew --dry-run

echo ""
echo "=== TLS setup complete ==="
echo ""
echo "The app is now available at:"
echo "  https://${DOMAIN}"
echo "  http://${DOMAIN}  (redirects to HTTPS automatically)"
echo ""
echo "Certificate auto-renews via a certbot systemd timer."
echo "Check renewal status with:"
echo "  systemctl status certbot.timer"
echo "  certbot certificates"
