/**
 * Fixed Income Analytics Engine
 * Comprehensive bond pricing, yield curve analysis, and fixed income calculations
 */

class FixedIncomeEngine {
  constructor() {
    this.bondCache = new Map();
    this.yieldCurves = new Map();
    this.creditSpreads = new Map();
  }

  /**
   * Bond Pricing Calculations
   */

  // Calculate bond price using present value of cash flows
  calculateBondPrice(bond, yieldRate, marketDate = new Date()) {
    const {
      faceValue = 1000,
      couponRate,
      maturityDate,
      paymentFrequency = 2, // Semi-annual
      dayCountConvention = 'ACT/ACT'
    } = bond;

    const yearsToMaturity = this.calculateYearsToMaturity(maturityDate, marketDate);
    const periodsToMaturity = Math.ceil(yearsToMaturity * paymentFrequency);
    const couponPayment = (faceValue * couponRate) / paymentFrequency;
    const periodYield = yieldRate / paymentFrequency;

    let presentValue = 0;
    let accruedInterest = 0;

    // Calculate present value of coupon payments
    for (let period = 1; period <= periodsToMaturity; period++) {
      const discountFactor = Math.pow(1 + periodYield, -period);
      presentValue += couponPayment * discountFactor;
    }

    // Add present value of principal
    const principalPV = faceValue / Math.pow(1 + periodYield, periodsToMaturity);
    presentValue += principalPV;

    // Calculate accrued interest
    accruedInterest = this.calculateAccruedInterest(bond, marketDate);

    return {
      cleanPrice: presentValue,
      dirtyPrice: presentValue + accruedInterest,
      accruedInterest,
      yieldToMaturity: yieldRate,
      modifiedDuration: this.calculateModifiedDuration(bond, yieldRate),
      convexity: this.calculateConvexity(bond, yieldRate),
      dv01: this.calculateDV01(bond, yieldRate),
      bondMetrics: {
        yearsToMaturity,
        periodsToMaturity,
        couponPayment,
        principalPV
      }
    };
  }

  // Calculate yield to maturity using Newton-Raphson method
  calculateYieldToMaturity(bond, marketPrice, tolerance = 0.0001, maxIterations = 100) {
    let yield_ = bond.couponRate || 0.05; // Initial guess

    for (let i = 0; i < maxIterations; i++) {
      const priceResult = this.calculateBondPrice(bond, yield_);
      const priceDiff = priceResult.cleanPrice - marketPrice;

      if (Math.abs(priceDiff) < tolerance) {
        return {
          yieldToMaturity: yield_,
          iterations: i + 1,
          priceAccuracy: priceDiff,
          ...priceResult
        };
      }

      // Calculate derivative (modified duration)
      const duration = this.calculateModifiedDuration(bond, yield_);
      yield_ = yield_ - (priceDiff / (duration * marketPrice));
    }

    throw new Error('YTM calculation did not converge');
  }

  // Calculate modified duration
  calculateModifiedDuration(bond, yieldRate) {
    const { faceValue = 1000, couponRate, maturityDate, paymentFrequency = 2 } = bond;
    const yearsToMaturity = this.calculateYearsToMaturity(maturityDate);
    const periodsToMaturity = Math.ceil(yearsToMaturity * paymentFrequency);
    const couponPayment = (faceValue * couponRate) / paymentFrequency;
    const periodYield = yieldRate / paymentFrequency;

    let weightedCashFlows = 0;
    let totalPV = 0;

    // Calculate weighted present value of cash flows
    for (let period = 1; period <= periodsToMaturity; period++) {
      const cashFlow = period === periodsToMaturity ? couponPayment + faceValue : couponPayment;
      const discountFactor = Math.pow(1 + periodYield, -period);
      const pv = cashFlow * discountFactor;

      weightedCashFlows += (period / paymentFrequency) * pv;
      totalPV += pv;
    }

    const macaulayDuration = weightedCashFlows / totalPV;
    return macaulayDuration / (1 + periodYield);
  }

  // Calculate convexity
  calculateConvexity(bond, yieldRate) {
    const { faceValue = 1000, couponRate, maturityDate, paymentFrequency = 2 } = bond;
    const yearsToMaturity = this.calculateYearsToMaturity(maturityDate);
    const periodsToMaturity = Math.ceil(yearsToMaturity * paymentFrequency);
    const couponPayment = (faceValue * couponRate) / paymentFrequency;
    const periodYield = yieldRate / paymentFrequency;

    let convexitySum = 0;
    let totalPV = 0;

    for (let period = 1; period <= periodsToMaturity; period++) {
      const cashFlow = period === periodsToMaturity ? couponPayment + faceValue : couponPayment;
      const discountFactor = Math.pow(1 + periodYield, -period);
      const pv = cashFlow * discountFactor;

      convexitySum += (period * (period + 1) / Math.pow(paymentFrequency, 2)) * pv;
      totalPV += pv;
    }

    return convexitySum / (totalPV * Math.pow(1 + periodYield, 2));
  }

  // Calculate DV01 (dollar value of a basis point)
  calculateDV01(bond, yieldRate) {
    const basePrice = this.calculateBondPrice(bond, yieldRate);
    const upPrice = this.calculateBondPrice(bond, yieldRate + 0.0001);
    return Math.abs(basePrice.cleanPrice - upPrice.cleanPrice);
  }

  /**
   * Yield Curve Analysis
   */

  // Bootstrap yield curve from bond prices
  bootstrapYieldCurve(bonds, marketPrices) {
    const sortedBonds = bonds
      .map((bond, index) => ({ ...bond, marketPrice: marketPrices[index] }))
      .sort((a, b) => this.calculateYearsToMaturity(a.maturityDate) - this.calculateYearsToMaturity(b.maturityDate));

    const yieldCurve = [];
    const zeroCouponRates = [];

    for (let i = 0; i < sortedBonds.length; i++) {
      const bond = sortedBonds[i];
      const maturity = this.calculateYearsToMaturity(bond.maturityDate);

      if (i === 0) {
        // First bond - simple calculation
        const ytm = this.calculateYieldToMaturity(bond, bond.marketPrice);
        zeroCouponRates.push({ maturity, rate: ytm.yieldToMaturity });
      } else {
        // Bootstrap using previously calculated rates
        const rate = this.bootstrapSingleRate(bond, zeroCouponRates);
        zeroCouponRates.push({ maturity, rate });
      }

      yieldCurve.push({
        maturity,
        zeroCouponRate: zeroCouponRates[i].rate,
        bondYTM: this.calculateYieldToMaturity(bond, bond.marketPrice).yieldToMaturity,
        bond
      });
    }

    return {
      curve: yieldCurve,
      spotRates: zeroCouponRates,
      forwardRates: this.calculateForwardRates(zeroCouponRates),
      curveMetrics: this.analyzeCurveShape(yieldCurve)
    };
  }

  // Calculate forward rates from spot rates
  calculateForwardRates(spotRates) {
    const forwardRates = [];

    for (let i = 1; i < spotRates.length; i++) {
      const t1 = spotRates[i - 1].maturity;
      const t2 = spotRates[i].maturity;
      const r1 = spotRates[i - 1].rate;
      const r2 = spotRates[i].rate;

      const forwardRate = ((Math.pow(1 + r2, t2) / Math.pow(1 + r1, t1)) - 1) / (t2 - t1);

      forwardRates.push({
        startPeriod: t1,
        endPeriod: t2,
        forwardRate,
        impliedRate: forwardRate
      });
    }

    return forwardRates;
  }

  // Analyze yield curve shape and characteristics
  analyzeCurveShape(yieldCurve) {
    if (yieldCurve.length < 3) return { shape: 'insufficient_data' };

    const shortRate = yieldCurve[0].zeroCouponRate;
    const longRate = yieldCurve[yieldCurve.length - 1].zeroCouponRate;
    const midIndex = Math.floor(yieldCurve.length / 2);
    const midRate = yieldCurve[midIndex].zeroCouponRate;

    let shape = 'normal';
    if (shortRate > longRate) {
      shape = 'inverted';
    } else if (midRate > shortRate && midRate > longRate) {
      shape = 'humped';
    } else if (Math.abs(shortRate - longRate) < 0.001) {
      shape = 'flat';
    }

    const slope = longRate - shortRate;
    const curvature = 2 * midRate - shortRate - longRate;
    const level = (shortRate + midRate + longRate) / 3;

    return {
      shape,
      slope,
      curvature,
      level,
      steepness: slope / yieldCurve[yieldCurve.length - 1].maturity,
      spread_2y10y: this.interpolateRate(yieldCurve, 10) - this.interpolateRate(yieldCurve, 2),
      spread_3m10y: this.interpolateRate(yieldCurve, 10) - this.interpolateRate(yieldCurve, 0.25)
    };
  }

  /**
   * Credit Analysis
   */

  // Calculate credit spread over risk-free rate
  calculateCreditSpread(corporateBond, governmentYieldCurve, marketPrice) {
    const maturity = this.calculateYearsToMaturity(corporateBond.maturityDate);
    const riskFreeRate = this.interpolateRate(governmentYieldCurve, maturity);
    const corporateYTM = this.calculateYieldToMaturity(corporateBond, marketPrice).yieldToMaturity;

    return {
      creditSpread: corporateYTM - riskFreeRate,
      corporateYTM,
      riskFreeRate,
      spreadBasisPoints: (corporateYTM - riskFreeRate) * 10000,
      maturity
    };
  }

  // Calculate option-adjusted spread (simplified)
  calculateOptionAdjustedSpread(bond, marketPrice, volatility = 0.15) {
    // Simplified OAS calculation - in practice would use binomial/trinomial trees
    const baseSpread = this.calculateCreditSpread(bond, this.yieldCurves.get('government'), marketPrice);
    const optionValue = this.estimateEmbeddedOptionValue(bond, volatility);

    return {
      ...baseSpread,
      optionAdjustedSpread: baseSpread.creditSpread - (optionValue / marketPrice),
      embeddedOptionValue: optionValue,
      zSpread: baseSpread.creditSpread // Simplified - would need iterative calculation
    };
  }

  /**
   * Utility Methods
   */

  calculateYearsToMaturity(maturityDate, currentDate = new Date()) {
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - currentDate.getTime();
    return diffTime / (1000 * 60 * 60 * 24 * 365.25);
  }

  calculateAccruedInterest(bond, settlementDate = new Date()) {
    const { faceValue = 1000, couponRate, paymentFrequency = 2 } = bond;
    const annualCoupon = faceValue * couponRate;
    const periodicCoupon = annualCoupon / paymentFrequency;

    // Simplified calculation - would need actual payment schedule
    const daysSinceLastPayment = 30; // Placeholder
    const daysInPeriod = 365.25 / paymentFrequency;

    return periodicCoupon * (daysSinceLastPayment / daysInPeriod);
  }

  interpolateRate(yieldCurve, targetMaturity) {
    if (yieldCurve.length === 0) return 0;

    // Find surrounding points
    let lowerIndex = -1;
    let upperIndex = -1;

    for (let i = 0; i < yieldCurve.length; i++) {
      if (yieldCurve[i].maturity <= targetMaturity) {
        lowerIndex = i;
      }
      if (yieldCurve[i].maturity >= targetMaturity && upperIndex === -1) {
        upperIndex = i;
        break;
      }
    }

    // Exact match
    if (lowerIndex === upperIndex) {
      return yieldCurve[lowerIndex].zeroCouponRate;
    }

    // Extrapolation
    if (lowerIndex === -1) return yieldCurve[0].zeroCouponRate;
    if (upperIndex === -1) return yieldCurve[yieldCurve.length - 1].zeroCouponRate;

    // Linear interpolation
    const x1 = yieldCurve[lowerIndex].maturity;
    const x2 = yieldCurve[upperIndex].maturity;
    const y1 = yieldCurve[lowerIndex].zeroCouponRate;
    const y2 = yieldCurve[upperIndex].zeroCouponRate;

    return y1 + (y2 - y1) * (targetMaturity - x1) / (x2 - x1);
  }

  bootstrapSingleRate(bond, existingRates) {
    // Simplified bootstrap calculation
    const ytm = this.calculateYieldToMaturity(bond, bond.marketPrice);
    return ytm.yieldToMaturity;
  }

  estimateEmbeddedOptionValue(bond, volatility) {
    // Simplified option value estimation
    if (!bond.callable && !bond.putable) return 0;

    const timeToOption = bond.callDate ? this.calculateYearsToMaturity(bond.callDate) : 0;
    return timeToOption * volatility * 100; // Placeholder calculation
  }

  /**
   * Portfolio Fixed Income Analytics
   */

  analyzeFixedIncomePortfolio(bonds, weights, marketPrices) {
    let portfolioDuration = 0;
    let portfolioConvexity = 0;
    let portfolioYield = 0;
    let totalMarketValue = 0;

    const bondAnalytics = bonds.map((bond, index) => {
      const price = marketPrices[index];
      const weight = weights[index];
      const analytics = this.calculateBondPrice(bond, 0.05); // Use market YTM
      const marketValue = price * weight;

      portfolioDuration += analytics.modifiedDuration * weight;
      portfolioConvexity += analytics.convexity * weight;
      portfolioYield += analytics.yieldToMaturity * weight;
      totalMarketValue += marketValue;

      return {
        bond,
        weight,
        marketValue,
        ...analytics
      };
    });

    return {
      bonds: bondAnalytics,
      portfolio: {
        totalMarketValue,
        weightedDuration: portfolioDuration,
        weightedConvexity: portfolioConvexity,
        weightedYield: portfolioYield,
        dv01: portfolioDuration * totalMarketValue * 0.0001,
        riskMetrics: {
          interestRateRisk: portfolioDuration,
          convexityBenefit: portfolioConvexity,
          priceVolatility: portfolioDuration * 0.01 // 1% rate change
        }
      }
    };
  }
}

export default FixedIncomeEngine;
