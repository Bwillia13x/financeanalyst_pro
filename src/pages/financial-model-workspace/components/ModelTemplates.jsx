import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ModelTemplates = ({ onTemplateSelect, onTemplateCreate }) => {
  const [selectedCategory, setSelectedCategory] = useState('valuation');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const templateCategories = {
    valuation: {
      name: 'Valuation Models',
      icon: 'TrendingUp',
      templates: [
        {
          id: 'dcf_standard',
          name: 'DCF - Standard',
          description: 'Traditional discounted cash flow model with 5-year projections and terminal value',
          complexity: 'Intermediate',
          timeToComplete: '45 min',
          lastUsed: '2024-07-10',
          popularity: 95,
          features: ['5-year projections', 'Terminal value', 'Sensitivity analysis', 'WACC calculation']
        },
        {
          id: 'dcf_tech',
          name: 'DCF - Technology',
          description: 'Specialized DCF for high-growth technology companies with adjusted metrics',
          complexity: 'Advanced',
          timeToComplete: '60 min',
          lastUsed: '2024-07-08',
          popularity: 87,
          features: ['SaaS metrics', 'User-based projections', 'Churn analysis', 'Rule of 40']
        },
        {
          id: 'sum_of_parts',
          name: 'Sum-of-the-Parts',
          description: 'Multi-business valuation with segment-specific assumptions and multiples',
          complexity: 'Advanced',
          timeToComplete: '90 min',
          lastUsed: '2024-07-05',
          popularity: 73,
          features: ['Segment analysis', 'Multiple approaches', 'Holding company discount', 'Synergy modeling']
        }
      ]
    },
    lbo: {
      name: 'LBO Models',
      icon: 'Layers',
      templates: [
        {
          id: 'lbo_standard',
          name: 'LBO - Standard',
          description: 'Complete leveraged buyout model with debt sizing and returns analysis',
          complexity: 'Advanced',
          timeToComplete: '120 min',
          lastUsed: '2024-07-09',
          popularity: 91,
          features: ['Debt capacity', 'Returns waterfall', 'Management rollover', 'Exit scenarios']
        },
        {
          id: 'lbo_growth',
          name: 'LBO - Growth Equity',
          description: 'Growth-focused LBO with minority investment and expansion capital',
          complexity: 'Advanced',
          timeToComplete: '100 min',
          lastUsed: '2024-07-06',
          popularity: 68,
          features: ['Growth capital', 'Minority stake', 'Management incentives', 'Expansion modeling']
        }
      ]
    },
    comps: {
      name: 'Comparable Analysis',
      icon: 'BarChart3',
      templates: [
        {
          id: 'trading_comps',
          name: 'Trading Comparables',
          description: 'Public company multiple analysis with statistical benchmarking',
          complexity: 'Beginner',
          timeToComplete: '30 min',
          lastUsed: '2024-07-11',
          popularity: 98,
          features: ['Multiple analysis', 'Statistical metrics', 'Peer screening', 'Premium/discount analysis']
        },
        {
          id: 'transaction_comps',
          name: 'Transaction Comparables',
          description: 'M&A transaction analysis with control premiums and synergies',
          complexity: 'Intermediate',
          timeToComplete: '45 min',
          lastUsed: '2024-07-07',
          popularity: 82,
          features: ['M&A multiples', 'Control premiums', 'Synergy analysis', 'Transaction screening']
        }
      ]
    },
    merger: {
      name: 'M&A Models',
      icon: 'GitMerge',
      templates: [
        {
          id: 'merger_model',
          name: 'Merger Model',
          description: 'Comprehensive merger analysis with accretion/dilution and pro forma statements',
          complexity: 'Expert',
          timeToComplete: '180 min',
          lastUsed: '2024-07-04',
          popularity: 76,
          features: ['Accretion/dilution', 'Pro forma statements', 'Synergy modeling', 'Financing structure']
        },
        {
          id: 'acquisition_model',
          name: 'Acquisition Model',
          description: 'Strategic acquisition analysis with integration costs and value creation',
          complexity: 'Expert',
          timeToComplete: '150 min',
          lastUsed: '2024-07-03',
          popularity: 71,
          features: ['Integration costs', 'Value creation', 'Financing options', 'Risk analysis']
        }
      ]
    }
  };

  const recentTemplates = [
    { id: 'dcf_standard', name: 'DCF - Standard', lastUsed: '2024-07-11 14:30' },
    { id: 'trading_comps', name: 'Trading Comparables', lastUsed: '2024-07-11 09:15' },
    { id: 'lbo_standard', name: 'LBO - Standard', lastUsed: '2024-07-10 16:45' }
  ];

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'Beginner': return 'text-success bg-success/10';
      case 'Intermediate': return 'text-warning bg-warning/10';
      case 'Advanced': return 'text-accent bg-accent/10';
      case 'Expert': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const filteredTemplates = () => {
    const templates = templateCategories[selectedCategory]?.templates || [];
    if (!searchTerm) return templates;
    
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleTemplateSelect = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="FileTemplate" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Model Templates</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          iconName="Plus"
          onClick={() => setShowCreateModal(true)}
        >
          Create Template
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex border-b border-border overflow-x-auto">
        {Object.entries(templateCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-smooth ${
              selectedCategory === key
                ? 'bg-primary text-primary-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon name={category.icon} size={16} />
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Recent Templates */}
        {!searchTerm && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center space-x-2">
              <Icon name="Clock" size={16} />
              <span>Recently Used</span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {recentTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div>
                    <span className="font-medium text-foreground">{template.name}</span>
                    <p className="text-xs text-muted-foreground">Last used: {template.lastUsed}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Template Cards */}
        <div className="space-y-4">
          {filteredTemplates().map((template) => (
            <div
              key={template.id}
              className="p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-smooth cursor-pointer group"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {template.name}
                    </h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                      {template.complexity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Icon name="Star" size={12} />
                    <span>{template.popularity}%</span>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Icon name="Clock" size={12} />
                    <span>{template.timeToComplete}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="Calendar" size={12} />
                    <span>Last used: {template.lastUsed}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {template.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-muted text-xs text-muted-foreground rounded"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates().length === 0 && (
          <div className="text-center py-12">
            <Icon name="FileX" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No templates found</h4>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'No templates available in this category'}
            </p>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-elevation-2 w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Create New Template</h3>
              <Button
                variant="ghost"
                size="sm"
                iconName="X"
                onClick={() => setShowCreateModal(false)}
              />
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Template Name</label>
                <input
                  type="text"
                  placeholder="Enter template name..."
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                <textarea
                  placeholder="Describe your template..."
                  rows={3}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                <select className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="valuation">Valuation Models</option>
                  <option value="lbo">LBO Models</option>
                  <option value="comps">Comparable Analysis</option>
                  <option value="merger">M&A Models</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  if (onTemplateCreate) onTemplateCreate();
                }}
              >
                Create Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelTemplates;