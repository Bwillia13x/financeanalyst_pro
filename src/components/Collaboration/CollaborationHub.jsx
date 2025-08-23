// Collaboration Hub - Phase 2 Integration
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  GitBranch, 
  Bell, 
  Share2, 
  FileText,
  Clock,
  User,
  ChevronDown,
  Settings
} from 'lucide-react';

// Import Phase 2 services
import { versionControlService } from '../../services/collaboration/versionControl';
import { commentingService } from '../../services/collaboration/commentingSystem';
import { userPresenceService } from '../../services/collaboration/userPresenceSystem';
import { notificationService } from '../../services/notifications/notificationSystem';

export default function CollaborationHub({ analysisId, currentUser }) {
  const [activeTab, setActiveTab] = useState('presence');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [versionHistory, setVersionHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  useEffect(() => {
    initializeCollaboration();
    setupEventListeners();
    
    return () => cleanupEventListeners();
  }, [analysisId, currentUser]);

  const initializeCollaboration = async () => {
    try {
      // Initialize user presence
      await userPresenceService.joinSession(analysisId, {
        userId: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role
      });

      // Load initial data
      await Promise.all([
        loadActiveUsers(),
        loadRecentComments(),
        loadVersionHistory(),
        loadNotifications()
      ]);

    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      setConnectionStatus('error');
    }
  };

  const setupEventListeners = () => {
    // Presence events
    userPresenceService.on('user:joined', handleUserJoined);
    userPresenceService.on('user:left', handleUserLeft);
    userPresenceService.on('user:updated', handleUserUpdated);

    // Comment events
    commentingService.on('comment:added', handleCommentAdded);
    commentingService.on('comment:updated', handleCommentUpdated);

    // Version control events
    versionControlService.on('version:created', handleVersionCreated);
    versionControlService.on('branch:switched', handleBranchSwitched);

    // Notification events
    notificationService.on('notification:received', handleNotificationReceived);
  };

  const cleanupEventListeners = () => {
    userPresenceService.removeAllListeners();
    commentingService.removeAllListeners();
    versionControlService.removeAllListeners();
    notificationService.removeAllListeners();
  };

  const loadActiveUsers = async () => {
    try {
      const users = await userPresenceService.getActiveUsers(analysisId);
      setActiveUsers(users);
    } catch (error) {
      console.error('Failed to load active users:', error);
    }
  };

  const loadRecentComments = async () => {
    try {
      const comments = await commentingService.getComments(analysisId, {
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setRecentComments(comments);
    } catch (error) {
      console.error('Failed to load recent comments:', error);
    }
  };

  const loadVersionHistory = async () => {
    try {
      const history = await versionControlService.getVersionHistory(analysisId, { limit: 5 });
      setVersionHistory(history);
    } catch (error) {
      console.error('Failed to load version history:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const userNotifications = await notificationService.getNotifications(currentUser.id, {
        limit: 5,
        unreadOnly: true
      });
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Event handlers
  const handleUserJoined = (userData) => {
    setActiveUsers(prev => [...prev, userData]);
  };

  const handleUserLeft = (userId) => {
    setActiveUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleUserUpdated = (userData) => {
    setActiveUsers(prev => 
      prev.map(user => user.id === userData.id ? { ...user, ...userData } : user)
    );
  };

  const handleCommentAdded = (comment) => {
    setRecentComments(prev => [comment, ...prev.slice(0, 4)]);
  };

  const handleCommentUpdated = (comment) => {
    setRecentComments(prev => 
      prev.map(c => c.id === comment.id ? comment : c)
    );
  };

  const handleVersionCreated = (version) => {
    setVersionHistory(prev => [version, ...prev.slice(0, 4)]);
  };

  const handleBranchSwitched = (branchInfo) => {
    // Handle branch switch UI updates
    console.log('Branch switched:', branchInfo);
  };

  const handleNotificationReceived = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'away': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const tabs = [
    { id: 'presence', label: 'Users', icon: Users, count: activeUsers.length },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: recentComments.length },
    { id: 'versions', label: 'Versions', icon: GitBranch, count: versionHistory.length },
    { id: 'notifications', label: 'Alerts', icon: Bell, count: notifications.length }
  ];

  return (
    <div className="fixed right-4 top-20 z-50">
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
        style={{ width: isExpanded ? '400px' : '60px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`} />
              {isExpanded && (
                <span className="text-white font-medium">Collaboration</span>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            >
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : 'rotate-90'}`} 
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center p-3 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id 
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.count > 0 && (
                        <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {activeTab === 'presence' && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 mb-3">Active Users ({activeUsers.length})</h3>
                    {activeUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                        <span className="text-xs text-gray-400">{formatTimeAgo(user.lastActive)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 mb-3">Recent Comments</h3>
                    {recentComments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-blue-200 pl-3">
                        <div className="flex items-start space-x-2">
                          <img
                            src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=6366f1&color=fff`}
                            alt={comment.author.name}
                            className="w-6 h-6 rounded-full mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">
                              {comment.author.name} • {formatTimeAgo(comment.createdAt)}
                            </p>
                            <p className="text-sm text-gray-900">{comment.content}</p>
                            {comment.cellReference && (
                              <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-xs rounded">
                                Cell {comment.cellReference}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'versions' && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 mb-3">Version History</h3>
                    {versionHistory.map((version) => (
                      <div key={version.id} className="flex items-start space-x-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <GitBranch className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">v{version.version}</p>
                          <p className="text-xs text-gray-500">{version.message}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">{version.author.name}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">{formatTimeAgo(version.createdAt)}</span>
                          </div>
                        </div>
                        <button className="text-xs text-blue-600 hover:text-blue-800">
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 mb-3">Recent Alerts</h3>
                    {notifications.map((notification) => (
                      <div key={notification.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <Bell className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <span className="text-xs text-gray-400">{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 p-3">
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Share2 className="w-4 h-4 inline mr-1" />
                    Share
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed state indicators */}
        {!isExpanded && (
          <div className="p-2 space-y-2">
            {/* User count indicator */}
            <div className="flex justify-center">
              <div className="bg-green-100 p-2 rounded-full relative">
                <Users className="w-4 h-4 text-green-600" />
                {activeUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeUsers.length}
                  </span>
                )}
              </div>
            </div>
            
            {/* Notification indicator */}
            {notifications.length > 0 && (
              <div className="flex justify-center">
                <div className="bg-yellow-100 p-2 rounded-full relative">
                  <Bell className="w-4 h-4 text-yellow-600" />
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
