# ── Stage 1: Composer dependencies ───────────────────────────────────────────
FROM composer:2.8 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# ── Stage 2: Final image ──────────────────────────────────────────────────────
FROM php:8.2-fpm-alpine

# Install system dependencies + PHP extensions
RUN apk add --no-cache \
        nginx \
        supervisor \
        libpng-dev \
        libzip-dev \
        libpq-dev \
        zip \
        unzip \
        curl \
        oniguruma-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        zip \
        gd \
        opcache

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy supervisord config
COPY docker/supervisord.conf /etc/supervisord.conf

# Copy opcache config
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /var/www/html

# Copy vendor from stage 1
COPY --from=vendor /app/vendor ./vendor

# Copy application files
COPY . .

# Raise PHP upload limits (default alpine PHP is 2M/8M — too low for profile photos)
RUN printf "upload_max_filesize=10M\npost_max_size=20M\nmemory_limit=256M\n" \
    > /usr/local/etc/php/conf.d/uploads.ini

# Set up storage + bootstrap cache
# Include public upload dirs so storage:link below has a valid target (not a dangling symlink)
RUN mkdir -p storage/framework/{sessions,views,cache} \
             storage/logs \
             storage/app/public/avatars \
             storage/app/public/logos \
             storage/app/public/temp \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Create storage symlink in public (target storage/app/public now exists at build time)
RUN php artisan storage:link --no-interaction 2>/dev/null || true

EXPOSE 10000

# Copy and make startup script executable
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
