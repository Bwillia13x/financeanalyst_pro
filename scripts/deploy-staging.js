#!/usr/bin/env node

/**
 * Staging Deployment Script
 * Deploys FinanceAnalyst Pro to staging environment
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

class StagingDeployer {
  constructor() {
    this.environment = 'staging';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupPath = `/opt/financeanalyst/backups/pre-deploy-staging-${this.timestamp}`;
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async run() {
    try {
      this.log('🚀 Starting staging deployment...');

      // Pre-deployment checks
      await this.preDeploymentChecks();

      // Create backup
      await this.createBackup();

      // Deploy application
      await this.deployApplication();

      // Run health checks
      await this.runHealthChecks();

      // Post-deployment validation
      await this.postDeploymentValidation();

      this.log('✅ Staging deployment completed successfully!');
      process.exit(0);
    } catch (error) {
      this.log(`❌ Staging deployment failed: ${error.message}`, 'ERROR');

      // Attempt rollback on failure
      try {
        await this.rollback();
      } catch (rollbackError) {
        this.log(`❌ Rollback also failed: ${rollbackError.message}`, 'ERROR');
      }

      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    this.log('🔍 Running pre-deployment checks...');

    // Check if staging environment is accessible
    try {
      execSync('ping -c 3 staging.yourdomain.com', { timeout: 10000 });
      this.log('✅ Staging environment is reachable');
    } catch (error) {
      throw new Error('Staging environment is not reachable');
    }

    // Check database connectivity
    try {
      execSync(
        'PGPASSWORD=staging_pass psql -h staging-db.yourdomain.com -U staging_user -d financeanalyst_staging -c "SELECT 1;"',
        { timeout: 10000 }
      );
      this.log('✅ Staging database is accessible');
    } catch (error) {
      throw new Error('Staging database is not accessible');
    }

    // Check Redis connectivity
    try {
      execSync('redis-cli -h staging-redis.yourdomain.com -p 6379 ping', { timeout: 5000 });
      this.log('✅ Staging Redis is accessible');
    } catch (error) {
      this.log('⚠️ Staging Redis is not accessible, but continuing...');
    }

    // Check current application health
    try {
      execSync('curl -f -s --max-time 10 https://staging.yourdomain.com/health', {
        timeout: 15000
      });
      this.log('✅ Current staging application is healthy');
    } catch (error) {
      this.log('⚠️ Current staging application health check failed, but continuing...');
    }
  }

  async createBackup() {
    this.log('💾 Creating backup before deployment...');

    try {
      // Create backup directory
      execSync(`ssh staging-server "mkdir -p ${this.backupPath}"`);

      // Backup application files
      execSync(`ssh staging-server "cp -r /opt/financeanalyst ${this.backupPath}/app"`);

      // Backup database
      execSync(
        `ssh staging-server "PGPASSWORD=staging_pass pg_dump -h localhost -U staging_user financeanalyst_staging > ${this.backupPath}/database.sql"`
      );

      // Backup Redis data (if using persistence)
      execSync(
        `ssh staging-server "cp -r /var/lib/redis/dump.rdb ${this.backupPath}/redis-dump.rdb 2>/dev/null || true"`
      );

      this.log('✅ Backup completed successfully');
    } catch (error) {
      this.log(`⚠️ Backup failed: ${error.message}`, 'WARN');
      // Don't fail deployment for backup issues, but log it
    }
  }

  async deployApplication() {
    this.log('🚀 Deploying application to staging...');

    // Pull latest Docker image
    execSync('docker pull ghcr.io/yourorg/financeanalyst-pro:latest', { stdio: 'inherit' });

    // Stop current containers
    try {
      execSync('ssh staging-server "cd /opt/financeanalyst && docker-compose down"', {
        timeout: 30000
      });
      this.log('✅ Stopped current staging containers');
    } catch (error) {
      this.log('⚠️ Failed to stop containers gracefully, forcing stop...');
      execSync('ssh staging-server "cd /opt/financeanalyst && docker-compose down -t 0"');
    }

    // Update docker-compose.yml with new image
    execSync(
      `ssh staging-server "sed -i 's|image: ghcr.io/yourorg/financeanalyst-pro:.*|image: ghcr.io/yourorg/financeanalyst-pro:latest|g' /opt/financeanalyst/docker-compose.yml"`
    );

    // Start new containers
    execSync('ssh staging-server "cd /opt/financeanalyst && docker-compose up -d"', {
      timeout: 120000,
      stdio: 'inherit'
    });

    this.log('✅ Application deployed to staging');
  }

  async runHealthChecks() {
    this.log('🏥 Running post-deployment health checks...');

    // Wait for application to start
    await this.waitForApplication(300); // 5 minutes timeout

    // Run health checks
    const healthChecks = [
      {
        name: 'Application Health',
        command: 'curl -f -s --max-time 30 https://staging.yourdomain.com/health',
        timeout: 30000
      },
      {
        name: 'Database Connection',
        command:
          'ssh staging-server "docker exec financeanalyst_db pg_isready -U staging_user -d financeanalyst_staging"',
        timeout: 15000
      },
      {
        name: 'Redis Connection',
        command: 'ssh staging-server "docker exec financeanalyst_redis redis-cli ping"',
        timeout: 10000
      },
      {
        name: 'API Endpoints',
        command: 'curl -f -s --max-time 30 https://staging-api.yourdomain.com/api/health',
        timeout: 30000
      }
    ];

    for (const check of healthChecks) {
      try {
        execSync(check.command, { timeout: check.timeout });
        this.log(`✅ ${check.name} check passed`);
      } catch (error) {
        throw new Error(`${check.name} check failed: ${error.message}`);
      }
    }

    this.log('✅ All health checks passed');
  }

  async waitForApplication(timeoutSeconds) {
    this.log(`⏳ Waiting for application to start (timeout: ${timeoutSeconds}s)...`);

    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      try {
        execSync('curl -f -s --max-time 10 https://staging.yourdomain.com/health', {
          timeout: 10000
        });
        this.log('✅ Application is responding');
        return;
      } catch (error) {
        this.log('⏳ Application not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
    }

    throw new Error(`Application failed to start within ${timeoutSeconds} seconds`);
  }

  async postDeploymentValidation() {
    this.log('🔍 Running post-deployment validation...');

    // Run smoke tests
    try {
      execSync('npm run test:smoke -- --baseUrl=https://staging.yourdomain.com', {
        cwd: ROOT_DIR,
        timeout: 300000,
        stdio: 'inherit'
      });
      this.log('✅ Smoke tests passed');
    } catch (error) {
      throw new Error(`Smoke tests failed: ${error.message}`);
    }

    // Run API tests
    try {
      execSync('npm run test:api -- --environment=staging', {
        cwd: ROOT_DIR,
        timeout: 180000,
        stdio: 'inherit'
      });
      this.log('✅ API tests passed');
    } catch (error) {
      throw new Error(`API tests failed: ${error.message}`);
    }

    // Performance validation
    try {
      const perfResult = execSync(
        'curl -w "@curl-format.txt" -o /dev/null -s https://staging.yourdomain.com/api/health',
        {
          cwd: ROOT_DIR,
          timeout: 30000
        }
      );

      // Check response time is acceptable (< 500ms)
      if (parseFloat(perfResult) > 500) {
        this.log(`⚠️ Response time is slow: ${perfResult}ms`, 'WARN');
      } else {
        this.log(`✅ Performance check passed: ${perfResult}ms response time`);
      }
    } catch (error) {
      this.log(`⚠️ Performance check failed: ${error.message}`, 'WARN');
    }

    // Check logs for errors
    try {
      const logs = execSync(
        'ssh staging-server "docker logs --tail 50 financeanalyst_app 2>&1 | grep -i error || true"',
        { timeout: 10000 }
      );
      if (logs.toString().trim()) {
        this.log(`⚠️ Found errors in application logs:\n${logs}`, 'WARN');
      } else {
        this.log('✅ No errors found in recent application logs');
      }
    } catch (error) {
      this.log(`⚠️ Could not check application logs: ${error.message}`, 'WARN');
    }
  }

  async rollback() {
    this.log('🔄 Initiating rollback to previous version...');

    try {
      // Stop current containers
      execSync('ssh staging-server "cd /opt/financeanalyst && docker-compose down -t 0"');

      // Restore from backup
      execSync(`ssh staging-server "cp -r ${this.backupPath}/app/* /opt/financeanalyst/"`);

      // Restore database
      execSync(
        `ssh staging-server "PGPASSWORD=staging_pass psql -h localhost -U staging_user financeanalyst_staging < ${this.backupPath}/database.sql"`
      );

      // Start restored application
      execSync('ssh staging-server "cd /opt/financeanalyst && docker-compose up -d"');

      // Wait for application to start
      await this.waitForApplication(180); // 3 minutes timeout

      this.log('✅ Rollback completed successfully');
    } catch (error) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }
}

// Create curl format file for performance testing
const curlFormatPath = path.join(ROOT_DIR, 'curl-format.txt');
if (!fs.existsSync(curlFormatPath)) {
  fs.writeFileSync(curlFormatPath, '%{time_total}\\n');
}

// Run deployment
const deployer = new StagingDeployer();
deployer.run().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
