// Interactive Dashboard Component - Phase 2 Integration
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Grid, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table,
  Settings,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Move,
  X,
  RefreshCw
} from 'lucide-react';

// Import Phase 2 services
import { interactiveDashboardService } from '../../services/dashboards/interactiveDashboards';
import { dataVisualizationService } from '../../services/visualization/dataVisualizationComponents';
import { exportSharingService } from '../../services/sharing/exportSharingService';

export default function InteractiveDashboard({ analysisId, data, onDataChange }) {
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [layoutMode, setLayoutMode] = useState('view'); // view, edit
  const [dashboardTheme, setDashboardTheme] = useState('professional');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const dashboardRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    initializeDashboard();
    setupEventListeners();
    
    return () => cleanupEventListeners();
  }, [analysisId]);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Create or load dashboard
      let dashboardData = await interactiveDashboardService.getDashboard(analysisId);
      
      if (!dashboardData) {
        dashboardData = await interactiveDashboardService.createDashboard({
          id: analysisId,
          name: `Dashboard - ${new Date().toLocaleDateString()}`,
          layout: 'grid',
          theme: dashboardTheme
        });
      }

      setDashboard(dashboardData);
      
      // Load widgets
      const dashboardWidgets = await interactiveDashboardService.getWidgets(dashboardData.id);
      setWidgets(dashboardWidgets);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    interactiveDashboardService.on('widget:added', handleWidgetAdded);
    interactiveDashboardService.on('widget:updated', handleWidgetUpdated);
    interactiveDashboardService.on('widget:deleted', handleWidgetDeleted);
    interactiveDashboardService.on('layout:updated', handleLayoutUpdated);
    interactiveDashboardService.on('data:updated', handleDataUpdated);
  };

  const cleanupEventListeners = () => {
    interactiveDashboardService.removeAllListeners();
  };

  const handleWidgetAdded = (widget) => {
    setWidgets(prev => [...prev, widget]);
  };

  const handleWidgetUpdated = (widget) => {
    setWidgets(prev => prev.map(w => w.id === widget.id ? widget : w));
  };

  const handleWidgetDeleted = (widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const handleLayoutUpdated = (layout) => {
    // Update widget positions based on new layout
    setWidgets(prev => prev.map(widget => {
      const layoutItem = layout.find(item => item.widgetId === widget.id);
      return layoutItem ? { ...widget, position: layoutItem.position } : widget;
    }));
  };

  const handleDataUpdated = (updatedData) => {
    // Refresh widgets that depend on this data
    widgets.forEach(widget => {
      if (widget.dataSource && widget.dataSource.id === updatedData.id) {
        refreshWidget(widget.id);
      }
    });
  };

  const addWidget = async (widgetType, config = {}) => {
    try {
      const widgetConfig = {
        type: widgetType,
        title: `New ${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)}`,
        position: findNextPosition(),
        size: getDefaultSize(widgetType),
        ...config
      };

      const widget = await interactiveDashboardService.addWidget(dashboard.id, widgetConfig);
      setIsAddingWidget(false);
      
      // If widget needs data, connect it
      if (data && widget.type !== 'text') {
        await connectWidgetData(widget.id, data);
      }

      return widget;
    } catch (error) {
      console.error('Failed to add widget:', error);
      setError(error.message);
    }
  };

  const updateWidget = async (widgetId, updates) => {
    try {
      const widget = await interactiveDashboardService.updateWidget(widgetId, updates);
      return widget;
    } catch (error) {
      console.error('Failed to update widget:', error);
      setError(error.message);
    }
  };

  const deleteWidget = async (widgetId) => {
    try {
      await interactiveDashboardService.deleteWidget(widgetId);
    } catch (error) {
      console.error('Failed to delete widget:', error);
      setError(error.message);
    }
  };

  const refreshWidget = async (widgetId) => {
    try {
      const widget = widgets.find(w => w.id === widgetId);
      if (!widget) return;

      // Refresh widget data
      await interactiveDashboardService.refreshWidget(widgetId);
    } catch (error) {
      console.error('Failed to refresh widget:', error);
    }
  };

  const connectWidgetData = async (widgetId, widgetData) => {
    try {
      await interactiveDashboardService.connectDataSource(widgetId, {
        type: 'json',
        data: widgetData
      });
    } catch (error) {
      console.error('Failed to connect widget data:', error);
    }
  };

  const findNextPosition = () => {
    const cols = 12;
    const occupied = widgets.map(w => ({
      x: w.position.x,
      y: w.position.y,
      w: w.size.width,
      h: w.size.height
    }));

    // Simple algorithm to find next available position
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x <= cols - 4; x += 2) {
        const proposed = { x, y, w: 4, h: 3 };
        const conflicts = occupied.some(item =>
          !(proposed.x >= item.x + item.w ||
            proposed.x + proposed.w <= item.x ||
            proposed.y >= item.y + item.h ||
            proposed.y + proposed.h <= item.y)
        );
        
        if (!conflicts) {
          return { x, y };
        }
      }
    }
    
    return { x: 0, y: widgets.length * 4 };
  };

  const getDefaultSize = (widgetType) => {
    const sizes = {
      chart: { width: 6, height: 4 },
      kpi: { width: 3, height: 2 },
      table: { width: 8, height: 5 },
      text: { width: 4, height: 2 },
      gauge: { width: 4, height: 4 },
      iframe: { width: 6, height: 6 }
    };
    
    return sizes[widgetType] || { width: 4, height: 3 };
  };

  const exportDashboard = async (format = 'pdf') => {
    try {
      const dashboardData = {
        title: dashboard.name,
        widgets: widgets.map(widget => ({
          type: widget.type,
          title: widget.title,
          data: widget.data,
          config: widget.config
        }))
      };

      if (format === 'pdf') {
        await exportSharingService.exportToPDF(dashboardData, {
          filename: `${dashboard.name}.pdf`,
          template: 'dashboard_report'
        });
      } else if (format === 'excel') {
        await exportSharingService.exportToExcel(dashboardData, {
          filename: `${dashboard.name}.xlsx`
        });
      }
    } catch (error) {
      console.error('Failed to export dashboard:', error);
      setError(error.message);
    }
  };

  const shareDashboard = async () => {
    try {
      const shareLink = await exportSharingService.createShareableLink(
        { dashboard, widgets },
        {
          expirationDays: 30,
          allowDownload: true,
          allowComments: false
        }
      );

      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink.url);
      
      // Show success notification
      alert(`Dashboard shared! Link copied to clipboard.\nExpires: ${shareLink.expirationDate.toLocaleDateString()}`);
    } catch (error) {
      console.error('Failed to share dashboard:', error);
      setError(error.message);
    }
  };

  const widgetTypes = [
    { type: 'chart', icon: BarChart3, label: 'Chart', description: 'Bar, line, or area charts' },
    { type: 'kpi', icon: Grid, label: 'KPI', description: 'Key performance indicators' },
    { type: 'table', icon: Table, label: 'Table', description: 'Data tables and grids' },
    { type: 'text', icon: FileText, label: 'Text', description: 'Rich text content' },
    { type: 'gauge', icon: PieChart, label: 'Gauge', description: 'Progress and gauge charts' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Dashboard Error</h3>
        <p className="text-red-600 mt-1">{error}</p>
        <button 
          onClick={initializeDashboard}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">{dashboard?.name}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLayoutMode(layoutMode === 'view' ? 'edit' : 'view')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  layoutMode === 'edit' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {layoutMode === 'edit' ? 'Exit Edit' : 'Edit Layout'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddingWidget(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Widget</span>
            </button>
            
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => exportDashboard('pdf')}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                title="Export as PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={shareDashboard}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-300"
                title="Share Dashboard"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {/* Open settings */}}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-300"
                title="Dashboard Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="p-6 h-full overflow-auto" ref={dashboardRef}>
        <div 
          ref={gridRef}
          className="grid grid-cols-12 gap-4 auto-rows-min"
          style={{ minHeight: '600px' }}
        >
          <AnimatePresence>
            {widgets.map((widget) => (
              <DashboardWidget
                key={widget.id}
                widget={widget}
                isEditMode={layoutMode === 'edit'}
                onUpdate={updateWidget}
                onDelete={deleteWidget}
                onRefresh={refreshWidget}
                onSelect={setSelectedWidget}
                isSelected={selectedWidget?.id === widget.id}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <Grid className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
            <p className="text-center mb-4">Add your first widget to get started with your dashboard</p>
            <button
              onClick={() => setIsAddingWidget(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Widget</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {isAddingWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsAddingWidget(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Widget</h3>
                <button
                  onClick={() => setIsAddingWidget(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {widgetTypes.map((widgetType) => (
                  <button
                    key={widgetType.type}
                    onClick={() => addWidget(widgetType.type)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <widgetType.icon className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">{widgetType.label}</h4>
                        <p className="text-sm text-gray-500 mt-1">{widgetType.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Dashboard Widget Component
function DashboardWidget({ 
  widget, 
  isEditMode, 
  onUpdate, 
  onDelete, 
  onRefresh, 
  onSelect, 
  isSelected 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getGridSpan = () => {
    return {
      gridColumn: `span ${widget.size.width}`,
      gridRow: `span ${widget.size.height}`
    };
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'kpi':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-3xl font-bold text-blue-600">{widget.data?.value || '0'}</div>
            <div className="text-sm text-gray-500 mt-1">{widget.data?.label || 'KPI'}</div>
            {widget.data?.change && (
              <div className={`text-xs mt-1 ${widget.data.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {widget.data.change > 0 ? '+' : ''}{widget.data.change}%
              </div>
            )}
          </div>
        );
        
      case 'chart':
        return (
          <div className="h-full p-2">
            <div className="bg-gray-100 h-full rounded flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">Chart Widget</div>
              </div>
            </div>
          </div>
        );
        
      case 'table':
        return (
          <div className="h-full p-2 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Item</th>
                  <th className="text-right p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {(widget.data?.rows || []).map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-2">{row[0]}</td>
                    <td className="p-2 text-right">{row[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'text':
        return (
          <div className="h-full p-4 overflow-auto">
            <div className="text-sm text-gray-700">
              {widget.data?.content || 'Text content goes here...'}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Grid className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">Widget</div>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={getGridSpan()}
      className={`bg-white rounded-lg shadow-sm border transition-all relative ${
        isEditMode ? 'cursor-move' : ''
      } ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(widget)}
    >
      {/* Widget Header */}
      {(isHovered || isEditMode) && (
        <div className="absolute top-2 right-2 flex items-center space-x-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh(widget.id);
            }}
            className="p-1 bg-white rounded shadow hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3 text-gray-600" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-1 bg-white rounded shadow hover:bg-gray-50"
            title="Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3 h-3 text-gray-600" />
            ) : (
              <Maximize2 className="w-3 h-3 text-gray-600" />
            )}
          </button>
          
          {isEditMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(widget.id);
              }}
              className="p-1 bg-white rounded shadow hover:bg-red-50"
              title="Delete"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          )}
        </div>
      )}

      {/* Widget Title */}
      <div className="p-3 border-b border-gray-100">
        <h3 className="font-medium text-gray-900 text-sm truncate">{widget.title}</h3>
      </div>

      {/* Widget Content */}
      <div className="flex-1" style={{ height: 'calc(100% - 60px)' }}>
        {renderWidgetContent()}
      </div>

      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
          <Move className="w-6 h-6 text-blue-600" />
        </div>
      )}
    </motion.div>
  );
}
