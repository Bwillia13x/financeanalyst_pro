import React, { useState, useRef, useEffect } from 'react';

import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const SymbolSearch = ({ onSymbolSelect, watchlist, onAddToWatchlist }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);

  // Mock symbol data
  const symbolDatabase = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      exchange: 'NASDAQ',
      sector: 'Consumer Discretionary'
    },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Discretionary' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial Services' }
  ];

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = symbolDatabase
        .filter(
          item =>
            item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 8);
      setSuggestions(filtered);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [searchTerm]);

  const handleKeyDown = e => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSymbolSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSymbolSelect = symbol => {
    onSymbolSelect(symbol);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const isInWatchlist = symbol => {
    return watchlist.some(item => item.symbol === symbol);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search symbols (e.g., AAPL, Apple)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
        />
        <Icon
          name="Search"
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        />
      </div>

      {/* Search Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-elevation-2 z-50 max-h-64 overflow-y-auto">
          {suggestions.map((item, index) => (
            <div
              key={item.symbol}
              className={`
                flex items-center justify-between p-3 cursor-pointer transition-smooth
                ${index === selectedIndex ? 'bg-muted' : 'hover:bg-muted'}
              `}
              onClick={() => handleSymbolSelect(item)}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-foreground">{item.symbol}</span>
                  <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                    {item.exchange}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.sector}</div>
              </div>
              <div className="flex items-center space-x-2">
                {!isInWatchlist(item.symbol) && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onAddToWatchlist(item);
                    }}
                    className="p-1 text-muted-foreground hover:text-primary transition-smooth"
                    title="Add to watchlist"
                  >
                    <Icon name="Star" size={16} />
                  </button>
                )}
                <Icon name="Plus" size={16} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && searchTerm.length > 0 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-elevation-2 z-50 p-4 text-center">
          <div className="text-muted-foreground">
            <Icon name="Search" size={24} className="mx-auto mb-2" />
            <p>No symbols found for "{searchTerm}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolSearch;
