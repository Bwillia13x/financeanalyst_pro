#!/bin/bash

# FinanceAnalyst Pro - Production Deployment Script
# This script handles the complete deployment pipeline for the platform

set -e  # Exit on any error

# Configuration
PROJECT_NAME="financeanalyst-pro"
AWS_REGION="us-east-1"
ECR_REPOSITORY="${PROJECT_NAME}"
ECS_CLUSTER="${PROJECT_NAME}"
ECS_SERVICE="${PROJECT_NAME}-service"
ENVIRONMENT=${1:-"staging"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check AWS CLI configuration
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI not configured. Please run 'aws configure'"
        exit 1
    fi

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi

    # Check if required environment variables are set
    required_vars=("AWS_ACCOUNT_ID" "DOCKER_USERNAME" "DOCKER_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    log_success "Pre-deployment checks passed"
}

# Build and push Docker image
build_and_push_image() {
    log_info "Building and pushing Docker image..."

    # Get git commit hash for image tagging
    GIT_COMMIT=$(git rev-parse --short HEAD)
    IMAGE_TAG="${GIT_COMMIT}-${ENVIRONMENT}"

    # Build Docker image
    log_info "Building Docker image with tag: ${IMAGE_TAG}"
    docker build \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=${GIT_COMMIT} \
        --build-arg BUILD_VERSION=${IMAGE_TAG} \
        --build-arg NODE_ENV=production \
        -t ${PROJECT_NAME}:${IMAGE_TAG} \
        -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG} \
        -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest \
        .

    # Authenticate with ECR
    log_info "Authenticating with AWS ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin \
        ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

    # Push image to ECR
    log_info "Pushing image to ECR..."
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest

    log_success "Docker image built and pushed successfully"

    # Return image URI for task definition update
    echo "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"
}

# Update ECS task definition
update_task_definition() {
    local image_uri=$1

    log_info "Updating ECS task definition..."

    # Get current task definition
    CURRENT_TASK_DEF=$(aws ecs describe-task-definition \
        --task-definition ${PROJECT_NAME} \
        --region ${AWS_REGION} \
        --query 'taskDefinition' \
        --output json)

    # Create new task definition with updated image
    NEW_TASK_DEF=$(echo "${CURRENT_TASK_DEF}" | jq --arg IMAGE "${image_uri}" '
        .containerDefinitions[0].image = $IMAGE |
        .containerDefinitions[0].environment = [
            {"name": "NODE_ENV", "value": "production"},
            {"name": "PORT", "value": "3000"},
            {"name": "NEXT_PUBLIC_API_URL", "value": "https://api.'${PROJECT_NAME}'.pro"}
        ]
    ')

    # Register new task definition
    TASK_DEF_ARN=$(aws ecs register-task-definition \
        --cli-input-json "${NEW_TASK_DEF}" \
        --region ${AWS_REGION} \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)

    log_success "Task definition updated: ${TASK_DEF_ARN}"

    echo "${TASK_DEF_ARN}"
}

# Deploy to ECS
deploy_to_ecs() {
    local task_def_arn=$1

    log_info "Deploying to ECS..."

    # Update service with new task definition
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --task-definition ${TASK_DEF_ARN} \
        --force-new-deployment \
        --region ${AWS_REGION} \
        --query 'service.serviceArn' \
        --output text

    log_info "Waiting for deployment to complete..."

    # Wait for service to become stable
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION}

    log_success "ECS deployment completed successfully"
}

# Run health checks
run_health_checks() {
    log_info "Running post-deployment health checks..."

    local health_check_url
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        health_check_url="https://financeanalyst.pro/api/health"
    else
        health_check_url="https://staging.financeanalyst.pro/api/health"
    fi

    # Wait for application to be ready
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt ${attempt}/${max_attempts}..."

        if curl -f -s "${health_check_url}" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi

        sleep 10
        ((attempt++))
    done

    log_error "Health check failed after ${max_attempts} attempts"
    return 1
}

# Update CloudFront distribution (production only)
update_cloudfront() {
    if [[ "${ENVIRONMENT}" != "production" ]]; then
        return 0
    fi

    log_info "Updating CloudFront distribution..."

    aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --paths "/*" \
        --region ${AWS_REGION}

    log_success "CloudFront cache invalidated"
}

# Send deployment notifications
send_notifications() {
    local status=$1
    local commit_hash=$(git rev-parse --short HEAD)
    local deployer=$(git log -1 --pretty=format:'%an')

    log_info "Sending deployment notifications..."

    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL}" ]]; then
        local color="good"
        if [[ "${status}" != "success" ]]; then
            color="danger"
        fi

        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [
                    {
                        \"color\": \"${color}\",
                        \"title\": \"${PROJECT_NAME} Deployment ${status}\",
                        \"fields\": [
                            {
                                \"title\": \"Environment\",
                                \"value\": \"${ENVIRONMENT}\",
                                \"short\": true
                            },
                            {
                                \"title\": \"Commit\",
                                \"value\": \"${commit_hash}\",
                                \"short\": true
                            },
                            {
                                \"title\": \"Deployed by\",
                                \"value\": \"${deployer}\",
                                \"short\": true
                            }
                        ]
                    }
                ]
            }" \
            ${SLACK_WEBHOOK_URL}
    fi

    # Email notification (if configured)
    if [[ -n "${DEPLOYMENT_EMAIL}" ]]; then
        echo "Deployment ${status} for ${PROJECT_NAME} in ${ENVIRONMENT} environment" | \
        mail -s "${PROJECT_NAME} Deployment ${status}" ${DEPLOYMENT_EMAIL}
    fi
}

# Rollback function
rollback_deployment() {
    log_warning "Starting deployment rollback..."

    # Get previous task definition
    PREVIOUS_TASK_DEF=$(aws ecs describe-task-definition \
        --task-definition ${PROJECT_NAME} \
        --region ${AWS_REGION} \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)

    # Rollback to previous version
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --task-definition ${PREVIOUS_TASK_DEF} \
        --force-new-deployment \
        --region ${AWS_REGION}

    log_warning "Rollback completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up deployment artifacts..."

    # Remove local Docker images (keep last 3)
    docker image prune -f

    # Remove old ECR images (keep last 10)
    aws ecr describe-images \
        --repository-name ${ECR_REPOSITORY} \
        --region ${AWS_REGION} \
        --query 'imageDetails[*].imageDigest' \
        --output text | \
    head -n -10 | \
    xargs -I {} aws ecr batch-delete-image \
        --repository-name ${ECR_REPOSITORY} \
        --image-digests digest={} \
        --region ${AWS_REGION} || true

    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting ${PROJECT_NAME} deployment to ${ENVIRONMENT}..."

    # Trap for cleanup on exit
    trap cleanup EXIT

    # Run pre-deployment checks
    pre_deployment_checks

    # Build and push Docker image
    local image_uri
    image_uri=$(build_and_push_image)

    # Update task definition
    local task_def_arn
    task_def_arn=$(update_task_definition "${image_uri}")

    # Deploy to ECS
    deploy_to_ecs "${task_def_arn}"

    # Run health checks
    if ! run_health_checks; then
        log_error "Health checks failed, initiating rollback..."
        rollback_deployment
        send_notifications "failed"
        exit 1
    fi

    # Update CloudFront (production only)
    update_cloudfront

    # Send success notifications
    send_notifications "success"

    log_success "🎉 Deployment completed successfully!"
    log_info "Application is available at: https://${ENVIRONMENT}.financeanalyst.pro"
}

# Error handler
error_handler() {
    local exit_code=$?
    log_error "Deployment failed with exit code ${exit_code}"

    # Send failure notifications
    send_notifications "failed"

    # Attempt rollback on failure
    if [[ ${exit_code} -ne 0 ]]; then
        log_warning "Attempting rollback..."
        rollback_deployment
    fi

    exit ${exit_code}
}

# Set error handler
trap error_handler ERR

# Validate environment parameter
if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
    log_error "Invalid environment: ${ENVIRONMENT}. Must be 'staging' or 'production'"
    exit 1
fi

# Run main deployment
main "$@"