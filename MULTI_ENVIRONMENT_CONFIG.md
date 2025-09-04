# 🌍 Multi-Environment Configuration Guide

## Executive Summary

This comprehensive guide provides configuration strategies for managing multiple environments (development, staging, production) for the FinanceAnalyst Pro system. It covers environment-specific configurations, deployment pipelines, and best practices for maintaining consistency across environments.

---

## 📋 Table of Contents

1. [Environment Strategy](#environment-strategy)
2. [Configuration Management](#configuration-management)
3. [Infrastructure as Code](#infrastructure-as-code)
4. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
5. [Database Management](#database-management)
6. [Secrets Management](#secrets-management)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Testing Strategy](#testing-strategy)

---

## 🏗️ Environment Strategy

### Environment Definitions

#### **Development Environment**
```
Purpose: Active development and feature testing
Access: Development team only
Data: Mock/test data, no real customer data
Uptime: Business hours only
Backup: Daily backups, 7-day retention
Monitoring: Basic error tracking
```

#### **Staging Environment**
```
Purpose: Pre-production testing and validation
Access: QA team and select developers
Data: Anonymized production-like data
Uptime: 99% availability during business hours
Backup: Daily backups, 30-day retention
Monitoring: Full production monitoring
```

#### **Production Environment**
```
Purpose: Live production system
Access: Restricted, role-based access only
Data: Real customer data, full compliance
Uptime: 99.9% SLA
Backup: Multiple backup strategies, 90-day retention
Monitoring: Full production monitoring with alerting
```

### Environment Architecture

#### **Development Architecture**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DEBUG=*
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=financeanalyst_dev
      - POSTGRES_USER=dev_user
      - POSTGRES_PASSWORD=dev_password
    ports:
      - "5432:5432"
    volumes:
      - dev_db_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  dev_db_data:
```

#### **Staging Architecture**
```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  app:
    image: financeanalyst-pro:staging
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=staging
    secrets:
      - db_password
      - redis_password
      - api_keys
    depends_on:
      - db
      - redis
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=financeanalyst_staging
      - POSTGRES_USER=staging_user
    secrets:
      - db_password
    volumes:
      - staging_db_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  redis:
    image: redis:7-alpine
    secrets:
      - redis_password
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

secrets:
  db_password:
    file: ./secrets/staging/db_password.txt
  redis_password:
    file: ./secrets/staging/redis_password.txt
  api_keys:
    file: ./secrets/staging/api_keys.json

volumes:
  staging_db_data:
```

#### **Production Architecture**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: financeanalyst-pro:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    secrets:
      - db_password
      - redis_password
      - jwt_secret
      - api_keys
      - ssl_certs
    depends_on:
      - db
      - redis
    deploy:
      mode: replicated
      replicas: 3
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
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        monitor: 60s
        max_failure_ratio: 0.3

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=financeanalyst_prod
      - POSTGRES_USER=prod_user
    secrets:
      - db_password
    volumes:
      - prod_db_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
      placement:
        constraints:
          - node.role == manager

  redis:
    image: redis:7-alpine
    secrets:
      - redis_password
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    secrets:
      - ssl_certs
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

secrets:
  db_password:
    external: true
  redis_password:
    external: true
  jwt_secret:
    external: true
  api_keys:
    external: true
  ssl_certs:
    external: true

volumes:
  prod_db_data:
    driver: local
```

---

## ⚙️ Configuration Management

### Environment-Specific Configuration

#### **Configuration Hierarchy**
```javascript
// config/index.js - Configuration loader
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigManager {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.config = this.loadConfiguration();
  }

  loadConfiguration() {
    // Base configuration
    const baseConfig = this.loadConfigFile('default.json');

    // Environment-specific configuration
    const envConfig = this.loadConfigFile(`${this.env}.json`);

    // Local overrides (not committed to git)
    const localConfig = this.loadConfigFile('local.json');

    // Environment variables (highest priority)
    const envVars = this.loadEnvironmentVariables();

    // Merge configurations (environment variables take precedence)
    return this.deepMerge(baseConfig, envConfig, localConfig, envVars);
  }

  loadConfigFile(filename) {
    const filePath = path.join(__dirname, filename);

    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Could not load config file ${filename}:`, error.message);
    }

    return {};
  }

  loadEnvironmentVariables() {
    const envConfig = {};

    // Database configuration
    if (process.env.DATABASE_URL) {
      envConfig.database = { url: process.env.DATABASE_URL };
    } else {
      envConfig.database = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      };
    }

    // Redis configuration
    envConfig.redis = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    };

    // JWT configuration
    envConfig.jwt = {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    };

    // External API keys
    envConfig.apiKeys = {
      marketData: process.env.MARKET_DATA_API_KEY,
      news: process.env.NEWS_API_KEY,
      email: process.env.EMAIL_API_KEY
    };

    return envConfig;
  }

  deepMerge(...objects) {
    const result = {};

    for (const obj of objects) {
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = this.deepMerge(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key] || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      return obj[key];
    }, this.config);

    target[lastKey] = value;
  }

  // Environment-specific getters
  isDevelopment() {
    return this.env === 'development';
  }

  isStaging() {
    return this.env === 'staging';
  }

  isProduction() {
    return this.env === 'production';
  }

  // Feature flags
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`) === true;
  }
}

// Export singleton instance
export default new ConfigManager();
```

#### **Configuration Files Structure**
```
config/
├── default.json          # Base configuration
├── development.json      # Development overrides
├── staging.json         # Staging overrides
├── production.json      # Production overrides
└── local.json          # Local overrides (gitignored)
```

#### **Default Configuration**
```json
// config/default.json
{
  "app": {
    "name": "FinanceAnalyst Pro",
    "version": "1.0.0",
    "port": 3000,
    "host": "localhost"
  },
  "database": {
    "dialect": "postgresql",
    "pool": {
      "min": 2,
      "max": 10,
      "idle": 30000,
      "acquire": 60000
    },
    "logging": false
  },
  "redis": {
    "ttl": 3600,
    "prefix": "fa:"
  },
  "jwt": {
    "algorithm": "HS256"
  },
  "rateLimit": {
    "windowMs": 900000,
    "max": 100
  },
  "cors": {
    "origin": false,
    "credentials": true
  },
  "logging": {
    "level": "info",
    "format": "json"
  },
  "features": {
    "analytics": true,
    "realTimeData": true,
    "export": true,
    "api": true
  }
}
```

#### **Environment-Specific Overrides**
```json
// config/development.json
{
  "app": {
    "port": 3000,
    "host": "localhost"
  },
  "database": {
    "logging": true,
    "pool": {
      "min": 1,
      "max": 5
    }
  },
  "logging": {
    "level": "debug",
    "format": "dev"
  },
  "cors": {
    "origin": "*"
  },
  "features": {
    "debugMode": true,
    "mockData": true
  }
}
```

```json
// config/staging.json
{
  "app": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "database": {
    "pool": {
      "min": 5,
      "max": 20
    }
  },
  "logging": {
    "level": "warn"
  },
  "cors": {
    "origin": "https://staging.yourdomain.com"
  },
  "features": {
    "maintenanceMode": false
  }
}
```

```json
// config/production.json
{
  "app": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "database": {
    "pool": {
      "min": 10,
      "max": 50,
      "idle": 60000,
      "acquire": 120000
    },
    "ssl": true
  },
  "redis": {
    "ssl": true
  },
  "logging": {
    "level": "error"
  },
  "rateLimit": {
    "windowMs": 900000,
    "max": 1000
  },
  "cors": {
    "origin": [
      "https://yourdomain.com",
      "https://app.yourdomain.com"
    ]
  },
  "features": {
    "maintenanceMode": false,
    "highAvailability": true,
    "backup": true
  }
}
```

### Configuration Validation

#### **Schema Validation**
```javascript
// config/schema.js - Configuration schema validation
import Joi from 'joi';

const configSchema = Joi.object({
  app: Joi.object({
    name: Joi.string().required(),
    version: Joi.string().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    host: Joi.string().required()
  }).required(),

  database: Joi.object({
    dialect: Joi.string().valid('postgresql', 'mysql', 'sqlite').required(),
    host: Joi.string().when('dialect', {
      is: 'sqlite',
      then: Joi.forbidden(),
      otherwise: Joi.string().required()
    }),
    port: Joi.number().integer().min(1).max(65535),
    name: Joi.string().required(),
    user: Joi.string().when('dialect', {
      is: 'sqlite',
      then: Joi.forbidden(),
      otherwise: Joi.string().required()
    }),
    password: Joi.string().when('dialect', {
      is: 'sqlite',
      then: Joi.forbidden(),
      otherwise: Joi.string().required()
    }),
    pool: Joi.object({
      min: Joi.number().integer().min(0).required(),
      max: Joi.number().integer().min(1).required(),
      idle: Joi.number().integer().min(0).required(),
      acquire: Joi.number().integer().min(0).required()
    }).required(),
    ssl: Joi.boolean(),
    logging: Joi.boolean()
  }).required(),

  redis: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    password: Joi.string(),
    ttl: Joi.number().integer().min(0).required(),
    prefix: Joi.string().required(),
    ssl: Joi.boolean()
  }).required(),

  jwt: Joi.object({
    secret: Joi.string().min(32).required(),
    algorithm: Joi.string().valid('HS256', 'HS384', 'HS512').required(),
    expiresIn: Joi.string().required(),
    refreshExpiresIn: Joi.string().required()
  }).required(),

  rateLimit: Joi.object({
    windowMs: Joi.number().integer().min(0).required(),
    max: Joi.number().integer().min(1).required()
  }).required(),

  cors: Joi.object({
    origin: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string(),
      Joi.array().items(Joi.string())
    ).required(),
    credentials: Joi.boolean()
  }).required(),

  logging: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
    format: Joi.string().valid('json', 'dev', 'combined').required()
  }).required(),

  features: Joi.object().pattern(
    Joi.string(),
    Joi.boolean()
  ).required()
});

export const validateConfig = (config) => {
  const { error, value } = configSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context.value
    }));

    throw new Error(`Configuration validation failed:\n${errors.map(e =>
      `  ${e.field}: ${e.message}`
    ).join('\n')}`);
  }

  return value;
};
```

---

## 🏗️ Infrastructure as Code

### Terraform Configuration

#### **Main Terraform Configuration**
```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "financeanalyst-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "financeanalyst-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"

  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  az_count    = var.az_count
}

module "ecs" {
  source = "./modules/ecs"

  environment       = var.environment
  vpc_id           = module.vpc.vpc_id
  private_subnets  = module.vpc.private_subnets
  public_subnets   = module.vpc.public_subnets
  certificate_arn  = var.certificate_arn
}

module "rds" {
  source = "./modules/rds"

  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  db_name         = var.db_name
  db_username     = var.db_username
}

module "redis" {
  source = "./modules/redis"

  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
}

module "monitoring" {
  source = "./modules/monitoring"

  environment = var.environment
  vpc_id     = module.vpc.vpc_id
}
```

#### **Environment-Specific Variables**
```hcl
# environments/development.tfvars
environment = "development"
aws_region  = "us-east-1"
vpc_cidr    = "10.0.0.0/16"
az_count    = 2

db_name     = "financeanalyst_dev"
db_username = "dev_user"

certificate_arn = ""
```

```hcl
# environments/staging.tfvars
environment = "staging"
aws_region  = "us-east-1"
vpc_cidr    = "10.1.0.0/16"
az_count    = 3

db_name     = "financeanalyst_staging"
db_username = "staging_user"

certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/staging-cert"
```

```hcl
# environments/production.tfvars
environment = "production"
aws_region  = "us-east-1"
vpc_cidr    = "10.2.0.0/16"
az_count    = 3

db_name     = "financeanalyst_prod"
db_username = "prod_user"

certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/prod-cert"
```

### Ansible Playbooks

#### **Base Server Configuration**
```yaml
# ansible/playbooks/base.yml
---
- name: Configure base server settings
  hosts: all
  become: yes
  vars_files:
    - "vars/{{ environment }}.yml"

  pre_tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == 'Debian'

  roles:
    - role: common
      tags: common

    - role: security
      tags: security

    - role: monitoring
      tags: monitoring

    - role: docker
      tags: docker

  post_tasks:
    - name: Reboot if required
      reboot:
      when: ansible_reboot_required
```

#### **Application Deployment**
```yaml
# ansible/playbooks/deploy.yml
---
- name: Deploy FinanceAnalyst Pro
  hosts: app_servers
  become: yes
  vars_files:
    - "vars/{{ environment }}.yml"

  tasks:
    - name: Pull latest Docker image
      docker_image:
        name: "financeanalyst-pro:latest"
        source: pull

    - name: Stop existing containers
      docker_container:
        name: "{{ item }}"
        state: stopped
      loop:
        - financeanalyst-app
      ignore_errors: yes

    - name: Remove existing containers
      docker_container:
        name: "{{ item }}"
        state: absent
      loop:
        - financeanalyst-app
      ignore_errors: yes

    - name: Start application container
      docker_container:
        name: financeanalyst-app
        image: "financeanalyst-pro:latest"
        state: started
        restart_policy: unless-stopped
        ports:
          - "3000:3000"
        env:
          NODE_ENV: "{{ environment }}"
          DATABASE_URL: "{{ database_url }}"
          REDIS_URL: "{{ redis_url }}"
        volumes:
          - "/opt/financeanalyst/logs:/app/logs"
          - "/opt/financeanalyst/data:/app/data"

    - name: Wait for application to be ready
      uri:
        url: "http://localhost:3000/health"
        status_code: 200
      register: health_check
      until: health_check.status == 200
      retries: 30
      delay: 10

    - name: Update load balancer
      when: environment != 'development'
      uri:
        url: "{{ load_balancer_api_url }}/backend"
        method: POST
        body:
          server: "{{ inventory_hostname }}:3000"
          weight: 100
        status_code: 200
```

### Environment-Specific Configurations

#### **Development Environment**
```yaml
# ansible/vars/development.yml
---
environment: development
debug_mode: true
log_level: debug

database_url: postgresql://dev_user:dev_pass@localhost:5432/financeanalyst_dev
redis_url: redis://localhost:6379

features:
  analytics: false
  real_time_data: false
  export: true
  api: true
  debug_mode: true
  mock_data: true
```

#### **Staging Environment**
```yaml
# ansible/vars/staging.yml
---
environment: staging
debug_mode: false
log_level: warn

database_url: "{{ vault_database_url }}"
redis_url: "{{ vault_redis_url }}"

features:
  analytics: true
  real_time_data: true
  export: true
  api: true
  debug_mode: false
  mock_data: false

monitoring:
  enabled: true
  alerts: true
  dashboard: true

backup:
  enabled: true
  frequency: daily
  retention: 30
```

#### **Production Environment**
```yaml
# ansible/vars/production.yml
---
environment: production
debug_mode: false
log_level: error

database_url: "{{ vault_database_url }}"
redis_url: "{{ vault_redis_url }}"

features:
  analytics: true
  real_time_data: true
  export: true
  api: true
  debug_mode: false
  mock_data: false
  high_availability: true
  backup: true

monitoring:
  enabled: true
  alerts: true
  dashboard: true
  metrics: true

backup:
  enabled: true
  frequency: hourly
  retention: 90

security:
  ssl: true
  hsts: true
  rate_limiting: true
  ip_whitelist: "{{ vault_ip_whitelist }}"
```

---

## 🔄 CI/CD Pipeline Configuration

### GitHub Actions Workflows

#### **Environment-Specific Deployment**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Environment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
        - development
        - staging
        - production
      version:
        description: 'Version to deploy'
        required: false
        default: 'latest'
        type: string

env:
  ENVIRONMENT: ${{ github.event.inputs.environment }}
  VERSION: ${{ github.event.inputs.version }}

jobs:
  validate:
    name: 'Validate Deployment'
    runs-on: ubuntu-latest
    environment: ${{ env.ENVIRONMENT }}

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

    - name: Run tests
      run: npm run test:ci

    - name: Build application
      run: npm run build

    - name: Validate configuration
      run: npm run config:validate -- --env ${{ env.ENVIRONMENT }}

  deploy:
    name: 'Deploy Application'
    runs-on: ubuntu-latest
    needs: validate
    environment: ${{ env.ENVIRONMENT }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: financeanalyst-pro
        IMAGE_TAG: ${{ env.VERSION }}
      run: |
        # Build Docker image
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .

        # Tag as latest for non-production
        if [ "${{ env.ENVIRONMENT }}" != "production" ]; then
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        fi

        # Push images
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        if [ "${{ env.ENVIRONMENT }}" != "production" ]; then
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
        fi

    - name: Deploy to ECS
      run: |
        # Update ECS service
        aws ecs update-service \
          --cluster financeanalyst-${{ env.ENVIRONMENT }} \
          --service financeanalyst-service \
          --force-new-deployment \
          --region us-east-1

        # Wait for deployment to complete
        aws ecs wait services-stable \
          --cluster financeanalyst-${{ env.ENVIRONMENT }} \
          --services financeanalyst-service \
          --region us-east-1

    - name: Run health checks
      run: |
        # Get load balancer DNS name
        LB_DNS=$(aws elbv2 describe-load-balancers \
          --names financeanalyst-${{ env.ENVIRONMENT }} \
          --region us-east-1 \
          --query 'LoadBalancers[0].DNSName' \
          --output text)

        # Wait for application to be ready
        for i in {1..30}; do
          if curl -f -s --max-time 10 "https://$LB_DNS/health" > /dev/null 2>&1; then
            echo "✅ Application is healthy"
            break
          else
            echo "Health check attempt $i failed, retrying..."
            sleep 10
          fi
        done

        # Run smoke tests
        npm run test:smoke -- --baseUrl "https://$LB_DNS"

    - name: Notify deployment status
      if: always()
      run: |
        STATUS="${{ job.status }}"
        MESSAGE=""

        if [ "$STATUS" = "success" ]; then
          MESSAGE="✅ Deployment to ${{ env.ENVIRONMENT }} completed successfully"
        else
          MESSAGE="❌ Deployment to ${{ env.ENVIRONMENT }} failed"
        fi

        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"$MESSAGE\"}" \
          ${{ secrets.SLACK_WEBHOOK_URL }}

  rollback:
    name: 'Rollback Deployment'
    runs-on: ubuntu-latest
    if: failure() && env.ENVIRONMENT == 'production'
    needs: deploy

    steps:
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Rollback ECS service
      run: |
        # Get previous task definition
        PREVIOUS_TASK_DEF=$(aws ecs describe-services \
          --cluster financeanalyst-production \
          --services financeanalyst-service \
          --region us-east-1 \
          --query 'services[0].taskDefinition' \
          --output text)

        # Rollback to previous version
        aws ecs update-service \
          --cluster financeanalyst-production \
          --service financeanalyst-service \
          --task-definition $PREVIOUS_TASK_DEF \
          --region us-east-1

    - name: Notify rollback
      run: |
        curl -X POST -H 'Content-type: application/json' \
          --data '{"text":"🔄 Production deployment failed - rolled back to previous version"}' \
          ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Branch-Based Deployments

#### **Development Branch Deployment**
```yaml
# .github/workflows/deploy-dev.yml
name: Deploy Development

on:
  push:
    branches: [ develop ]
  pull_request:
    branches: [ develop ]

jobs:
  deploy-dev:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: development

    steps:
    - name: Deploy to development
      uses: ./.github/workflows/deploy.yml
      with:
        environment: development
        version: dev-${{ github.sha }}
```

#### **Staging Branch Deployment**
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging

    steps:
    - name: Deploy to staging
      uses: ./.github/workflows/deploy.yml
      with:
        environment: staging
        version: staging-${{ github.sha }}
```

---

## 🗄️ Database Management

### Database Migration Strategy

#### **Migration Files Structure**
```
db/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_user_preferences.sql
│   ├── 003_create_audit_log.sql
│   └── 004_add_indexes.sql
├── seeds/
│   ├── development/
│   │   ├── 001_users.sql
│   │   ├── 002_portfolios.sql
│   │   └── 003_market_data.sql
│   ├── staging/
│   │   ├── 001_anonymized_users.sql
│   │   └── 002_sample_portfolios.sql
│   └── production/
│       └── 001_system_data.sql
└── schema.sql
```

#### **Environment-Specific Seeding**
```javascript
// scripts/db-seed.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../src/database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = process.env.NODE_ENV || 'development';

class DatabaseSeeder {
  constructor() {
    this.seedPath = path.join(__dirname, '..', 'db', 'seeds', environment);
  }

  async run() {
    console.log(`🌱 Seeding database for ${environment} environment...`);

    const seedFiles = this.getSeedFiles();

    for (const seedFile of seedFiles) {
      await this.executeSeedFile(seedFile);
    }

    console.log('✅ Database seeding completed');
  }

  getSeedFiles() {
    const files = fs.readdirSync(this.seedPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(file => ({
      name: file,
      path: path.join(this.seedPath, file)
    }));
  }

  async executeSeedFile(seedFile) {
    console.log(`Executing seed file: ${seedFile.name}`);

    const sql = fs.readFileSync(seedFile.path, 'utf8');

    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
  }

  async createMockData() {
    if (environment !== 'development') return;

    console.log('Creating mock data for development...');

    // Create mock users
    await db.query(`
      INSERT INTO users (email, password_hash, created_at)
      VALUES
        ('admin@financeanalyst.com', '$2b$10$mock.hash.for.dev', NOW()),
        ('user@financeanalyst.com', '$2b$10$mock.hash.for.dev', NOW())
    `);

    // Create mock portfolios
    await db.query(`
      INSERT INTO portfolios (user_id, name, created_at)
      SELECT id, 'Sample Portfolio', NOW()
      FROM users
      LIMIT 1
    `);

    console.log('✅ Mock data created');
  }
}

const seeder = new DatabaseSeeder();
seeder.run().then(() => {
  if (environment === 'development') {
    return seeder.createMockData();
  }
}).catch(error => {
  console.error('Database seeding failed:', error);
  process.exit(1);
});
```

### Database Connection Management

#### **Environment-Specific Connections**
```javascript
// src/database/index.js
import { Pool } from 'pg';
import config from '../config/index.js';

class DatabaseManager {
  constructor() {
    this.pools = new Map();
    this.initializePools();
  }

  initializePools() {
    // Primary database pool
    this.createPool('primary', {
      host: config.get('database.host'),
      port: config.get('database.port'),
      database: config.get('database.name'),
      user: config.get('database.user'),
      password: config.get('database.password'),
      max: config.get('database.pool.max'),
      min: config.get('database.pool.min'),
      idleTimeoutMillis: config.get('database.pool.idle'),
      connectionTimeoutMillis: config.get('database.pool.acquire'),
      ssl: config.get('database.ssl') || false
    });

    // Read replica pool (production only)
    if (config.isProduction() && config.get('database.readReplica')) {
      this.createPool('readReplica', {
        host: config.get('database.readReplica.host'),
        port: config.get('database.readReplica.port'),
        database: config.get('database.name'),
        user: config.get('database.readReplica.user'),
        password: config.get('database.readReplica.password'),
        max: config.get('database.pool.max'),
        min: config.get('database.pool.min'),
        idleTimeoutMillis: config.get('database.pool.idle'),
        connectionTimeoutMillis: config.get('database.pool.acquire'),
        ssl: config.get('database.ssl') || false
      });
    }
  }

  createPool(name, config) {
    const pool = new Pool(config);

    pool.on('connect', (client) => {
      console.log(`Database client connected to ${name} pool`);
    });

    pool.on('error', (err, client) => {
      console.error(`Database pool ${name} error:`, err);
    });

    this.pools.set(name, pool);
  }

  getPool(type = 'primary') {
    const pool = this.pools.get(type);
    if (!pool) {
      throw new Error(`Database pool ${type} not found`);
    }
    return pool;
  }

  async query(sql, params = [], type = 'primary') {
    const pool = this.getPool(type);
    const start = Date.now();

    try {
      const result = await pool.query(sql, params);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, sql);
      }

      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async transaction(callback, type = 'primary') {
    const pool = this.getPool(type);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck() {
    try {
      await this.query('SELECT 1');
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async close() {
    for (const [name, pool] of this.pools.entries()) {
      console.log(`Closing database pool: ${name}`);
      await pool.end();
    }
    this.pools.clear();
  }
}

export default new DatabaseManager();
```

---

## 🔐 Secrets Management

### AWS Secrets Manager Integration

#### **Secrets Manager Client**
```javascript
// src/secrets/aws-secrets.js
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand
} from '@aws-sdk/client-secrets-manager';

class AWSSecretsManager {
  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  async getSecret(secretName, cache = true) {
    // Check cache first
    if (cache && this.cache.has(secretName)) {
      const cached = this.cache.get(secretName);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.value;
      }
      this.cache.delete(secretName);
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName
      });

      const response = await this.client.send(command);

      let secretValue;
      if (response.SecretString) {
        secretValue = JSON.parse(response.SecretString);
      } else {
        // Binary secret
        secretValue = response.SecretBinary;
      }

      // Cache the result
      if (cache) {
        this.cache.set(secretName, {
          value: secretValue,
          timestamp: Date.now()
        });
      }

      return secretValue;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);
      throw error;
    }
  }

  async updateSecret(secretName, secretValue) {
    try {
      const command = new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(secretValue)
      });

      await this.client.send(command);

      // Invalidate cache
      this.cache.delete(secretName);

      console.log(`Secret ${secretName} updated successfully`);
    } catch (error) {
      console.error(`Failed to update secret ${secretName}:`, error);
      throw error;
    }
  }

  async getEnvironmentSecrets(environment) {
    const secrets = {};

    // Database secrets
    secrets.database = await this.getSecret(`${environment}/database`);

    // Redis secrets
    secrets.redis = await this.getSecret(`${environment}/redis`);

    // JWT secrets
    secrets.jwt = await this.getSecret(`${environment}/jwt`);

    // API keys
    secrets.apiKeys = await this.getSecret(`${environment}/api-keys`);

    // SSL certificates
    if (environment !== 'development') {
      secrets.ssl = await this.getSecret(`${environment}/ssl-certificates`);
    }

    return secrets;
  }
}

export default AWSSecretsManager;
```

### Environment Variable Management

#### **Environment Loader**
```javascript
// src/config/env-loader.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AWSSecretsManager from '../secrets/aws-secrets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnvironmentLoader {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.secretsManager = new AWSSecretsManager();
  }

  async load() {
    // Load local environment file (development only)
    if (this.environment === 'development') {
      await this.loadLocalEnvironment();
    }

    // Load secrets from AWS Secrets Manager
    await this.loadSecrets();

    // Validate required environment variables
    this.validateEnvironment();

    console.log(`✅ Environment loaded for ${this.environment}`);
  }

  async loadLocalEnvironment() {
    const envPath = path.join(__dirname, '..', '..', '.env');

    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
      console.log('✅ Local environment file loaded');
    } else {
      console.warn('⚠️ No local .env file found');
    }
  }

  async loadSecrets() {
    try {
      const secrets = await this.secretsManager.getEnvironmentSecrets(this.environment);

      // Set environment variables from secrets
      if (secrets.database) {
        process.env.DB_HOST = secrets.database.host;
        process.env.DB_PORT = secrets.database.port;
        process.env.DB_NAME = secrets.database.name;
        process.env.DB_USER = secrets.database.username;
        process.env.DB_PASSWORD = secrets.database.password;
      }

      if (secrets.redis) {
        process.env.REDIS_HOST = secrets.redis.host;
        process.env.REDIS_PORT = secrets.redis.port;
        process.env.REDIS_PASSWORD = secrets.redis.password;
      }

      if (secrets.jwt) {
        process.env.JWT_SECRET = secrets.jwt.secret;
        process.env.JWT_REFRESH_SECRET = secrets.jwt.refreshSecret;
      }

      if (secrets.apiKeys) {
        process.env.MARKET_DATA_API_KEY = secrets.apiKeys.marketData;
        process.env.NEWS_API_KEY = secrets.apiKeys.news;
        process.env.EMAIL_API_KEY = secrets.apiKeys.email;
      }

      console.log('✅ Secrets loaded from AWS Secrets Manager');
    } catch (error) {
      if (this.environment === 'development') {
        console.warn('⚠️ Could not load secrets from AWS (expected in development)');
      } else {
        console.error('❌ Failed to load secrets from AWS:', error);
        throw error;
      }
    }
  }

  validateEnvironment() {
    const requiredVars = [
      'NODE_ENV',
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'REDIS_HOST',
      'JWT_SECRET'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ Environment validation passed');
  }

  async rotateSecrets() {
    console.log('🔄 Rotating secrets...');

    // Generate new JWT secrets
    const crypto = await import('crypto');
    const newJwtSecret = crypto.randomBytes(64).toString('hex');
    const newRefreshSecret = crypto.randomBytes(64).toString('hex');

    // Update secrets in AWS
    await this.secretsManager.updateSecret(`${this.environment}/jwt`, {
      secret: newJwtSecret,
      refreshSecret: newRefreshSecret,
      updatedAt: new Date().toISOString()
    });

    // Update environment variables
    process.env.JWT_SECRET = newJwtSecret;
    process.env.JWT_REFRESH_SECRET = newRefreshSecret;

    console.log('✅ Secrets rotated successfully');
  }
}

export default EnvironmentLoader;
```

---

## 📊 Monitoring & Alerting

### Environment-Specific Monitoring

#### **Development Monitoring**
```javascript
// Development monitoring (basic)
const developmentMonitoring = {
  logLevel: 'debug',
  metrics: false,
  alerts: false,
  dashboard: false,

  initialize() {
    console.log('📊 Development monitoring initialized');
    // Basic console logging only
  }
};
```

#### **Staging Monitoring**
```javascript
// Staging monitoring (full monitoring, limited alerts)
const stagingMonitoring = {
  logLevel: 'warn',
  metrics: true,
  alerts: true,
  dashboard: true,

  async initialize() {
    console.log('📊 Staging monitoring initialized');

    // Initialize Prometheus metrics
    const promClient = await import('prom-client');
    const register = new promClient.Registry();

    // Application metrics
    const httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    register.registerMetric(httpRequestDuration);

    // Export metrics for Prometheus
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // Basic alerting for staging
    this.setupStagingAlerts();
  },

  setupStagingAlerts() {
    // Email alerts for staging issues
    console.log('📧 Staging email alerts configured');
  }
};
```

#### **Production Monitoring**
```javascript
// Production monitoring (comprehensive)
const productionMonitoring = {
  logLevel: 'error',
  metrics: true,
  alerts: true,
  dashboard: true,
  distributedTracing: true,

  async initialize() {
    console.log('📊 Production monitoring initialized');

    // Initialize comprehensive monitoring
    await this.initializeMetrics();
    await this.initializeTracing();
    await this.initializeLogging();
    await this.initializeAlerting();

    // Health checks
    this.startHealthChecks();

    // Performance monitoring
    this.startPerformanceMonitoring();
  },

  async initializeMetrics() {
    const promClient = await import('prom-client');
    const register = new promClient.Registry();

    // Detailed application metrics
    const httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'user_agent'],
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    });

    const dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['query_type', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
    });

    const businessMetrics = new promClient.Gauge({
      name: 'business_metric',
      help: 'Business-specific metrics',
      labelNames: ['metric_type']
    });

    register.registerMetric(httpRequestDuration);
    register.registerMetric(dbQueryDuration);
    register.registerMetric(businessMetrics);

    // Export metrics
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });
  },

  async initializeTracing() {
    // Distributed tracing with OpenTelemetry
    const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node');
    const { SimpleSpanProcessor } = await import('@opentelemetry/sdk-trace-base');
    const { JaegerExporter } = await import('@opentelemetry/exporter-jaeger');

    const provider = new NodeTracerProvider();
    const exporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT
    });

    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();

    console.log('🔍 Distributed tracing initialized');
  },

  async initializeLogging() {
    // Structured logging with correlation IDs
    const winston = await import('winston');

    const logger = winston.createLogger({
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'financeanalyst-pro' },
      transports: [
        new winston.transports.File({ filename: '/var/log/financeanalyst/error.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });

    // Add correlation ID to all logs
    app.use((req, res, next) => {
      req.correlationId = req.headers['x-correlation-id'] ||
                         req.headers['x-request-id'] ||
                         require('crypto').randomUUID();
      res.set('x-correlation-id', req.correlationId);
      next();
    });

    console.log('📝 Production logging initialized');
  },

  async initializeAlerting() {
    // Comprehensive alerting setup
    const alertRules = {
      highErrorRate: {
        condition: 'rate(http_requests_total{status=~"[5]", job="financeanalyst"}[5m]) / rate(http_requests_total{job="financeanalyst"}[5m]) > 0.05',
        severity: 'critical',
        description: 'Error rate above 5%'
      },
      slowResponseTime: {
        condition: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="financeanalyst"}[5m])) > 5',
        severity: 'warning',
        description: '95th percentile response time above 5 seconds'
      },
      highMemoryUsage: {
        condition: 'process_resident_memory_bytes / process_virtual_memory_max_bytes > 0.9',
        severity: 'warning',
        description: 'Memory usage above 90%'
      },
      dbConnectionExhaustion: {
        condition: 'pg_stat_activity_count{datname="financeanalyst_prod"} / 100 > 0.9',
        severity: 'critical',
        description: 'Database connection pool near exhaustion'
      }
    };

    console.log('🚨 Production alerting initialized');
  },

  startHealthChecks() {
    // Comprehensive health checks
    setInterval(async () => {
      const health = await this.performHealthCheck();

      if (!health.healthy) {
        console.error('🚨 Health check failed:', health.issues);
        // Send alert
        await this.sendHealthAlert(health.issues);
      }
    }, 30000); // Every 30 seconds
  },

  async performHealthCheck() {
    const issues = [];

    // Application health
    try {
      const response = await fetch('http://localhost:3000/health');
      if (!response.ok) {
        issues.push('Application health check failed');
      }
    } catch (error) {
      issues.push('Application not responding');
    }

    // Database health
    try {
      const db = require('../database');
      await db.query('SELECT 1');
    } catch (error) {
      issues.push('Database health check failed');
    }

    // Redis health
    try {
      const redis = require('../redis');
      await redis.ping();
    } catch (error) {
      issues.push('Redis health check failed');
    }

    // External service health
    try {
      const marketDataResponse = await fetch(process.env.MARKET_DATA_API_URL + '/health');
      if (!marketDataResponse.ok) {
        issues.push('Market data API health check failed');
      }
    } catch (error) {
      issues.push('Market data API not responding');
    }

    return {
      healthy: issues.length === 0,
      issues: issues
    };
  },

  startPerformanceMonitoring() {
    // Performance monitoring
    setInterval(async () => {
      const metrics = await this.collectPerformanceMetrics();

      // Check thresholds
      if (metrics.avgResponseTime > 2000) {
        console.warn('⚠️ High average response time:', metrics.avgResponseTime);
      }

      if (metrics.errorRate > 0.05) {
        console.warn('⚠️ High error rate:', metrics.errorRate);
      }

      // Log performance metrics
      console.log('📊 Performance metrics:', metrics);
    }, 60000); // Every minute
  },

  async collectPerformanceMetrics() {
    // Collect performance metrics
    const metrics = {
      avgResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      activeConnections: 0
    };

    // Implementation would collect actual metrics from monitoring system
    return metrics;
  },

  async sendHealthAlert(issues) {
    // Send alert through monitoring system
    console.error('🚨 HEALTH ALERT:', issues);
    // Implementation would send to alerting system
  }
};
```

---

## 🧪 Testing Strategy

### Environment-Specific Testing

#### **Development Testing**
```javascript
// Development testing (comprehensive, with mocks)
const developmentTesting = {
  unitTests: true,
  integrationTests: true,
  e2eTests: false, // Too slow for development
  performanceTests: false,
  securityTests: false,
  mockExternalServices: true,

  async runTests() {
    console.log('🧪 Running development tests...');

    // Unit tests
    await this.runUnitTests();

    // Integration tests with mocks
    await this.runIntegrationTests();

    console.log('✅ Development tests completed');
  },

  async runUnitTests() {
    const { execSync } = require('child_process');
    execSync('npm run test:unit', { stdio: 'inherit' });
  },

  async runIntegrationTests() {
    const { execSync } = require('child_process');
    execSync('npm run test:integration', { stdio: 'inherit' });
  }
};
```

#### **Staging Testing**
```javascript
// Staging testing (comprehensive, real services)
const stagingTesting = {
  unitTests: true,
  integrationTests: true,
  e2eTests: true,
  performanceTests: true,
  securityTests: true,
  mockExternalServices: false,

  async runTests() {
    console.log('🧪 Running staging tests...');

    // Unit tests
    await this.runUnitTests();

    // Integration tests
    await this.runIntegrationTests();

    // E2E tests
    await this.runE2eTests();

    // Performance tests
    await this.runPerformanceTests();

    // Security tests
    await this.runSecurityTests();

    console.log('✅ Staging tests completed');
  },

  async runE2eTests() {
    const { execSync } = require('child_process');
    execSync('npm run test:e2e -- --baseUrl=https://staging.yourdomain.com', { stdio: 'inherit' });
  },

  async runPerformanceTests() {
    const { execSync } = require('child_process');
    execSync('npm run test:performance -- --environment=staging', { stdio: 'inherit' });
  },

  async runSecurityTests() {
    const { execSync } = require('child_process');
    execSync('npm run test:security -- --environment=staging', { stdio: 'inherit' });
  }
};
```

#### **Production Testing**
```javascript
// Production testing (smoke tests only, non-disruptive)
const productionTesting = {
  unitTests: false,
  integrationTests: false,
  e2eTests: false,
  performanceTests: false,
  securityTests: false,
  smokeTests: true,
  mockExternalServices: false,

  async runTests() {
    console.log('🧪 Running production smoke tests...');

    // Smoke tests only
    await this.runSmokeTests();

    console.log('✅ Production smoke tests completed');
  },

  async runSmokeTests() {
    const smokeTests = [
      {
        name: 'Health Check',
        url: 'https://yourdomain.com/health',
        expectedStatus: 200
      },
      {
        name: 'API Status',
        url: 'https://api.yourdomain.com/v1/status',
        expectedStatus: 200
      },
      {
        name: 'Database Connection',
        type: 'db',
        query: 'SELECT 1'
      }
    ];

    for (const test of smokeTests) {
      try {
        if (test.type === 'db') {
          await this.runDatabaseTest(test);
        } else {
          await this.runHttpTest(test);
        }
        console.log(`✅ ${test.name} passed`);
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
        throw error;
      }
    }
  },

  async runHttpTest(test) {
    const https = require('https');
    const url = new URL(test.url);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'GET',
        rejectUnauthorized: true
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === test.expectedStatus) {
          resolve();
        } else {
          reject(new Error(`Expected status ${test.expectedStatus}, got ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  },

  async runDatabaseTest(test) {
    const db = require('../database');
    await db.query(test.query);
  }
};
```

### Test Data Management

#### **Environment-Specific Test Data**
```javascript
// Test data management
class TestDataManager {
  constructor(environment) {
    this.environment = environment;
  }

  async setupTestData() {
    switch (this.environment) {
      case 'development':
        await this.setupDevelopmentData();
        break;
      case 'staging':
        await this.setupStagingData();
        break;
      case 'production':
        await this.setupProductionData();
        break;
    }
  }

  async setupDevelopmentData() {
    // Create mock data for development
    await this.createMockUsers();
    await this.createMockPortfolios();
    await this.createMockTransactions();
  }

  async setupStagingData() {
    // Create anonymized data for staging
    await this.createAnonymizedUsers();
    await this.createSamplePortfolios();
    await this.createSampleTransactions();
  }

  async setupProductionData() {
    // Minimal test data for production smoke tests
    await this.createSmokeTestData();
  }

  async cleanupTestData() {
    // Clean up test data based on environment
    const cleanupQueries = this.getCleanupQueries();
    const db = require('../database');

    for (const query of cleanupQueries) {
      await db.query(query);
    }
  }

  getCleanupQueries() {
    const baseQueries = [
      'DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL \'24 hours\'',
      'DELETE FROM user_sessions WHERE expires_at < NOW()'
    ];

    const envSpecificQueries = {
      development: [
        'DELETE FROM users WHERE email LIKE \'test%@%\'',
        'DELETE FROM portfolios WHERE name LIKE \'Test%\''
      ],
      staging: [
        'DELETE FROM users WHERE email LIKE \'staging-test%@%\'',
        'DELETE FROM portfolios WHERE name LIKE \'Staging%\''
      ],
      production: [
        // Minimal cleanup for production
        'DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL \'90 days\''
      ]
    };

    return [...baseQueries, ...(envSpecificQueries[this.environment] || [])];
  }
}
```

---

## ✅ Multi-Environment Checklist

### Configuration Management
- [ ] Base configuration files created
- [ ] Environment-specific overrides configured
- [ ] Configuration validation implemented
- [ ] Secrets management integrated
- [ ] Environment variables properly managed

### Infrastructure as Code
- [ ] Terraform configurations created
- [ ] Ansible playbooks developed
- [ ] Docker Compose files for each environment
- [ ] Infrastructure validation scripts
- [ ] Cost optimization measures

### CI/CD Pipeline
- [ ] GitHub Actions workflows configured
- [ ] Environment-specific deployment jobs
- [ ] Automated testing per environment
- [ ] Rollback procedures automated
- [ ] Deployment notifications configured

### Database Management
- [ ] Migration strategies per environment
- [ ] Seed data management
- [ ] Connection pooling configured
- [ ] Backup strategies implemented
- [ ] Performance monitoring setup

### Secrets Management
- [ ] AWS Secrets Manager integration
- [ ] Environment-specific secrets
- [ ] Secret rotation procedures
- [ ] Access control configured
- [ ] Audit logging enabled

### Monitoring & Alerting
- [ ] Environment-specific monitoring levels
- [ ] Alert routing configuration
- [ ] Dashboard access control
- [ ] Performance thresholds set
- [ ] Incident response procedures

### Testing Strategy
- [ ] Unit testing across environments
- [ ] Integration testing configured
- [ ] End-to-end testing automated
- [ ] Performance testing scheduled
- [ ] Security testing integrated
- [ ] Test data management implemented

---

**🌍 Multi-environment support ensures consistent, reliable deployments across development, staging, and production with appropriate security, monitoring, and testing for each environment's specific needs.**

