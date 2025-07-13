import React from 'react';
import Icon from '../../../components/AppIcon';

const MarketDataWidget = ({ widget, onResize, onRemove }) => {
  const getChangeColor = (change) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return 'TrendingUp';
    if (change < 0) return 'TrendingDown';
    return 'Minus';
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return value.toLocaleString('en-US', { minimumFractionDigits: 2 });
      default:
        return value;
    }
  };

  const getFreshnessColor = (timestamp) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffSeconds = (now - updateTime) / 1000;
    
    if (diffSeconds < 5) return 'bg-success';
    if (diffSeconds < 30) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-elevation-1 hover:shadow-elevation-2 transition-smooth">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-foreground">{widget.symbol}</h3>
          <span className="text-sm text-muted-foreground">{widget.name}</span>
          <div 
            className={`w-2 h-2 rounded-full ${getFreshnessColor(widget.lastUpdate)}`}
            title={`Last updated: ${new Date(widget.lastUpdate).toLocaleTimeString()}`}
          />
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onResize(widget.id)}
            className="p-1 text-muted-foreground hover:text-foreground transition-smooth"
            title="Resize widget"
          >
            <Icon name="Maximize2" size={14} />
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="p-1 text-muted-foreground hover:text-error transition-smooth"
            title="Remove widget"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-foreground">
          {formatValue(widget.currentValue, widget.valueType)}
        </div>
        <div className={`flex items-center space-x-1 text-sm ${getChangeColor(widget.change)}`}>
          <Icon name={getChangeIcon(widget.change)} size={14} />
          <span>{formatValue(Math.abs(widget.change), widget.valueType)}</span>
          <span>({widget.changePercent > 0 ? '+' : ''}{widget.changePercent.toFixed(2)}%)</span>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="mb-3">
        <div className="h-16 bg-muted rounded flex items-end space-x-1 p-2">
          {widget.sparklineData.map((point, index) => (
            <div
              key={index}
              className={`flex-1 rounded-sm ${
                point > widget.sparklineData[0] ? 'bg-success' : 'bg-error'
              }`}
              style={{
                height: `${(point / Math.max(...widget.sparklineData)) * 100}%`,
                minHeight: '2px'
              }}
            />
          ))}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">High:</span>
          <span className="ml-1 font-medium text-foreground">
            {formatValue(widget.dayHigh, widget.valueType)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Low:</span>
          <span className="ml-1 font-medium text-foreground">
            {formatValue(widget.dayLow, widget.valueType)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Volume:</span>
          <span className="ml-1 font-medium text-foreground">
            {widget.volume ? widget.volume.toLocaleString() : 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Source:</span>
          <span className="ml-1 font-medium text-foreground">{widget.source}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketDataWidget;