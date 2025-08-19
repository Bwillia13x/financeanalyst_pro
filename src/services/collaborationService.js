/**
 * Real-Time Collaboration Service
 * Handles multi-user financial modeling workspaces, live sharing, and real-time sync
 */

import { EventEmitter } from 'events';

// import { performanceMonitoring } from '../utils/performanceMonitoring'; // Missing module

class CollaborationService extends EventEmitter {
  constructor() {
    super();
    this.workspaces = new Map();
    this.users = new Map();
    this.connections = new Map();
    this.annotations = new Map();
    this.modelStates = new Map();
    this.isInitialized = false;
    this.wsConnection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;

    // Env and feature flags (Vite)
    this.env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    // Explicitly opt-in to collaboration to avoid unexpected WS errors in dev/staging
    this.collabEnabled = this.env.VITE_ENABLE_COLLABORATION === 'true';

    // Bind methods to preserve context
    this.handleConnectionOpen = this.handleConnectionOpen.bind(this);
    this.handleConnectionMessage = this.handleConnectionMessage.bind(this);
    this.handleConnectionClose = this.handleConnectionClose.bind(this);
    this.handleConnectionError = this.handleConnectionError.bind(this);

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.reconnectWebSocket();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('connectionStatus', { online: false });
    });
  }

  /**
   * Initialize the collaboration service
   */
  async initialize(userId, userProfile = {}) {
    try {
      if (this.isInitialized) {
        console.warn('CollaborationService already initialized');
        return;
      }

      this.currentUserId = userId;
      this.currentUserProfile = {
        id: userId,
        name: userProfile.name || 'Anonymous User',
        avatar: userProfile.avatar || null,
        role: userProfile.role || 'viewer',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        ...userProfile
      };

      // Store current user
      this.users.set(userId, this.currentUserProfile);

      // Initialize WebSocket connection only if collaboration is enabled
      if (this.collabEnabled) {
        await this.initializeWebSocket();
      } else {
        console.info('Collaboration disabled via VITE_ENABLE_COLLABORATION. Skipping WebSocket initialization.');
      }

      // Start heartbeat if enabled
      if (this.collabEnabled) {
        this.startHeartbeat();
      }

      this.isInitialized = true;
      this.emit('initialized', { userId, userProfile: this.currentUserProfile });

      // Track initialization performance
      if (typeof performanceMonitoring !== 'undefined') {
        // performanceMonitoring.trackCustomMetric('collaboration_init_success', 1);
      }

      console.log('CollaborationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CollaborationService:', error);
      if (typeof performanceMonitoring !== 'undefined') {
        // performanceMonitoring.trackCustomMetric('collaboration_init_error', 1);
      }
      throw error;
    }
  }

  /**
   * Initialize WebSocket connection
   */
  async initializeWebSocket() {
    try {
      // Resolve WebSocket URL from Vite env or current origin
      const explicitUrl = this.env.VITE_COLLAB_WS_URL;
      let wsUrl;
      if (explicitUrl) {
        wsUrl = explicitUrl;
      } else if (typeof window !== 'undefined' && window.location) {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        wsUrl = `${protocol}://${window.location.host}/collaboration`;
      } else {
        wsUrl = 'ws://localhost:8080/collaboration';
      }

      // If mock flag is set, simulate a WS connection; otherwise, attempt a real one
      const useMock = this.env.VITE_COLLAB_WS_MOCK === 'true';
      const _options = { useMock };
      if (useMock || typeof WebSocket === 'undefined') {
        // Simulated WebSocket for demo/testing
        this.wsConnection = {
          readyState: 1, // OPEN
          send: (data) => {
            console.log('WebSocket send (mock):', data);
            setTimeout(() => {
              this.handleConnectionMessage({ data });
            }, 100);
          },
          close: () => {
            this.wsConnection.readyState = 3; // CLOSED
            this.handleConnectionClose();
          }
        };
        console.info(`Collaboration WebSocket running in MOCK mode at ${wsUrl}`);
        this.handleConnectionOpen();
      } else {
        // Real WebSocket connection
        this.wsConnection = new WebSocket(wsUrl);
        this.wsConnection.addEventListener('open', this.handleConnectionOpen);
        this.wsConnection.addEventListener('message', this.handleConnectionMessage);
        this.wsConnection.addEventListener('close', this.handleConnectionClose);
        this.wsConnection.addEventListener('error', this.handleConnectionError);
        console.info(`Connecting to Collaboration WebSocket at ${wsUrl}`);
      }

    } catch (error) {
      console.error('WebSocket initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle WebSocket connection open
   */
  handleConnectionOpen() {
    console.log('Collaboration WebSocket connected');
    this.reconnectAttempts = 0;
    this.emit('connectionStatus', { online: true, connected: true });

    // Send authentication message
    this.sendMessage({
      type: 'auth',
      userId: this.currentUserId,
      userProfile: this.currentUserProfile
    });

    // Process any queued messages
    this.processSyncQueue();
  }

  /**
   * Handle WebSocket messages
   */
  handleConnectionMessage(event) {
    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      switch (message.type) {
        case 'workspace_update':
          this.handleWorkspaceUpdate(message.data);
          break;
        case 'user_joined':
          this.handleUserJoined(message.data);
          break;
        case 'user_left':
          this.handleUserLeft(message.data);
          break;
        case 'model_update':
          this.handleModelUpdate(message.data);
          break;
        case 'annotation_added':
          this.handleAnnotationAdded(message.data);
          break;
        case 'annotation_updated':
          this.handleAnnotationUpdated(message.data);
          break;
        case 'annotation_deleted':
          this.handleAnnotationDeleted(message.data);
          break;
        case 'cursor_update':
          this.handleCursorUpdate(message.data);
          break;
        case 'presence_update':
          this.handlePresenceUpdate(message.data);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  handleConnectionClose() {
    console.log('Collaboration WebSocket disconnected');
    this.emit('connectionStatus', { online: this.isOnline, connected: false });

    if (this.isOnline && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectWebSocket();
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
  }

  /**
   * Handle WebSocket connection error
   */
  handleConnectionError(error) {
    console.error('Collaboration WebSocket error:', error);
    this.emit('connectionError', error);
  }

  /**
   * Reconnect WebSocket
   */
  async reconnectWebSocket() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    try {
      await this.initializeWebSocket();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }

  /**
   * Send message through WebSocket
   */
  sendMessage(message) {
    if (this.wsConnection && this.wsConnection.readyState === 1) {
      this.wsConnection.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.syncQueue.push(message);
    }
  }

  /**
   * Process queued sync messages
   */
  processSyncQueue() {
    while (this.syncQueue.length > 0) {
      const message = this.syncQueue.shift();
      this.sendMessage(message);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.wsConnection && this.wsConnection.readyState === 1) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Create or join a workspace
   */
  async joinWorkspace(workspaceId, options = {}) {
    try {
      const workspace = {
        id: workspaceId,
        name: options.name || `Workspace ${workspaceId}`,
        description: options.description || '',
        createdBy: this.currentUserId,
        createdAt: new Date().toISOString(),
        members: new Map([[this.currentUserId, this.currentUserProfile]]),
        models: new Map(),
        annotations: new Map(),
        settings: {
          isPublic: options.isPublic || false,
          allowGuests: options.allowGuests || false,
          maxMembers: options.maxMembers || 10,
          ...options.settings
        },
        lastActivity: new Date().toISOString()
      };

      this.workspaces.set(workspaceId, workspace);

      // Notify server
      this.sendMessage({
        type: 'join_workspace',
        workspaceId,
        userId: this.currentUserId,
        options
      });

      this.emit('workspaceJoined', { workspaceId, workspace });

      // Track performance
      if (typeof performanceMonitoring !== 'undefined') {
        // performanceMonitoring.trackCustomMetric('workspace_joined', 1);
      }

      return workspace;
    } catch (error) {
      console.error('Failed to join workspace:', error);
      throw error;
    }
  }

  /**
   * Leave a workspace
   */
  async leaveWorkspace(workspaceId) {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      workspace.members.delete(this.currentUserId);

      if (workspace.members.size === 0) {
        this.workspaces.delete(workspaceId);
      }

      // Notify server
      this.sendMessage({
        type: 'leave_workspace',
        workspaceId,
        userId: this.currentUserId
      });

      this.emit('workspaceLeft', { workspaceId });

      return true;
    } catch (error) {
      console.error('Failed to leave workspace:', error);
      throw error;
    }
  }

  /**
   * Share a financial model in real-time
   */
  async shareModel(workspaceId, modelId, modelData, permissions = {}) {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const sharedModel = {
        id: modelId,
        workspaceId,
        data: modelData,
        sharedBy: this.currentUserId,
        sharedAt: new Date().toISOString(),
        permissions: {
          canEdit: permissions.canEdit || false,
          canComment: permissions.canComment !== false,
          canView: permissions.canView !== false,
          ...permissions
        },
        version: 1,
        lastModified: new Date().toISOString(),
        modifiedBy: this.currentUserId
      };

      workspace.models.set(modelId, sharedModel);
      this.modelStates.set(modelId, { ...modelData });

      // Notify all workspace members
      this.sendMessage({
        type: 'model_shared',
        workspaceId,
        modelId,
        sharedModel,
        userId: this.currentUserId
      });

      this.emit('modelShared', { workspaceId, modelId, sharedModel });

      return sharedModel;
    } catch (error) {
      console.error('Failed to share model:', error);
      throw error;
    }
  }

  /**
   * Update shared model data
   */
  async updateModel(workspaceId, modelId, updates, options = {}) {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const model = workspace.models.get(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Check permissions
      if (!model.permissions.canEdit && model.sharedBy !== this.currentUserId) {
        throw new Error('No edit permission for this model');
      }

      // Apply updates
      const updatedData = { ...model.data, ...updates };
      model.data = updatedData;
      model.version += 1;
      model.lastModified = new Date().toISOString();
      model.modifiedBy = this.currentUserId;

      this.modelStates.set(modelId, updatedData);

      // Broadcast update
      this.sendMessage({
        type: 'model_update',
        workspaceId,
        modelId,
        updates,
        version: model.version,
        userId: this.currentUserId,
        timestamp: model.lastModified
      });

      this.emit('modelUpdated', { workspaceId, modelId, updates, model });

      return model;
    } catch (error) {
      console.error('Failed to update model:', error);
      throw error;
    }
  }

  /**
   * Add annotation to model
   */
  async addAnnotation(workspaceId, modelId, annotation) {
    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const annotationId = `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newAnnotation = {
        id: annotationId,
        workspaceId,
        modelId,
        content: annotation.content || '',
        type: annotation.type || 'comment',
        position: annotation.position || { x: 0, y: 0 },
        target: annotation.target || null, // Chart element, data point, etc.
        createdBy: this.currentUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolved: false,
        replies: [],
        metadata: annotation.metadata || {}
      };

      workspace.annotations.set(annotationId, newAnnotation);

      // Broadcast annotation
      this.sendMessage({
        type: 'annotation_added',
        workspaceId,
        modelId,
        annotation: newAnnotation,
        userId: this.currentUserId
      });

      this.emit('annotationAdded', { workspaceId, modelId, annotation: newAnnotation });

      return newAnnotation;
    } catch (error) {
      console.error('Failed to add annotation:', error);
      throw error;
    }
  }

  /**
   * Update cursor position for real-time presence
   */
  updateCursor(workspaceId, position) {
    this.sendMessage({
      type: 'cursor_update',
      workspaceId,
      userId: this.currentUserId,
      position,
      timestamp: Date.now()
    });
  }

  /**
   * Get workspace members
   */
  getWorkspaceMembers(workspaceId) {
    const workspace = this.workspaces.get(workspaceId);
    return workspace ? Array.from(workspace.members.values()) : [];
  }

  /**
   * Get shared models in workspace
   */
  getWorkspaceModels(workspaceId) {
    const workspace = this.workspaces.get(workspaceId);
    return workspace ? Array.from(workspace.models.values()) : [];
  }

  /**
   * Get annotations for model
   */
  getModelAnnotations(workspaceId, modelId) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return [];

    return Array.from(workspace.annotations.values())
      .filter(annotation => annotation.modelId === modelId);
  }

  /**
   * Handle workspace update from server
   */
  handleWorkspaceUpdate(data) {
    this.emit('workspaceUpdate', data);
  }

  /**
   * Handle user joined workspace
   */
  handleUserJoined(data) {
    const workspace = this.workspaces.get(data.workspaceId);
    if (workspace) {
      workspace.members.set(data.user.id, data.user);
    }
    this.emit('userJoined', data);
  }

  /**
   * Handle user left workspace
   */
  handleUserLeft(data) {
    const workspace = this.workspaces.get(data.workspaceId);
    if (workspace) {
      workspace.members.delete(data.userId);
    }
    this.emit('userLeft', data);
  }

  /**
   * Handle model update from other users
   */
  handleModelUpdate(data) {
    const workspace = this.workspaces.get(data.workspaceId);
    if (workspace) {
      const model = workspace.models.get(data.modelId);
      if (model) {
        model.data = { ...model.data, ...data.updates };
        model.version = data.version;
        model.lastModified = data.timestamp;
        model.modifiedBy = data.userId;
      }
    }
    this.emit('modelUpdate', data);
  }

  /**
   * Handle annotation added
   */
  handleAnnotationAdded(data) {
    const workspace = this.workspaces.get(data.workspaceId);
    if (workspace) {
      workspace.annotations.set(data.annotation.id, data.annotation);
    }
    this.emit('annotationAdded', data);
  }

  /**
   * Handle annotation updated
   */
  handleAnnotationUpdated(data) {
    const workspace = this.workspaces.get(data.workspaceId);
    if (workspace) {
      const annotation = workspace.annotations.get(data.annotationId);
      if (annotation) {
        Object.assign(annotation, data.updates);
      }
    }
    this.emit('annotationUpdated', data);
  }

  /**
   * Handle annotation deleted
   */
  handleAnnotationDeleted(data) {
    const workspace = this.workspaces.get(data.workspaceId);
    if (workspace) {
      workspace.annotations.delete(data.annotationId);
    }
    this.emit('annotationDeleted', data);
  }

  /**
   * Handle cursor update
   */
  handleCursorUpdate(data) {
    this.emit('cursorUpdate', data);
  }

  /**
   * Handle presence update
   */
  handlePresenceUpdate(data) {
    this.emit('presenceUpdate', data);
  }

  /**
   * Cleanup and disconnect
   */
  async cleanup() {
    try {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      if (this.wsConnection) {
        this.wsConnection.close();
      }

      // Clear all maps
      this.workspaces.clear();
      this.users.clear();
      this.connections.clear();
      this.annotations.clear();
      this.modelStates.clear();

      this.isInitialized = false;
      this.emit('cleanup');

      console.log('CollaborationService cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export default new CollaborationService();
