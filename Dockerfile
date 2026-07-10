# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Install production dependencies (compiles native addons) ─────────
FROM node:20-alpine AS deps

WORKDIR /app

# python3, make and g++ are required by node-gyp to compile better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS serve

WORKDIR /app

# Copy pre-compiled production node_modules (includes better-sqlite3 binary)
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend and server source
COPY --from=build /app/dist ./dist
COPY server ./server

ENV NODE_ENV=production
ENV PORT=3000

# Create the data directory that will be mounted as a volume for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server/index.js"]
