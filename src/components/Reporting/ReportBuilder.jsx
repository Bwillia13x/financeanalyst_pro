import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  Settings,
  Check,
  Clock,
  AlertCircle,
  Palette,
  Layout,
  Plus,
  Trash2
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import reportingEngine from '../../services/reportingEngine';

const ReportBuilder = ({ financialData, onReportGenerated }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('professional');
  const [reportOptions, setReportOptions] = useState({
    includeCharts: true,
    includeRawData: false,
    includedSections: []
  });
  const [customSections, setCustomSections] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [themes, setThemes] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadTemplatesAndThemes();
    loadExistingReports();
  }, []);

  const loadTemplatesAndThemes = async () => {
    try {
      const availableTemplates = reportingEngine.getTemplates();
      const availableThemes = reportingEngine.getThemes();

      setTemplates(availableTemplates);
      setThemes(availableThemes);

      if (availableTemplates.length > 0 && !selectedTemplate) {
        setSelectedTemplate(availableTemplates[0]);
      }
    } catch (error) {
      console.error('Error loading templates and themes:', error);
    }
  };

  const loadExistingReports = async () => {
    try {
      const reports = reportingEngine.listReports();
      setGeneratedReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleTemplateSelect = template => {
    setSelectedTemplate(template);
    // Auto-select all required sections
    const requiredSections = template.sections
      .filter(section => section.required)
      .map(section => section.id);

    setReportOptions(prev => ({
      ...prev,
      includedSections: [
        ...requiredSections,
        ...prev.includedSections.filter(id => !requiredSections.includes(id))
      ]
    }));
  };

  const handleSectionToggle = sectionId => {
    setReportOptions(prev => ({
      ...prev,
      includedSections: prev.includedSections.includes(sectionId)
        ? prev.includedSections.filter(id => id !== sectionId)
        : [...prev.includedSections, sectionId]
    }));
  };

  const addCustomSection = () => {
    const newSection = {
      id: `custom_${Date.now()}`,
      name: 'Custom Section',
      content: '',
      charts: [],
      tables: []
    };
    setCustomSections(prev => [...prev, newSection]);
  };

  const updateCustomSection = (index, updates) => {
    setCustomSections(prev =>
      prev.map((section, i) => (i === index ? { ...section, ...updates } : section))
    );
  };

  const removeCustomSection = index => {
    setCustomSections(prev => prev.filter((_, i) => i !== index));
  };

  const generateReport = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    try {
      const reportData = {
        ...financialData,
        company: financialData?.company || { name: 'Sample Company' },
        analyst: { name: 'Financial Analyst' },
        reportTitle: selectedTemplate.name
      };

      const report = await reportingEngine.generateReport(selectedTemplate.id, reportData, {
        theme: selectedTheme,
        customSections,
        ...reportOptions
      });

      setGeneratedReports(prev => [report, ...prev]);
      onReportGenerated?.(report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async (reportId, format) => {
    try {
      const exportedReport = await reportingEngine.exportReport(reportId, format);

      // Create download link
      const blob = new Blob([exportedReport.data], {
        type: getContentType(format)
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportedReport.filename;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report: ' + error.message);
    }
  };

  const getContentType = format => {
    const types = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      html: 'text/html',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return types[format] || 'application/octet-stream';
  };

  const getStatusColor = status => {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      generating: 'text-blue-600 bg-blue-100',
      error: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = status => {
    const icons = {
      completed: Check,
      generating: Clock,
      error: AlertCircle
    };
    return icons[status] || Clock;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Builder</h1>
          <p className="text-gray-600 mt-1">
            Create professional financial reports with custom templates
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye size={20} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Template Selection */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Layout className="mr-2" size={24} />
              Templates
            </h2>

            <div className="space-y-3">
              {templates.map(template => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.sections.length} sections</span>
                    <span>~{template.estimatedPages} pages</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Palette className="mr-2" size={24} />
              Theme
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {themes.map(theme => (
                <motion.div
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedTheme === theme.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{theme.name}</span>
                    <div className="flex space-x-1">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="col-span-8 space-y-6">
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="mr-2" size={24} />
                Report Configuration
              </h2>

              {/* Sections Configuration */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Sections</h3>
                <div className="space-y-3">
                  {selectedTemplate.sections.map(section => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{section.name}</span>
                          {section.required && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{section.type}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={
                          section.required || reportOptions.includedSections.includes(section.id)
                        }
                        disabled={section.required}
                        onChange={() => handleSectionToggle(section.id)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Sections */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Custom Sections</h3>
                  <button
                    onClick={addCustomSection}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {customSections.map((section, index) => (
                    <div key={section.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="text"
                          value={section.name}
                          onChange={e => updateCustomSection(index, { name: e.target.value })}
                          className="font-medium bg-transparent border-none p-0 focus:ring-0"
                        />
                        <button
                          onClick={() => removeCustomSection(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <textarea
                        value={section.content}
                        onChange={e => updateCustomSection(index, { content: e.target.value })}
                        placeholder="Section content..."
                        className="w-full text-sm bg-white border border-gray-200 rounded p-2 resize-none"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={reportOptions.includeCharts}
                      onChange={e =>
                        setReportOptions(prev => ({
                          ...prev,
                          includeCharts: e.target.checked
                        }))
                      }
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span>Include charts and visualizations</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={reportOptions.includeRawData}
                      onChange={e =>
                        setReportOptions(prev => ({
                          ...prev,
                          includeRawData: e.target.checked
                        }))
                      }
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span>Include raw data tables</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="animate-spin" size={20} />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={20} />
                      <span>Generate Report</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Generated Reports */}
          {generatedReports.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Reports</h2>

              <div className="space-y-3">
                {generatedReports.map(report => {
                  const StatusIcon = getStatusIcon(report.status);

                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(report.status)}`}>
                          <StatusIcon size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{report.template}</h3>
                          <p className="text-sm text-gray-600">
                            Created {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {report.status === 'completed' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => exportReport(report.id, 'pdf')}
                            className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Download size={16} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => exportReport(report.id, 'docx')}
                            className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Download size={16} />
                            <span>Word</span>
                          </button>
                          <button
                            onClick={() => exportReport(report.id, 'excel')}
                            className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Download size={16} />
                            <span>Excel</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
