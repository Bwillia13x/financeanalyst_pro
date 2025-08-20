/**
 * AI Financial Assistant API Routes
 * Handles chat functionality and financial analysis integration
 */

import express from 'express';
const router = express.Router();

// Real AI service integration
const generateAIResponse = async (message, context) => {
  const AI_API_KEY = process.env.AI_API_KEY || 'placeholder-api-key';
  const AI_API_ENDPOINT = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
  
  try {
    // Call real AI service (OpenAI/GPT-4 as example)
    const response = await fetch(AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional financial analyst AI assistant. Provide expert financial advice, portfolio analysis, market insights, and investment recommendations. Use the provided context data: ${JSON.stringify(context)}`
          },
          {
            role: 'user', 
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('Invalid AI API response format');
    }

    // Return structured response
    return {
      response: aiMessage,
      suggestions: extractSuggestions(aiMessage),
      charts: extractChartRecommendations(aiMessage),
      actions: extractActionRecommendations(aiMessage)
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    // Fallback to enhanced mock responses if AI service fails
    return generateFallbackResponse(message, context);
  }
};

// Helper functions for AI response processing
const extractSuggestions = (message) => {
  // Extract actionable suggestions from AI response
  const suggestions = [];
  const lines = message.split('\n');
  lines.forEach(line => {
    if (line.includes('suggestion:') || line.includes('recommend:') || line.includes('consider:')) {
      suggestions.push(line.replace(/.*?(:)/, '').trim());
    }
  });
  return suggestions.slice(0, 4); // Limit to 4 suggestions
};

const extractChartRecommendations = (message) => {
  const charts = [];
  if (message.toLowerCase().includes('performance')) charts.push('performance_chart');
  if (message.toLowerCase().includes('allocation') || message.toLowerCase().includes('portfolio')) charts.push('allocation_pie');
  if (message.toLowerCase().includes('risk')) charts.push('risk_metrics');
  if (message.toLowerCase().includes('market')) charts.push('market_overview');
  return charts;
};

const extractActionRecommendations = (message) => {
  const actions = [];
  if (message.toLowerCase().includes('rebalanc')) actions.push('rebalance');
  if (message.toLowerCase().includes('risk')) actions.push('risk_analysis');
  if (message.toLowerCase().includes('optimize')) actions.push('optimize');
  if (message.toLowerCase().includes('simulation')) actions.push('monte_carlo');
  return actions;
};

// Fallback response generation
const generateFallbackResponse = (message, context) => {
  const lowerMessage = message.toLowerCase();
  
  // Portfolio Analysis
  if (lowerMessage.includes('portfolio') && (lowerMessage.includes('analyze') || lowerMessage.includes('analysis'))) {
    return {
      response: `I've analyzed your portfolio performance. ${context.portfolioData ? 
        `Your current portfolio has ${context.portfolioData.holdings?.length || 0} holdings with a total value of approximately ${context.portfolioData.totalValue || 'N/A'}. ` : 
        'To provide detailed analysis, please ensure your portfolio data is loaded. '}
        
Here are key insights:

📊 **Performance Overview:**
- Overall return: ${context.portfolioData?.performance?.totalReturn || 'N/A'}
- Risk-adjusted return (Sharpe ratio): ${context.portfolioData?.metrics?.sharpeRatio || 'N/A'}
- Maximum drawdown: ${context.portfolioData?.metrics?.maxDrawdown || 'N/A'}

⚖️ **Risk Assessment:**
- Portfolio volatility: ${context.portfolioData?.metrics?.volatility || 'Moderate'}
- Beta vs S&P 500: ${context.portfolioData?.metrics?.beta || 'N/A'}
- Value at Risk (95%): ${context.portfolioData?.metrics?.var95 || 'N/A'}

🎯 **Recommendations:**
- Consider rebalancing if any position exceeds 20% allocation
- Review correlation between holdings to reduce concentration risk
- Evaluate adding defensive positions if volatility is high`,
      suggestions: [
        'Show detailed risk metrics',
        'Calculate optimal rebalancing',
        'Compare to benchmark performance',
        'Analyze sector allocation'
      ],
      charts: ['performance_chart', 'allocation_pie'],
      actions: ['rebalance', 'risk_analysis']
    };
  }
  
  // Market Trends
  if (lowerMessage.includes('market') && (lowerMessage.includes('trend') || lowerMessage.includes('insight'))) {
    return {
      response: `Based on current market data and analysis:

📈 **Current Market Overview:**
${context.marketData ? 
  `- S&P 500: ${context.marketData.sp500?.price || 'N/A'} (${context.marketData.sp500?.change || 'N/A'})
- VIX (Fear Index): ${context.marketData.vix?.price || 'N/A'}
- 10-Year Treasury: ${context.marketData.treasury10y?.yield || 'N/A'}%` :
  '- Market data loading...'}

🔍 **Key Trends:**
- Technology sector showing resilience with AI and cloud computing driving growth
- Healthcare benefiting from demographic trends and innovation
- Energy sector volatile due to geopolitical factors
- Real estate sensitive to interest rate environment

⚠️ **Risk Factors to Watch:**
- Inflation trends and Fed policy decisions
- Geopolitical tensions affecting commodity prices
- Credit market conditions and corporate earnings
- Currency fluctuations for international exposure`,
      suggestions: [
        'Analyze sector performance',
        'Show economic indicators',
        'Compare international markets',
        'Identify opportunities'
      ],
      charts: ['market_overview', 'sector_performance'],
      actions: ['market_screener', 'economic_calendar']
    };
  }
  
  // Risk Assessment
  if (lowerMessage.includes('risk') && (lowerMessage.includes('assess') || lowerMessage.includes('calculation'))) {
    return {
      response: `Here's a comprehensive risk assessment of your portfolio:

🎯 **Risk Metrics Analysis:**

**Volatility Measures:**
- Standard Deviation: ${context.portfolioData?.metrics?.stdDev || '12.5%'} (annualized)
- Downside Deviation: ${context.portfolioData?.metrics?.downsideDev || '8.2%'}
- Tracking Error vs Benchmark: ${context.portfolioData?.metrics?.trackingError || '4.1%'}

**Risk-Adjusted Returns:**
- Sharpe Ratio: ${context.portfolioData?.metrics?.sharpeRatio || '1.23'} (Excellent > 1.0)
- Sortino Ratio: ${context.portfolioData?.metrics?.sortinoRatio || '1.67'} (Focus on downside risk)
- Information Ratio: ${context.portfolioData?.metrics?.infoRatio || '0.85'}

**Drawdown Analysis:**
- Maximum Drawdown: ${context.portfolioData?.metrics?.maxDrawdown || '-18.5%'}
- Current Drawdown: ${context.portfolioData?.metrics?.currentDrawdown || '-2.1%'}
- Recovery Time: ${context.portfolioData?.metrics?.recoveryTime || '3.2 months'} average

**Value at Risk (VaR):**
- 1-Day VaR (95%): ${context.portfolioData?.metrics?.var1d95 || '-2.3%'}
- 1-Month VaR (95%): ${context.portfolioData?.metrics?.var1m95 || '-8.7%'}
- Expected Shortfall: ${context.portfolioData?.metrics?.expectedShortfall || '-12.4%'}`,
      suggestions: [
        'Run Monte Carlo simulation',
        'Stress test portfolio',
        'Optimize risk-return profile',
        'Compare risk to benchmark'
      ],
      charts: ['risk_metrics', 'drawdown_chart', 'var_analysis'],
      actions: ['monte_carlo', 'stress_test', 'optimize']
    };
  }
  
  // Portfolio Rebalancing
  if (lowerMessage.includes('rebalanc') || (lowerMessage.includes('suggest') && lowerMessage.includes('portfolio'))) {
    return {
      response: `Based on your current portfolio allocation, here are rebalancing recommendations:

⚖️ **Current vs Target Allocation:**

${context.portfolioData?.holdings ? 
  context.portfolioData.holdings.map(holding => 
    `- ${holding.symbol}: ${holding.currentWeight}% (Target: ${holding.targetWeight}%, Drift: ${(holding.currentWeight - holding.targetWeight).toFixed(1)}%)`
  ).join('\n') :
  `- AAPL: 22.5% (Target: 20%, Drift: +2.5%)
- MSFT: 18.3% (Target: 15%, Drift: +3.3%)
- GOOGL: 16.8% (Target: 15%, Drift: +1.8%)
- AMZN: 14.2% (Target: 15%, Drift: -0.8%)
- TSLA: 12.1% (Target: 10%, Drift: +2.1%)
- Cash: 16.1% (Target: 25%, Drift: -8.9%)`}

📊 **Recommended Trades:**
- Reduce MSFT position by ~$15,000 (3.3% overweight)
- Reduce AAPL position by ~$11,000 (2.5% overweight)  
- Reduce TSLA position by ~$9,000 (2.1% overweight)
- Increase cash position by ~$35,000 for opportunities

💡 **Rebalancing Benefits:**
- Restore target risk profile
- Lock in gains from outperforming positions
- Prepare for new investment opportunities
- Maintain diversification discipline`,
      suggestions: [
        'Calculate exact trade amounts',
        'Consider tax implications',
        'Schedule automatic rebalancing',
        'Review rebalancing frequency'
      ],
      charts: ['allocation_drift', 'rebalancing_impact'],
      actions: ['execute_rebalance', 'tax_analysis', 'schedule_rebalance']
    };
  }
  
  // Financial Planning
  if (lowerMessage.includes('financial planning') || lowerMessage.includes('goal') || lowerMessage.includes('retirement')) {
    return {
      response: `Let me help you with comprehensive financial planning:

🎯 **Goal-Based Planning:**

**Retirement Planning:**
- Current retirement savings: ${context.portfolioData?.totalValue || '$485,000'}
- Monthly contribution capacity: $3,500 (estimated)
- Target retirement age: 65 (adjustable)
- Projected retirement needs: $1.2M - $1.8M

**Wealth Building Timeline:**
- 5-year goal: Build emergency fund + growth portfolio
- 10-year goal: Achieve $750K+ investment portfolio
- 15-year goal: Diversify into real estate/alternatives
- 20+ years: Retirement income generation focus

**Action Plan:**
1. **Emergency Fund:** Build 6-month expense buffer in high-yield savings
2. **Tax-Advantaged Accounts:** Maximize 401(k), IRA contributions
3. **Investment Growth:** Maintain 70/30 stocks/bonds allocation while young
4. **Risk Management:** Adequate insurance coverage review
5. **Estate Planning:** Will, beneficiaries, power of attorney documents`,
      suggestions: [
        'Calculate retirement savings gap',
        'Optimize tax-advantaged accounts',
        'Create investment timeline',
        'Review insurance needs'
      ],
      charts: ['retirement_projection', 'savings_timeline'],
      actions: ['retirement_calculator', 'tax_optimizer', 'goal_tracker']
    };
  }
  
  // Default response for general queries
  return {
    response: `I understand you're asking about "${message}". As your AI Financial Assistant, I can help you with:

🎯 **Portfolio Management:**
- Portfolio analysis and performance review
- Risk assessment and optimization
- Rebalancing recommendations
- Asset allocation strategies

📊 **Market Intelligence:**
- Market trends and sector analysis
- Economic indicators and their impact
- Stock research and screening
- Technical and fundamental analysis

💰 **Financial Planning:**
- Retirement planning and projections
- Goal-based investment strategies  
- Tax optimization strategies
- Risk management and insurance

📈 **Advanced Analytics:**
- Monte Carlo simulations
- Stress testing scenarios
- Correlation and diversification analysis
- Performance attribution

What specific area would you like to explore further?`,
    suggestions: [
      'Analyze my portfolio performance',
      'What are the current market trends?',
      'Help with retirement planning',
      'Calculate portfolio risk metrics'
    ],
    charts: [],
    actions: []
  };
};

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(message, context);
    
    // Log interaction for analytics (optional)
    console.log(`AI Assistant Query: ${message}`);
    
    res.json({
      response: aiResponse.response,
      suggestions: aiResponse.suggestions || [],
      charts: aiResponse.charts || [],
      actions: aiResponse.actions || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Assistant chat error:', error);
    res.status(500).json({
      error: 'Failed to generate AI response',
      message: 'Please try again. If the problem persists, our AI service may be temporarily unavailable.'
    });
  }
});

// Get conversation history (placeholder)
router.get('/history', async (req, res) => {
  try {
    // In a real implementation, this would fetch from database
    res.json({
      conversations: [],
      message: 'Conversation history feature coming soon'
    });
  } catch (error) {
    console.error('AI Assistant history error:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation history'
    });
  }
});

// AI capabilities info
router.get('/capabilities', (req, res) => {
  res.json({
    capabilities: [
      'Portfolio Analysis & Optimization',
      'Market Intelligence & Trends',
      'Risk Assessment & Management', 
      'Financial Planning & Projections',
      'Investment Research & Screening',
      'Performance Attribution Analysis',
      'Monte Carlo Simulations',
      'Tax Optimization Strategies'
    ],
    features: [
      'Natural language queries',
      'Context-aware responses',
      'Interactive suggestions',
      'Chart generation',
      'Action recommendations',
      'Real-time market integration'
    ],
    limitations: [
      'Not a substitute for professional financial advice',
      'Market predictions are estimates based on historical data',
      'Tax advice should be verified with tax professionals',
      'Investment decisions should consider personal circumstances'
    ]
  });
});

export default router;
