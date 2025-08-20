import { motion } from 'framer-motion';
import {
  Grid3X3,
  Plus,
  Eye,
  Save,
  Trash2,
  Edit3,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Layout
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import visualizationService from '../../services/visualizationService';

const DashboardBuilder = ({ onDashboardSaved }) => {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [chartTemplates, setChartTemplates] = useState([]);
  const [themes, setThemes] = useState([]);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const dashboardList = visualizationService.getDashboards();
    const widgets = visualizationService.getWidgets();
    const templates = visualizationService.getChartTemplates();
    const themeList = visualizationService.getThemes();

    setDashboards(dashboardList);
    setAvailableWidgets(widgets);
    setChartTemplates(templates);
    setThemes(themeList);

    if (dashboardList.length > 0 && !selectedDashboard) {
      setSelectedDashboard(dashboardList[0]);
    }
  };

  const createNewDashboard = () => {
    const newDashboard = visualizationService.createDashboard({
      name: 'New Dashboard',
      description: 'Custom dashboard',
      layout: {
        grid: { rows: 6, cols: 12 },
        widgets: []
      }
    });

    setDashboards([...dashboards, newDashboard]);
    setSelectedDashboard(newDashboard);
    setIsEditing(true);
  };

  const saveDashboard = () => {
    if (selectedDashboard) {
      const updated = visualizationService.updateDashboard(selectedDashboard.id, selectedDashboard);
      setSelectedDashboard(updated);

      const updatedDashboards = dashboards.map(d =>
        d.id === updated.id ? updated : d
      );
      setDashboards(updatedDashboards);
      setIsEditing(false);

      onDashboardSaved?.(updated);
    }
  };

  const deleteDashboard = (dashboardId) => {
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      visualizationService.deleteDashboard(dashboardId);
      const filtered = dashboards.filter(d => d.id !== dashboardId);
      setDashboards(filtered);

      if (selectedDashboard?.id === dashboardId) {
        setSelectedDashboard(filtered[0] || null);
      }
    }
  };

  const addWidget = (widget, position) => {
    if (!selectedDashboard || !isEditing) return;

    const newWidget = {
      ...widget,
      x: position?.x || 0,
      y: position?.y || 0,
      w: widget.size?.width || 4,
      h: widget.size?.height || 2
    };

    const updatedDashboard = {
      ...selectedDashboard,
      layout: {
        ...selectedDashboard.layout,
        widgets: [...selectedDashboard.layout.widgets, newWidget]
      }
    };

    setSelectedDashboard(updatedDashboard);
  };

  const removeWidget = (widgetId) => {
    if (!selectedDashboard || !isEditing) return;

    const updatedDashboard = {
      ...selectedDashboard,
      layout: {
        ...selectedDashboard.layout,
        widgets: selectedDashboard.layout.widgets.filter(w => w.id !== widgetId)
      }
    };

    setSelectedDashboard(updatedDashboard);
  };

  const updateWidgetPosition = (widgetId, newPosition) => {
    if (!selectedDashboard || !isEditing) return;

    const updatedDashboard = {
      ...selectedDashboard,
      layout: {
        ...selectedDashboard.layout,
        widgets: selectedDashboard.layout.widgets.map(w =>
          w.id === widgetId ? { ...w, ...newPosition } : w
        )
      }
    };

    setSelectedDashboard(updatedDashboard);
  };

  const createVisualization = (config) => {
    const visualization = visualizationService.createVisualization(config);

    // Add as widget to current dashboard
    if (selectedDashboard && isEditing) {
      addWidget({
        id: `viz_${visualization.id}`,
        name: visualization.name,
        type: 'visualization',
        config: { visualizationId: visualization.id }
      });
    }

    return visualization;
  };

  const getWidgetIcon = (type) => {
    const icons = {
      chart: BarChart3,
      metrics_grid: Grid3X3,
      heatmap: Activity,
      summary_card: Layout,
      visualization: TrendingUp
    };
    return icons[type] || BarChart3;
  };

  const renderWidgetLibrary = () => (
    <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Widget Library</h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Available Widgets</h4>
          <div className="space-y-2">
            {availableWidgets.map((widget) => {
              const Icon = getWidgetIcon(widget.type);
              return (
                <motion.div
                  key={widget.id}
                  draggable
                  onDragStart={() => setDraggedWidget(widget)}
                  onDragEnd={() => setDraggedWidget(null)}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={16} />
                    <span className="text-sm font-medium">{widget.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{widget.category}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Chart Templates</h4>
          <div className="space-y-2">
            {chartTemplates.map((template) => (
              <motion.div
                key={template.type}
                whileHover={{ scale: 1.02 }}
                onClick={() => createVisualization({
                  name: template.name,
                  template: template.type,
                  type: template.type,
                  data: [] // Would be populated from data source
                })}
                className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <PieChart size={16} />
                  <span className="text-sm font-medium">{template.name}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{template.category}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboardGrid = () => {
    if (!selectedDashboard) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Grid3X3 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Selected</h3>
            <p className="text-gray-600 mb-4">Create a new dashboard to get started</p>
            <button
              onClick={createNewDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Dashboard
            </button>
          </div>
        </div>
      );
    }

    const { grid, widgets } = selectedDashboard.layout;
    const cellWidth = 100 / grid.cols;
    const cellHeight = 80; // pixels

    return (
      <div className="flex-1 p-6 overflow-auto">
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-lg"
          style={{ height: grid.rows * cellHeight }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedWidget && isEditing) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.floor(((e.clientX - rect.left) / rect.width) * grid.cols);
              const y = Math.floor(((e.clientY - rect.top) / rect.height) * grid.rows);
              addWidget(draggedWidget, { x, y });
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Grid overlay for editing */}
          {isEditing && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: grid.rows }).map((_, row) =>
                Array.from({ length: grid.cols }).map((_, col) => (
                  <div
                    key={`${row}-${col}`}
                    className="absolute border border-gray-200"
                    style={{
                      left: `${col * cellWidth}%`,
                      top: `${row * cellHeight}px`,
                      width: `${cellWidth}%`,
                      height: `${cellHeight}px`
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* Widgets */}
          {widgets.map((widget) => {
            const Icon = getWidgetIcon(widget.type);
            return (
              <motion.div
                key={widget.id}
                className={`absolute bg-white border rounded-lg shadow-sm ${
                  isEditing ? 'border-blue-300 hover:border-blue-500' : 'border-gray-200'
                }`}
                style={{
                  left: `${widget.x * cellWidth}%`,
                  top: `${widget.y * cellHeight}px`,
                  width: `${widget.w * cellWidth}%`,
                  height: `${widget.h * cellHeight}px`
                }}
                drag={isEditing}
                onDragEnd={(_, info) => {
                  const rect = info.point;
                  const parent = document.querySelector('.relative');
                  const parentRect = parent.getBoundingClientRect();
                  const x = Math.floor(((rect.x - parentRect.left) / parentRect.width) * grid.cols);
                  const y = Math.floor(((rect.y - parentRect.top) / parentRect.height) * grid.rows);
                  updateWidgetPosition(widget.id, { x: Math.max(0, x), y: Math.max(0, y) });
                }}
              >
                <div className="h-full p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon size={16} />
                      <span className="text-sm font-medium">{widget.name}</span>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeWidget(widget.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 bg-gray-50 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-500">
                      {widget.type.replace('_', ' ')} widget
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDashboardList = () => (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Dashboards</h3>
        <button
          onClick={createNewDashboard}
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {dashboards.map((dashboard) => (
          <motion.div
            key={dashboard.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedDashboard(dashboard)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedDashboard?.id === dashboard.id
                ? 'bg-blue-100 border-blue-300'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{dashboard.name}</h4>
                <p className="text-xs text-gray-600">{dashboard.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboard.layout.widgets.length} widgets
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDashboard(dashboard.id);
                }}
                className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Layout className="mr-3 text-blue-600" size={28} />
              Dashboard Builder
            </h1>
            <p className="text-gray-600 mt-1">
              Create and customize interactive financial dashboards
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {selectedDashboard && (
              <>
                <select
                  value={selectedDashboard.theme}
                  onChange={(e) => setSelectedDashboard({
                    ...selectedDashboard,
                    theme: e.target.value
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {themes.map(theme => (
                    <option key={theme.id || theme.name} value={theme.id || theme.name}>
                      {theme.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    previewMode
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isEditing
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Edit3 size={16} />
                  <span>{isEditing ? 'Stop Editing' : 'Edit'}</span>
                </button>

                {isEditing && (
                  <button
                    onClick={saveDashboard}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save size={16} />
                    <span>Save</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {!previewMode && renderDashboardList()}
        {isEditing && !previewMode && renderWidgetLibrary()}
        {renderDashboardGrid()}
      </div>
    </div>
  );
};

export default DashboardBuilder;
