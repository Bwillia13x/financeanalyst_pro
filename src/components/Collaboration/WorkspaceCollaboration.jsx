import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Share2, 
  MessageCircle, 
  Eye, 
  Edit3, 
  Crown, 
  UserPlus, 
  Settings,
  Copy,
  Check,
  Clock,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import collaborationService from '../../services/collaborationService';

/**
 * Real-time collaborative workspace for financial analysis
 * Supports live sharing, real-time cursors, annotations, and multi-user editing
 */

const WorkspaceCollaboration = ({ 
  workspaceId, 
  modelData, 
  onModelUpdate,
  className = '' 
}) => {
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [cursors, setCursors] = useState(new Map());
  const [connectionStatus, setConnectionStatus] = useState({ online: false, connected: false });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sharePermissions, setSharePermissions] = useState({
    canEdit: false,
    canComment: true,
    canView: true
  });
  const [copied, setCopied] = useState(false);
  const cursorRef = useRef(null);

  useEffect(() => {
    // Initialize collaboration service
    const initializeCollaboration = async () => {
      try {
        await collaborationService.initialize('current-user-id', {
          name: 'Current User',
          role: 'analyst'
        });

        // Join workspace
        const ws = await collaborationService.joinWorkspace(workspaceId, {
          name: 'Financial Analysis Workspace',
          description: 'Collaborative DCF and LBO modeling'
        });
        setWorkspace(ws);

        // Load initial data
        setMembers(collaborationService.getWorkspaceMembers(workspaceId));
        setAnnotations(collaborationService.getModelAnnotations(workspaceId, 'main-model'));

      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    // Event listeners
    const handleConnectionStatus = (status) => setConnectionStatus(status);
    const handleUserJoined = ({ user }) => {
      setMembers(prev => [...prev.filter(m => m.id !== user.id), user]);
    };
    const handleUserLeft = ({ userId }) => {
      setMembers(prev => prev.filter(m => m.id !== userId));
    };
    const handleModelUpdate = ({ updates }) => {
      onModelUpdate?.(updates);
    };
    const handleAnnotationAdded = ({ annotation }) => {
      setAnnotations(prev => [...prev, annotation]);
    };
    const handleCursorUpdate = ({ userId, position }) => {
      setCursors(prev => new Map(prev.set(userId, position)));
    };

    // Set up event listeners
    collaborationService.on('connectionStatus', handleConnectionStatus);
    collaborationService.on('userJoined', handleUserJoined);
    collaborationService.on('userLeft', handleUserLeft);
    collaborationService.on('modelUpdate', handleModelUpdate);
    collaborationService.on('annotationAdded', handleAnnotationAdded);
    collaborationService.on('cursorUpdate', handleCursorUpdate);

    initializeCollaboration();

    return () => {
      collaborationService.off('connectionStatus', handleConnectionStatus);
      collaborationService.off('userJoined', handleUserJoined);
      collaborationService.off('userLeft', handleUserLeft);
      collaborationService.off('modelUpdate', handleModelUpdate);
      collaborationService.off('annotationAdded', handleAnnotationAdded);
      collaborationService.off('cursorUpdate', handleCursorUpdate);
    };
  }, [workspaceId, onModelUpdate]);

  // Track cursor movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = cursorRef.current?.getBoundingClientRect();
      if (rect) {
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          timestamp: Date.now()
        };
        collaborationService.updateCursor(workspaceId, position);
      }
    };

    const element = cursorRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      return () => element.removeEventListener('mousemove', handleMouseMove);
    }
  }, [workspaceId]);

  const handleShareModel = async () => {
    try {
      await collaborationService.shareModel(
        workspaceId,
        'main-model',
        modelData,
        sharePermissions
      );
      setShowShareModal(false);
    } catch (error) {
      console.error('Failed to share model:', error);
    }
  };

  const handleAddAnnotation = async (position, content) => {
    try {
      await collaborationService.addAnnotation(workspaceId, 'main-model', {
        content,
        position,
        type: 'comment'
      });
    } catch (error) {
      console.error('Failed to add annotation:', error);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/workspace/${workspaceId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    if (!connectionStatus.online) return 'bg-slate-400';
    if (connectionStatus.connected) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Live Collaboration
            </h3>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {members.length} member{members.length !== 1 ? 's' : ''} online
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMembersPanel(!showMembersPanel)}
            className="flex items-center space-x-1"
          >
            <Users className="w-4 h-4" />
            <span>{members.length}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Collaboration Area */}
      <div ref={cursorRef} className="relative p-4 min-h-[400px]">
        {/* Live Cursors */}
        <AnimatePresence>
          {Array.from(cursors.entries()).map(([userId, position]) => {
            const member = members.find(m => m.id === userId);
            if (!member || userId === 'current-user-id') return null;

            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute pointer-events-none z-50"
                style={{
                  left: position.x,
                  top: position.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg">
                    {member.name}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Annotations */}
        <AnimatePresence>
          {annotations.map((annotation) => (
            <motion.div
              key={annotation.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-40"
              style={{
                left: annotation.position.x,
                top: annotation.position.y
              }}
            >
              <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 shadow-lg max-w-xs">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-900 dark:text-white">{annotation.content}</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{annotation.createdBy}</span>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(annotation.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Activity Feed */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Recent Activity
          </h4>
          <div className="space-y-2">
            {members.slice(0, 3).map((member) => (
              <div key={member.id} className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {member.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="text-slate-900 dark:text-white">{member.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    is viewing the DCF model
                  </span>
                </div>
                <span className="text-slate-400 dark:text-slate-500 text-xs">
                  {new Date(member.lastActive).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Members Panel */}
      <AnimatePresence>
        {showMembersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 dark:border-slate-700 p-4"
          >
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
              Workspace Members
            </h4>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {member.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {member.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                  {member.role === 'owner' && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Share Workspace
                </h3>

                {/* Share Link */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Share Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/workspace/${workspaceId}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyShareLink}
                      className="flex items-center space-x-1"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Permissions */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={sharePermissions.canView}
                        onChange={(e) => setSharePermissions(prev => ({ ...prev, canView: e.target.checked }))}
                        className="mr-2"
                      />
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="text-sm">Can view</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={sharePermissions.canComment}
                        onChange={(e) => setSharePermissions(prev => ({ ...prev, canComment: e.target.checked }))}
                        className="mr-2"
                      />
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Can comment</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={sharePermissions.canEdit}
                        onChange={(e) => setSharePermissions(prev => ({ ...prev, canEdit: e.target.checked }))}
                        className="mr-2"
                      />
                      <Edit3 className="w-4 h-4 mr-1" />
                      <span className="text-sm">Can edit</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowShareModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleShareModel}
                  >
                    Share Model
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceCollaboration;
