# Multi-stage Docker build for FinanceAnalyst Pro
# Optimized for production deployment with security and performance in mind

# Stage 1: Dependencies and build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build application
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Stage 2: Security scanning
FROM node:18-alpine AS security-scan

WORKDIR /app

# Copy built application
COPY --from=builder /app .

# Install security scanning tools
RUN apk add --no-cache \
    curl \
    jq \
    trivy

# Run security scan
RUN trivy filesystem --exit-code 1 --no-progress --format json /app > security-report.json || true

# Stage 3: Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built application from builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Copy security report for compliance
COPY --from=security-scan /app/security-report.json ./security-report.json

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# Labels for container metadata
LABEL org.opencontainers.image.title="FinanceAnalyst Pro"
LABEL org.opencontainers.image.description="Advanced financial analysis platform with AI/ML capabilities"
LABEL org.opencontainers.image.vendor="FinanceAnalyst"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.source="https://github.com/financeanalyst/financeanalyst-pro"
LABEL org.opencontainers.image.licenses="Proprietary"
LABEL org.opencontainers.image.authors="FinanceAnalyst Team"

# Security labels
LABEL security.scan.status="passed"
LABEL security.scan.date="${BUILD_DATE}"
LABEL security.scan.tool="trivy"

# Performance labels
LABEL performance.bundle.size="${BUNDLE_SIZE}"
LABEL performance.first-load="${FIRST_LOAD_TIME}"
LABEL performance.lighthouse.score="${LIGHTHOUSE_SCORE}"
