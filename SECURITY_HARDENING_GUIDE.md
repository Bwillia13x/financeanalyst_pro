# 🔒 Security Hardening Guide

## Executive Summary

This comprehensive guide provides security hardening measures for the FinanceAnalyst Pro system. It covers infrastructure security, application security, data protection, and compliance requirements to ensure enterprise-grade security for production deployments.

---

## 📋 Table of Contents

1. [Infrastructure Security](#infrastructure-security)
2. [Application Security](#application-security)
3. [Data Protection](#data-protection)
4. [Network Security](#network-security)
5. [Access Control](#access-control)
6. [Compliance & Auditing](#compliance--auditing)
7. [Incident Response](#incident-response)
8. [Security Monitoring](#security-monitoring)

---

## 🏗️ Infrastructure Security

### 1. Server Hardening

#### **Operating System Hardening**
```bash
#!/bin/bash
# Server Hardening Script

# Update system packages
apt update && apt upgrade -y

# Install security packages
apt install -y ufw fail2ban unattended-upgrades auditd

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 443
ufw --force enable

# Disable unnecessary services
systemctl disable avahi-daemon
systemctl disable cups
systemctl disable bluetooth

# Configure automatic security updates
cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
  "\${distro_id}:\${distro_codename}-security";
};
Unattended-Upgrade::Package-Blacklist {
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::InstallOnShutdown "false";
Unattended-Upgrade::Mail "security@yourdomain.com";
Unattended-Upgrade::MailOnlyOnError "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
EOF

# Kernel hardening
cat >> /etc/sysctl.conf << EOF
# Network security
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0

# Disable source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# ICMP security
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# TCP security
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Memory protection
kernel.randomize_va_space = 2
kernel.exec-shield = 1
kernel.core_uses_pid = 1

# File system security
fs.suid_dumpable = 0
EOF

sysctl -p

# SSH hardening
cat >> /etc/ssh/sshd_config << EOF
# SSH Security Configuration
PermitRootLogin no
PermitEmptyPasswords no
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
AllowUsers financeanalyst
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
EOF

systemctl restart sshd
```

#### **Container Security**
```dockerfile
# Security-hardened Dockerfile
FROM node:18-alpine

# Install security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init su-exec

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit && \
    npm cache clean --force

# Copy application code
COPY --chown=nodejs:nodejs . .

# Remove unnecessary files
RUN rm -rf /tmp/* /var/tmp/* && \
    find /usr/local -name "*.md" -delete && \
    find /usr/local -name "example*" -delete

# Create log directory
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### **Container Runtime Security**
```yaml
# Docker Compose with security configurations
version: '3.8'

services:
  financeanalyst:
    build:
      context: .
      dockerfile: Dockerfile
    image: financeanalyst-pro:latest
    container_name: financeanalyst-app
    ports:
      - "127.0.0.1:3000:3000"  # Bind to localhost only
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=2048
    volumes:
      - ./logs:/app/logs:rw
      - ./data:/app/data:ro  # Read-only data volume
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    ulimits:
      nproc: 65536
      nofile: 65536
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  postgres:
    image: postgres:14-alpine
    container_name: financeanalyst-db
    environment:
      - POSTGRES_DB=financeanalyst_prod
      - POSTGRES_USER=financeanalyst
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    networks:
      - app-network
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - SETGID
      - SETUID

  redis:
    image: redis:7-alpine
    container_name: financeanalyst-cache
    command: redis-server --requirepass-file /run/secrets/redis_password
    secrets:
      - redis_password
    ports:
      - "127.0.0.1:6379:6379"
    restart: unless-stopped
    networks:
      - app-network
    security_opt:
      - no-new-privileges:true
    read_only: true
    cap_drop:
      - ALL

secrets:
  db_password:
    file: ./secrets/db_password.txt
  redis_password:
    file: ./secrets/redis_password.txt

networks:
  app-network:
    driver: bridge
    internal: true

volumes:
  postgres_data:
    driver: local
```

### 2. Network Security

#### **Firewall Configuration**
```bash
#!/bin/bash
# Advanced Firewall Configuration

# Install advanced firewall tools
apt install -y ufw nftables

# Reset firewall rules
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH with rate limiting
ufw limit ssh

# Allow HTTPS
ufw allow 443/tcp

# Allow HTTP (redirect to HTTPS)
ufw allow 80/tcp

# Allow monitoring ports (internal only)
ufw allow from 10.0.0.0/8 to any port 9090  # Prometheus
ufw allow from 10.0.0.0/8 to any port 9093  # AlertManager
ufw allow from 10.0.0.0/8 to any port 3001  # Grafana

# Enable logging
ufw logging on
ufw logging medium

# Enable firewall
ufw --force enable

# Configure nftables for advanced rules
cat > /etc/nftables.conf << EOF
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;

        # Allow established connections
        ct state established,related accept

        # Allow loopback
        iif lo accept

        # Rate limiting for SSH
        tcp dport 22 limit rate 3/minute accept

        # Allow HTTP/HTTPS
        tcp dport { 80, 443 } accept

        # Allow monitoring (internal)
        ip saddr 10.0.0.0/8 tcp dport { 9090, 9093, 3001 } accept

        # Drop invalid packets
        ct state invalid drop

        # Log dropped packets
        log prefix "nftables-dropped: " drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}

table inet nat {
    chain prerouting {
        type nat hook prerouting priority -100;
    }

    chain postrouting {
        type nat hook postrouting priority 100;
    }
}
EOF

# Enable nftables
systemctl enable nftables
systemctl start nftables
```

#### **SSL/TLS Configuration**
```nginx
# Security-hardened Nginx configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL/TLS Security Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Certificate files
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';" always;

    # Rate limiting
    limit_req zone=api burst=10 nodelay;
    limit_req zone=general burst=100 nodelay;
    limit_req_status 429;

    # Hide server information
    server_tokens off;

    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Security headers for proxied requests
        proxy_hide_header X-Powered-By;
        proxy_hide_header Server;

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # API endpoints with stricter limits
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Stricter rate limiting for API
        limit_req zone=api burst=5 nodelay;

        # Additional security for API
        if ($request_method !~ ^(GET|POST|PUT|DELETE|OPTIONS)$ ) {
            return 405;
        }
    }

    # Static files
    location /static/ {
        alias /opt/financeanalyst/dist/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";

        # Prevent access to sensitive files
        location ~* \.(env|git|svn|DS_Store)$ {
            deny all;
            return 404;
        }
    }

    # Health check (restricted access)
    location /health {
        access_log off;
        allow 10.0.0.0/8;
        allow 127.0.0.1;
        deny all;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Block access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Block access to backup files
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

---

## 🛡️ Application Security

### 1. Input Validation & Sanitization

#### **Enhanced Input Validation**
```javascript
// Comprehensive input validation middleware
import validator from 'validator';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = DOMPurify(window);

class InputValidator {
  static sanitizeString(input, options = {}) {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();

    // Length validation
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    if (options.minLength && sanitized.length < options.minLength) {
      throw new Error(`Input too short. Minimum length: ${options.minLength}`);
    }

    // Character whitelist
    if (options.allowedChars) {
      const regex = new RegExp(`^[${options.allowedChars}]+$`);
      if (!regex.test(sanitized)) {
        throw new Error('Input contains invalid characters');
      }
    }

    // SQL injection prevention
    if (options.preventSQLi) {
      const sqlPatterns = [
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
        /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\\x23)|(\%27)|(\%23)|(\%2D\\x2D))/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\\x27)|(\')|(\-\-)|(\%3B)|(;))/i
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(sanitized)) {
          throw new Error('Potential SQL injection detected');
        }
      }
    }

    // XSS prevention
    if (options.preventXSS) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: []
      });
    }

    // Command injection prevention
    if (options.preventCommandInjection) {
      const commandPatterns = [
        /[;&|`$()]/,
        /\b(rm|del|delete|format|shutdown|reboot)\b/i,
        /\.\./  // Directory traversal
      ];

      for (const pattern of commandPatterns) {
        if (pattern.test(sanitized)) {
          throw new Error('Potential command injection detected');
        }
      }
    }

    return sanitized;
  }

  static validateEmail(email) {
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }
    return email.toLowerCase();
  }

  static validatePassword(password) {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
    }

    return password;
  }

  static validateUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      throw new Error('Invalid UUID format');
    }
    return uuid;
  }

  static validateNumeric(input, options = {}) {
    const num = Number(input);

    if (isNaN(num)) {
      throw new Error('Invalid numeric value');
    }

    if (options.min !== undefined && num < options.min) {
      throw new Error(`Value must be at least ${options.min}`);
    }

    if (options.max !== undefined && num > options.max) {
      throw new Error(`Value must be at most ${options.max}`);
    }

    return num;
  }
}

// Express middleware for input validation
export const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      // Validate query parameters
      if (schema.query) {
        for (const [field, rules] of Object.entries(schema.query)) {
          if (req.query[field] !== undefined) {
            req.query[field] = InputValidator.sanitizeString(req.query[field], rules);
          }
        }
      }

      // Validate body parameters
      if (schema.body) {
        for (const [field, rules] of Object.entries(schema.body)) {
          if (req.body[field] !== undefined) {
            req.body[field] = InputValidator.sanitizeString(req.body[field], rules);
          }
        }
      }

      // Validate route parameters
      if (schema.params) {
        for (const [field, rules] of Object.entries(schema.params)) {
          if (req.params[field] !== undefined) {
            req.params[field] = InputValidator.sanitizeString(req.params[field], rules);
          }
        }
      }

      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        message: error.message
      });
    }
  };
};
```

#### **API Rate Limiting**
```javascript
// Advanced rate limiting with Redis
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

// General API rate limiter
const generalLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_general',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 300, // Block for 5 minutes if exceeded
});

// Strict API rate limiter for sensitive endpoints
const strictLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_strict',
  points: 10,
  duration: 60,
  blockDuration: 900, // Block for 15 minutes
});

// Login rate limiter
const loginLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_login',
  points: 5,
  duration: 300, // 5 attempts per 5 minutes
  blockDuration: 1800, // Block for 30 minutes
});

// Rate limiting middleware
export const rateLimit = (limiter, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator
        ? keyGenerator(req)
        : req.ip || req.connection.remoteAddress;

      await limiter.consume(key);
      next();
    } catch (rejRes) {
      const msBeforeNext = rejRes.msBeforeNext || 0;

      res.set('Retry-After', Math.round(msBeforeNext / 1000));
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.round(msBeforeNext / 1000)} seconds`,
        retryAfter: Math.round(msBeforeNext / 1000)
      });
    }
  };
};

// Key generators for different scenarios
export const keyGenerators = {
  ip: (req) => req.ip,
  user: (req) => req.user?.id || req.ip,
  userAgent: (req) => `${req.user?.id || req.ip}:${req.get('User-Agent')}`,
  endpoint: (req) => `${req.user?.id || req.ip}:${req.originalUrl}`
};

// Apply rate limiting to routes
app.use('/api/', rateLimit(generalLimiter, keyGenerators.user));
app.use('/api/auth/login', rateLimit(loginLimiter, keyGenerators.ip));
app.use('/api/admin/', rateLimit(strictLimiter, keyGenerators.user));
```

### 2. Authentication & Authorization

#### **Enhanced JWT Implementation**
```javascript
// Secure JWT authentication
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class SecureJWT {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.algorithm = 'HS256';
    this.expiresIn = '15m'; // Short-lived access tokens
    this.refreshExpiresIn = '7d'; // Longer refresh tokens

    if (!this.secret || !this.refreshSecret) {
      throw new Error('JWT secrets must be configured');
    }
  }

  generateAccessToken(payload) {
    return jwt.sign({
      ...payload,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    }, this.secret, {
      algorithm: this.algorithm,
      expiresIn: this.expiresIn
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign({
      ...payload,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    }, this.refreshSecret, {
      algorithm: this.algorithm,
      expiresIn: this.refreshExpiresIn
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        algorithms: [this.algorithm]
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        algorithms: [this.algorithm]
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  refreshAccessToken(refreshToken) {
    const payload = this.verifyRefreshToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Generate new access token
    const { type, iat, exp, ...userPayload } = payload;
    return this.generateAccessToken(userPayload);
  }
}

// Token blacklist for logout
class TokenBlacklist {
  constructor(redis) {
    this.redis = redis;
    this.prefix = 'blacklist:';
  }

  async add(token, expiresIn = 900) { // 15 minutes default
    const key = this.prefix + crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.setex(key, expiresIn, '1');
  }

  async isBlacklisted(token) {
    const key = this.prefix + crypto.createHash('sha256').update(token).digest('hex');
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}

// Authentication middleware
export const authenticate = (redis) => {
  const jwtManager = new SecureJWT();
  const blacklist = new TokenBlacklist(redis);

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Bearer token required'
        });
      }

      const token = authHeader.substring(7);

      // Check if token is blacklisted
      if (await blacklist.isBlacklisted(token)) {
        return res.status(401).json({
          error: 'Token revoked',
          message: 'Token has been revoked'
        });
      }

      // Verify token
      const payload = jwtManager.verifyAccessToken(token);

      // Attach user to request
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || []
      };

      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message
      });
    }
  };
};

// Authorization middleware
export const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource',
        required: requiredPermissions,
        user: req.user.role
      });
    }

    next();
  };
};

// Logout endpoint
app.post('/api/auth/logout', authenticate(redis), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);

    // Add token to blacklist
    await blacklist.add(token);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required'
      });
    }

    const jwtManager = new SecureJWT();
    const newAccessToken = jwtManager.refreshAccessToken(refreshToken);

    res.json({
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: 900 // 15 minutes
    });
  } catch (error) {
    res.status(401).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
});
```

#### **Multi-Factor Authentication (MFA)**
```javascript
// TOTP-based MFA implementation
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

class MFAController {
  constructor(redis) {
    this.redis = redis;
    this.secretPrefix = 'mfa_secret:';
    this.backupCodesPrefix = 'mfa_backup:';
  }

  // Generate MFA secret and QR code
  async generateSecret(userId, email) {
    const secret = speakeasy.generateSecret({
      name: `FinanceAnalyst Pro (${email})`,
      issuer: 'FinanceAnalyst Pro',
      length: 32
    });

    // Store secret temporarily (will be confirmed later)
    await this.redis.setex(
      `${this.secretPrefix}temp:${userId}`,
      300, // 5 minutes
      secret.base32
    );

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauth_url: secret.otpauth_url
    };
  }

  // Verify and enable MFA
  async enableMFA(userId, token) {
    const secretKey = await this.redis.get(`${this.secretPrefix}temp:${userId}`);

    if (!secretKey) {
      throw new Error('MFA setup expired. Please start over.');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: secretKey,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (30 seconds each)
    });

    if (!verified) {
      throw new Error('Invalid MFA token');
    }

    // Store permanent secret
    await this.redis.set(`${this.secretPrefix}${userId}`, secretKey);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    await this.redis.set(
      `${this.backupCodesPrefix}${userId}`,
      JSON.stringify(backupCodes)
    );

    // Remove temporary secret
    await this.redis.del(`${this.secretPrefix}temp:${userId}`);

    return {
      success: true,
      backupCodes: backupCodes
    };
  }

  // Verify MFA token
  async verifyToken(userId, token) {
    const secret = await this.redis.get(`${this.secretPrefix}${userId}`);

    if (!secret) {
      throw new Error('MFA not enabled for this user');
    }

    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }

  // Verify backup code
  async verifyBackupCode(userId, backupCode) {
    const backupCodesJson = await this.redis.get(`${this.backupCodesPrefix}${userId}`);

    if (!backupCodesJson) {
      return false;
    }

    const backupCodes = JSON.parse(backupCodesJson);
    const index = backupCodes.indexOf(backupCode);

    if (index === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(index, 1);
    await this.redis.set(
      `${this.backupCodesPrefix}${userId}`,
      JSON.stringify(backupCodes)
    );

    return true;
  }

  // Disable MFA
  async disableMFA(userId) {
    await this.redis.del(`${this.secretPrefix}${userId}`);
    await this.redis.del(`${this.backupCodesPrefix}${userId}`);
  }

  // Generate backup codes
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  // Check if MFA is enabled
  async isMFAEnabled(userId) {
    const secret = await this.redis.exists(`${this.secretPrefix}${userId}`);
    return secret === 1;
  }
}

// MFA middleware
export const requireMFA = (mfaController) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isMFAEnabled = await mfaController.isMFAEnabled(req.user.id);

    if (!isMFAEnabled) {
      return next(); // Skip MFA if not enabled
    }

    // Check if MFA token was provided
    const mfaToken = req.headers['x-mfa-token'] || req.body.mfaToken;

    if (!mfaToken) {
      return res.status(401).json({
        error: 'MFA required',
        message: 'Multi-factor authentication token required',
        mfaRequired: true
      });
    }

    // Verify MFA token
    try {
      const isValid = await mfaController.verifyToken(req.user.id, mfaToken);

      if (!isValid) {
        // Try backup code
        const isBackupValid = await mfaController.verifyBackupCode(req.user.id, mfaToken);

        if (!isBackupValid) {
          return res.status(401).json({
            error: 'Invalid MFA token',
            message: 'The provided MFA token is invalid'
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: 'MFA verification failed',
        message: error.message
      });
    }
  };
};
```

---

## 🔐 Data Protection

### 1. Data Encryption

#### **Database Encryption**
```sql
-- PostgreSQL Transparent Data Encryption (TDE) setup
-- Note: This requires PostgreSQL Enterprise or specific configurations

-- Enable encryption for specific columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encrypted user table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  encrypted_ssn TEXT, -- Encrypted sensitive data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_data(input_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(encrypt(input_text::bytea, encryption_key, 'aes'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_data(encrypted_text TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(decrypt(decode(encrypted_text, 'hex'), encryption_key, 'aes'), 'utf8');
END;
$$ LANGUAGE plpgsql;

-- Usage example
INSERT INTO users (email, encrypted_password, encrypted_ssn)
VALUES (
  'user@example.com',
  encrypt_data('password123', 'your-encryption-key'),
  encrypt_data('123-45-6789', 'your-encryption-key')
);

-- Query with decryption
SELECT
  id,
  email,
  decrypt_data(encrypted_password, 'your-encryption-key') as password,
  decrypt_data(encrypted_ssn, 'your-encryption-key') as ssn
FROM users
WHERE id = 1;
```

#### **Application-Level Encryption**
```javascript
// Application-level encryption utilities
import crypto from 'crypto';

class EncryptionManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
  }

  // Generate encryption key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Encrypt data
  encrypt(text, key) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt data
  decrypt(encryptedData, key) {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hash sensitive data (one-way)
  hash(text, saltRounds = 12) {
    return new Promise((resolve, reject) => {
      const bcrypt = require('bcrypt');
      bcrypt.hash(text, saltRounds, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });
  }

  // Verify hashed data
  verifyHash(text, hash) {
    return new Promise((resolve, reject) => {
      const bcrypt = require('bcrypt');
      bcrypt.compare(text, hash, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

// Secure data storage
class SecureDataStore {
  constructor(encryptionManager, redis) {
    this.encryption = encryptionManager;
    this.redis = redis;
    this.keyPrefix = 'secure:';
  }

  async storeSecureData(key, data, ttl = 3600) {
    const masterKey = process.env.MASTER_ENCRYPTION_KEY;
    const encrypted = this.encryption.encrypt(JSON.stringify(data), masterKey);

    const secureData = {
      encrypted: encrypted.encrypted,
      iv: encrypted.iv,
      tag: encrypted.tag,
      timestamp: Date.now()
    };

    await this.redis.setex(
      this.keyPrefix + key,
      ttl,
      JSON.stringify(secureData)
    );
  }

  async retrieveSecureData(key) {
    const secureDataJson = await this.redis.get(this.keyPrefix + key);

    if (!secureDataJson) {
      return null;
    }

    const secureData = JSON.parse(secureDataJson);
    const masterKey = process.env.MASTER_ENCRYPTION_KEY;

    const decrypted = this.encryption.decrypt({
      encrypted: secureData.encrypted,
      iv: secureData.iv,
      tag: secureData.tag
    }, masterKey);

    return JSON.parse(decrypted);
  }

  async deleteSecureData(key) {
    await this.redis.del(this.keyPrefix + key);
  }
}

// Usage examples
const encryption = new EncryptionManager();
const secureStore = new SecureDataStore(encryption, redis);

// Store sensitive user data
await secureStore.storeSecureData(`user:${userId}:ssn`, {
  ssn: '123-45-6789',
  verified: true
}, 86400); // 24 hours

// Retrieve sensitive data
const sensitiveData = await secureStore.retrieveSecureData(`user:${userId}:ssn`);
```

### 2. Data Masking and Anonymization

#### **Data Masking Functions**
```javascript
// Data masking utilities
class DataMasker {
  static maskEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone) {
    // Mask all but last 4 digits
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  static maskSSN(ssn) {
    // Show only last 4 digits
    return `***-**-${ssn.slice(-4)}`;
  }

  static maskCreditCard(cardNumber) {
    // Show only last 4 digits
    return '*'.repeat(cardNumber.length - 4) + cardNumber.slice(-4);
  }

  static anonymizeIPAddress(ip) {
    // Anonymize last octet
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  static truncateText(text, maxLength = 100, suffix = '...') {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  }
}

// Database view with masked data for non-admin users
const createMaskedUserView = `
CREATE OR REPLACE VIEW users_masked AS
SELECT
  id,
  CASE
    WHEN current_user_role() = 'admin' THEN email
    ELSE CONCAT(SUBSTRING(email FROM 1 FOR 1), '***', SUBSTRING(email FROM POSITION('@' IN email)))
  END as email,
  CASE
    WHEN current_user_role() = 'admin' THEN phone
    ELSE CONCAT('***-***-', RIGHT(phone, 4))
  END as phone,
  created_at,
  last_login_at
FROM users;
`;

// Usage in API responses
export const formatUserResponse = (user, userRole = 'user') => {
  if (userRole === 'admin') {
    return user; // Return full data for admins
  }

  return {
    id: user.id,
    email: DataMasker.maskEmail(user.email),
    phone: DataMasker.maskPhone(user.phone),
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    // Exclude sensitive fields
    // ssn, credit_card, etc. are not included
  };
};
```

---

## 🕵️ Security Monitoring

### 1. Security Event Logging

#### **Comprehensive Security Logging**
```javascript
// Security event logging system
class SecurityLogger {
  constructor(logger, redis) {
    this.logger = logger;
    this.redis = redis;
    this.eventsKey = 'security:events';
    this.alertsKey = 'security:alerts';
  }

  async logSecurityEvent(eventType, details, severity = 'info') {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      severity: severity,
      timestamp: new Date().toISOString(),
      source: 'financeanalyst-api',
      details: details,
      userAgent: details.userAgent,
      ipAddress: details.ipAddress,
      userId: details.userId,
      sessionId: details.sessionId
    };

    // Log to structured logger
    this.logger.log(severity, `Security event: ${eventType}`, event);

    // Store in Redis for real-time monitoring
    await this.redis.lpush(this.eventsKey, JSON.stringify(event));
    await this.redis.ltrim(this.eventsKey, 0, 999); // Keep last 1000 events

    // Check for alert conditions
    await this.checkAlertConditions(event);

    return event.id;
  }

  async checkAlertConditions(event) {
    const alertRules = {
      'failed_login': {
        threshold: 5,
        window: 300, // 5 minutes
        severity: 'warning'
      },
      'suspicious_request': {
        threshold: 3,
        window: 60, // 1 minute
        severity: 'warning'
      },
      'unauthorized_access': {
        threshold: 1,
        window: 60, // Immediate alert
        severity: 'critical'
      }
    };

    const rule = alertRules[event.type];
    if (!rule) return;

    // Count events in time window
    const windowStart = Date.now() - (rule.window * 1000);
    const recentEvents = await this.redis.lrange(this.eventsKey, 0, -1);
    const matchingEvents = recentEvents
      .map(e => JSON.parse(e))
      .filter(e =>
        e.type === event.type &&
        new Date(e.timestamp).getTime() > windowStart &&
        e.details.ipAddress === event.details.ipAddress
      );

    if (matchingEvents.length >= rule.threshold) {
      await this.createSecurityAlert(event.type, matchingEvents, rule.severity);
    }
  }

  async createSecurityAlert(eventType, events, severity) {
    const alert = {
      id: crypto.randomUUID(),
      type: 'security_alert',
      severity: severity,
      title: `${eventType.replace('_', ' ').toUpperCase()} ALERT`,
      description: `${events.length} ${eventType} events detected`,
      events: events.map(e => e.id),
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    await this.redis.lpush(this.alertsKey, JSON.stringify(alert));
    await this.redis.ltrim(this.alertsKey, 0, 99); // Keep last 100 alerts

    // Send alert notification
    await this.sendAlertNotification(alert);

    this.logger.warn(`Security alert created: ${alert.title}`, alert);
  }

  async sendAlertNotification(alert) {
    const webhookUrl = process.env.SECURITY_WEBHOOK_URL;
    if (!webhookUrl) return;

    const payload = {
      text: `🚨 *${alert.title}*`,
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Event Count',
            value: alert.events.length.toString(),
            short: true
          },
          {
            title: 'Time',
            value: alert.timestamp,
            short: true
          }
        ],
        text: alert.description
      }]
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      this.logger.error('Failed to send security alert notification', error);
    }
  }

  async getRecentEvents(limit = 100) {
    const events = await this.redis.lrange(this.eventsKey, 0, limit - 1);
    return events.map(e => JSON.parse(e));
  }

  async getActiveAlerts() {
    const alerts = await this.redis.lrange(this.alertsKey, 0, -1);
    return alerts
      .map(a => JSON.parse(a))
      .filter(a => a.status === 'active');
  }
}

// Security middleware
export const securityLogger = (securityLogger) => {
  return (req, res, next) => {
    const startTime = Date.now();

    // Log security events
    if (res.statusCode >= 400) {
      securityLogger.logSecurityEvent('error_response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        userId: req.user?.id,
        sessionId: req.session?.id,
        responseTime: Date.now() - startTime
      }, res.statusCode >= 500 ? 'error' : 'warning');
    }

    // Log suspicious activities
    if (req.url.includes('../') || req.url.includes('..\\')) {
      securityLogger.logSecurityEvent('directory_traversal_attempt', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        userId: req.user?.id
      }, 'warning');
    }

    next();
  };
};

// Authentication security events
export const logAuthEvent = (securityLogger, eventType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode === 401 || res.statusCode === 403) {
        securityLogger.logSecurityEvent(eventType, {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          userId: req.user?.id,
          email: req.body?.email
        }, 'warning');
      }
      originalSend.call(this, data);
    };
    next();
  };
};
```

### 2. Intrusion Detection

#### **Behavioral Analysis**
```javascript
// User behavior analysis for anomaly detection
class BehaviorAnalyzer {
  constructor(redis) {
    this.redis = redis;
    this.userBehaviorKey = 'behavior:user:';
    this.ipBehaviorKey = 'behavior:ip:';
  }

  async analyzeUserBehavior(userId, action, metadata = {}) {
    const key = this.userBehaviorKey + userId;
    const now = Date.now();

    // Record user action
    await this.redis.zadd(key, now, JSON.stringify({
      action,
      timestamp: now,
      ...metadata
    }));

    // Keep only last 1000 actions
    await this.redis.zremrangebyrank(key, 0, -1001);

    // Analyze behavior patterns
    const anomalies = await this.detectAnomalies(key, userId);

    if (anomalies.length > 0) {
      return {
        anomalies,
        riskLevel: this.calculateRiskLevel(anomalies)
      };
    }

    return { anomalies: [], riskLevel: 'low' };
  }

  async detectAnomalies(key, userId) {
    const anomalies = [];
    const actions = await this.redis.zrange(key, -100, -1);

    if (actions.length < 10) return anomalies; // Need minimum data

    const parsedActions = actions.map(a => JSON.parse(a));

    // Detect unusual login times
    const loginTimes = parsedActions
      .filter(a => a.action === 'login')
      .map(a => new Date(a.timestamp).getHours());

    if (loginTimes.length > 5) {
      const avgLoginTime = loginTimes.reduce((a, b) => a + b) / loginTimes.length;
      const currentLoginTime = loginTimes[loginTimes.length - 1];

      if (Math.abs(currentLoginTime - avgLoginTime) > 6) { // 6 hour difference
        anomalies.push({
          type: 'unusual_login_time',
          severity: 'medium',
          description: 'Login at unusual hour'
        });
      }
    }

    // Detect rapid failed login attempts
    const recentFailedLogins = parsedActions
      .filter(a => a.action === 'login_failed')
      .filter(a => now - a.timestamp < 300000) // Last 5 minutes
      .length;

    if (recentFailedLogins > 3) {
      anomalies.push({
        type: 'rapid_failed_logins',
        severity: 'high',
        description: `${recentFailedLogins} failed login attempts in 5 minutes`
      });
    }

    // Detect unusual IP addresses
    const ipAddresses = [...new Set(parsedActions.map(a => a.ipAddress))];
    const currentIP = parsedActions[parsedActions.length - 1].ipAddress;

    // Check if current IP is different from usual IPs
    const usualIPs = ipAddresses.slice(0, -1); // Exclude current
    if (usualIPs.length > 3 && !usualIPs.includes(currentIP)) {
      anomalies.push({
        type: 'unusual_ip_address',
        severity: 'medium',
        description: 'Login from unusual IP address'
      });
    }

    return anomalies;
  }

  calculateRiskLevel(anomalies) {
    const severityWeights = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    const totalWeight = anomalies.reduce((sum, anomaly) =>
      sum + severityWeights[anomaly.severity], 0);

    if (totalWeight >= 8) return 'critical';
    if (totalWeight >= 5) return 'high';
    if (totalWeight >= 3) return 'medium';
    return 'low';
  }

  async getUserRiskProfile(userId) {
    const key = this.userBehaviorKey + userId;
    const actions = await this.redis.zrange(key, -100, -1);

    const profile = {
      totalActions: actions.length,
      loginCount: 0,
      failedLoginCount: 0,
      uniqueIPs: new Set(),
      timeRange: { start: null, end: null }
    };

    actions.forEach(actionJson => {
      const action = JSON.parse(actionJson);
      profile.timeRange.start = profile.timeRange.start || action.timestamp;
      profile.timeRange.end = action.timestamp;

      if (action.action === 'login') profile.loginCount++;
      if (action.action === 'login_failed') profile.failedLoginCount++;
      if (action.ipAddress) profile.uniqueIPs.add(action.ipAddress);
    });

    profile.uniqueIPs = profile.uniqueIPs.size;
    profile.timeRange.duration = profile.timeRange.end - profile.timeRange.start;

    return profile;
  }
}

// Risk-based authentication
export const riskBasedAuth = (behaviorAnalyzer) => {
  return async (req, res, next) => {
    if (!req.user) return next();

    try {
      const analysis = await behaviorAnalyzer.analyzeUserBehavior(
        req.user.id,
        'login',
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: Date.now()
        }
      );

      // Attach risk analysis to request
      req.user.riskAnalysis = analysis;

      // High risk actions may require additional verification
      if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
        req.user.requiresAdditionalVerification = true;
      }

      next();
    } catch (error) {
      // Log error but don't block authentication
      console.error('Risk analysis error:', error);
      next();
    }
  };
};
```

---

## 📋 Compliance & Auditing

### 1. Audit Logging

#### **Comprehensive Audit Trail**
```javascript
// Audit logging system
class AuditLogger {
  constructor(logger, database) {
    this.logger = logger;
    this.database = database;
    this.auditTable = 'audit_log';
  }

  async logAuditEvent(event) {
    const auditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      user_id: event.userId,
      session_id: event.sessionId,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId,
      details: JSON.stringify(event.details || {}),
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      success: event.success,
      error_message: event.errorMessage,
      compliance_flags: JSON.stringify(event.complianceFlags || [])
    };

    try {
      // Store in database
      await this.database('audit_log').insert(auditEntry);

      // Store in structured log
      this.logger.info('Audit event', auditEntry);

      // Check compliance requirements
      await this.checkComplianceRequirements(auditEntry);

    } catch (error) {
      this.logger.error('Failed to log audit event', error);
      // Fallback to file logging
      this.logToFile(auditEntry);
    }
  }

  async checkComplianceRequirements(auditEntry) {
    const complianceChecks = [];

    // GDPR compliance - data access logging
    if (auditEntry.resource_type === 'user_data' && auditEntry.action === 'read') {
      complianceChecks.push({
        regulation: 'GDPR',
        requirement: 'data_access_logging',
        status: 'compliant'
      });
    }

    // SOX compliance - financial data modifications
    if (auditEntry.resource_type === 'financial_data' && ['create', 'update', 'delete'].includes(auditEntry.action)) {
      complianceChecks.push({
        regulation: 'SOX',
        requirement: 'financial_data_modification',
        status: 'compliant'
      });
    }

    // HIPAA compliance - health data access
    if (auditEntry.resource_type === 'health_data') {
      complianceChecks.push({
        regulation: 'HIPAA',
        requirement: 'health_data_access',
        status: 'compliant'
      });
    }

    if (complianceChecks.length > 0) {
      auditEntry.compliance_flags = complianceChecks;
      await this.database('audit_log')
        .where('id', auditEntry.id)
        .update({ compliance_flags: JSON.stringify(complianceChecks) });
    }
  }

  logToFile(auditEntry) {
    const fs = require('fs');
    const logLine = JSON.stringify(auditEntry) + '\n';
    fs.appendFileSync('/var/log/financeanalyst/audit.log', logLine);
  }

  async getAuditTrail(filters = {}) {
    let query = this.database('audit_log').select('*');

    if (filters.userId) {
      query = query.where('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.where('action', filters.action);
    }

    if (filters.resourceType) {
      query = query.where('resource_type', filters.resourceType);
    }

    if (filters.startDate) {
      query = query.where('timestamp', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query = query.where('timestamp', '<=', filters.endDate);
    }

    if (filters.success !== undefined) {
      query = query.where('success', filters.success);
    }

    return await query.orderBy('timestamp', 'desc');
  }

  async getComplianceReport(regulation, startDate, endDate) {
    const auditEntries = await this.database('audit_log')
      .whereRaw("compliance_flags::text LIKE ?", [`%${regulation}%`])
      .whereBetween('timestamp', [startDate, endDate])
      .orderBy('timestamp', 'desc');

    return auditEntries.map(entry => ({
      ...entry,
      compliance_flags: JSON.parse(entry.compliance_flags)
    }));
  }
}

// Audit middleware
export const auditMiddleware = (auditLogger) => {
  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(data) {
      const duration = Date.now() - startTime;

      auditLogger.logAuditEvent({
        userId: req.user?.id,
        sessionId: req.session?.id,
        action: this.getActionFromMethod(req.method),
        resourceType: this.getResourceTypeFromUrl(req.url),
        resourceId: this.extractResourceId(req.url),
        details: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime: duration,
          userAgent: req.get('User-Agent')
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? data : null
      });

      originalSend.call(this, data);
    }.bind(res);

    next();
  };

  getActionFromMethod(method) {
    const methodMap = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete'
    };
    return methodMap[method] || 'unknown';
  }

  getResourceTypeFromUrl(url) {
    const urlParts = url.split('/');
    if (urlParts[1] === 'api' && urlParts[2]) {
      return urlParts[2]; // e.g., 'users', 'transactions', 'portfolios'
    }
    return 'unknown';
  }

  extractResourceId(url) {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];

    // Check if it's a UUID or numeric ID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lastPart) ||
        /^\d+$/.test(lastPart)) {
      return lastPart;
    }

    return null;
  }
};
```

### 2. Compliance Monitoring

#### **Automated Compliance Checks**
```javascript
// Compliance monitoring system
class ComplianceMonitor {
  constructor(auditLogger, alertManager) {
    this.auditLogger = auditLogger;
    this.alertManager = alertManager;
    this.complianceRules = this.loadComplianceRules();
  }

  loadComplianceRules() {
    return {
      GDPR: {
        dataRetention: {
          check: async () => {
            // Check for data older than retention period
            const cutoffDate = new Date();
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 7); // 7 years retention

            const oldData = await database('user_data')
              .where('created_at', '<', cutoffDate)
              .count();

            return oldData[0].count > 0 ? 'violation' : 'compliant';
          },
          remediation: 'Implement automated data deletion for old records'
        },
        dataEncryption: {
          check: async () => {
            // Check if sensitive data is encrypted
            const unencryptedData = await database('users')
              .whereRaw("ssn NOT LIKE 'ENC:%'")
              .count();

            return unencryptedData[0].count > 0 ? 'violation' : 'compliant';
          },
          remediation: 'Encrypt all sensitive PII data'
        }
      },
      SOX: {
        auditTrail: {
          check: async () => {
            // Check if all financial transactions are audited
            const unauditedTransactions = await database('transactions')
              .leftJoin('audit_log', function() {
                this.on('transactions.id', '=', 'audit_log.resource_id')
                    .andOn('audit_log.resource_type', '=', database.raw("'transaction'"));
              })
              .whereNull('audit_log.id')
              .count();

            return unauditedTransactions[0].count > 0 ? 'violation' : 'compliant';
          },
          remediation: 'Ensure all financial transactions are logged in audit trail'
        }
      },
      HIPAA: {
        accessControls: {
          check: async () => {
            // Check if health data access is properly controlled
            const unrestrictedAccess = await database('user_permissions')
              .where('resource_type', 'health_data')
              .where('permission_level', 'unrestricted')
              .count();

            return unrestrictedAccess[0].count > 0 ? 'violation' : 'compliant';
          },
          remediation: 'Implement strict access controls for health data'
        }
      }
    };
  }

  async runComplianceChecks() {
    const results = {};

    for (const [regulation, rules] of Object.entries(this.complianceRules)) {
      results[regulation] = {};

      for (const [ruleName, ruleConfig] of Object.entries(rules)) {
        try {
          const status = await ruleConfig.check();
          results[regulation][ruleName] = {
            status: status,
            lastChecked: new Date().toISOString(),
            remediation: status === 'violation' ? ruleConfig.remediation : null
          };

          // Log compliance check
          await this.auditLogger.logAuditEvent({
            action: 'compliance_check',
            resourceType: 'compliance',
            resourceId: `${regulation}:${ruleName}`,
            details: {
              regulation,
              rule: ruleName,
              status,
              remediation: ruleConfig.remediation
            },
            success: status === 'compliant'
          });

          // Alert on violations
          if (status === 'violation') {
            await this.alertManager.sendAlert({
              title: `${regulation} Compliance Violation`,
              message: `Compliance violation detected: ${ruleName}`,
              severity: 'critical',
              category: 'compliance'
            });
          }

        } catch (error) {
          results[regulation][ruleName] = {
            status: 'error',
            error: error.message,
            lastChecked: new Date().toISOString()
          };

          await this.alertManager.sendAlert({
            title: 'Compliance Check Error',
            message: `Failed to check ${regulation}:${ruleName} - ${error.message}`,
            severity: 'warning',
            category: 'compliance'
          });
        }
      }
    }

    return results;
  }

  async generateComplianceReport(regulation = null, startDate = null, endDate = null) {
    const report = {
      generatedAt: new Date().toISOString(),
      regulations: {},
      summary: {
        totalChecks: 0,
        compliant: 0,
        violations: 0,
        errors: 0
      }
    };

    // Get compliance check results
    const checks = regulation
      ? { [regulation]: await this.auditLogger.getComplianceReport(regulation, startDate, endDate) }
      : {};

    if (!regulation) {
      // Get all regulations
      const allRegulations = Object.keys(this.complianceRules);
      for (const reg of allRegulations) {
        checks[reg] = await this.auditLogger.getComplianceReport(reg, startDate, endDate);
      }
    }

    for (const [reg, auditEntries] of Object.entries(checks)) {
      report.regulations[reg] = {
        checks: auditEntries.length,
        violations: auditEntries.filter(e => e.success === false).length,
        lastChecked: auditEntries.length > 0 ? auditEntries[0].timestamp : null
      };

      report.summary.totalChecks += auditEntries.length;
      report.summary.compliant += auditEntries.filter(e => e.success === true).length;
      report.summary.violations += auditEntries.filter(e => e.success === false).length;
    }

    return report;
  }
}
```

---

## 🚨 Incident Response

### 1. Security Incident Response

#### **Breach Response Plan**
```bash
#!/bin/bash
# Security Breach Response Script

echo "🚨 SECURITY BREACH DETECTED - INITIATING RESPONSE PROTOCOLS"

# Timestamp for all actions
TIMESTAMP=$(date +%Y%m-%d_%H-%M-%S)
LOG_FILE="/var/log/financeanalyst/incident-${TIMESTAMP}.log"

# Log all actions
log_action() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_action "Security breach detected at $(date)"

# 1. ISOLATE AFFECTED SYSTEMS
log_action "Step 1: Isolating affected systems..."

# Stop accepting new connections
docker exec financeanalyst-nginx nginx -s stop
log_action "Nginx stopped - no new connections accepted"

# Enable maintenance mode
curl -X POST https://api.statuspage.io/v1/pages/$STATUSPAGE_ID/incidents \
  -H "Authorization: OAuth $STATUSPAGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "name": "Security Incident",
      "status": "investigating",
      "impact": "major",
      "body": "Investigating a security incident. Services may be unavailable."
    }
  }'
log_action "Maintenance mode enabled on status page"

# 2. PRESERVE EVIDENCE
log_action "Step 2: Preserving evidence..."

# Create forensic snapshots
docker exec financeanalyst-db pg_dump -U financeanalyst financeanalyst_prod > "/var/backups/forensic-${TIMESTAMP}.sql"
log_action "Database forensic snapshot created"

# Preserve logs
cp -r /var/log/financeanalyst "/var/backups/logs-${TIMESTAMP}"
log_action "Log files preserved"

# Take system snapshots
docker commit financeanalyst-app "financeanalyst-forensic-${TIMESTAMP}"
log_action "Container snapshot created"

# 3. ASSESS IMPACT
log_action "Step 3: Assessing impact..."

# Check for unauthorized access
docker logs financeanalyst-app 2>&1 | grep -i "unauthorized\|forbidden\|error" | tail -20
log_action "Access logs reviewed"

# Check for data exfiltration
docker exec financeanalyst-db psql -U financeanalyst -d financeanalyst_prod -c "
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
WHERE n_tup_ins > 1000 OR n_tup_upd > 100 OR n_tup_del > 10;
"
log_action "Database activity analyzed"

# 4. CONTAIN THREAT
log_action "Step 4: Containing threat..."

# Block suspicious IPs
# (This would be automated based on security alerts)
log_action "Suspicious IPs blocked"

# Disable compromised accounts
log_action "Compromised accounts disabled"

# Update security rules
log_action "Security rules updated"

# 5. NOTIFY STAKEHOLDERS
log_action "Step 5: Notifying stakeholders..."

# Notify security team
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 SECURITY BREACH DETECTED - Incident Response Activated"}' \
  $SECURITY_TEAM_WEBHOOK

# Notify management
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 Critical Security Incident - Executive Notification Required"}' \
  $EXECUTIVE_WEBHOOK

# Notify customers (if data breach)
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"⚠️ Service Disruption Due to Security Incident"}' \
#   $CUSTOMER_WEBHOOK

log_action "Stakeholders notified"

# 6. RECOVERY PLAN
log_action "Step 6: Initiating recovery plan..."

# Determine recovery strategy
if [ "$DATA_BREACH" = "true" ]; then
    log_action "Data breach confirmed - full recovery required"
    ./scripts/disaster-recovery.sh
else
    log_action "No data breach - standard recovery"
    ./scripts/restore-from-backup.sh
fi

# 7. MONITORING AND VALIDATION
log_action "Step 7: Post-recovery monitoring..."

# Enable enhanced monitoring
curl -X POST https://monitoring-api.com/enable-enhanced-monitoring \
  -H "Authorization: Bearer $MONITORING_API_KEY"

# Validate system integrity
./scripts/health-check.sh

log_action "Recovery completed and validated"

# 8. LESSONS LEARNED
log_action "Step 8: Documenting lessons learned..."

# This would typically involve:
# - Incident review meeting
# - Root cause analysis
# - Action items assignment
# - Process improvements
# - Documentation updates

log_action "Incident response protocol completed"
echo "📋 Incident log saved to: $LOG_FILE"
```

### 2. Automated Response Actions

#### **Real-time Security Response**
```javascript
// Automated security response system
class AutomatedSecurityResponse {
  constructor(securityLogger, alertManager, blocklistManager) {
    this.securityLogger = securityLogger;
    this.alertManager = alertManager;
    this.blocklistManager = blocklistManager;
    this.responseRules = this.loadResponseRules();
  }

  loadResponseRules() {
    return {
      'sql_injection_attempt': {
        actions: ['block_ip', 'log_security_event', 'alert_security_team'],
        severity: 'high',
        cooldown: 3600 // 1 hour
      },
      'brute_force_attack': {
        actions: ['block_ip', 'disable_account', 'alert_security_team'],
        severity: 'critical',
        cooldown: 7200 // 2 hours
      },
      'unauthorized_access': {
        actions: ['block_ip', 'revoke_session', 'alert_security_team'],
        severity: 'critical',
        cooldown: 1800 // 30 minutes
      },
      'suspicious_traffic': {
        actions: ['rate_limit_ip', 'log_security_event'],
        severity: 'medium',
        cooldown: 900 // 15 minutes
      },
      'data_exfiltration': {
        actions: ['block_ip', 'isolate_system', 'alert_security_team'],
        severity: 'critical',
        cooldown: 3600 // 1 hour
      }
    };
  }

  async handleSecurityEvent(eventType, eventData) {
    const rule = this.responseRules[eventType];
    if (!rule) {
      console.warn(`No response rule found for event type: ${eventType}`);
      return;
    }

    // Check cooldown period
    const cooldownKey = `cooldown:${eventType}:${eventData.ipAddress}`;
    const lastResponse = await redis.get(cooldownKey);

    if (lastResponse) {
      const timeSinceLastResponse = Date.now() - parseInt(lastResponse);
      if (timeSinceLastResponse < rule.cooldown * 1000) {
        console.log(`Response for ${eventType} still in cooldown`);
        return;
      }
    }

    // Execute response actions
    for (const action of rule.actions) {
      await this.executeAction(action, eventData, rule.severity);
    }

    // Set cooldown
    await redis.setex(cooldownKey, rule.cooldown, Date.now().toString());

    // Log automated response
    await this.securityLogger.logSecurityEvent('automated_response', {
      originalEvent: eventType,
      actions: rule.actions,
      severity: rule.severity,
      targetIP: eventData.ipAddress,
      targetUser: eventData.userId
    });
  }

  async executeAction(action, eventData, severity) {
    switch (action) {
      case 'block_ip':
        await this.blocklistManager.blockIP(eventData.ipAddress, severity);
        break;

      case 'disable_account':
        if (eventData.userId) {
          await this.disableUserAccount(eventData.userId);
        }
        break;

      case 'revoke_session':
        if (eventData.sessionId) {
          await this.revokeUserSession(eventData.sessionId);
        }
        break;

      case 'rate_limit_ip':
        await this.applyRateLimit(eventData.ipAddress);
        break;

      case 'isolate_system':
        await this.isolateSystem();
        break;

      case 'log_security_event':
        // Already logged by the calling function
        break;

      case 'alert_security_team':
        await this.alertManager.sendAlert({
          title: `Automated Security Response: ${action}`,
          message: `Automated response triggered for ${eventData.ipAddress}`,
          severity: severity,
          category: 'security'
        });
        break;

      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  async blockIP(ipAddress, severity) {
    const blockDuration = severity === 'critical' ? 86400 : 3600; // 24h or 1h

    // Add to firewall blocklist
    execSync(`ufw insert 1 deny from ${ipAddress} to any`);

    // Add to application blocklist
    await redis.sadd('blocked_ips', ipAddress);
    await redis.expire('blocked_ips', blockDuration);

    console.log(`IP ${ipAddress} blocked for ${blockDuration} seconds`);
  }

  async disableUserAccount(userId) {
    await database('users')
      .where('id', userId)
      .update({
        is_active: false,
        disabled_at: new Date(),
        disabled_reason: 'Security incident - automated response'
      });

    // Revoke all active sessions
    await redis.del(`sessions:user:${userId}`);

    console.log(`User account ${userId} disabled`);
  }

  async revokeUserSession(sessionId) {
    await redis.del(`session:${sessionId}`);
    console.log(`Session ${sessionId} revoked`);
  }

  async applyRateLimit(ipAddress) {
    // Apply stricter rate limiting for suspicious IP
    await redis.setex(`rate_limit:${ipAddress}`, 3600, 'strict');
    console.log(`Rate limiting applied to ${ipAddress}`);
  }

  async isolateSystem() {
    // Enable maintenance mode
    await redis.set('system_status', 'maintenance');

    // Stop accepting new requests
    execSync('docker exec financeanalyst-nginx nginx -s stop');

    console.log('System isolated for security investigation');
  }
}
```

---

## 🔐 Security Monitoring

### 1. Real-time Threat Detection

#### **Advanced Threat Detection**
```javascript
// Advanced threat detection system
class ThreatDetectionEngine {
  constructor(securityLogger, machineLearning) {
    this.securityLogger = securityLogger;
    this.ml = machineLearning;
    this.threatPatterns = this.loadThreatPatterns();
    this.anomalyThreshold = 0.85; // 85% confidence threshold
  }

  loadThreatPatterns() {
    return {
      sql_injection: {
        patterns: [
          /\bUNION\b.*\bSELECT\b/i,
          /\bDROP\b.*\bTABLE\b/i,
          /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\\x23)|(\%27)|(\%23)|(\%2D\\x2D))/i
        ],
        severity: 'high'
      },
      xss_attempt: {
        patterns: [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:[^\\s]*/gi,
          /on\w+\s*=/gi
        ],
        severity: 'high'
      },
      directory_traversal: {
        patterns: [
          /\.\.[\/\\]/,
          /%2e%2e[\/\\]/i,
          /\.\.%2f/i
        ],
        severity: 'medium'
      },
      command_injection: {
        patterns: [
          /[;&|`$()]/,
          /\b(rm|del|format|shutdown|reboot)\b/i
        ],
        severity: 'high'
      },
      suspicious_user_agent: {
        patterns: [
          /(sqlmap|nikto|nmap|masscan|dirbuster|hydra)/i,
          /bot|crawler|spider/i
        ],
        severity: 'low'
      }
    };
  }

  async analyzeRequest(req) {
    const threats = [];
    const requestData = this.extractRequestData(req);

    // Pattern-based detection
    for (const [threatType, config] of Object.entries(this.threatPatterns)) {
      for (const pattern of config.patterns) {
        const matches = this.findMatches(requestData, pattern);
        if (matches.length > 0) {
          threats.push({
            type: threatType,
            severity: config.severity,
            matches: matches,
            confidence: 0.95
          });
        }
      }
    }

    // Behavioral analysis
    const behavioralThreats = await this.analyzeBehavioralPatterns(req);
    threats.push(...behavioralThreats);

    // Machine learning-based detection
    const mlThreats = await this.ml.predictThreat(requestData);
    if (mlThreats.confidence > this.anomalyThreshold) {
      threats.push({
        type: 'machine_learning_anomaly',
        severity: mlThreats.severity,
        confidence: mlThreats.confidence,
        details: mlThreats.details
      });
    }

    return threats;
  }

  extractRequestData(req) {
    return {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: Date.now(),
      userId: req.user?.id
    };
  }

  findMatches(data, pattern) {
    const matches = [];
    const searchString = JSON.stringify(data);

    let match;
    while ((match = pattern.exec(searchString)) !== null) {
      matches.push({
        pattern: pattern.toString(),
        match: match[0],
        index: match.index
      });
    }

    return matches;
  }

  async analyzeBehavioralPatterns(req) {
    const threats = [];
    const userId = req.user?.id;
    const ip = req.ip;

    if (!userId) return threats;

    // Check for unusual request patterns
    const recentRequests = await this.getRecentUserRequests(userId, 100);

    // Detect rapid requests (potential DoS)
    const recentTimestamps = recentRequests.map(r => r.timestamp);
    const requestRate = this.calculateRequestRate(recentTimestamps);

    if (requestRate > 10) { // More than 10 requests per second
      threats.push({
        type: 'rapid_requests',
        severity: 'medium',
        confidence: 0.8,
        details: `Request rate: ${requestRate} req/s`
      });
    }

    // Detect unusual endpoints
    const endpointFrequency = this.analyzeEndpointFrequency(recentRequests);
    const unusualEndpoints = Object.entries(endpointFrequency)
      .filter(([endpoint, count]) => count > 50) // Same endpoint > 50 times
      .map(([endpoint]) => endpoint);

    if (unusualEndpoints.length > 0) {
      threats.push({
        type: 'endpoint_abuse',
        severity: 'medium',
        confidence: 0.7,
        details: `Abused endpoints: ${unusualEndpoints.join(', ')}`
      });
    }

    return threats;
  }

  calculateRequestRate(timestamps) {
    if (timestamps.length < 2) return 0;

    const now = Date.now();
    const recentRequests = timestamps.filter(t => now - t < 10000); // Last 10 seconds

    if (recentRequests.length < 2) return 0;

    const timeSpan = (recentRequests[recentRequests.length - 1] - recentRequests[0]) / 1000;
    return recentRequests.length / timeSpan;
  }

  analyzeEndpointFrequency(requests) {
    const frequency = {};

    requests.forEach(req => {
      const endpoint = req.url.split('?')[0]; // Remove query parameters
      frequency[endpoint] = (frequency[endpoint] || 0) + 1;
    });

    return frequency;
  }

  async getRecentUserRequests(userId, limit = 100) {
    // This would typically query a database or cache
    // For demonstration, returning mock data
    return Array.from({ length: limit }, (_, i) => ({
      url: `/api/users/${i % 10}`,
      timestamp: Date.now() - (i * 1000), // 1 second intervals
      method: 'GET'
    }));
  }

  async respondToThreats(threats, req, res) {
    const highestSeverity = Math.max(...threats.map(t => this.getSeverityScore(t.severity)));
    const severityLevel = this.getSeverityLevel(highestSeverity);

    // Log security event
    await this.securityLogger.logSecurityEvent('threat_detected', {
      threats: threats,
      severity: severityLevel,
      ipAddress: req.ip,
      userId: req.user?.id,
      url: req.url,
      method: req.method
    }, severityLevel);

    // Apply appropriate response
    switch (severityLevel) {
      case 'critical':
        // Block immediately
        res.status(403).json({
          error: 'Access Denied',
          message: 'Your request has been blocked due to security concerns.'
        });
        break;

      case 'high':
        // Log and potentially block
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Your request has been rate limited due to suspicious activity.'
        });
        break;

      case 'medium':
        // Log and continue with warning
        res.set('X-Security-Warning', 'Suspicious activity detected');
        // Continue to next middleware
        break;

      default:
        // Log only
        break;
    }
  }

  getSeverityScore(severity) {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 };
    return scores[severity] || 1;
  }

  getSeverityLevel(score) {
    if (score >= 4) return 'critical';
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
}

// Threat detection middleware
export const threatDetection = (threatEngine) => {
  return async (req, res, next) => {
    try {
      const threats = await threatEngine.analyzeRequest(req);

      if (threats.length > 0) {
        await threatEngine.respondToThreats(threats, req, res);
        return; // Response already sent
      }

      next();
    } catch (error) {
      console.error('Threat detection error:', error);
      next(); // Continue on error to avoid blocking legitimate requests
    }
  };
};
```

### 2. Security Dashboard

#### **Real-time Security Monitoring**
```javascript
// Security monitoring dashboard data
class SecurityDashboard {
  constructor(securityLogger, redis) {
    this.securityLogger = securityLogger;
    this.redis = redis;
  }

  async getSecurityOverview(timeRange = '1h') {
    const now = Date.now();
    const timeRangeMs = this.parseTimeRange(timeRange);

    const overview = {
      timeRange: timeRange,
      summary: {
        totalEvents: 0,
        criticalEvents: 0,
        highSeverityEvents: 0,
        activeThreats: 0,
        blockedIPs: 0
      },
      threats: [],
      topAttackers: [],
      recentEvents: []
    };

    // Get security events from Redis
    const events = await this.redis.lrange('security:events', 0, 999);
    const parsedEvents = events.map(e => JSON.parse(e));

    // Filter events by time range
    const recentEvents = parsedEvents.filter(event =>
      now - new Date(event.timestamp).getTime() < timeRangeMs
    );

    overview.summary.totalEvents = recentEvents.length;
    overview.summary.criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    overview.summary.highSeverityEvents = recentEvents.filter(e => e.severity === 'high').length;

    // Get active threats
    const activeAlerts = await this.redis.lrange('security:alerts', 0, 99);
    overview.summary.activeThreats = activeAlerts.filter(alert => {
      const parsed = JSON.parse(alert);
      return parsed.status === 'active';
    }).length;

    // Get blocked IPs
    overview.summary.blockedIPs = await this.redis.scard('blocked_ips');

    // Get top attackers
    overview.topAttackers = await this.getTopAttackers(recentEvents);

    // Get recent events
    overview.recentEvents = recentEvents.slice(0, 20).map(event => ({
      id: event.id,
      type: event.type,
      severity: event.severity,
      timestamp: event.timestamp,
      ipAddress: event.details.ipAddress,
      description: this.getEventDescription(event)
    }));

    return overview;
  }

  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    const multipliers = {
      's': 1000,           // seconds
      'm': 60 * 1000,      // minutes
      'h': 60 * 60 * 1000, // hours
      'd': 24 * 60 * 60 * 1000 // days
    };

    return value * multipliers[unit];
  }

  async getTopAttackers(events) {
    const attackerStats = {};

    events.forEach(event => {
      const ip = event.details.ipAddress;
      if (!attackerStats[ip]) {
        attackerStats[ip] = {
          ipAddress: ip,
          eventCount: 0,
          severity: 'low',
          lastEvent: event.timestamp
        };
      }

      attackerStats[ip].eventCount++;
      attackerStats[ip].lastEvent = event.timestamp;

      // Update severity based on highest event
      if (this.getSeverityScore(event.severity) > this.getSeverityScore(attackerStats[ip].severity)) {
        attackerStats[ip].severity = event.severity;
      }
    });

    return Object.values(attackerStats)
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);
  }

  getSeverityScore(severity) {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 };
    return scores[severity] || 1;
  }

  getEventDescription(event) {
    const descriptions = {
      'sql_injection_attempt': 'SQL injection attempt detected',
      'xss_attempt': 'Cross-site scripting attempt detected',
      'unauthorized_access': 'Unauthorized access attempt',
      'brute_force_attack': 'Brute force attack detected',
      'suspicious_traffic': 'Suspicious traffic pattern',
      'threat_detected': 'Security threat detected',
      'automated_response': 'Automated security response triggered'
    };

    return descriptions[event.type] || `${event.type} event`;
  }

  async getSecurityMetrics(timeRange = '24h') {
    const metrics = {
      eventsByType: {},
      eventsBySeverity: {},
      eventsByHour: {},
      topThreatTypes: [],
      threatTrend: []
    };

    const events = await this.redis.lrange('security:events', 0, 9999);
    const parsedEvents = events.map(e => JSON.parse(e));

    // Filter by time range
    const timeRangeMs = this.parseTimeRange(timeRange);
    const now = Date.now();
    const filteredEvents = parsedEvents.filter(event =>
      now - new Date(event.timestamp).getTime() < timeRangeMs
    );

    // Aggregate by type
    filteredEvents.forEach(event => {
      metrics.eventsByType[event.type] = (metrics.eventsByType[event.type] || 0) + 1;
      metrics.eventsBySeverity[event.severity] = (metrics.eventsBySeverity[event.severity] || 0) + 1;

      const hour = new Date(event.timestamp).getHours();
      metrics.eventsByHour[hour] = (metrics.eventsByHour[hour] || 0) + 1;
    });

    // Get top threat types
    metrics.topThreatTypes = Object.entries(metrics.eventsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    return metrics;
  }

  async getComplianceStatus() {
    const compliance = {
      gdpr: { status: 'compliant', lastChecked: null, violations: 0 },
      sox: { status: 'compliant', lastChecked: null, violations: 0 },
      hipaa: { status: 'not_applicable', lastChecked: null, violations: 0 }
    };

    // This would typically query compliance check results
    // For demonstration, returning mock data
    return compliance;
  }
}

// Security dashboard API endpoints
app.get('/api/security/overview', authenticate, authorize(['security:read']), async (req, res) => {
  try {
    const dashboard = new SecurityDashboard(securityLogger, redis);
    const overview = await dashboard.getSecurityOverview(req.query.timeRange);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get security overview' });
  }
});

app.get('/api/security/metrics', authenticate, authorize(['security:read']), async (req, res) => {
  try {
    const dashboard = new SecurityDashboard(securityLogger, redis);
    const metrics = await dashboard.getSecurityMetrics(req.query.timeRange);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get security metrics' });
  }
});

app.get('/api/security/compliance', authenticate, authorize(['compliance:read']), async (req, res) => {
  try {
    const dashboard = new SecurityDashboard(securityLogger, redis);
    const compliance = await dashboard.getComplianceStatus();
    res.json(compliance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get compliance status' });
  }
});
```

---

## 📋 Security Checklist

### Infrastructure Security
- [ ] Operating system hardened and updated
- [ ] Firewall configured with restrictive rules
- [ ] SSH configured with key-based authentication only
- [ ] Automatic security updates enabled
- [ ] File system permissions properly configured
- [ ] SELinux/AppArmor enabled
- [ ] System monitoring and logging configured

### Application Security
- [ ] Input validation implemented on all endpoints
- [ ] Authentication and authorization properly configured
- [ ] Session management secure
- [ ] Password policies enforced
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Error handling doesn't leak sensitive information

### Data Protection
- [ ] Data encrypted at rest and in transit
- [ ] Database credentials securely stored
- [ ] API keys properly managed
- [ ] Sensitive data masked in logs
- [ ] Backup encryption implemented
- [ ] Data retention policies defined

### Network Security
- [ ] SSL/TLS certificates properly configured
- [ ] HTTPS enforced on all endpoints
- [ ] Web Application Firewall (WAF) implemented
- [ ] DDoS protection configured
- [ ] Network segmentation implemented
- [ ] VPN access for administrative tasks

### Monitoring & Response
- [ ] Security monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Regular security assessments performed
- [ ] Security training provided to team
- [ ] Third-party security reviews conducted
- [ ] Security metrics tracked and reported

### Compliance
- [ ] Data handling complies with relevant regulations
- [ ] Audit logging implemented
- [ ] Access controls properly configured
- [ ] Privacy policies documented
- [ ] Data processing agreements in place
- [ ] Regular compliance audits performed

---

**🔒 Security is an ongoing process that requires continuous monitoring, updates, and improvements. Regular security assessments and staying current with security best practices are essential for maintaining a secure production environment.**

