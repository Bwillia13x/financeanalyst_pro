# Business Valuation Tool

A comprehensive web-based tool for conducting private business valuations using industry-standard methodologies including **Discounted Cash Flow (DCF)** and **Leveraged Buyout (LBO)** analysis.

## Features

### 🎯 Core Functionality

- **DCF Analysis**: Complete discounted cash flow modeling with terminal value calculations
- **LBO Analysis**: Leveraged buyout modeling with IRR and MOIC calculations
- **Real-time Calculations**: Instant results as you adjust parameters
- **Export Capabilities**: Download valuation results as JSON files
- **Professional UI**: Modern, responsive interface with intuitive controls

### 📊 DCF Analysis Features

- **Free Cash Flow Projections**: Multi-year cash flow modeling
- **Terminal Value Calculation**: Perpetuity growth model
- **Present Value Analysis**: Risk-adjusted discounting
- **Enterprise Value Calculation**: Complete business valuation
- **Key Metrics Display**: Revenue growth, margins, discount rates

### 💼 LBO Analysis Features

- **Equity Investment Modeling**: Capital structure analysis
- **Debt Financing**: Leverage and interest calculations
- **Exit Strategy Modeling**: Multiple-based exit valuations
- **Return Metrics**: IRR and MOIC calculations
- **Fee Structure**: Transaction and management fees

## Usage

### Accessing the Tool

1. Navigate to `/valuation-tool` in your application
2. Choose between DCF or LBO analysis using the tab interface
3. Enter your assumptions in the input panel
4. Click "Calculate Valuation" to see results
5. Export results using the download button

### DCF Inputs

- **Current Revenue**: Starting revenue for projections
- **Revenue Growth Rate**: Annual growth percentage
- **EBITDA Margin**: Profitability assumption
- **Tax Rate**: Corporate tax rate
- **CapEx (% of Revenue)**: Capital expenditure requirement
- **Working Capital (% of Revenue)**: Working capital needs
- **Terminal Growth Rate**: Long-term growth assumption
- **Discount Rate**: Risk-adjusted return requirement
- **Projection Years**: Number of years to model

### LBO Inputs

- **Purchase Price**: Total acquisition cost
- **Equity Contribution**: Percentage of equity vs debt
- **Debt Amount**: Leverage amount
- **Interest Rate**: Cost of debt
- **Exit Multiple**: EBITDA multiple at exit
- **Exit Year**: Holding period
- **EBITDA Growth Rate**: Operational improvement
- **EBITDA Margin**: Profitability assumption
- **Transaction Fees**: Acquisition costs
- **Management Fees**: Annual management fees

## Methodology

### DCF Analysis

The DCF model calculates the present value of future free cash flows:

1. **Revenue Projections**: Start with current revenue and apply growth rate
2. **EBITDA Calculation**: Apply margin assumptions to projected revenue
3. **Free Cash Flow**: EBITDA - Taxes - CapEx - Working Capital Changes
4. **Present Value**: Discount each year's FCF using the discount rate
5. **Terminal Value**: Calculate value of cash flows beyond projection period
6. **Enterprise Value**: Sum of present value FCF + present value terminal value

### LBO Analysis

The LBO model evaluates returns from leveraged acquisition:

1. **Capital Structure**: Determine equity investment and debt financing
2. **Operational Improvements**: Model EBITDA growth under new ownership
3. **Exit Valuation**: Apply exit multiple to projected EBITDA
4. **Debt Paydown**: Account for interest and principal payments
5. **Fee Deductions**: Subtract transaction and management fees
6. **Return Calculation**: Calculate IRR and MOIC on equity investment

## Industry Benchmarks

### Typical Discount Rates

- Large Cap Public: 8-12%
- Mid Cap Private: 12-18%
- Small Cap Private: 15-25%
- Early Stage: 25-40%

### Exit Multiples by Sector

- Technology: 8-15x EBITDA
- Manufacturing: 6-10x EBITDA
- Healthcare: 8-12x EBITDA
- Consumer: 6-9x EBITDA

## Best Practices

### DCF Best Practices

- Use conservative growth assumptions based on industry benchmarks
- Consider multiple scenarios (base, upside, downside)
- Validate discount rate against comparable companies
- Ensure terminal growth rate is sustainable long-term
- Account for industry-specific factors

### LBO Best Practices

- Model realistic operational improvements
- Consider debt capacity and interest coverage
- Account for transaction and management fees
- Validate exit multiple against market comparables
- Stress test assumptions under different scenarios

## Technical Implementation

### Architecture

- **React Components**: Modular, reusable components
- **State Management**: React hooks for local state
- **Calculations**: Pure JavaScript functions for financial modeling
- **UI Framework**: Tailwind CSS for styling
- **Animations**: Framer Motion for smooth transitions

### Key Components

- `ValuationTool.jsx`: Main application component
- `ValuationToolDocs.jsx`: Documentation and methodology guide
- `DCFInputs`: DCF parameter input form
- `LBOInputs`: LBO parameter input form
- `ResultsDisplay`: Results visualization component

### Financial Formulas

#### DCF Calculations

```
Free Cash Flow = Net Income + Depreciation - CapEx - Working Capital Changes
Present Value = FCF / (1 + Discount Rate)^year
Terminal Value = Final FCF * (1 + Terminal Growth) / (Discount Rate - Terminal Growth)
Enterprise Value = Σ Present Value FCF + Present Value Terminal Value
```

#### LBO Calculations

```
Equity Investment = Purchase Price * Equity Contribution
Exit Value = Exit EBITDA * Exit Multiple
Net Exit Value = Exit Value - Remaining Debt - Fees
IRR = (Net Exit Value / Equity Investment)^(1/Exit Year) - 1
MOIC = Net Exit Value / Equity Investment
```

## Limitations & Disclaimers

### Important Considerations

- This tool provides estimates based on simplified models
- Results should not be considered as financial advice
- Professional valuations require comprehensive analysis
- Always validate assumptions against market data
- Consider legal and regulatory requirements

### Professional Use

For professional valuations, consider:

- Detailed financial modeling and scenario analysis
- Industry-specific benchmarks and comparables
- Due diligence on company operations and market position
- Legal and regulatory considerations
- Expert review by qualified professionals

## Development

### File Structure

```
src/components/ValuationTool/
├── ValuationTool.jsx          # Main application component
├── ValuationToolDocs.jsx      # Documentation component
├── index.js                   # Component exports
└── README.md                  # This documentation
```

### Dependencies

- React 18.2.0
- Framer Motion 10.16.4
- Lucide React 0.484.0
- Tailwind CSS 3.4.6

### Routes

- `/valuation-tool`: Main valuation tool interface
- `/valuation-tool/docs`: Documentation and methodology guide

## Contributing

When contributing to the valuation tool:

1. **Maintain Accuracy**: Ensure financial calculations are mathematically correct
2. **Add Validation**: Include input validation for realistic parameter ranges
3. **Document Changes**: Update documentation for any methodology changes
4. **Test Scenarios**: Verify calculations with known test cases
5. **Follow Standards**: Adhere to industry best practices for financial modeling

## License

This tool is part of the FinanceAnalyst Pro application. Please refer to the main project license for usage terms.
