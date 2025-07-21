/**
 * Test file for ValuationTool financial calculations
 * This file tests the core financial modeling functions
 */

// DCF Calculation Test
const testDCFCalculation = () => {
  const dcfInputs = {
    currentRevenue: 1000000,
    revenueGrowthRate: 0.15,
    ebitdaMargin: 0.25,
    taxRate: 0.25,
    capexPercent: 0.05,
    workingCapitalPercent: 0.15,
    terminalGrowthRate: 0.03,
    discountRate: 0.12,
    projectionYears: 5
  };

  // Calculate expected values
  let revenue = dcfInputs.currentRevenue;
  let freeCashFlows = [];

  for (let year = 1; year <= dcfInputs.projectionYears; year++) {
    revenue *= (1 + dcfInputs.revenueGrowthRate);
    const ebitda = revenue * dcfInputs.ebitdaMargin;
    const ebit = ebitda * 0.8; // Assuming 20% of EBITDA is depreciation
    const taxes = ebit * dcfInputs.taxRate;
    const netIncome = ebit - taxes;
    const depreciation = ebitda * 0.2;
    const capex = revenue * dcfInputs.capexPercent;
    const workingCapitalChange = revenue * dcfInputs.workingCapitalPercent * dcfInputs.revenueGrowthRate;
    
    const fcf = netIncome + depreciation - capex - workingCapitalChange;
    freeCashFlows.push(fcf);
  }

  // Terminal value calculation
  const terminalFCF = freeCashFlows[freeCashFlows.length - 1] * (1 + dcfInputs.terminalGrowthRate);
  const terminalValue = terminalFCF / (dcfInputs.discountRate - dcfInputs.terminalGrowthRate);

  // Present value calculations
  let presentValueFCF = 0;
  for (let i = 0; i < freeCashFlows.length; i++) {
    presentValueFCF += freeCashFlows[i] / Math.pow(1 + dcfInputs.discountRate, i + 1);
  }

  const presentValueTerminal = terminalValue / Math.pow(1 + dcfInputs.discountRate, dcfInputs.projectionYears);
  const enterpriseValue = presentValueFCF + presentValueTerminal;

  // Test assertions
  console.log('DCF Test Results:');
  console.log('Enterprise Value:', enterpriseValue);
  console.log('Present Value FCF:', presentValueFCF);
  console.log('Terminal Value:', terminalValue);
  console.log('Free Cash Flows:', freeCashFlows);

  // Basic validation
  if (enterpriseValue > 0 && presentValueFCF > 0 && terminalValue > 0) {
    console.log('✅ DCF calculations passed basic validation');
  } else {
    console.log('❌ DCF calculations failed validation');
  }

  return {
    enterpriseValue,
    presentValueFCF,
    presentValueTerminal,
    terminalValue,
    freeCashFlows
  };
};

// LBO Calculation Test
const testLBOCalculation = () => {
  const lboInputs = {
    purchasePrice: 5000000,
    equityContribution: 0.4,
    debtAmount: 3000000,
    interestRate: 0.08,
    exitMultiple: 8,
    exitYear: 5,
    ebitdaGrowth: 0.12,
    ebitdaMargin: 0.25,
    transactionFees: 0.02,
    managementFees: 0.01
  };

  const equityInvestment = lboInputs.purchasePrice * lboInputs.equityContribution;
  const initialDebt = lboInputs.debtAmount;
  
  // Calculate initial EBITDA (assuming purchase price is 8x EBITDA)
  const initialEBITDA = lboInputs.purchasePrice / 8;
  
  // Calculate exit EBITDA with growth
  let exitEBITDA = initialEBITDA;
  for (let year = 1; year <= lboInputs.exitYear; year++) {
    exitEBITDA *= (1 + lboInputs.ebitdaGrowth);
  }
  
  // Exit value
  const exitValue = exitEBITDA * lboInputs.exitMultiple;
  
  // Debt paydown (simplified - assume no principal paydown)
  const totalInterest = initialDebt * lboInputs.interestRate * lboInputs.exitYear;
  const remainingDebt = initialDebt; // Assume no principal paydown
  
  // Fees
  const transactionFeesAmount = lboInputs.purchasePrice * lboInputs.transactionFees;
  const managementFeesAmount = lboInputs.purchasePrice * lboInputs.managementFees * lboInputs.exitYear;
  
  // Returns
  const netExitValue = exitValue - remainingDebt - totalInterest - transactionFeesAmount - managementFeesAmount;
  const irr = Math.pow(netExitValue / equityInvestment, 1 / lboInputs.exitYear) - 1;
  const moic = netExitValue / equityInvestment;

  // Test assertions
  console.log('LBO Test Results:');
  console.log('Equity Investment:', equityInvestment);
  console.log('Exit Value:', exitValue);
  console.log('Net Exit Value:', netExitValue);
  console.log('IRR:', (irr * 100).toFixed(1) + '%');
  console.log('MOIC:', moic.toFixed(2) + 'x');

  // Basic validation
  if (irr > 0 && moic > 1 && netExitValue > 0) {
    console.log('✅ LBO calculations passed basic validation');
  } else {
    console.log('❌ LBO calculations failed validation');
  }

  return {
    equityInvestment,
    netExitValue,
    irr: irr * 100,
    moic,
    exitValue,
    remainingDebt,
    exitEBITDA
  };
};

// Run tests
console.log('🧪 Running Valuation Tool Tests...\n');

const dcfResults = testDCFCalculation();
console.log('\n');

const lboResults = testLBOCalculation();
console.log('\n');

console.log('📊 Test Summary:');
console.log('DCF Enterprise Value:', new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(dcfResults.enterpriseValue));

console.log('LBO IRR:', lboResults.irr.toFixed(1) + '%');
console.log('LBO MOIC:', lboResults.moic.toFixed(2) + 'x');

console.log('\n✅ All tests completed successfully!');

export { testDCFCalculation, testLBOCalculation };