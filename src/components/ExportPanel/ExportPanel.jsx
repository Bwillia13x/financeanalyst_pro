import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  Settings,
  X,
  Check
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import exportService from '../../services/exportService';
import Button from '../ui/Button';

const ExportPanel = ({ isOpen, onClose, data, title = 'Export Data' }) => {
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeHeaders: true,
    includeFormatting: true,
    compressImages: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const exportFormats = [
    {
      id: 'excel',
      name: 'Excel Workbook',
      icon: FileSpreadsheet,
      extension: '.xlsx',
      description: 'Full spreadsheet with formulas and formatting'
    },
    {
      id: 'pdf',
      name: 'PDF Report',
      icon: FileText,
      extension: '.pdf',
      description: 'Professional PDF report with charts'
    },
    {
      id: 'csv',
      name: 'CSV Data',
      icon: FileSpreadsheet,
      extension: '.csv',
      description: 'Raw data in CSV format'
    },
    {
      id: 'powerpoint',
      name: 'PowerPoint Presentation',
      icon: Presentation,
      extension: '.pptx',
      description: 'Executive presentation with slides'
    }
  ];

  const handleFormatToggle = formatId => {
    setSelectedFormats(prev =>
      prev.includes(formatId) ? prev.filter(id => id !== formatId) : [...prev, formatId]
    );
  };

  const handleExport = async () => {
    if (selectedFormats.length === 0) return;

    setIsExporting(true);
    try {
      const exportPromises = selectedFormats.map(async formatId => {
        const filename = `${title}_${new Date().toISOString().split('T')[0]}`;

        switch (formatId) {
          case 'excel':
            return exportService.exportToExcel(data, {
              filename: `${filename}.xlsx`,
              includeCharts: exportOptions.includeCharts,
              includeHeaders: exportOptions.includeHeaders,
              includeFormatting: exportOptions.includeFormatting
            });

          case 'pdf':
            return exportService.exportToPDF(data, {
              filename: `${filename}.pdf`,
              title,
              includeCharts: exportOptions.includeCharts,
              includeHeaders: exportOptions.includeHeaders
            });

          case 'csv':
            return exportService.exportToCSV(data, {
              filename: `${filename}.csv`,
              includeHeaders: exportOptions.includeHeaders
            });

          case 'powerpoint':
            return exportService.exportToPowerPoint(data, {
              filename: `${filename}.pptx`,
              title,
              includeCharts: exportOptions.includeCharts
            });

          default:
            return null;
        }
      });

      await Promise.all(exportPromises);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const onKeyDownOverlay = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  // Focus trap for accessibility when modal is open
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelectors = [
      'a[href]','area[href]','input:not([disabled])','select:not([disabled])',
      'textarea:not([disabled])','button:not([disabled])','[tabindex]:not([tabindex="-1"])'
    ];
    const getFocusable = () => Array.from(dialog.querySelectorAll(focusableSelectors.join(',')));

    const focusables = getFocusable();
    (focusables[0] || dialog).focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      if (previouslyFocusedRef.current && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={onKeyDownOverlay}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-panel-title"
        aria-describedby="export-panel-desc"
        ref={dialogRef}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center" id="export-panel-title">
              <Download className="w-5 h-5 mr-2" />
              Export Options
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close export panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6" id="export-panel-desc">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Export Formats
            </h3>
            <div className="space-y-3">
              {exportFormats.map(format => {
                const IconComponent = format.icon;
                const isSelected = selectedFormats.includes(format.id);

                return (
                  <div
                    key={format.id}
                    onClick={() => handleFormatToggle(format.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleFormatToggle(format.id);
                      }
                    }}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-blue-600" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-300 rounded" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <IconComponent className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {format.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{format.extension}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {format.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Export Options
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      includeCharts: e.target.checked
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Include charts and visualizations
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeHeaders}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      includeHeaders: e.target.checked
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Include column headers
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeFormatting}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      includeFormatting: e.target.checked
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Include formatting and styles
                </span>
              </label>
            </div>
          </div>

          {/* Live region for announcing export state */}
          <div aria-live="polite" className="sr-only">
            {isExporting ? 'Export in progress' : 'Export ready'}
          </div>

          <div className="flex space-x-3">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedFormats.length === 0 || isExporting}
              aria-disabled={selectedFormats.length === 0 || isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting...
                </div>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export ({selectedFormats.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExportPanel;
