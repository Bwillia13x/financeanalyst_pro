#!/bin/bash

# FinanceAnalyst Pro - Monitoring Setup Script
# This script sets up the complete monitoring stack for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$MONITORING_DIR/.." && pwd)"
ENVIRONMENT=${1:-production}
DOMAIN=${2:-yourdomain.com}

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not available. Please install Docker Compose first."
        exit 1
    fi

    success "Prerequisites check passed"
}

# Create monitoring directories
create_directories() {
    log "Creating monitoring directories..."

    mkdir -p "$MONITORING_DIR/prometheus/data"
    mkdir -p "$MONITORING_DIR/grafana/data"
    mkdir -p "$MONITORING_DIR/alertmanager/data"
    mkdir -p "$MONITORING_DIR/prometheus/rules"
    mkdir -p "$MONITORING_DIR/grafana/dashboards"
    mkdir -p "$MONITORING_DIR/grafana/provisioning/datasources"
    mkdir -p "$MONITORING_DIR/grafana/provisioning/dashboards"
    mkdir -p "$MONITORING_DIR/grafana/provisioning/alerting"

    success "Monitoring directories created"
}

# Generate Prometheus configuration
generate_prometheus_config() {
    log "Generating Prometheus configuration..."

    cat > "$MONITORING_DIR/prometheus/prometheus.yml" << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'financeanalyst-monitor'

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'financeanalyst'
    static_configs:
      - targets: ['financeanalyst:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
    env:
      - DATA_SOURCE_NAME=postgresql://postgres:postgres@postgres:5432/financeanalyst_prod?sslmode=disable

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['nginx-exporter:9113']
    metrics_path: '/metrics'
EOF

    success "Prometheus configuration generated"
}

# Generate Grafana configuration
generate_grafana_config() {
    log "Generating Grafana configuration..."

    # Grafana provisioning configuration
    cat > "$MONITORING_DIR/grafana/provisioning/datasources/prometheus.yml" << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    cat > "$MONITORING_DIR/grafana/provisioning/dashboards/dashboard.yml" << EOF
apiVersion: 1

providers:
  - name: 'FinanceAnalyst'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    # Copy dashboard files
    cp "$MONITORING_DIR/grafana-dashboards/"*.json "$MONITORING_DIR/grafana/dashboards/" 2>/dev/null || true

    success "Grafana configuration generated"
}

# Generate Docker Compose file
generate_docker_compose() {
    log "Generating Docker Compose configuration..."

    cat > "$MONITORING_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: financeanalyst-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alert_rules.yml:/etc/prometheus/alert_rules.yml:ro
      - ./prometheus/data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: financeanalyst-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/config.yml:/etc/alertmanager/config.yml:ro
      - ./alertmanager/data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: financeanalyst-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel
    volumes:
      - ./grafana/data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    restart: unless-stopped
    depends_on:
      - prometheus
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: financeanalyst-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    networks:
      - monitoring

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: financeanalyst-postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:postgres@postgres:5432/financeanalyst_prod?sslmode=disable
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - monitoring

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: financeanalyst-redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis:6379
      - REDIS_PASSWORD=your-redis-password
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - monitoring

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    container_name: financeanalyst-nginx-exporter
    ports:
      - "9113:9113"
    command:
      - -nginx.scrape-uri=http://nginx:8080/stub_status
    depends_on:
      - nginx
    restart: unless-stopped
    networks:
      - monitoring

  # External services (to be monitored)
  postgres:
    image: postgres:14
    container_name: financeanalyst-postgres-external
    environment:
      - POSTGRES_DB=financeanalyst_prod
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - monitoring
    # Note: This is for monitoring setup only. In production, connect to actual database.

  redis:
    image: redis:7-alpine
    container_name: financeanalyst-redis-external
    ports:
      - "6379:6379"
    networks:
      - monitoring
    # Note: This is for monitoring setup only. In production, connect to actual Redis.

  nginx:
    image: nginx:alpine
    container_name: financeanalyst-nginx-external
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/stub_status.conf:/etc/nginx/conf.d/stub_status.conf:ro
    networks:
      - monitoring
    # Note: This is for monitoring setup only. In production, connect to actual Nginx.

networks:
  monitoring:
    driver: bridge

volumes:
  postgres_data:
  grafana_data:
  prometheus_data:
EOF

    success "Docker Compose configuration generated"
}

# Copy alert rules
copy_alert_rules() {
    log "Copying alert rules..."

    cp "$MONITORING_DIR/prometheus/alert-rules.yml" "$MONITORING_DIR/prometheus/rules/"

    success "Alert rules copied"
}

# Create Nginx configuration for monitoring
create_nginx_config() {
    log "Creating Nginx configuration for monitoring..."

    mkdir -p "$MONITORING_DIR/nginx"

    cat > "$MONITORING_DIR/nginx/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name localhost;

        location /stub_status {
            stub_status on;
            access_log off;
            allow 127.0.0.1;
            deny all;
        }
    }
}
EOF

    cat > "$MONITORING_DIR/nginx/stub_status.conf" << 'EOF'
server {
    listen 8080;
    server_name localhost;

    location /stub_status {
        stub_status on;
        access_log off;
        allow all;
    }
}
EOF

    success "Nginx configuration created"
}

# Generate environment-specific configurations
generate_environment_config() {
    log "Generating environment-specific configuration..."

    case $ENVIRONMENT in
        production)
            ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/PROD/WEBHOOK"
            GRAFANA_DOMAIN="monitoring.$DOMAIN"
            ;;
        staging)
            ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/STAGING/WEBHOOK"
            GRAFANA_DOMAIN="monitoring-staging.$DOMAIN"
            ;;
        *)
            ALERT_WEBHOOK="https://hooks.slack.com/services/YOUR/DEFAULT/WEBHOOK"
            GRAFANA_DOMAIN="monitoring-dev.$DOMAIN"
            ;;
    esac

    # Update AlertManager configuration with environment-specific values
    sed -i "s|https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK|$ALERT_WEBHOOK|g" "$MONITORING_DIR/alertmanager/config.yml"

    success "Environment configuration generated for $ENVIRONMENT"
}

# Start monitoring stack
start_monitoring() {
    log "Starting monitoring stack..."

    cd "$MONITORING_DIR"

    # Start services
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi

    success "Monitoring stack started"

    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30

    # Check service health
    check_service_health "prometheus" "9090"
    check_service_health "alertmanager" "9093"
    check_service_health "grafana" "3001"
}

# Check service health
check_service_health() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$port" > /dev/null 2>&1; then
            success "$service is ready on port $port"
            return 0
        fi

        log "Waiting for $service to be ready (attempt $attempt/$max_attempts)..."
        sleep 5
        ((attempt++))
    done

    error "$service failed to start on port $port"
    return 1
}

# Display setup information
display_setup_info() {
    log "Monitoring setup completed successfully!"
    echo
    echo "📊 Monitoring URLs:"
    echo "  Prometheus:     http://localhost:9090"
    echo "  AlertManager:   http://localhost:9093"
    echo "  Grafana:        http://localhost:3001 (admin/admin123)"
    echo
    echo "📋 Grafana Dashboards:"
    echo "  FinanceAnalyst Overview: Available in Grafana dashboards"
    echo
    echo "🚨 Alert Channels:"
    echo "  Slack: Configured for $ENVIRONMENT environment"
    echo "  Email: Configured for security and database alerts"
    echo
    echo "🔧 Next Steps:"
    echo "  1. Access Grafana and configure additional dashboards"
    echo "  2. Update alert webhook URLs in alertmanager/config.yml"
    echo "  3. Configure email settings in alertmanager/config.yml"
    echo "  4. Set up SSL certificates for production access"
    echo "  5. Configure additional exporters for your specific services"
    echo
    warning "Default Grafana password is 'admin123' - change this immediately!"
}

# Main execution
main() {
    log "Starting FinanceAnalyst Pro monitoring setup for $ENVIRONMENT environment..."

    check_prerequisites
    create_directories
    generate_prometheus_config
    generate_grafana_config
    generate_docker_compose
    copy_alert_rules
    create_nginx_config
    generate_environment_config

    read -p "Do you want to start the monitoring stack now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_monitoring
    else
        log "Monitoring stack setup completed. Run 'docker-compose up -d' to start services."
    fi

    display_setup_info
}

# Run main function
main "$@"

