#!/bin/bash
# Sets up automated daily PostgreSQL backups for the tvbingo database.
# Run as root on the droplet: bash setup-backups.sh
#
# Backups are written to /opt/tvbingo/backups/ and retained for 7 days.
# To restore: gunzip -c <file>.sql.gz | psql -U tvbingo tvbingo

set -e

BACKUP_DIR=/opt/tvbingo/backups
CRON_FILE=/etc/cron.d/tvbingo-backup

echo "=== TV Bingo App - Backup Setup ==="

# ── Create backup directory ───────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
chown tvbingo:tvbingo "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"

# ── Install cron job ──────────────────────────────────────────────────────────
cat > "$CRON_FILE" << 'EOF'
# Daily PostgreSQL backup at 02:00, retained for 7 days
0 2 * * * tvbingo pg_dump -U tvbingo tvbingo | gzip > /opt/tvbingo/backups/tvbingo-$(date +\%Y\%m\%d).sql.gz && find /opt/tvbingo/backups -name "*.sql.gz" -mtime +7 -delete
EOF
chmod 644 "$CRON_FILE"

# ── Run an immediate backup to verify it works ────────────────────────────────
echo "Running initial backup to verify..."
sudo -u tvbingo bash -c \
    'pg_dump -U tvbingo tvbingo | gzip > /opt/tvbingo/backups/tvbingo-$(date +%Y%m%d)-initial.sql.gz'

echo ""
echo "=== Backup setup complete ==="
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Schedule:        daily at 02:00, 7-day retention"
echo ""
echo "Files:"
ls -lh "$BACKUP_DIR"
echo ""
echo "To restore a backup:"
echo "  gunzip -c $BACKUP_DIR/<file>.sql.gz | psql -U tvbingo tvbingo"
