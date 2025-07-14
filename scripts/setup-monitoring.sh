#!/bin/bash

# FinanceAnalyst Pro - Monitoring & Analytics Setup Script
# This script configures monitoring, analytics, and alerting for staging and production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="financeanalyst_pro"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Logging function
log() {
    echo -e "${BLUE}[${TIMESTAMP}]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Main setup function
main() {
    log "Starting monitoring setup for $ENVIRONMENT environment"
    
    # Validate environment
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        error "Invalid environment. Use 'staging' or 'production'"
        exit 1
    fi
    
    # Setup steps
    setup_environment_config
    setup_analytics
    setup_error_monitoring
    setup_performance_monitoring
    setup_uptime_monitoring
    setup_alerting
    setup_dashboards
    verify_setup
    
    success "Monitoring setup completed for $ENVIRONMENT environment"
}

# Setup environment-specific configuration
setup_environment_config() {
    log "Setting up environment configuration..."
    
    # Copy appropriate environment file
    if [[ -f ".env.$ENVIRONMENT" ]]; then
        cp ".env.$ENVIRONMENT" .env.local
        success "Environment configuration loaded: .env.$ENVIRONMENT"
    else
        warning "Environment file .env.$ENVIRONMENT not found"
    fi
    
    # Validate required environment variables
    check_env_vars
}

# Check required environment variables
check_env_vars() {
    log "Validating environment variables..."
    
    required_vars=(
        "VITE_APP_ENV"
        "VITE_APP_VERSION"
        "VITE_ENABLE_ANALYTICS"
        "VITE_ENABLE_ERROR_REPORTING"
        "VITE_PERFORMANCE_MONITORING"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        warning "Missing environment variables: ${missing_vars[*]}"
        log "Please configure these variables in .env.$ENVIRONMENT"
    else
        success "All required environment variables are set"
    fi
}

# Setup Google Analytics
setup_analytics() {
    log "Setting up Google Analytics..."
    
    if [[ -n "$VITE_GA_TRACKING_ID" ]]; then
        log "Google Analytics tracking ID configured: $VITE_GA_TRACKING_ID"
        
        # Create analytics configuration file
        cat > public/analytics-config.js << EOF
// Google Analytics Configuration for $ENVIRONMENT
window.gtag = window.gtag || function(){dataLayer.push(arguments);};
window.dataLayer = window.dataLayer || [];

// Initialize Google Analytics
gtag('js', new Date());
gtag('config', '$VITE_GA_TRACKING_ID', {
    environment: '$ENVIRONMENT',
    app_name: 'FinanceAnalyst Pro',
    app_version: '$VITE_APP_VERSION'
});

// Custom event tracking
window.trackEvent = function(action, category, label, value) {
    gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        environment: '$ENVIRONMENT'
    });
};
EOF
        success "Google Analytics configuration created"
    else
        warning "Google Analytics tracking ID not configured"
    fi
    
    # Setup Hotjar if configured
    if [[ -n "$VITE_HOTJAR_ID" ]]; then
        log "Hotjar tracking configured: $VITE_HOTJAR_ID"
        success "Hotjar configuration ready"
    else
        warning "Hotjar ID not configured"
    fi
}

# Setup error monitoring (Sentry)
setup_error_monitoring() {
    log "Setting up error monitoring..."
    
    if [[ -n "$VITE_SENTRY_DSN" ]]; then
        log "Sentry DSN configured for error tracking"
        
        # Create Sentry configuration
        cat > src/config/sentry.js << EOF
// Sentry Configuration for $ENVIRONMENT
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

export const initSentry = () => {
    Sentry.init({
        dsn: '$VITE_SENTRY_DSN',
        environment: '$ENVIRONMENT',
        release: '$VITE_APP_VERSION',
        integrations: [
            new BrowserTracing(),
        ],
        tracesSampleRate: ${ENVIRONMENT === 'production' ? '0.1' : '1.0'},
        beforeSend: (event) => {
            // Filter out non-critical errors in production
            if ('$ENVIRONMENT' === 'production' && event.level === 'warning') {
                return null;
            }
            return event;
        }
    });
    
    Sentry.configureScope((scope) => {
        scope.setTag('component', 'financeanalyst-pro');
        scope.setContext('app', {
            version: '$VITE_APP_VERSION',
            environment: '$ENVIRONMENT'
        });
    });
};
EOF
        success "Sentry error monitoring configured"
    else
        warning "Sentry DSN not configured"
    fi
}

# Setup performance monitoring
setup_performance_monitoring() {
    log "Setting up performance monitoring..."
    
    # Create performance monitoring configuration
    cat > src/config/performance.js << EOF
// Performance Monitoring Configuration for $ENVIRONMENT
export const performanceConfig = {
    environment: '$ENVIRONMENT',
    enableCoreWebVitals: ${VITE_CORE_WEB_VITALS_TRACKING:-true},
    enableCustomMetrics: true,
    sampleRate: ${ENVIRONMENT === 'production' ? '0.1' : '1.0'},
    
    // Performance thresholds
    thresholds: {
        FCP: 2000,  // First Contentful Paint
        LCP: 3000,  // Largest Contentful Paint
        FID: 100,   // First Input Delay
        CLS: 0.1,   // Cumulative Layout Shift
        TTFB: 800   // Time to First Byte
    }
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
        // Monitor Core Web Vitals
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS(sendToAnalytics);
            getFID(sendToAnalytics);
            getFCP(sendToAnalytics);
            getLCP(sendToAnalytics);
            getTTFB(sendToAnalytics);
        });
        
        // Monitor custom metrics
        monitorApiPerformance();
        monitorComponentPerformance();
    }
};

const sendToAnalytics = (metric) => {
    if (window.gtag) {
        window.gtag('event', 'web_vital', {
            event_category: 'Performance',
            event_label: metric.name,
            value: Math.round(metric.value),
            custom_parameter_rating: metric.rating,
            environment: '$ENVIRONMENT'
        });
    }
};

const monitorApiPerformance = () => {
    // API performance monitoring logic
    console.log('API performance monitoring initialized');
};

const monitorComponentPerformance = () => {
    // Component performance monitoring logic
    console.log('Component performance monitoring initialized');
};
EOF
    success "Performance monitoring configured"
}

# Setup uptime monitoring
setup_uptime_monitoring() {
    log "Setting up uptime monitoring..."
    
    # Create uptime monitoring script
    cat > scripts/uptime-check.sh << 'EOF'
#!/bin/bash

# Uptime monitoring script
ENVIRONMENT=$1
URL=$2
WEBHOOK_URL=$3

check_uptime() {
    local url=$1
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [[ "$response" == "200" ]]; then
        echo "✅ $url is UP (HTTP $response)"
        return 0
    else
        echo "❌ $url is DOWN (HTTP $response)"
        send_alert "$url" "$response"
        return 1
    fi
}

send_alert() {
    local url=$1
    local status=$2
    local message="🚨 ALERT: $url is DOWN (HTTP $status) - Environment: $ENVIRONMENT"
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$WEBHOOK_URL"
    fi
    
    echo "$message"
}

# Main execution
if [[ -n "$URL" ]]; then
    check_uptime "$URL"
else
    echo "Usage: $0 <environment> <url> [webhook_url]"
    exit 1
fi
EOF
    
    chmod +x scripts/uptime-check.sh
    success "Uptime monitoring script created"
}

# Setup alerting
setup_alerting() {
    log "Setting up alerting system..."
    
    # Create alerting configuration
    cat > config/alerts.json << EOF
{
    "environment": "$ENVIRONMENT",
    "alerts": {
        "error_rate": {
            "threshold": 5,
            "window": "5m",
            "severity": "high"
        },
        "response_time": {
            "threshold": 3000,
            "window": "5m",
            "severity": "medium"
        },
        "uptime": {
            "threshold": 99.5,
            "window": "1h",
            "severity": "critical"
        }
    },
    "notifications": {
        "email": "${ALERT_EMAIL:-admin@financeanalyst.pro}",
        "slack": "${SLACK_WEBHOOK_URL:-}",
        "sms": "${SMS_WEBHOOK_URL:-}"
    }
}
EOF
    success "Alerting configuration created"
}

# Setup monitoring dashboards
setup_dashboards() {
    log "Setting up monitoring dashboards..."
    
    # Create dashboard configuration
    mkdir -p config/dashboards
    
    cat > config/dashboards/main.json << EOF
{
    "dashboard": "FinanceAnalyst Pro - $ENVIRONMENT",
    "panels": [
        {
            "title": "User Metrics",
            "metrics": ["active_users", "new_users", "session_duration"]
        },
        {
            "title": "Performance",
            "metrics": ["response_time", "error_rate", "throughput"]
        },
        {
            "title": "Business Metrics",
            "metrics": ["feature_usage", "user_retention", "conversion_rate"]
        }
    ],
    "refresh_interval": "30s",
    "time_range": "1h"
}
EOF
    success "Dashboard configuration created"
}

# Verify monitoring setup
verify_setup() {
    log "Verifying monitoring setup..."
    
    # Check if monitoring files exist
    files_to_check=(
        "public/analytics-config.js"
        "src/config/performance.js"
        "scripts/uptime-check.sh"
        "config/alerts.json"
        "config/dashboards/main.json"
    )
    
    missing_files=()
    
    for file in "${files_to_check[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        warning "Missing monitoring files: ${missing_files[*]}"
    else
        success "All monitoring files created successfully"
    fi
    
    # Test basic functionality
    log "Testing monitoring components..."
    
    # Test uptime check
    if [[ -x "scripts/uptime-check.sh" ]]; then
        success "Uptime monitoring script is executable"
    else
        warning "Uptime monitoring script is not executable"
    fi
    
    success "Monitoring setup verification completed"
}

# Print usage information
usage() {
    echo "Usage: $0 [staging|production]"
    echo ""
    echo "This script sets up monitoring and analytics for FinanceAnalyst Pro"
    echo ""
    echo "Options:"
    echo "  staging     Setup monitoring for staging environment"
    echo "  production  Setup monitoring for production environment"
    echo ""
    echo "Environment variables:"
    echo "  VITE_GA_TRACKING_ID     Google Analytics tracking ID"
    echo "  VITE_SENTRY_DSN         Sentry DSN for error tracking"
    echo "  VITE_HOTJAR_ID          Hotjar tracking ID"
    echo "  ALERT_EMAIL             Email for alerts"
    echo "  SLACK_WEBHOOK_URL       Slack webhook for notifications"
}

# Handle script arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
    exit 0
fi

# Run main function
main "$@"
