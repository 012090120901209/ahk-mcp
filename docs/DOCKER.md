# Docker Setup for AHK MCP Server

This document explains how to run the AutoHotkey v2 MCP Server using Docker.

## Prerequisites

- Docker installed and running (version 20.10+)
- Docker Compose (version 1.29+ or included with Docker Desktop)
- At least 1GB of free disk space for images

## Important Note

**AutoHotkey v2 is Windows-only and cannot execute scripts inside the Docker
container.** This Docker setup provides:

- The MCP server running in Node.js
- Access to the MCP protocol via stdio or SSE (HTTP)
- All analysis, documentation, and orchestration tools
- **Script execution requires a Windows host with AutoHotkey v2 installed**

## Quick Start

### 1. Build and Run (Default - stdio mode)

```bash
# Build the image
docker-compose build ahk-mcp

# Run the server (stdio mode - for MCP clients)
docker-compose up ahk-mcp

# Or run in detached mode
docker-compose up -d ahk-mcp
```

### 2. Run with SSE/HTTP Mode

```bash
# Build and run with SSE mode (HTTP accessible)
docker-compose --profile sse up -d sse

# Server will be available at http://localhost:3000
```

### 3. Development Mode

```bash
# Run in development mode with hot reload
docker-compose --profile dev up dev

# Development server on http://localhost:3001
```

## Available Services

### `ahk-mcp` (Default)

- **Mode**: stdio (standard MCP protocol)
- **Usage**: For MCP clients that connect via stdin/stdout
- **Ports**: None exposed
- **Command**: `node dist/index.js`

### `sse` (Profile: sse)

- **Mode**: SSE/HTTP
- **Usage**: For HTTP-based MCP clients or web access
- **Ports**: 3000:3000
- **Command**: `node dist/index.js --sse`
- **Health Check**: Available

### `dev` (Profile: dev)

- **Mode**: Development with hot reload
- **Usage**: For development and testing
- **Ports**: 3001:3000
- **Volumes**: Source code mounted for live updates

## Environment Variables

### Quick Setup with .env File

```bash
# Copy the example environment file
cp .env.docker.example .env

# Edit the values as needed
nano .env
```

### Available Environment Variables

```bash
# Server Ports
SSE_PORT=3000               # SSE mode HTTP port (default: 3000)
DEV_PORT=3001               # Development mode port (default: 3001)

# Logging
AHK_MCP_LOG_LEVEL=info      # debug | info | warn | error (default: info)

# Node.js Settings
NODE_ENV=production         # production | development
NODE_OPTIONS=--max-old-space-size=512  # Node.js heap size limit
```

### Docker Compose Override

You can also set environment variables directly in docker-compose:

```yaml
environment:
  - NODE_ENV=production
  - AHK_MCP_LOG_LEVEL=info
  - PORT=3000
```

## Docker Commands

### Build

```bash
# Build production image
docker-compose build ahk-mcp

# Build development image
docker-compose build dev

# Build with no cache
docker-compose build --no-cache ahk-mcp
```

### Run

```bash
# Start server (stdio mode)
docker-compose up ahk-mcp

# Start server (SSE mode)
docker-compose --profile sse up sse

# Start in background
docker-compose up -d ahk-mcp

# View logs
docker-compose logs -f ahk-mcp

# Stop server
docker-compose down
```

### Interact with Running Container

```bash
# Execute commands in running container
docker exec -it ahk-mcp sh

# View logs
docker logs ahk-mcp

# Restart server
docker-compose restart ahk-mcp
```

## Volume Mounts

### Production

- `ahk-mcp-logs:/app/logs` - Persistent log storage

### Development

- `.:/app` - Source code (live reload)
- `/app/node_modules` - Isolated node_modules

## Connecting MCP Clients

### stdio Mode (Default)

```bash
# Connect via docker exec
docker exec -i ahk-mcp node dist/index.js
```

### SSE Mode (HTTP)

```bash
# Test connection
curl http://localhost:3000/health

# Connect MCP client to:
# http://localhost:3000
```

## Troubleshooting

### Build Fails

```bash
# Clear build cache and rebuild
docker-compose build --no-cache ahk-mcp

# Remove old images and volumes
docker-compose down --rmi all -v

# Clean up dangling images
docker image prune -f

# Rebuild from scratch
docker-compose build
```

### Build Verification Error

If you see "Build failed - dist/index.js not found":

```bash
# Ensure TypeScript compiles locally first
npm run build

# Check if dist/index.js exists
ls -la dist/index.js

# Then try Docker build again
docker-compose build --no-cache
```

### Container Won't Start

```bash
# Check logs
docker-compose logs ahk-mcp

# Check container status
docker ps -a

# Restart container
docker-compose restart ahk-mcp
```

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

## Production Deployment

For production deployment:

1. **Configure environment:**

   ```bash
   cp .env.docker.example .env
   # Edit .env with your settings
   ```

2. **Build the image:**

   ```bash
   docker-compose build ahk-mcp
   ```

3. **Run with restart policy:**

   ```bash
   docker-compose up -d ahk-mcp
   ```

4. **Monitor logs:**

   ```bash
   docker-compose logs -f ahk-mcp
   ```

5. **Health checks** (SSE mode only):
   - Health endpoint: `http://localhost:3000/health`
   - Automatic health checks configured
   - Checks run every 30s with 3 retries

### Resource Limits

The production container has sensible defaults:

- **CPU Limit**: 1.0 cores (100% of one CPU)
- **Memory Limit**: 512MB
- **CPU Reservation**: 0.25 cores (25% guaranteed)
- **Memory Reservation**: 128MB (guaranteed)

To override, edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
```

## Limitations

1. **No Script Execution**: AutoHotkey scripts cannot run inside the container
   (Windows-only)
2. **File Access**: Limited to files inside the container (use volumes for
   access)
3. **Windows Features**: No access to Windows-specific AutoHotkey features

## Use Cases

### ✅ What Works in Docker:

- MCP protocol server (stdio/SSE)
- Code analysis and parsing
- Documentation search
- Tool orchestration
- LSP-like features
- File viewing and editing

### ❌ What Doesn't Work:

- Running AutoHotkey scripts
- Window detection
- GUI interactions
- Windows-specific features

## Next Steps

- See `README.md` for general usage
- See `CLAUDE.md` for Claude Code integration
- See `.mcp.json` for MCP configuration

## Support

For issues with Docker setup, check:

1. Docker logs: `docker-compose logs`
2. Build output: `docker-compose build --no-cache`
3. Container status: `docker ps -a`
