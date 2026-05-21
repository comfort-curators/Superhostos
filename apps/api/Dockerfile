FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.15.0

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all workspaces
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the API
RUN pnpm --filter=@superhostos/api build

# Build runtime image
FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.15.0

# Copy only necessary files from builder
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/db ./packages/db

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Set environment variables
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the application
CMD ["pnpm", "--filter=@superhostos/api", "start"]
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
