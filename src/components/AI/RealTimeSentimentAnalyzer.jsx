import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
  Activity
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import advancedAIService from '../../services/ai/advancedAIService';

const RealTimeSentimentAnalyzer = ({
  symbol,
  sources = ['news', 'social', 'earnings'],
  refreshInterval = 60000, // 1 minute
  onSentimentUpdate,
  className = ''
}) => {
  const [sentimentData, setSentimentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  // Initialize sentiment analysis
  useEffect(() => {
    if (symbol) {
      loadSentimentData();
    }
  }, [symbol, sources]);

  // Setup auto-refresh
  useEffect(() => {
    if (isAutoRefresh && symbol) {
      intervalRef.current = setInterval(() => {
        loadSentimentData();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isAutoRefresh, symbol, refreshInterval]);

  const loadSentimentData = async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        sources.map(async source => {
          const text = await fetchSourceData(source, symbol);
          if (text) {
            return await advancedAIService.analyzeSentiment(text, { includeEntities: true });
          }
          return null;
        })
      );

      const newSentimentData = {};
      sources.forEach((source, index) => {
        const result = results[index];
        if (result.status === 'fulfilled' && result.value) {
          newSentimentData[source] = result.value;
        } else {
          newSentimentData[source] = { error: 'Failed to load' };
        }
      });

      setSentimentData(newSentimentData);
      setLastUpdate(new Date());
      onSentimentUpdate?.(newSentimentData);
    } catch (err) {
      setError('Failed to analyze sentiment');
      console.error('Sentiment analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock function to fetch data from different sources
  const fetchSourceData = async (source, symbol) => {
    // In a real implementation, this would fetch from actual APIs
    try {
      switch (source) {
        case 'news':
          return `Latest news about ${symbol}: Company reports strong quarterly earnings, beating analyst expectations by 15%. Market analysts remain bullish on the stock despite recent volatility in the tech sector.`;
        case 'social':
          return `Social media buzz for ${symbol}: High engagement on earnings call, investors excited about new product launches. Some concerns about supply chain but overall positive sentiment dominates trending discussions.`;
        case 'earnings':
          return `Earnings call transcript for ${symbol}: CEO highlighted strong revenue growth and improved margins. Guidance for next quarter exceeds market expectations. Investors focused on long-term growth strategy.`;
        default:
          return null;
      }
    } catch (error) {
      console.warn(`Failed to fetch ${source} data for ${symbol}:`, error);
      return null;
    }
  };

  const handleRefresh = () => {
    loadSentimentData();
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  // Calculate overall sentiment
  const overallSentiment = React.useMemo(() => {
    const validData = Object.values(sentimentData).filter(
      data => data && !data.error && data.sentiment
    );

    if (validData.length === 0) return null;

    const avgScore = validData.reduce((sum, data) => sum + data.score, 0) / validData.length;
    const avgConfidence =
      validData.reduce((sum, data) => sum + data.confidence, 0) / validData.length;

    // Determine dominant sentiment
    const sentiments = validData.map(data => data.sentiment);
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;

    let dominantSentiment = 'neutral';
    if (positiveCount > negativeCount) dominantSentiment = 'positive';
    else if (negativeCount > positiveCount) dominantSentiment = 'negative';

    return {
      sentiment: dominantSentiment,
      score: avgScore,
      confidence: avgConfidence,
      sources: validData.length
    };
  }, [sentimentData]);

  const getSentimentColor = sentiment => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400 bg-green-500/20';
      case 'negative':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSentimentIcon = sentiment => {
    switch (sentiment) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Activity;
    }
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Sentiment Analysis</h3>
            <p className="text-xs text-slate-400">{symbol || 'Select a symbol'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoRefresh}
            className={`p-2 rounded-lg transition-colors ${
              isAutoRefresh
                ? 'text-green-400 bg-green-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            aria-label={isAutoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            {isAutoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh sentiment data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overall Sentiment */}
      {overallSentiment && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Overall Sentiment</h4>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(overallSentiment.sentiment)}`}
            >
              {overallSentiment.sentiment.toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {React.createElement(getSentimentIcon(overallSentiment.sentiment), {
                  className: 'w-5 h-5 text-current'
                })}
                <span className="text-lg font-bold text-current">
                  {(overallSentiment.score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    overallSentiment.sentiment === 'positive'
                      ? 'bg-green-500'
                      : overallSentiment.sentiment === 'negative'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                  }`}
                  style={{ width: `${overallSentiment.score * 100}%` }}
                />
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Confidence</div>
              <div className="text-sm font-medium text-white">
                {(overallSentiment.confidence * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400">{overallSentiment.sources} sources</div>
            </div>
          </div>
        </div>
      )}

      {/* Source Analysis */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Source Analysis</h4>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {sources.map(source => {
            const data = sentimentData[source];

            if (!data) {
              return (
                <div
                  key={source}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300 capitalize">{source}</span>
                  </div>
                  <div className="text-xs text-slate-500">Loading...</div>
                </div>
              );
            }

            if (data.error) {
              return (
                <div
                  key={source}
                  className="flex items-center justify-between p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-300 capitalize">{source}</span>
                  </div>
                  <div className="text-xs text-red-400">Error</div>
                </div>
              );
            }

            const Icon = getSentimentIcon(data.sentiment);

            return (
              <div
                key={source}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${getSentimentColor(data.sentiment).split(' ')[0]}`} />
                  <div>
                    <div className="text-sm font-medium text-white capitalize">{source}</div>
                    <div className="text-xs text-slate-400">
                      {(data.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${getSentimentColor(data.sentiment).split(' ')[0]}`}
                  >
                    {(data.score * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-400 capitalize">{data.sentiment}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="mt-4 pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              {isAutoRefresh && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Auto-refresh on
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-slate-700 rounded-lg p-4">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-white">Analyzing sentiment...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeSentimentAnalyzer;
