// Advanced Options Pricing Service with Black-Scholes and Greeks
class OptionsPricingService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Black-Scholes European option pricing model
  blackScholesPrice(option) {
    const {
      type, // 'call' or 'put'
      spotPrice, // S
      strikePrice, // K
      timeToExpiry, // T (in years)
      volatility, // σ
      riskFreeRate, // r
      dividendYield = 0 // q (optional)
    } = option;

    // Input validation
    if (!this.validateInputs(option)) {
      throw new Error('Invalid option parameters');
    }

    const cacheKey = `bs_${JSON.stringify(option)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Calculate d1 and d2
    const d1 = this.calculateD1(
      spotPrice,
      strikePrice,
      timeToExpiry,
      volatility,
      riskFreeRate,
      dividendYield
    );
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    // Calculate cumulative normal distribution values
    const Nd1 = this.normalCDF(d1);
    const Nd2 = this.normalCDF(d2);
    const Nd1Minus = 1 - Nd1;
    const Nd2Minus = 1 - Nd2;

    let price = 0;
    let intrinsicValue = 0;
    let timeValue = 0;

    if (type === 'call') {
      // Call option price
      const forwardPrice = spotPrice * Math.exp((riskFreeRate - dividendYield) * timeToExpiry);
      price = forwardPrice * Nd1 - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nd2;
      intrinsicValue = Math.max(spotPrice - strikePrice, 0);
    } else {
      // Put option price
      const forwardPrice = spotPrice * Math.exp((riskFreeRate - dividendYield) * timeToExpiry);
      price =
        strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nd2Minus - forwardPrice * Nd1Minus;
      intrinsicValue = Math.max(strikePrice - spotPrice, 0);
    }

    timeValue = price - intrinsicValue;

    // Calculate Greeks
    const greeks = this.calculateGreeks(
      d1,
      d2,
      Nd1,
      Nd2,
      spotPrice,
      strikePrice,
      timeToExpiry,
      volatility,
      riskFreeRate,
      dividendYield,
      type
    );

    const result = {
      price: Math.max(price, 0), // Ensure non-negative price
      intrinsicValue,
      timeValue: Math.max(timeValue, 0),
      greeks,
      parameters: option,
      model: 'Black-Scholes',
      timestamp: Date.now()
    };

    // Cache result
    this.cache.set(cacheKey, result);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

    return result;
  }

  // Calculate d1 for Black-Scholes
  calculateD1(S, K, T, σ, r, q = 0) {
    if (T <= 0) return S > K ? Infinity : -Infinity;
    if (σ <= 0) return S > K ? Infinity : -Infinity;

    const numerator = Math.log(S / K) + (r - q + (σ * σ) / 2) * T;
    const denominator = σ * Math.sqrt(T);

    return numerator / denominator;
  }

  // Cumulative normal distribution function
  normalCDF(x) {
    // Abramowitz & Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * absX);
    const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return 0.5 * (1.0 + sign * erf);
  }

  // Calculate option Greeks
  calculateGreeks(d1, d2, Nd1, Nd2, S, K, T, σ, r, q, type) {
    const sqrtT = Math.sqrt(T);
    const expMinusRT = Math.exp(-r * T);
    const expMinusQT = Math.exp(-q * T);

    // Common calculations
    const nd1 = this.normalPDF(d1); // Normal density at d1

    // Delta
    let delta;
    if (type === 'call') {
      delta = expMinusQT * Nd1;
    } else {
      delta = -expMinusQT * (1 - Nd1);
    }

    // Gamma (same for calls and puts)
    const gamma = (nd1 * expMinusQT) / (S * σ * sqrtT);

    // Vega (same for calls and puts)
    const vega = S * expMinusQT * nd1 * sqrtT * 0.01; // Scale to 1% change

    // Theta
    let theta;
    if (type === 'call') {
      theta =
        -((S * expMinusQT * nd1 * σ) / (2 * sqrtT)) -
        r * K * expMinusRT * Nd2 +
        q * S * expMinusQT * Nd1;
    } else {
      theta =
        -((S * expMinusQT * nd1 * σ) / (2 * sqrtT)) +
        r * K * expMinusRT * (1 - Nd2) -
        q * S * expMinusQT * (1 - Nd1);
    }
    theta = theta / 365; // Daily theta

    // Rho
    let rho;
    if (type === 'call') {
      rho = K * T * expMinusRT * Nd2 * 0.01; // Scale to 1% change
    } else {
      rho = -K * T * expMinusRT * (1 - Nd2) * 0.01;
    }

    return {
      delta: this.roundToDecimal(delta, 4),
      gamma: this.roundToDecimal(gamma, 4),
      vega: this.roundToDecimal(vega, 4),
      theta: this.roundToDecimal(theta, 4),
      rho: this.roundToDecimal(rho, 4)
    };
  }

  // Normal probability density function
  normalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  // Round to specified decimal places
  roundToDecimal(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  // Validate option inputs
  validateInputs(option) {
    const { type, spotPrice, strikePrice, timeToExpiry, volatility, riskFreeRate } = option;

    if (!['call', 'put'].includes(type)) return false;
    if (spotPrice <= 0 || strikePrice <= 0) return false;
    if (timeToExpiry < 0) return false;
    if (volatility < 0) return false;
    if (typeof riskFreeRate !== 'number') return false;

    return true;
  }

  // Binomial option pricing model
  binomialPrice(option, steps = 100) {
    const {
      type,
      spotPrice,
      strikePrice,
      timeToExpiry,
      volatility,
      riskFreeRate,
      dividendYield = 0,
      isAmerican = false
    } = option;

    if (!this.validateInputs(option)) {
      throw new Error('Invalid option parameters');
    }

    const dt = timeToExpiry / steps;
    const u = Math.exp(volatility * Math.sqrt(dt));
    const d = 1 / u;
    const a = Math.exp((riskFreeRate - dividendYield) * dt);
    const p = (a - d) / (u - d);
    const q = 1 - p;

    // Build binomial tree
    const tree = [];
    for (let i = 0; i <= steps; i++) {
      tree[i] = [];
      for (let j = 0; j <= i; j++) {
        tree[i][j] = spotPrice * Math.pow(u, j) * Math.pow(d, i - j);
      }
    }

    // Calculate option values at expiration
    const optionTree = [];
    for (let i = 0; i <= steps; i++) {
      optionTree[i] = [];
      for (let j = 0; j <= i; j++) {
        const stockPrice = tree[i][j];
        if (type === 'call') {
          optionTree[i][j] = Math.max(stockPrice - strikePrice, 0);
        } else {
          optionTree[i][j] = Math.max(strikePrice - stockPrice, 0);
        }
      }
    }

    // Backward induction
    for (let i = steps - 1; i >= 0; i--) {
      for (let j = 0; j <= i; j++) {
        const expectedValue = (p * optionTree[i + 1][j + 1] + q * optionTree[i + 1][j]) / a;
        const intrinsicValue =
          type === 'call'
            ? Math.max(tree[i][j] - strikePrice, 0)
            : Math.max(strikePrice - tree[i][j], 0);

        // For American options, check early exercise
        if (isAmerican) {
          optionTree[i][j] = Math.max(expectedValue, intrinsicValue);
        } else {
          optionTree[i][j] = expectedValue;
        }
      }
    }

    const price = optionTree[0][0];

    return {
      price,
      model: isAmerican ? 'Binomial (American)' : 'Binomial (European)',
      steps,
      parameters: option,
      timestamp: Date.now()
    };
  }

  // Calculate implied volatility using Newton-Raphson method
  impliedVolatility(option, marketPrice, tolerance = 0.0001, maxIterations = 100) {
    const { type, spotPrice, strikePrice, timeToExpiry, riskFreeRate, dividendYield = 0 } = option;

    let volatility = 0.2; // Initial guess
    let iteration = 0;
    let converged = false;

    while (iteration < maxIterations && !converged) {
      const optionPrice = this.blackScholesPrice({
        type,
        spotPrice,
        strikePrice,
        timeToExpiry,
        volatility,
        riskFreeRate,
        dividendYield
      });

      const vega = optionPrice.greeks.vega * 100; // Convert back to absolute vega

      if (Math.abs(vega) < 1e-8) {
        break; // Avoid division by zero
      }

      const priceDiff = marketPrice - optionPrice.price;
      const volatilityChange = priceDiff / vega;

      volatility += volatilityChange;

      if (Math.abs(priceDiff) < tolerance) {
        converged = true;
      }

      iteration++;
    }

    if (!converged || volatility < 0) {
      return {
        impliedVolatility: null,
        error: 'Failed to converge or invalid volatility',
        iterations: iteration
      };
    }

    return {
      impliedVolatility: Math.max(volatility, 0),
      iterations: iteration,
      converged
    };
  }

  // Calculate option strategy combinations
  calculateStrategy(strategy) {
    const { legs, spotPrice, volatility, riskFreeRate } = strategy;

    if (!Array.isArray(legs) || legs.length === 0) {
      throw new Error('Strategy must have at least one leg');
    }

    const results = [];
    let totalPremium = 0;
    let netDelta = 0;
    let netGamma = 0;
    let netVega = 0;
    let netTheta = 0;
    let netRho = 0;

    for (const leg of legs) {
      const option = {
        type: leg.type,
        spotPrice,
        strikePrice: leg.strike,
        timeToExpiry: leg.timeToExpiry,
        volatility,
        riskFreeRate,
        dividendYield: leg.dividendYield || 0
      };

      const pricing = this.blackScholesPrice(option);
      const multiplier = leg.quantity || 1;

      results.push({
        leg,
        pricing,
        adjustedPrice: pricing.price * multiplier,
        adjustedGreeks: {
          delta: pricing.greeks.delta * multiplier,
          gamma: pricing.greeks.gamma * multiplier,
          vega: pricing.greeks.vega * multiplier,
          theta: pricing.greeks.theta * multiplier,
          rho: pricing.greeks.rho * multiplier
        }
      });

      totalPremium += pricing.price * multiplier;
      netDelta += pricing.greeks.delta * multiplier;
      netGamma += pricing.greeks.gamma * multiplier;
      netVega += pricing.greeks.vega * multiplier;
      netTheta += pricing.greeks.theta * multiplier;
      netRho += pricing.greeks.rho * multiplier;
    }

    return {
      strategy: strategy.name || 'Custom Strategy',
      legs: results,
      summary: {
        totalPremium,
        netDelta,
        netGamma,
        netVega,
        netTheta,
        netRho
      },
      parameters: strategy,
      timestamp: Date.now()
    };
  }

  // Calculate option sensitivities (scenario analysis)
  calculateSensitivities(option, scenarios = {}) {
    const basePrice = this.blackScholesPrice(option);
    const sensitivities = {};

    // Price sensitivity to volatility changes
    if (scenarios.volatility) {
      sensitivities.volatility = scenarios.volatility.map(change => {
        const newOption = { ...option, volatility: option.volatility * (1 + change) };
        const newPrice = this.blackScholesPrice(newOption);
        return {
          change: change * 100,
          newPrice: newPrice.price,
          priceChange: newPrice.price - basePrice.price,
          percentageChange: ((newPrice.price - basePrice.price) / basePrice.price) * 100
        };
      });
    }

    // Price sensitivity to spot price changes
    if (scenarios.spotPrice) {
      sensitivities.spotPrice = scenarios.spotPrice.map(change => {
        const newOption = { ...option, spotPrice: option.spotPrice * (1 + change) };
        const newPrice = this.blackScholesPrice(newOption);
        return {
          change: change * 100,
          newPrice: newPrice.price,
          priceChange: newPrice.price - basePrice.price,
          percentageChange: ((newPrice.price - basePrice.price) / basePrice.price) * 100
        };
      });
    }

    return {
      basePrice: basePrice.price,
      sensitivities,
      parameters: option,
      timestamp: Date.now()
    };
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
const optionsPricingService = new OptionsPricingService();

// Export for use in components
export default optionsPricingService;

// Export class for testing
export { OptionsPricingService };
