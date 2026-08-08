# Stage 1: Build frontend & install dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-co-cache python3 make g++ gcc

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production runner image
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies for SQLite
RUN apk add --no-co-cache python3 make g++ gcc

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/killer.db

COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Create directory for persistent SQLite database
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "server/index.js"]
