export const useValuationCalculations = () => {
  const calculateDCF = (dcfInputs) => {
    const {
      currentRevenue,
      revenueGrowthRate,
      ebitdaMargin,
      taxRate,
      capexPercent,
      workingCapitalPercent,
      terminalGrowthRate,
      discountRate,
      projectionYears
    } = dcfInputs;

    const freeCashFlows = [];
    let revenue = currentRevenue;

    // Calculate projected free cash flows
    for (let year = 1; year <= projectionYears; year++) {
      revenue *= (1 + revenueGrowthRate);
      const ebitda = revenue * ebitdaMargin;
      const ebit = ebitda * 0.8; // Assuming 20% of EBITDA is depreciation
      const taxes = ebit * taxRate;
      const netIncome = ebit - taxes;
      const depreciation = ebitda * 0.2;
      const capex = revenue * capexPercent;
      const workingCapitalChange = revenue * workingCapitalPercent * revenueGrowthRate;

      const fcf = netIncome + depreciation - capex - workingCapitalChange;
      freeCashFlows.push(fcf);
    }

    // Terminal value calculation
    const terminalFCF = freeCashFlows[freeCashFlows.length - 1] * (1 + terminalGrowthRate);
    const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);

    // Present value calculations
    let presentValueFCF = 0;
    for (let i = 0; i < freeCashFlows.length; i++) {
      presentValueFCF += freeCashFlows[i] / Math.pow(1 + discountRate, i + 1);
    }

    const presentValueTerminal = terminalValue / Math.pow(1 + discountRate, projectionYears);
    const enterpriseValue = presentValueFCF + presentValueTerminal;

    return {
      enterpriseValue,
      presentValueFCF,
      presentValueTerminal,
      terminalValue,
      freeCashFlows,
      assumptions: dcfInputs
    };
  };

  const calculateLBO = (lboInputs) => {
    const {
      purchasePrice,
      equityContribution,
      debtAmount,
      interestRate,
      exitMultiple,
      exitYear,
      ebitdaGrowth,
      transactionFees,
      managementFees
    } = lboInputs;

    const equityInvestment = purchasePrice * equityContribution;
    const initialDebt = debtAmount;

    // Calculate initial EBITDA (assuming purchase price is 8x EBITDA)
    const initialEBITDA = purchasePrice / 8;

    // Calculate exit EBITDA with growth
    let exitEBITDA = initialEBITDA;
    for (let year = 1; year <= exitYear; year++) {
      exitEBITDA *= (1 + ebitdaGrowth);
    }

    // Exit value
    const exitValue = exitEBITDA * exitMultiple;

    // Debt paydown (simplified - assume no principal paydown)
    const totalInterest = initialDebt * interestRate * exitYear;
    const remainingDebt = initialDebt; // Assume no principal paydown

    // Fees
    const transactionFeesAmount = purchasePrice * transactionFees;
    const managementFeesAmount = purchasePrice * managementFees * exitYear;

    // Returns
    const netExitValue = exitValue - remainingDebt - totalInterest - transactionFeesAmount - managementFeesAmount;
    const irr = Math.pow(netExitValue / equityInvestment, 1 / exitYear) - 1;
    const moic = netExitValue / equityInvestment;

    return {
      equityInvestment,
      netExitValue,
      irr: irr * 100,
      moic,
      exitValue,
      remainingDebt: remainingDebt + totalInterest,
      exitEBITDA,
      assumptions: lboInputs
    };
  };

  return { calculateDCF, calculateLBO };
};
