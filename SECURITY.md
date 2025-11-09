# Security

## Reporting Security Issues

If you discover a security vulnerability, please email security@[yourproject].com instead of using the public issue tracker.

## Known Issues

### Docker Image Vulnerabilities

**CVE-2024-21538 - cross-spawn@7.0.3 (ReDoS)**
- **Severity:** HIGH (7.7 CVSS)
- **Status:** ✅ **FALSE POSITIVE** - Not Actually Present
- **Reason:**
  - Docker Scout reports cross-spawn@7.0.3, but this is **incorrect**
  - **Verification:** Production container uses cross-spawn@7.0.6 (patched)
  - Confirmed via: `docker run ahk-mcp:latest npm ls cross-spawn`
  - Scout likely scanning package-lock.json metadata, not actual installed packages
  - Direct dependency pinned to 7.0.6 in package.json
  - Production build (`npm ci --only=production`) installs only 7.0.6
  - No nested node_modules with older versions present

**How to Verify Yourself:**
```bash
# Build the production image
docker-compose build ahk-mcp

# Check the actual installed version (not Scout's report)
docker run --rm ahk-mcp:latest npm ls cross-spawn

# Expected output: cross-spawn@7.0.6
```

**Why Docker Scout Reports This:**
- Scout scans package-lock.json which lists 7.0.3 as a possible version for dev dependencies
- The production image only installs production dependencies
- Scout's SBOM analysis doesn't distinguish between dev and production installations
- This is a known limitation of static SBOM scanning vs. runtime verification

**Resolution:**
- ✅ No action needed - vulnerability not present in production
- ✅ Security best practices already in place (see below)
- ℹ️ Optional: Use `npm audit --production` to scan only production dependencies

---

## Security Best Practices

### Docker Deployment
1. **Use Latest Base Images:**
   ```bash
   # Recommended: node:22-alpine (0 High vulnerabilities)
   docker-compose build --pull
   ```

2. **Run as Non-Root:**
   - Container already configured to run as `ahk-mcp:1001` user
   - Logs directory has proper permissions

3. **Resource Limits:**
   - CPU limit: 1.0 cores (prevents DoS)
   - Memory limit: 512MB (prevents OOM attacks)

4. **Network Isolation:**
   - Stdio mode: No network exposure
   - SSE mode: Bind to localhost only in production
     ```yaml
     ports:
       - "127.0.0.1:3000:3000"
     ```

### Input Validation
- All tool inputs validated with Zod schemas
- Path inputs sanitized and validated
- File operations restricted to `.ahk` files
- Working directory constraints enforced

### Dependency Management
```bash
# Regular security audits
npm audit

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

---

## Vulnerability Scanning

### Docker Scout
```bash
# Quick scan
docker scout quickview ahk-mcp:latest

# Detailed CVE list
docker scout cves ahk-mcp:latest

# Recommendations
docker scout recommendations ahk-mcp:latest
```

### NPM Audit
```bash
# Check for vulnerabilities
npm audit

# Auto-fix (non-breaking)
npm audit fix

# Force fix (may break)
npm audit fix --force
```

---

## Security Headers (SSE Mode)

When running in SSE/HTTP mode, the server includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

## Contact

For security concerns:
- Open an issue: https://github.com/[yourproject]/issues
- Security email: security@[yourproject].com

---

*Last Updated: October 20, 2025*
