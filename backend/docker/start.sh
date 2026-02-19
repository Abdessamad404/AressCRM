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

# Seed demo users and ensure passwords are correctly hashed (idempotent)
echo "==> Checking seed state..."
php artisan tinker --execute="
\$admin = \App\Models\User::where('email', 'admin@aress.com')->first();
if (!\$admin) {
    \Artisan::call('db:seed', ['--class' => 'UserSeeder', '--force' => true]);
    echo 'Seeded fresh.';
} else {
    // Fix double-hashed passwords: reset all seeded users to correct hash
    \App\Models\User::whereIn('email', [
        'admin@aress.com',
        'sarah@aress.com', 'mike@aress.com', 'emma@aress.com', 'james@aress.com', 'olivia@aress.com',
        'hr@technova.com', 'jobs@nexusconsult.io', 'talent@brightventures.co', 'recrutement@atlasgroup.fr',
        'karim.b@mail.com', 'leila.f@mail.com', 'yassine.o@mail.com', 'camille.d@mail.com', 'adrien.m@mail.com', 'nadia.c@mail.com',
    ])->update(['password' => \Illuminate\Support\Facades\Hash::make('password')]);
    echo 'Passwords fixed.';
}
"

# Clear & rebuild caches for production
echo "==> Optimising..."
php artisan config:cache
php artisan route:cache

# Fix storage permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

echo "==> Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
