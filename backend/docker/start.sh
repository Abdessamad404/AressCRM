#!/bin/sh
set -e

echo "==> Running Laravel startup tasks..."

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    echo "==> Generating APP_KEY..."
    php artisan key:generate --force
fi

# Run migrations
echo "==> Running migrations..."
php artisan migrate --force

# Clear & rebuild caches for production
echo "==> Optimising..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Fix storage permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

echo "==> Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
