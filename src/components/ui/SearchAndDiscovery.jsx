import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

// Icons
import {
  Search,
  Filter,
  X,
  Clock,
  Star,
  TrendingUp,
  BookOpen,
  FileText,
  BarChart3,
  Calculator,
  Users,
  Settings,
  ChevronRight,
  Command,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

/**
 * Enhanced Search and Discovery Component
 * Provides intelligent search, filtering, and content discovery features
 */

// Search result types
const RESULT_TYPES = {
  PAGE: 'page',
  FEATURE: 'feature',
  ACTION: 'action',
  RECENT: 'recent'
};

// Mock search data - in real app this would come from an API
const mockSearchResults = [
  {
    id: '1',
    type: RESULT_TYPES.PAGE,
    title: 'Portfolio Manager',
    description: 'Manage your investment portfolio',
    path: '/portfolio-manager',
    icon: 'folder',
    category: 'Portfolio'
  },
  {
    id: '2',
    type: RESULT_TYPES.PAGE,
    title: 'Valuation Workbench',
    description: 'Advanced valuation tools and models',
    path: '/valuation-workbench',
    icon: 'calculator',
    category: 'Analysis'
  },
  {
    id: '3',
    type: RESULT_TYPES.FEATURE,
    title: 'Scenario Analysis',
    description: 'Run sensitivity and scenario analysis',
    path: '/scenario-analysis',
    icon: 'trending-up',
    category: 'Analysis'
  },
  {
    id: '4',
    type: RESULT_TYPES.ACTION,
    title: 'New Model',
    description: 'Create a new financial model',
    action: 'create-model',
    icon: 'file-text',
    category: 'Actions'
  },
  {
    id: '5',
    type: RESULT_TYPES.PAGE,
    title: 'Reports',
    description: 'Generate and view financial reports',
    path: '/reports',
    icon: 'bar-chart',
    category: 'Reports'
  },
  {
    id: '6',
    type: RESULT_TYPES.RECENT,
    title: 'Q4 Portfolio Review',
    description: 'Last accessed 2 hours ago',
    path: '/portfolio-review-q4',
    icon: 'clock',
    category: 'Recent'
  }
];

const categoryIcons = {
  Portfolio: 'folder',
  Analysis: 'calculator',
  Reports: 'bar-chart',
  Actions: 'file-text',
  Recent: 'clock',
  Settings: 'settings',
  Help: 'book-open'
};

/**
 * Search Result Item Component
 */
export const SearchResultItem = ({
  result,
  onSelect,
  isHighlighted = false,
  className = '',
  ...props
}) => {
  const IconComponent =
    {
      folder: FileText,
      calculator: Calculator,
      'trending-up': TrendingUp,
      'file-text': FileText,
      'bar-chart': BarChart3,
      clock: Clock,
      settings: Settings,
      'book-open': BookOpen
    }[result.icon] || FileText;

  const handleClick = () => {
    if (result.path) {
      window.location.href = result.path;
    } else if (result.action) {
      onSelect?.(result);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200',
        'hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary',
        isHighlighted && 'bg-primary/10 ring-2 ring-primary/50',
        className
      )}
      onClick={handleClick}
      role="option"
      aria-selected={isHighlighted}
      {...props}
    >
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <IconComponent className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground truncate">{result.title}</h4>
          <span className="text-xs text-foreground-secondary bg-background-secondary px-2 py-1 rounded">
            {result.category}
          </span>
        </div>
        <p className="text-sm text-foreground-secondary truncate mt-1">{result.description}</p>
      </div>

      {result.type === RESULT_TYPES.RECENT && (
        <div className="text-xs text-foreground-secondary">Recent</div>
      )}

      <ChevronRight className="w-4 h-4 text-foreground-secondary" />
    </div>
  );
};

/**
 * Search Filters Component
 */
export const SearchFilters = ({
  filters = [],
  activeFilters = [],
  onFilterChange,
  className = '',
  ...props
}) => (
  <div className={cn('flex items-center gap-2 flex-wrap', className)} {...props}>
    {filters.map(filter => (
      <button
        key={filter.id}
        onClick={() => onFilterChange(filter.id)}
        className={cn(
          'px-3 py-1 text-sm rounded-full transition-colors',
          activeFilters.includes(filter.id)
            ? 'bg-primary text-primary-foreground'
            : 'bg-background-secondary text-foreground-secondary hover:bg-background hover:text-foreground'
        )}
      >
        {filter.label}
      </button>
    ))}
  </div>
);

/**
 * Enhanced Search Component
 */
export const SearchComponent = ({
  placeholder = 'Search...',
  onSearch,
  onResultSelect,
  showFilters = false,
  filters = [],
  className = '',
  ...props
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeFilters, setActiveFilters] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options
  const filterOptions = [
    { id: 'pages', label: 'Pages' },
    { id: 'features', label: 'Features' },
    { id: 'actions', label: 'Actions' },
    { id: 'recent', label: 'Recent' }
  ];

  // Search functionality
  const performSearch = (searchQuery, filterList = []) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    let filteredResults = mockSearchResults.filter(result => {
      const matchesQuery =
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterList.length === 0 || filterList.some(filter => result.type === filter);

      return matchesQuery && matchesFilter;
    });

    // Sort by relevance
    filteredResults.sort((a, b) => {
      // Recent items first
      if (a.type === RESULT_TYPES.RECENT && b.type !== RESULT_TYPES.RECENT) return -1;
      if (b.type === RESULT_TYPES.RECENT && a.type !== RESULT_TYPES.RECENT) return 1;

      // Exact title matches
      const aExact = a.title.toLowerCase() === searchQuery.toLowerCase();
      const bExact = b.title.toLowerCase() === searchQuery.toLowerCase();
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;

      return 0;
    });

    setResults(filteredResults.slice(0, 8)); // Limit to 8 results
    setSelectedIndex(-1);
  };

  // Handle input changes
  const handleInputChange = e => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (value.trim()) {
      performSearch(value, activeFilters);
    } else {
      setResults([]);
    }

    onSearch?.(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = e => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleResultSelect = result => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);

    if (result.path) {
      window.location.href = result.path;
    }

    onResultSelect?.(result);
  };

  // Handle filter changes
  const handleFilterChange = filterId => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(id => id !== filterId)
      : [...activeFilters, filterId];

    setActiveFilters(newFilters);

    if (query.trim()) {
      performSearch(query, newFilters);
    }
  };

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = event => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={cn('relative w-full max-w-md', className)} {...props}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     text-foreground placeholder:text-foreground-secondary"
          aria-label="Search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1
                       rounded hover:bg-background-secondary transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-foreground-secondary" />
          </button>
        )}

        {/* Keyboard shortcut hint */}
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <kbd
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs
                         bg-background-secondary text-foreground-secondary rounded"
          >
            <Command className="w-3 h-3" />K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border
                     rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
          role="listbox"
          aria-label="Search results"
        >
          {/* Filters */}
          {showFilters && (
            <div className="p-3 border-b border-border">
              <SearchFilters
                filters={filterOptions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  onSelect={handleResultSelect}
                  isHighlighted={index === selectedIndex}
                />
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-6 text-center">
              <Search className="w-12 h-12 text-foreground-secondary mx-auto mb-3" />
              <h4 className="text-lg font-medium text-foreground mb-2">No results found</h4>
              <p className="text-foreground-secondary">
                Try adjusting your search terms or check the spelling
              </p>
            </div>
          ) : (
            <div className="p-6 text-center">
              <BookOpen className="w-12 h-12 text-foreground-secondary mx-auto mb-3" />
              <h4 className="text-lg font-medium text-foreground mb-2">Start typing to search</h4>
              <p className="text-foreground-secondary">
                Search for pages, features, or recent items
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Global Search Command Palette
 */
export const SearchCommandPalette = ({
  isOpen,
  onClose,
  onSearch,
  onResultSelect,
  className = '',
  ...props
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Quick actions
  const quickActions = [
    {
      id: 'new-model',
      title: 'Create New Model',
      description: 'Start a new financial model',
      action: 'create-model',
      icon: 'file-text'
    },
    {
      id: 'new-portfolio',
      title: 'Create Portfolio',
      description: 'Set up a new investment portfolio',
      action: 'create-portfolio',
      icon: 'folder'
    },
    {
      id: 'import-data',
      title: 'Import Data',
      description: 'Import financial data from file',
      action: 'import-data',
      icon: 'file-text'
    },
    {
      id: 'settings',
      title: 'Open Settings',
      description: 'Configure application preferences',
      action: 'open-settings',
      icon: 'settings'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults(quickActions);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const performSearch = searchQuery => {
    if (!searchQuery.trim()) {
      setResults(quickActions);
      return;
    }

    const filteredResults = mockSearchResults.filter(
      result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(filteredResults.slice(0, 6));
  };

  const handleInputChange = e => {
    const value = e.target.value;
    setQuery(value);
    performSearch(value);
    setSelectedIndex(0);
    onSearch?.(value);
  };

  const handleKeyDown = e => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleResultSelect = result => {
    onClose();
    if (result.path) {
      window.location.href = result.path;
    }
    onResultSelect?.(result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div
        className={cn(
          'w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search for anything..."
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none
                         text-foreground placeholder:text-foreground-secondary text-lg"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  onSelect={handleResultSelect}
                  isHighlighted={index === selectedIndex}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Search className="w-16 h-16 text-foreground-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
              <p className="text-foreground-secondary">
                Try searching for pages, features, or actions
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-background-secondary border-t border-border">
          <div className="flex items-center justify-between text-sm text-foreground-secondary">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ArrowUp className="w-4 h-4" />
                <ArrowDown className="w-4 h-4" />
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-background rounded text-xs">Enter</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-background rounded text-xs">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <div className="text-xs">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Discovery Panel Component
 * Shows recently accessed items, trending features, etc.
 */
export const DiscoveryPanel = ({
  recentItems = [],
  trendingItems = [],
  suggestedActions = [],
  onItemClick,
  className = '',
  ...props
}) => (
  <div className={cn('space-y-6', className)} {...props}>
    {/* Recent Items */}
    {recentItems.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recently Accessed
        </h3>
        <div className="space-y-2">
          {recentItems.map(item => (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background-secondary
                         transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{item.title}</div>
                <div className="text-sm text-foreground-secondary">{item.lastAccessed}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Trending Features */}
    {trendingItems.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trending Features
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {trendingItems.map(item => (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20
                         rounded-lg hover:from-primary/10 hover:to-primary/20 transition-all
                         focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div className="font-medium text-foreground">{item.title}</div>
              </div>
              <div className="text-sm text-foreground-secondary">{item.description}</div>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Suggested Actions */}
    {suggestedActions.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Suggested Actions
        </h3>
        <div className="space-y-2">
          {suggestedActions.map(action => (
            <button
              key={action.id}
              onClick={() => onItemClick?.(action)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border
                         hover:bg-background-secondary transition-colors text-left
                         focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{action.title}</div>
                <div className="text-sm text-foreground-secondary">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

/**
 * Navigation Hierarchy Component
 * Shows the current page's position in the information architecture
 */
export const NavigationHierarchy = ({
  hierarchy = [],
  currentPage,
  onNavigate,
  className = '',
  ...props
}) => (
  <div className={cn('space-y-4', className)} {...props}>
    <h3 className="text-lg font-semibold text-foreground">Navigation Hierarchy</h3>

    <div className="space-y-2">
      {hierarchy.map((level, index) => (
        <div key={level.id} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-primary">{index + 1}</span>
          </div>

          <button
            onClick={() => onNavigate?.(level)}
            className={cn(
              'flex-1 text-left p-2 rounded-lg transition-colors',
              level.id === currentPage?.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'hover:bg-background-secondary text-foreground'
            )}
          >
            <div className="font-medium">{level.title}</div>
            <div className="text-sm text-foreground-secondary">{level.description}</div>
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default SearchComponent;
