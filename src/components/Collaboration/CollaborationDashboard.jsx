import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Settings,
  Share,
  Clock,
  UserPlus,
  FileText,
  GitBranch,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Activity,
  Calendar,
  BarChart3,
  UserCheck,
  UserX
} from 'lucide-react';

import collaborationService from '../../services/collaboration/collaborationService';

const CollaborationDashboard = ({
  userId,
  userInfo = {},
  onWorkspaceSelect,
  onCreateWorkspace,
  className = ''
}) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load user's workspaces on mount
  useEffect(() => {
    loadUserWorkspaces();
  }, [userId]);

  // Load workspace details when active workspace changes
  useEffect(() => {
    if (activeWorkspace) {
      loadWorkspaceDetails(activeWorkspace.id);
    }
  }, [activeWorkspace]);

  const loadUserWorkspaces = async () => {
    try {
      setLoading(true);
      const userWorkspaces = await collaborationService.getUserWorkspaces(userId);
      setWorkspaces(userWorkspaces);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceDetails = async workspaceId => {
    try {
      const [users, audit] = await Promise.all([
        collaborationService.getWorkspaceUsers(workspaceId),
        collaborationService.getAuditLog(workspaceId, { limit: 50 })
      ]);

      setWorkspaceUsers(users);
      setAuditLog(audit);
    } catch (error) {
      console.error('Failed to load workspace details:', error);
    }
  };

  const handleCreateWorkspace = async workspaceData => {
    try {
      const workspaceId = await collaborationService.createWorkspace(
        workspaceData.name,
        userId,
        workspaceData.settings
      );

      await loadUserWorkspaces();
      setShowCreateModal(false);

      if (onCreateWorkspace) {
        onCreateWorkspace(workspaceId);
      }
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleWorkspaceSelect = workspace => {
    setActiveWorkspace(workspace);
    if (onWorkspaceSelect) {
      onWorkspaceSelect(workspace);
    }
  };

  const handleInviteUser = async invitationData => {
    try {
      await collaborationService.inviteUserToWorkspace(
        activeWorkspace.id,
        userId,
        invitationData.email,
        invitationData.role
      );

      await loadWorkspaceDetails(activeWorkspace.id);
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  };

  // Filter workspaces based on search and filter
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(workspace => {
      const matchesSearch = workspace.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'owned' && workspace.ownerId === userId) ||
        (filter === 'shared' && workspace.ownerId !== userId) ||
        (filter === 'active' && workspace.activeSessions.size > 0);

      return matchesSearch && matchesFilter;
    });
  }, [workspaces, searchTerm, filter]);

  // Calculate workspace statistics
  const workspaceStats = useMemo(() => {
    const total = workspaces.length;
    const owned = workspaces.filter(w => w.ownerId === userId).length;
    const shared = total - owned;
    const active = workspaces.filter(w => w.activeSessions.size > 0).length;

    return { total, owned, shared, active };
  }, [workspaces, userId]);

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserRole = userId => {
    const member = workspaceUsers.find(u => u.userId === userId);
    return member?.role || 'Unknown';
  };

  const getActivityIcon = eventType => {
    switch (eventType) {
      case 'user_joined_workspace':
        return <UserPlus className="w-4 h-4 text-green-400" />;
      case 'user_left_workspace':
        return <UserX className="w-4 h-4 text-red-400" />;
      case 'document_edited':
        return <Edit className="w-4 h-4 text-blue-400" />;
      case 'version_created':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      case 'workspace_created':
        return <Plus className="w-4 h-4 text-green-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Collaboration</h3>
            <p className="text-xs text-slate-400">
              {workspaceStats.total} workspaces • {workspaceStats.active} active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Workspaces</option>
            <option value="owned">My Workspaces</option>
            <option value="shared">Shared with Me</option>
            <option value="active">Active Now</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-96">
        {/* Workspaces List */}
        <div className="w-1/3 border-r border-slate-700 p-4">
          <h4 className="text-white font-medium mb-4">Workspaces</h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWorkspaces.map(workspace => (
                <div
                  key={workspace.id}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeWorkspace?.id === workspace.id
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-white font-medium truncate">{workspace.name}</h5>
                    <div className="flex items-center gap-1">
                      {workspace.activeSessions.size > 0 && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                      {workspace.ownerId === userId && (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{workspace.members.length} members</span>
                    <span>{workspace.documentCount} documents</span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1">
                    Updated {formatDate(workspace.updatedAt)}
                  </div>
                </div>
              ))}

              {filteredWorkspaces.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  {searchTerm || filter !== 'all'
                    ? 'No workspaces match your search'
                    : 'No workspaces yet. Create your first workspace!'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workspace Details */}
        <div className="flex-1 p-4">
          {activeWorkspace ? (
            <div className="space-y-6">
              {/* Workspace Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold text-white">{activeWorkspace.name}</h4>
                  <p className="text-sm text-slate-400">
                    {workspaceUsers.length} members • {activeWorkspace.documentCount} documents
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeWorkspace.ownerId === userId && (
                    <>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </button>

                      <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        aria-label="Workspace settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-medium mb-4">Members</h5>

                <div className="space-y-3">
                  {workspaceUsers.map(member => (
                    <div key={member.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {member.userId.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{member.userId}</div>
                          <div className="text-xs text-slate-400 capitalize">{member.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {member.isOnline && (
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        )}
                        <span className="text-xs text-slate-400">
                          Joined {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-medium mb-4">Recent Activity</h5>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {auditLog.slice(0, 20).map(entry => (
                    <div key={entry.id} className="flex items-start gap-3">
                      {getActivityIcon(entry.type)}
                      <div className="flex-1">
                        <div className="text-white text-sm">
                          {entry.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-slate-400">
                          {entry.data.userId} • {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {auditLog.length === 0 && (
                    <div className="text-center py-4 text-slate-400">No recent activity</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h4 className="text-lg font-medium mb-2">Select a Workspace</h4>
                <p>Choose a workspace to view its details and collaborate</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkspace}
        />
      )}

      {/* Invite User Modal */}
      {showInviteModal && activeWorkspace && (
        <InviteUserModal
          workspace={activeWorkspace}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUser}
        />
      )}

      {/* Workspace Settings Modal */}
      {showSettingsModal && activeWorkspace && (
        <WorkspaceSettingsModal
          workspace={activeWorkspace}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};

// Create Workspace Modal Component
const CreateWorkspaceModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowGuestAccess, setAllowGuestAccess] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();

    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim(),
      settings: {
        isPublic,
        allowGuestAccess,
        versionControl: true,
        auditLogging: true
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Create New Workspace</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter workspace name"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Describe your workspace"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-slate-300">
                Make workspace public
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowGuestAccess"
                checked={allowGuestAccess}
                onChange={e => setAllowGuestAccess(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="allowGuestAccess" className="ml-2 text-sm text-slate-300">
                Allow guest access
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invite User Modal Component
const InviteUserModal = ({ workspace, onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const handleSubmit = e => {
    e.preventDefault();

    if (!email.trim()) return;

    onInvite({
      email: email.trim(),
      role
    });

    setEmail('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Invite User to {workspace.name}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">Viewer - Read only access</option>
              <option value="editor">Editor - Read and edit access</option>
              <option value="admin">Admin - Manage workspace</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Workspace Settings Modal Component
const WorkspaceSettingsModal = ({ workspace, onClose }) => {
  const [settings, setSettings] = useState(workspace.settings);

  const handleSave = () => {
    // In real implementation, this would update the workspace settings
    console.log('Saving workspace settings:', settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Workspace Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Workspace Name</label>
            <input
              type="text"
              value={workspace.name}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              readOnly
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Public Workspace</span>
              <input
                type="checkbox"
                checked={settings.isPublic}
                onChange={e => setSettings({ ...settings, isPublic: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Version Control</span>
              <input
                type="checkbox"
                checked={settings.versionControl}
                onChange={e => setSettings({ ...settings, versionControl: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Audit Logging</span>
              <input
                type="checkbox"
                checked={settings.auditLogging}
                onChange={e => setSettings({ ...settings, auditLogging: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationDashboard;
