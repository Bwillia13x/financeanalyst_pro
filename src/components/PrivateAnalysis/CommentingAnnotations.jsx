/**
 * Commenting & Annotations Component
 * Provides comprehensive commenting, annotation, and review features for financial models
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Reply,
  Edit3,
  Trash2,
  Flag,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  AtSign,
  Pin,
  Eye,
  EyeOff,
  Filter,
  Search,
  MoreVertical,
  Download,
  Star,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Tag,
  PaperclipIcon
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

const CommentingAnnotations = ({ modelData, currentUser, onDataChange }) => {
  const [comments, setComments] = useState([
    {
      id: 1,
      type: 'comment',
      content: 'The WACC assumption of 9.2% seems high for this industry. Should we benchmark against peer companies?',
      author: {
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        avatar: 'SJ',
        role: 'Senior Analyst'
      },
      timestamp: new Date('2024-01-15T14:30:00Z'),
      location: {
        sheet: 'DCF Model',
        cell: 'B15',
        section: 'Assumptions'
      },
      status: 'open',
      priority: 'high',
      tags: ['wacc', 'assumptions', 'review'],
      replies: [
        {
          id: 11,
          content: 'Good point. I\'ll research industry averages and update accordingly.',
          author: {
            name: 'Mike Chen',
            email: 'mike@company.com',
            avatar: 'MC',
            role: 'Analyst'
          },
          timestamp: new Date('2024-01-15T15:45:00Z')
        }
      ],
      reactions: {
        thumbsUp: 3,
        thumbsDown: 0,
        helpful: 2
      },
      resolved: false,
      pinned: true,
      attachments: []
    },
    {
      id: 2,
      type: 'annotation',
      content: 'Terminal growth rate updated based on latest market research. See attached report.',
      author: {
        name: 'Alex Rivera',
        email: 'alex@company.com',
        avatar: 'AR',
        role: 'VP Finance'
      },
      timestamp: new Date('2024-01-14T11:20:00Z'),
      location: {
        sheet: 'DCF Model',
        cell: 'B18',
        section: 'Terminal Value'
      },
      status: 'resolved',
      priority: 'medium',
      tags: ['terminal-growth', 'research'],
      replies: [],
      reactions: {
        thumbsUp: 1,
        thumbsDown: 0,
        helpful: 1
      },
      resolved: true,
      pinned: false,
      attachments: ['market_research_report.pdf']
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const commentFormRef = useRef(null);

  // Filter comments based on status, priority, and search
  const filteredComments = comments.filter(comment => {
    const matchesStatus = filterStatus === 'all' || comment.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || comment.priority === filterPriority;
    const matchesSearch = searchTerm === '' ||
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        type: 'comment',
        content: newComment,
        author: currentUser || {
          name: 'Current User',
          email: 'user@company.com',
          avatar: 'CU',
          role: 'Analyst'
        },
        timestamp: new Date(),
        location: selectedLocation || {
          sheet: 'Current Sheet',
          cell: 'Selected Cell',
          section: 'Active Section'
        },
        status: 'open',
        priority: 'medium',
        tags: [],
        replies: [],
        reactions: { thumbsUp: 0, thumbsDown: 0, helpful: 0 },
        resolved: false,
        pinned: false,
        attachments: []
      };

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setShowCommentForm(false);
    }
  };

  const handleAddReply = (commentId) => {
    if (replyContent.trim()) {
      const reply = {
        id: Date.now(),
        content: replyContent,
        author: currentUser || {
          name: 'Current User',
          email: 'user@company.com',
          avatar: 'CU',
          role: 'Analyst'
        },
        timestamp: new Date()
      };

      setComments(prev => prev.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      ));

      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const handleResolveComment = (commentId) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, resolved: !comment.resolved, status: comment.resolved ? 'open' : 'resolved' }
        : comment
    ));
  };

  const handleReaction = (commentId, reactionType) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? {
          ...comment,
          reactions: {
            ...comment.reactions,
            [reactionType]: comment.reactions[reactionType] + 1
          }
        }
        : comment
    ));
  };

  const formatDate = (date) => {
    return date.toLocaleString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status, resolved) => {
    if (resolved) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Comments & Annotations</h2>
          <p className="text-green-100 mt-2">
            Collaborate with detailed comments, annotations, and review workflows
          </p>
        </div>

        {/* Controls */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCommentForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Comment
              </button>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'comments', label: 'Comments', count: filteredComments.filter(c => c.type === 'comment').length },
              { id: 'annotations', label: 'Annotations', count: filteredComments.filter(c => c.type === 'annotation').length },
              { id: 'reviews', label: 'Reviews', count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Comment Form Modal */}
        <AnimatePresence>
          {showCommentForm && (
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
                className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Comment</h3>
                <textarea
                  ref={commentFormRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter your comment..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCommentForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddComment}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments List */}
        <div className="p-6">
          <div className="space-y-6">
            {filteredComments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No comments found</h3>
                <p className="text-gray-600">Start a conversation by adding the first comment.</p>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gray-50 rounded-lg p-6 border-l-4 ${
                    comment.pinned ? 'border-l-yellow-500 bg-yellow-50' :
                      comment.resolved ? 'border-l-green-500' : 'border-l-blue-500'
                  }`}
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {comment.author.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{comment.author.name}</span>
                          <span className="text-sm text-gray-500">{comment.author.role}</span>
                          {comment.pinned && <Pin className="w-4 h-4 text-yellow-600" />}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center space-x-2">
                          <span>{formatDate(comment.timestamp)}</span>
                          <span>•</span>
                          <span>{comment.location.sheet} - {comment.location.section}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getStatusIcon(comment.status, comment.resolved)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(comment.priority)}`}>
                        {comment.priority}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="mb-4">
                    <p className="text-gray-900">{comment.content}</p>

                    {comment.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Tag className="w-4 h-4 text-gray-400" />
                        {comment.tags.map((tag) => (
                          <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {comment.attachments.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <PaperclipIcon className="w-4 h-4 text-gray-400" />
                        {comment.attachments.map((attachment) => (
                          <span key={attachment} className="text-blue-600 hover:text-blue-800 text-sm underline cursor-pointer">
                            {attachment}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comment Actions */}
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleReaction(comment.id, 'thumbsUp')}
                        className="flex items-center space-x-1 text-gray-600 hover:text-green-600"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{comment.reactions.thumbsUp}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(comment.id, 'helpful')}
                        className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                      >
                        <Star className="w-4 h-4" />
                        <span className="text-sm">{comment.reactions.helpful}</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                      >
                        <Reply className="w-4 h-4" />
                        <span className="text-sm">Reply</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResolveComment(comment.id)}
                        className={`text-sm font-medium ${
                          comment.resolved
                            ? 'text-gray-600 hover:text-gray-800'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {comment.resolved ? 'Reopen' : 'Resolve'}
                      </button>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-white rounded-lg p-4 ml-6 border">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {reply.author.avatar}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">{reply.author.name}</span>
                                <span className="text-xs text-gray-500">{formatDate(reply.timestamp)}</span>
                              </div>
                              <p className="text-gray-900 text-sm">{reply.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 ml-6">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full border border-gray-300 rounded-lg p-3 h-20 resize-none text-sm"
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddReply(comment.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentingAnnotations;
