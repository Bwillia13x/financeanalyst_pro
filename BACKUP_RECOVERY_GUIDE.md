# 🔄 Backup & Disaster Recovery Guide

## Executive Summary

This comprehensive guide provides automated backup strategies and disaster recovery procedures for the FinanceAnalyst Pro system. It ensures data protection, business continuity, and rapid recovery from various failure scenarios.

---

## 📋 Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Database Backup](#database-backup)
3. [Application Backup](#application-backup)
4. [File System Backup](#file-system-backup)
5. [Disaster Recovery](#disaster-recovery)
6. [Business Continuity](#business-continuity)
7. [Testing & Validation](#testing--validation)

---

## 💾 Backup Strategy

### Backup Types and Frequency

#### **Database Backups**
```
Full Backup: Daily at 2:00 AM UTC
Incremental Backup: Every 4 hours
Transaction Log Backup: Every 15 minutes
Retention: 30 days for daily, 7 days for incremental, 24 hours for logs
```

#### **Application Backups**
```
Configuration Backup: Daily
Code Deployment Backup: On each deployment
User Uploads Backup: Hourly
Retention: 90 days for configuration, 30 days for deployments, 7 days for uploads
```

#### **File System Backups**
```
System Configuration: Daily
Log Files: Hourly
SSL Certificates: Daily
Retention: 90 days for system, 30 days for logs, 365 days for certificates
```

### Backup Storage Strategy

#### **Multi-Layer Storage**
```bash
#!/bin/bash
# Multi-layer backup storage script

# Local storage (fast recovery)
LOCAL_BACKUP_DIR="/opt/financeanalyst/backups/local"

# Network storage (medium-term retention)
NETWORK_BACKUP_DIR="/mnt/backup-network"

# Cloud storage (long-term retention)
CLOUD_BUCKET="s3://financeanalyst-backups-prod"

# Local backup
create_local_backup() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    # Database backup
    docker exec financeanalyst-db pg_dump -U financeanalyst financeanalyst_prod > "$LOCAL_BACKUP_DIR/db_$TIMESTAMP.sql"

    # Application data
    tar -czf "$LOCAL_BACKUP_DIR/app_$TIMESTAMP.tar.gz" -C /opt/financeanalyst data/ config/

    # Compress and encrypt
    gpg --encrypt --recipient backup-key "$LOCAL_BACKUP_DIR/db_$TIMESTAMP.sql"
    gpg --encrypt --recipient backup-key "$LOCAL_BACKUP_DIR/app_$TIMESTAMP.tar.gz"

    # Cleanup old local backups (keep last 7 days)
    find "$LOCAL_BACKUP_DIR" -name "*.gpg" -mtime +7 -delete
}

# Network backup
sync_to_network() {
    rsync -avz --delete "$LOCAL_BACKUP_DIR/" "$NETWORK_BACKUP_DIR/"
}

# Cloud backup
sync_to_cloud() {
    aws s3 sync "$LOCAL_BACKUP_DIR/" "$CLOUD_BUCKET/" --delete
    aws s3 ls "$CLOUD_BUCKET/" --recursive | awk 'BEGIN{sum=0} {sum+=$3} END{print "Total cloud backup size: " sum/1024/1024 " MB"}'
}

# Execute backup chain
create_local_backup
sync_to_network
sync_to_cloud

echo "Multi-layer backup completed successfully"
```

#### **Backup Encryption**
```bash
#!/bin/bash
# Backup encryption script

BACKUP_FILE="$1"
ENCRYPTED_FILE="$BACKUP_FILE.gpg"
PUBLIC_KEY="/opt/financeanalyst/keys/backup-public.key"

# Encrypt backup
gpg --encrypt \
    --recipient-file "$PUBLIC_KEY" \
    --output "$ENCRYPTED_FILE" \
    "$BACKUP_FILE"

# Verify encryption
if gpg --decrypt "$ENCRYPTED_FILE" > /dev/null 2>&1; then
    echo "✅ Backup encryption verified"
    rm "$BACKUP_FILE"  # Remove unencrypted file
else
    echo "❌ Backup encryption failed"
    exit 1
fi

echo "Backup encrypted successfully: $ENCRYPTED_FILE"
```

### Backup Monitoring and Alerting

#### **Backup Health Monitoring**
```javascript
// Backup monitoring system
class BackupMonitor {
  constructor(alertManager, redis) {
    this.alertManager = alertManager;
    this.redis = redis;
    this.backupStatusKey = 'backup:status';
    this.backupMetricsKey = 'backup:metrics';
  }

  async recordBackupSuccess(backupType, size, duration) {
    const backupInfo = {
      type: backupType,
      timestamp: new Date().toISOString(),
      status: 'success',
      size: size,
      duration: duration,
      location: this.getBackupLocation(backupType)
    };

    await this.redis.lpush(this.backupStatusKey, JSON.stringify(backupInfo));
    await this.redis.ltrim(this.backupStatusKey, 0, 999); // Keep last 1000 backups

    // Update metrics
    await this.updateBackupMetrics(backupType, true, size, duration);

    console.log(`✅ ${backupType} backup completed successfully`);
  }

  async recordBackupFailure(backupType, error) {
    const backupInfo = {
      type: backupType,
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error.message,
      location: this.getBackupLocation(backupType)
    };

    await this.redis.lpush(this.backupStatusKey, JSON.stringify(backupInfo));

    // Update metrics
    await this.updateBackupMetrics(backupType, false, 0, 0);

    // Send alert
    await this.alertManager.sendAlert({
      title: `Backup Failed: ${backupType}`,
      message: `Backup failed: ${error.message}`,
      severity: 'critical',
      category: 'backup'
    });

    console.error(`❌ ${backupType} backup failed:`, error);
  }

  async updateBackupMetrics(backupType, success, size, duration) {
    const metrics = await this.getBackupMetrics();

    if (!metrics[backupType]) {
      metrics[backupType] = {
        totalBackups: 0,
        successfulBackups: 0,
        failedBackups: 0,
        totalSize: 0,
        averageDuration: 0,
        lastSuccess: null,
        lastFailure: null
      };
    }

    metrics[backupType].totalBackups++;

    if (success) {
      metrics[backupType].successfulBackups++;
      metrics[backupType].totalSize += size;
      metrics[backupType].lastSuccess = new Date().toISOString();

      // Update average duration
      const currentAvg = metrics[backupType].averageDuration;
      const totalBackups = metrics[backupType].successfulBackups;
      metrics[backupType].averageDuration = ((currentAvg * (totalBackups - 1)) + duration) / totalBackups;
    } else {
      metrics[backupType].failedBackups++;
      metrics[backupType].lastFailure = new Date().toISOString();
    }

    await this.redis.set(this.backupMetricsKey, JSON.stringify(metrics));
  }

  async getBackupMetrics() {
    const metricsJson = await this.redis.get(this.backupMetricsKey);
    return metricsJson ? JSON.parse(metricsJson) : {};
  }

  getBackupLocation(backupType) {
    const locations = {
      database: '/opt/financeanalyst/backups/database/',
      application: '/opt/financeanalyst/backups/application/',
      filesystem: '/opt/financeanalyst/backups/filesystem/',
      cloud: 's3://financeanalyst-backups-prod/'
    };
    return locations[backupType] || 'unknown';
  }

  async checkBackupHealth() {
    const metrics = await this.getBackupMetrics();
    const alerts = [];

    for (const [backupType, data] of Object.entries(metrics)) {
      // Check if last backup was successful
      if (data.lastFailure && (!data.lastSuccess || new Date(data.lastSuccess) < new Date(data.lastFailure))) {
        alerts.push({
          type: 'backup_failure',
          backupType: backupType,
          message: `${backupType} backup has been failing since ${data.lastFailure}`,
          severity: 'critical'
        });
      }

      // Check backup frequency
      const lastBackup = data.lastSuccess || data.lastFailure;
      if (lastBackup) {
        const hoursSinceLastBackup = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60);
        const maxHours = this.getMaxHoursBetweenBackups(backupType);

        if (hoursSinceLastBackup > maxHours) {
          alerts.push({
            type: 'backup_overdue',
            backupType: backupType,
            message: `${backupType} backup is overdue (${Math.round(hoursSinceLastBackup)} hours since last backup)`,
            severity: 'warning'
          });
        }
      }

      // Check success rate
      if (data.totalBackups > 0) {
        const successRate = data.successfulBackups / data.totalBackups;
        if (successRate < 0.95) { // Less than 95% success rate
          alerts.push({
            type: 'backup_success_rate',
            backupType: backupType,
            message: `${backupType} backup success rate is ${Math.round(successRate * 100)}%`,
            severity: 'warning'
          });
        }
      }
    }

    return alerts;
  }

  getMaxHoursBetweenBackups(backupType) {
    const maxHours = {
      database: 25,    // Daily backup + 1 hour buffer
      application: 25, // Daily backup + 1 hour buffer
      filesystem: 25   // Daily backup + 1 hour buffer
    };
    return maxHours[backupType] || 24;
  }

  async getBackupStatus(limit = 50) {
    const backups = await this.redis.lrange(this.backupStatusKey, 0, limit - 1);
    return backups.map(backup => JSON.parse(backup));
  }
}

// Backup monitoring middleware
export const backupMonitoring = (backupMonitor) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', async () => {
      // This would be called after backup operations
      // Implementation depends on how backups are triggered
    });

    next();
  };
};
```

---

## 🗄️ Database Backup

### Automated Database Backup

#### **PostgreSQL Backup Strategy**
```bash
#!/bin/bash
# PostgreSQL backup script

BACKUP_DIR="/opt/financeanalyst/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_HOST="localhost"
DB_USER="financeanalyst"
DB_NAME="financeanalyst_prod"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Full database backup
FULL_BACKUP="$BACKUP_DIR/full_$TIMESTAMP.sql"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --no-password \
  --format=custom \
  --compress=9 \
  --verbose \
  > "$FULL_BACKUP"

# Verify backup integrity
if pg_restore --list "$FULL_BACKUP" > /dev/null 2>&1; then
    echo "✅ Database backup integrity verified"

    # Compress and encrypt
    gpg --encrypt --recipient backup-key "$FULL_BACKUP"
    rm "$FULL_BACKUP"

    # Calculate backup size
    BACKUP_SIZE=$(stat -f%z "$FULL_BACKUP.gpg")
    echo "📊 Backup size: $BACKUP_SIZE bytes"

    # Send metrics to monitoring
    curl -X POST http://localhost:9091/metrics/job/database_backup \
      -H "Content-Type: application/json" \
      -d "{\"backup_size\": $BACKUP_SIZE, \"status\": \"success\"}"

else
    echo "❌ Database backup integrity check failed"
    curl -X POST http://localhost:9091/metrics/job/database_backup \
      -H "Content-Type: application/json" \
      -d "{\"status\": \"failed\"}"
    exit 1
fi

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "full_*.gpg" -mtime +30 -delete

# Incremental backup (WAL archiving)
# This would be configured in postgresql.conf:
# wal_level = replica
# archive_mode = on
# archive_command = 'cp %p /opt/financeanalyst/backups/wal/%f'

echo "Database backup completed: $FULL_BACKUP.gpg"
```

#### **Point-in-Time Recovery (PITR)**
```sql
-- Configure PostgreSQL for PITR
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /opt/financeanalyst/backups/wal/%f';
ALTER SYSTEM SET restore_command = 'cp /opt/financeanalyst/backups/wal/%f %p';

-- Create base backup for PITR
SELECT pg_start_backup('pitr_backup_' || now()::text);

-- Copy data directory (this would be done via OS commands)
-- cp -r /var/lib/postgresql/data /opt/financeanalyst/backups/pitr/

SELECT pg_stop_backup();

-- Recovery configuration (recovery.conf)
restore_command = 'cp /opt/financeanalyst/backups/wal/%f %p'
recovery_target_time = '2023-12-01 14:30:00 UTC'
recovery_target_action = 'promote'
```

### Database Backup Validation

#### **Backup Integrity Testing**
```bash
#!/bin/bash
# Database backup validation script

BACKUP_FILE="$1"
TEMP_DIR="/tmp/backup-validation"

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Decrypt backup
gpg --decrypt "$BACKUP_FILE" > "$TEMP_DIR/backup.sql"

# Test restore to temporary database
createdb -h localhost -U postgres financeanalyst_test_restore

# Restore backup
psql -h localhost -U postgres -d financeanalyst_test_restore < "$TEMP_DIR/backup.sql"

# Run validation queries
VALIDATION_RESULT=$(psql -h localhost -U postgres -d financeanalyst_test_restore -c "
  SELECT
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
  FROM pg_stat_user_tables
  ORDER BY n_tup_ins DESC
  LIMIT 5;
")

# Check if tables exist and have data
TABLE_COUNT=$(psql -h localhost -U postgres -d financeanalyst_test_restore -c "
  SELECT count(*) FROM information_schema.tables
  WHERE table_schema = 'public';
" | tail -3 | head -1 | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ Backup validation successful - $TABLE_COUNT tables restored"
else
    echo "❌ Backup validation failed - no tables found"
    exit 1
fi

# Cleanup
dropdb -h localhost -U postgres financeanalyst_test_restore
rm -rf "$TEMP_DIR"

echo "Backup validation completed successfully"
```

---

## 📱 Application Backup

### Application Data Backup

#### **Configuration Backup**
```bash
#!/bin/bash
# Application configuration backup

BACKUP_DIR="/opt/financeanalyst/backups/application"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup environment variables
cp /opt/financeanalyst/.env "$BACKUP_DIR/env_$TIMESTAMP"

# Backup Docker configurations
tar -czf "$BACKUP_DIR/docker_$TIMESTAMP.tar.gz" \
  -C /opt/financeanalyst \
  docker-compose.yml \
  docker-compose.prod.yml \
  Dockerfile

# Backup Nginx configuration
tar -czf "$BACKUP_DIR/nginx_$TIMESTAMP.tar.gz" \
  -C /etc/nginx \
  sites-available/financeanalyst \
  nginx.conf

# Encrypt backups
gpg --encrypt --recipient backup-key "$BACKUP_DIR/env_$TIMESTAMP"
gpg --encrypt --recipient backup-key "$BACKUP_DIR/docker_$TIMESTAMP.tar.gz"
gpg --encrypt --recipient backup-key "$BACKUP_DIR/nginx_$TIMESTAMP.tar.gz"

# Cleanup unencrypted files
rm "$BACKUP_DIR/env_$TIMESTAMP"
rm "$BACKUP_DIR/docker_$TIMESTAMP.tar.gz"
rm "$BACKUP_DIR/nginx_$TIMESTAMP.tar.gz"

# Cleanup old backups (keep last 90 days)
find "$BACKUP_DIR" -name "env_*.gpg" -mtime +90 -delete
find "$BACKUP_DIR" -name "docker_*.gpg" -mtime +90 -delete
find "$BACKUP_DIR" -name "nginx_*.gpg" -mtime +90 -delete

echo "Application configuration backup completed"
```

#### **User Data Backup**
```bash
#!/bin/bash
# User data backup script

BACKUP_DIR="/opt/financeanalyst/backups/userdata"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup user uploads
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" \
  -C /opt/financeanalyst/data \
  uploads/

# Backup user sessions (if stored in Redis)
docker exec financeanalyst-redis redis-cli --rdb /tmp/redis-backup.rdb
docker cp financeanalyst-redis:/tmp/redis-backup.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Backup user preferences and settings from database
psql -h localhost -U financeanalyst -d financeanalyst_prod -c "
  COPY (
    SELECT
      user_id,
      preferences,
      settings,
      created_at,
      updated_at
    FROM user_preferences
    WHERE updated_at > now() - interval '24 hours'
  ) TO '/tmp/user_prefs_$TIMESTAMP.csv' WITH CSV HEADER;
"

cp "/tmp/user_prefs_$TIMESTAMP.csv" "$BACKUP_DIR/"

# Encrypt backups
gpg --encrypt --recipient backup-key "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
gpg --encrypt --recipient backup-key "$BACKUP_DIR/redis_$TIMESTAMP.rdb"
gpg --encrypt --recipient backup-key "$BACKUP_DIR/user_prefs_$TIMESTAMP.csv"

# Cleanup
rm "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
rm "$BACKUP_DIR/redis_$TIMESTAMP.rdb"
rm "$BACKUP_DIR/user_prefs_$TIMESTAMP.csv"
rm "/tmp/user_prefs_$TIMESTAMP.csv"

# Cleanup old backups (keep last 7 days for user data)
find "$BACKUP_DIR" -name "uploads_*.gpg" -mtime +7 -delete
find "$BACKUP_DIR" -name "redis_*.gpg" -mtime +7 -delete
find "$BACKUP_DIR" -name "user_prefs_*.gpg" -mtime +7 -delete

echo "User data backup completed"
```

### Application State Backup

#### **Session and Cache Backup**
```javascript
// Session backup mechanism
class SessionBackupManager {
  constructor(redis, backupInterval = 300000) { // 5 minutes
    this.redis = redis;
    this.backupInterval = backupInterval;
    this.lastBackup = Date.now();

    // Start automatic backup
    setInterval(() => this.performBackup(), this.backupInterval);
  }

  async performBackup() {
    try {
      const timestamp = Date.now();
      const backupKey = `session_backup:${timestamp}`;

      // Get all session keys
      const sessionKeys = await this.redis.keys('session:*');

      if (sessionKeys.length === 0) {
        return; // No sessions to backup
      }

      // Backup session data
      const pipeline = this.redis.pipeline();

      for (const key of sessionKeys) {
        pipeline.dump(key);
      }

      const dumps = await pipeline.exec();

      // Store backup
      const backupData = {
        timestamp: timestamp,
        sessions: sessionKeys.map((key, index) => ({
          key: key,
          data: dumps[index][1]
        }))
      };

      await this.redis.set(backupKey, JSON.stringify(backupData));
      await this.redis.expire(backupKey, 86400); // Expire after 24 hours

      // Update last backup time
      this.lastBackup = timestamp;

      console.log(`✅ Session backup completed: ${sessionKeys.length} sessions`);
    } catch (error) {
      console.error('❌ Session backup failed:', error);
    }
  }

  async restoreSessions(backupTimestamp) {
    try {
      const backupKey = `session_backup:${backupTimestamp}`;
      const backupDataJson = await this.redis.get(backupKey);

      if (!backupDataJson) {
        throw new Error('Backup not found');
      }

      const backupData = JSON.parse(backupDataJson);
      const pipeline = this.redis.pipeline();

      for (const session of backupData.sessions) {
        pipeline.restore(session.key, 0, session.data, 'REPLACE');
      }

      await pipeline.exec();

      console.log(`✅ Session restoration completed: ${backupData.sessions.length} sessions`);
    } catch (error) {
      console.error('❌ Session restoration failed:', error);
      throw error;
    }
  }

  async getAvailableBackups() {
    const backupKeys = await this.redis.keys('session_backup:*');
    return backupKeys.map(key => ({
      timestamp: key.split(':')[1],
      key: key
    })).sort((a, b) => b.timestamp - a.timestamp);
  }
}
```

---

## 💻 File System Backup

### System Configuration Backup

#### **Automated System Backup**
```bash
#!/bin/bash
# System configuration backup

BACKUP_DIR="/opt/financeanalyst/backups/system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup system configurations
tar -czf "$BACKUP_DIR/system_config_$TIMESTAMP.tar.gz" \
  -C /etc \
  nginx/sites-available/financeanalyst \
  nginx/nginx.conf \
  systemd/system/financeanalyst.service \
  ssh/sshd_config \
  ufw/ufw.conf \
  fail2ban/jail.local

# Backup SSL certificates
tar -czf "$BACKUP_DIR/ssl_certs_$TIMESTAMP.tar.gz" \
  -C /etc/letsencrypt \
  live/yourdomain.com/

# Backup cron jobs
crontab -l > "$BACKUP_DIR/crontab_$TIMESTAMP"

# Backup package list
dpkg --get-selections > "$BACKUP_DIR/packages_$TIMESTAMP.list"

# Encrypt backups
gpg --encrypt --recipient backup-key "$BACKUP_DIR/system_config_$TIMESTAMP.tar.gz"
gpg --encrypt --recipient backup-key "$BACKUP_DIR/ssl_certs_$TIMESTAMP.tar.gz"
gpg --encrypt --recipient backup-key "$BACKUP_DIR/crontab_$TIMESTAMP"
gpg --encrypt --recipient backup-key "$BACKUP_DIR/packages_$TIMESTAMP.list"

# Cleanup unencrypted files
rm "$BACKUP_DIR/system_config_$TIMESTAMP.tar.gz"
rm "$BACKUP_DIR/ssl_certs_$TIMESTAMP.tar.gz"
rm "$BACKUP_DIR/crontab_$TIMESTAMP"
rm "$BACKUP_DIR/packages_$TIMESTAMP.list"

# Cleanup old backups (keep last 90 days)
find "$BACKUP_DIR" -name "*.gpg" -mtime +90 -delete
find "$BACKUP_DIR" -name "crontab_*" -mtime +90 -delete
find "$BACKUP_DIR" -name "packages_*" -mtime +90 -delete

echo "System configuration backup completed"
```

### Log File Backup

#### **Log Rotation and Backup**
```bash
#!/bin/bash
# Log backup and rotation script

LOG_DIR="/opt/financeanalyst/logs"
BACKUP_DIR="/opt/financeanalyst/backups/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Compress current log files
find "$LOG_DIR" -name "*.log" -exec gzip {} \;

# Move compressed logs to backup directory
find "$LOG_DIR" -name "*.gz" -exec mv {} "$BACKUP_DIR/" \;

# Create new log files
touch "$LOG_DIR/app.log"
touch "$LOG_DIR/error.log"
touch "$LOG_DIR/access.log"

# Set proper permissions
chown financeanalyst:financeanalyst "$LOG_DIR"/*.log

# Reload application to start logging to new files
sudo systemctl reload financeanalyst

# Encrypt log backups
find "$BACKUP_DIR" -name "*.gz" -exec gpg --encrypt --recipient backup-key {} \;

# Cleanup encrypted originals
find "$BACKUP_DIR" -name "*.gz" -exec rm {} \;

# Cleanup old log backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.gpg" -mtime +30 -delete

echo "Log backup and rotation completed"
```

---

## 🚨 Disaster Recovery

### Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

#### **Service Level Targets**
```
Critical Services (Database, API):
- RTO: 4 hours
- RPO: 15 minutes

Important Services (Background Jobs, Analytics):
- RTO: 24 hours
- RPO: 1 hour

Standard Services (Reporting, Admin Interface):
- RTO: 48 hours
- RPO: 4 hours
```

### Disaster Recovery Procedures

#### **Complete System Recovery**
```bash
#!/bin/bash
# Complete disaster recovery script

RECOVERY_TYPE="$1"  # full, partial, point-in-time
BACKUP_TIMESTAMP="$2"

if [ -z "$RECOVERY_TYPE" ]; then
    echo "Usage: $0 <recovery_type> [backup_timestamp]"
    echo "Recovery types: full, partial, point-in-time"
    exit 1
fi

echo "Starting $RECOVERY_TYPE disaster recovery..."

# Set maintenance mode
curl -X POST https://status.yourdomain.com/api/maintenance \
  -H "Authorization: Bearer $STATUS_API_KEY" \
  -d '{"mode": "maintenance", "message": "System undergoing disaster recovery"}'

case $RECOVERY_TYPE in
    "full")
        ./scripts/recovery/full-recovery.sh "$BACKUP_TIMESTAMP"
        ;;
    "partial")
        ./scripts/recovery/partial-recovery.sh "$BACKUP_TIMESTAMP"
        ;;
    "point-in-time")
        ./scripts/recovery/pitr-recovery.sh "$BACKUP_TIMESTAMP"
        ;;
    *)
        echo "Invalid recovery type: $RECOVERY_TYPE"
        exit 1
        ;;
esac

# Validate recovery
./scripts/recovery/validate-recovery.sh

# Disable maintenance mode
curl -X POST https://status.yourdomain.com/api/maintenance \
  -H "Authorization: Bearer $STATUS_API_KEY" \
  -d '{"mode": "operational"}'

echo "Disaster recovery completed successfully"
```

#### **Full Recovery Script**
```bash
#!/bin/bash
# Full system recovery script

BACKUP_TIMESTAMP="$1"
BACKUP_DIR="/opt/financeanalyst/backups"

echo "Starting full system recovery..."

# Stop all services
docker-compose -f /opt/financeanalyst/docker-compose.yml down

# Restore database
echo "Restoring database..."
gpg --decrypt "$BACKUP_DIR/database/full_$BACKUP_TIMESTAMP.sql.gpg" > /tmp/database_restore.sql
psql -h localhost -U postgres < /tmp/database_restore.sql
rm /tmp/database_restore.sql

# Restore application data
echo "Restoring application data..."
gpg --decrypt "$BACKUP_DIR/application/app_$BACKUP_TIMESTAMP.tar.gz.gpg" | tar -xz -C /opt/financeanalyst

# Restore system configuration
echo "Restoring system configuration..."
gpg --decrypt "$BACKUP_DIR/system/system_config_$BACKUP_TIMESTAMP.tar.gz.gpg" | tar -xz -C /

# Start services
echo "Starting services..."
docker-compose -f /opt/financeanalyst/docker-compose.yml up -d

# Validate recovery
echo "Validating recovery..."
sleep 60
curl -f https://yourdomain.com/health

echo "Full system recovery completed"
```

#### **Point-in-Time Recovery**
```bash
#!/bin/bash
# Point-in-time recovery script

TARGET_TIME="$1"
BACKUP_TIMESTAMP="$2"

echo "Starting point-in-time recovery to $TARGET_TIME..."

# Stop database
docker stop financeanalyst-db

# Restore base backup
docker run --rm \
  -v /opt/financeanalyst/backups:/backups \
  postgres:14 \
  pg_restore -h host.docker.internal -U financeanalyst -d financeanalyst_prod /backups/database/full_$BACKUP_TIMESTAMP.sql

# Create recovery.conf
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /opt/financeanalyst/backups/wal/%f %p'
recovery_target_time = '$TARGET_TIME'
recovery_target_action = 'promote'
EOF

# Start database in recovery mode
docker start financeanalyst-db

# Wait for recovery to complete
echo "Waiting for point-in-time recovery to complete..."
sleep 300

# Verify recovery
psql -h localhost -U financeanalyst -d financeanalyst_prod -c "SELECT now();"

echo "Point-in-time recovery completed"
```

### Recovery Validation

#### **Automated Recovery Testing**
```bash
#!/bin/bash
# Recovery validation script

VALIDATION_TYPE="$1"  # health, data, performance

echo "Starting recovery validation ($VALIDATION_TYPE)..."

case $VALIDATION_TYPE in
    "health")
        # Health check validation
        if curl -f -s https://yourdomain.com/health > /dev/null; then
            echo "✅ Application health check passed"
        else
            echo "❌ Application health check failed"
            exit 1
        fi

        # Database connectivity check
        if psql -h localhost -U financeanalyst -d financeanalyst_prod -c "SELECT 1;" > /dev/null; then
            echo "✅ Database connectivity check passed"
        else
            echo "❌ Database connectivity check failed"
            exit 1
        fi
        ;;

    "data")
        # Data integrity validation
        RECORDS_COUNT=$(psql -h localhost -U financeanalyst -d financeanalyst_prod -c "SELECT count(*) FROM users;" | tail -3 | head -1 | tr -d ' ')

        if [ "$RECORDS_COUNT" -gt 0 ]; then
            echo "✅ Data integrity check passed ($RECORDS_COUNT records found)"
        else
            echo "❌ Data integrity check failed (no records found)"
            exit 1
        fi

        # Foreign key validation
        CONSTRAINT_VIOLATIONS=$(psql -h localhost -U financeanalyst -d financeanalyst_prod -c "
          SELECT count(*) FROM (
            SELECT 1 FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE u.id IS NULL
            LIMIT 1
          ) violations;
        " | tail -3 | head -1 | tr -d ' ')

        if [ "$CONSTRAINT_VIOLATIONS" -eq 0 ]; then
            echo "✅ Foreign key validation passed"
        else
            echo "❌ Foreign key validation failed ($CONSTRAINT_VIOLATIONS violations)"
            exit 1
        fi
        ;;

    "performance")
        # Performance validation
        RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://yourdomain.com/api/health)
        RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)

        if (( $(echo "$RESPONSE_TIME_MS < 1000" | bc -l) )); then
            echo "✅ Performance check passed (${RESPONSE_TIME_MS}ms)"
        else
            echo "❌ Performance check failed (${RESPONSE_TIME_MS}ms)"
            exit 1
        fi
        ;;
    *)
        echo "Invalid validation type: $VALIDATION_TYPE"
        echo "Valid types: health, data, performance"
        exit 1
        ;;
esac

echo "Recovery validation ($VALIDATION_TYPE) completed successfully"
```

---

## 🏢 Business Continuity

### Business Impact Analysis

#### **Critical Business Functions**
```
1. User Authentication & Authorization
   - Impact: High (blocks all user access)
   - Recovery Priority: Critical
   - RTO: 1 hour

2. Financial Data Processing
   - Impact: High (affects core business functionality)
   - Recovery Priority: Critical
   - RTO: 4 hours

3. Real-time Market Data
   - Impact: Medium (affects real-time features)
   - Recovery Priority: High
   - RTO: 2 hours

4. Reporting & Analytics
   - Impact: Low (affects non-real-time features)
   - Recovery Priority: Medium
   - RTO: 24 hours
```

### Continuity Planning

#### **Alternate Processing Strategies**
```
Primary Site Failure:
1. Automatic failover to backup site
2. Manual failover to cloud infrastructure
3. Degraded mode with read-only access
4. Complete service restoration

Network Failure:
1. Automatic routing through backup connections
2. Manual failover to satellite connections
3. Local processing for critical functions
4. Service restoration with reduced functionality

Data Center Failure:
1. Automatic failover to secondary data center
2. Cross-region replication activation
3. Service restoration from backup infrastructure
4. Complete recovery with full functionality
```

### Communication Plan

#### **Stakeholder Communication**
```
Immediate Response (0-1 hour):
- Notify executive leadership
- Update status page
- Send automated alerts to key stakeholders

Ongoing Updates (1-24 hours):
- Hourly status updates
- Technical briefings for engineering teams
- Customer communication for major outages

Post-Resolution (24+ hours):
- Detailed incident report
- Root cause analysis
- Preventive measures implemented
- Service improvement announcements
```

---

## 🧪 Testing & Validation

### Backup Testing Schedule

#### **Regular Testing Cadence**
```
Daily Testing:
- Backup completion verification
- Basic integrity checks
- Alert system validation

Weekly Testing:
- Full backup restoration test
- Performance impact assessment
- Storage capacity validation

Monthly Testing:
- Complete disaster recovery simulation
- Cross-region failover testing
- Business continuity validation

Quarterly Testing:
- Full system migration testing
- Regulatory compliance validation
- Third-party vendor testing
```

### Automated Testing

#### **Backup Validation Pipeline**
```yaml
# GitHub Actions backup testing workflow
name: Backup Validation

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  backup-validation:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Validate backup integrity
      run: npm run test:backup:integrity

    - name: Test backup restoration
      run: npm run test:backup:restoration

    - name: Validate backup performance
      run: npm run test:backup:performance

    - name: Generate backup report
      run: npm run test:backup:report

    - name: Upload test results
      uses: actions/upload-artifact@v4
      with:
        name: backup-test-results
        path: test-results/backup/

    - name: Send notification
      if: failure()
      run: |
        curl -X POST -H 'Content-type: application/json' \
          --data '{"text":"❌ Backup validation failed","color":"danger"}' \
          ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Recovery Testing Scenarios

#### **Test Scenarios**
```
1. Database Corruption Recovery
   - Simulate database corruption
   - Execute recovery procedures
   - Validate data integrity
   - Measure recovery time

2. Application Failure Recovery
   - Stop application services
   - Execute application recovery
   - Validate functionality
   - Measure recovery time

3. Complete System Failure
   - Simulate complete system failure
   - Execute disaster recovery procedures
   - Validate full system functionality
   - Measure recovery time

4. Network Failure Recovery
   - Simulate network partition
   - Execute network recovery procedures
   - Validate connectivity
   - Measure recovery time

5. Data Center Failure
   - Simulate data center outage
   - Execute cross-region failover
   - Validate service availability
   - Measure failover time
```

### Compliance Validation

#### **Regulatory Requirements Testing**
```javascript
// Compliance testing framework
class ComplianceTester {
  constructor() {
    this.regulations = {
      GDPR: this.testGDPRCompliance.bind(this),
      SOX: this.testSOXCompliance.bind(this),
      HIPAA: this.testHIPAACompliance.bind(this)
    };
  }

  async runComplianceTests() {
    const results = {};

    for (const [regulation, testFunction] of Object.entries(this.regulations)) {
      try {
        results[regulation] = await testFunction();
        results[regulation].status = 'passed';
      } catch (error) {
        results[regulation] = {
          status: 'failed',
          error: error.message,
          remediation: this.getRemediationSteps(regulation, error.code)
        };
      }
    }

    return results;
  }

  async testGDPRCompliance() {
    // Test data retention compliance
    const oldData = await database('user_data')
      .where('created_at', '<', new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000)) // 7 years ago
      .count();

    if (oldData[0].count > 0) {
      throw new Error('GDPR_VIOLATION_DATA_RETENTION');
    }

    // Test data encryption
    const unencryptedData = await database('users')
      .whereRaw("ssn NOT LIKE 'ENC:%'")
      .count();

    if (unencryptedData[0].count > 0) {
      throw new Error('GDPR_VIOLATION_DATA_ENCRYPTION');
    }

    return { checksPassed: 2 };
  }

  async testSOXCompliance() {
    // Test audit trail completeness
    const unauditedTransactions = await database('transactions')
      .leftJoin('audit_log', 'transactions.id', 'audit_log.resource_id')
      .whereNull('audit_log.id')
      .count();

    if (unauditedTransactions[0].count > 0) {
      throw new Error('SOX_VIOLATION_AUDIT_TRAIL');
    }

    return { checksPassed: 1 };
  }

  async testHIPAACompliance() {
    // Test access controls for health data
    const unrestrictedAccess = await database('user_permissions')
      .where('resource_type', 'health_data')
      .where('permission_level', 'unrestricted')
      .count();

    if (unrestrictedAccess[0].count > 0) {
      throw new Error('HIPAA_VIOLATION_ACCESS_CONTROL');
    }

    return { checksPassed: 1 };
  }

  getRemediationSteps(regulation, errorCode) {
    const remediationSteps = {
      GDPR_VIOLATION_DATA_RETENTION: [
        'Implement automated data deletion for records older than retention period',
        'Review data retention policies with legal team',
        'Update data lifecycle management procedures'
      ],
      GDPR_VIOLATION_DATA_ENCRYPTION: [
        'Encrypt all sensitive PII data at rest',
        'Implement encryption for data in transit',
        'Update encryption key management procedures'
      ],
      SOX_VIOLATION_AUDIT_TRAIL: [
        'Ensure all financial transactions are logged',
        'Implement comprehensive audit logging',
        'Regular audit trail reviews'
      ],
      HIPAA_VIOLATION_ACCESS_CONTROL: [
        'Implement strict access controls for health data',
        'Regular access review procedures',
        'Role-based access control implementation'
      ]
    };

    return remediationSteps[errorCode] || ['Review compliance requirements with legal team'];
  }
}
```

---

## 📋 Backup & Recovery Checklist

### Backup Configuration
- [ ] Backup schedule defined and implemented
- [ ] Backup retention policies established
- [ ] Backup encryption configured
- [ ] Multi-location backup storage
- [ ] Backup integrity validation
- [ ] Backup monitoring and alerting
- [ ] Backup testing procedures

### Recovery Planning
- [ ] Recovery time objectives defined
- [ ] Recovery point objectives established
- [ ] Recovery procedures documented
- [ ] Recovery testing performed
- [ ] Recovery team identified
- [ ] Recovery communication plan
- [ ] Recovery validation procedures

### Business Continuity
- [ ] Business impact analysis completed
- [ ] Continuity strategies defined
- [ ] Alternate processing procedures
- [ ] Communication plans established
- [ ] Stakeholder notification procedures
- [ ] Recovery coordination procedures

### Compliance & Testing
- [ ] Regulatory compliance requirements identified
- [ ] Compliance testing procedures implemented
- [ ] Backup testing schedule established
- [ ] Recovery testing performed regularly
- [ ] Compliance reporting procedures
- [ ] Audit trail maintenance

---

**💾 Robust backup and disaster recovery procedures are essential for maintaining business continuity and meeting regulatory requirements. Regular testing and validation ensure that recovery procedures work when needed.**

