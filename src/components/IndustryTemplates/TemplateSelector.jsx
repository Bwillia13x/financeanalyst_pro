import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  // Star, // Commented out - unused
  TrendingUp,
  Building2,
  Zap,
  Heart,
  Home,
  // ChevronRight, // Commented out - unused
  // Settings, // Commented out - unused
  CheckCircle,
  Info
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { industryTemplateService } from '../../services/templates/industryTemplates';

const IndustryTemplateSelector = ({ onTemplateSelect, selectedTemplate, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(false);

  const allTemplates = industryTemplateService.getAllTemplates();

  const sectorIcons = {
    technology: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100' },
    healthcare: { icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
    realestate: { icon: Home, color: 'text-green-600', bg: 'bg-green-100' },
    energy: { icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-100' }
  };

  const filteredTemplates = useMemo(() => {
    let templates = [];

    // Convert template structure to flat array
    Object.keys(allTemplates).forEach(sector => {
      Object.keys(allTemplates[sector]).forEach(type => {
        const template = allTemplates[sector][type];
        templates.push({
          ...template,
          sector,
          type,
          key: `${sector}_${type}`
        });
      });
    });

    // Apply filters
    if (selectedSector !== 'all') {
      templates = templates.filter(t => t.sector === selectedSector);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.sector.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        templates.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'sector':
        templates.sort((a, b) => a.sector.localeCompare(b.sector));
        break;
      default: // popularity
        templates.sort((a, b) => {
          const popularity = { saas: 10, biotech: 9, reit: 8, oil_gas: 7 };
          return (popularity[b.type] || 5) - (popularity[a.type] || 5);
        });
    }

    return templates;
  }, [allTemplates, searchQuery, selectedSector, sortBy]);

  const sectorCounts = useMemo(() => {
    const counts = { all: 0 };
    Object.keys(allTemplates).forEach(sector => {
      counts[sector] = Object.keys(allTemplates[sector]).length;
      counts.all += counts[sector];
    });
    return counts;
  }, [allTemplates]);

  const TemplateCard = ({ template }) => {
    const sectorConfig = sectorIcons[template.sector] || sectorIcons.technology;
    const Icon = sectorConfig.icon;
    const isSelected = selectedTemplate === template.key;

    return (
      <motion.div
        className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-lg'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
        onClick={() => onTemplateSelect(template)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        {isSelected && (
          <motion.div
            className="absolute top-3 right-3"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </motion.div>
        )}

        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${sectorConfig.bg}`}>
            <Icon className={`h-6 w-6 ${sectorConfig.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{template.name}</h3>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {template.sector}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>

            {template.keyMetrics && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 mb-1">Key Metrics:</div>
                <div className="flex flex-wrap gap-1">
                  {template.keyMetrics.slice(0, 3).map((metric, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {metric}
                    </span>
                  ))}
                  {template.keyMetrics.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                      +{template.keyMetrics.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {template.benchmarks && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-gray-600">Includes industry benchmarks</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const SectorFilter = () => (
    <div className="flex items-center space-x-2 mb-6">
      <button
        onClick={() => setSelectedSector('all')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          selectedSector === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All ({sectorCounts.all})
      </button>

      {Object.keys(sectorIcons).map(sector => {
        const config = sectorIcons[sector];
        const Icon = config.icon;
        const count = sectorCounts[sector] || 0;

        return (
          <button
            key={sector}
            onClick={() => setSelectedSector(sector)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedSector === sector
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="capitalize">
              {sector} ({count})
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Industry Templates</h2>
            <p className="text-gray-600 mt-1">
              Choose a specialized template for your industry analysis
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="popularity">Popular</option>
            <option value="alphabetical">A-Z</option>
            <option value="sector">Sector</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        <SectorFilter />

        <AnimatePresence>
          {filteredTemplates.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
              {filteredTemplates.map(template => (
                <TemplateCard key={template.key} template={template} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSector('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedTemplate && (
          <motion.div
            className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Template Selected</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Ready to start your analysis with the selected industry template
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default IndustryTemplateSelector;
