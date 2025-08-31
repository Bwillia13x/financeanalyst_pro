import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { reportBuilderService } from '../../services/reporting/ReportBuilderService';

const ReportGallery = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates when category or search changes
  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = () => {
    const availableTemplates = reportBuilderService.getTemplates();
    setTemplates(availableTemplates);
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        template =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleCategoryChange = category => {
    setSelectedCategory(category);
  };

  const handleSearchChange = event => {
    setSearchQuery(event.target.value);
  };

  const handleTemplateSelect = template => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  const getCategoryIcon = category => {
    const icons = {
      analysis: '📊',
      investment: '💼',
      dashboard: '📈',
      research: '🔍',
      compliance: '⚖️'
    };
    return icons[category] || '📄';
  };

  const getCategories = () => {
    const categories = new Set(templates.map(template => template.category));
    return ['all', ...Array.from(categories)];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Report Gallery</h2>
          <p className="text-foreground-secondary mt-1">
            Choose from professional report templates
          </p>
        </div>

        <div className="text-sm text-foreground-secondary">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-secondary">Category:</span>
              <select
                value={selectedCategory}
                onChange={e => handleCategoryChange(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-brand-accent focus:border-transparent"
              >
                {getCategories().map(category => (
                  <option key={category} value={category}>
                    {category === 'all'
                      ? 'All Categories'
                      : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-foreground-secondary">
                  <div className="text-4xl mb-4">📄</div>
                  <p>No templates found matching your criteria</p>
                  <p className="text-sm mt-2">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20'
                          : 'border-border hover:border-brand-accent/50 hover:shadow-md'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getCategoryIcon(template.category)}</div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">
                            {template.name}
                          </h4>

                          <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                            {template.description}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-background-secondary text-foreground-secondary">
                              {template.category}
                            </span>

                            <span className="text-xs text-foreground-secondary">
                              {template.sections?.length || 0} sections
                            </span>
                          </div>

                          {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-brand-accent/10 text-brand-accent"
                                >
                                  {tag}
                                </span>
                              ))}
                              {template.tags.length > 3 && (
                                <span className="text-xs text-foreground-secondary">
                                  +{template.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Template Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-4">
                  {/* Template Header */}
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {getCategoryIcon(selectedTemplate.category)}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-foreground-secondary mt-1">
                      {selectedTemplate.description}
                    </p>
                  </div>

                  {/* Template Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Category</span>
                      <span className="font-medium text-foreground capitalize">
                        {selectedTemplate.category}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Sections</span>
                      <span className="font-medium text-foreground">
                        {selectedTemplate.sections?.length || 0}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Tags</span>
                      <span className="font-medium text-foreground">
                        {selectedTemplate.tags?.length || 0}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Author</span>
                      <span className="font-medium text-foreground">
                        {selectedTemplate.metadata?.author || 'FinanceAnalyst Pro'}
                      </span>
                    </div>
                  </div>

                  {/* Section Preview */}
                  {selectedTemplate.sections && selectedTemplate.sections.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        Sections Preview
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedTemplate.sections.slice(0, 5).map((section, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm text-foreground-secondary"
                          >
                            <div className="w-2 h-2 rounded-full bg-brand-accent flex-shrink-0" />
                            <span className="truncate">{section.title}</span>
                          </div>
                        ))}
                        {selectedTemplate.sections.length > 5 && (
                          <div className="text-xs text-foreground-secondary text-center">
                            +{selectedTemplate.sections.length - 5} more sections
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={handleUseTemplate}
                    className="w-full"
                    disabled={!onSelectTemplate}
                  >
                    Use This Template
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-foreground-secondary">
                  <div className="text-4xl mb-4">👆</div>
                  <p>Select a template to preview</p>
                  <p className="text-sm mt-2">Click on any template card to see details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Tips */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">💡 Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground-secondary">
              <p>• Templates include pre-designed layouts and content structure</p>
              <p>• You can customize colors, fonts, and themes after selection</p>
              <p>• Templates support multiple export formats (PDF, Excel, PowerPoint)</p>
              <p>• Use tags to find templates by specific topics or use cases</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportGallery;
