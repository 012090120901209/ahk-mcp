# Security Investigation Summary - CVE-2024-21538

**Date:** October 20, 2025 **Status:** ✅ **RESOLVED** - False Positive
Confirmed **Vulnerability:** CVE-2024-21538 (cross-spawn ReDoS) **Actual Risk:**
**NONE** - Vulnerability not present in production

---

## Executive Summary

Docker Scout reported a HIGH severity vulnerability (CVE-2024-21538) in
cross-spawn@7.0.3. After thorough investigation, we determined this is a **false
positive**. The production Docker image contains **cross-spawn@7.0.6** (patched
version), not the vulnerable 7.0.3.

**Key Finding:** Docker Scout's SBOM scanner reports vulnerabilities based on
package-lock.json metadata, which includes dev dependencies. The actual
production installation is secure.

---

## Investigation Process

### 1. Initial Report

- **Source:** Docker Scout scan of `ahk-mcp:latest`
- **Report:** 1 HIGH vulnerability - CVE-2024-21538 in cross-spawn@7.0.3
- **CVSS Score:** 7.7 (HIGH)
- **Type:** ReDoS (Regular Expression Denial of Service)

### 2. Dependency Analysis

#### Local Environment

```bash
$ npm ls cross-spawn --all
ahk-server-v2@2.0.0
├─┬ cross-env@10.0.0
│ └── cross-spawn@7.0.6 deduped
├── cross-spawn@7.0.6
├─┬ eslint@8.56.0
│ └── cross-spawn@7.0.6 deduped
└─┬ rimraf@5.0.5
  └─┬ glob@10.4.5
    └─┬ foreground-child@3.3.1
      └── cross-spawn@7.0.6 deduped
```

✅ All instances deduped to 7.0.6

#### Production Dependencies Only

```bash
$ npm ls cross-spawn --production
ahk-server-v2@2.0.0
└── cross-spawn@7.0.6
```

✅ Only 7.0.6 present

#### NPM Audit (Production)

```bash
$ npm audit --production
found 0 vulnerabilities
```

✅ No vulnerabilities in production deps

### 3. Docker Container Verification

#### Installed Version

```bash
$ docker run --rm ahk-mcp:latest npm ls cross-spawn
ahk-server-v2@2.0.0 /app
└── cross-spawn@7.0.6
```

✅ Container has 7.0.6 installed

#### Package.json Verification

```bash
$ docker run --rm ahk-mcp:latest cat node_modules/cross-spawn/package.json | grep version
  "version": "7.0.6",
```

✅ Confirmed 7.0.6 in container

#### No Nested Dependencies

```bash
$ docker run --rm ahk-mcp:latest find node_modules -name "cross-spawn" -type d
node_modules/cross-spawn
```

✅ Only one cross-spawn directory (no nested older versions)

### 4. Root Cause Analysis

#### Why Docker Scout Reports 7.0.3

**package-lock.json** contains entries for dev dependencies:

```json
"node_modules/execa": {
  "version": "5.1.1",
  "dev": true,
  "dependencies": {
    "cross-spawn": "^7.0.3",  // <-- Scout sees this
    ...
  }
}
```

**What Actually Happens:**

1. **Builder stage** (`npm ci`): Installs all dependencies including dev
   - npm deduplicates cross-spawn to 7.0.6 (highest version)
2. **Production stage** (`npm ci --only=production`): Installs only production
   deps
   - Only cross-spawn@7.0.6 installed (direct dependency)
   - execa not installed (dev dependency)
3. **Docker Scout**: Scans package-lock.json metadata
   - Sees `"cross-spawn": "^7.0.3"` in execa's dependencies
   - Reports 7.0.3 as present (incorrect)
   - Doesn't verify actual installed packages

**Scout Limitation:** SBOM static analysis doesn't distinguish between:

- Dev dependencies (not in production image)
- Actual installed versions (deduplicated by npm)
- Package-lock.json metadata vs. runtime reality

---

## Evidence Summary

| Check                  | Method                                      | Result            | Status            |
| ---------------------- | ------------------------------------------- | ----------------- | ----------------- |
| Local npm              | `npm ls cross-spawn --all`                  | 7.0.6 deduped     | ✅ Clean          |
| Production deps        | `npm ls cross-spawn --production`           | 7.0.6 only        | ✅ Clean          |
| NPM audit              | `npm audit --production`                    | 0 vulnerabilities | ✅ Clean          |
| Docker container       | `docker run ... npm ls cross-spawn`         | 7.0.6 installed   | ✅ Clean          |
| Container package.json | `cat node_modules/cross-spawn/package.json` | version 7.0.6     | ✅ Clean          |
| Nested modules         | `find node_modules -name cross-spawn`       | 1 directory only  | ✅ Clean          |
| Docker Scout           | `docker scout cves`                         | Reports 7.0.3     | ❌ False Positive |

---

## Mitigation (Defense in Depth)

Even though the vulnerability is not present, the following security measures
are in place:

### Input Validation

- ✅ All tool inputs validated with Zod schemas
- ✅ Path inputs sanitized before use
- ✅ File operations restricted to `.ahk` extensions
- ✅ Working directory constraints enforced

### Resource Limits (Docker)

- ✅ CPU limit: 1.0 cores (prevents CPU exhaustion)
- ✅ Memory limit: 512MB (prevents OOM attacks)
- ✅ Non-root user: `ahk-mcp:1001`
- ✅ Tini init system for proper signal handling

### Network Security

- ✅ Stdio mode: No network exposure by default
- ✅ SSE mode: Can bind to localhost only
- ✅ Security headers configured (X-Content-Type-Options, X-Frame-Options, etc.)

### Deployment Best Practices

- ✅ Run behind firewall in production
- ✅ Regular security updates via automated builds
- ✅ Multi-stage Docker builds (minimal production image)

---

## Conclusions

### Primary Conclusion

**The reported CVE-2024-21538 vulnerability is NOT present in the production
Docker image.** This is a false positive caused by Docker Scout's SBOM analysis
scanning package-lock.json metadata without verifying actual installed packages.

### Verification Steps for Future

When Docker Scout reports vulnerabilities, verify with:

```bash
# 1. Check what's actually installed in the container
docker run --rm <image> npm ls <package>

# 2. Verify package version in container
docker run --rm <image> cat node_modules/<package>/package.json | grep version

# 3. Check production-only audit
npm audit --production

# 4. Look for nested installations
docker run --rm <image> find node_modules -name "<package>" -type d
```

### Recommendations

#### Immediate (All Complete)

- [x] ✅ Verify vulnerability not present in production
- [x] ✅ Document findings in SECURITY.md
- [x] ✅ Ensure direct dependency pinned to patched version
- [x] ✅ Confirm npm audit --production shows 0 vulnerabilities

#### Optional Future Actions

- [ ] Consider upgrading Docker Scout to version with better dev/prod
      distinction
- [ ] Add automated security testing in CI/CD:
  - Runtime verification: `docker run <image> npm audit --production`
  - Compare Scout reports with actual container contents
- [ ] Document this pattern for investigating future Scout reports
- [ ] Consider alternative scanners (Trivy, Grype, Snyk) for comparison

---

## Technical Details

### CVE-2024-21538 Overview

- **Package:** cross-spawn
- **Affected Versions:** >=7.0.0, <7.0.5
- **Fixed Version:** 7.0.5+
- **Type:** CWE-1333 - Inefficient Regular Expression Complexity (ReDoS)
- **Attack Vector:** Network (AV:N)
- **Complexity:** Low (AC:L)
- **Privileges:** None (PR:N)
- **Impact:** Availability (VA:H)

### Why This Doesn't Affect Us (Even If Present)

1. **Input Validation:** All inputs validated before reaching cross-spawn
2. **Controlled Environment:** Server runs in known, controlled contexts
3. **Resource Limits:** Docker prevents resource exhaustion
4. **Not Present:** Most importantly, we use the patched version

---

## Files Modified

### Updated Documentation

- `SECURITY.md` - Updated CVE status to "FALSE POSITIVE"
- `docs/SECURITY_INVESTIGATION_SUMMARY.md` - This document

### Key Changes to SECURITY.md

```markdown
**CVE-2024-21538 - cross-spawn@7.0.3 (ReDoS)**

- Status: ✅ **FALSE POSITIVE** - Not Actually Present
- Verification: Production container uses cross-spawn@7.0.6
- Confirmed via: docker run ahk-mcp:latest npm ls cross-spawn
```

---

## Related Documentation

- [SECURITY.md](../SECURITY.md) - Security policies and known issues
- [DOCKER_SETUP_SUMMARY.md](./DOCKER_SETUP_SUMMARY.md) - Docker optimization
  details
- [VALIDATION_MIGRATION_COMPLETE.md](./VALIDATION_MIGRATION_COMPLETE.md) - Input
  validation implementation

---

## Lessons Learned

### Docker Scout Limitations

1. **SBOM Scanning:** Analyzes package-lock.json metadata, not installed
   packages
2. **Dev vs. Production:** Doesn't distinguish between dev and production
   dependencies
3. **npm Deduplication:** Doesn't account for npm's version deduplication
4. **False Positives:** Static analysis can report vulnerabilities that aren't
   present

### Best Practices

1. **Always Verify:** Don't trust scanner reports blindly
2. **Runtime Checks:** Verify actual installed versions in containers
3. **Audit Production:** Use `npm audit --production` for accurate results
4. **Defense in Depth:** Implement security layers even when vulnerabilities are
   absent

### Investigation Methodology

1. Check local dependency tree
2. Check production-only dependencies
3. Verify installed packages in container
4. Inspect package.json versions directly
5. Look for nested node_modules
6. Understand scanner methodology
7. Document findings for future reference

---

## Summary for Stakeholders

**Question:** Is the HIGH vulnerability in our Docker image a security risk?

**Answer:** **No.** The vulnerability (CVE-2024-21538) is not actually present
in our production Docker image. Docker Scout reports it based on dev dependency
metadata in package-lock.json, but the production container uses the patched
version (cross-spawn@7.0.6).

**Proof:** Runtime verification confirms 7.0.6 is installed, and
`npm audit --production` shows 0 vulnerabilities.

**Action Required:** None. The production deployment is secure.

**Monitoring:** Continue regular security scans, but verify scanner reports
against actual container contents.

---

_Last Updated: October 20, 2025_ _Investigation Status: ✅ Complete_ _Production
Security Status: ✅ Secure (0 vulnerabilities)_ _Docker Scout Report: ❌ False
Positive_
