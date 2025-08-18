/**
 * AI Financial Assistant Component
 * Conversational AI assistant for financial analysis and portfolio management
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  PieChart,
  BarChart3,
  Calculator,
  Search,
  BookOpen,
  Zap,
  Brain,
  Target,
  Settings,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import secureApiClient from '../../services/secureApiClient';

const AIFinancialAssistant = ({
  isOpen = false,
  onToggle,
  currentContext = {},
  portfolioData = null,
  marketData = null
}) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI Financial Assistant. I can help you with portfolio analysis, market insights, risk assessment, and financial planning. What would you like to explore today?",
      timestamp: new Date(),
      suggestions: [
        'Analyze my portfolio performance',
        'What are the current market trends?',
        'Calculate portfolio risk metrics',
        'Suggest portfolio rebalancing'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async(message = inputValue) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to AI assistant backend
      const response = await secureApiClient.post('/ai-assistant/chat', {
        message,
        context: {
          ...currentContext,
          portfolioData,
          marketData,
          previousMessages: messages.slice(-5) // Send last 5 messages for context
        }
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        suggestions: response.data.suggestions || [],
        charts: response.data.charts || [],
        actions: response.data.actions || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Assistant error:', error);

      // Fallback response
      const fallbackMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble processing your request right now. This could be due to high demand or a temporary service issue. Please try again in a moment, or let me help you with basic portfolio analysis using the available data.",
        timestamp: new Date(),
        suggestions: [
          'Show portfolio overview',
          'Calculate basic metrics',
          'View market data',
          'Help with analysis'
        ]
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: PieChart, label: 'Portfolio Analysis', action: 'Analyze my current portfolio allocation and performance' },
    { icon: TrendingUp, label: 'Market Insights', action: 'What are the current market trends and opportunities?' },
    { icon: AlertTriangle, label: 'Risk Assessment', action: 'Assess the risk profile of my portfolio' },
    { icon: Calculator, label: 'Financial Planning', action: 'Help me with financial planning and projections' },
    { icon: Target, label: 'Goal Planning', action: 'Help me set and track financial goals' },
    { icon: BarChart3, label: 'Performance Review', action: 'Review my portfolio performance over time' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          height: isMinimized ? 'auto' : '80vh'
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Financial Assistant</h2>
              <p className="text-blue-100 text-sm">Powered by advanced financial AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-3xl flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                      <div
                        className={`p-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        {message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white ml-3'
                            : 'bg-gray-100 text-gray-800 mr-3'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium opacity-75">Suggestions:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs px-3 py-1 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Charts placeholder */}
                        {message.charts && message.charts.length > 0 && (
                          <div className="mt-3 p-3 bg-white bg-opacity-10 rounded-lg">
                            <p className="text-sm font-medium mb-2">📊 Charts & Analysis</p>
                            <div className="text-sm opacity-75">
                              Interactive charts would be rendered here based on the analysis
                            </div>
                          </div>
                        )}

                        <div className="text-xs opacity-50 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-gray-100">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(action.action)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-left"
                    >
                      <action.icon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your portfolio, market analysis, or financial planning..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">AI Assistant is minimized</p>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIFinancialAssistant;
