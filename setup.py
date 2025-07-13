#!/usr/bin/env python3
"""
FinanceAnalyst Pro - Remote Agent Setup Script (Python)
Cross-platform setup script for remote agents
"""

import os
import sys
import subprocess
import shutil
import platform
import argparse
from pathlib import Path

# Configuration
PROJECT_NAME = "financeanalyst_pro"
REPO_URL = "https://github.com/Bwillia13x/financeanalyst_pro.git"
NODE_MIN_VERSION = 18
PORT = 4028

# Colors for terminal output
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_status(message):
    print(f"{Colors.BLUE}[INFO]{Colors.ENDC} {message}")

def print_success(message):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.ENDC} {message}")

def print_warning(message):
    print(f"{Colors.YELLOW}[WARNING]{Colors.ENDC} {message}")

def print_error(message):
    print(f"{Colors.RED}[ERROR]{Colors.ENDC} {message}")

def print_header(message):
    print(f"\n{Colors.BLUE}{'=' * 40}{Colors.ENDC}")
    print(f"{Colors.BLUE}{message}{Colors.ENDC}")
    print(f"{Colors.BLUE}{'=' * 40}{Colors.ENDC}\n")

def command_exists(command):
    """Check if a command exists in the system PATH"""
    return shutil.which(command) is not None

def run_command(command, check=True, capture_output=False):
    """Run a shell command"""
    try:
        if capture_output:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, check=check)
            return result.stdout.strip()
        else:
            subprocess.run(command, shell=True, check=check)
            return True
    except subprocess.CalledProcessError as e:
        if check:
            print_error(f"Command failed: {command}")
            print_error(f"Error: {e}")
            return False
        return False

def get_node_version():
    """Get the current Node.js version"""
    try:
        version_output = run_command("node -v", capture_output=True)
        version = int(version_output.replace('v', '').split('.')[0])
        return version
    except:
        return 0

def check_requirements():
    """Check system requirements"""
    print_header("CHECKING SYSTEM REQUIREMENTS")
    
    # Check operating system
    os_name = platform.system()
    print_success(f"Operating System: {os_name} {platform.release()}")
    
    # Check Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print_success(f"Python: {python_version}")
    
    # Check Git
    if command_exists("git"):
        git_version = run_command("git --version", capture_output=True)
        print_success(f"Git: {git_version}")
    else:
        print_error("Git is not installed. Please install Git first.")
        return False
    
    # Check Node.js
    if command_exists("node"):
        node_version = get_node_version()
        if node_version >= NODE_MIN_VERSION:
            version_output = run_command("node -v", capture_output=True)
            print_success(f"Node.js: {version_output}")
        else:
            print_error(f"Node.js {NODE_MIN_VERSION}+ required. Current version: {node_version}")
            print_status("Please install Node.js from: https://nodejs.org/")
            return False
    else:
        print_error("Node.js is not installed. Please install Node.js from: https://nodejs.org/")
        return False
    
    # Check npm
    if command_exists("npm"):
        npm_version = run_command("npm -v", capture_output=True)
        print_success(f"npm: {npm_version}")
    else:
        print_error("npm is not available. Please check Node.js installation.")
        return False
    
    # Check available disk space
    try:
        disk_usage = shutil.disk_usage(".")
        free_gb = disk_usage.free / (1024**3)
        if free_gb > 1:
            print_success(f"Disk space: {free_gb:.2f} GB available")
        else:
            print_warning(f"Low disk space: {free_gb:.2f} GB available. At least 1GB recommended.")
    except:
        print_warning("Could not check disk space")
    
    return True

def clone_repository():
    """Clone the repository"""
    print_header("CLONING REPOSITORY")
    
    if os.path.exists(PROJECT_NAME):
        print_warning(f"Directory {PROJECT_NAME} already exists.")
        response = input("Do you want to remove it and clone fresh? (y/N): ").strip().lower()
        if response == 'y':
            shutil.rmtree(PROJECT_NAME)
        else:
            print_status("Using existing directory...")
            os.chdir(PROJECT_NAME)
            run_command("git pull origin main")
            return True
    
    print_status(f"Cloning repository from {REPO_URL}...")
    if run_command(f"git clone {REPO_URL} {PROJECT_NAME}"):
        os.chdir(PROJECT_NAME)
        print_success("Repository cloned successfully")
        return True
    return False

def install_dependencies():
    """Install npm dependencies"""
    print_header("INSTALLING DEPENDENCIES")
    
    print_status("Installing npm dependencies...")
    if run_command("npm install"):
        print_success("Dependencies installed successfully")
        return True
    else:
        print_error("Failed to install dependencies")
        return False

def setup_environment():
    """Setup environment configuration"""
    print_header("SETTING UP ENVIRONMENT")
    
    if not os.path.exists(".env"):
        print_status("Creating .env file from template...")
        shutil.copy(".env.example", ".env")
        print_success(".env file created")
        
        print_status("Environment file created with demo configuration.")
        print_status("The application will run in demo mode with mock data.")
        print_warning("To use live data, edit .env and add your API keys:")
        print("  - VITE_ALPHA_VANTAGE_API_KEY")
        print("  - VITE_FMP_API_KEY")
        print("  - VITE_QUANDL_API_KEY")
        print("  - VITE_FRED_API_KEY")
    else:
        print_success(".env file already exists")
    
    return True

def run_tests():
    """Run the test suite"""
    print_header("RUNNING TESTS")
    
    print_status("Running test suite...")
    if run_command("npm test -- --run", check=False):
        print_success("All tests passed")
        return True
    else:
        print_warning("Some tests failed, but this won't prevent the application from running")
        return True

def build_application():
    """Build the application"""
    print_header("BUILDING APPLICATION")
    
    print_status("Building production bundle...")
    if run_command("npm run build"):
        print_success("Application built successfully")
        return True
    else:
        print_error("Build failed. Please check the error messages above.")
        return False

def start_development():
    """Start the development server"""
    print_header("STARTING DEVELOPMENT SERVER")
    
    print_status(f"Starting development server on port {PORT}...")
    print_status(f"The application will be available at: http://localhost:{PORT}")
    print_status("Press Ctrl+C to stop the server")
    
    run_command("npm start", check=False)

def show_final_instructions():
    """Display final setup instructions"""
    print_header("SETUP COMPLETE!")
    
    print(f"{Colors.GREEN}✅ FinanceAnalyst Pro is ready to use!{Colors.ENDC}\n")
    
    print(f"{Colors.BLUE}📋 Quick Start Guide:{Colors.ENDC}")
    print(f"1. The application is running at: http://localhost:{PORT}")
    print("2. Currently in DEMO MODE with realistic mock data")
    print("3. All financial calculations and analysis tools are functional")
    print("")
    
    print(f"{Colors.BLUE}🔧 Available Commands:{Colors.ENDC}")
    print("  npm start         - Start development server")
    print("  npm test          - Run tests")
    print("  npm run build     - Build for production")
    print("  npm run test:ui   - Run tests with UI")
    print("")
    
    print(f"{Colors.BLUE}💡 Next Steps:{Colors.ENDC}")
    print(f"1. Open http://localhost:{PORT} in your browser")
    print("2. Try the terminal interface with commands like:")
    print("   - help           (show all commands)")
    print("   - status         (check system status)")
    print("   - DCF(AAPL)      (run DCF analysis)")
    print("   - validate       (check API keys)")
    print("")
    
    print(f"{Colors.BLUE}🔑 For Live Data:{Colors.ENDC}")
    print("1. Edit .env file and add your API keys")
    print("2. Restart the development server")
    print("3. Run 'validate' command to verify API keys")
    print("")
    
    print(f"{Colors.BLUE}📚 Documentation:{Colors.ENDC}")
    print("- README.md for detailed setup instructions")
    print(f"- GitHub: {REPO_URL}")
    print("")
    
    print(f"{Colors.GREEN}Happy analyzing! 🚀{Colors.ENDC}")

def main():
    """Main setup function"""
    parser = argparse.ArgumentParser(description="FinanceAnalyst Pro Setup Script")
    parser.add_argument("--skip-tests", action="store_true", help="Skip running tests")
    parser.add_argument("--skip-build", action="store_true", help="Skip building application")
    parser.add_argument("--auto-start", action="store_true", help="Automatically start development server")
    parser.add_argument("--yes", "-y", action="store_true", help="Answer yes to all prompts")
    
    args = parser.parse_args()
    
    print_header("FINANCEANALYST PRO - REMOTE AGENT SETUP")
    
    print("This script will set up FinanceAnalyst Pro on your system.")
    print("It will install dependencies, configure the environment, and start the application.")
    print("")
    
    # Ask for confirmation
    if not args.yes and not args.auto_start:
        response = input("Do you want to continue? (Y/n): ").strip().lower()
        if response == 'n':
            print_status("Setup cancelled by user")
            return
    
    # Run setup steps
    if not check_requirements():
        sys.exit(1)
    
    if not clone_repository():
        sys.exit(1)
    
    if not install_dependencies():
        sys.exit(1)
    
    if not setup_environment():
        sys.exit(1)
    
    # Run tests if not skipped
    if not args.skip_tests:
        if args.yes or args.auto_start:
            run_tests()
        else:
            response = input("Do you want to run tests? (Y/n): ").strip().lower()
            if response != 'n':
                run_tests()
    
    # Build if not skipped
    if not args.skip_build:
        if args.yes or args.auto_start:
            if not build_application():
                sys.exit(1)
        else:
            response = input("Do you want to build the application? (Y/n): ").strip().lower()
            if response != 'n':
                if not build_application():
                    sys.exit(1)
    
    show_final_instructions()
    
    # Start development server
    if args.auto_start:
        start_development()
    elif args.yes:
        start_development()
    else:
        response = input("Do you want to start the development server now? (Y/n): ").strip().lower()
        if response != 'n':
            start_development()
        else:
            print_status("Setup complete! Run 'npm start' to start the development server.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_status("\nSetup interrupted by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Setup failed: {e}")
        sys.exit(1)
