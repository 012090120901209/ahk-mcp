# Multi-stage build for AutoHotkey v2 MCP Server
# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first (better layer caching)
COPY package*.json ./
COPY tsconfig*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci --prefer-offline --no-audit && npm cache clean --force

# Copy source code
COPY src ./src
COPY data ./data
COPY docs ./docs

# Build the project
RUN npm run build

# Verify build output
RUN ls -la dist/ && test -f dist/index.js || (echo "Build failed - dist/index.js not found" && exit 1)

# Stage 2: Production
FROM node:20-alpine AS production

# Install system dependencies
# Note: AHK is Windows-only, this container provides the Node.js MCP server only
RUN apk add --no-cache \
    ca-certificates \
    wget \
    curl \
    tini \
    && addgroup -g 1001 -S nodejs \
    && adduser -S ahk-mcp -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=ahk-mcp:nodejs package*.json ./

# Install only production dependencies
RUN npm ci --only=production --prefer-offline --no-audit && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=ahk-mcp:nodejs /app/dist ./dist
COPY --from=builder --chown=ahk-mcp:nodejs /app/data ./data
COPY --from=builder --chown=ahk-mcp:nodejs /app/docs ./docs

# Create logs directory
RUN mkdir -p /app/logs && chown ahk-mcp:nodejs /app/logs

# Switch to non-root user
USER ahk-mcp

# Expose port for SSE mode
EXPOSE 3000

# Health check (basic - SSE mode has better check in docker-compose)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Set environment variables
ENV NODE_ENV=production \
    AHK_MCP_LOG_LEVEL=warn \
    NODE_OPTIONS="--max-old-space-size=512"

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run the application
CMD ["node", "dist/index.js"]

# Stage 3: Development
FROM node:20-alpine AS development

# Install development dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    vim \
    tini

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies including dev dependencies
RUN npm install --prefer-offline

# Copy source code
COPY . .

# Expose port for development
EXPOSE 3000

# Set environment
ENV NODE_ENV=development \
    AHK_MCP_LOG_LEVEL=debug

# Use tini for proper signal handlingIs thiu
ENTRYPOINT ["/sbin/tini", "--"]

# Development command (with file watching)
CMD ["npm", "run", "dev"]
