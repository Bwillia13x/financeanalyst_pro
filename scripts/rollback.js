#!/usr/bin/env node

/**
 * Rollback Script
 * Rolls back FinanceAnalyst Pro to previous version
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

class RollbackManager {
  constructor() {
    this.environment = process.argv[2] || 'production';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async run() {
    try {
      this.log(`🔄 Starting rollback for ${this.environment} environment...`);

      // Validate rollback prerequisites
      await this.validateRollbackPrerequisites();

      // Execute rollback
      if (this.environment === 'production') {
        await this.productionRollback();
      } else if (this.environment === 'staging') {
        await this.stagingRollback();
      } else {
        throw new Error(`Unsupported environment: ${this.environment}`);
      }

      // Post-rollback validation
      await this.postRollbackValidation();

      this.log(`✅ Rollback completed successfully for ${this.environment}!`);
      process.exit(0);
    } catch (error) {
      this.log(`❌ Rollback failed: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }

  async validateRollbackPrerequisites() {
    this.log('🔍 Validating rollback prerequisites...');

    // Check if backup exists
    const backupDir = `/opt/financeanalyst/backups`;
    try {
      const backups = execSync(`ssh ${this.environment}-server "ls -t ${backupDir} | head -1"`, {
        timeout: 10000
      });
      if (!backups.toString().trim()) {
        throw new Error('No backup found for rollback');
      }
      this.log('✅ Backup found for rollback');
    } catch (error) {
      throw new Error(`Backup validation failed: ${error.message}`);
    }

    // Check current application health
    try {
      execSync(`curl -f -s --max-time 10 https://${this.environment}.yourdomain.com/health`, {
        timeout: 15000
      });
      this.log(`⚠️ Current ${this.environment} application is healthy - proceeding with caution`);
    } catch (error) {
      this.log(`✅ Current ${this.environment} application is not healthy - rollback recommended`);
    }
  }

  async productionRollback() {
    this.log('🔄 Executing production rollback...');

    // Get latest backup
    const latestBackup = execSync(`ssh prod-server "ls -t /opt/financeanalyst/backups | head -1"`, {
      timeout: 10000
    })
      .toString()
      .trim();

    if (!latestBackup) {
      throw new Error('No backup found for production rollback');
    }

    const backupPath = `/opt/financeanalyst/backups/${latestBackup}`;

    try {
      // Route traffic to maintenance page
      execSync(
        `aws elbv2 modify-rule --rule-arn $MAINTENANCE_RULE_ARN --actions '[{"Type": "fixed-response", "FixedResponseConfig": {"MessageBody": "System maintenance in progress", "StatusCode": "503", "ContentType": "text/plain"}}]' --region us-east-1`
      );

      // Stop current application
      execSync(`ssh prod-server "cd /opt/financeanalyst && docker-compose down -t 30"`);

      // Restore application files
      execSync(`ssh prod-server "cp -r ${backupPath}/app/* /opt/financeanalyst/"`);

      // Restore database from snapshot
      const snapshotId = `${latestBackup}`;
      execSync(
        `aws rds restore-db-instance-from-db-snapshot --db-instance-identifier financeanalyst-prod-rollback --db-snapshot-identifier ${snapshotId} --region us-east-1`,
        { timeout: 1800000 }
      );

      // Wait for database restoration
      execSync(
        `aws rds wait db-instance-available --db-instance-identifier financeanalyst-prod-rollback --region us-east-1`,
        { timeout: 1800000 }
      );

      // Update database endpoint
      execSync(
        `ssh prod-server "sed -i 's/financeanalyst-prod/financeanalyst-prod-rollback/g' /opt/financeanalyst/.env"`
      );

      // Start application
      execSync(`ssh prod-server "cd /opt/financeanalyst && docker-compose up -d"`);

      // Wait for application to start
      await this.waitForApplication(300);

      // Route traffic back to application
      execSync(
        `aws elbv2 modify-rule --rule-arn $MAINTENANCE_RULE_ARN --actions '[{"Type": "forward", "Order": 1, "ForwardConfig": {"TargetGroups": [{"TargetGroupArn": "$PROD_TARGET_GROUP_ARN", "Weight": 100}]}}]' --region us-east-1`
      );

      this.log('✅ Production rollback completed');
    } catch (error) {
      // If rollback fails, try to restore traffic
      try {
        execSync(
          `aws elbv2 modify-rule --rule-arn $MAINTENANCE_RULE_ARN --actions '[{"Type": "forward", "Order": 1, "ForwardConfig": {"TargetGroups": [{"TargetGroupArn": "$PROD_TARGET_GROUP_ARN", "Weight": 100}]}}]' --region us-east-1`
        );
      } catch (trafficError) {
        this.log(`❌ Failed to restore traffic: ${trafficError.message}`, 'CRITICAL');
      }
      throw error;
    }
  }

  async stagingRollback() {
    this.log('🔄 Executing staging rollback...');

    try {
      // Get latest backup
      const latestBackup = execSync(
        `ssh staging-server "ls -t /opt/financeanalyst/backups | head -1"`,
        { timeout: 10000 }
      )
        .toString()
        .trim();

      if (!latestBackup) {
        throw new Error('No backup found for staging rollback');
      }

      const backupPath = `/opt/financeanalyst/backups/${latestBackup}`;

      // Stop current application
      execSync(`ssh staging-server "cd /opt/financeanalyst && docker-compose down -t 30"`);

      // Restore application files
      execSync(`ssh staging-server "cp -r ${backupPath}/app/* /opt/financeanalyst/"`);

      // Restore database
      execSync(
        `ssh staging-server "PGPASSWORD=staging_pass psql -h localhost -U staging_user financeanalyst_staging < ${backupPath}/database.sql"`
      );

      // Start application
      execSync(`ssh staging-server "cd /opt/financeanalyst && docker-compose up -d"`);

      // Wait for application to start
      await this.waitForApplication(180);

      this.log('✅ Staging rollback completed');
    } catch (error) {
      throw error;
    }
  }

  async waitForApplication(timeoutSeconds) {
    const healthUrl = `https://${this.environment}.yourdomain.com/health`;
    this.log(`⏳ Waiting for application to start: ${healthUrl}`);

    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      try {
        execSync(`curl -f -s --max-time 10 ${healthUrl}`, { timeout: 10000 });
        this.log('✅ Application is responding');
        return;
      } catch (error) {
        this.log('⏳ Application not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    throw new Error(`Application failed to start within ${timeoutSeconds} seconds`);
  }

  async postRollbackValidation() {
    this.log('🔍 Running post-rollback validation...');

    // Health check
    try {
      execSync(`curl -f -s --max-time 10 https://${this.environment}.yourdomain.com/health`, {
        timeout: 15000
      });
      this.log('✅ Application health check passed');
    } catch (error) {
      throw new Error('Application health check failed after rollback');
    }

    // API validation
    try {
      execSync(`curl -f -s --max-time 10 https://${this.environment}-api.yourdomain.com/health`, {
        timeout: 15000
      });
      this.log('✅ API health check passed');
    } catch (error) {
      this.log('⚠️ API health check failed, but continuing...');
    }

    // Database connectivity
    try {
      const dbCheck =
        this.environment === 'production'
          ? 'ssh prod-db-server "PGPASSWORD=prod_pass psql -h localhost -U prod_user -d financeanalyst_prod -c \'SELECT 1;\'"'
          : 'ssh staging-server "PGPASSWORD=staging_pass psql -h localhost -U staging_user financeanalyst_staging -c \'SELECT 1;\'"';

      execSync(dbCheck, { timeout: 10000 });
      this.log('✅ Database connectivity verified');
    } catch (error) {
      throw new Error('Database connectivity check failed after rollback');
    }

    // Run smoke tests
    try {
      execSync(`npm run test:smoke -- --baseUrl=https://${this.environment}.yourdomain.com`, {
        cwd: ROOT_DIR,
        timeout: 120000,
        stdio: 'inherit'
      });
      this.log('✅ Smoke tests passed');
    } catch (error) {
      this.log(`⚠️ Smoke tests failed: ${error.message}`, 'WARN');
    }
  }
}

// Run rollback
const rollbackManager = new RollbackManager();
rollbackManager.run().catch(error => {
  console.error('Rollback failed:', error);
  process.exit(1);
});
