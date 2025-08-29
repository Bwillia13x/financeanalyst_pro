import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Building2 } from 'lucide-react';
import secureApiClient from '../../services/secureApiClient';

const GlobalTickerSearch = ({ onSelect, className = '', placeholder = 'Search stocks...' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTickers = async () => {
      if (!query.trim() || query.length < 1) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Search for ticker symbols using the quote endpoint
        const searchTerms = query.toUpperCase().split(' ').filter(term => term.length > 0);
        const searchPromises = searchTerms.slice(0, 5).map(async (term) => {
          try {
            const response = await secureApiClient.get(`/market-data/quote/${term}`);
            if (response.data.success && response.data.quote) {
              return {
                symbol: response.data.quote.symbol,
                name: response.data.quote.shortName || response.data.quote.longName || term,
                price: response.data.quote.regularMarketPrice,
                change: response.data.quote.regularMarketChange,
                changePercent: response.data.quote.regularMarketChangePercent,
                marketCap: response.data.quote.marketCap,
                sector: response.data.quote.sector
              };
            }
          } catch (err) {
            // Ignore individual ticker errors
            return null;
          }
        });

        const searchResults = await Promise.all(searchPromises);
        const validResults = searchResults.filter(result => result !== null);
        
        setResults(validResults);
        setShowResults(validResults.length > 0);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search temporarily unavailable');
        setResults([]);
        setShowResults(false);
      }

      setLoading(false);
    };

    const debounceTimer = setTimeout(searchTickers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (ticker) => {
    setQuery('');
    setShowResults(false);
    onSelect && onSelect(ticker);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError(null);
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap || typeof marketCap !== 'number') return '';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
        />
        {(query || loading) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            ) : (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
        >
          {error ? (
            <div className="px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {loading ? 'Searching...' : 'No results found'}
            </div>
          ) : (
            results.map((ticker) => (
              <button
                key={ticker.symbol}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
                onClick={() => handleSelect(ticker)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {ticker.symbol}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {ticker.name}
                        </div>
                        {ticker.sector && (
                          <div className="text-xs text-gray-400">
                            {ticker.sector}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(ticker.price)}
                    </div>
                    {ticker.change !== undefined && ticker.changePercent !== undefined && (
                      <div className={`text-xs flex items-center ${
                        ticker.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${ticker.change < 0 ? 'rotate-180' : ''}`} />
                        {ticker.change >= 0 ? '+' : ''}{ticker.change?.toFixed(2)} ({ticker.changePercent?.toFixed(2)}%)
                      </div>
                    )}
                    {ticker.marketCap && (
                      <div className="text-xs text-gray-400">
                        {formatMarketCap(ticker.marketCap)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalTickerSearch;
