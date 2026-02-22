FROM node:20-alpine AS base
WORKDIR /app

# Install production dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --omit=dev && npm cache clean --force

# Build the app
FROM base AS builder
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci && npm cache clean --force
COPY backend/ ./backend/
RUN npm run build --workspace=backend

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/src ./src
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/drizzle ./drizzle

EXPOSE 3000

CMD ["node", "dist/index.js"]
