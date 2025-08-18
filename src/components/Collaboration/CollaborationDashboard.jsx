/**
 * Real-Time Collaboration Dashboard
 * Main interface for managing workspaces, sharing models, and real-time collaboration
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Users,
  MessageCircle,
  Video,
  Clock,
  User,
  Plus,
  ChevronRight,
  Edit3,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useState, useCallback } from 'react';

import { useCollaboration, useWorkspace, usePresence } from '../../hooks/useCollaboration';
import SEOHead from '../SEO/SEOHead';

const CollaborationDashboard = ({
  userId,
  userProfile,
  isVisible = true,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [workspaceFilter, setWorkspaceFilter] = useState('all');

  // Collaboration hooks
  const {
    isInitialized,
    connectionStatus,
    currentWorkspace,
    members: _members2,
    isLoading,
    error,
    joinWorkspace,
    leaveWorkspace: _leaveWorkspace,
    shareModel: _shareModel,
    getWorkspaceModels: _getWorkspaceModels
  } = useCollaboration(userId, userProfile);

  const {
    workspace: _workspace,
    members: _members,
    models: _models,
    activity: _activity,
    workspaceLoading: _workspaceLoading
  } = useWorkspace(selectedWorkspace?.id);

  const {
    cursors,
    presence: _presence,
    updateCursor: _updateCursor
  } = usePresence(selectedWorkspace?.id);

  // Demo data
  const _workspaceMembers = [
    { id: '1', name: 'Alex Chen', email: 'alex@company.com', role: 'Owner', status: 'online' },
    { id: '2', name: 'Sarah Kim', email: 'sarah@company.com', role: 'Editor', status: 'away' }
  ];

  // Handle workspace creation
  const handleCreateWorkspace = useCallback(async() => {
    if (!newWorkspaceName.trim()) return;

    try {
      const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newWorkspace = await joinWorkspace(workspaceId, {
        name: newWorkspaceName,
        description: `Collaborative workspace created by ${userProfile.name || 'User'}`,
        isPublic: false,
        allowGuests: false
      });

      setSelectedWorkspace(newWorkspace);
      setNewWorkspaceName('');
      setShowCreateWorkspace(false);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  }, [newWorkspaceName, joinWorkspace, userProfile.name]);

  // Handle workspace selection
  const handleSelectWorkspace = useCallback(async(workspaceId) => {
    try {
      if (currentWorkspace?.id !== workspaceId) {
        await joinWorkspace(workspaceId);
      }
      setSelectedWorkspace(currentWorkspace || { id: workspaceId });
    } catch (err) {
      console.error('Failed to select workspace:', err);
    }
  }, [currentWorkspace, joinWorkspace]);

  // Demo workspaces for showcase
  const demoWorkspaces = [
    {
      id: 'portfolio_analysis',
      name: 'Portfolio Analysis Q4',
      description: 'Quarterly portfolio review and optimization',
      members: 5,
      models: 3,
      isActive: true,
      lastActivity: '2 minutes ago',
      type: 'financial_analysis'
    },
    {
      id: 'risk_modeling',
      name: 'Risk Modeling Team',
      description: 'Advanced risk assessment and Monte Carlo simulations',
      members: 8,
      models: 12,
      isActive: true,
      lastActivity: '5 minutes ago',
      type: 'risk_analysis'
    },
    {
      id: 'market_research',
      name: 'Market Research Hub',
      description: 'Real-time market analysis and trend identification',
      members: 12,
      models: 8,
      isActive: false,
      lastActivity: '1 hour ago',
      type: 'market_analysis'
    }
  ];

  // Filter workspaces based on current filter
  const filteredWorkspaces = demoWorkspaces.filter(ws => {
    if (workspaceFilter === 'all') return true;
    if (workspaceFilter === 'active') return ws.isActive;
    if (workspaceFilter === 'my') return ws.type === 'financial_analysis';
    return true;
  });

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <SEOHead
        title="Real-Time Collaboration - FinanceAnalyst Pro"
        description="Collaborate in real-time on financial models, share insights, and work together with your team"
        canonical="/collaboration"
      />

      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Real-Time Collaboration</h2>
                <p className="text-blue-200 text-sm">
                  Work together on financial models and analysis
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {connectionStatus.connected ? (
                  <>
                    <Video className="w-4 h-4 text-green-300" />
                    <span className="text-sm text-green-300">Connected</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 text-red-300" />
                    <span className="text-sm text-red-300">Disconnected</span>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            <span className="ml-3 text-gray-600">Initializing collaboration...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        {isInitialized && !isLoading && (
          <>
            <div className="border-b border-gray-200 px-6">
              <div className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: Clock },
                  { id: 'workspaces', label: 'Workspaces', icon: Users },
                  { id: 'models', label: 'Shared Models', icon: Share2 },
                  { id: 'presence', label: 'Live Presence', icon: MessageCircle }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">Active Workspaces</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {filteredWorkspaces.filter(ws => ws.isActive).length}
                            </p>
                          </div>
                          <Users className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Shared Models</p>
                            <p className="text-2xl font-bold text-green-900">
                              {demoWorkspaces.reduce((sum, ws) => sum + ws.models, 0)}
                            </p>
                          </div>
                          <Share2 className="w-8 h-8 text-green-500" />
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Team Members</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {demoWorkspaces.reduce((sum, ws) => sum + ws.members, 0)}
                            </p>
                          </div>
                          <User className="w-8 h-8 text-purple-500" />
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-600 text-sm font-medium">Connection Status</p>
                            <p className="text-sm font-bold text-orange-900">
                              {connectionStatus.connected ? 'Online' : 'Offline'}
                            </p>
                          </div>
                          {connectionStatus.connected ? (
                            <Video className="w-8 h-8 text-orange-500" />
                          ) : (
                            <Video className="w-8 h-8 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {[
                          {
                            user: 'Sarah Chen',
                            action: 'shared a new portfolio model',
                            workspace: 'Portfolio Analysis Q4',
                            time: '2 minutes ago',
                            type: 'model_shared'
                          },
                          {
                            user: 'Mike Rodriguez',
                            action: 'updated risk parameters',
                            workspace: 'Risk Modeling Team',
                            time: '5 minutes ago',
                            type: 'model_updated'
                          },
                          {
                            user: 'Emma Thompson',
                            action: 'added a comment',
                            workspace: 'Market Research Hub',
                            time: '12 minutes ago',
                            type: 'comment_added'
                          }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                activity.type === 'model_shared' ? 'bg-green-500' :
                                  activity.type === 'model_updated' ? 'bg-blue-500' : 'bg-purple-500'
                              }`}
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{activity.user}</span> {activity.action}
                              </p>
                              <p className="text-xs text-gray-500">
                                in {activity.workspace} • {activity.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Workspaces Tab */}
                {activeTab === 'workspaces' && (
                  <motion.div
                    key="workspaces"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Workspace Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">Workspaces</h3>
                        <select
                          value={workspaceFilter}
                          onChange={(e) => setWorkspaceFilter(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                        >
                          <option value="all">All Workspaces</option>
                          <option value="active">Active Only</option>
                          <option value="my">My Workspaces</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setShowCreateWorkspace(true)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Workspace</span>
                      </button>
                    </div>

                    {/* Create Workspace Modal */}
                    <AnimatePresence>
                      {showCreateWorkspace && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
                        >
                          <h4 className="font-semibold text-gray-900">Create New Workspace</h4>
                          <input
                            type="text"
                            placeholder="Workspace name..."
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                          />
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={handleCreateWorkspace}
                              disabled={!newWorkspaceName.trim()}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Create
                            </button>
                            <button
                              onClick={() => setShowCreateWorkspace(false)}
                              className="text-gray-600 hover:text-gray-800 px-4 py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Workspace List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredWorkspaces.map((workspace) => (
                        <motion.div
                          key={workspace.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                          onClick={() => handleSelectWorkspace(workspace.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{workspace.name}</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{workspace.description}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${workspace.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{workspace.members}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Share2 className="w-4 h-4" />
                                <span>{workspace.models}</span>
                              </span>
                            </div>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{workspace.lastActivity}</span>
                            </span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  workspace.type === 'financial_analysis' ? 'bg-blue-100 text-blue-800' :
                                    workspace.type === 'risk_analysis' ? 'bg-red-100 text-red-800' :
                                      'bg-green-100 text-green-800'
                                }`}
                              >
                                {workspace.type.replace('_', ' ')}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Models Tab */}
                {activeTab === 'models' && (
                  <motion.div
                    key="models"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">Shared Financial Models</h3>

                    {/* Demo Models */}
                    <div className="space-y-4">
                      {[
                        {
                          id: 'portfolio_opt_1',
                          name: 'Portfolio Optimization Model Q4',
                          description: 'Advanced portfolio optimization using Modern Portfolio Theory',
                          sharedBy: 'Sarah Chen',
                          workspace: 'Portfolio Analysis Q4',
                          lastModified: '10 minutes ago',
                          permissions: 'edit',
                          collaborators: 3,
                          type: 'portfolio'
                        },
                        {
                          id: 'risk_var_1',
                          name: 'VaR Risk Assessment Model',
                          description: 'Value at Risk calculation with Monte Carlo simulation',
                          sharedBy: 'Mike Rodriguez',
                          workspace: 'Risk Modeling Team',
                          lastModified: '1 hour ago',
                          permissions: 'view',
                          collaborators: 5,
                          type: 'risk'
                        },
                        {
                          id: 'market_trend_1',
                          name: 'Market Trend Analysis',
                          description: 'Real-time market trend identification and forecasting',
                          sharedBy: 'Emma Thompson',
                          workspace: 'Market Research Hub',
                          lastModified: '3 hours ago',
                          permissions: 'comment',
                          collaborators: 2,
                          type: 'analysis'
                        }
                      ].map((model) => (
                        <div key={model.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{model.name}</h4>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    model.type === 'portfolio' ? 'bg-blue-100 text-blue-800' :
                                      model.type === 'risk' ? 'bg-red-100 text-red-800' :
                                        'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {model.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{model.description}</p>

                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <span>Shared by <strong>{model.sharedBy}</strong></span>
                                <span>in <strong>{model.workspace}</strong></span>
                                <span>Modified {model.lastModified}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>{model.collaborators}</span>
                              </div>

                              <div className="flex items-center space-x-1">
                                {model.permissions === 'edit' && <Edit3 className="w-4 h-4 text-green-500" />}
                                {model.permissions === 'view' && <Eye className="w-4 h-4 text-blue-500" />}
                                {model.permissions === 'comment' && <MessageSquare className="w-4 h-4 text-purple-500" />}
                              </div>

                              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                                Open
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Presence Tab */}
                {activeTab === 'presence' && (
                  <motion.div
                    key="presence"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">Live Presence & Activity</h3>

                    {/* Active Users */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Currently Online</h4>
                      <div className="flex items-center space-x-4">
                        {[
                          { name: 'Sarah Chen', avatar: 'SC', status: 'editing', workspace: 'Portfolio Analysis' },
                          { name: 'Mike Rodriguez', avatar: 'MR', status: 'viewing', workspace: 'Risk Modeling' },
                          { name: 'Emma Thompson', avatar: 'ET', status: 'commenting', workspace: 'Market Research' }
                        ].map((user, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="relative">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {user.avatar}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.status} in {user.workspace}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Real-time Cursors */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Real-time Cursors</h4>
                      <div className="space-y-2">
                        {cursors.map((cursor, index) => (
                          <div key={index} className="flex items-center space-x-3 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-gray-600">
                              User {cursor.userId} at position ({cursor.position?.x || 0}, {cursor.position?.y || 0})
                            </span>
                            <span className="text-gray-400 text-xs">
                              {new Date(cursor.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                        {cursors.length === 0 && (
                          <p className="text-gray-500 text-sm">No active cursors in current workspace</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CollaborationDashboard;
