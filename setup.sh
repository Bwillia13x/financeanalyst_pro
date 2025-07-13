#!/bin/bash

# FinanceAnalyst Pro - Remote Agent Setup Script
# This script automates the complete setup process for remote agents
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
# The script will:
# 1. Check system requirements (Node.js 18+, Git, npm)
# 2. Clone the repository
# 3. Install dependencies
# 4. Set up environment configuration
# 5. Run tests (optional)
# 6. Build the application (optional)
# 7. Start the development server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="financeanalyst_pro"
REPO_URL="https://github.com/Bwillia13x/financeanalyst_pro.git"
NODE_MIN_VERSION="18"
PORT="4028"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        local node_version=$(node -v | sed 's/v//' | cut -d. -f1)
        if [ "$node_version" -ge "$NODE_MIN_VERSION" ]; then
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

# Function to install Node.js using nvm
install_nodejs() {
    print_status "Installing Node.js..."
    
    if ! command_exists nvm; then
        print_status "Installing NVM (Node Version Manager)..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi
    
    nvm install --lts
    nvm use --lts
    nvm alias default node
}

# Function to check system requirements
check_requirements() {
    print_header "CHECKING SYSTEM REQUIREMENTS"
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_success "Operating System: Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_success "Operating System: macOS"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        print_success "Operating System: Windows (Git Bash/WSL)"
    else
        print_warning "Operating System: $OSTYPE (may not be fully supported)"
    fi
    
    # Check Git
    if command_exists git; then
        local git_version=$(git --version | cut -d' ' -f3)
        print_success "Git: $git_version"
    else
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    # Check Node.js
    if check_node_version; then
        local node_version=$(node -v)
        print_success "Node.js: $node_version"
    else
        print_warning "Node.js $NODE_MIN_VERSION+ not found. Will install..."
        install_nodejs
    fi
    
    # Check npm
    if command_exists npm; then
        local npm_version=$(npm -v)
        print_success "npm: $npm_version"
    else
        print_error "npm is not available. Please check Node.js installation."
        exit 1
    fi
    
    # Check available disk space (at least 1GB)
    local available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -gt 1048576 ]; then  # 1GB in KB
        print_success "Disk space: Sufficient"
    else
        print_warning "Low disk space. At least 1GB recommended."
    fi
}

# Function to clone repository
clone_repository() {
    print_header "CLONING REPOSITORY"
    
    if [ -d "$PROJECT_NAME" ]; then
        print_warning "Directory $PROJECT_NAME already exists."
        read -p "Do you want to remove it and clone fresh? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_NAME"
        else
            print_status "Using existing directory..."
            cd "$PROJECT_NAME"
            git pull origin main
            return
        fi
    fi
    
    print_status "Cloning repository from $REPO_URL..."
    git clone "$REPO_URL" "$PROJECT_NAME"
    cd "$PROJECT_NAME"
    print_success "Repository cloned successfully"
}

# Function to install dependencies
install_dependencies() {
    print_header "INSTALLING DEPENDENCIES"
    
    print_status "Installing npm dependencies..."
    npm install
    
    print_success "Dependencies installed successfully"
}

# Function to setup environment
setup_environment() {
    print_header "SETTING UP ENVIRONMENT"
    
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_success ".env file created"
        
        print_status "Environment file created with demo configuration."
        print_status "The application will run in demo mode with mock data."
        print_warning "To use live data, edit .env and add your API keys:"
        echo "  - VITE_ALPHA_VANTAGE_API_KEY"
        echo "  - VITE_FMP_API_KEY"
        echo "  - VITE_QUANDL_API_KEY"
        echo "  - VITE_FRED_API_KEY"
    else
        print_success ".env file already exists"
    fi
}

# Function to run tests
run_tests() {
    print_header "RUNNING TESTS"
    
    print_status "Running test suite..."
    npm test -- --run
    
    if [ $? -eq 0 ]; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed, but this won't prevent the application from running"
    fi
}

# Function to build application
build_application() {
    print_header "BUILDING APPLICATION"
    
    print_status "Building production bundle..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Application built successfully"
    else
        print_error "Build failed. Please check the error messages above."
        exit 1
    fi
}

# Function to start development server
start_development() {
    print_header "STARTING DEVELOPMENT SERVER"
    
    print_status "Starting development server on port $PORT..."
    print_status "The application will be available at: http://localhost:$PORT"
    print_status "Press Ctrl+C to stop the server"
    
    # Check if port is already in use
    if command_exists lsof && lsof -i :$PORT >/dev/null 2>&1; then
        print_warning "Port $PORT is already in use"
        print_status "Trying to start on a different port..."
    fi
    
    npm start
}

# Function to display final instructions
show_final_instructions() {
    print_header "SETUP COMPLETE!"
    
    echo -e "${GREEN}✅ FinanceAnalyst Pro is ready to use!${NC}\n"
    
    echo -e "${BLUE}📋 Quick Start Guide:${NC}"
    echo "1. The application is running at: http://localhost:$PORT"
    echo "2. Currently in DEMO MODE with realistic mock data"
    echo "3. All financial calculations and analysis tools are functional"
    echo ""
    
    echo -e "${BLUE}🔧 Available Commands:${NC}"
    echo "  npm start         - Start development server"
    echo "  npm test          - Run tests"
    echo "  npm run build     - Build for production"
    echo "  npm run test:ui   - Run tests with UI"
    echo ""
    
    echo -e "${BLUE}💡 Next Steps:${NC}"
    echo "1. Open http://localhost:$PORT in your browser"
    echo "2. Try the terminal interface with commands like:"
    echo "   - help           (show all commands)"
    echo "   - status         (check system status)"
    echo "   - DCF(AAPL)      (run DCF analysis)"
    echo "   - validate       (check API keys)"
    echo ""
    
    echo -e "${BLUE}🔑 For Live Data:${NC}"
    echo "1. Edit .env file and add your API keys"
    echo "2. Restart the development server"
    echo "3. Run 'validate' command to verify API keys"
    echo ""
    
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "- README.md for detailed setup instructions"
    echo "- GitHub: $REPO_URL"
    echo ""
    
    echo -e "${GREEN}Happy analyzing! 🚀${NC}"
}

# Main setup function
main() {
    print_header "FINANCEANALYST PRO - REMOTE AGENT SETUP"
    
    echo "This script will set up FinanceAnalyst Pro on your system."
    echo "It will install dependencies, configure the environment, and start the application."
    echo ""
    
    # Ask for confirmation
    read -p "Do you want to continue? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_status "Setup cancelled by user"
        exit 0
    fi
    
    # Run setup steps
    check_requirements
    clone_repository
    install_dependencies
    setup_environment
    
    # Ask if user wants to run tests
    echo ""
    read -p "Do you want to run tests? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        run_tests
    fi
    
    # Ask if user wants to build
    echo ""
    read -p "Do you want to build the application? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        build_application
    fi
    
    show_final_instructions
    
    # Ask if user wants to start development server
    echo ""
    read -p "Do you want to start the development server now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        start_development
    else
        print_status "Setup complete! Run 'npm start' to start the development server."
    fi
}

# Run main function
main "$@"
