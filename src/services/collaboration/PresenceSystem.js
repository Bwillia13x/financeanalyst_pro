/**
 * Presence System
 * Tracks user presence, cursors, and activity in collaborative environments
 * Provides real-time presence indicators and live cursor tracking
 */

class PresenceSystem {
  constructor(options = {}) {
    this.options = {
      heartbeatInterval: 30000,
      presenceTimeout: 60000,
      cursorUpdateThrottle: 100,
      ...options
    };

    this.presence = new Map();
    this.cursors = new Map();
    this.listeners = new Map();
    this.heartbeatTimers = new Map();
    this.cursorUpdateTimers = new Map();

    this.isInitialized = false;
  }

  /**
   * Initialize presence system
   */
  async initialize() {
    if (this.isInitialized) return;

    this.startPresenceMonitoring();
    this.isInitialized = true;

    console.log('Presence System initialized');
  }

  /**
   * Update user presence
   */
  async updatePresence(userId, presenceData) {
    const currentPresence = this.presence.get(userId) || {};

    const updatedPresence = {
      userId,
      status: presenceData.status || currentPresence.status || 'offline',
      workspaceId: presenceData.workspaceId || currentPresence.workspaceId,
      documentId: presenceData.documentId || currentPresence.documentId,
      lastSeen: new Date(),
      userAgent: presenceData.userAgent || currentPresence.userAgent,
      ipAddress: presenceData.ipAddress || currentPresence.ipAddress,
      location: presenceData.location || currentPresence.location,
      activity: presenceData.activity || currentPresence.activity,
      metadata: {
        ...currentPresence.metadata,
        ...presenceData.metadata
      }
    };

    // Update presence
    this.presence.set(userId, updatedPresence);

    // Reset heartbeat timer
    this.resetHeartbeatTimer(userId);

    // Emit presence update
    this.emit('presenceUpdated', { userId, presence: updatedPresence });

    return updatedPresence;
  }

  /**
   * Remove user presence
   */
  async removePresence(userId) {
    const presence = this.presence.get(userId);
    if (!presence) return;

    this.presence.delete(userId);
    this.cursors.delete(userId);

    // Clear timers
    if (this.heartbeatTimers.has(userId)) {
      clearTimeout(this.heartbeatTimers.get(userId));
      this.heartbeatTimers.delete(userId);
    }

    if (this.cursorUpdateTimers.has(userId)) {
      clearTimeout(this.cursorUpdateTimers.get(userId));
      this.cursorUpdateTimers.delete(userId);
    }

    this.emit('presenceRemoved', { userId, presence });
  }

  /**
   * Update cursor position
   */
  async updateCursor(userId, documentId, cursorPosition, selection = null) {
    const cursorKey = `${userId}_${documentId}`;
    const currentCursor = this.cursors.get(cursorKey) || {};

    const updatedCursor = {
      userId,
      documentId,
      position: cursorPosition,
      selection,
      lastUpdate: new Date(),
      color: currentCursor.color || this.generateCursorColor(userId)
    };

    // Throttle cursor updates
    if (this.cursorUpdateTimers.has(cursorKey)) {
      clearTimeout(this.cursorUpdateTimers.get(cursorKey));
    }

    const timer = setTimeout(() => {
      this.cursors.set(cursorKey, updatedCursor);
      this.emit('cursorUpdated', { cursor: updatedCursor });
      this.cursorUpdateTimers.delete(cursorKey);
    }, this.options.cursorUpdateThrottle);

    this.cursorUpdateTimers.set(cursorKey, timer);

    return updatedCursor;
  }

  /**
   * Generate unique cursor color for user
   */
  generateCursorColor(userId) {
    // Generate consistent color based on user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * Get presence for workspace
   */
  getWorkspacePresence(workspaceId) {
    const workspacePresence = [];

    for (const [userId, presence] of this.presence.entries()) {
      if (presence.workspaceId === workspaceId && this.isUserActive(presence)) {
        workspacePresence.push({
          ...presence,
          cursor: this.getUserCursor(userId, presence.documentId)
        });
      }
    }

    return workspacePresence;
  }

  /**
   * Get presence for document
   */
  getDocumentPresence(documentId) {
    const documentPresence = [];

    for (const [userId, presence] of this.presence.entries()) {
      if (presence.documentId === documentId && this.isUserActive(presence)) {
        documentPresence.push({
          ...presence,
          cursor: this.getUserCursor(userId, documentId)
        });
      }
    }

    return documentPresence;
  }

  /**
   * Get user cursor for document
   */
  getUserCursor(userId, documentId) {
    const cursorKey = `${userId}_${documentId}`;
    return this.cursors.get(cursorKey);
  }

  /**
   * Check if user is active
   */
  isUserActive(presence) {
    if (!presence.lastSeen) return false;

    const timeSinceLastSeen = Date.now() - presence.lastSeen.getTime();
    return timeSinceLastSeen < this.options.presenceTimeout;
  }

  /**
   * Send heartbeat
   */
  async sendHeartbeat(userId) {
    const presence = this.presence.get(userId);
    if (!presence) return;

    await this.updatePresence(userId, {
      ...presence,
      lastSeen: new Date()
    });
  }

  /**
   * Reset heartbeat timer
   */
  resetHeartbeatTimer(userId) {
    // Clear existing timer
    if (this.heartbeatTimers.has(userId)) {
      clearTimeout(this.heartbeatTimers.get(userId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.handlePresenceTimeout(userId);
    }, this.options.presenceTimeout);

    this.heartbeatTimers.set(userId, timer);
  }

  /**
   * Handle presence timeout
   */
  async handlePresenceTimeout(userId) {
    const presence = this.presence.get(userId);
    if (!presence) return;

    console.log(`User ${userId} presence timeout`);

    // Update status to away/offline
    await this.updatePresence(userId, {
      ...presence,
      status: 'away'
    });

    // Emit timeout event
    this.emit('presenceTimeout', { userId, presence });
  }

  /**
   * Start presence monitoring
   */
  startPresenceMonitoring() {
    // Check for timed out users every minute
    setInterval(() => {
      this.checkPresenceTimeouts();
    }, 60000);

    // Clean up old cursors every 5 minutes
    setInterval(() => {
      this.cleanupOldCursors();
    }, 300000);
  }

  /**
   * Check for presence timeouts
   */
  checkPresenceTimeouts() {
    const now = Date.now();

    for (const [userId, presence] of this.presence.entries()) {
      if (presence.lastSeen) {
        const timeSinceLastSeen = now - presence.lastSeen.getTime();

        if (timeSinceLastSeen > this.options.presenceTimeout) {
          this.handlePresenceTimeout(userId);
        }
      }
    }
  }

  /**
   * Clean up old cursors
   */
  cleanupOldCursors() {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();
    const cursorsToRemove = [];

    for (const [cursorKey, cursor] of this.cursors.entries()) {
      if (cursor.lastUpdate && now - cursor.lastUpdate.getTime() > maxAge) {
        cursorsToRemove.push(cursorKey);
      }
    }

    for (const cursorKey of cursorsToRemove) {
      this.cursors.delete(cursorKey);
    }

    if (cursorsToRemove.length > 0) {
      console.log(`Cleaned up ${cursorsToRemove.length} old cursors`);
    }
  }

  /**
   * Get user activity summary
   */
  getUserActivitySummary(userId) {
    const presence = this.presence.get(userId);
    if (!presence) return null;

    const now = Date.now();
    const timeSinceLastSeen = presence.lastSeen ? now - presence.lastSeen.getTime() : Infinity;

    return {
      userId,
      status: this.getUserStatus(presence, timeSinceLastSeen),
      workspaceId: presence.workspaceId,
      documentId: presence.documentId,
      lastSeen: presence.lastSeen,
      timeSinceLastSeen,
      activity: presence.activity,
      isActive: timeSinceLastSeen < this.options.presenceTimeout
    };
  }

  /**
   * Get user status based on activity
   */
  getUserStatus(presence, timeSinceLastSeen) {
    if (timeSinceLastSeen > this.options.presenceTimeout) {
      return 'offline';
    }

    if (presence.status === 'editing' || timeSinceLastSeen < 60000) {
      // 1 minute
      return 'active';
    }

    return presence.status || 'away';
  }

  /**
   * Get workspace activity summary
   */
  getWorkspaceActivitySummary(workspaceId) {
    const workspacePresence = this.getWorkspacePresence(workspaceId);

    const summary = {
      workspaceId,
      totalUsers: workspacePresence.length,
      activeUsers: workspacePresence.filter(p => p.status === 'active').length,
      editingUsers: workspacePresence.filter(p => p.status === 'editing').length,
      awayUsers: workspacePresence.filter(p => p.status === 'away').length,
      users: workspacePresence.map(p => ({
        userId: p.userId,
        status: p.status,
        documentId: p.documentId,
        lastSeen: p.lastSeen,
        activity: p.activity
      }))
    };

    return summary;
  }

  /**
   * Get document collaborators
   */
  getDocumentCollaborators(documentId) {
    const documentPresence = this.getDocumentPresence(documentId);

    return documentPresence.map(presence => ({
      userId: presence.userId,
      status: presence.status,
      cursor: presence.cursor,
      lastSeen: presence.lastSeen,
      activity: presence.activity
    }));
  }

  /**
   * Broadcast presence update to workspace
   */
  broadcastToWorkspace(workspaceId, event, data) {
    this.emit('workspaceBroadcast', {
      workspaceId,
      event,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast presence update to document
   */
  broadcastToDocument(documentId, event, data) {
    this.emit('documentBroadcast', {
      documentId,
      event,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Set user activity
   */
  async setUserActivity(userId, activity) {
    const presence = this.presence.get(userId);
    if (!presence) return;

    await this.updatePresence(userId, {
      ...presence,
      activity,
      lastSeen: new Date()
    });
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(workspaceId = null) {
    let users = Array.from(this.presence.values());

    if (workspaceId) {
      users = users.filter(p => p.workspaceId === workspaceId);
    }

    return users.filter(p => this.isUserActive(p)).length;
  }

  /**
   * Get presence statistics
   */
  getPresenceStats() {
    const stats = {
      totalUsers: this.presence.size,
      activeUsers: 0,
      editingUsers: 0,
      awayUsers: 0,
      offlineUsers: 0,
      totalCursors: this.cursors.size,
      workspaces: new Set(),
      documents: new Set()
    };

    for (const presence of this.presence.values()) {
      if (presence.workspaceId) {
        stats.workspaces.add(presence.workspaceId);
      }
      if (presence.documentId) {
        stats.documents.add(presence.documentId);
      }

      const status = this.getUserStatus(
        presence,
        Date.now() - presence.lastSeen?.getTime() || Infinity
      );

      switch (status) {
        case 'active':
          stats.activeUsers++;
          break;
        case 'editing':
          stats.editingUsers++;
          break;
        case 'away':
          stats.awayUsers++;
          break;
        case 'offline':
          stats.offlineUsers++;
          break;
      }
    }

    stats.workspaces = stats.workspaces.size;
    stats.documents = stats.documents.size;

    return stats;
  }

  /**
   * Export presence data
   */
  exportPresenceData() {
    return {
      presence: Object.fromEntries(this.presence),
      cursors: Object.fromEntries(this.cursors),
      exportedAt: new Date()
    };
  }

  /**
   * Import presence data
   */
  importPresenceData(data) {
    if (data.presence) {
      for (const [userId, presence] of Object.entries(data.presence)) {
        this.presence.set(userId, {
          ...presence,
          lastSeen: new Date(presence.lastSeen)
        });
      }
    }

    if (data.cursors) {
      for (const [cursorKey, cursor] of Object.entries(data.cursors)) {
        this.cursors.set(cursorKey, {
          ...cursor,
          lastUpdate: new Date(cursor.lastUpdate)
        });
      }
    }
  }

  /**
   * Event emitter
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in presence listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Shutdown presence system
   */
  async shutdown() {
    console.log('Shutting down Presence System...');

    // Clear all timers
    for (const timer of this.heartbeatTimers.values()) {
      clearTimeout(timer);
    }

    for (const timer of this.cursorUpdateTimers.values()) {
      clearTimeout(timer);
    }

    this.heartbeatTimers.clear();
    this.cursorUpdateTimers.clear();
    this.presence.clear();
    this.cursors.clear();

    this.isInitialized = false;

    console.log('Presence System shutdown complete');
  }
}

// Export singleton instance
export const presenceSystem = new PresenceSystem({
  heartbeatInterval: 30000,
  presenceTimeout: 60000,
  cursorUpdateThrottle: 100
});

export default PresenceSystem;
