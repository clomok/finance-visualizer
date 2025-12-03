# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve (Unprivileged for security)
FROM nginxinc/nginx-unprivileged:alpine
# Copy build artifacts to the unprivileged web folder
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy our config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# We don't need to chown or create users; the base image handles this.
# By default, this image listens on port 8080.