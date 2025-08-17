/**
 * Options & Derivatives Pricing Engine
 * Black-Scholes, Greeks, volatility modeling, and exotic options
 */

class OptionsEngine {
  constructor() {
    this.volSurface = new Map();
    this.riskFreeRates = new Map();
    this.dividendYields = new Map();
  }

  /**
   * Black-Scholes Option Pricing
   */

  // Standard Black-Scholes formula for European options
  blackScholes(optionType, S, K, T, r, sigma, q = 0) {
    const d1 = this.calculateD1(S, K, T, r, sigma, q);
    const d2 = this.calculateD2(d1, sigma, T);

    const Nd1 = this.cumulativeNormalDistribution(d1);
    const Nd2 = this.cumulativeNormalDistribution(d2);
    const Nnd1 = this.cumulativeNormalDistribution(-d1);
    const Nnd2 = this.cumulativeNormalDistribution(-d2);

    const discountFactor = Math.exp(-r * T);
    const dividendFactor = Math.exp(-q * T);

    let optionPrice, intrinsicValue;

    if (optionType.toLowerCase() === 'call') {
      optionPrice = S * dividendFactor * Nd1 - K * discountFactor * Nd2;
      intrinsicValue = Math.max(S - K, 0);
    } else {
      optionPrice = K * discountFactor * Nnd2 - S * dividendFactor * Nnd1;
      intrinsicValue = Math.max(K - S, 0);
    }

    const timeValue = optionPrice - intrinsicValue;
    const moneyness = S / K;

    return {
      optionPrice,
      intrinsicValue,
      timeValue,
      moneyness,
      d1,
      d2,
      impliedParameters: {
        spot: S,
        strike: K,
        timeToExpiry: T,
        riskFreeRate: r,
        volatility: sigma,
        dividendYield: q
      }
    };
  }

  // Calculate Greeks (risk sensitivities)
  calculateGreeks(optionType, S, K, T, r, sigma, q = 0) {
    const d1 = this.calculateD1(S, K, T, r, sigma, q);
    const d2 = this.calculateD2(d1, sigma, T);

    const Nd1 = this.cumulativeNormalDistribution(d1);
    const Nd2 = this.cumulativeNormalDistribution(d2);
    const nd1 = this.normalDistribution(d1);
    const nd2 = this.normalDistribution(d2);

    const discountFactor = Math.exp(-r * T);
    const dividendFactor = Math.exp(-q * T);

    let delta, gamma, theta, vega, rho;

    // Delta (price sensitivity to underlying)
    if (optionType.toLowerCase() === 'call') {
      delta = dividendFactor * Nd1;
    } else {
      delta = dividendFactor * (Nd1 - 1);
    }

    // Gamma (delta sensitivity to underlying)
    gamma = (dividendFactor * nd1) / (S * sigma * Math.sqrt(T));

    // Vega (price sensitivity to volatility)
    vega = S * dividendFactor * nd1 * Math.sqrt(T) / 100; // Per 1% volatility change

    // Theta (price sensitivity to time decay)
    const thetaTerm1 = -(S * dividendFactor * nd1 * sigma) / (2 * Math.sqrt(T));
    const thetaTerm2 = r * K * discountFactor;
    const thetaTerm3 = q * S * dividendFactor;

    if (optionType.toLowerCase() === 'call') {
      theta = (thetaTerm1 - thetaTerm2 * Nd2 + thetaTerm3 * Nd1) / 365; // Per day
    } else {
      theta = (thetaTerm1 + thetaTerm2 * this.cumulativeNormalDistribution(-d2) - thetaTerm3 * this.cumulativeNormalDistribution(-d1)) / 365;
    }

    // Rho (price sensitivity to interest rate)
    if (optionType.toLowerCase() === 'call') {
      rho = K * T * discountFactor * Nd2 / 100; // Per 1% rate change
    } else {
      rho = -K * T * discountFactor * this.cumulativeNormalDistribution(-d2) / 100;
    }

    return {
      delta,
      gamma,
      theta,
      vega,
      rho,
      lambda: delta * (S / this.blackScholes(optionType, S, K, T, r, sigma, q).optionPrice), // Leverage
      charm: this.calculateCharm(optionType, S, K, T, r, sigma, q), // Delta decay
      vanna: this.calculateVanna(S, K, T, r, sigma, q), // Delta sensitivity to volatility
      volga: this.calculateVolga(S, K, T, r, sigma, q)  // Vega sensitivity to volatility
    };
  }

  // Implied Volatility using Newton-Raphson method
  calculateImpliedVolatility(optionType, marketPrice, S, K, T, r, q = 0, tolerance = 0.0001, maxIterations = 100) {
    let sigma = 0.2; // Initial guess

    for (let i = 0; i < maxIterations; i++) {
      const bsPrice = this.blackScholes(optionType, S, K, T, r, sigma, q).optionPrice;
      const priceDiff = bsPrice - marketPrice;

      if (Math.abs(priceDiff) < tolerance) {
        return {
          impliedVolatility: sigma,
          iterations: i + 1,
          priceAccuracy: priceDiff,
          annualizedVol: sigma,
          volPercentage: sigma * 100
        };
      }

      // Calculate vega for Newton-Raphson iteration
      const vega = this.calculateGreeks(optionType, S, K, T, r, sigma, q).vega * 100;

      if (Math.abs(vega) < 1e-10) break; // Avoid division by zero

      sigma = sigma - (priceDiff / vega);

      // Ensure volatility remains positive
      if (sigma <= 0) sigma = 0.001;
      if (sigma > 5) sigma = 5; // Cap at 500% volatility
    }

    throw new Error('Implied volatility calculation did not converge');
  }

  /**
   * Advanced Greeks (Second-order)
   */

  calculateCharm(optionType, S, K, T, r, sigma, q) {
    const d1 = this.calculateD1(S, K, T, r, sigma, q);
    const d2 = this.calculateD2(d1, sigma, T);
    const nd1 = this.normalDistribution(d1);
    const dividendFactor = Math.exp(-q * T);

    const term1 = q * dividendFactor * this.cumulativeNormalDistribution(optionType.toLowerCase() === 'call' ? d1 : -d1);
    const term2 = (dividendFactor * nd1 * (2 * (r - q) * T - d2 * sigma * Math.sqrt(T))) / (2 * T * sigma * Math.sqrt(T));

    return optionType.toLowerCase() === 'call' ? term1 - term2 : -term1 - term2;
  }

  calculateVanna(S, K, T, r, sigma, q) {
    const d1 = this.calculateD1(S, K, T, r, sigma, q);
    const d2 = this.calculateD2(d1, sigma, T);
    const nd1 = this.normalDistribution(d1);
    const dividendFactor = Math.exp(-q * T);

    return -(dividendFactor * nd1 * d2) / sigma;
  }

  calculateVolga(S, K, T, r, sigma, q) {
    const d1 = this.calculateD1(S, K, T, r, sigma, q);
    const d2 = this.calculateD2(d1, sigma, T);
    const nd1 = this.normalDistribution(d1);
    const dividendFactor = Math.exp(-q * T);

    return S * dividendFactor * nd1 * Math.sqrt(T) * (d1 * d2) / sigma;
  }

  /**
   * American Options (Binomial Trees)
   */

  americanOptionBinomial(optionType, S, K, T, r, sigma, q = 0, steps = 100) {
    const dt = T / steps;
    const u = Math.exp(sigma * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp((r - q) * dt) - d) / (u - d);
    const discount = Math.exp(-r * dt);

    // Initialize asset prices at maturity
    const assetPrices = [];
    const optionValues = [];

    for (let i = 0; i <= steps; i++) {
      assetPrices[i] = S * Math.pow(u, steps - i) * Math.pow(d, i);

      if (optionType.toLowerCase() === 'call') {
        optionValues[i] = Math.max(assetPrices[i] - K, 0);
      } else {
        optionValues[i] = Math.max(K - assetPrices[i], 0);
      }
    }

    // Work backward through the tree
    for (let j = steps - 1; j >= 0; j--) {
      for (let i = 0; i <= j; i++) {
        const spotPrice = S * Math.pow(u, j - i) * Math.pow(d, i);

        // European value
        const europeanValue = discount * (p * optionValues[i] + (1 - p) * optionValues[i + 1]);

        // Intrinsic value (early exercise)
        let intrinsicValue;
        if (optionType.toLowerCase() === 'call') {
          intrinsicValue = Math.max(spotPrice - K, 0);
        } else {
          intrinsicValue = Math.max(K - spotPrice, 0);
        }

        // American option value is max of European and intrinsic
        optionValues[i] = Math.max(europeanValue, intrinsicValue);
      }
    }

    const europeanPrice = this.blackScholes(optionType, S, K, T, r, sigma, q).optionPrice;
    const earlyExercisePremium = optionValues[0] - europeanPrice;

    return {
      americanPrice: optionValues[0],
      europeanPrice,
      earlyExercisePremium,
      earlyExerciseValue: earlyExercisePremium > 0,
      treeParameters: {
        steps,
        upMove: u,
        downMove: d,
        riskNeutralProb: p
      }
    };
  }

  /**
   * Exotic Options
   */

  // Asian Option (Monte Carlo)
  asianOption(optionType, S, K, T, r, sigma, q = 0, simulations = 10000, monitoringPoints = 252) {
    const dt = T / monitoringPoints;
    const drift = (r - q - 0.5 * sigma * sigma) * dt;
    const diffusion = sigma * Math.sqrt(dt);

    let totalPayoff = 0;

    for (let sim = 0; sim < simulations; sim++) {
      let spot = S;
      let arithmeticSum = 0;
      let geometricProduct = 1;

      for (let i = 0; i < monitoringPoints; i++) {
        const z = this.boxMullerRandom();
        spot = spot * Math.exp(drift + diffusion * z);
        arithmeticSum += spot;
        geometricProduct *= Math.pow(spot, 1 / monitoringPoints);
      }

      const arithmeticAverage = arithmeticSum / monitoringPoints;

      let payoff;
      if (optionType.toLowerCase() === 'call') {
        payoff = Math.max(arithmeticAverage - K, 0);
      } else {
        payoff = Math.max(K - arithmeticAverage, 0);
      }

      totalPayoff += payoff;
    }

    const optionPrice = Math.exp(-r * T) * (totalPayoff / simulations);

    return {
      optionPrice,
      optionType: `Asian ${optionType}`,
      averagingMethod: 'arithmetic',
      simulations,
      monitoringPoints
    };
  }

  // Barrier Option
  barrierOption(optionType, barrierType, S, K, H, T, r, sigma, q = 0, rebate = 0) {
    // Simplified barrier option pricing using Black-Scholes adjustments
    const lambda = (r - q + 0.5 * sigma * sigma) / (sigma * sigma);
    const y1 = (Math.log(H * H / (S * K)) / (sigma * Math.sqrt(T))) + lambda * sigma * Math.sqrt(T);
    const y2 = (Math.log(H / S) / (sigma * Math.sqrt(T))) + lambda * sigma * Math.sqrt(T);

    const vanillaPrice = this.blackScholes(optionType, S, K, T, r, sigma, q).optionPrice;

    let barrierPrice;

    if (barrierType.toLowerCase().includes('knock-out')) {
      // Knock-out option
      if (S <= H) {
        barrierPrice = rebate * Math.exp(-r * T);
      } else {
        const knockOutAdjustment = Math.pow(H / S, 2 * lambda);
        barrierPrice = vanillaPrice - knockOutAdjustment * this.blackScholes(optionType, H * H / S, K, T, r, sigma, q).optionPrice;
      }
    } else {
      // Knock-in option
      barrierPrice = vanillaPrice - this.barrierOption(optionType, barrierType.replace('in', 'out'), S, K, H, T, r, sigma, q, rebate).optionPrice;
    }

    return {
      optionPrice: Math.max(barrierPrice, rebate * Math.exp(-r * T)),
      vanillaPrice,
      barrier: H,
      rebate,
      barrierType,
      isActive: barrierType.toLowerCase().includes('knock-out') ? S > H : S <= H
    };
  }

  /**
   * Volatility Surface Modeling
   */

  buildVolatilitySurface(marketData) {
    // marketData: array of {strike, expiry, impliedVol, optionType, marketPrice}
    const surface = {};

    marketData.forEach(point => {
      const expiry = point.expiry;
      if (!surface[expiry]) {
        surface[expiry] = {};
      }
      surface[expiry][point.strike] = point.impliedVol;
    });

    // Calculate volatility smile metrics
    const smileMetrics = this.analyzeVolatilitySmile(marketData);

    return {
      surface,
      smileMetrics,
      interpolatedVol: (strike, expiry) => this.interpolateVolatility(surface, strike, expiry),
      skew: smileMetrics.skew,
      term_structure: this.calculateTermStructure(surface)
    };
  }

  analyzeVolatilitySmile(marketData) {
    const atmVol = marketData.find(point => Math.abs(point.moneyness - 1) < 0.05)?.impliedVol || 0.2;
    const skew25 = this.calculateSkewMetric(marketData, 0.25);
    const skew10 = this.calculateSkewMetric(marketData, 0.10);

    return {
      atmVol,
      skew25Delta: skew25,
      skew10Delta: skew10,
      smileSlope: this.calculateSmileSlope(marketData),
      convexity: this.calculateSmileConvexity(marketData)
    };
  }

  /**
   * Portfolio Greeks and Risk
   */

  calculatePortfolioGreeks(positions) {
    // positions: array of {optionType, quantity, S, K, T, r, sigma, q}
    const portfolioGreeks = {
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      totalValue: 0
    };

    const positionAnalytics = positions.map(position => {
      const greeks = this.calculateGreeks(
        position.optionType,
        position.S,
        position.K,
        position.T,
        position.r,
        position.sigma,
        position.q
      );

      const optionPrice = this.blackScholes(
        position.optionType,
        position.S,
        position.K,
        position.T,
        position.r,
        position.sigma,
        position.q
      ).optionPrice;

      const positionValue = optionPrice * position.quantity;

      // Aggregate portfolio Greeks
      portfolioGreeks.delta += greeks.delta * position.quantity;
      portfolioGreeks.gamma += greeks.gamma * position.quantity;
      portfolioGreeks.theta += greeks.theta * position.quantity;
      portfolioGreeks.vega += greeks.vega * position.quantity;
      portfolioGreeks.rho += greeks.rho * position.quantity;
      portfolioGreeks.totalValue += positionValue;

      return {
        ...position,
        ...greeks,
        optionPrice,
        positionValue
      };
    });

    return {
      positions: positionAnalytics,
      portfolioGreeks,
      riskMetrics: {
        deltaHedgeRatio: -portfolioGreeks.delta,
        gammaRisk: portfolioGreeks.gamma,
        timeDecay: portfolioGreeks.theta,
        volRisk: portfolioGreeks.vega,
        interestRateRisk: portfolioGreeks.rho
      }
    };
  }

  /**
   * Utility Functions
   */

  calculateD1(S, K, T, r, sigma, q) {
    return (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  }

  calculateD2(d1, sigma, T) {
    return d1 - sigma * Math.sqrt(T);
  }

  cumulativeNormalDistribution(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  normalDistribution(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  boxMullerRandom() {
    if (this.spare !== undefined) {
      const value = this.spare;
      this.spare = undefined;
      return value;
    }

    const u = Math.random();
    const v = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u));

    this.spare = mag * Math.cos(2 * Math.PI * v);
    return mag * Math.sin(2 * Math.PI * v);
  }

  interpolateVolatility(surface, strike, expiry) {
    // Simplified bilinear interpolation
    const expiries = Object.keys(surface).map(Number).sort((a, b) => a - b);

    if (expiries.length === 0) return 0.2; // Default volatility

    const closestExpiry = expiries.reduce((prev, curr) =>
      Math.abs(curr - expiry) < Math.abs(prev - expiry) ? curr : prev
    );

    const strikes = Object.keys(surface[closestExpiry]).map(Number).sort((a, b) => a - b);
    const closestStrike = strikes.reduce((prev, curr) =>
      Math.abs(curr - strike) < Math.abs(prev - strike) ? curr : prev
    );

    return surface[closestExpiry][closestStrike] || 0.2;
  }

  calculateSkewMetric(marketData, deltaLevel) {
    const putVol = marketData.find(point =>
      point.optionType.toLowerCase() === 'put' &&
      Math.abs(Math.abs(point.delta) - deltaLevel) < 0.05
    )?.impliedVol || 0.2;

    const callVol = marketData.find(point =>
      point.optionType.toLowerCase() === 'call' &&
      Math.abs(Math.abs(point.delta) - deltaLevel) < 0.05
    )?.impliedVol || 0.2;

    return callVol - putVol;
  }

  calculateSmileSlope(marketData) {
    const sortedByStrike = marketData.sort((a, b) => a.strike - b.strike);
    if (sortedByStrike.length < 2) return 0;

    const highStrike = sortedByStrike[sortedByStrike.length - 1];
    const lowStrike = sortedByStrike[0];

    return (highStrike.impliedVol - lowStrike.impliedVol) / (highStrike.strike - lowStrike.strike);
  }

  calculateSmileConvexity(marketData) {
    if (marketData.length < 3) return 0;

    const sortedByStrike = marketData.sort((a, b) => a.strike - b.strike);
    const mid = Math.floor(sortedByStrike.length / 2);

    const leftVol = sortedByStrike[0].impliedVol;
    const midVol = sortedByStrike[mid].impliedVol;
    const rightVol = sortedByStrike[sortedByStrike.length - 1].impliedVol;

    return leftVol + rightVol - 2 * midVol;
  }

  calculateTermStructure(surface) {
    const expiries = Object.keys(surface).map(Number).sort((a, b) => a - b);

    return expiries.map(expiry => {
      const strikes = Object.keys(surface[expiry]).map(Number);
      const vols = strikes.map(strike => surface[expiry][strike]);
      const avgVol = vols.reduce((sum, vol) => sum + vol, 0) / vols.length;

      return {
        expiry,
        averageVol: avgVol,
        volRange: Math.max(...vols) - Math.min(...vols)
      };
    });
  }
}

export default OptionsEngine;
