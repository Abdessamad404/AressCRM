#!/bin/sh
set -e

echo "==> Running Laravel startup tasks..."

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    echo "==> Generating APP_KEY..."
    php artisan key:generate --force
fi

# Render's `host` property gives bare hostname — prepend https:// if needed
if [ -n "$APP_URL" ] && echo "$APP_URL" | grep -qv "^https\?://"; then
    export APP_URL="https://$APP_URL"
fi
if [ -n "$FRONTEND_URL" ] && echo "$FRONTEND_URL" | grep -qv "^https\?://"; then
    export FRONTEND_URL="https://$FRONTEND_URL"
fi

echo "==> APP_URL=$APP_URL"
echo "==> FRONTEND_URL=$FRONTEND_URL"

# Run migrations
echo "==> Running migrations..."
php artisan migrate --force

# Clear & rebuild caches for production
echo "==> Optimising..."
php artisan config:cache
php artisan route:cache

# Fix storage permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

echo "==> Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
