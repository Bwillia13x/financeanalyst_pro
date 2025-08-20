/**
 * Advanced Analytics Service - TypeScript Version
 * Shared services for curve building, pricing engines, and analytics calculations
 */

// Types and Interfaces
export interface MarketDataPoint {
  maturity: number;
  rate: number;
  discountFactor?: number;
}

export interface CurveInstrument {
  instrument: string;
  rate: number;
  maturity: number;
}

export interface BlackScholesParams {
  S: number;  // Spot price
  K: number;  // Strike price
  T: number;  // Time to expiration
  r: number;  // Risk-free rate
  sigma: number;  // Volatility
  optionType?: 'call' | 'put';
  q?: number;  // Dividend yield
}

export interface BlackScholesResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface BinomialParams {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  optionType?: 'call' | 'put';
  steps?: number;
}

export interface BondPricingParams {
  faceValue: number;
  couponRate: number;
  maturity: number;
  frequency: number;
  marketYield: number;
}

export interface BondPricingResult {
  price: number;
  macaulayDuration: number;
  modifiedDuration: number;
  convexity: number;
  dv01: number;
  pvCoupons: number;
  pvPrincipal: number;
}

export interface SwapParams {
  notional: number;
  maturity: number;
  fixedRate: number;
  floatingRate: number;
  frequency: number;
}

export interface SwapResult {
  swapValue: number;
  pvFixedLeg: number;
  pvFloatingLeg: number;
}

export interface ConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class CurveBuilder {
  /**
   * Build yield curve using bootstrapping method
   */
  static buildYieldCurve(marketData: {
    instruments: string[];
    rates: number[];
    maturities: number[];
  }): MarketDataPoint[] {
    const { instruments, rates, maturities } = marketData;
    
    // Sort by maturity
    const sortedData = instruments.map((instrument, index) => ({
      instrument,
      rate: rates[index],
      maturity: maturities[index]
    })).sort((a, b) => a.maturity - b.maturity);

    const curve: MarketDataPoint[] = [];
    
    sortedData.forEach((point, index) => {
      if (index === 0) {
        // First point - direct rate
        curve.push({
          maturity: point.maturity,
          rate: point.rate,
          discountFactor: Math.exp(-point.rate * point.maturity)
        });
      } else {
        // Bootstrap from previous points
        const rate = this.bootstrapRate(curve, point);
        curve.push({
          maturity: point.maturity,
          rate: rate,
          discountFactor: Math.exp(-rate * point.maturity)
        });
      }
    });

    return curve;
  }

  /**
   * Bootstrap rate from existing curve points
   */
  private static bootstrapRate(existingCurve: MarketDataPoint[], newPoint: CurveInstrument): number {
    // Simplified bootstrap - in practice would use iterative solver
    return newPoint.rate;
  }

  /**
   * Interpolate rate for given maturity
   */
  static interpolateRate(curve: MarketDataPoint[], maturity: number): number {
    if (maturity <= curve[0].maturity) {
      return curve[0].rate;
    }
    
    if (maturity >= curve[curve.length - 1].maturity) {
      return curve[curve.length - 1].rate;
    }

    // Linear interpolation
    for (let i = 0; i < curve.length - 1; i++) {
      if (maturity >= curve[i].maturity && maturity <= curve[i + 1].maturity) {
        const t = (maturity - curve[i].maturity) / (curve[i + 1].maturity - curve[i].maturity);
        return curve[i].rate + t * (curve[i + 1].rate - curve[i].rate);
      }
    }

    return curve[curve.length - 1].rate;
  }
}

export class PricingEngines {
  /**
   * Black-Scholes European Option Pricing
   */
  static blackScholes(params: BlackScholesParams): BlackScholesResult {
    const { S, K, T, r, sigma, optionType = 'call', q = 0 } = params;
    
    if (T <= 0) {
      const intrinsicValue = Math.max(optionType === 'call' ? S - K : K - S, 0);
      return {
        price: intrinsicValue,
        delta: optionType === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0
      };
    }

    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const N = this.normalCDF;
    const nPrime = this.normalPDF;
    
    let price: number, delta: number, rho: number;

    if (optionType === 'call') {
      price = S * Math.exp(-q * T) * N(d1) - K * Math.exp(-r * T) * N(d2);
      delta = Math.exp(-q * T) * N(d1);
      rho = K * T * Math.exp(-r * T) * N(d2) / 100;
    } else {
      price = K * Math.exp(-r * T) * N(-d2) - S * Math.exp(-q * T) * N(-d1);
      delta = -Math.exp(-q * T) * N(-d1);
      rho = -K * T * Math.exp(-r * T) * N(-d2) / 100;
    }

    const gamma = Math.exp(-q * T) * nPrime(d1) / (S * sigma * Math.sqrt(T));
    const theta = (-S * Math.exp(-q * T) * nPrime(d1) * sigma / (2 * Math.sqrt(T)) 
            - r * K * Math.exp(-r * T) * (optionType === 'call' ? N(d2) : N(-d2))
            + q * S * Math.exp(-q * T) * (optionType === 'call' ? N(d1) : N(-d1))) / 365;
    const vega = S * Math.exp(-q * T) * nPrime(d1) * Math.sqrt(T) / 100;

    return { price, delta, gamma, theta, vega, rho };
  }

  /**
   * Binomial Tree Option Pricing
   */
  static binomialTree(params: BinomialParams): { price: number } {
    const { S, K, T, r, sigma, optionType = 'call', steps = 100 } = params;
    
    const dt = T / steps;
    const u = Math.exp(sigma * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp(r * dt) - d) / (u - d);

    // Build tree
    const tree: number[][] = Array(steps + 1).fill(null).map(() => Array(steps + 1).fill(0));
    
    // Terminal payoffs
    for (let i = 0; i <= steps; i++) {
      const ST = S * Math.pow(u, 2 * i - steps);
      tree[steps][i] = optionType === 'call' 
        ? Math.max(ST - K, 0)
        : Math.max(K - ST, 0);
    }

    // Backward induction
    for (let j = steps - 1; j >= 0; j--) {
      for (let i = 0; i <= j; i++) {
        tree[j][i] = Math.exp(-r * dt) * (p * tree[j + 1][i + 1] + (1 - p) * tree[j + 1][i]);
      }
    }

    return { price: tree[0][0] };
  }

  /**
   * Bond Pricing with Yield
   */
  static bondPrice(params: BondPricingParams): BondPricingResult {
    const { faceValue, couponRate, maturity, frequency, marketYield } = params;
    
    const periodsPerYear = frequency;
    const totalPeriods = maturity * periodsPerYear;
    const couponPayment = (couponRate * faceValue) / periodsPerYear;
    const periodYield = marketYield / periodsPerYear;

    let pvCoupons = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      pvCoupons += couponPayment / Math.pow(1 + periodYield, i);
    }

    const pvPrincipal = faceValue / Math.pow(1 + periodYield, totalPeriods);
    const price = pvCoupons + pvPrincipal;

    // Duration calculation
    let durationSum = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      const cf = i === totalPeriods ? couponPayment + faceValue : couponPayment;
      const pv = cf / Math.pow(1 + periodYield, i);
      durationSum += (i / periodsPerYear) * pv;
    }
    const macaulayDuration = durationSum / price;
    const modifiedDuration = macaulayDuration / (1 + periodYield);

    // Convexity
    let convexitySum = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      const cf = i === totalPeriods ? couponPayment + faceValue : couponPayment;
      const pv = cf / Math.pow(1 + periodYield, i);
      const timePeriod = i / periodsPerYear;
      convexitySum += pv * timePeriod * (timePeriod + 1 / periodsPerYear);
    }
    const convexity = convexitySum / (price * Math.pow(1 + periodYield, 2));

    const dv01 = modifiedDuration * price * 0.0001;

    return {
      price,
      macaulayDuration,
      modifiedDuration,
      convexity,
      dv01,
      pvCoupons,
      pvPrincipal
    };
  }

  /**
   * Interest Rate Swap Valuation
   */
  static swapValuation(params: SwapParams): SwapResult {
    const { notional, maturity, fixedRate, floatingRate, frequency } = params;
    
    const periodsPerYear = frequency;
    const totalPeriods = maturity * periodsPerYear;
    const fixedPayment = (fixedRate * notional) / periodsPerYear;
    
    // Simplified: assume flat curve at floating rate
    const discountRate = floatingRate;
    
    let pvFixedLeg = 0;
    for (let i = 1; i <= totalPeriods; i++) {
      pvFixedLeg += fixedPayment / Math.pow(1 + discountRate / periodsPerYear, i);
    }
    
    // Floating leg PV (simplified)
    const pvFloatingLeg = notional - notional / Math.pow(1 + discountRate / periodsPerYear, totalPeriods);
    
    return {
      swapValue: pvFixedLeg - pvFloatingLeg,
      pvFixedLeg,
      pvFloatingLeg
    };
  }

  /**
   * Cumulative Standard Normal Distribution
   */
  private static normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Standard Normal Probability Density Function
   */
  private static normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  /**
   * Error function approximation
   */
  private static erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }
}

export class RiskMetrics {
  /**
   * Calculate Value at Risk using historical simulation
   */
  static calculateVaR(returns: number[], confidenceLevel: number = 0.95): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    return sortedReturns[index];
  }

  /**
   * Calculate Expected Shortfall (Conditional VaR)
   */
  static calculateES(returns: number[], confidenceLevel: number = 0.95): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, index + 1);
    return tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
  }

  /**
   * Calculate correlation matrix
   */
  static calculateCorrelationMatrix(dataMatrix: number[][]): number[][] {
    const n = dataMatrix.length;
    const correlationMatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1;
        } else {
          correlationMatrix[i][j] = this.calculateCorrelation(dataMatrix[i], dataMatrix[j]);
        }
      }
    }

    return correlationMatrix;
  }

  /**
   * Calculate correlation between two series
   */
  static calculateCorrelation(series1: number[], series2: number[]): number {
    const n = series1.length;
    const mean1 = series1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = series2.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = series1[i] - mean1;
      const diff2 = series2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    return numerator / Math.sqrt(denom1 * denom2);
  }
}

// Export default object for backward compatibility
const advancedAnalyticsService = {
  CurveBuilder,
  PricingEngines,
  RiskMetrics
};

export default advancedAnalyticsService;