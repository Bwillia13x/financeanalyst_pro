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

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd financeanalyst-pro

# Install dependencies
npm install

# Copy environment file and add your API keys
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm start
```

## 🔑 API Keys

### Required for Full Functionality

1. **Alpha Vantage** (Free: 5 requests/min, 500/day)
   - Get key: https://www.alphavantage.co/support/#api-key
   - Add to `.env`: `REACT_APP_ALPHA_VANTAGE_API_KEY=your_key_here`

2. **Financial Modeling Prep** (Free: 250 requests/day)
   - Get key: https://financialmodelingprep.com/developer/docs
   - Add to `.env`: `REACT_APP_FMP_API_KEY=your_key_here`

3. **Quandl/NASDAQ Data Link** (Free: 50 requests/day)
   - Get key: https://data.nasdaq.com/sign-up
   - Add to `.env`: `REACT_APP_QUANDL_API_KEY=your_key_here`

4. **FRED (Federal Reserve)** (Free: 120 requests/min)
   - Get key: https://fred.stlouisfed.org/docs/api/api_key.html
   - Add to `.env`: `REACT_APP_FRED_API_KEY=your_key_here`

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
npm start      # Start development server
npm build      # Build for production
npm serve      # Preview production build
```

### Environment Variables
```bash
REACT_APP_ENV=development
REACT_APP_DEBUG=true
REACT_APP_CACHE_ENABLED=true
REACT_APP_RATE_LIMITING_ENABLED=false
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

## 🆘 Support

- Documentation: [Wiki](link-to-wiki)
- Issues: [GitHub Issues](link-to-issues)
- Discussions: [GitHub Discussions](link-to-discussions)

## ⚠️ Disclaimer

This software is for educational and research purposes only. Not intended for actual investment decisions. Always consult with qualified financial professionals before making investment decisions.