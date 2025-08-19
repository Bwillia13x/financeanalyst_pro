import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
  , useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Target,
  Plus,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  RefreshCw,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

import secureApiClient from '../../services/secureApiClient';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters';

const PortfolioBuilder = ({ portfolio, onPortfolioUpdate, marketData }) => {
  const [builderMode, setBuilderMode] = useState('allocation'); // allocation, optimization, rebalancing
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [targetAllocation, setTargetAllocation] = useState({});
  const [optimizationSettings, setOptimizationSettings] = useState({
    objective: 'max_sharpe', // max_sharpe, min_risk, max_return
    constraints: {
      maxWeight: 50,
      minWeight: 0,
      maxSectorWeight: 30
    }
  });
  const [rebalanceSettings, setRebalanceSettings] = useState({
    threshold: 5, // 5% deviation threshold
    cashBuffer: 2000,
    minimumTrade: 100
  });
  const [isDirty, setIsDirty] = useState(false);

  // Initialize target allocation from current holdings
  React.useEffect(() => {
    if (portfolio && !Object.keys(targetAllocation).length) {
      const currentAllocation = {};
      portfolio.holdings.forEach(holding => {
        currentAllocation[holding.symbol] = holding.allocation || 0;
      });
      setTargetAllocation(currentAllocation);
    }
  }, [portfolio, targetAllocation]);

  // Search for stocks to add to portfolio
  const searchStocks = useCallback(async(query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Mock search results - in real implementation, this would search a stock database
      const mockResults = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 3000000000000 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', marketCap: 2800000000000 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', marketCap: 1700000000000 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', marketCap: 1500000000000 },
        { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', marketCap: 800000000000 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', marketCap: 1200000000000 },
        { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', marketCap: 900000000000 },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', marketCap: 500000000000 },
        { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 450000000000 },
        { symbol: 'V', name: 'Visa Inc.', sector: 'Technology', marketCap: 500000000000 }
      ];

      const filtered = mockResults.filter(stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => searchStocks(searchTerm), 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchStocks]);

  // Calculate allocation totals and validation
  const allocationAnalysis = useMemo(() => {
    const holdings = portfolio?.holdings || [];
    const totalTarget = Object.values(targetAllocation).reduce((sum, val) => sum + (val || 0), 0);
    const cashAllocation = Math.max(0, 100 - totalTarget);

    const deviations = holdings.map(holding => {
      const currentAllocation = holding.allocation || 0;
      const targetVal = targetAllocation[holding.symbol] || 0;
      const deviation = Math.abs(currentAllocation - targetVal);
      return { symbol: holding.symbol, current: currentAllocation, target: targetVal, deviation };
    });

    const maxDeviation = Math.max(...deviations.map(d => d.deviation), 0);
    const avgDeviation = deviations.reduce((sum, d) => sum + d.deviation, 0) / Math.max(deviations.length, 1);

    return {
      totalTarget,
      cashAllocation,
      deviations,
      maxDeviation,
      avgDeviation,
      isValid: totalTarget <= 100,
      needsRebalancing: maxDeviation > rebalanceSettings.threshold
    };
  }, [portfolio, targetAllocation, rebalanceSettings.threshold]);

  // Add stock to portfolio
  const addStock = useCallback(async(stock) => {
    try {
      const quote = await secureApiClient.getQuote(stock.symbol);
      const newHolding = {
        symbol: stock.symbol,
        name: stock.name,
        shares: 0,
        currentPrice: quote.currentPrice || 100,
        allocation: 0,
        value: 0,
        costBasis: quote.currentPrice || 100
      };

      const updatedPortfolio = {
        ...portfolio,
        holdings: [...portfolio.holdings, newHolding]
      };

      onPortfolioUpdate(updatedPortfolio);
      setTargetAllocation(prev => ({ ...prev, [stock.symbol]: 0 }));
      setIsDirty(true);
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  }, [portfolio, onPortfolioUpdate]);

  // Remove stock from portfolio
  const removeStock = useCallback((symbol) => {
    const updatedPortfolio = {
      ...portfolio,
      holdings: portfolio.holdings.filter(h => h.symbol !== symbol)
    };

    onPortfolioUpdate(updatedPortfolio);
    setTargetAllocation(prev => {
      const updated = { ...prev };
      delete updated[symbol];
      return updated;
    });
    setIsDirty(true);
  }, [portfolio, onPortfolioUpdate]);

  // Update target allocation
  const updateTargetAllocation = useCallback((symbol, value) => {
    setTargetAllocation(prev => ({ ...prev, [symbol]: Math.max(0, Math.min(100, value)) }));
    setIsDirty(true);
  }, []);

  // Generate rebalancing trades
  const generateRebalancingTrades = useCallback(() => {
    if (!portfolio || !allocationAnalysis.needsRebalancing) return [];

    const trades = [];
    const totalValue = portfolio.totalValue || 100000;

    allocationAnalysis.deviations.forEach(({ symbol, current, target, deviation }) => {
      if (deviation > rebalanceSettings.threshold) {
        const holding = portfolio.holdings.find(h => h.symbol === symbol);
        if (!holding) return;

        const targetValue = (target / 100) * totalValue;
        const currentValue = holding.value;
        const tradeDollarAmount = targetValue - currentValue;
        const tradeShares = Math.round(tradeDollarAmount / holding.currentPrice);

        if (Math.abs(tradeDollarAmount) >= rebalanceSettings.minimumTrade) {
          trades.push({
            symbol,
            action: tradeDollarAmount > 0 ? 'BUY' : 'SELL',
            shares: Math.abs(tradeShares),
            dollarAmount: Math.abs(tradeDollarAmount),
            currentPrice: holding.currentPrice,
            reason: `Rebalance from ${current.toFixed(1)}% to ${target.toFixed(1)}%`
          });
        }
      }
    });

    return trades;
  }, [portfolio, allocationAnalysis, rebalanceSettings]);

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = portfolio.holdings.findIndex(h => h.symbol === active.id);
      const newIndex = portfolio.holdings.findIndex(h => h.symbol === over.id);

      const updatedPortfolio = {
        ...portfolio,
        holdings: arrayMove(portfolio.holdings, oldIndex, newIndex)
      };

      onPortfolioUpdate(updatedPortfolio);
      setIsDirty(true);
    }
  };

  if (!portfolio) {
    return <div className="text-center py-8">No portfolio selected</div>;
  }

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { value: 'allocation', label: 'Allocation', icon: PieChart },
            { value: 'optimization', label: 'Optimization', icon: Target },
            { value: 'rebalancing', label: 'Rebalancing', icon: BarChart3 }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setBuilderMode(value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                builderMode === value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          {isDirty && (
            <span className="flex items-center space-x-1 text-sm text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Unsaved changes</span>
            </span>
          )}
          <button
            onClick={() => setIsDirty(false)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Portfolio Holdings */}
        <div className="lg:col-span-2 space-y-6">
          {builderMode === 'allocation' && (
            <AllocationBuilder
              portfolio={portfolio}
              targetAllocation={targetAllocation}
              onUpdateAllocation={updateTargetAllocation}
              onRemoveStock={removeStock}
              allocationAnalysis={allocationAnalysis}
              handleDragEnd={handleDragEnd}
              sensors={sensors}
            />
          )}

          {builderMode === 'optimization' && (
            <OptimizationBuilder
              portfolio={portfolio}
              optimizationSettings={optimizationSettings}
              onSettingsChange={setOptimizationSettings}
            />
          )}

          {builderMode === 'rebalancing' && (
            <RebalancingBuilder
              portfolio={portfolio}
              rebalanceSettings={rebalanceSettings}
              onSettingsChange={setRebalanceSettings}
              allocationAnalysis={allocationAnalysis}
              generateTrades={generateRebalancingTrades}
            />
          )}
        </div>

        {/* Right Panel - Tools & Search */}
        <div className="space-y-6">
          {/* Stock Search & Add */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Securities</h3>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search stocks by symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSearching && (
                <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{stock.symbol}</div>
                      <div className="text-sm text-gray-500">{stock.name}</div>
                      <div className="text-xs text-gray-400">{stock.sector}</div>
                    </div>
                    <button
                      onClick={() => addStock(stock)}
                      disabled={portfolio.holdings.some(h => h.symbol === stock.symbol)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Allocation Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocation Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Allocated:</span>
                <span className={`font-medium ${allocationAnalysis.isValid ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatPercentage(allocationAnalysis.totalTarget)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash:</span>
                <span className="font-medium text-gray-900">
                  {formatPercentage(allocationAnalysis.cashAllocation)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Deviation:</span>
                <span className={`font-medium ${allocationAnalysis.maxDeviation > rebalanceSettings.threshold ? 'text-red-600' : 'text-green-600'}`}>
                  {formatPercentage(allocationAnalysis.maxDeviation)}
                </span>
              </div>

              {!allocationAnalysis.isValid && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">Total allocation exceeds 100%</span>
                </div>
              )}

              {allocationAnalysis.needsRebalancing && (
                <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">Portfolio needs rebalancing</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Allocation Builder Component
const AllocationBuilder = ({
  portfolio,
  targetAllocation,
  onUpdateAllocation,
  onRemoveStock,
  allocationAnalysis,
  handleDragEnd,
  sensors
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Target Allocation</h3>
        <p className="text-sm text-gray-500">Drag to reorder • Set target percentages for each holding</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={portfolio.holdings.map(h => h.symbol)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-6 space-y-4">
            {portfolio.holdings.map((holding) => (
              <SortableHoldingRow
                key={holding.symbol}
                holding={holding}
                targetAllocation={targetAllocation[holding.symbol] || 0}
                onUpdateAllocation={onUpdateAllocation}
                onRemove={onRemoveStock}
                deviation={allocationAnalysis.deviations.find(d => d.symbol === holding.symbol)?.deviation || 0}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

// Sortable Holding Row Component
const SortableHoldingRow = ({ holding, targetAllocation, onUpdateAllocation, onRemove, deviation }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: holding.symbol });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1"
      >
        <div className="w-2 h-8 bg-gray-300 rounded-full" />
      </div>

      <div className="flex-1">
        <div className="font-medium text-gray-900">{holding.symbol}</div>
        <div className="text-sm text-gray-500">{holding.name}</div>
      </div>

      <div className="text-right">
        <div className="text-sm text-gray-600">Current: {formatPercentage(holding.allocation || 0)}</div>
        {deviation > 0 && (
          <div className={`text-xs ${deviation > 5 ? 'text-red-600' : 'text-orange-600'}`}>
            Deviation: {formatPercentage(deviation)}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={targetAllocation}
          onChange={(e) => onUpdateAllocation(holding.symbol, parseFloat(e.target.value) || 0)}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          max="100"
          step="0.1"
        />
        <span className="text-sm text-gray-500">%</span>
      </div>

      <button
        onClick={() => onRemove(holding.symbol)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// Optimization Builder Component (placeholder)
const OptimizationBuilder = ({ portfolio, optimizationSettings, onSettingsChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Portfolio Optimization</h3>
        <p className="text-gray-600 mb-4">Advanced optimization algorithms coming soon</p>
        <div className="text-sm text-gray-500">
          Features: Mean-variance optimization, risk parity, factor-based optimization
        </div>
      </div>
    </div>
  );
};

// Rebalancing Builder Component
const RebalancingBuilder = ({
  portfolio,
  rebalanceSettings,
  onSettingsChange,
  allocationAnalysis,
  generateTrades
}) => {
  const trades = generateTrades();

  return (
    <div className="space-y-6">
      {/* Rebalancing Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rebalancing Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deviation Threshold
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={rebalanceSettings.threshold}
                onChange={(e) => onSettingsChange(prev => ({
                  ...prev,
                  threshold: parseFloat(e.target.value) || 0
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.1"
                max="20"
                step="0.1"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cash Buffer
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                value={rebalanceSettings.cashBuffer}
                onChange={(e) => onSettingsChange(prev => ({
                  ...prev,
                  cashBuffer: parseFloat(e.target.value) || 0
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Trade
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                value={rebalanceSettings.minimumTrade}
                onChange={(e) => onSettingsChange(prev => ({
                  ...prev,
                  minimumTrade: parseFloat(e.target.value) || 0
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rebalancing Trades */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Suggested Trades</h3>
            {trades.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {trades.length} trades
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">Portfolio is within rebalancing thresholds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trades.map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${trade.action === 'BUY' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {trade.action === 'BUY' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {trade.action} {formatNumber(trade.shares)} shares of {trade.symbol}
                      </div>
                      <div className="text-sm text-gray-500">{trade.reason}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(trade.dollarAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      @ {formatCurrency(trade.currentPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioBuilder;
