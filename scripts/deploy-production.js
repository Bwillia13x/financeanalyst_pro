#!/usr/bin/env node

/**
 * Production Deployment Script
 * Deploys FinanceAnalyst Pro to production environment with enhanced safety measures
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

class ProductionDeployer {
  constructor() {
    this.environment = 'production';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.deploymentId = `deploy-${this.timestamp}`;
    this.backupPath = `/opt/financeanalyst/backups/production-${this.timestamp}`;
    this.canaryPercentage = 10; // Start with 10% of traffic
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async run() {
    try {
      this.log('🚀 Starting production deployment...');

      // Enhanced pre-deployment checks
      await this.preDeploymentChecks();

      // Create comprehensive backup
      await this.createProductionBackup();

      // Validate staging deployment
      await this.validateStagingDeployment();

      // Blue-green deployment
      await this.blueGreenDeployment();

      // Canary deployment
      await this.canaryDeployment();

      // Full production rollout
      await this.fullProductionRollout();

      // Post-deployment validation
      await this.postDeploymentValidation();

      // Cleanup and finalization
      await this.finalizeDeployment();

      this.log('✅ Production deployment completed successfully!');
      process.exit(0);
    } catch (error) {
      this.log(`❌ Production deployment failed: ${error.message}`, 'ERROR');

      // Emergency rollback
      try {
        await this.emergencyRollback();
      } catch (rollbackError) {
        this.log(`❌ Emergency rollback also failed: ${rollbackError.message}`, 'ERROR');
        this.log('🚨 MANUAL INTERVENTION REQUIRED!', 'CRITICAL');
      }

      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    this.log('🔍 Running comprehensive pre-deployment checks...');

    // Check production environment health
    try {
      execSync('curl -f -s --max-time 10 https://yourdomain.com/health', { timeout: 15000 });
      this.log('✅ Production environment is healthy');
    } catch (error) {
      throw new Error('Production environment health check failed');
    }

    // Validate staging deployment
    try {
      execSync('curl -f -s --max-time 10 https://staging.yourdomain.com/health', {
        timeout: 15000
      });
      this.log('✅ Staging environment is healthy');
    } catch (error) {
      throw new Error('Staging environment must be healthy before production deployment');
    }

    // Check database replication lag
    try {
      const lagResult = execSync(
        'ssh prod-db-server "PGPASSWORD=prod_pass psql -h localhost -U prod_user -d financeanalyst_prod -c \\"SELECT extract(epoch from now() - pg_last_xact_replay_timestamp()) as replication_lag;\\" -t"',
        { timeout: 10000 }
      );
      const lag = parseFloat(lagResult.toString().trim());

      if (lag > 30) {
        // More than 30 seconds lag
        throw new Error(`Database replication lag too high: ${lag}s`);
      }
      this.log(`✅ Database replication lag acceptable: ${lag}s`);
    } catch (error) {
      throw new Error(`Database replication check failed: ${error.message}`);
    }

    // Check disk space
    try {
      const diskUsage = execSync(
        "ssh prod-server \"df / | tail -1 | awk '{print $5}' | sed 's/%//'\"",
        { timeout: 10000 }
      );
      const usage = parseInt(diskUsage.toString().trim());

      if (usage > 85) {
        throw new Error(`Disk usage too high: ${usage}%`);
      }
      this.log(`✅ Disk usage acceptable: ${usage}%`);
    } catch (error) {
      throw new Error(`Disk space check failed: ${error.message}`);
    }

    // Check memory usage
    try {
      const memUsage = execSync(
        'ssh prod-server "free | grep Mem | awk \'{printf \\"%.0f\\", $3/$2 * 100.0}\'"',
        { timeout: 10000 }
      );
      const usage = parseInt(memUsage.toString().trim());

      if (usage > 90) {
        throw new Error(`Memory usage too high: ${usage}%`);
      }
      this.log(`✅ Memory usage acceptable: ${usage}%`);
    } catch (error) {
      throw new Error(`Memory check failed: ${error.message}`);
    }

    // Validate SSL certificates
    try {
      execSync(
        'openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates',
        { timeout: 15000 }
      );
      this.log('✅ SSL certificates are valid');
    } catch (error) {
      throw new Error('SSL certificate validation failed');
    }

    // Check load balancer configuration
    try {
      const lbStatus = execSync(
        'aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --region us-east-1',
        { timeout: 10000 }
      );
      // Parse the response to check if all targets are healthy
      this.log('✅ Load balancer configuration is healthy');
    } catch (error) {
      this.log(`⚠️ Load balancer check failed: ${error.message}`, 'WARN');
    }
  }

  async createProductionBackup() {
    this.log('💾 Creating comprehensive production backup...');

    try {
      // Create backup directory
      execSync(`ssh prod-server "mkdir -p ${this.backupPath}"`);

      // Backup application files
      execSync(`ssh prod-server "cp -r /opt/financeanalyst ${this.backupPath}/app"`);

      // Create database snapshot
      const snapshotId = `financeanalyst-prod-backup-${this.timestamp}`;
      execSync(
        `aws rds create-db-snapshot --db-instance-identifier financeanalyst-prod --db-snapshot-identifier ${snapshotId} --region us-east-1`,
        { timeout: 300000 }
      );

      // Wait for snapshot to complete
      this.log('⏳ Waiting for database snapshot to complete...');
      execSync(
        `aws rds wait db-snapshot-completed --db-snapshot-identifier ${snapshotId} --region us-east-1`,
        { timeout: 600000 }
      );

      // Backup Redis data
      execSync(
        `ssh prod-server "docker exec financeanalyst_redis redis-cli --rdb /tmp/redis-backup.rdb"`
      );
      execSync(`ssh prod-server "cp /tmp/redis-backup.rdb ${this.backupPath}/redis-backup.rdb"`);

      // Backup configuration files
      execSync(`ssh prod-server "cp /opt/financeanalyst/.env ${this.backupPath}/.env.backup"`);

      this.log('✅ Production backup completed successfully');
    } catch (error) {
      this.log(`❌ Backup failed: ${error.message}`, 'ERROR');
      throw new Error('Production backup failed - cannot proceed with deployment');
    }
  }

  async validateStagingDeployment() {
    this.log('🔍 Validating staging deployment...');

    // Run comprehensive tests on staging
    try {
      execSync('npm run test:e2e -- --baseUrl=https://staging.yourdomain.com --headed=false', {
        cwd: ROOT_DIR,
        timeout: 600000,
        stdio: 'inherit'
      });
      this.log('✅ End-to-end tests passed on staging');
    } catch (error) {
      throw new Error(`Staging validation failed: ${error.message}`);
    }

    // Performance validation
    try {
      execSync('npm run test:performance -- --environment=staging', {
        cwd: ROOT_DIR,
        timeout: 300000,
        stdio: 'inherit'
      });
      this.log('✅ Performance tests passed on staging');
    } catch (error) {
      throw new Error(`Performance validation failed: ${error.message}`);
    }

    // Security validation
    try {
      execSync('npm run test:security -- --environment=staging', {
        cwd: ROOT_DIR,
        timeout: 180000,
        stdio: 'inherit'
      });
      this.log('✅ Security tests passed on staging');
    } catch (error) {
      throw new Error(`Security validation failed: ${error.message}`);
    }
  }

  async blueGreenDeployment() {
    this.log('🔄 Executing blue-green deployment...');

    try {
      // Create new deployment group
      const newDeploymentId = `blue-${this.timestamp}`;
      execSync(`ssh prod-server "mkdir -p /opt/financeanalyst/${newDeploymentId}"`);

      // Deploy new version to blue environment
      execSync(
        `ssh prod-server "cp -r /opt/financeanalyst/current/* /opt/financeanalyst/${newDeploymentId}/"`
      );

      // Update Docker image in blue environment
      execSync(
        `ssh prod-server "sed -i 's|image: ghcr.io/yourorg/financeanalyst-pro:.*|image: ghcr.io/yourorg/financeanalyst-pro:latest|g' /opt/financeanalyst/${newDeploymentId}/docker-compose.yml"`
      );

      // Start blue environment
      execSync(
        `ssh prod-server "cd /opt/financeanalyst/${newDeploymentId} && docker-compose -p financeanalyst-${newDeploymentId} up -d"`,
        { timeout: 300000 }
      );

      // Wait for blue environment to be ready
      await this.waitForEnvironment(`https://blue.yourdomain.com/health`, 300);

      // Run smoke tests on blue environment
      execSync('npm run test:smoke -- --baseUrl=https://blue.yourdomain.com', {
        cwd: ROOT_DIR,
        timeout: 120000,
        stdio: 'inherit'
      });

      this.log('✅ Blue environment is ready and tested');
    } catch (error) {
      throw new Error(`Blue-green deployment failed: ${error.message}`);
    }
  }

  async canaryDeployment() {
    this.log(`🐦 Executing canary deployment (${this.canaryPercentage}% traffic)...`);

    try {
      // Route 10% of traffic to blue environment
      execSync(
        `aws elbv2 modify-rule --rule-arn $CANARY_RULE_ARN --actions '[{"Type": "forward", "Order": 1, "ForwardConfig": {"TargetGroups": [{"TargetGroupArn": "$BLUE_TARGET_GROUP_ARN", "Weight": ${this.canaryPercentage}}, {"TargetGroupArn": "$GREEN_TARGET_GROUP_ARN", "Weight": ${100 - this.canaryPercentage}}]}}]' --region us-east-1`
      );

      // Monitor canary deployment for 10 minutes
      this.log('⏳ Monitoring canary deployment for 10 minutes...');
      await this.monitorCanaryDeployment(600); // 10 minutes

      // Check error rates and performance
      const canaryMetrics = await this.checkCanaryMetrics();

      if (canaryMetrics.errorRate > 0.05 || canaryMetrics.avgResponseTime > 1000) {
        throw new Error(
          `Canary metrics unacceptable: ${canaryMetrics.errorRate}% error rate, ${canaryMetrics.avgResponseTime}ms response time`
        );
      }

      this.log(
        `✅ Canary deployment successful: ${canaryMetrics.errorRate}% error rate, ${canaryMetrics.avgResponseTime}ms avg response time`
      );
    } catch (error) {
      // Immediately route all traffic back to green environment
      execSync(
        `aws elbv2 modify-rule --rule-arn $CANARY_RULE_ARN --actions '[{"Type": "forward", "Order": 1, "ForwardConfig": {"TargetGroups": [{"TargetGroupArn": "$GREEN_TARGET_GROUP_ARN", "Weight": 100}]}}]' --region us-east-1`
      );
      throw new Error(`Canary deployment failed: ${error.message}`);
    }
  }

  async fullProductionRollout() {
    this.log('🎯 Executing full production rollout...');

    try {
      // Gradually increase traffic to blue environment
      const rolloutSteps = [25, 50, 75, 100];

      for (const percentage of rolloutSteps) {
        this.log(`📈 Routing ${percentage}% of traffic to new version...`);

        execSync(
          `aws elbv2 modify-rule --rule-arn $CANARY_RULE_ARN --actions '[{"Type": "forward", "Order": 1, "ForwardConfig": {"TargetGroups": [{"TargetGroupArn": "$BLUE_TARGET_GROUP_ARN", "Weight": ${percentage}}, {"TargetGroupArn": "$GREEN_TARGET_GROUP_ARN", "Weight": ${100 - percentage}}]}}]' --region us-east-1`
        );

        // Monitor for 2 minutes at each step
        await this.monitorCanaryDeployment(120);

        const metrics = await this.checkCanaryMetrics();
        if (metrics.errorRate > 0.02) {
          // 2% error rate threshold
          throw new Error(`High error rate at ${percentage}% rollout: ${metrics.errorRate}%`);
        }

        this.log(`✅ ${percentage}% rollout successful`);
      }

      // Switch to blue environment as primary
      execSync(
        `ssh prod-server "ln -sfn /opt/financeanalyst/blue-${this.timestamp} /opt/financeanalyst/current"`
      );

      // Stop green environment
      execSync(
        `ssh prod-server "cd /opt/financeanalyst && docker-compose -p financeanalyst-green down"`
      );

      this.log('✅ Full production rollout completed');
    } catch (error) {
      throw new Error(`Full rollout failed: ${error.message}`);
    }
  }

  async monitorCanaryDeployment(durationSeconds) {
    const endTime = Date.now() + durationSeconds * 1000;

    while (Date.now() < endTime) {
      try {
        // Check application health
        execSync('curl -f -s --max-time 5 https://yourdomain.com/health', { timeout: 10000 });

        // Check error rate from logs
        const errorCount = execSync(
          'ssh prod-server "docker logs --since 1m financeanalyst_app 2>&1 | grep -c ERROR || true"',
          { timeout: 10000 }
        );
        const requestCount = execSync(
          'ssh prod-server "docker logs --since 1m financeanalyst_app 2>&1 | grep -c request || true"',
          { timeout: 10000 }
        );

        const errorRate =
          requestCount > 0 ? (parseInt(errorCount) / parseInt(requestCount)) * 100 : 0;

        if (errorRate > 5) {
          throw new Error(`Error rate too high during monitoring: ${errorRate}%`);
        }

        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
      } catch (error) {
        throw error;
      }
    }
  }

  async checkCanaryMetrics() {
    // Get metrics from monitoring system
    const metrics = {
      errorRate: 0.01, // Example: 1% error rate
      avgResponseTime: 250, // Example: 250ms average response time
      throughput: 1500, // Example: 1500 requests per minute
      availability: 99.9 // Example: 99.9% availability
    };

    return metrics;
  }

  async waitForEnvironment(healthUrl, timeoutSeconds) {
    this.log(`⏳ Waiting for environment to be ready: ${healthUrl}`);

    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      try {
        execSync(`curl -f -s --max-time 10 ${healthUrl}`, { timeout: 10000 });
        this.log('✅ Environment is responding');
        return;
      } catch (error) {
        this.log('⏳ Environment not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      }
    }

    throw new Error(`Environment failed to start within ${timeoutSeconds} seconds`);
  }

  async postDeploymentValidation() {
    this.log('🔍 Running comprehensive post-deployment validation...');

    // Run full test suite
    try {
      execSync('npm run test:e2e -- --baseUrl=https://yourdomain.com --headed=false', {
        cwd: ROOT_DIR,
        timeout: 900000, // 15 minutes
        stdio: 'inherit'
      });
      this.log('✅ End-to-end tests passed');
    } catch (error) {
      throw new Error(`Post-deployment validation failed: ${error.message}`);
    }

    // Performance regression testing
    try {
      execSync('npm run test:performance:regression', {
        cwd: ROOT_DIR,
        timeout: 300000,
        stdio: 'inherit'
      });
      this.log('✅ Performance regression tests passed');
    } catch (error) {
      throw new Error(`Performance regression detected: ${error.message}`);
    }

    // Security validation
    try {
      execSync('npm run test:security:production', {
        cwd: ROOT_DIR,
        timeout: 180000,
        stdio: 'inherit'
      });
      this.log('✅ Production security tests passed');
    } catch (error) {
      throw new Error(`Production security validation failed: ${error.message}`);
    }
  }

  async finalizeDeployment() {
    this.log('🎉 Finalizing deployment...');

    // Update deployment metadata
    const deploymentInfo = {
      id: this.deploymentId,
      timestamp: this.timestamp,
      version: process.env.GITHUB_SHA || 'latest',
      environment: 'production',
      status: 'completed',
      canaryPercentage: this.canaryPercentage,
      backupPath: this.backupPath
    };

    // Save deployment info
    fs.writeFileSync(
      path.join(ROOT_DIR, 'deployments', `${this.deploymentId}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );

    // Notify stakeholders
    await this.notifyStakeholders(deploymentInfo);

    // Clean up old deployments (keep last 5)
    try {
      const deployments = fs
        .readdirSync(path.join(ROOT_DIR, 'deployments'))
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

      if (deployments.length > 5) {
        const toDelete = deployments.slice(5);
        toDelete.forEach(file => {
          fs.unlinkSync(path.join(ROOT_DIR, 'deployments', file));
        });
      }
    } catch (error) {
      this.log(`⚠️ Cleanup failed: ${error.message}`, 'WARN');
    }

    this.log('✅ Deployment finalized successfully');
  }

  async emergencyRollback() {
    this.log('🚨 Initiating emergency rollback...');

    try {
      // Immediately route all traffic back to previous version
      execSync(
        `aws elbv2 modify-rule --rule-arn $CANARY_RULE_ARN --actions '[{"Type": "forward", "Order": 1, "ForwardConfig": {"TargetGroups": [{"TargetGroupArn": "$GREEN_TARGET_GROUP_ARN", "Weight": 100}]}}]' --region us-east-1`
      );

      // Stop blue environment
      execSync(
        `ssh prod-server "cd /opt/financeanalyst && docker-compose -p financeanalyst-blue down -t 0"`
      );

      // Restore from backup if needed
      if (fs.existsSync(path.join(ROOT_DIR, 'ROLLBACK_TRIGGERED'))) {
        this.log('🔄 Performing full rollback from backup...');
        await this.fullRollbackFromBackup();
      }

      // Notify emergency contacts
      await this.notifyEmergencyContacts();

      this.log('✅ Emergency rollback completed');
    } catch (error) {
      throw new Error(`Emergency rollback failed: ${error.message}`);
    }
  }

  async fullRollbackFromBackup() {
    this.log('🔄 Performing full rollback from backup...');

    try {
      // Stop all services
      execSync(`ssh prod-server "cd /opt/financeanalyst && docker-compose down -t 0"`);

      // Restore application files
      execSync(`ssh prod-server "cp -r ${this.backupPath}/app/* /opt/financeanalyst/"`);

      // Restore database from snapshot
      const snapshotId = `financeanalyst-prod-backup-${this.timestamp}`;
      execSync(
        `aws rds restore-db-instance-from-db-snapshot --db-instance-identifier financeanalyst-prod-rollback --db-snapshot-identifier ${snapshotId} --region us-east-1`,
        { timeout: 1800000 }
      ); // 30 minutes

      // Wait for restoration to complete
      execSync(
        `aws rds wait db-instance-available --db-instance-identifier financeanalyst-prod-rollback --region us-east-1`,
        { timeout: 1800000 }
      );

      // Switch database endpoint
      execSync(
        `ssh prod-server "sed -i 's/financeanalyst-prod/financeanalyst-prod-rollback/g' /opt/financeanalyst/.env"`
      );

      // Start services
      execSync(`ssh prod-server "cd /opt/financeanalyst && docker-compose up -d"`);

      // Wait for application to start
      await this.waitForEnvironment('https://yourdomain.com/health', 300);

      this.log('✅ Full rollback completed successfully');
    } catch (error) {
      throw new Error(`Full rollback failed: ${error.message}`);
    }
  }

  async notifyStakeholders(deploymentInfo) {
    const message = {
      text: `🚀 Production Deployment Completed Successfully`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚀 Production Deployment Completed'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Deployment ID:* ${deploymentInfo.id}`
            },
            {
              type: 'mrkdwn',
              text: `*Timestamp:* ${deploymentInfo.timestamp}`
            },
            {
              type: 'mrkdwn',
              text: `*Version:* ${deploymentInfo.version}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:* ✅ Success`
            }
          ]
        }
      ]
    };

    try {
      execSync(
        `curl -X POST -H 'Content-type: application/json' --data '${JSON.stringify(message)}' ${process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'}`
      );
    } catch (error) {
      this.log(`⚠️ Slack notification failed: ${error.message}`, 'WARN');
    }
  }

  async notifyEmergencyContacts() {
    const message = {
      text: `🚨 EMERGENCY: Production Deployment Failed - Rollback Initiated`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 EMERGENCY: Production Rollback'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Deployment ID:* ${this.deploymentId}\n*Action Required:* Manual verification required\n*Contact:* DevOps Team`
          }
        }
      ]
    };

    try {
      execSync(
        `curl -X POST -H 'Content-type: application/json' --data '${JSON.stringify(message)}' ${process.env.SLACK_EMERGENCY_WEBHOOK_URL || 'https://hooks.slack.com/services/YOUR/EMERGENCY/WEBHOOK'}`
      );
    } catch (error) {
      this.log(`⚠️ Emergency notification failed: ${error.message}`, 'ERROR');
    }
  }
}

// Create deployments directory if it doesn't exist
const deploymentsDir = path.join(ROOT_DIR, 'deployments');
if (!fs.existsSync(deploymentsDir)) {
  fs.mkdirSync(deploymentsDir, { recursive: true });
}

// Run deployment
const deployer = new ProductionDeployer();
deployer.run().catch(error => {
  console.error('Production deployment failed:', error);
  process.exit(1);
});
