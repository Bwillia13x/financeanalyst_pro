# FinanceAnalyst Pro

A comprehensive financial modeling and analysis platform with real-time data integration and automated CLI-driven workflows.

## 🚀 Features

### v2.0 - Data-Driven Financial Modeling
- **Real-time Data Integration**: Fetch live financial data from multiple sources
- **Automated CLI Commands**: Run analyses with simple commands like `DCF(AAPL)` or `LBO(TSLA)`
- **Multiple Data Sources**: Alpha Vantage, Financial Modeling Prep, SEC EDGAR, Yahoo Finance
- **Comprehensive Analysis**: DCF, LBO, Comparable Company Analysis with real data
- **Smart Caching**: Intelligent data caching with appropriate TTLs
- **Rate Limiting**: Built-in API rate limiting and fallback mechanisms

### Core Financial Models
- **DCF (Discounted Cash Flow)**: Automated valuation with real financial statements
- **LBO (Leveraged Buyout)**: Complete LBO modeling with debt capacity analysis
- **Comparable Analysis**: Peer group identification and relative valuation
- **Monte Carlo Simulation**: Risk analysis and scenario modeling
- **Sensitivity Analysis**: Variable impact assessment

### Advanced Terminal Interface
- **Smart Autocomplete**: Context-aware command suggestions
- **Real-time Execution**: Live data fetching with progress indicators
- **Error Handling**: Comprehensive error messages and fallbacks
- **Command History**: Full audit trail of executed commands
- **Export Capabilities**: Excel, PDF, and JSON export options

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- API keys for data sources (see API Keys section)

### 🚀 Automated Setup (Recommended)

**One-line installer for Linux/macOS:**
```bash
curl -sSL https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.sh | bash
```

**One-line installer for Windows (PowerShell):**
```powershell
iwr -useb https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.ps1 | iex
```

**Cross-platform Python installer:**
```bash
curl -sSL https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.py | python3
```

The automated scripts will:
- ✅ Check system requirements
- ✅ Clone the repository
- ✅ Install dependencies
- ✅ Set up environment
- ✅ Run tests (optional)
- ✅ Start the development server

### Manual Setup
```bash
# Clone the repository
git clone https://github.com/Bwillia13x/financeanalyst_pro.git
cd financeanalyst_pro

# Install dependencies
npm install

# Copy environment file and add your API keys (optional - works in demo mode)
cp .env.example .env
# Edit .env with your API keys for live data

# Start development server
npm start
```

The application will be available at `http://localhost:4028`

### Quick Start (Demo Mode)
You can start using the application immediately without any API keys:
```bash
npm install
npm start
```
The app will run in demo mode with realistic mock data for all financial calculations.

📖 **For detailed setup instructions, see [SETUP.md](SETUP.md)**

## 🔑 API Keys

### Required for Full Functionality

1. **Alpha Vantage** (Free: 5 requests/min, 500/day)
   - Get key: https://www.alphavantage.co/support/#api-key
   - Add to `.env`: `VITE_ALPHA_VANTAGE_API_KEY=your_key_here`

2. **Financial Modeling Prep** (Free: 250 requests/day)
   - Get key: https://financialmodelingprep.com/developer/docs
   - Add to `.env`: `VITE_FMP_API_KEY=your_key_here`

3. **Quandl/NASDAQ Data Link** (Free: 50 requests/day)
   - Get key: https://data.nasdaq.com/sign-up
   - Add to `.env`: `VITE_QUANDL_API_KEY=your_key_here`

4. **FRED (Federal Reserve)** (Free: 120 requests/min)
   - Get key: https://fred.stlouisfed.org/docs/api/api_key.html
   - Add to `.env`: `VITE_FRED_API_KEY=your_key_here`

### Demo Mode
The application works in demo mode with limited functionality if no API keys are provided.

## 📊 Usage Examples

### Terminal Commands

#### DCF Analysis with Real Data
```bash
DCF(AAPL)
# Fetches Apple's financial statements, calculates DCF valuation
# Includes: revenue projections, FCF analysis, WACC calculation, terminal value
```

#### LBO Analysis
```bash
LBO(TSLA)
# Comprehensive leveraged buyout analysis for Tesla
# Includes: debt capacity, return scenarios, peer multiples
```

#### Comparable Company Analysis
```bash
COMP(MSFT)
# Identifies Microsoft's peer group
# Calculates relative valuation multiples vs. peers
```

#### Company Data Fetching
```bash
FETCH(GOOGL)     # Comprehensive company profile
PROFILE(AMZN)    # Basic company information
MARKET(NFLX)     # Real-time market data
PEERS(META)      # Peer company identification
SEC(AAPL, 10-K)  # SEC filings retrieval
```

#### Traditional Financial Functions
```bash
NPV([1000, 1100, 1200, 1300], 0.10)  # Net Present Value
IRR([1000, 1100, 1200, 1300])        # Internal Rate of Return
WACC(0.12, 0.05, 0.25, 0.3)          # Weighted Average Cost of Capital
```

#### Utility Commands
```bash
help           # Show all available commands
status         # API connection status
cache clear    # Clear data cache
export excel   # Export results to Excel
validate model # Check model integrity
```

## 🏗️ Architecture

### Data Fetching Layer
- **Multi-source integration**: Seamless switching between data providers
- **Intelligent caching**: Different TTLs for different data types
- **Rate limiting**: Prevents API quota exhaustion
- **Error handling**: Graceful fallbacks and retry mechanisms

### Financial Calculations
- **Real-time DCF**: Live data integration with financial statements
- **LBO modeling**: Complete transaction modeling with multiple scenarios
- **Peer analysis**: Automated peer identification and benchmarking
- **Risk analysis**: Monte Carlo simulations and sensitivity testing

### User Interface
- **Terminal interface**: Professional CLI experience
- **Real-time feedback**: Live progress indicators and status updates
- **Export options**: Multiple output formats for presentations
- **Collaboration tools**: Shared workspaces and real-time updates

## 📁 Project Structure

```
src/
├── services/
│   ├── dataFetching.js      # Main data fetching service
│   └── apiConfig.js         # API configuration and settings
├── utils/
│   ├── dataTransformation.js # Financial calculations and formatting
│   └── cn.js               # Utility functions
├── pages/
│   ├── financial-model-workspace/
│   │   ├── index.jsx       # Main workspace
│   │   └── components/
│   │       ├── TerminalInterface.jsx  # Enhanced CLI terminal
│   │       ├── CalculationResults.jsx # Results display
│   │       └── ...         # Other workspace components
│   └── ...
└── components/             # Reusable UI components

## 🧪 Local Dev Notes

- Backend: `http://localhost:3001` (CORS allows `http://localhost:5173`).
- Frontend (Vite): `http://localhost:5173`.
- Auth mocks: `POST /api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` (dev only).
- Error reporting: `POST /api/errors` accepts JSON payload and returns 200.
- Collaboration defaults: `VITE_ENABLE_COLLABORATION=false`, `VITE_COLLAB_WS_MOCK=true` in `.env.example`.
- SEO base URL: configure via `VITE_SITE_URL` (defaults to `https://valor-ivx.com`).
- External fetch fallbacks: gated by `VITE_ALLOW_DIRECT_FETCH` (default `false`).
```

## 🔧 Configuration

### Cache Settings
- **Market Data**: 15 minutes TTL
- **Financial Statements**: 6 hours TTL  
- **Company Profiles**: 24 hours TTL
- **SEC Filings**: 12 hours TTL

### Rate Limits
- **Alpha Vantage**: 5 requests/minute
- **FMP**: 250 requests/day
- **SEC EDGAR**: 10 requests/second
- **Yahoo Finance**: 100 requests/minute

## 🚦 Development

### Available Scripts
```bash
npm start         # Start development server
npm build         # Build for production
npm serve         # Preview production build
npm test          # Run tests
npm test:ui       # Run tests with UI
npm test:coverage # Run tests with coverage report
```

### Environment Variables
```bash
VITE_APP_ENV=development
VITE_DEBUG=true
VITE_CACHE_ENABLED=true
VITE_RATE_LIMITING_ENABLED=false
```

## 🚀 Deployment

### Production Build
```bash
# Build for production
npm run build

# The build files will be in the 'build' directory
# Serve the build directory with any static file server
npm run serve
```

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# VITE_ALPHA_VANTAGE_API_KEY=your_key
# VITE_FMP_API_KEY=your_key
# etc.
```

### Deploy to Netlify
```bash
# Build the project
npm run build

# Deploy the 'build' directory to Netlify
# Or connect your GitHub repo to Netlify for automatic deployments
```

### Deploy to GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d build"

# Build and deploy
npm run build
npm run deploy
```

### Environment Variables for Production
Set these environment variables in your deployment platform:
- `VITE_ALPHA_VANTAGE_API_KEY`
- `VITE_FMP_API_KEY`
- `VITE_QUANDL_API_KEY`
- `VITE_FRED_API_KEY`

**Note**: The app works perfectly in demo mode without any API keys.

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/utils/__tests__/dataTransformation.test.js
```

### Test Structure
```
src/
├── test/
│   ├── setup.js              # Test configuration
│   └── __tests__/
│       └── basic.test.js      # Basic infrastructure tests
├── utils/__tests__/           # Utility function tests
├── components/__tests__/      # Component tests
└── services/__tests__/        # Service tests
```

## 📈 Roadmap

### v2.1 - Enhanced Analytics
- [ ] Options pricing models (Black-Scholes, Monte Carlo)
- [ ] Credit risk analysis
- [ ] Portfolio optimization
- [ ] ESG integration

### v2.2 - Collaboration Features
- [ ] Real-time collaborative modeling
- [ ] Version control for financial models
- [ ] Shared templates and libraries
- [ ] Team workspaces

### v2.3 - Advanced Data
- [ ] Alternative data sources
- [ ] Earnings call transcripts
- [ ] News sentiment analysis
- [ ] Crypto and DeFi integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔧 Troubleshooting

### Common Issues

#### "API key validation failed"
- Check that your API keys are correctly set in the `.env` file
- Ensure you're using `VITE_` prefixes for environment variables
- Run `validate` command in the terminal to check API key status
- The app works in demo mode without API keys

#### "Module not found" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build fails
```bash
# Check Node.js version (requires 18+)
node --version

# Clear cache and rebuild
npm run build --clean
```

#### Tests not running
```bash
# Install test dependencies
npm install --save-dev vitest @vitest/ui jsdom

# Run tests
npm test
```

### Performance Tips
- Enable caching in production: `VITE_CACHE_ENABLED=true`
- Use rate limiting for API calls: `VITE_RATE_LIMITING_ENABLED=true`
- Monitor API usage to avoid quota limits

## 🆘 Support

- Documentation: [GitHub Wiki](https://github.com/Bwillia13x/financeanalyst_pro/wiki)
- Issues: [GitHub Issues](https://github.com/Bwillia13x/financeanalyst_pro/issues)
- Discussions: [GitHub Discussions](https://github.com/Bwillia13x/financeanalyst_pro/discussions)

## ⚠️ Disclaimer

This software is for educational and research purposes only. Not intended for actual investment decisions. Always consult with qualified financial professionals before making investment decisions.
