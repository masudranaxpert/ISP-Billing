# Stage 1: Build Vite app
FROM node:22-slim AS builder

WORKDIR /app

# Cache dependencies
COPY package*.json vite.config.* tsconfig.* ./
RUN npm ci

# Copy source + build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Remove default files
RUN rm -rf /usr/share/nginx/html/*

# Copy built dist folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config for SPA (routing fix)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script for runtime config injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Use entrypoint to inject runtime config
ENTRYPOINT ["/docker-entrypoint.sh"]