# ⚡ Performance Optimization Guide

## Executive Summary

This comprehensive guide provides performance optimization strategies for the FinanceAnalyst Pro system. It covers application-level optimizations, infrastructure tuning, database optimization, and monitoring strategies to ensure optimal performance under production workloads.

---

## 📋 Table of Contents

1. [Performance Benchmarks](#performance-benchmarks)
2. [Application Optimization](#application-optimization)
3. [Database Optimization](#database-optimization)
4. [Infrastructure Optimization](#infrastructure-optimization)
5. [Caching Strategies](#caching-strategies)
6. [Load Testing](#load-testing)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Performance Troubleshooting](#performance-troubleshooting)

---

## 📊 Performance Benchmarks

### Target Performance Metrics

#### **Response Time Targets**
```
API Response Times:
- Health endpoints: < 100ms (95th percentile)
- Simple queries: < 200ms (95th percentile)
- Complex calculations: < 2s (95th percentile)
- Report generation: < 10s (95th percentile)
- Data exports: < 30s (95th percentile)

Page Load Times:
- Initial page load: < 2s
- Interactive content: < 3s
- Full page load: < 5s
```

#### **Throughput Targets**
```
Concurrent Users: 1,000+
Requests per Second: 500+
Database Queries per Second: 2,000+
Cache Hit Rate: > 95%
Error Rate: < 0.1%
```

#### **Resource Utilization Targets**
```
CPU Usage: < 70% sustained
Memory Usage: < 80% of available
Disk I/O: < 80% utilization
Network I/O: < 70% utilization
Database Connections: < 80% of max
```

### Performance Test Scenarios

#### **Load Testing Scenarios**
```
1. Normal Load (Baseline)
   - 100 concurrent users
   - 50 RPS
   - Duration: 30 minutes

2. Peak Load (Stress Test)
   - 500 concurrent users
   - 250 RPS
   - Duration: 15 minutes

3. Spike Load (Burst Test)
   - 1,000 concurrent users
   - 500 RPS
   - Duration: 5 minutes

4. Endurance Test
   - 200 concurrent users
   - 100 RPS
   - Duration: 2 hours

5. Breakpoint Test
   - Gradual increase until failure
   - Monitor resource utilization
   - Identify bottleneck points
```

---

## 🚀 Application Optimization

### 1. Code Optimization

#### **Memory Management**
```javascript
// Optimize memory usage in Node.js
const v8 = require('v8');

// Monitor heap usage
setInterval(() => {
  const heapStats = v8.getHeapStatistics();
  const used = Math.round(heapStats.used_heap_size / 1024 / 1024);
  const total = Math.round(heapStats.heap_size_limit / 1024 / 1024);

  if (used > total * 0.8) {
    console.warn(`High memory usage: ${used}MB / ${total}MB`);
  }
}, 30000);

// Force garbage collection in development (not production)
if (process.env.NODE_ENV === 'development') {
  global.gc && setInterval(() => global.gc(), 60000);
}
```

#### **Connection Pooling**
```javascript
// Database connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_SIZE) || 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  acquireTimeoutMillis: 60000,
});

// Redis connection pooling
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 60000,
    lazyConnect: true,
  },
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});
```

#### **Async/Await Optimization**
```javascript
// Optimize async operations
class AsyncOptimizer {
  constructor() {
    this.semaphore = new Semaphore(10); // Limit concurrent operations
  }

  async processBatch(items, batchSize = 5) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => this.processItem(item));
      const batchResults = await Promise.allSettled(batchPromises);

      results.push(...batchResults);
    }

    return results;
  }

  async processItem(item) {
    return await this.semaphore.acquire(async () => {
      // Process item with concurrency control
      return await this.performExpensiveOperation(item);
    });
  }
}

// Semaphore implementation
class Semaphore {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.currentConcurrent = 0;
    this.waitQueue = [];
  }

  async acquire(fn) {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.currentConcurrent++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.currentConcurrent--;
          if (this.waitQueue.length > 0) {
            const next = this.waitQueue.shift();
            next();
          }
        }
      };

      if (this.currentConcurrent < this.maxConcurrent) {
        execute();
      } else {
        this.waitQueue.push(execute);
      }
    });
  }
}
```

### 2. API Optimization

#### **Response Compression**
```javascript
// Enable compression middleware
import compression from 'compression';

app.use(compression({
  level: 6, // Balance between speed and compression
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));
```

#### **Request Caching**
```javascript
// Implement response caching
import apicache from 'apicache';

const cache = apicache.middleware;

// Cache static responses for 5 minutes
app.use('/api/v1/markets', cache('5 minutes'), marketsRouter);

// Cache dynamic responses for 1 minute
app.use('/api/v1/portfolio/summary', cache('1 minute'), portfolioRouter);

// Custom cache key generator
const cacheKeyGenerator = (req) => {
  return `${req.method}-${req.originalUrl}-${JSON.stringify(req.query)}-${req.user?.id || 'anonymous'}`;
};

app.use('/api/v1/user/data', cache('2 minutes', { keyGenerator: cacheKeyGenerator }), userRouter);
```

#### **Pagination Optimization**
```javascript
// Implement efficient pagination
class PaginatedResponse {
  constructor(query, page = 1, limit = 20) {
    this.page = parseInt(page);
    this.limit = Math.min(parseInt(limit), 100); // Max 100 items per page
    this.offset = (this.page - 1) * this.limit;
  }

  async execute() {
    const [results, total] = await Promise.all([
      this.query.limit(this.limit).offset(this.offset),
      this.query.count()
    ]);

    return {
      data: results,
      pagination: {
        page: this.page,
        limit: this.limit,
        total: total,
        totalPages: Math.ceil(total / this.limit),
        hasNext: this.page * this.limit < total,
        hasPrev: this.page > 1
      }
    };
  }
}

// Usage
app.get('/api/v1/transactions', async (req, res) => {
  const paginatedQuery = new PaginatedResponse(
    Transaction.query()
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc'),
    req.query.page,
    req.query.limit
  );

  const result = await paginatedQuery.execute();
  res.json(result);
});
```

### 3. Background Job Optimization

#### **Job Queue Management**
```javascript
// Optimize job processing with Bull
import Queue from 'bull';
import { createClient } from 'redis';

// Job queue configuration
const jobQueue = new Queue('finance-calculations', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Job processor with concurrency control
jobQueue.process('dcf-calculation', 3, async (job) => {
  const { inputs, userId } = job.data;

  // Process DCF calculation
  const result = await calculateDCF(inputs);

  // Store result in cache
  await redisClient.setex(
    `dcf:${userId}:${inputs.symbol}`,
    3600, // 1 hour
    JSON.stringify(result)
  );

  return result;
});

// Job monitoring
jobQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

jobQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  // Send alert for failed jobs
  sendAlert('Job Failed', `Job ${job.id} failed: ${err.message}`);
});
```

---

## 🗄️ Database Optimization

### 1. Query Optimization

#### **Index Strategy**
```sql
-- Essential indexes for FinanceAnalyst
CREATE INDEX CONCURRENTLY idx_transactions_user_date
ON transactions (user_id, transaction_date DESC);

CREATE INDEX CONCURRENTLY idx_transactions_symbol
ON transactions (symbol, transaction_date DESC);

CREATE INDEX CONCURRENTLY idx_portfolio_holdings_user
ON portfolio_holdings (user_id, symbol);

CREATE INDEX CONCURRENTLY idx_market_data_symbol_date
ON market_data (symbol, date DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_active_portfolios
ON portfolios (user_id, updated_at DESC)
WHERE is_active = true;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_user_transactions_filtered
ON transactions (user_id, transaction_type, transaction_date DESC)
WHERE amount > 0;
```

#### **Query Performance Monitoring**
```sql
-- Enable query performance monitoring
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Monitor slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries taking > 1 second on average
ORDER BY mean_time DESC
LIMIT 10;

-- Identify missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 1000
  AND correlation < 0.5
ORDER BY n_distinct DESC;
```

#### **Connection Pool Optimization**
```javascript
// Optimize database connection pool
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 60000,
  // Enable statement caching
  statement_timeout: 60000,
  query_timeout: 30000,
  // Connection validation
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
};
```

### 2. Database Maintenance

#### **Automated Maintenance Script**
```bash
#!/bin/bash
# Database Maintenance Script

echo "Starting database maintenance..."

# Vacuum and analyze
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
VACUUM ANALYZE;
EOF

# Reindex system catalogs
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
REINDEX SYSTEM financeanalyst_prod;
EOF

# Update table statistics
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
ANALYZE;
EOF

# Check for bloated tables
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
SELECT
  schemaname,
  tablename,
  n_dead_tup,
  n_live_tup,
  ROUND(n_dead_tup::numeric / (n_live_tup + n_dead_tup) * 100, 2) as bloat_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY bloat_ratio DESC;
EOF

echo "Database maintenance completed"
```

#### **Partitioning Strategy**
```sql
-- Implement table partitioning for large datasets
CREATE TABLE transactions_y2023m12 PARTITION OF transactions
FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');

CREATE TABLE transactions_y2024m01 PARTITION OF transactions
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Create partitioned table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (transaction_date);

-- Automatic partition creation function
CREATE OR REPLACE FUNCTION create_transaction_partition(start_date DATE, end_date DATE)
RETURNS VOID AS \$\$
DECLARE
  partition_name TEXT;
  partition_range TEXT;
BEGIN
  partition_name := 'transactions_y' || TO_CHAR(start_date, 'YYYY') || 'm' || TO_CHAR(start_date, 'MM');
  partition_range := format('FOR VALUES FROM (%L) TO (%L)', start_date, end_date);

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF transactions %s', partition_name, partition_range);
END;
\$\$ LANGUAGE plpgsql;
```

### 3. Replication and High Availability

#### **Read Replica Configuration**
```sql
-- Enable logical replication
ALTER SYSTEM SET wal_level = 'logical';
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;

-- Create publication for read replicas
CREATE PUBLICATION financeanalyst_pub FOR ALL TABLES;

-- Create subscription on replica
CREATE SUBSCRIPTION financeanalyst_sub
CONNECTION 'host=primary-host port=5432 user=replication_user dbname=financeanalyst_prod'
PUBLICATION financeanalyst_pub;

-- Monitor replication lag
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  EXTRACT(EPOCH FROM (now() - write_lag)) as write_lag_seconds,
  EXTRACT(EPOCH FROM (now() - flush_lag)) as flush_lag_seconds,
  EXTRACT(EPOCH FROM (now() - replay_lag)) as replay_lag_seconds
FROM pg_stat_replication;
```

---

## 🏗️ Infrastructure Optimization

### 1. Server Optimization

#### **System Tuning**
```bash
#!/bin/bash
# System Performance Tuning Script

# Kernel parameters optimization
cat >> /etc/sysctl.conf << EOF
# Network optimization
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.ip_local_port_range = 1024 65535
net.core.netdev_max_backlog = 5000

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 20
vm.dirty_background_ratio = 10

# File system optimization
fs.file-max = 2097152
EOF

sysctl -p

# Limits configuration
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# Disable transparent huge pages (for databases)
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag

# Make changes persistent
cat >> /etc/rc.local << EOF
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
EOF
```

#### **Nginx Optimization**
```nginx
# Optimized Nginx configuration
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
    client_max_body_size 50M;

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
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=1000r/m;

    # Upstream configuration
    upstream financeanalyst_backend {
        least_conn;
        server app1:3000 weight=10 max_fails=3 fail_timeout=30s;
        server app2:3000 weight=10 max_fails=3 fail_timeout=30s;
        server app3:3000 weight=10 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL optimization
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API endpoints
        location /api/ {
            proxy_pass http://financeanalyst_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;

            # Rate limiting for API
            limit_req zone=api burst=20 nodelay;
        }

        # Static files caching
        location /static/ {
            alias /opt/financeanalyst/dist/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # Main application
        location / {
            proxy_pass http://financeanalyst_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Rate limiting for general traffic
            limit_req zone=general burst=100 nodelay;
        }
    }
}
```

### 2. Container Optimization

#### **Docker Performance Tuning**
```dockerfile
# Optimized Dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=nodejs:nodejs . .

# Build application
RUN npm run build

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### **Docker Compose Optimization**
```yaml
version: '3.8'

services:
  financeanalyst:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    image: financeanalyst-pro:latest
    container_name: financeanalyst-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=2048
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s

  postgres:
    image: postgres:14-alpine
    container_name: financeanalyst-db
    environment:
      - POSTGRES_DB=financeanalyst_prod
      - POSTGRES_USER=financeanalyst
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - app-network
    command: >
      postgres
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100

  redis:
    image: redis:7-alpine
    container_name: financeanalyst-cache
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - app-network
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

---

## 💾 Caching Strategies

### 1. Multi-Level Caching

#### **Application-Level Caching**
```javascript
// Implement multi-level caching strategy
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = createClient({ url: process.env.REDIS_URL });
    this.cacheTTL = {
      marketData: 300,    // 5 minutes
      userData: 600,      // 10 minutes
      calculations: 1800, // 30 minutes
      reports: 3600       // 1 hour
    };
  }

  async get(key, fetchFunction, ttl = 300) {
    // Check memory cache first (L1)
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // Check Redis cache (L2)
    try {
      const cached = await this.redisClient.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        this.memoryCache.set(key, data); // Populate L1
        return data;
      }
    } catch (error) {
      console.warn('Redis cache error:', error);
    }

    // Fetch from source (L3)
    const data = await fetchFunction();

    // Cache in Redis
    await this.redisClient.setex(key, ttl, JSON.stringify(data));

    // Cache in memory
    this.memoryCache.set(key, data);

    return data;
  }

  async invalidate(pattern) {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear Redis cache
    const keys = await this.redisClient.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  // Cache warming for frequently accessed data
  async warmCache() {
    const warmUpQueries = [
      { key: 'market_indices', ttl: 300 },
      { key: 'popular_symbols', ttl: 600 },
      { key: 'system_config', ttl: 3600 }
    ];

    for (const query of warmUpQueries) {
      try {
        await this.get(query.key, () => this.fetchWarmData(query.key), query.ttl);
      } catch (error) {
        console.warn(`Failed to warm cache for ${query.key}:`, error);
      }
    }
  }
}
```

#### **Database Query Caching**
```javascript
// Implement query result caching
class QueryCache {
  constructor(pool) {
    this.pool = pool;
    this.cache = new Map();
  }

  async query(text, params = [], ttl = 300) {
    const key = this.generateKey(text, params);

    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < ttl * 1000) {
        return cached.result;
      } else {
        this.cache.delete(key);
      }
    }

    // Execute query
    const result = await this.pool.query(text, params);

    // Cache result
    this.cache.set(key, {
      result: result,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup();
    }

    return result;
  }

  generateKey(text, params) {
    return `${text}:${JSON.stringify(params)}`;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 3600000) { // 1 hour
        this.cache.delete(key);
      }
    }
  }
}
```

### 2. CDN Integration

#### **Static Asset Optimization**
```javascript
// CDN integration for static assets
class CDNManager {
  constructor(cdnUrl) {
    this.cdnUrl = cdnUrl;
    this.assetVersions = new Map();
  }

  getAssetUrl(assetPath, version = null) {
    if (!version) {
      version = this.assetVersions.get(assetPath) || Date.now();
      this.assetVersions.set(assetPath, version);
    }

    return `${this.cdnUrl}${assetPath}?v=${version}`;
  }

  async purgeCache(assetPath) {
    // Implement CDN cache purging
    const response = await fetch(`${this.cdnUrl}/purge/${assetPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CDN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CDN purge failed: ${response.statusText}`);
    }
  }

  // Preload critical assets
  async preloadAssets(assetPaths) {
    const preloadPromises = assetPaths.map(path => {
      return fetch(this.getAssetUrl(path), {
        method: 'HEAD' // Just check if asset exists
      });
    });

    await Promise.allSettled(preloadPromises);
  }
}
```

---

## 🧪 Load Testing

### 1. Load Testing Setup

#### **K6 Load Testing Script**
```javascript
// k6 load testing script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
  },
};

// Authentication
const BASE_URL = __ENV.BASE_URL || 'https://staging.yourdomain.com';
const USERNAME = __ENV.USERNAME || 'testuser';
const PASSWORD = __ENV.PASSWORD || 'testpass';

let authToken;

export function setup() {
  // Login and get auth token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    username: USERNAME,
    password: PASSWORD,
  });

  check(loginResponse, {
    'login successful': (r) => r.status === 200,
  });

  authToken = loginResponse.json('token');
}

export default function () {
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  // Test different API endpoints
  const responses = {
    health: http.get(`${BASE_URL}/api/health`, params),
    portfolio: http.get(`${BASE_URL}/api/portfolio`, params),
    marketData: http.get(`${BASE_URL}/api/markets/AAPL`, params),
    calculation: http.post(`${BASE_URL}/api/calculate/dcf`, JSON.stringify({
      symbol: 'AAPL',
      assumptions: { growthRate: 0.05, discountRate: 0.10 }
    }), params),
  };

  // Check responses
  check(responses.health, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });

  check(responses.portfolio, {
    'portfolio status is 200': (r) => r.status === 200,
    'portfolio response time < 500ms': (r) => r.timings.duration < 500,
  });

  check(responses.marketData, {
    'market data status is 200': (r) => r.status === 200,
    'market data response time < 300ms': (r) => r.timings.duration < 300,
  });

  check(responses.calculation, {
    'calculation status is 200': (r) => r.status === 200,
    'calculation response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  // Track errors
  errorRate.add(responses.health.status !== 200);
  errorRate.add(responses.portfolio.status !== 200);
  errorRate.add(responses.marketData.status !== 200);
  errorRate.add(responses.calculation.status !== 200);

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

export function teardown() {
  // Cleanup if needed
}
```

#### **JMeter Test Plan**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.5">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="FinanceAnalyst Load Test" enabled="true">
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_URL" elementType="Argument">
            <stringProp name="Argument.name">BASE_URL</stringProp>
            <stringProp name="Argument.value">https://staging.yourdomain.com</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Load Test Group" enabled="true">
        <intProp name="ThreadGroup.num_threads">100</intProp>
        <intProp name="ThreadGroup.ramp_time">60</intProp>
        <longProp name="ThreadGroup.duration">300</longProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="API Health Check" enabled="true">
          <stringProp name="HTTPSampler.domain">${BASE_URL}</stringProp>
          <stringProp name="HTTPSampler.path">/api/health</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
        </HTTPSamplerProxy>
        <hashTree>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Response Code Assertion" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="49">200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message"></stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">1</intProp>
          </ResponseAssertion>
        </hashTree>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

### 2. Load Testing Execution

#### **Automated Load Testing Pipeline**
```bash
#!/bin/bash
# Automated Load Testing Script

# Configuration
K6_SCRIPT="load-test.js"
JMETER_PLAN="load-test.jmx"
DURATION="300"  # 5 minutes
USERS="100"
RESULTS_DIR="./load-test-results/$(date +%Y%m%d_%H%M%S)"

mkdir -p "$RESULTS_DIR"

echo "Starting automated load testing..."

# Run K6 tests
echo "Running K6 load tests..."
k6 run \
  --out json="$RESULTS_DIR/k6-results.json" \
  --out influxdb=http://localhost:8086/k6 \
  -e BASE_URL="$BASE_URL" \
  -e USERS="$USERS" \
  -e DURATION="$DURATION" \
  "$K6_SCRIPT" > "$RESULTS_DIR/k6-output.log" 2>&1

# Run JMeter tests
echo "Running JMeter load tests..."
jmeter -n \
  -t "$JMETER_PLAN" \
  -l "$RESULTS_DIR/jmeter-results.jtl" \
  -e -o "$RESULTS_DIR/jmeter-report" \
  -Jusers="$USERS" \
  -Jduration="$DURATION"

# Generate performance report
echo "Generating performance report..."
cat > "$RESULTS_DIR/performance-report.md" << EOF
# Load Testing Results
Date: $(date)
Duration: ${DURATION}s
Users: $USERS

## K6 Results
$(cat "$RESULTS_DIR/k6-output.log" | grep -E "(http_req_duration|http_req_failed|checks)" | tail -10)

## JMeter Results
See: $RESULTS_DIR/jmeter-report/index.html

## Recommendations
$(if grep -q "http_req_failed.*rate<0.1" "$RESULTS_DIR/k6-output.log"; then
  echo "✅ Load test passed - system can handle $USERS concurrent users"
else
  echo "⚠️ Load test issues detected - review results for bottlenecks"
fi)
EOF

echo "Load testing completed. Results in: $RESULTS_DIR"
```

---

## 📊 Monitoring & Alerting

### 1. Performance Monitoring Dashboard

#### **Key Performance Metrics**
```javascript
// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    // Record metrics
    recordMetric('http_request_duration', duration, {
      method: req.method,
      endpoint: req.route?.path || req.path,
      status: res.statusCode,
      userAgent: req.get('User-Agent')?.substring(0, 100)
    });

    // Alert on slow requests
    if (duration > 5000) { // 5 seconds
      alertSlowRequest(req, res, duration);
    }
  });

  next();
};

// Memory usage monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  recordMetric('memory_usage', memUsage.heapUsed / 1024 / 1024, {
    type: 'heap_used'
  });
  recordMetric('memory_usage', memUsage.heapTotal / 1024 / 1024, {
    type: 'heap_total'
  });
}, 30000);

// Database connection monitoring
setInterval(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT count(*) as connections FROM pg_stat_activity');
    recordMetric('db_connections', result.rows[0].connections);
    client.release();
  } catch (error) {
    console.error('Database monitoring error:', error);
  }
}, 60000);
```

### 2. Performance Alerting

#### **Response Time Alerts**
```yaml
# Prometheus alerting rules for performance
groups:
  - name: performance.alerts
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="financeanalyst"}[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      - alert: CriticalResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="financeanalyst"}[5m])) > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical response time detected"
          description: "95th percentile response time is {{ $value }}s"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"[5]", job="financeanalyst"}[5m]) / rate(http_requests_total{job="financeanalyst"}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | printf \"%.2f\" }}%"
```

### 3. Performance Troubleshooting Tools

#### **Performance Profiling**
```javascript
// Application performance profiling
const profiler = require('v8-profiler-node8');

class PerformanceProfiler {
  constructor() {
    this.profiles = new Map();
  }

  startProfiling(name) {
    const profile = profiler.startProfiling(name, true);
    this.profiles.set(name, profile);
    return name;
  }

  stopProfiling(name) {
    const profile = this.profiles.get(name);
    if (!profile) {
      throw new Error(`Profile ${name} not found`);
    }

    profiler.stopProfiling(name);
    const profileData = profile.export();

    // Save profile data
    const filename = `profile-${name}-${Date.now()}.cpuprofile`;
    require('fs').writeFileSync(filename, JSON.stringify(profileData, null, 2));

    this.profiles.delete(name);
    return filename;
  }

  // Memory heap snapshot
  takeHeapSnapshot() {
    const snapshot = profiler.takeSnapshot();
    const filename = `heap-${Date.now()}.heapsnapshot`;
    snapshot.export((error, result) => {
      if (error) {
        console.error('Heap snapshot error:', error);
      } else {
        require('fs').writeFileSync(filename, result);
      }
      snapshot.delete();
    });
    return filename;
  }
}
```

---

## 🔍 Performance Troubleshooting

### Common Performance Issues

#### **Memory Leaks**
```javascript
// Memory leak detection
const memwatch = require('memwatch-next');

memwatch.on('leak', (info) => {
  console.error('Memory leak detected:', info);
  alertMemoryLeak(info);
});

memwatch.on('stats', (stats) => {
  console.log('Memory stats:', stats);
  recordMetric('memory_stats', stats.used_heap_size, { type: 'heap_size' });
  recordMetric('memory_stats', stats.heap_size_limit, { type: 'heap_limit' });
});
```

#### **Database Performance Issues**
```sql
-- Query performance analysis
EXPLAIN ANALYZE
SELECT
  t.symbol,
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_amount,
  AVG(t.price) as avg_price
FROM transactions t
WHERE t.user_id = $1
  AND t.transaction_date >= $2
  AND t.transaction_date <= $3
GROUP BY t.symbol
ORDER BY total_amount DESC;

-- Index usage analysis
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Slow query identification
SELECT
  query,
  calls,
  total_time / calls as avg_time,
  rows / calls as avg_rows
FROM pg_stat_statements
WHERE calls > 100
ORDER BY avg_time DESC
LIMIT 10;
```

#### **Network Performance Issues**
```bash
# Network diagnostics
ping -c 10 yourdomain.com
traceroute yourdomain.com
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health

# DNS resolution check
dig yourdomain.com
nslookup yourdomain.com

# SSL/TLS performance
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | grep -E "(SSL|TLS)"
```

### Performance Optimization Checklist

- [ ] Enable gzip compression
- [ ] Implement caching (Redis/CDN)
- [ ] Optimize database queries and indexes
- [ ] Configure connection pooling
- [ ] Enable HTTP/2
- [ ] Implement lazy loading
- [ ] Optimize bundle size
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Implement horizontal scaling
- [ ] Regular performance testing
- [ ] Database maintenance and optimization
- [ ] Code profiling and optimization

---

## 📈 Success Metrics

### Performance Targets Achieved
- **Response Time:** < 200ms (95th percentile)
- **Throughput:** 500+ RPS
- **Error Rate:** < 0.1%
- **Availability:** > 99.9%
- **Cache Hit Rate:** > 95%
- **Database Query Time:** < 50ms average

### Monitoring Coverage
- **Application Metrics:** 100%
- **System Metrics:** 100%
- **Database Metrics:** 100%
- **Business Metrics:** 100%
- **Alert Response Time:** < 5 minutes

---

**🎯 Performance optimization is an ongoing process. Regular monitoring, testing, and optimization are essential for maintaining optimal system performance.**

