# Stage 1: Build
# Security: Pin to specific Node 22 (LTS) on Alpine Linux
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve (Unprivileged for security)
# Security: Pin to specific Nginx version (1.27 stable)
FROM nginxinc/nginx-unprivileged:1.27-alpine
# Copy build artifacts to the unprivileged web folder
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy our config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# We don't need to chown or create users;
# the base image handles this.
# By default, this image listens on port 8080.