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

# Seed demo users and ensure passwords + lead fields are correct (idempotent)
echo "==> Checking seed state..."
php artisan tinker --execute="
\$admin = \App\Models\User::where('email', 'admin@aress.com')->first();
if (!\$admin) {
    \Artisan::call('db:seed', ['--class' => 'UserSeeder', '--force' => true]);
    echo 'Seeded fresh.';
} else {
    // Fix double-hashed passwords
    \App\Models\User::whereIn('email', [
        'admin@aress.com',
        'sarah@aress.com', 'mike@aress.com', 'emma@aress.com', 'james@aress.com', 'olivia@aress.com',
        'hr@technova.com', 'jobs@nexusconsult.io', 'talent@brightventures.co', 'recrutement@atlasgroup.fr',
        'karim.b@mail.com', 'leila.f@mail.com', 'yassine.o@mail.com', 'camille.d@mail.com', 'adrien.m@mail.com', 'nadia.c@mail.com',
    ])->update(['password' => \Illuminate\Support\Facades\Hash::make('password')]);

    // Back-fill lead fields on existing entreprise clients
    foreach ([
        ['email' => 'hr@technova.com',          'company' => 'TechNova',          'phone' => '+1-555-0201',  'source' => 'LinkedIn',  'lead_status' => 'New'],
        ['email' => 'jobs@nexusconsult.io',      'company' => 'Nexus Consulting',  'phone' => '+1-555-0202',  'source' => 'Referral',  'lead_status' => 'Contacted'],
        ['email' => 'talent@brightventures.co',  'company' => 'Bright Ventures',   'phone' => '+1-555-0203',  'source' => 'Cold call', 'lead_status' => 'Interested'],
        ['email' => 'recrutement@atlasgroup.fr', 'company' => 'Atlas Group',       'phone' => '+33-555-0204', 'source' => 'Website',   'lead_status' => 'Negotiation'],
        ['email' => 'karim.b@mail.com',          'company' => 'Freelance',         'phone' => '+213-555-0301','source' => 'Cold call', 'lead_status' => 'Contacted'],
        ['email' => 'leila.f@mail.com',          'company' => 'Self-employed',     'phone' => '+213-555-0302','source' => 'Website',   'lead_status' => 'Interested'],
        ['email' => 'yassine.o@mail.com',        'company' => 'DevStudio',         'phone' => '+212-555-0303','source' => 'Other',     'lead_status' => 'Negotiation'],
        ['email' => 'camille.d@mail.com',        'company' => 'Agence Dupont',     'phone' => '+33-555-0304', 'source' => 'LinkedIn',  'lead_status' => 'Won'],
        ['email' => 'adrien.m@mail.com',         'company' => 'Moreau & Partners', 'phone' => '+33-555-0305', 'source' => 'Referral',  'lead_status' => 'Lost'],
        ['email' => 'nadia.c@mail.com',          'company' => 'NC Consulting',     'phone' => '+212-555-0306','source' => 'Cold call', 'lead_status' => 'New'],
    ] as \$row) {
        \$e = \$row['email']; unset(\$row['email']);
        \App\Models\User::where('email', \$e)->update(\$row);
    }
    echo 'Passwords fixed + lead fields back-filled.';
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
