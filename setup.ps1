# FinanceAnalyst Pro - Remote Agent Setup Script (PowerShell)
# This script automates the complete setup process for remote agents on Windows

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$AutoStart
)

# Configuration
$ProjectName = "financeanalyst_pro"
$RepoUrl = "https://github.com/Bwillia13x/financeanalyst_pro.git"
$NodeMinVersion = 18
$Port = 4028

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "================================" -ForegroundColor Blue
    Write-Host ""
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check Node.js version
function Test-NodeVersion {
    if (Test-Command "node") {
        $nodeVersion = (node -v).Substring(1).Split('.')[0]
        return [int]$nodeVersion -ge $NodeMinVersion
    }
    return $false
}

# Function to install Node.js
function Install-NodeJS {
    Write-Status "Node.js $NodeMinVersion+ is required but not found."
    Write-Status "Please install Node.js from: https://nodejs.org/"
    Write-Status "Download the LTS version and run the installer."
    
    $response = Read-Host "Have you installed Node.js? Press Enter to continue or 'q' to quit"
    if ($response -eq 'q') {
        exit 1
    }
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    if (-not (Test-NodeVersion)) {
        Write-Error "Node.js is still not available. Please restart PowerShell after installing Node.js."
        exit 1
    }
}

# Function to check system requirements
function Test-Requirements {
    Write-Header "CHECKING SYSTEM REQUIREMENTS"
    
    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion.Major
    if ($psVersion -ge 5) {
        Write-Success "PowerShell: $($PSVersionTable.PSVersion)"
    } else {
        Write-Warning "PowerShell version $psVersion detected. Version 5+ recommended."
    }
    
    # Check Git
    if (Test-Command "git") {
        $gitVersion = (git --version).Split(' ')[2]
        Write-Success "Git: $gitVersion"
    } else {
        Write-Error "Git is not installed. Please install Git from: https://git-scm.com/"
        exit 1
    }
    
    # Check Node.js
    if (Test-NodeVersion) {
        $nodeVersion = node -v
        Write-Success "Node.js: $nodeVersion"
    } else {
        Install-NodeJS
    }
    
    # Check npm
    if (Test-Command "npm") {
        $npmVersion = npm -v
        Write-Success "npm: $npmVersion"
    } else {
        Write-Error "npm is not available. Please check Node.js installation."
        exit 1
    }
    
    # Check available disk space (at least 1GB)
    $drive = (Get-Location).Drive
    $freeSpace = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='$($drive.Name)'").FreeSpace
    $freeSpaceGB = [math]::Round($freeSpace / 1GB, 2)
    
    if ($freeSpaceGB -gt 1) {
        Write-Success "Disk space: $freeSpaceGB GB available"
    } else {
        Write-Warning "Low disk space: $freeSpaceGB GB available. At least 1GB recommended."
    }
}

# Function to clone repository
function Get-Repository {
    Write-Header "CLONING REPOSITORY"
    
    if (Test-Path $ProjectName) {
        Write-Warning "Directory $ProjectName already exists."
        $response = Read-Host "Do you want to remove it and clone fresh? (y/N)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Remove-Item -Recurse -Force $ProjectName
        } else {
            Write-Status "Using existing directory..."
            Set-Location $ProjectName
            git pull origin main
            return
        }
    }
    
    Write-Status "Cloning repository from $RepoUrl..."
    git clone $RepoUrl $ProjectName
    Set-Location $ProjectName
    Write-Success "Repository cloned successfully"
}

# Function to install dependencies
function Install-Dependencies {
    Write-Header "INSTALLING DEPENDENCIES"
    
    Write-Status "Installing npm dependencies..."
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed successfully"
    } else {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Function to setup environment
function Set-Environment {
    Write-Header "SETTING UP ENVIRONMENT"
    
    if (-not (Test-Path ".env")) {
        Write-Status "Creating .env file from template..."
        Copy-Item ".env.example" ".env"
        Write-Success ".env file created"
        
        Write-Status "Environment file created with demo configuration."
        Write-Status "The application will run in demo mode with mock data."
        Write-Warning "To use live data, edit .env and add your API keys:"
        Write-Host "  - VITE_ALPHA_VANTAGE_API_KEY"
        Write-Host "  - VITE_FMP_API_KEY"
        Write-Host "  - VITE_QUANDL_API_KEY"
        Write-Host "  - VITE_FRED_API_KEY"
    } else {
        Write-Success ".env file already exists"
    }
}

# Function to run tests
function Invoke-Tests {
    Write-Header "RUNNING TESTS"
    
    Write-Status "Running test suite..."
    npm test -- --run
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All tests passed"
    } else {
        Write-Warning "Some tests failed, but this won't prevent the application from running"
    }
}

# Function to build application
function Build-Application {
    Write-Header "BUILDING APPLICATION"
    
    Write-Status "Building production bundle..."
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application built successfully"
    } else {
        Write-Error "Build failed. Please check the error messages above."
        exit 1
    }
}

# Function to start development server
function Start-Development {
    Write-Header "STARTING DEVELOPMENT SERVER"
    
    Write-Status "Starting development server on port $Port..."
    Write-Status "The application will be available at: http://localhost:$Port"
    Write-Status "Press Ctrl+C to stop the server"
    
    # Check if port is already in use
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-Warning "Port $Port is already in use"
        Write-Status "Trying to start on a different port..."
    }
    
    npm start
}

# Function to display final instructions
function Show-FinalInstructions {
    Write-Header "SETUP COMPLETE!"
    
    Write-Host "✅ FinanceAnalyst Pro is ready to use!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📋 Quick Start Guide:" -ForegroundColor Blue
    Write-Host "1. The application is running at: http://localhost:$Port"
    Write-Host "2. Currently in DEMO MODE with realistic mock data"
    Write-Host "3. All financial calculations and analysis tools are functional"
    Write-Host ""
    
    Write-Host "🔧 Available Commands:" -ForegroundColor Blue
    Write-Host "  npm start         - Start development server"
    Write-Host "  npm test          - Run tests"
    Write-Host "  npm run build     - Build for production"
    Write-Host "  npm run test:ui   - Run tests with UI"
    Write-Host ""
    
    Write-Host "💡 Next Steps:" -ForegroundColor Blue
    Write-Host "1. Open http://localhost:$Port in your browser"
    Write-Host "2. Try the terminal interface with commands like:"
    Write-Host "   - help           (show all commands)"
    Write-Host "   - status         (check system status)"
    Write-Host "   - DCF(AAPL)      (run DCF analysis)"
    Write-Host "   - validate       (check API keys)"
    Write-Host ""
    
    Write-Host "🔑 For Live Data:" -ForegroundColor Blue
    Write-Host "1. Edit .env file and add your API keys"
    Write-Host "2. Restart the development server"
    Write-Host "3. Run 'validate' command to verify API keys"
    Write-Host ""
    
    Write-Host "📚 Documentation:" -ForegroundColor Blue
    Write-Host "- README.md for detailed setup instructions"
    Write-Host "- GitHub: $RepoUrl"
    Write-Host ""
    
    Write-Host "Happy analyzing! 🚀" -ForegroundColor Green
}

# Main setup function
function Main {
    Write-Header "FINANCEANALYST PRO - REMOTE AGENT SETUP"
    
    Write-Host "This script will set up FinanceAnalyst Pro on your system."
    Write-Host "It will install dependencies, configure the environment, and start the application."
    Write-Host ""
    
    # Ask for confirmation
    if (-not $AutoStart) {
        $response = Read-Host "Do you want to continue? (Y/n)"
        if ($response -eq 'n' -or $response -eq 'N') {
            Write-Status "Setup cancelled by user"
            exit 0
        }
    }
    
    # Run setup steps
    Test-Requirements
    Get-Repository
    Install-Dependencies
    Set-Environment
    
    # Run tests if not skipped
    if (-not $SkipTests) {
        if ($AutoStart) {
            Invoke-Tests
        } else {
            $response = Read-Host "Do you want to run tests? (Y/n)"
            if ($response -ne 'n' -and $response -ne 'N') {
                Invoke-Tests
            }
        }
    }
    
    # Build if not skipped
    if (-not $SkipBuild) {
        if ($AutoStart) {
            Build-Application
        } else {
            $response = Read-Host "Do you want to build the application? (Y/n)"
            if ($response -ne 'n' -and $response -ne 'N') {
                Build-Application
            }
        }
    }
    
    Show-FinalInstructions
    
    # Start development server
    if ($AutoStart) {
        Start-Development
    } else {
        $response = Read-Host "Do you want to start the development server now? (Y/n)"
        if ($response -ne 'n' -and $response -ne 'N') {
            Start-Development
        } else {
            Write-Status "Setup complete! Run 'npm start' to start the development server."
        }
    }
}

# Run main function
try {
    Main
}
catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    exit 1
}
