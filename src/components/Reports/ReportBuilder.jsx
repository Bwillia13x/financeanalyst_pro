import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { reportBuilderService } from '../../services/reporting/ReportBuilderService';
import { exportService } from '../../services/reporting/ExportService';

const ReportBuilder = ({ template, onSave, onCancel }) => {
  const [report, setReport] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('professional');
  const [previewMode, setPreviewMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const previewRef = useRef(null);

  // Initialize report from template
  useEffect(() => {
    if (template) {
      initializeReport(template);
    }
  }, [template]);

  const initializeReport = async template => {
    try {
      const newReport = await reportBuilderService.createReport(template.id, {
        title: `${template.name} Report`,
        author: 'Current User',
        theme: selectedTheme
      });

      setReport(newReport);
      setSelectedSection(newReport.sections[0]);
    } catch (error) {
      console.error('Failed to initialize report:', error);
    }
  };

  const handleTitleChange = title => {
    if (report) {
      setReport(prev => ({ ...prev, title }));
    }
  };

  const handleSectionContentChange = (sectionId, content) => {
    if (report) {
      const updatedSections = report.sections.map(section =>
        section.id === sectionId ? { ...section, content } : section
      );

      setReport(prev => ({ ...prev, sections: updatedSections }));
    }
  };

  const handleThemeChange = theme => {
    setSelectedTheme(theme);
    if (report) {
      setReport(prev => ({ ...prev, theme }));
    }
  };

  const handleAddSection = () => {
    if (report) {
      const newSection = {
        id: `section_${Date.now()}`,
        type: 'content',
        title: 'New Section',
        layout: 'single-column',
        content: {
          type: 'text',
          placeholder: 'Enter section content here...'
        }
      };

      setReport(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    }
  };

  const handleDeleteSection = sectionId => {
    if (report) {
      const updatedSections = report.sections.filter(section => section.id !== sectionId);
      setReport(prev => ({ ...prev, sections: updatedSections }));

      if (selectedSection?.id === sectionId) {
        setSelectedSection(updatedSections[0] || null);
      }
    }
  };

  const handleExport = async format => {
    if (!report) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Update report before exporting
      await reportBuilderService.updateReport(report.id, {
        title: report.title,
        sections: report.sections,
        theme: report.theme
      });

      // Generate export
      const result = await reportBuilderService.generateReport(report.id, format);

      // Download file
      const blob = new Blob([result.data], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress(100);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 2000);
    }
  };

  const handleSave = async () => {
    if (report && onSave) {
      try {
        await reportBuilderService.updateReport(report.id, report);
        onSave(report);
      } catch (error) {
        console.error('Failed to save report:', error);
      }
    }
  };

  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  const getThemes = () => {
    return reportBuilderService.getThemes();
  };

  const renderSectionEditor = section => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground">{section.title}</h4>

          <Button
            onClick={() => handleDeleteSection(section.id)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>

        <div className="space-y-4">
          {/* Section Title */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Section Title
            </label>
            <Input
              value={section.title}
              onChange={e => {
                const updatedSections = report.sections.map(s =>
                  s.id === section.id ? { ...s, title: e.target.value } : s
                );
                setReport(prev => ({ ...prev, sections: updatedSections }));
              }}
              placeholder="Enter section title"
            />
          </div>

          {/* Section Content */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Content
            </label>
            {section.content?.type === 'text' && (
              <textarea
                value={section.content.placeholder || ''}
                onChange={e =>
                  handleSectionContentChange(section.id, {
                    ...section.content,
                    placeholder: e.target.value
                  })
                }
                placeholder="Enter section content..."
                className="w-full min-h-32 p-3 border border-border rounded-md focus:ring-2 focus:ring-brand-accent focus:border-transparent resize-vertical"
                rows={6}
              />
            )}

            {section.content?.type === 'mixed' && (
              <div className="space-y-3">
                {section.content.elements?.map((element, index) => (
                  <div key={index} className="border border-border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground-secondary capitalize">
                        {element.type}
                      </span>
                      <span className="text-xs text-foreground-secondary">
                        {element.chartType || element.dataSource || 'Content'}
                      </span>
                    </div>

                    {element.type === 'text' && (
                      <Input
                        value={element.placeholder || ''}
                        onChange={e => {
                          const updatedElements = [...section.content.elements];
                          updatedElements[index] = {
                            ...element,
                            placeholder: e.target.value
                          };
                          handleSectionContentChange(section.id, {
                            ...section.content,
                            elements: updatedElements
                          });
                        }}
                        placeholder="Enter text content..."
                      />
                    )}

                    {element.type === 'chart' && (
                      <div className="text-sm text-foreground-secondary">
                        Chart: {element.chartType} ({element.dataSource})
                      </div>
                    )}

                    {element.type === 'table' && (
                      <div className="text-sm text-foreground-secondary">
                        Table: {element.dataSource}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Layout Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Layout
            </label>
            <select
              value={section.layout}
              onChange={e => {
                const updatedSections = report.sections.map(s =>
                  s.id === section.id ? { ...s, layout: e.target.value } : s
                );
                setReport(prev => ({ ...prev, sections: updatedSections }));
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            >
              <option value="single-column">Single Column</option>
              <option value="two-column">Two Column</option>
              <option value="three-column">Three Column</option>
              <option value="grid-2">Grid 2x2</option>
              <option value="grid-4">Grid 4x4</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderReportPreview = () => {
    if (!report) return null;

    const themes = getThemes();
    const currentTheme = themes.find(t => t.name.toLowerCase() === selectedTheme) || themes[0];

    return (
      <div
        ref={previewRef}
        className="bg-white border border-border rounded-lg p-6 space-y-6"
        style={{
          backgroundColor: currentTheme.colors.background,
          color: currentTheme.colors.text,
          fontFamily: currentTheme.fonts.body
        }}
      >
        {/* Report Title */}
        <div
          className="text-center border-b pb-4"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              color: currentTheme.colors.primary,
              fontFamily: currentTheme.fonts.heading
            }}
          >
            {report.title}
          </h1>
          <p className="text-lg" style={{ color: currentTheme.colors.textSecondary }}>
            {report.description}
          </p>
          <div className="text-sm mt-2" style={{ color: currentTheme.colors.textSecondary }}>
            Generated by {report.author} on {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Report Sections */}
        <div className="space-y-8">
          {report.sections.map((section, index) => (
            <div
              key={section.id}
              className="pb-6"
              style={{
                borderBottom:
                  index < report.sections.length - 1
                    ? `1px solid ${currentTheme.colors.border}`
                    : 'none'
              }}
            >
              {/* Section Title */}
              <h2
                className="text-xl font-semibold mb-4"
                style={{
                  color: currentTheme.colors.primary,
                  fontFamily: currentTheme.fonts.heading
                }}
              >
                {section.title}
              </h2>

              {/* Section Content */}
              <div className="space-y-4">
                {section.content?.type === 'text' && (
                  <p className="leading-relaxed" style={{ color: currentTheme.colors.text }}>
                    {section.content.placeholder || 'Content to be added...'}
                  </p>
                )}

                {section.content?.type === 'mixed' && (
                  <div className="space-y-4">
                    {section.content.elements?.map((element, elementIndex) => (
                      <div key={elementIndex}>
                        {element.type === 'text' && (
                          <p
                            className="leading-relaxed"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {element.placeholder || 'Text content...'}
                          </p>
                        )}

                        {element.type === 'chart' && (
                          <div
                            className="h-48 border rounded flex items-center justify-center"
                            style={{
                              borderColor: currentTheme.colors.border,
                              backgroundColor: currentTheme.colors.backgroundSecondary
                            }}
                          >
                            <span style={{ color: currentTheme.colors.textSecondary }}>
                              📊 {element.chartType} Chart ({element.dataSource})
                            </span>
                          </div>
                        )}

                        {element.type === 'table' && (
                          <div
                            className="h-32 border rounded flex items-center justify-center"
                            style={{
                              borderColor: currentTheme.colors.border,
                              backgroundColor: currentTheme.colors.backgroundSecondary
                            }}
                          >
                            <span style={{ color: currentTheme.colors.textSecondary }}>
                              📋 Data Table ({element.dataSource})
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Loading report builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Report Builder</h2>
          <p className="text-foreground-secondary mt-1">
            Customize and generate professional reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={togglePreviewMode} variant="outline">
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>

          <Button onClick={handleSave} variant="outline">
            Save Report
          </Button>

          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Report Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  Report Title
                </label>
                <Input
                  value={report.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Enter report title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">
                  Theme
                </label>
                <select
                  value={selectedTheme}
                  onChange={e => handleThemeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                >
                  {getThemes().map(theme => (
                    <option key={theme.name.toLowerCase()} value={theme.name.toLowerCase()}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Sections List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Sections
                <Button onClick={handleAddSection} size="sm" variant="outline">
                  +
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.sections.map(section => (
                  <div
                    key={section.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedSection?.id === section.id
                        ? 'border-brand-accent bg-brand-accent/5'
                        : 'border-border hover:border-brand-accent/50'
                    }`}
                    onClick={() => setSelectedSection(section)}
                  >
                    <div className="font-medium text-foreground text-sm">{section.title}</div>
                    <div className="text-xs text-foreground-secondary capitalize">
                      {section.layout.replace('-', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => handleExport('pdf')} disabled={isExporting} className="w-full">
                {isExporting ? 'Exporting...' : 'Export as PDF'}
              </Button>

              <Button
                onClick={() => handleExport('excel')}
                disabled={isExporting}
                variant="outline"
                className="w-full"
              >
                Export as Excel
              </Button>

              <Button
                onClick={() => handleExport('powerpoint')}
                disabled={isExporting}
                variant="outline"
                className="w-full"
              >
                Export as PowerPoint
              </Button>

              {isExporting && (
                <div className="w-full bg-background-secondary rounded-full h-2">
                  <div
                    className="bg-brand-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {previewMode ? (
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
              </CardHeader>
              <CardContent>{renderReportPreview()}</CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedSection ? `Edit: ${selectedSection.title}` : 'Select a section to edit'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSection ? (
                  renderSectionEditor(selectedSection)
                ) : (
                  <div className="text-center py-12 text-foreground-secondary">
                    <div className="text-4xl mb-4">📝</div>
                    <p>Select a section from the sidebar to start editing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
