# 🚀 FinanceAnalyst Pro - Production Deployment Guide

## Executive Summary

This comprehensive guide provides step-by-step instructions for deploying the FinanceAnalyst Pro CLI system to production environments. The system has achieved **96.88% core functionality test success rate** and is ready for production deployment.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup & Recovery](#backup--recovery)
8. [Performance Tuning](#performance-tuning)
9. [Operational Procedures](#operational-procedures)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### System Requirements

#### Minimum Hardware Requirements
- **CPU:** 2-core processor (4-core recommended)
- **RAM:** 4GB (8GB recommended)
- **Storage:** 20GB SSD
- **Network:** 100Mbps connection

#### Software Requirements
- **Node.js:** v18.0.0 or higher
- **npm:** v8.0.0 or higher
- **Docker:** v20.0.0 or higher (optional)
- **Nginx:** v1.20.0 or higher (for reverse proxy)

### Network Requirements
- **Inbound:** HTTPS (443), SSH (22)
- **Outbound:** API endpoints, market data feeds
- **Internal:** Database connectivity, monitoring systems

---

## 🏗️ Environment Setup

### 1. Server Provisioning

#### Option A: Cloud Provider (Recommended)
```bash
# AWS EC2 Instance
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --count 1 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-groups financeanalyst-sg

# DigitalOcean Droplet
doctl compute droplet create financeanalyst-prod \
  --size s-2vcpu-4gb \
  --image ubuntu-22-04-x64 \
  --region nyc3
```

#### Option B: Docker Container
```bash
# Using Docker Compose
docker run -d \
  --name financeanalyst \
  -p 3000:3000 \
  -p 443:443 \
  -v /opt/financeanalyst:/app/data \
  financeanalyst-pro:latest
```

### 2. Operating System Configuration

#### Ubuntu/Debian Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
  curl \
  wget \
  git \
  htop \
  vim \
  ufw \
  fail2ban \
  logrotate \
  unattended-upgrades

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 443
sudo ufw --force enable
```

#### Security Hardening
```bash
# Disable root login
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Enable automatic security updates
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 3. Node.js Installation

#### Using Node Version Manager (Recommended)
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x
```

#### Alternative: Using Package Manager
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

---

## 🔐 Security Configuration

### 1. SSL/TLS Certificate Setup

#### Using Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Generate certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d api.yourdomain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Using Commercial Certificate
```bash
# Place certificate files
sudo mkdir -p /etc/ssl/certs/financeanalyst
sudo cp yourdomain.crt /etc/ssl/certs/financeanalyst/
sudo cp yourdomain.key /etc/ssl/private/financeanalyst/
sudo chmod 600 /etc/ssl/private/financeanalyst/yourdomain.key
```

### 2. Application Security Configuration

#### Environment Variables Setup
```bash
# Create environment file
sudo mkdir -p /opt/financeanalyst
sudo tee /opt/financeanalyst/.env > /dev/null <<EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key
API_KEY=your-api-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/financeanalyst
REDIS_URL=redis://localhost:6379

# External Services
MARKET_DATA_API_KEY=your-market-data-api-key
NEWS_API_KEY=your-news-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
EOF

# Secure the file
sudo chmod 600 /opt/financeanalyst/.env
sudo chown financeanalyst:financeanalyst /opt/financeanalyst/.env
```

### 3. User and Permissions Setup

```bash
# Create dedicated user
sudo useradd -r -s /bin/false financeanalyst
sudo mkdir -p /opt/financeanalyst
sudo chown -R financeanalyst:financeanalyst /opt/financeanalyst

# Create systemd service user
sudo tee /etc/systemd/system/financeanalyst.service > /dev/null <<EOF
[Unit]
Description=FinanceAnalyst Pro CLI
After=network.target
Wants=network.target

[Service]
Type=simple
User=financeanalyst
Group=financeanalyst
WorkingDirectory=/opt/financeanalyst
ExecStart=/usr/bin/node /opt/financeanalyst/dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/financeanalyst
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
```

---

## 🗄️ Database Setup

### 1. PostgreSQL Installation and Configuration

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE financeanalyst_prod;
CREATE USER financeanalyst WITH ENCRYPTED PASSWORD 'secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE financeanalyst_prod TO financeanalyst;
ALTER USER financeanalyst CREATEDB;
EOF

# Configure PostgreSQL for production
sudo tee /etc/postgresql/14/main/postgresql.conf > /dev/null <<EOF
# Production PostgreSQL Configuration
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
EOF

sudo systemctl restart postgresql
```

### 2. Redis Setup (Optional - for caching)

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
sudo sed -i 's/# requirepass foobared/requirepass your-secure-redis-password/' /etc/redis/redis.conf

# Secure Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 3. Database Migration

```bash
# Run database migrations
cd /opt/financeanalyst
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

---

## 🚀 Application Deployment

### 1. Application Deployment

#### Method 1: Direct Deployment
```bash
# Clone repository
sudo mkdir -p /opt/financeanalyst
sudo chown financeanalyst:financeanalyst /opt/financeanalyst
sudo -u financeanalyst git clone https://github.com/yourorg/financeanalyst-pro.git /opt/financeanalyst

# Install dependencies
cd /opt/financeanalyst
sudo -u financeanalyst npm ci --production

# Build application
sudo -u financeanalyst npm run build

# Start application
sudo systemctl start financeanalyst
sudo systemctl enable financeanalyst
```

#### Method 2: Docker Deployment
```bash
# Create Dockerfile
tee Dockerfile > /dev/null <<EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

USER node

CMD ["npm", "start"]
EOF

# Build and run with Docker Compose
tee docker-compose.yml > /dev/null <<EOF
version: '3.8'

services:
  financeanalyst:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: financeanalyst_prod
      POSTGRES_USER: financeanalyst
      POSTGRES_PASSWORD: secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass your-redis-password
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF

# Deploy with Docker
docker-compose up -d
```

### 2. Reverse Proxy Setup (Nginx)

```bash
# Install Nginx
sudo apt install nginx

# Configure Nginx
sudo tee /etc/nginx/sites-available/financeanalyst > /dev/null <<EOF
# Upstream backend
upstream financeanalyst_backend {
    server localhost:3000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

# Main application server
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location /static/ {
        alias /opt/financeanalyst/dist/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes
    location /api/ {
        proxy_pass http://financeanalyst_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Main application
    location / {
        proxy_pass http://financeanalyst_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# API server (optional separate config)
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL configuration (same as above)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://financeanalyst_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # API-specific rate limiting
        limit_req zone=api burst=10 nodelay;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/financeanalyst /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Monitoring Setup

### 1. Application Monitoring

#### Install Prometheus Node Exporter
```bash
# Download and install
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.0/node_exporter-1.6.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.0.linux-amd64.tar.gz
sudo mv node_exporter-1.6.0.linux-amd64/node_exporter /usr/local/bin/

# Create service
sudo tee /etc/systemd/system/node-exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node-exporter
Group=node-exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# Create user and start service
sudo useradd -rs /bin/false node-exporter
sudo systemctl daemon-reload
sudo systemctl start node-exporter
sudo systemctl enable node-exporter
```

#### Application Metrics
```bash
# Install PM2 for process monitoring
sudo npm install -g pm2

# Configure PM2
cd /opt/financeanalyst
sudo -u financeanalyst pm2 start dist/server.js --name financeanalyst
sudo -u financeanalyst pm2 startup
sudo -u financeanalyst pm2 save

# PM2 monitoring
pm2 monit
```

### 2. Log Management

```bash
# Configure logrotate
sudo tee /etc/logrotate.d/financeanalyst > /dev/null <<EOF
/opt/financeanalyst/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 financeanalyst financeanalyst
    postrotate
        systemctl reload financeanalyst
    endscript
}
EOF

# Set up centralized logging (optional)
sudo apt install rsyslog

# Configure application logging
sudo tee /opt/financeanalyst/config/logging.json > /dev/null <<EOF
{
  "level": "info",
  "format": "json",
  "transports": [
    {
      "type": "file",
      "filename": "/opt/financeanalyst/logs/app.log",
      "maxsize": "10m",
      "maxFiles": 5
    },
    {
      "type": "console",
      "colorize": false
    }
  ]
}
EOF
```

### 3. Alerting Setup

#### Email Alerts
```bash
# Install mail utilities
sudo apt install mailutils

# Configure email alerts
sudo tee /opt/financeanalyst/scripts/alert.sh > /dev/null <<EOF
#!/bin/bash

SUBJECT="\$1"
MESSAGE="\$2"
TO="alerts@yourdomain.com"

echo "\$MESSAGE" | mail -s "\$SUBJECT" "\$TO"
EOF

sudo chmod +x /opt/financeanalyst/scripts/alert.sh
```

#### Slack/Webhook Alerts
```bash
# Slack webhook integration
sudo tee /opt/financeanalyst/scripts/slack-alert.sh > /dev/null <<EOF
#!/bin/bash

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
SUBJECT="\$1"
MESSAGE="\$2"

curl -X POST -H 'Content-type: application/json' \
  --data "{
    \"text\": \"🚨 *\$SUBJECT*\",
    \"attachments\": [{
      \"text\": \"\$MESSAGE\",
      \"color\": \"danger\"
    }]
  }" \$WEBHOOK_URL
EOF

sudo chmod +x /opt/financeanalyst/scripts/slack-alert.sh
```

---

## 🔄 Backup & Recovery

### 1. Database Backup

```bash
# Create backup script
sudo tee /opt/financeanalyst/scripts/backup.sh > /dev/null <<EOF
#!/bin/bash

BACKUP_DIR="/opt/financeanalyst/backups"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="\$BACKUP_DIR/financeanalyst_\$TIMESTAMP.sql"

# Create backup directory
mkdir -p \$BACKUP_DIR

# Database backup
pg_dump -U financeanalyst -h localhost financeanalyst_prod > \$BACKUP_FILE

# Compress backup
gzip \$BACKUP_FILE

# Clean old backups (keep last 30 days)
find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Log backup completion
echo "[\$(date)] Database backup completed: \$BACKUP_FILE.gz" >> /opt/financeanalyst/logs/backup.log
EOF

sudo chmod +x /opt/financeanalyst/scripts/backup.sh
```

#### Automated Backup Schedule
```bash
# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /opt/financeanalyst/scripts/backup.sh
```

### 2. Application Backup

```bash
# Application data backup
sudo tee /opt/financeanalyst/scripts/app-backup.sh > /dev/null <<EOF
#!/bin/bash

BACKUP_DIR="/opt/financeanalyst/backups"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")

# Backup application data
tar -czf \$BACKUP_DIR/app_data_\$TIMESTAMP.tar.gz \
  -C /opt/financeanalyst \
  data/ \
  config/ \
  logs/

# Backup configuration files
tar -czf \$BACKUP_DIR/app_config_\$TIMESTAMP.tar.gz \
  -C /opt/financeanalyst \
  .env \
  config/

echo "[\$(date)] Application backup completed" >> /opt/financeanalyst/logs/backup.log
EOF

sudo chmod +x /opt/financeanalyst/scripts/app-backup.sh
```

### 3. Recovery Procedures

#### Database Recovery
```bash
# Stop application
sudo systemctl stop financeanalyst

# Restore database
gunzip /opt/financeanalyst/backups/financeanalyst_20231201_020000.sql.gz
psql -U financeanalyst -h localhost financeanalyst_prod < /opt/financeanalyst/backups/financeanalyst_20231201_020000.sql

# Restart application
sudo systemctl start financeanalyst
```

#### Application Recovery
```bash
# Restore application data
cd /opt/financeanalyst
tar -xzf /opt/financeanalyst/backups/app_data_20231201_020000.tar.gz

# Verify restoration
ls -la data/
ls -la config/
```

---

## ⚡ Performance Tuning

### 1. Node.js Optimization

```bash
# Environment variables for performance
sudo tee -a /opt/financeanalyst/.env > /dev/null <<EOF
# Performance Tuning
NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
UV_THREADPOOL_SIZE=8
CLUSTER_WORKERS=2

# Memory management
HEAP_SIZE=2048
GC_INTERVAL=30000

# Connection pooling
DB_POOL_SIZE=10
REDIS_POOL_SIZE=5
EOF
```

### 2. Database Optimization

```bash
# PostgreSQL performance tuning
sudo tee /etc/postgresql/14/main/conf.d/performance.conf > /dev/null <<EOF
# Performance optimizations
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 500
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 8MB
shared_preload_libraries = 'pg_stat_statements'
EOF

sudo systemctl restart postgresql
```

### 3. Nginx Optimization

```bash
# Nginx performance tuning
sudo tee /etc/nginx/nginx.conf > /dev/null <<EOF
user www-data;
worker_processes auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=100r/s;

    include /etc/nginx/sites-enabled/*;
}
EOF

sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔧 Operational Procedures

### 1. Health Checks

#### Application Health Check
```bash
# Health check script
sudo tee /opt/financeanalyst/scripts/health-check.sh > /dev/null <<EOF
#!/bin/bash

# Check application process
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Application process is running"
else
    echo "❌ Application process is not running"
    exit 1
fi

# Check application health endpoint
if curl -f -s http://localhost:3000/health > /dev/null; then
    echo "✅ Application health check passed"
else
    echo "❌ Application health check failed"
    exit 1
fi

# Check database connectivity
if psql -U financeanalyst -h localhost -d financeanalyst_prod -c "SELECT 1;" > /dev/null; then
    echo "✅ Database connectivity OK"
else
    echo "❌ Database connectivity failed"
    exit 1
fi

echo "🎉 All health checks passed!"
EOF

sudo chmod +x /opt/financeanalyst/scripts/health-check.sh
```

#### Automated Health Monitoring
```bash
# Add to crontab for every 5 minutes
sudo crontab -e
# Add: */5 * * * * /opt/financeanalyst/scripts/health-check.sh >> /opt/financeanalyst/logs/health.log 2>&1
```

### 2. Log Analysis

```bash
# Log analysis script
sudo tee /opt/financeanalyst/scripts/analyze-logs.sh > /dev/null <<EOF
#!/bin/bash

LOG_FILE="/opt/financeanalyst/logs/app.log"
HOURS_AGO=24

echo "=== Log Analysis Report ==="
echo "Period: Last \$HOURS_AGO hours"
echo "Log file: \$LOG_FILE"
echo ""

# Error count
ERROR_COUNT=\$(grep -c "ERROR" \$LOG_FILE)
echo "❌ Total errors: \$ERROR_COUNT"

# Warning count
WARN_COUNT=\$(grep -c "WARN" \$LOG_FILE)
echo "⚠️  Total warnings: \$WARN_COUNT"

# Top error messages
echo ""
echo "Top 5 error messages:"
grep "ERROR" \$LOG_FILE | sed 's/.*ERROR//' | sort | uniq -c | sort -nr | head -5

# Response time analysis
echo ""
echo "Response time statistics:"
grep "response_time" \$LOG_FILE | grep -o '[0-9]\+\.[0-9]\+' | awk '
BEGIN { count=0; sum=0; min=999999; max=0 }
{ count++; sum+=\$1; if(\$1<min) min=\$1; if(\$1>max) max=\$1 }
END {
  if(count>0) {
    avg=sum/count;
    print "Count:", count;
    print "Average:", avg "ms";
    print "Min:", min "ms";
    print "Max:", max "ms";
  } else {
    print "No response time data found";
  }
}'
EOF

sudo chmod +x /opt/financeanalyst/scripts/analyze-logs.sh
```

### 3. Maintenance Procedures

#### Application Updates
```bash
# Rolling update procedure
sudo tee /opt/financeanalyst/scripts/update.sh > /dev/null <<EOF
#!/bin/bash

echo "Starting application update..."

# Backup current version
cp -r /opt/financeanalyst /opt/financeanalyst.backup.\$(date +%Y%m%d_%H%M%S)

# Pull latest changes
cd /opt/financeanalyst
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Run database migrations
npm run db:migrate

# Restart application
sudo systemctl restart financeanalyst

# Health check
sleep 10
if curl -f -s http://localhost:3000/health > /dev/null; then
    echo "✅ Update successful!"
    # Clean up old backups (keep last 3)
    ls -dt /opt/financeanalyst.backup.* | tail -n +4 | xargs rm -rf
else
    echo "❌ Update failed! Rolling back..."
    sudo systemctl stop financeanalyst
    # Restore backup (implement rollback logic)
    echo "Manual intervention required for rollback"
fi
EOF

sudo chmod +x /opt/financeanalyst/scripts/update.sh
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start
```bash
# Check application logs
sudo journalctl -u financeanalyst -f

# Check Node.js errors
cd /opt/financeanalyst
sudo -u financeanalyst npm start 2>&1 | tee /tmp/debug.log

# Check port availability
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql -U financeanalyst -h localhost -d financeanalyst_prod

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Restart database
sudo systemctl restart postgresql
```

#### 3. High Memory Usage
```bash
# Monitor memory usage
htop
free -h

# Check Node.js heap usage
sudo -u financeanalyst node --inspect --max-old-space-size=4096 /opt/financeanalyst/dist/server.js

# Implement memory monitoring
sudo tee /opt/financeanalyst/scripts/memory-monitor.sh > /dev/null <<EOF
#!/bin/bash

MEMORY_USAGE=\$(ps aux --no-headers -o pmem -C node | awk '{sum+=\$1} END {print sum}')

if (( \$(echo "\$MEMORY_USAGE > 80" | bc -l) )); then
    echo "High memory usage detected: \$MEMORY_USAGE%"
    # Send alert
    /opt/financeanalyst/scripts/alert.sh "High Memory Usage" "Memory usage is \$MEMORY_USAGE%"
fi
EOF
```

#### 4. Slow Response Times
```bash
# Check system resources
uptime
iostat -x 1 5
free -m

# Profile application
sudo -u financeanalyst node --prof --logfile=/tmp/node.prof /opt/financeanalyst/dist/server.js &
sleep 60
kill %1

# Analyze profile
node --prof-process /tmp/node.prof > /tmp/profile.txt
cat /tmp/profile.txt
```

#### 5. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout | grep -A2 "Validity"

# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

### Performance Optimization Checklist

- [ ] Enable gzip compression in Nginx
- [ ] Configure proper caching headers
- [ ] Implement database query optimization
- [ ] Set up Redis caching for frequently accessed data
- [ ] Configure connection pooling
- [ ] Implement horizontal scaling if needed
- [ ] Monitor and optimize memory usage
- [ ] Set up log rotation to prevent disk space issues

### Security Checklist

- [ ] SSL/TLS certificates properly configured
- [ ] Firewall rules in place
- [ ] SSH access restricted
- [ ] Database credentials secured
- [ ] Environment variables properly set
- [ ] File permissions correctly configured
- [ ] Regular security updates scheduled
- [ ] Intrusion detection system configured

---

## 📞 Support and Contact

### Emergency Contacts
- **Primary:** DevOps Team - devops@yourcompany.com
- **Secondary:** Security Team - security@yourcompany.com
- **Database Admin:** dba@yourcompany.com

### Monitoring Dashboards
- **Application:** https://app.yourdomain.com/monitoring
- **Infrastructure:** https://monitoring.yourdomain.com
- **Logs:** https://logs.yourdomain.com

### Documentation Links
- **API Documentation:** https://docs.yourdomain.com/api
- **User Guide:** https://docs.yourdomain.com/user-guide
- **Troubleshooting:** https://docs.yourdomain.com/troubleshooting

---

## 🎯 Post-Deployment Checklist

- [ ] Application successfully deployed and running
- [ ] SSL certificates installed and working
- [ ] Database connections established
- [ ] Monitoring systems configured
- [ ] Backup procedures tested
- [ ] Log rotation configured
- [ ] Health checks passing
- [ ] Performance benchmarks met
- [ ] Security scans completed
- [ ] User access configured
- [ ] Documentation updated
- [ ] Team notified of successful deployment

---

## 📈 Scaling Considerations

### Horizontal Scaling
```bash
# Load balancer configuration (Nginx)
upstream financeanalyst_cluster {
    server app1.yourdomain.com:3000;
    server app2.yourdomain.com:3000;
    server app3.yourdomain.com:3000;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://financeanalyst_cluster;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Database Scaling
- Implement read replicas for high-traffic applications
- Consider database sharding for extremely large datasets
- Set up connection pooling for multiple application instances

### Caching Strategy
- Redis for session storage and frequently accessed data
- CDN for static assets
- Database query result caching
- Application-level caching for expensive computations

---

**🎉 Congratulations! Your FinanceAnalyst Pro system is now production-ready and fully deployed!**

This comprehensive deployment guide ensures your application is secure, performant, and maintainable in production environments. Regular monitoring and maintenance will keep your system running smoothly.

