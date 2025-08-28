// User Presence System - Phase 2 Implementation
export class UserPresenceService {
  constructor() {
    this.activeUsers = new Map();
    this.userSessions = new Map();
    this.cursors = new Map();
    this.selections = new Map();
    this.viewports = new Map();
    this.activities = new Map();
    this.eventHandlers = new Map();
    this.heartbeatInterval = null;
    this.presenceConfig = {
      heartbeatInterval: 30000, // 30 seconds
      inactiveTimeout: 300000, // 5 minutes
      cursorUpdateThrottle: 100, // milliseconds
      selectionUpdateThrottle: 200
    };
  }

  // Session Management
  async startSession(userId, userInfo, modelId, options = {}) {
    const session = {
      id: this.generateSessionId(),
      userId,
      modelId,
      userInfo: {
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar || this.generateAvatar(userId),
        role: userInfo.role || 'viewer',
        color: userInfo.color || this.assignUserColor(userId)
      },
      presence: {
        status: 'active', // active, idle, away
        lastActivity: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        currentLocation: options.initialLocation || 'dashboard'
      },
      capabilities: {
        canEdit: userInfo.role !== 'viewer',
        canComment: true,
        canShare: userInfo.role === 'owner' || userInfo.role === 'editor',
        maxConcurrentSessions: options.maxSessions || 3
      },
      connection: {
        connectionId: options.connectionId || this.generateConnectionId(),
        clientInfo: options.clientInfo || {},
        lastHeartbeat: new Date().toISOString(),
        isOnline: true
      }
    };

    this.userSessions.set(session.id, session);
    this.activeUsers.set(userId, session);

    // Initialize user cursor and selection tracking
    this.cursors.set(userId, {
      userId,
      position: null,
      visible: false,
      lastUpdate: new Date().toISOString()
    });

    this.selections.set(userId, {
      userId,
      selection: null,
      type: null, // cell, range, widget
      lastUpdate: new Date().toISOString()
    });

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring(userId);

    // Notify other users
    this.broadcastPresenceUpdate('user_joined', {
      user: session.userInfo,
      modelId,
      timestamp: session.presence.joinedAt
    });

    this.emit('session_started', { session, modelId });
    return session;
  }

  async endSession(userId, reason = 'user_logout') {
    const session = this.activeUsers.get(userId);
    if (!session) return;

    session.presence.status = 'offline';
    session.presence.leftAt = new Date().toISOString();
    session.connection.isOnline = false;

    // Clean up tracking data
    this.cursors.delete(userId);
    this.selections.delete(userId);
    this.viewports.delete(userId);
    this.activeUsers.delete(userId);

    // Stop heartbeat monitoring
    this.stopHeartbeatMonitoring(userId);

    // Notify other users
    this.broadcastPresenceUpdate('user_left', {
      userId,
      user: session.userInfo,
      modelId: session.modelId,
      reason,
      timestamp: session.presence.leftAt
    });

    this.emit('session_ended', { session, reason });
    return session;
  }

  // Cursor Tracking
  updateCursor(userId, cursorData) {
    const cursor = this.cursors.get(userId);
    const session = this.activeUsers.get(userId);

    if (!cursor || !session) return;

    // Update cursor position
    cursor.position = {
      x: cursorData.x,
      y: cursorData.y,
      cellId: cursorData.cellId || null,
      elementId: cursorData.elementId || null,
      component: cursorData.component || null
    };

    cursor.visible = cursorData.visible !== false;
    cursor.lastUpdate = new Date().toISOString();

    // Update user activity
    this.updateUserActivity(userId, 'cursor_move');

    // Throttled broadcast to other users
    this.throttledBroadcast(
      `cursor_${userId}`,
      () => {
        this.broadcastPresenceUpdate('cursor_updated', {
          userId,
          userName: session.userInfo.name,
          userColor: session.userInfo.color,
          cursor,
          modelId: session.modelId
        });
      },
      this.presenceConfig.cursorUpdateThrottle
    );

    this.emit('cursor_updated', { userId, cursor });
    return cursor;
  }

  hideCursor(userId) {
    const cursor = this.cursors.get(userId);
    if (!cursor) return;

    cursor.visible = false;
    cursor.lastUpdate = new Date().toISOString();

    this.broadcastPresenceUpdate('cursor_hidden', {
      userId,
      timestamp: cursor.lastUpdate
    });

    return cursor;
  }

  // Selection Tracking
  updateSelection(userId, selectionData) {
    const selection = this.selections.get(userId);
    const session = this.activeUsers.get(userId);

    if (!selection || !session) return;

    selection.selection = {
      type: selectionData.type, // cell, range, widget, text
      start: selectionData.start,
      end: selectionData.end,
      data: selectionData.data || null,
      context: selectionData.context || {}
    };

    selection.lastUpdate = new Date().toISOString();

    // Update user activity
    this.updateUserActivity(userId, 'selection_change');

    // Throttled broadcast
    this.throttledBroadcast(
      `selection_${userId}`,
      () => {
        this.broadcastPresenceUpdate('selection_updated', {
          userId,
          userName: session.userInfo.name,
          userColor: session.userInfo.color,
          selection,
          modelId: session.modelId
        });
      },
      this.presenceConfig.selectionUpdateThrottle
    );

    this.emit('selection_updated', { userId, selection });
    return selection;
  }

  clearSelection(userId) {
    const selection = this.selections.get(userId);
    if (!selection) return;

    selection.selection = null;
    selection.lastUpdate = new Date().toISOString();

    this.broadcastPresenceUpdate('selection_cleared', {
      userId,
      timestamp: selection.lastUpdate
    });

    return selection;
  }

  // Viewport Tracking
  updateViewport(userId, viewportData) {
    const session = this.activeUsers.get(userId);
    if (!session) return;

    const viewport = {
      userId,
      bounds: {
        left: viewportData.left || 0,
        top: viewportData.top || 0,
        width: viewportData.width || 0,
        height: viewportData.height || 0
      },
      zoom: viewportData.zoom || 1,
      center: viewportData.center || { x: 0, y: 0 },
      visibleElements: viewportData.visibleElements || [],
      lastUpdate: new Date().toISOString()
    };

    this.viewports.set(userId, viewport);
    this.updateUserActivity(userId, 'viewport_change');

    // Only broadcast significant viewport changes
    if (this.isSignificantViewportChange(userId, viewport)) {
      this.broadcastPresenceUpdate('viewport_updated', {
        userId,
        userName: session.userInfo.name,
        viewport,
        modelId: session.modelId
      });
    }

    this.emit('viewport_updated', { userId, viewport });
    return viewport;
  }

  // Activity Tracking
  updateUserActivity(userId, activityType, activityData = {}) {
    const session = this.activeUsers.get(userId);
    if (!session) return;

    const activity = {
      type: activityType,
      timestamp: new Date().toISOString(),
      data: activityData
    };

    // Update session last activity
    session.presence.lastActivity = activity.timestamp;
    session.presence.status = 'active';

    // Store recent activity
    if (!this.activities.has(userId)) {
      this.activities.set(userId, []);
    }

    const userActivities = this.activities.get(userId);
    userActivities.push(activity);

    // Keep only recent activities (last 50)
    if (userActivities.length > 50) {
      userActivities.splice(0, userActivities.length - 50);
    }

    // Update connection heartbeat
    session.connection.lastHeartbeat = activity.timestamp;

    this.emit('activity_updated', { userId, activity, session });
    return activity;
  }

  // Status Management
  updateUserStatus(userId, status, statusMessage = '') {
    const session = this.activeUsers.get(userId);
    if (!session) return;

    const validStatuses = ['active', 'idle', 'away', 'busy', 'offline'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    session.presence.status = status;
    session.presence.statusMessage = statusMessage;
    session.presence.lastActivity = new Date().toISOString();

    this.broadcastPresenceUpdate('status_updated', {
      userId,
      userName: session.userInfo.name,
      status,
      statusMessage,
      modelId: session.modelId,
      timestamp: session.presence.lastActivity
    });

    this.emit('status_updated', { userId, status, statusMessage });
    return session;
  }

  // Location Tracking
  updateUserLocation(userId, location, locationData = {}) {
    const session = this.activeUsers.get(userId);
    if (!session) return;

    session.presence.currentLocation = location;
    session.presence.locationData = locationData;
    session.presence.lastActivity = new Date().toISOString();

    this.updateUserActivity(userId, 'location_change', {
      location,
      locationData
    });

    this.broadcastPresenceUpdate('location_updated', {
      userId,
      userName: session.userInfo.name,
      location,
      locationData,
      modelId: session.modelId,
      timestamp: session.presence.lastActivity
    });

    this.emit('location_updated', { userId, location, locationData });
    return session;
  }

  // Heartbeat and Health Monitoring
  startHeartbeatMonitoring(userId) {
    const heartbeatKey = `heartbeat_${userId}`;

    // Clear existing heartbeat if any
    if (this.heartbeatTimers && this.heartbeatTimers[heartbeatKey]) {
      clearInterval(this.heartbeatTimers[heartbeatKey]);
    }

    if (!this.heartbeatTimers) {
      this.heartbeatTimers = {};
    }

    // Set up heartbeat monitoring
    this.heartbeatTimers[heartbeatKey] = setInterval(() => {
      this.checkUserHeartbeat(userId);
    }, this.presenceConfig.heartbeatInterval);
  }

  stopHeartbeatMonitoring(userId) {
    const heartbeatKey = `heartbeat_${userId}`;

    if (this.heartbeatTimers && this.heartbeatTimers[heartbeatKey]) {
      clearInterval(this.heartbeatTimers[heartbeatKey]);
      delete this.heartbeatTimers[heartbeatKey];
    }
  }

  checkUserHeartbeat(userId) {
    const session = this.activeUsers.get(userId);
    if (!session) {
      this.stopHeartbeatMonitoring(userId);
      return;
    }

    const now = new Date();
    const lastHeartbeat = new Date(session.connection.lastHeartbeat);
    const timeSinceHeartbeat = now - lastHeartbeat;

    // Check for inactive users
    if (timeSinceHeartbeat > this.presenceConfig.inactiveTimeout) {
      if (session.presence.status !== 'idle') {
        this.updateUserStatus(userId, 'idle', 'Inactive for 5+ minutes');
      }
    }

    // Check for disconnected users (more aggressive timeout)
    if (timeSinceHeartbeat > this.presenceConfig.inactiveTimeout * 2) {
      this.endSession(userId, 'timeout');
    }
  }

  heartbeat(userId) {
    const session = this.activeUsers.get(userId);
    if (!session) return null;

    session.connection.lastHeartbeat = new Date().toISOString();

    // If user was idle, mark as active
    if (session.presence.status === 'idle') {
      this.updateUserStatus(userId, 'active');
    }

    return session;
  }

  // Presence Queries
  getActiveUsers(modelId = null) {
    let users = Array.from(this.activeUsers.values());

    if (modelId) {
      users = users.filter(session => session.modelId === modelId);
    }

    return users
      .filter(session => session.connection.isOnline)
      .map(session => ({
        userId: session.userId,
        userInfo: session.userInfo,
        presence: session.presence,
        capabilities: session.capabilities
      }))
      .sort((a, b) => new Date(b.presence.lastActivity) - new Date(a.presence.lastActivity));
  }

  getUserPresence(userId) {
    const session = this.activeUsers.get(userId);
    if (!session) return null;

    return {
      userId: session.userId,
      userInfo: session.userInfo,
      presence: session.presence,
      cursor: this.cursors.get(userId),
      selection: this.selections.get(userId),
      viewport: this.viewports.get(userId),
      recentActivity: this.getRecentActivity(userId, 5)
    };
  }

  getPresenceSummary(modelId) {
    const activeUsers = this.getActiveUsers(modelId);

    const summary = {
      totalUsers: activeUsers.length,
      activeUsers: activeUsers.filter(u => u.presence.status === 'active').length,
      idleUsers: activeUsers.filter(u => u.presence.status === 'idle').length,
      editors: activeUsers.filter(u => u.capabilities.canEdit).length,
      viewers: activeUsers.filter(u => !u.capabilities.canEdit).length,
      locations: this.getLocationDistribution(activeUsers),
      lastActivity:
        activeUsers.length > 0
          ? Math.max(...activeUsers.map(u => new Date(u.presence.lastActivity)))
          : null
    };

    return summary;
  }

  // Collaboration Awareness
  getUsersInSameLocation(userId, location = null) {
    const userSession = this.activeUsers.get(userId);
    if (!userSession) return [];

    const targetLocation = location || userSession.presence.currentLocation;

    return this.getActiveUsers(userSession.modelId).filter(
      user => user.userId !== userId && user.presence.currentLocation === targetLocation
    );
  }

  getUsersEditingSameElement(elementId, elementType) {
    const usersWithElement = [];

    for (const [userId, selection] of this.selections.entries()) {
      if (
        selection.selection &&
        selection.selection.type === elementType &&
        (selection.selection.data?.elementId === elementId ||
          selection.selection.context?.elementId === elementId)
      ) {
        const session = this.activeUsers.get(userId);
        if (session) {
          usersWithElement.push({
            userId,
            userName: session.userInfo.name,
            userColor: session.userInfo.color,
            selection: selection.selection
          });
        }
      }
    }

    return usersWithElement;
  }

  // Broadcasting
  broadcastPresenceUpdate(eventType, data) {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    // Emit to local event handlers
    this.emit('presence_broadcast', event);

    // This would integrate with WebSocket or other real-time communication
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('presence_update', { detail: event }));
    }
  }

  throttledBroadcast(key, callback, delay) {
    if (!this.throttleTimers) {
      this.throttleTimers = {};
    }

    if (this.throttleTimers[key]) {
      clearTimeout(this.throttleTimers[key]);
    }

    this.throttleTimers[key] = setTimeout(() => {
      callback();
      delete this.throttleTimers[key];
    }, delay);
  }

  // Utility Methods
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAvatar(userId) {
    // Generate a consistent avatar/initials based on userId
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    const colorIndex =
      userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return {
      type: 'initials',
      color: colors[colorIndex],
      initials: userId.substring(0, 2).toUpperCase()
    };
  }

  assignUserColor(userId) {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FECA57',
      '#FF9FF3',
      '#54A0FF',
      '#5F27CD',
      '#00D2D3',
      '#FF9F43'
    ];
    const colorIndex =
      userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[colorIndex];
  }

  isSignificantViewportChange(userId, newViewport) {
    const lastViewport = this.viewports.get(userId);
    if (!lastViewport) return true;

    // Check if the viewport change is significant enough to broadcast
    const centerDelta = Math.sqrt(
      Math.pow(newViewport.center.x - lastViewport.center.x, 2) +
        Math.pow(newViewport.center.y - lastViewport.center.y, 2)
    );

    const zoomDelta = Math.abs(newViewport.zoom - lastViewport.zoom);

    return centerDelta > 50 || zoomDelta > 0.1; // Threshold for significant change
  }

  getRecentActivity(userId, limit = 10) {
    const activities = this.activities.get(userId) || [];
    return activities.slice(-limit).reverse();
  }

  getLocationDistribution(users) {
    const distribution = {};
    users.forEach(user => {
      const location = user.presence.currentLocation;
      distribution[location] = (distribution[location] || 0) + 1;
    });
    return distribution;
  }

  // Event System
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
          console.error(`Error in presence event handler for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  cleanup() {
    // Clear all heartbeat timers
    if (this.heartbeatTimers) {
      Object.values(this.heartbeatTimers).forEach(timer => clearInterval(timer));
      this.heartbeatTimers = {};
    }

    // Clear throttle timers
    if (this.throttleTimers) {
      Object.values(this.throttleTimers).forEach(timer => clearTimeout(timer));
      this.throttleTimers = {};
    }

    // Clear all data
    this.activeUsers.clear();
    this.cursors.clear();
    this.selections.clear();
    this.viewports.clear();
    this.activities.clear();
  }
}

export const userPresenceService = new UserPresenceService();
