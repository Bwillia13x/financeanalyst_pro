import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Reply, 
  Edit3, 
  Trash2, 
  Pin, 
  CheckCircle,
  AlertCircle,
  User,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import collaborationService from '../../services/collaborationService';

/**
 * Live commenting system for financial models with threading and real-time updates
 */

const LiveCommentSystem = ({ 
  workspaceId, 
  modelId, 
  targetElement = null,
  position = { x: 0, y: 0 },
  onClose,
  className = '' 
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser] = useState({
    id: 'current-user-id',
    name: 'Current User',
    avatar: null
  });
  
  const commentInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    loadComments();
    
    // Listen for new comments
    const handleAnnotationAdded = ({ annotation }) => {
      if (annotation.modelId === modelId && annotation.type === 'comment') {
        setComments(prev => [...prev, annotation]);
        scrollToBottom();
      }
    };

    const handleAnnotationUpdated = ({ workspaceId: wsId, annotationId, updates }) => {
      if (wsId === workspaceId) {
        setComments(prev => prev.map(comment => 
          comment.id === annotationId ? { ...comment, ...updates } : comment
        ));
      }
    };

    const handleAnnotationDeleted = ({ workspaceId: wsId, annotationId }) => {
      if (wsId === workspaceId) {
        setComments(prev => prev.filter(comment => comment.id !== annotationId));
      }
    };

    collaborationService.on('annotationAdded', handleAnnotationAdded);
    collaborationService.on('annotationUpdated', handleAnnotationUpdated);
    collaborationService.on('annotationDeleted', handleAnnotationDeleted);

    return () => {
      collaborationService.off('annotationAdded', handleAnnotationAdded);
      collaborationService.off('annotationUpdated', handleAnnotationUpdated);
      collaborationService.off('annotationDeleted', handleAnnotationDeleted);
    };
  }, [workspaceId, modelId]);

  const loadComments = () => {
    const modelAnnotations = collaborationService.getModelAnnotations(workspaceId, modelId);
    const commentAnnotations = modelAnnotations.filter(ann => ann.type === 'comment');
    setComments(commentAnnotations);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const commentData = {
        content: newComment.trim(),
        type: 'comment',
        position,
        target: targetElement,
        metadata: {
          replyTo: replyTo?.id || null,
          priority: 'normal'
        }
      };

      await collaborationService.addAnnotation(workspaceId, modelId, commentData);
      
      setNewComment('');
      setReplyTo(null);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    try {
      await collaborationService.updateAnnotation(workspaceId, commentId, {
        content: newContent,
        updatedAt: new Date().toISOString()
      });
      setEditingComment(null);
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await collaborationService.deleteAnnotation(workspaceId, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      await collaborationService.updateAnnotation(workspaceId, commentId, {
        resolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser.id
      });
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getThreadedComments = () => {
    const threaded = [];
    const commentMap = new Map();
    
    // First pass: create map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass: build threads
    comments.forEach(comment => {
      const replyToId = comment.metadata?.replyTo;
      if (replyToId && commentMap.has(replyToId)) {
        commentMap.get(replyToId).replies.push(commentMap.get(comment.id));
      } else {
        threaded.push(commentMap.get(comment.id));
      }
    });
    
    return threaded;
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-3 rounded-lg ${isReply ? 'ml-6 bg-slate-50 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'} 
        ${comment.resolved ? 'opacity-75' : ''} border border-slate-200 dark:border-slate-600`}
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
          {comment.createdBy ? (
            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
              {comment.createdBy.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {comment.createdBy || 'Anonymous'}
            </span>
            <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{formatTime(comment.createdAt)}</span>
            </div>
            {comment.resolved && (
              <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span>Resolved</span>
              </div>
            )}
          </div>
          
          {editingComment === comment.id ? (
            <EditCommentForm
              comment={comment}
              onSave={(content) => handleEditComment(comment.id, content)}
              onCancel={() => setEditingComment(null)}
            />
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              {comment.content}
            </p>
          )}
          
          <div className="flex items-center space-x-2">
            {!comment.resolved && (
              <>
                <button
                  onClick={() => setReplyTo(comment)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <Reply className="w-3 h-3" />
                  <span>Reply</span>
                </button>
                
                {comment.createdBy === currentUser.id && (
                  <button
                    onClick={() => setEditingComment(comment.id)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:underline flex items-center space-x-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
                
                <button
                  onClick={() => handleResolveComment(comment.id)}
                  className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center space-x-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Resolve</span>
                </button>
              </>
            )}
            
            {comment.createdBy === currentUser.id && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-2">
          <AnimatePresence>
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );

  const EditCommentForm = ({ comment, onSave, onCancel }) => {
    const [editContent, setEditContent] = useState(comment.content);
    
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSave(editContent); }}>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg resize-none text-sm"
          rows={2}
          autoFocus
        />
        <div className="flex justify-end space-x-2 mt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Comments
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({comments.length})
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ×
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto p-4">
        {replyTo && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Replying to {replyTo.createdBy}
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 italic">
              "{replyTo.content}"
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {getThreadedComments().map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </AnimatePresence>
        </div>
        
        {comments.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              No comments yet. Start the conversation!
            </p>
          </div>
        )}
        
        <div ref={commentsEndRef} />
      </div>

      {/* New Comment Form */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmitComment}>
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                {currentUser.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? `Reply to ${replyTo.createdBy}...` : "Add a comment..."}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newComment.trim() || isLoading}
                  className="flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{replyTo ? 'Reply' : 'Comment'}</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiveCommentSystem;
