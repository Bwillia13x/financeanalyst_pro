// Advanced Derivatives Analysis Service
class DerivativesService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Forward contract pricing and analysis
  forwardContractPricing(contract) {
    const {
      type, // 'forward' or 'futures'
      underlyingAsset,
      contractSize,
      spotPrice,
      strikePrice,
      timeToDelivery,
      riskFreeRate,
      dividendYield = 0,
      storageCosts = 0,
      convenienceYield = 0
    } = contract;

    const cacheKey = `forward_${JSON.stringify(contract)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Forward price calculation
    const forwardPrice = spotPrice * Math.exp((riskFreeRate - dividendYield + storageCosts - convenienceYield) * timeToDelivery);

    // Theoretical value at delivery
    const intrinsicValue = spotPrice - strikePrice;

    // Time value (for non-delivery periods)
    const timeValue = forwardPrice - strikePrice;

    // Calculate sensitivities
    const delta = Math.exp((riskFreeRate - dividendYield + storageCosts - convenienceYield) * timeToDelivery);
    const gamma = 0; // Linear relationship

    // Rho (interest rate sensitivity)
    const rho = spotPrice * timeToDelivery * Math.exp((riskFreeRate - dividendYield + storageCosts - convenienceYield) * timeToDelivery);

    // Dividend yield sensitivity
    const dividendRho = -spotPrice * timeToDelivery * Math.exp((riskFreeRate - dividendYield + storageCosts - convenienceYield) * timeToDelivery);

    const result = {
      forwardPrice,
      theoreticalValue: forwardPrice * contractSize,
      intrinsicValue: intrinsicValue * contractSize,
      timeValue: timeValue * contractSize,
      deliveryValue: intrinsicValue * contractSize,
      sensitivities: {
        delta,
        gamma,
        rho,
        dividendRho
      },
      contract,
      timestamp: Date.now()
    };

    this.cache.set(cacheKey, result);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

    return result;
  }

  // Futures contract analysis with margin and marking-to-market
  futuresContractAnalysis(contract) {
    const {
      underlyingAsset,
      contractSize,
      initialPrice,
      currentPrice,
      maintenanceMargin,
      initialMargin,
      timeToExpiry,
      riskFreeRate,
      dailyPriceHistory = []
    } = contract;

    // Calculate margin requirements
    const currentValue = currentPrice * contractSize;
    const initialValue = initialPrice * contractSize;
    const unrealizedPnL = currentValue - initialValue;

    // Margin status
    const equity = initialMargin + unrealizedPnL;
    const marginUsed = (initialMargin - equity) / initialMargin;
    const marginCall = equity <= maintenanceMargin;

    // Calculate volatility from price history
    const volatility = this.calculateHistoricalVolatility(dailyPriceHistory);

    // Risk metrics
    const valueAtRisk = this.calculateVaR(currentPrice, volatility, timeToExpiry, 0.95);
    const expectedShortfall = this.calculateExpectedShortfall(currentPrice, volatility, timeToExpiry, 0.95);

    // Greeks
    const delta = contractSize;
    const gamma = 0;

    return {
      currentValue,
      unrealizedPnL,
      marginStatus: {
        equity,
        marginUsed: marginUsed * 100,
        marginCall,
        maintenanceMargin,
        initialMargin
      },
      riskMetrics: {
        volatility: volatility * 100,
        valueAtRisk,
        expectedShortfall,
        confidenceLevel: 95
      },
      sensitivities: {
        delta,
        gamma
      },
      contract,
      timestamp: Date.now()
    };
  }

  // Swap valuation and analysis
  swapValuation(swap) {
    const {
      type, // 'interest_rate' or 'currency'
      notionalPrincipal,
      fixedRate,
      floatingRate,
      paymentFrequency, // payments per year
      timeToMaturity,
      riskFreeRate,
      spread = 0,
      currency1 = 'USD',
      currency2 = 'EUR',
      exchangeRate = 1
    } = swap;

    if (type === 'interest_rate') {
      return this.interestRateSwapValuation({
        notionalPrincipal,
        fixedRate,
        floatingRate,
        paymentFrequency,
        timeToMaturity,
        riskFreeRate,
        spread
      });
    } else if (type === 'currency') {
      return this.currencySwapValuation({
        notionalPrincipal,
        fixedRate,
        floatingRate,
        paymentFrequency,
        timeToMaturity,
        riskFreeRate,
        currency1,
        currency2,
        exchangeRate
      });
    }

    throw new Error('Unsupported swap type');
  }

  // Interest rate swap valuation
  interestRateSwapValuation(swap) {
    const {
      notionalPrincipal,
      fixedRate,
      floatingRate,
      paymentFrequency,
      timeToMaturity,
      riskFreeRate,
      spread
    } = swap;

    const numPayments = Math.floor(timeToMaturity * paymentFrequency);
    const dt = 1 / paymentFrequency;

    // Calculate present value of fixed payments
    let pvFixed = 0;
    let pvFloating = 0;

    for (let i = 1; i <= numPayments; i++) {
      const time = i * dt;
      const discountFactor = Math.exp(-riskFreeRate * time);

      // Fixed leg
      pvFixed += notionalPrincipal * fixedRate * dt * discountFactor;

      // Floating leg (approximated)
      const forwardRate = riskFreeRate + spread;
      pvFloating += notionalPrincipal * forwardRate * dt * discountFactor;
    }

    // Add principal repayment
    const finalDiscountFactor = Math.exp(-riskFreeRate * timeToMaturity);
    pvFixed += notionalPrincipal * finalDiscountFactor;
    pvFloating += notionalPrincipal * finalDiscountFactor;

    const swapValue = pvFloating - pvFixed;

    // Calculate sensitivities
    const duration = this.calculateSwapDuration(swap);
    const convexity = this.calculateSwapConvexity(swap);

    return {
      swapValue,
      pvFixed,
      pvFloating,
      fixedRate,
      floatingRate: floatingRate + spread,
      notionalPrincipal,
      duration,
      convexity,
      sensitivities: {
        dv01: duration * swapValue * 0.0001, // 1 basis point change
        convexityAdjustment: convexity * Math.pow(0.0001, 2) * swapValue
      },
      swap,
      timestamp: Date.now()
    };
  }

  // Currency swap valuation
  currencySwapValuation(swap) {
    const {
      notionalPrincipal,
      fixedRate,
      paymentFrequency,
      timeToMaturity,
      riskFreeRate,
      currency1,
      currency2,
      exchangeRate
    } = swap;

    // Simplified currency swap valuation
    const domesticValue = this.interestRateSwapValuation({
      ...swap,
      notionalPrincipal: notionalPrincipal,
      riskFreeRate: riskFreeRate
    });

    const foreignValue = this.interestRateSwapValuation({
      ...swap,
      notionalPrincipal: notionalPrincipal * exchangeRate,
      riskFreeRate: riskFreeRate // Simplified - should use foreign risk-free rate
    });

    const currencyAdjustedValue = domesticValue.swapValue - foreignValue.swapValue / exchangeRate;

    return {
      swapValue: currencyAdjustedValue,
      domesticValue: domesticValue.swapValue,
      foreignValue: foreignValue.swapValue,
      exchangeRate,
      currency1,
      currency2,
      notionalPrincipal,
      swap,
      timestamp: Date.now()
    };
  }

  // Calculate historical volatility
  calculateHistoricalVolatility(priceHistory, periods = 252) {
    if (priceHistory.length < 2) return 0;

    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < priceHistory.length; i++) {
      returns.push(Math.log(priceHistory[i] / priceHistory[i - 1]));
    }

    // Calculate standard deviation of returns
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

    // Annualized volatility
    return Math.sqrt(variance * periods);
  }

  // Calculate Value at Risk (VaR)
  calculateVaR(currentPrice, volatility, timeHorizon, confidenceLevel = 0.95) {
    // Using parametric VaR (normal distribution assumption)
    const zScore = this.normalInverseCDF(confidenceLevel);
    const var95 = currentPrice * volatility * Math.sqrt(timeHorizon) * Math.abs(zScore);
    return var95;
  }

  // Calculate Expected Shortfall (ES)
  calculateExpectedShortfall(currentPrice, volatility, timeHorizon, confidenceLevel = 0.95) {
    // Simplified ES calculation
    const zScore = this.normalInverseCDF(confidenceLevel);
    const es = currentPrice * volatility * Math.sqrt(timeHorizon) * Math.abs(zScore) /
               (1 - confidenceLevel) * Math.exp(-0.5 * zScore * zScore) / Math.sqrt(2 * Math.PI);
    return es;
  }

  // Normal inverse CDF approximation
  normalInverseCDF(p) {
    // Using approximation formula
    if (p <= 0 || p >= 1) return 0;

    const a1 = -39.6968302866538;
    const a2 = 220.946098424521;
    const a3 = -275.928510446969;
    const a4 = 138.357751867269;
    const a5 = -30.6647980661472;
    const a6 = 2.50662827745924;

    const b1 = -54.4760987982241;
    const b2 = 161.585836858041;
    const b3 = -155.698979859887;
    const b4 = 66.8013118877197;
    const b5 = -13.2806815528857;

    const c1 = -7.78489400243029E-03;
    const c2 = -0.322396458041136;
    const c3 = -2.40075827716184;
    const c4 = -2.54973253934373;
    const c5 = 4.37466414146497;
    const c6 = 2.93816398269878;

    const d1 = 7.78469570904146E-03;
    const d2 = 0.32246712907004;
    const d3 = 2.445134137143;
    const d4 = 3.75440866190742;

    const q = p - 0.5;

    let r;
    if (Math.abs(q) <= 0.42) {
      r = q * q;
      return q * (((a6 * r + a5) * r + a4) * r + a3) * r + a2) * r + a1 /
                 ((((b5 * r + b4) * r + b3) * r + b2) * r + b1) * r + 1;
    } else {
      r = q < 0 ? p : 1 - p;
      r = Math.log(-Math.log(r));
      const numerator = ((c6 * r + c5) * r + c4) * r + c3) * r + c2) * r + c1;
      const denominator = ((d4 * r + d3) * r + d2) * r + d1) * r + 1;
      return q < 0 ? -numerator / denominator : numerator / denominator;
    }
  }

  // Calculate swap duration
  calculateSwapDuration(swap) {
    const {
      notionalPrincipal,
      fixedRate,
      paymentFrequency,
      timeToMaturity,
      riskFreeRate
    } = swap;

    const numPayments = Math.floor(timeToMaturity * paymentFrequency);
    const dt = 1 / paymentFrequency;

    let duration = 0;
    let totalPV = 0;

    for (let i = 1; i <= numPayments; i++) {
      const time = i * dt;
      const discountFactor = Math.exp(-riskFreeRate * time);
      const cashFlow = notionalPrincipal * fixedRate * dt;

      duration += time * cashFlow * discountFactor;
      totalPV += cashFlow * discountFactor;
    }

    // Add principal
    const finalDiscountFactor = Math.exp(-riskFreeRate * timeToMaturity);
    duration += timeToMaturity * notionalPrincipal * finalDiscountFactor;
    totalPV += notionalPrincipal * finalDiscountFactor;

    return duration / totalPV;
  }

  // Calculate swap convexity
  calculateSwapConvexity(swap) {
    const {
      notionalPrincipal,
      fixedRate,
      paymentFrequency,
      timeToMaturity,
      riskFreeRate
    } = swap;

    const numPayments = Math.floor(timeToMaturity * paymentFrequency);
    const dt = 1 / paymentFrequency;

    let convexity = 0;
    let totalPV = 0;

    for (let i = 1; i <= numPayments; i++) {
      const time = i * dt;
      const discountFactor = Math.exp(-riskFreeRate * time);
      const cashFlow = notionalPrincipal * fixedRate * dt;

      convexity += time * time * cashFlow * discountFactor;
      totalPV += cashFlow * discountFactor;
    }

    // Add principal
    const finalDiscountFactor = Math.exp(-riskFreeRate * timeToMaturity);
    convexity += timeToMaturity * timeToMaturity * notionalPrincipal * finalDiscountFactor;
    totalPV += notionalPrincipal * finalDiscountFactor;

    return convexity / totalPV;
  }

  // Portfolio of derivatives analysis
  analyzeDerivativesPortfolio(portfolio) {
    const { derivatives, correlationMatrix = null } = portfolio;

    const results = derivatives.map(derivative => {
      switch (derivative.type) {
        case 'forward':
        case 'futures':
          return this.forwardContractPricing(derivative);
        case 'swap':
          return this.swapValuation(derivative);
        default:
          throw new Error(`Unsupported derivative type: ${derivative.type}`);
      }
    });

    // Calculate portfolio-level metrics
    const totalValue = results.reduce((sum, result) => sum + (result.theoreticalValue || result.swapValue || 0), 0);
    const totalRisk = this.calculatePortfolioRisk(results, correlationMatrix);

    return {
      derivatives: results,
      portfolioMetrics: {
        totalValue,
        totalRisk,
        riskAdjustedReturn: totalValue / totalRisk,
        diversificationRatio: this.calculateDiversificationRatio(results)
      },
      timestamp: Date.now()
    };
  }

  // Calculate portfolio risk
  calculatePortfolioRisk(derivatives, correlationMatrix) {
    if (!correlationMatrix) {
      // Simple sum of individual risks
      return derivatives.reduce((sum, derivative) => {
        const risk = derivative.sensitivities?.rho || derivative.swapValue * 0.1 || 0;
        return sum + Math.abs(risk);
      }, 0);
    }

    // More sophisticated portfolio risk calculation would go here
    // For now, return simplified calculation
    return derivatives.length * 1000;
  }

  // Calculate diversification ratio
  calculateDiversificationRatio(derivatives) {
    if (derivatives.length <= 1) return 1;

    const individualRisks = derivatives.map(d =>
      Math.abs(d.sensitivities?.rho || d.swapValue * 0.1 || 100)
    );

    const totalRisk = individualRisks.reduce((sum, risk) => sum + risk, 0);
    const avgRisk = totalRisk / individualRisks.length;

    // Diversification ratio (lower is better diversified)
    return totalRisk / (avgRisk * Math.sqrt(individualRisks.length));
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const derivativesService = new DerivativesService();

// Export for use in components
export default derivativesService;

// Export class for testing
export { DerivativesService };
