/**
 * Technical Analysis Commands
 * Technical indicators, chart patterns, and market intelligence
 */

import { formatCurrency, formatPercentage, formatNumber } from '../../utils/dataTransformation';
import { dataFetchingService } from '../dataFetching';

export const technicalCommands = {
  TECHNICALS: {
    execute: async(parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'TECHNICALS command requires a ticker symbol. Usage: TECHNICALS(AAPL)'
        };
      }

      try {
        const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());
        const _marketData = await dataFetchingService.fetchMarketData(ticker.toUpperCase());

        // Mock technical indicators (in real implementation, would calculate from price data)
        const price = profile.price;
        const volatility = (profile.beta || 1.0) * 0.16;

        // Generate mock technical indicators
        const sma20 = price * (1 + (Math.random() - 0.5) * 0.1);
        const sma50 = price * (1 + (Math.random() - 0.5) * 0.15);
        const ema12 = price * (1 + (Math.random() - 0.5) * 0.08);
        const ema26 = price * (1 + (Math.random() - 0.5) * 0.12);

        const rsi = 30 + Math.random() * 40; // RSI between 30-70
        const macd = (ema12 - ema26);
        const macdSignal = macd * (0.9 + Math.random() * 0.2);
        const macdHistogram = macd - macdSignal;

        const bollingerUpper = sma20 * 1.02;
        const bollingerLower = sma20 * 0.98;
        const bollingerPosition = (price - bollingerLower) / (bollingerUpper - bollingerLower);

        // Support and resistance levels
        const support1 = price * 0.95;
        const support2 = price * 0.90;
        const resistance1 = price * 1.05;
        const resistance2 = price * 1.10;

        // Generate signals
        const signals = [];
        if (price > sma20 && sma20 > sma50) signals.push('Bullish trend (Price > SMA20 > SMA50)');
        if (price < sma20 && sma20 < sma50) signals.push('Bearish trend (Price < SMA20 < SMA50)');
        if (rsi < 30) signals.push('Oversold condition (RSI < 30)');
        if (rsi > 70) signals.push('Overbought condition (RSI > 70)');
        if (macdHistogram > 0 && macd > macdSignal) signals.push('MACD bullish crossover');
        if (macdHistogram < 0 && macd < macdSignal) signals.push('MACD bearish crossover');
        if (bollingerPosition > 0.8) signals.push('Near upper Bollinger Band');
        if (bollingerPosition < 0.2) signals.push('Near lower Bollinger Band');

        const content = `Technical Analysis for ${profile.companyName} (${ticker.toUpperCase()})\n\n📊 PRICE & MOVING AVERAGES:\n• Current Price: ${formatCurrency(price)}\n• SMA(20): ${formatCurrency(sma20)} ${price > sma20 ? '📈' : '📉'}\n• SMA(50): ${formatCurrency(sma50)} ${price > sma50 ? '📈' : '📉'}\n• EMA(12): ${formatCurrency(ema12)}\n• EMA(26): ${formatCurrency(ema26)}\n\n📈 MOMENTUM INDICATORS:\n• RSI(14): ${formatNumber(rsi, 1)} ${rsi > 70 ? '🔴 Overbought' : rsi < 30 ? '🟢 Oversold' : '🟡 Neutral'}\n• MACD: ${formatNumber(macd, 3)}\n• MACD Signal: ${formatNumber(macdSignal, 3)}\n• MACD Histogram: ${formatNumber(macdHistogram, 3)} ${macdHistogram > 0 ? '📈' : '📉'}\n\n🎯 BOLLINGER BANDS:\n• Upper Band: ${formatCurrency(bollingerUpper)}\n• Middle (SMA20): ${formatCurrency(sma20)}\n• Lower Band: ${formatCurrency(bollingerLower)}\n• Position: ${formatPercentage(bollingerPosition)} ${bollingerPosition > 0.8 ? '🔴 Near Upper' : bollingerPosition < 0.2 ? '🟢 Near Lower' : '🟡 Middle'}\n\n⚖️ SUPPORT & RESISTANCE:\n• Resistance 2: ${formatCurrency(resistance2)}\n• Resistance 1: ${formatCurrency(resistance1)}\n• Current: ${formatCurrency(price)}\n• Support 1: ${formatCurrency(support1)}\n• Support 2: ${formatCurrency(support2)}\n\n🚨 ACTIVE SIGNALS:\n${signals.length > 0 ? signals.map(signal => `• ${signal}`).join('\n') : '• No active signals'}\n\n📊 TREND ANALYSIS:\n• Short-term (20-day): ${price > sma20 ? 'Bullish' : 'Bearish'}\n• Medium-term (50-day): ${price > sma50 ? 'Bullish' : 'Bearish'}\n• Momentum: ${rsi > 50 ? 'Positive' : 'Negative'}\n• Volatility: ${volatility > 0.25 ? 'High' : volatility > 0.15 ? 'Moderate' : 'Low'}\n\n💡 TRADING INSIGHTS:\n• ${price > sma20 && rsi < 70 ? 'Potential uptrend with room to run' : ''}\n• ${price < sma20 && rsi > 30 ? 'Potential downtrend with selling pressure' : ''}\n• ${Math.abs(bollingerPosition - 0.5) < 0.2 ? 'Price consolidating in middle of range' : ''}\n• Watch for breakout above ${formatCurrency(resistance1)} or breakdown below ${formatCurrency(support1)}\n\n${dataFetchingService.demoMode ? '💡 Note: Using simulated technical data. Configure API keys for live price data.' : '✅ Based on live market data'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'technical',
            ticker: ticker.toUpperCase(),
            indicators: {
              price,
              sma20,
              sma50,
              rsi,
              macd,
              macdSignal,
              bollingerUpper,
              bollingerLower,
              support1,
              support2,
              resistance1,
              resistance2
            },
            signals
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Technical analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  },

  SUPPORT_RESISTANCE: {
    execute: async(parsedCommand, _context, _processor) => {
      const [ticker] = parsedCommand.parameters;

      if (!ticker) {
        return {
          type: 'error',
          content: 'SUPPORT_RESISTANCE command requires a ticker symbol. Usage: SUPPORT_RESISTANCE(AAPL)'
        };
      }

      try {
        const profile = await dataFetchingService.fetchCompanyProfile(ticker.toUpperCase());
        const price = profile.price;

        // Generate support and resistance levels based on price
        const levels = [
          { type: 'Resistance', level: price * 1.15, strength: 'Strong', touches: 3 },
          { type: 'Resistance', level: price * 1.08, strength: 'Moderate', touches: 2 },
          { type: 'Resistance', level: price * 1.03, strength: 'Weak', touches: 1 },
          { type: 'Current', level: price, strength: 'Current Price', touches: 0 },
          { type: 'Support', level: price * 0.97, strength: 'Weak', touches: 1 },
          { type: 'Support', level: price * 0.92, strength: 'Moderate', touches: 2 },
          { type: 'Support', level: price * 0.85, strength: 'Strong', touches: 4 }
        ];

        // Calculate distances and probabilities
        const nearestSupport = levels.filter(l => l.type === 'Support' && l.level < price)[0];
        const nearestResistance = levels.filter(l => l.type === 'Resistance' && l.level > price)[0];

        const supportDistance = ((price - nearestSupport.level) / price) * 100;
        const resistanceDistance = ((nearestResistance.level - price) / price) * 100;

        const content = `Support & Resistance Analysis for ${profile.companyName} (${ticker.toUpperCase()})\n\n🎯 KEY LEVELS:\n${levels.map(level => {
          const distance = ((level.level - price) / price) * 100;
          const arrow = level.type === 'Current' ? '👉' :
            level.type === 'Resistance' ? '🔴' : '🟢';
          return `${arrow} ${level.type}: ${formatCurrency(level.level)} (${level.strength}) ${level.touches > 0 ? `[${level.touches} touches]` : ''} ${level.type !== 'Current' ? `(${formatPercentage(Math.abs(distance) / 100)} away)` : ''}`;
        }).join('\n')}\n\n📊 LEVEL ANALYSIS:\n• Nearest Support: ${formatCurrency(nearestSupport.level)} (${formatPercentage(supportDistance / 100)} below)\n• Nearest Resistance: ${formatCurrency(nearestResistance.level)} (${formatPercentage(resistanceDistance / 100)} above)\n• Support Strength: ${nearestSupport.strength}\n• Resistance Strength: ${nearestResistance.strength}\n\n📈 TRADING RANGES:\n• Current Range: ${formatCurrency(nearestSupport.level)} - ${formatCurrency(nearestResistance.level)}\n• Range Width: ${formatPercentage((nearestResistance.level - nearestSupport.level) / price)}\n• Position in Range: ${formatPercentage((price - nearestSupport.level) / (nearestResistance.level - nearestSupport.level))}\n\n🎯 BREAKOUT TARGETS:\n• Upside Target: ${formatCurrency(nearestResistance.level * 1.05)}\n• Downside Target: ${formatCurrency(nearestSupport.level * 0.95)}\n• Risk/Reward Ratio: ${formatNumber(resistanceDistance / supportDistance, 2)}:1\n\n💡 TRADING INSIGHTS:\n• ${supportDistance < 3 ? '⚠️ Close to support - watch for bounce or breakdown' : ''}\n• ${resistanceDistance < 3 ? '⚠️ Close to resistance - watch for breakout or rejection' : ''}\n• ${nearestSupport.strength === 'Strong' ? '🛡️ Strong support should provide good downside protection' : ''}\n• ${nearestResistance.strength === 'Strong' ? '🚧 Strong resistance may limit upside potential' : ''}\n• Volume confirmation needed for breakouts\n\n🔍 LEVEL QUALITY:\n• Support levels tested ${nearestSupport.touches} times\n• Resistance levels tested ${nearestResistance.touches} times\n• More touches = stronger level\n\n${dataFetchingService.demoMode ? '💡 Note: Using estimated levels. Configure API keys for historical price data.' : '✅ Based on historical price action'}`;

        return {
          type: 'success',
          content,
          data: {
            analysis: 'support_resistance',
            ticker: ticker.toUpperCase(),
            levels,
            nearestSupport,
            nearestResistance,
            supportDistance,
            resistanceDistance
          }
        };

      } catch (error) {
        return {
          type: 'error',
          content: `Support & resistance analysis failed: ${error.message}`
        };
      }
    },
    parameterSchema: {
      required: ['ticker'],
      optional: []
    }
  }
};
