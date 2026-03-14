# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Build the application + compile scrapers + custom server
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build Next.js standalone output
RUN npm run build
# Compile scraper/transform/validator scripts to JS for production use
RUN npx tsc --project tsconfig.scripts.json --outDir dist/scripts
# Compile custom server entrypoint (wraps Next.js + cron scheduler)
RUN npx tsc custom-server.ts --esModuleInterop --module commonjs --target ES2022 --skipLibCheck --outDir dist

# Stage 3: Production runner (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Python runtime for MCP suggestion bridge
RUN apk add --no-cache python3

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy compiled scraper scripts for auto-update pipeline
COPY --from=builder --chown=nextjs:nodejs /app/dist/scripts ./dist/scripts

# Copy compiled custom server entrypoint
COPY --from=builder --chown=nextjs:nodejs /app/dist/custom-server.js ./custom-server.js

# Copy seed data as fallback (will be copied to volume on first start)
COPY --from=builder --chown=nextjs:nodejs /app/src/data ./src/data

# Install node-cron in production image (needed by custom server)
COPY --from=builder /app/node_modules/node-cron ./node_modules/node-cron

# Create writable directories for data volume and scraper working files
RUN mkdir -p /app/data /app/raw && chown nextjs:nodejs /app/data /app/raw

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Use compiled custom server that wraps Next.js + cron scheduler
CMD ["node", "custom-server.js"]
