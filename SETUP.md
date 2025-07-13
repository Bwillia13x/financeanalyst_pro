# 🚀 FinanceAnalyst Pro - Remote Agent Setup Guide

This guide provides multiple automated setup scripts for remote agents to quickly get FinanceAnalyst Pro running on any system.

## 📋 Quick Start

Choose the setup method that matches your system:

### 🐧 Linux/macOS (Bash)
```bash
curl -sSL https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.sh | bash
```

### 🪟 Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.ps1 | iex
```

### 🐍 Cross-Platform (Python)
```bash
curl -sSL https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.py | python3
```

## 📁 Available Setup Scripts

### 1. `setup.sh` - Bash Script (Linux/macOS)
**Best for**: Linux, macOS, WSL, Git Bash

**Features**:
- ✅ Automatic Node.js installation via NVM
- ✅ System requirements checking
- ✅ Interactive prompts with defaults
- ✅ Colored output and progress indicators
- ✅ Error handling and recovery

**Usage**:
```bash
# Download and run
curl -O https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.sh
chmod +x setup.sh
./setup.sh

# Or run directly
curl -sSL https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.sh | bash
```

### 2. `setup.ps1` - PowerShell Script (Windows)
**Best for**: Windows 10/11, PowerShell Core

**Features**:
- ✅ Windows-specific optimizations
- ✅ PowerShell 5+ compatibility
- ✅ Automatic environment variable refresh
- ✅ Port conflict detection
- ✅ Command-line parameters

**Usage**:
```powershell
# Download and run
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.ps1" -OutFile "setup.ps1"
.\setup.ps1

# With parameters
.\setup.ps1 -SkipTests -AutoStart

# Or run directly
iwr -useb https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.ps1 | iex
```

**Parameters**:
- `-SkipTests`: Skip running tests
- `-SkipBuild`: Skip building the application
- `-AutoStart`: Automatically start without prompts

### 3. `setup.py` - Python Script (Cross-Platform)
**Best for**: Any system with Python 3.6+

**Features**:
- ✅ Cross-platform compatibility
- ✅ Python 3.6+ support
- ✅ Command-line arguments
- ✅ Detailed error reporting
- ✅ No external dependencies

**Usage**:
```bash
# Download and run
curl -O https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.py
python3 setup.py

# With arguments
python3 setup.py --skip-tests --auto-start

# Or run directly
curl -sSL https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.py | python3
```

**Arguments**:
- `--skip-tests`: Skip running tests
- `--skip-build`: Skip building the application
- `--auto-start`: Automatically start development server
- `--yes` or `-y`: Answer yes to all prompts

## 🔧 What the Scripts Do

### 1. **System Requirements Check**
- ✅ Operating system detection
- ✅ Node.js 18+ verification
- ✅ Git installation check
- ✅ npm availability check
- ✅ Disk space verification (1GB+)

### 2. **Repository Setup**
- ✅ Clone from GitHub
- ✅ Handle existing directories
- ✅ Switch to project directory

### 3. **Dependency Installation**
- ✅ Run `npm install`
- ✅ Install all required packages
- ✅ Verify installation success

### 4. **Environment Configuration**
- ✅ Copy `.env.example` to `.env`
- ✅ Set up demo mode by default
- ✅ Provide API key instructions

### 5. **Testing (Optional)**
- ✅ Run test suite
- ✅ Verify application integrity
- ✅ Continue on test failures

### 6. **Building (Optional)**
- ✅ Create production build
- ✅ Verify build success
- ✅ Generate optimized assets

### 7. **Development Server**
- ✅ Start on port 4028
- ✅ Handle port conflicts
- ✅ Provide access instructions

## 🎯 Expected Output

After successful setup, you'll see:

```
✅ FinanceAnalyst Pro is ready to use!

📋 Quick Start Guide:
1. The application is running at: http://localhost:4028
2. Currently in DEMO MODE with realistic mock data
3. All financial calculations and analysis tools are functional

🔧 Available Commands:
  npm start         - Start development server
  npm test          - Run tests
  npm run build     - Build for production
  npm run test:ui   - Run tests with UI

💡 Next Steps:
1. Open http://localhost:4028 in your browser
2. Try the terminal interface with commands like:
   - help           (show all commands)
   - status         (check system status)
   - DCF(AAPL)      (run DCF analysis)
   - validate       (check API keys)

Happy analyzing! 🚀
```

## 🔍 Troubleshooting

### Common Issues

#### "Node.js not found"
**Solution**: Install Node.js 18+ from [nodejs.org](https://nodejs.org/)

#### "Git not found"
**Solution**: Install Git from [git-scm.com](https://git-scm.com/)

#### "Permission denied" (Linux/macOS)
**Solution**: Make script executable
```bash
chmod +x setup.sh
./setup.sh
```

#### "Execution policy" error (Windows)
**Solution**: Allow script execution
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### "Port 4028 already in use"
**Solution**: The script will automatically try alternative ports

#### "npm install fails"
**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use different registry
npm install --registry https://registry.npmjs.org/
```

### Manual Setup Fallback

If automated scripts fail, use manual setup:

```bash
# 1. Clone repository
git clone https://github.com/Bwillia13x/financeanalyst_pro.git
cd financeanalyst_pro

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env

# 4. Start development server
npm start
```

## 🌐 Remote Deployment

### For Remote Servers

```bash
# SSH into your server
ssh user@your-server.com

# Run setup script
curl -sSL https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.sh | bash

# The application will be available at:
# http://your-server.com:4028
```

### For Cloud Platforms

#### Heroku
```bash
# After setup, add Heroku remote
heroku create your-app-name
git push heroku main
```

#### DigitalOcean
```bash
# Use the setup script in your droplet
# Configure nginx proxy for production
```

#### AWS EC2
```bash
# Run setup script on your EC2 instance
# Configure security groups for port 4028
```

## 📞 Support

If you encounter issues with the setup scripts:

1. **Check the logs**: Scripts provide detailed error messages
2. **Try manual setup**: Use the manual fallback method
3. **Report issues**: [GitHub Issues](https://github.com/Bwillia13x/financeanalyst_pro/issues)
4. **Get help**: [GitHub Discussions](https://github.com/Bwillia13x/financeanalyst_pro/discussions)

## 🔄 Updates

To update an existing installation:

```bash
cd financeanalyst_pro
git pull origin main
npm install
npm start
```

---

**Happy coding! 🚀**
