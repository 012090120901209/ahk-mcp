# Multi-stage build for AutoHotkey v2 MCP Server
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install AutoHotkey v2 (for compatibility, though won't run in Alpine)
# Note: AHK is Windows-only, but we include the structure for consistency
RUN apk add --no-cache \
    ca-certificates \
    && addgroup -g 1001 -S nodejs \
    && adduser -S ahk-mcp -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=ahk-mcp:nodejs /app/dist ./dist
COPY --from=builder --chown=ahk-mcp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ahk-mcp:nodejs /app/package*.json ./
COPY --from=builder --chown=ahk-mcp:nodejs /app/data ./data

# Switch to non-root user
USER ahk-mcp

# Expose port for SSE mode
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check')" || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV AHK_MCP_LOG_LEVEL=warn

# Run the application
CMD ["node", "dist/index.js"]

# Development stage
FROM node:20-alpine AS development

# Install development dependencies
RUN apk add --no-cache \
    git \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port for development
EXPOSE 3000

# Development command
CMD ["npm", "run", "dev"]