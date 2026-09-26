# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# python3, make and g++ are required by node-gyp to compile better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
# Commit hash shown next to the version in the app header (set by CI)
ARG BUILD_SHA=""
ENV VITE_BUILD_SHA=$BUILD_SHA
RUN npm run build

# ── Stage 2: Install production dependencies (compiles native addons) ─────────
FROM node:22-alpine AS deps

WORKDIR /app

# python3, make and g++ are required by node-gyp to compile better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS serve

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
