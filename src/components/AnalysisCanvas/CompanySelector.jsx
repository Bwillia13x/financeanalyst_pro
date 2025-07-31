import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Building2 } from 'lucide-react';

const CompanySelector = ({ onCompanySelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock company data - in real implementation, this would come from an API
  const mockCompanies = [
    {
      id: 'AAPL',
      name: 'Apple Inc.',
      ticker: 'AAPL',
      sector: 'Technology',
      marketCap: 3000000000000,
      price: 175.84,
      change: 2.34,
      changePercent: 1.35,
      financials: {
        revenue: [274515000000, 294135000000, 365817000000, 383285000000, 394328000000],
        years: [2019, 2020, 2021, 2022, 2023]
      }
    },
    {
      id: 'MSFT',
      name: 'Microsoft Corporation',
      ticker: 'MSFT',
      sector: 'Technology',
      marketCap: 2800000000000,
      price: 378.85,
      change: -1.23,
      changePercent: -0.32,
      financials: {
        revenue: [125843000000, 143015000000, 168088000000, 198270000000, 211915000000],
        years: [2019, 2020, 2021, 2022, 2023]
      }
    },
    {
      id: 'GOOGL',
      name: 'Alphabet Inc.',
      ticker: 'GOOGL',
      sector: 'Technology',
      marketCap: 2100000000000,
      price: 142.56,
      change: 3.21,
      changePercent: 2.30,
      financials: {
        revenue: [161857000000, 182527000000, 257637000000, 282836000000, 307394000000],
        years: [2019, 2020, 2021, 2022, 2023]
      }
    },
    {
      id: 'JNJ',
      name: 'Johnson & Johnson',
      ticker: 'JNJ',
      sector: 'Healthcare',
      marketCap: 450000000000,
      price: 156.78,
      change: 0.89,
      changePercent: 0.57,
      financials: {
        revenue: [82059000000, 82584000000, 93775000000, 94943000000, 85159000000],
        years: [2019, 2020, 2021, 2022, 2023]
      }
    },
    {
      id: 'PFE',
      name: 'Pfizer Inc.',
      ticker: 'PFE',
      sector: 'Healthcare',
      marketCap: 320000000000,
      price: 28.95,
      change: -0.45,
      changePercent: -1.53,
      financials: {
        revenue: [51750000000, 41908000000, 81288000000, 100330000000, 58496000000],
        years: [2019, 2020, 2021, 2022, 2023]
      }
    }
  ];

  // Search functionality
  useEffect(() => {
    if (searchTerm.length > 0) {
      setIsSearching(true);
      
      // Simulate API delay
      const timer = setTimeout(() => {
        const filtered = mockCompanies.filter(company =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.ticker.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSuggestions(filtered);
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const formatCurrency = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(2)}`;
  };

  const handleCompanySelect = (company) => {
    onCompanySelect(company);
    setSearchTerm('');
    setSuggestions([]);
  };

  return (
    <div className="relative max-w-lg mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          placeholder="Search companies (e.g., Apple, AAPL)"
        />
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {(suggestions.length > 0 || isSearching) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {isSearching ? (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm">Searching...</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {suggestions.map((company) => (
                  <motion.button
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                    className="w-full p-4 text-left border-b border-gray-50 last:border-b-0 focus:outline-none focus:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {company.name}
                            </h3>
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {company.ticker}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {company.sector} • Market Cap: {formatCurrency(company.marketCap)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${company.price}
                        </div>
                        <div className={`text-xs flex items-center ${
                          company.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp 
                            className={`w-3 h-3 mr-1 ${
                              company.changePercent < 0 ? 'rotate-180' : ''
                            }`} 
                          />
                          {company.changePercent >= 0 ? '+' : ''}
                          {company.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular Companies */}
      {!searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Companies</h3>
          <div className="grid grid-cols-2 gap-3">
            {mockCompanies.slice(0, 4).map((company) => (
              <motion.button
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-all text-left"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {company.ticker}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {company.name}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CompanySelector;