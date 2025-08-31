// Advanced AI Service for predictive analytics and automated insights
class AdvancedAIService {
  constructor() {
    this.models = {};
    this.isInitialized = false;
    this.cache = new Map();
    this.apiEndpoint = import.meta.env.VITE_AI_API_ENDPOINT || '/api/ai';
  }

  // Initialize AI models and services
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('[AI] Initializing advanced AI service');

      // Load AI models configuration
      await this.loadModels();

      // Setup real-time learning
      this.setupRealTimeLearning();

      // Initialize predictive analytics
      await this.initializePredictiveAnalytics();

      this.isInitialized = true;
      console.log('[AI] Advanced AI service initialized successfully');
    } catch (error) {
      console.error('[AI] Failed to initialize advanced AI service:', error);
      throw error;
    }
  }

  // Load AI models configuration
  async loadModels() {
    try {
      const response = await fetch(`${this.apiEndpoint}/models`);
      const modelsConfig = await response.json();

      this.models = {
        predictive: modelsConfig.predictive || {},
        sentiment: modelsConfig.sentiment || {},
        anomaly: modelsConfig.anomaly || {},
        forecasting: modelsConfig.forecasting || {},
        recommendation: modelsConfig.recommendation || {}
      };
    } catch (error) {
      console.warn('[AI] Using default model configurations:', error);
      // Fallback to default configurations
      this.models = {
        predictive: { enabled: true, confidence: 0.8 },
        sentiment: { enabled: true, threshold: 0.6 },
        anomaly: { enabled: true, sensitivity: 0.7 },
        forecasting: { enabled: true, horizon: 12 },
        recommendation: { enabled: true, maxSuggestions: 5 }
      };
    }
  }

  // Advanced predictive analytics
  async predictFinancialMetrics(data, options = {}) {
    const {
      horizon = 12,
      confidence = 0.8,
      includeUncertainty = true,
      marketConditions = {}
    } = options;

    try {
      const cacheKey = `predict_${JSON.stringify({ data: data.slice(-10), options })}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const payload = {
        data: data.slice(-50), // Use last 50 data points for prediction
        horizon,
        confidence,
        includeUncertainty,
        marketConditions,
        model: this.models.predictive
      };

      const response = await fetch(`${this.apiEndpoint}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Prediction failed: ${response.status}`);

      const result = await response.json();

      // Cache result for 5 minutes
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('[AI] Prediction failed:', error);
      return this.generateFallbackPrediction(data, horizon);
    }
  }

  // Generate fallback prediction when AI service is unavailable
  generateFallbackPrediction(data, horizon) {
    const lastValue = data[data.length - 1];
    const trend = this.calculateTrend(data);
    const volatility = this.calculateVolatility(data);

    const predictions = [];
    for (let i = 1; i <= horizon; i++) {
      const baseValue = lastValue * Math.pow(1 + trend, i);
      const uncertainty = volatility * Math.sqrt(i);
      predictions.push({
        period: i,
        value: baseValue,
        confidence: Math.max(0.3, 1 - uncertainty / Math.abs(baseValue)),
        upperBound: baseValue * (1 + uncertainty),
        lowerBound: baseValue * (1 - uncertainty)
      });
    }

    return {
      predictions,
      confidence: 0.6,
      method: 'fallback',
      warning: 'Using statistical fallback due to AI service unavailability'
    };
  }

  // Calculate trend from historical data
  calculateTrend(data) {
    if (data.length < 2) return 0;

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return slope / intercept; // Return growth rate
  }

  // Calculate volatility from historical data
  calculateVolatility(data) {
    if (data.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i] - data[i - 1]) / data[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }

  // Sentiment analysis for news and social media
  async analyzeSentiment(text, options = {}) {
    const { includeEntities = true, includeTopics = true } = options;

    try {
      const payload = {
        text,
        includeEntities,
        includeTopics,
        model: this.models.sentiment
      };

      const response = await fetch(`${this.apiEndpoint}/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Sentiment analysis failed: ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[AI] Sentiment analysis failed:', error);
      return this.generateFallbackSentiment(text);
    }
  }

  // Fallback sentiment analysis
  generateFallbackSentiment(text) {
    // Simple rule-based sentiment analysis
    const positiveWords = [
      'bullish',
      'growth',
      'profit',
      'success',
      'strong',
      'positive',
      'up',
      'rise',
      'increase',
      'gain'
    ];
    const negativeWords = [
      'bearish',
      'decline',
      'loss',
      'weak',
      'negative',
      'down',
      'fall',
      'decrease',
      'drop',
      'risk'
    ];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    let sentiment = 'neutral';
    let score = 0;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(
        1,
        (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1)
      );
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = Math.min(
        1,
        (negativeCount - positiveCount) / Math.max(positiveCount + negativeCount, 1)
      );
    }

    return {
      sentiment,
      score,
      confidence: 0.5,
      method: 'fallback',
      entities: [],
      topics: []
    };
  }

  // Anomaly detection in financial data
  async detectAnomalies(data, options = {}) {
    const { sensitivity = 0.7, context = {} } = options;

    try {
      const payload = {
        data,
        sensitivity,
        context,
        model: this.models.anomaly
      };

      const response = await fetch(`${this.apiEndpoint}/anomalies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Anomaly detection failed: ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[AI] Anomaly detection failed:', error);
      return this.generateFallbackAnomalies(data, sensitivity);
    }
  }

  // Fallback anomaly detection using statistical methods
  generateFallbackAnomalies(data, sensitivity) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length
    );

    const threshold = sensitivity * 2; // 2-sigma rule
    const anomalies = [];

    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          index,
          value,
          zScore,
          severity: zScore > threshold * 1.5 ? 'high' : 'medium',
          type: value > mean ? 'spike' : 'dip'
        });
      }
    });

    return {
      anomalies,
      totalPoints: data.length,
      anomalyRate: anomalies.length / data.length,
      method: 'fallback'
    };
  }

  // Generate automated insights and recommendations
  async generateInsights(data, context = {}) {
    try {
      const payload = {
        data,
        context,
        models: this.models
      };

      const response = await fetch(`${this.apiEndpoint}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Insights generation failed: ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[AI] Insights generation failed:', error);
      return this.generateFallbackInsights(data, context);
    }
  }

  // Fallback insights generation
  generateFallbackInsights(data, context) {
    const insights = [];
    const latestValue = data[data.length - 1];
    const previousValue = data[data.length - 2];
    const change = ((latestValue - previousValue) / previousValue) * 100;

    // Trend insight
    if (Math.abs(change) > 5) {
      insights.push({
        type: change > 0 ? 'positive_trend' : 'negative_trend',
        title: change > 0 ? 'Upward Trend Detected' : 'Downward Trend Detected',
        description: `Value has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}%`,
        confidence: Math.min(0.9, Math.abs(change) / 20),
        action: change > 0 ? 'Consider taking profits' : 'Monitor closely'
      });
    }

    // Volatility insight
    const volatility = this.calculateVolatility(data);
    if (volatility > 0.1) {
      insights.push({
        type: 'high_volatility',
        title: 'High Volatility Detected',
        description: `Recent volatility is ${volatility.toFixed(1)}%, indicating market uncertainty`,
        confidence: 0.8,
        action: 'Consider risk management strategies'
      });
    }

    return {
      insights,
      summary: `Generated ${insights.length} insights based on recent data patterns`,
      method: 'fallback'
    };
  }

  // Real-time learning and model improvement
  setupRealTimeLearning() {
    // Listen for user feedback to improve models
    window.addEventListener('ai-feedback', event => {
      const { type, data, feedback } = event.detail;
      this.submitFeedback(type, data, feedback);
    });

    // Periodic model retraining
    setInterval(
      () => {
        this.checkForModelUpdates();
      },
      24 * 60 * 60 * 1000
    ); // Check daily
  }

  // Submit user feedback for model improvement
  async submitFeedback(type, data, feedback) {
    try {
      await fetch(`${this.apiEndpoint}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, feedback, timestamp: Date.now() })
      });
    } catch (error) {
      console.warn('[AI] Failed to submit feedback:', error);
    }
  }

  // Check for model updates
  async checkForModelUpdates() {
    try {
      const response = await fetch(`${this.apiEndpoint}/models/updates`);
      const updates = await response.json();

      if (updates.available) {
        console.log('[AI] Model updates available, reloading...');
        await this.loadModels();
      }
    } catch (error) {
      console.warn('[AI] Failed to check for model updates:', error);
    }
  }

  // Initialize predictive analytics with historical data
  async initializePredictiveAnalytics() {
    // Pre-load common predictive models
    console.log('[AI] Initializing predictive analytics models');

    // This would typically load model weights or configurations
    // For now, we'll just mark it as ready
    return Promise.resolve();
  }

  // Get service health status
  async getHealthStatus() {
    try {
      const response = await fetch(`${this.apiEndpoint}/health`);
      return await response.json();
    } catch (error) {
      return {
        status: 'offline',
        lastCheck: Date.now(),
        error: error.message
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('[AI] Cache cleared');
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
const advancedAIService = new AdvancedAIService();

// Export for use in components
export default advancedAIService;

// Export class for testing
export { AdvancedAIService };
