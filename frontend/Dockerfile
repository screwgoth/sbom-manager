FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci && npm cache clean --force

# Build the app
FROM base AS builder
COPY package.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# Production image with nginx
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
