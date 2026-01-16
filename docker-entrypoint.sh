#!/bin/sh
set -e

# Validate required environment variables
if [ -z "$VITE_API_URL" ]; then
    echo "ERROR: VITE_API_URL environment variable is not set!"
    exit 1
fi

# Replace placeholders in config.js with actual environment variables
sed -i "s|__API_URL__|${VITE_API_URL}|g" /usr/share/nginx/html/config.js
sed -i "s|__APP_NAME__|${VITE_APP_NAME:-ISP Billing System}|g" /usr/share/nginx/html/config.js
sed -i "s|__APP_VERSION__|${VITE_APP_VERSION:-1.0.0}|g" /usr/share/nginx/html/config.js

echo "Runtime configuration applied:"
cat /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'
