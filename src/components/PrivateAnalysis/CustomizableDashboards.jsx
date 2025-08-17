/**
 * Customizable Dashboards Component
 * Provides drag-and-drop dashboard customization with widgets and analytics
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Settings,
  Grid3X3,
  BarChart3,
  PieChart,
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  Users,
  Calendar,
  Clock,
  Download,
  Share2,
  Edit3,
  Trash2,
  Move,
  Maximize2,
  Minimize2,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Bookmark,
  Star,
  Zap,
  AlertTriangle
} from 'lucide-react';
import React, { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CustomizableDashboards = ({ modelData, onDataChange }) => {
  const [dashboards, setDashboards] = useState([
    {
      id: 1,
      name: 'Executive Summary',
      description: 'High-level KPIs and executive metrics',
      isDefault: true,
      layout: 'grid',
      widgets: ['kpi-summary', 'revenue-chart', 'valuation-metrics', 'risk-indicators']
    },
    {
      id: 2,
      name: 'Financial Analysis',
      description: 'Detailed financial modeling and analysis',
      isDefault: false,
      layout: 'grid',
      widgets: ['dcf-results', 'lbo-metrics', 'scenario-comparison', 'sensitivity-analysis']
    }
  ]);

  const [activeDashboard, setActiveDashboard] = useState(dashboards[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  const [availableWidgets] = useState([
    {
      id: 'kpi-summary',
      name: 'KPI Summary',
      category: 'Overview',
      icon: Target,
      description: 'Key performance indicators and metrics',
      size: { width: 2, height: 1 }
    },
    {
      id: 'revenue-chart',
      name: 'Revenue Growth',
      category: 'Charts',
      icon: TrendingUp,
      description: 'Revenue growth trends and projections',
      size: { width: 2, height: 2 }
    },
    {
      id: 'valuation-metrics',
      name: 'Valuation Metrics',
      category: 'Valuation',
      icon: DollarSign,
      description: 'Enterprise value and equity metrics',
      size: { width: 2, height: 1 }
    },
    {
      id: 'risk-indicators',
      name: 'Risk Indicators',
      category: 'Risk',
      icon: AlertTriangle,
      description: 'Risk metrics and alerts',
      size: { width: 1, height: 1 }
    },
    {
      id: 'dcf-results',
      name: 'DCF Analysis',
      category: 'Valuation',
      icon: BarChart3,
      description: 'Discounted cash flow results',
      size: { width: 3, height: 2 }
    },
    {
      id: 'lbo-metrics',
      name: 'LBO Metrics',
      category: 'Private Equity',
      icon: PieChart,
      description: 'LBO analysis and returns',
      size: { width: 2, height: 2 }
    },
    {
      id: 'scenario-comparison',
      name: 'Scenario Analysis',
      category: 'Analysis',
      icon: Activity,
      description: 'Compare multiple scenarios',
      size: { width: 3, height: 2 }
    },
    {
      id: 'sensitivity-analysis',
      name: 'Sensitivity Analysis',
      category: 'Analysis',
      icon: Grid3X3,
      description: 'Key driver sensitivity',
      size: { width: 2, height: 2 }
    },
    {
      id: 'market-data',
      name: 'Market Data',
      category: 'Market',
      icon: TrendingUp,
      description: 'Real-time market indicators',
      size: { width: 2, height: 1 }
    },
    {
      id: 'team-activity',
      name: 'Team Activity',
      category: 'Collaboration',
      icon: Users,
      description: 'Team collaboration metrics',
      size: { width: 1, height: 1 }
    }
  ]);

  // Sample data for widgets
  const revenueData = [
    { year: '2021', revenue: 100, projected: false },
    { year: '2022', revenue: 120, projected: false },
    { year: '2023', revenue: 145, projected: false },
    { year: '2024', revenue: 170, projected: true },
    { year: '2025', revenue: 195, projected: true },
    { year: '2026', revenue: 220, projected: true }
  ];

  const scenarioData = [
    { scenario: 'Base Case', dcf: 1200, lbo: 850, probability: 60 },
    { scenario: 'Upside', dcf: 1450, lbo: 1020, probability: 25 },
    { scenario: 'Downside', dcf: 980, lbo: 680, probability: 15 }
  ];

  const kpiData = [
    { label: 'Enterprise Value', value: '$1.2B', change: '+12%', positive: true },
    { label: 'Equity Value', value: '$950M', change: '+8%', positive: true },
    { label: 'IRR', value: '18.5%', change: '+2.1%', positive: true },
    { label: 'MOIC', value: '2.4x', change: '+0.3x', positive: true }
  ];

  const handleAddWidget = (widgetId) => {
    const updatedDashboard = {
      ...activeDashboard,
      widgets: [...activeDashboard.widgets, widgetId]
    };
    setActiveDashboard(updatedDashboard);
    setDashboards(prev => prev.map(d => d.id === activeDashboard.id ? updatedDashboard : d));
    setShowWidgetLibrary(false);
  };

  const handleRemoveWidget = (widgetId) => {
    const updatedDashboard = {
      ...activeDashboard,
      widgets: activeDashboard.widgets.filter(w => w !== widgetId)
    };
    setActiveDashboard(updatedDashboard);
    setDashboards(prev => prev.map(d => d.id === activeDashboard.id ? updatedDashboard : d));
  };

  const renderWidget = (widgetId) => {
    const widget = availableWidgets.find(w => w.id === widgetId);
    if (!widget) return null;

    const Icon = widget.icon;

    switch (widgetId) {
      case 'kpi-summary':
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Icon className="w-5 h-5 mr-2 text-blue-600" />
                KPI Summary
              </h3>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widgetId)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {kpiData.map((kpi, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                  <div className="text-sm text-gray-600">{kpi.label}</div>
                  <div className={`text-xs ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'revenue-chart':
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Icon className="w-5 h-5 mr-2 text-green-600" />
                Revenue Growth
              </h3>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widgetId)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray={(entry) => entry.projected ? '5 5' : '0'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scenario-comparison':
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Icon className="w-5 h-5 mr-2 text-purple-600" />
                Scenario Analysis
              </h3>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widgetId)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="dcf" fill="#3B82F6" name="DCF Value" />
                <Bar dataKey="lbo" fill="#10B981" name="LBO Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Icon className="w-5 h-5 mr-2 text-gray-600" />
                {widget.name}
              </h3>
              {isEditing && (
                <button
                  onClick={() => handleRemoveWidget(widgetId)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <Icon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{widget.description}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-3" />
            Customizable Dashboards
          </h2>
          <p className="text-indigo-100 mt-2">
            Create personalized dashboards with drag-and-drop widgets and real-time analytics
          </p>
        </div>

        {/* Dashboard Controls */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={activeDashboard.id}
                onChange={(e) => {
                  const dashboard = dashboards.find(d => d.id === parseInt(e.target.value));
                  setActiveDashboard(dashboard);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {dashboards.map((dashboard) => (
                  <option key={dashboard.id} value={dashboard.id}>
                    {dashboard.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                  isEditing
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {isEditing ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Done Editing
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Dashboard
                  </>
                )}
              </button>

              {isEditing && (
                <button
                  onClick={() => setShowWidgetLibrary(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button className="text-gray-600 hover:text-gray-800 p-2">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="text-gray-600 hover:text-gray-800 p-2">
                <Download className="w-4 h-4" />
              </button>
              <button className="text-gray-600 hover:text-gray-800 p-2">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="text-gray-600 hover:text-gray-800 p-2">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {isEditing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Edit3 className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-yellow-900">Edit Mode Active</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Drag widgets to reorder, click the + button to add new widgets, or use the trash icon to remove widgets.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDashboard.widgets.map((widgetId) => (
              <motion.div
                key={widgetId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={isEditing ? 'cursor-move' : ''}
              >
                {renderWidget(widgetId)}
              </motion.div>
            ))}

            {activeDashboard.widgets.length === 0 && (
              <div className="col-span-full text-center py-12">
                <LayoutDashboard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets in this dashboard</h3>
                <p className="text-gray-600 mb-4">Start building your dashboard by adding some widgets.</p>
                <button
                  onClick={() => setShowWidgetLibrary(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Widget
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widget Library Modal */}
      <AnimatePresence>
        {showWidgetLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Widget Library</h3>
                <button
                  onClick={() => setShowWidgetLibrary(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableWidgets
                  .filter(widget => !activeDashboard.widgets.includes(widget.id))
                  .map((widget) => {
                    const Icon = widget.icon;
                    return (
                      <motion.div
                        key={widget.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleAddWidget(widget.id)}
                      >
                        <div className="flex items-center mb-3">
                          <Icon className="w-6 h-6 text-indigo-600 mr-3" />
                          <div>
                            <h4 className="font-medium text-gray-900">{widget.name}</h4>
                            <span className="text-xs text-gray-500">{widget.category}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{widget.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {widget.size.width}x{widget.size.height}
                          </span>
                          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium">
                            Add Widget
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomizableDashboards;
