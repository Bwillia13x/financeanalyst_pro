#!/bin/bash

# FinanceAnalyst Pro - Shell Environment Fix Script
# Fixes pyenv interference with Node.js npm/commands

set -e

echo "🔧 FinanceAnalyst Pro - Shell Environment Configuration Fix"
echo "=========================================================="
echo ""

# Detect shell
DETECTED_SHELL=$(basename "$SHELL")
echo "📋 Detected shell: $DETECTED_SHELL"

# Backup current configuration
echo "💾 Backing up current shell configuration..."

if [ -f "$HOME/.zshrc" ]; then
    cp "$HOME/.zshrc" "$HOME/.zshrc.backup.$(date +%Y%m%d_%H%M%S)"
    echo "  ✅ Backed up .zshrc"
fi

if [ -f "$HOME/.bashrc" ]; then
    cp "$HOME/.bashrc" "$HOME/.bashrc.backup.$(date +%Y%m%d_%H%M%S)"
    echo "  ✅ Backed up .bashrc"
fi

if [ -f "$HOME/.bash_profile" ]; then
    cp "$HOME/.bash_profile" "$HOME/.bash_profile.backup.$(date +%Y%m%d_%H%M%S)"
    echo "  ✅ Backed up .bash_profile"
fi

echo ""

# Check current pyenv status
echo "🐍 Checking pyenv status..."
if command -v pyenv >/dev/null 2>&1; then
    echo "  ✅ pyenv found in PATH"
    pyenv --version

    # Check if pyenv is in shell init
    if [ "$DETECTED_SHELL" = "zsh" ]; then
        if grep -q "pyenv init" "$HOME/.zshrc" 2>/dev/null; then
            echo "  ✅ pyenv already initialized in .zshrc"
        else
            echo "  ⚠️  pyenv not initialized in .zshrc - this may be the issue"
        fi
    elif [ "$DETECTED_SHELL" = "bash" ]; then
        if grep -q "pyenv init" "$HOME/.bashrc" 2>/dev/null || grep -q "pyenv init" "$HOME/.bash_profile" 2>/dev/null; then
            echo "  ✅ pyenv already initialized"
        else
            echo "  ⚠️  pyenv not initialized in bash config - this may be the issue"
        fi
    fi
else
    echo "  ❌ pyenv not found in PATH - this shouldn't be an issue"
fi

echo ""

# Apply fix based on shell
echo "🔧 Applying shell environment fix..."

if [ "$DETECTED_SHELL" = "zsh" ]; then
    echo "  Fixing zsh configuration..."

    # Check if pyenv is properly initialized
    if ! pgrep -f "pyenv init" >/dev/null; then
        cat >> "$HOME/.zshrc" << 'EOF'

# Fixed financeanalyst-pro shell environment
# Only load pyenv when needed to avoid conflicts with Node.js
function financeanalyst_kill_pyenv() {
    if [[ -n "$PYENV_ROOT" ]]; then
        unset PYENV_ROOT
        python3 --version >/dev/null 2>&1 || export PATH="/usr/bin:/bin:$PATH"
        export PATH=${PATH//pyenv versions:/}
        echo "🐍 Pyenv temporarily disabled for Node.js development"
    fi
}

# Load pyenv with protection for Node.js development
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"

if command -v pyenv 1>/dev/null 2>&1; then
    eval "$(pyenv init --path)"
    eval "$(pyenv init -)"

    # Add pyenv to PATH only if not causing issues
    if pyenv version >/dev/null 2>&1; then
        export PATH="$PYENV_ROOT/shims:$PATH"
    fi
fi

EOF
    echo "  ✅ Added pyenv initialization fix to .zshrc"
    fi

elif [ "$DETECTED_SHELL" = "bash" ]; then
    echo "  Fixing bash configuration..."

    cat >> "$HOME/.bashrc" << 'EOF'

# Fixed financeanalyst-pro shell environment
# Only load pyenv when needed to avoid conflicts with Node.js
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"

if command -v pyenv 1>/dev/null 2>&1; then
    eval "$(pyenv init --path)"
    eval "$(pyenv init -)"

    if pyenv version >/dev/null 2>&1; then
        export PATH="$PYENV_ROOT/shims:$PATH"
    fi
fi

EOF
    echo "  ✅ Added pyenv initialization fix to .bashrc"
fi

echo ""

# Test the fix
echo "🧪 Testing Node.js commands with fix..."

if node --version >/dev/null 2>&1; then
    echo "  ✅ Node.js: $(node --version)"
else
    echo "  ❌ Node.js: Not found or not in PATH"
fi

if npm --version >/dev/null 2>&1; then
    echo "  ✅ npm: $(npm --version)"
else
    echo "  ❌ npm: Not found or not in PATH"
fi

if command -v npx >/dev/null 2>&1; then
    echo "  ✅ npx: Available"
else
    echo "  ❌ npx: Not found"
fi

echo ""
echo "📝 Next steps:"
echo "1. Restart your terminal or run: source ~/.${DETECTED_SHELL}rc"
echo "2. Run: npm --version to verify Node.js works"
echo "3. Try: npm run test to see if pyenv warnings are gone"
echo ""

echo "💡 Alternative (if fix doesn't work):"
echo "export PYENV_DISABLE=1  # Temporarily disable pyenv for this session"
echo ""

echo "✅ Shell environment fix completed!"
echo "If you encounter issues, check the diagnostic script: ./diagnostics.html"

exit 0