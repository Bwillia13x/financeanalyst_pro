import { Users, Plus, Search, Settings, UserPlus, GitBranch, Edit, Activity, UserX } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import collaborationService from '../../services/collaboration/collaborationService';

const CollaborationDashboard = ({
  userId,
  userInfo: _userInfo = {},
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

  const getActivityIcon = eventType => {
    switch (eventType) {
      case 'user_joined_workspace':
        return <UserPlus className="w-4 h-4 text-success" />;
      case 'user_left_workspace':
        return <UserX className="w-4 h-4 text-destructive" />;
      case 'document_edited':
        return <Edit className="w-4 h-4 text-accent" />;
      case 'version_created':
        return <GitBranch className="w-4 h-4 text-accent" />;
      case 'workspace_created':
        return <Plus className="w-4 h-4 text-success" />;
      default:
        return <Activity className="w-4 h-4 text-foreground-secondary" />;
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Collaboration</h3>
            <p className="text-xs text-foreground-secondary">
              {workspaceStats.total} workspaces • {workspaceStats.active} active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-lg transition-colors hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground text-sm placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
        <div className="w-1/3 border-r border-border p-4">
          <h4 className="text-foreground font-medium mb-4">Workspaces</h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWorkspaces.map(workspace => (
                <div
                  key={workspace.id}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleWorkspaceSelect(workspace);
                    }
                  }}
                  aria-label={`Open workspace ${workspace.name}`}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    activeWorkspace?.id === workspace.id
                      ? 'bg-accent/10 border-accent/30'
                      : 'bg-muted hover:bg-muted/80 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-foreground font-medium truncate">{workspace.name}</h5>
                    <div className="flex items-center gap-1">
                      {workspace.activeSessions.size > 0 && (
                        <div className="w-2 h-2 bg-success rounded-full" />
                      )}
                      {workspace.ownerId === userId && (
                        <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-xs rounded">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-foreground-secondary">
                    <span>{workspace.members.length} members</span>
                    <span>{workspace.documentCount} documents</span>
                  </div>

                  <div className="text-xs text-foreground-secondary mt-1">
                    Updated {formatDate(workspace.updatedAt)}
                  </div>
                </div>
              ))}

              {filteredWorkspaces.length === 0 && (
                <div className="text-center py-8 text-foreground-secondary">
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
                  <h4 className="text-xl font-semibold text-foreground">{activeWorkspace.name}</h4>
                  <p className="text-sm text-foreground-secondary">
                    {workspaceUsers.length} members • {activeWorkspace.documentCount} documents
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeWorkspace.ownerId === userId && (
                    <>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-success text-success-foreground text-sm font-medium rounded-lg transition-colors hover:opacity-90"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </button>

                      <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        aria-label="Workspace settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="bg-muted rounded-lg p-4">
                <h5 className="text-foreground font-medium mb-4">Members</h5>

                <div className="space-y-3">
                  {workspaceUsers.map(member => (
                    <div key={member.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-foreground text-sm font-medium">
                            {member.userId.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-foreground font-medium">{member.userId}</div>
                          <div className="text-xs text-foreground-secondary capitalize">{member.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {member.isOnline && <div className="w-2 h-2 bg-success rounded-full" />}
                        <span className="text-xs text-foreground-secondary">
                          Joined {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-muted rounded-lg p-4">
                <h5 className="text-foreground font-medium mb-4">Recent Activity</h5>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {auditLog.slice(0, 20).map(entry => (
                    <div key={entry.id} className="flex items-start gap-3">
                      {getActivityIcon(entry.type)}
                      <div className="flex-1">
                        <div className="text-foreground text-sm">
                          {entry.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-foreground-secondary">
                          {entry.data.userId} • {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {auditLog.length === 0 && (
                    <div className="text-center py-4 text-foreground-secondary">No recent activity</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-foreground-secondary">
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
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Create New Workspace</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workspace-name" className="block text-sm text-foreground-secondary mb-2">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              id="workspace-name"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter workspace name"
              required
            />
          </div>

          <div>
            <label htmlFor="workspace-description" className="block text-sm text-foreground-secondary mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              id="workspace-description"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
                className="w-4 h-4 text-accent bg-muted border-border rounded focus:ring-ring"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-foreground-secondary">
                Make workspace public
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowGuestAccess"
                checked={allowGuestAccess}
                onChange={e => setAllowGuestAccess(e.target.checked)}
                className="w-4 h-4 text-accent bg-muted border-border rounded focus:ring-ring"
              />
              <label htmlFor="allowGuestAccess" className="ml-2 text-sm text-foreground-secondary">
                Allow guest access
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-foreground-secondary hover:text-foreground border border-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent hover:opacity-90 text-accent-foreground font-medium rounded-lg transition-colors"
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
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Invite User to {workspace.name}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="block text-sm text-foreground-secondary mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              id="invite-email"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-sm text-foreground-secondary mb-2">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              id="invite-role"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="flex-1 px-4 py-2 text-foreground-secondary hover:text-foreground border border-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-success hover:opacity-90 text-success-foreground font-medium rounded-lg transition-colors"
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
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Workspace Settings</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="settings-workspace-name" className="block text-sm text-foreground-secondary mb-2">Workspace Name</label>
            <input
              type="text"
              value={workspace.name}
              id="settings-workspace-name"
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground"
              readOnly
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-isPublic" className="text-sm text-foreground-secondary">Public Workspace</label>
              <input
                id="settings-isPublic"
                type="checkbox"
                checked={settings.isPublic}
                onChange={e => setSettings({ ...settings, isPublic: e.target.checked })}
                className="w-4 h-4 text-accent bg-muted border-border rounded focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="settings-versionControl" className="text-sm text-foreground-secondary">Version Control</label>
              <input
                id="settings-versionControl"
                type="checkbox"
                checked={settings.versionControl}
                onChange={e => setSettings({ ...settings, versionControl: e.target.checked })}
                className="w-4 h-4 text-accent bg-muted border-border rounded focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="settings-auditLogging" className="text-sm text-foreground-secondary">Audit Logging</label>
              <input
                id="settings-auditLogging"
                type="checkbox"
                checked={settings.auditLogging}
                onChange={e => setSettings({ ...settings, auditLogging: e.target.checked })}
                className="w-4 h-4 text-accent bg-muted border-border rounded focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-foreground-secondary hover:text-foreground border border-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-accent hover:opacity-90 text-accent-foreground font-medium rounded-lg transition-colors"
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
