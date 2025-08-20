import React, { useState } from 'react';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const WatchlistPanel = ({ watchlist, onRemoveFromWatchlist, onSelectSymbol }) => {
  const [sortBy, setSortBy] = useState('symbol');
  const [sortOrder, setSortOrder] = useState('asc');

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = field => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getChangeColor = change => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return value;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-1">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Watchlist</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{watchlist.length} symbols</span>
            <Button
              variant="ghost"
              size="sm"
              iconName="MoreVertical"
              aria-label="Watchlist options"
            />
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-muted-foreground">Sort by:</span>
          {['symbol', 'name', 'price', 'change'].map(field => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`
                flex items-center space-x-1 px-2 py-1 rounded transition-smooth
                ${
            sortBy === field
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
            }
              `}
            >
              <span className="capitalize">{field}</span>
              {sortBy === field && (
                <Icon name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={12} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="max-h-96 overflow-y-auto">
        {sortedWatchlist.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="Star" size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No symbols in watchlist</p>
            <p className="text-sm text-muted-foreground mt-1">
              Search and add symbols to track them here
            </p>
          </div>
        ) : (
          sortedWatchlist.map(item => (
            <div
              key={item.symbol}
              className="flex items-center justify-between p-3 border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer transition-smooth"
              onClick={() => onSelectSymbol(item)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSymbol(item);
                }
              }}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-foreground">{item.symbol}</span>
                  <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                    {item.exchange}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground truncate">{item.name}</div>
              </div>

              <div className="text-right mr-3">
                <div className="font-semibold text-foreground">
                  {formatValue(item.price || 150.25, 'currency')}
                </div>
                <div className={`text-sm ${getChangeColor(item.change || 2.15)}`}>
                  {item.change > 0 ? '+' : ''}
                  {formatValue(Math.abs(item.change || 2.15), 'currency')}(
                  {item.changePercent > 0 ? '+' : ''}
                  {(item.changePercent || 1.45).toFixed(2)}%)
                </div>
              </div>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onRemoveFromWatchlist(item.symbol);
                }}
                className="p-1 text-muted-foreground hover:text-error transition-smooth"
                title="Remove from watchlist"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      {watchlist.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" iconName="Download">
              Export
            </Button>
            <Button variant="ghost" size="sm" iconName="Bell">
              Set Alerts
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistPanel;
