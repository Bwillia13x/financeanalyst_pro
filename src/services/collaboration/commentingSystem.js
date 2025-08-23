// Comment & Annotation System - Phase 2 Implementation
export class CommentingService {
  constructor() {
    this.comments = new Map();
    this.threads = new Map();
    this.annotations = new Map();
    this.mentionHandlers = new Map();
    this.notificationService = null;
    this.eventHandlers = new Map();
  }

  // Initialize with notification service
  initialize(notificationService) {
    this.notificationService = notificationService;
  }

  // Cell Comments
  async addCellComment(cellId, content, userId, userName, options = {}) {
    const comment = {
      id: this.generateCommentId(),
      cellId,
      content,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      type: 'cell_comment',
      status: 'active',
      mentions: this.extractMentions(content),
      metadata: {
        cellType: options.cellType || 'value',
        cellValue: options.cellValue || null,
        formula: options.formula || null,
        priority: options.priority || 'normal',
        tags: options.tags || []
      },
      replies: [],
      reactions: {},
      isResolved: false,
      resolvedBy: null,
      resolvedAt: null
    };

    this.comments.set(comment.id, comment);

    // Handle mentions
    if (comment.mentions.length > 0) {
      await this.processMentions(comment);
    }

    // Create thread if doesn't exist
    const threadId = `cell_${cellId}`;
    if (!this.threads.has(threadId)) {
      this.threads.set(threadId, {
        id: threadId,
        type: 'cell',
        entityId: cellId,
        comments: [],
        participants: new Set(),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
    }

    const thread = this.threads.get(threadId);
    thread.comments.push(comment.id);
    thread.participants.add(userId);
    thread.lastActivity = comment.timestamp;

    this.emit('comment_added', { comment, thread: threadId });
    return comment;
  }

  async addAssumptionComment(assumptionId, content, userId, userName, options = {}) {
    const comment = {
      id: this.generateCommentId(),
      assumptionId,
      content,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      type: 'assumption_comment',
      status: 'active',
      mentions: this.extractMentions(content),
      metadata: {
        assumptionType: options.assumptionType || 'input',
        currentValue: options.currentValue || null,
        rationale: options.rationale || '',
        sensitivity: options.sensitivity || 'medium',
        businessJustification: options.businessJustification || ''
      },
      replies: [],
      reactions: {},
      isResolved: false
    };

    this.comments.set(comment.id, comment);

    // Create assumption thread
    const threadId = `assumption_${assumptionId}`;
    if (!this.threads.has(threadId)) {
      this.threads.set(threadId, {
        id: threadId,
        type: 'assumption',
        entityId: assumptionId,
        comments: [],
        participants: new Set(),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
    }

    const thread = this.threads.get(threadId);
    thread.comments.push(comment.id);
    thread.participants.add(userId);
    thread.lastActivity = comment.timestamp;

    if (comment.mentions.length > 0) {
      await this.processMentions(comment);
    }

    this.emit('assumption_comment_added', { comment, thread: threadId });
    return comment;
  }

  // Reply to comments
  async replyToComment(parentCommentId, content, userId, userName) {
    const parentComment = this.comments.get(parentCommentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    const reply = {
      id: this.generateCommentId(),
      parentId: parentCommentId,
      content,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      type: 'reply',
      mentions: this.extractMentions(content),
      reactions: {}
    };

    this.comments.set(reply.id, reply);
    parentComment.replies.push(reply.id);

    // Update thread
    const thread = this.findThreadByComment(parentCommentId);
    if (thread) {
      thread.participants.add(userId);
      thread.lastActivity = reply.timestamp;
    }

    if (reply.mentions.length > 0) {
      await this.processMentions(reply);
    }

    this.emit('reply_added', { reply, parentComment });
    return reply;
  }

  // Annotations (rich text annotations with highlighting)
  async addAnnotation(selection, content, userId, userName, options = {}) {
    const annotation = {
      id: this.generateAnnotationId(),
      selection: {
        start: selection.start,
        end: selection.end,
        text: selection.text,
        context: selection.context || ''
      },
      content,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      type: options.type || 'highlight',
      color: options.color || '#FFE066',
      category: options.category || 'general',
      visibility: options.visibility || 'team', // team, private, public
      metadata: {
        modelSection: options.modelSection || '',
        importance: options.importance || 'normal',
        actionRequired: options.actionRequired || false,
        dueDate: options.dueDate || null
      },
      isActive: true
    };

    this.annotations.set(annotation.id, annotation);

    this.emit('annotation_added', annotation);
    return annotation;
  }

  // Comment resolution
  async resolveComment(commentId, userId, resolution = '') {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.isResolved = true;
    comment.resolvedBy = userId;
    comment.resolvedAt = new Date().toISOString();
    comment.resolution = resolution;

    // Notify participants
    const thread = this.findThreadByComment(commentId);
    if (thread) {
      for (const participantId of thread.participants) {
        if (participantId !== userId) {
          await this.notifyUser(participantId, {
            type: 'comment_resolved',
            commentId,
            resolvedBy: userId,
            resolution
          });
        }
      }
    }

    this.emit('comment_resolved', { comment, resolvedBy: userId });
    return comment;
  }

  async reopenComment(commentId, userId, reason = '') {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.isResolved = false;
    comment.resolvedBy = null;
    comment.resolvedAt = null;
    comment.reopenedBy = userId;
    comment.reopenedAt = new Date().toISOString();
    comment.reopenReason = reason;

    this.emit('comment_reopened', { comment, reopenedBy: userId });
    return comment;
  }

  // Reactions
  async addReaction(commentId, reaction, userId) {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (!comment.reactions[reaction]) {
      comment.reactions[reaction] = new Set();
    }

    comment.reactions[reaction].add(userId);

    this.emit('reaction_added', { commentId, reaction, userId });
    return comment;
  }

  async removeReaction(commentId, reaction, userId) {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.reactions[reaction]) {
      comment.reactions[reaction].delete(userId);

      if (comment.reactions[reaction].size === 0) {
        delete comment.reactions[reaction];
      }
    }

    this.emit('reaction_removed', { commentId, reaction, userId });
    return comment;
  }

  // Mention system
  extractMentions(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        username: match[1],
        position: match.index,
        length: match[0].length
      });
    }

    return mentions;
  }

  async processMentions(comment) {
    for (const mention of comment.mentions) {
      const userId = await this.resolveUserIdFromMention(mention.username);
      if (userId) {
        await this.notifyUser(userId, {
          type: 'mentioned',
          commentId: comment.id,
          mentionedBy: comment.userId,
          mentionedByName: comment.userName,
          content: comment.content,
          context: comment.cellId || comment.assumptionId
        });
      }
    }
  }

  async resolveUserIdFromMention(username) {
    // This would integrate with user management system
    // For now, return a mock user ID
    return `user_${username}`;
  }

  // Query and filtering
  getCommentsByCell(cellId, options = {}) {
    const {
      includeResolved = false,
      userId = null,
      since = null
    } = options;

    const threadId = `cell_${cellId}`;
    const thread = this.threads.get(threadId);

    if (!thread) return [];

    let comments = thread.comments.map(id => this.comments.get(id)).filter(Boolean);

    if (!includeResolved) {
      comments = comments.filter(comment => !comment.isResolved);
    }

    if (userId) {
      comments = comments.filter(comment => comment.userId === userId);
    }

    if (since) {
      const sinceDate = new Date(since);
      comments = comments.filter(comment => new Date(comment.timestamp) >= sinceDate);
    }

    return comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getCommentsByAssumption(assumptionId, options = {}) {
    const threadId = `assumption_${assumptionId}`;
    const thread = this.threads.get(threadId);

    if (!thread) return [];

    let comments = thread.comments.map(id => this.comments.get(id)).filter(Boolean);

    if (!options.includeResolved) {
      comments = comments.filter(comment => !comment.isResolved);
    }

    return comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getUnresolvedComments(userId = null) {
    let comments = Array.from(this.comments.values()).filter(comment =>
      !comment.isResolved && comment.type !== 'reply'
    );

    if (userId) {
      comments = comments.filter(comment =>
        comment.userId === userId ||
        comment.mentions.some(mention => mention.username === userId)
      );
    }

    return comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getMyComments(userId) {
    return Array.from(this.comments.values())
      .filter(comment => comment.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Search comments
  searchComments(query, options = {}) {
    const {
      userId = null,
      type = null,
      resolved = null,
      since = null
    } = options;

    const queryLower = query.toLowerCase();
    let comments = Array.from(this.comments.values());

    comments = comments.filter(comment =>
      comment.content.toLowerCase().includes(queryLower) ||
      comment.userName.toLowerCase().includes(queryLower)
    );

    if (userId) {
      comments = comments.filter(comment => comment.userId === userId);
    }

    if (type) {
      comments = comments.filter(comment => comment.type === type);
    }

    if (resolved !== null) {
      comments = comments.filter(comment => comment.isResolved === resolved);
    }

    if (since) {
      const sinceDate = new Date(since);
      comments = comments.filter(comment => new Date(comment.timestamp) >= sinceDate);
    }

    return comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Annotations queries
  getAnnotationsForSelection(start, end, modelSection = null) {
    let annotations = Array.from(this.annotations.values());

    annotations = annotations.filter(annotation => {
      const annoStart = annotation.selection.start;
      const annoEnd = annotation.selection.end;

      // Check for overlap
      return !(end < annoStart || start > annoEnd);
    });

    if (modelSection) {
      annotations = annotations.filter(annotation =>
        annotation.metadata.modelSection === modelSection
      );
    }

    return annotations.filter(annotation => annotation.isActive);
  }

  getUserAnnotations(userId) {
    return Array.from(this.annotations.values())
      .filter(annotation => annotation.userId === userId && annotation.isActive)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Export/Import
  exportComments(modelId, format = 'json') {
    const data = {
      modelId,
      exportedAt: new Date().toISOString(),
      comments: Array.from(this.comments.values()),
      threads: Array.from(this.threads.values()),
      annotations: Array.from(this.annotations.values())
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertCommentsToCSV(data.comments);
      default:
        return data;
    }
  }

  convertCommentsToCSV(comments) {
    const headers = ['ID', 'Type', 'User', 'Content', 'Timestamp', 'Resolved', 'Entity'];
    const rows = comments.map(comment => [
      comment.id,
      comment.type,
      comment.userName,
      `"${comment.content.replace(/"/g, '""')}"`,
      comment.timestamp,
      comment.isResolved ? 'Yes' : 'No',
      comment.cellId || comment.assumptionId || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Notification integration
  async notifyUser(userId, notification) {
    if (this.notificationService) {
      await this.notificationService.send(userId, notification);
    }
  }

  // Utility methods
  generateCommentId() {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAnnotationId() {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  findThreadByComment(commentId) {
    for (const thread of this.threads.values()) {
      if (thread.comments.includes(commentId)) {
        return thread;
      }
    }
    return null;
  }

  // Event handling
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in comment event handler for ${event}:`, error);
        }
      });
    }
  }

  // Comment statistics
  getCommentStatistics(modelId, options = {}) {
    const { since = null, userId = null } = options;

    let comments = Array.from(this.comments.values());

    if (since) {
      const sinceDate = new Date(since);
      comments = comments.filter(comment => new Date(comment.timestamp) >= sinceDate);
    }

    if (userId) {
      comments = comments.filter(comment => comment.userId === userId);
    }

    const stats = {
      total: comments.length,
      resolved: comments.filter(c => c.isResolved).length,
      unresolved: comments.filter(c => !c.isResolved).length,
      byType: {},
      byUser: {},
      avgResponseTime: 0,
      mostActiveThreads: []
    };

    // Count by type
    comments.forEach(comment => {
      stats.byType[comment.type] = (stats.byType[comment.type] || 0) + 1;
      stats.byUser[comment.userName] = (stats.byUser[comment.userName] || 0) + 1;
    });

    // Calculate response times (simplified)
    const threads = Array.from(this.threads.values());
    const responseTimes = [];

    threads.forEach(thread => {
      const threadComments = thread.comments.map(id => this.comments.get(id)).filter(Boolean);
      if (threadComments.length > 1) {
        threadComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (let i = 1; i < threadComments.length; i++) {
          const responseTime = new Date(threadComments[i].timestamp) - new Date(threadComments[i - 1].timestamp);
          responseTimes.push(responseTime);
        }
      }
    });

    if (responseTimes.length > 0) {
      stats.avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    // Most active threads
    stats.mostActiveThreads = threads
      .map(thread => ({
        id: thread.id,
        type: thread.type,
        commentCount: thread.comments.length,
        participantCount: thread.participants.size,
        lastActivity: thread.lastActivity
      }))
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, 5);

    return stats;
  }
}

export const commentingService = new CommentingService();
