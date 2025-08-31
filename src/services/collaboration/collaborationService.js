/**
 * Collaboration Service
 * Core collaboration functionality with operational transform
 */

import { operationalTransform } from './OperationalTransform.js';

class CollaborationService {
  constructor(options = {}) {
    this.options = {
      maxConnections: 100,
      heartbeatInterval: 30000,
      ...options
    };

    this.workspaces = new Map();
    this.documents = new Map();
    this.presence = new Map();
    this.listeners = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the collaboration service
   */
  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('Collaboration Service initialized');
  }

  /**
   * Create workspace
   */
  async createWorkspace(workspaceId, options = {}) {
    const workspace = {
      id: workspaceId,
      name: options.name || `Workspace ${workspaceId}`,
      members: new Set([options.owner || 'system']),
      documents: new Set(),
      created: new Date(),
      permissions: {
        read: new Set([options.owner || 'system']),
        write: new Set([options.owner || 'system']),
        admin: new Set([options.owner || 'system'])
      }
    };

    this.workspaces.set(workspaceId, workspace);
    this.emit('workspaceCreated', { workspaceId, workspace });

    return workspace;
  }

  /**
   * Create collaborative document
   */
  async createDocument(workspaceId, documentId, options = {}) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const document = {
      id: documentId,
      workspaceId,
      name: options.name || `Document ${documentId}`,
      content: options.initialContent || {},
      version: 1,
      collaborators: new Set([options.author || 'system']),
      cursors: new Map(),
      created: new Date(),
      lastModified: new Date()
    };

    this.documents.set(documentId, document);
    workspace.documents.add(documentId);

    this.emit('documentCreated', { workspaceId, documentId, document });

    return document;
  }

  /**
   * Apply operation to document
   */
  async applyOperation(documentId, operation, userId) {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Check permissions
    const workspace = this.workspaces.get(document.workspaceId);
    if (!workspace.permissions.write.has(userId)) {
      throw new Error(`User ${userId} does not have write permission`);
    }

    // Validate operation type
    const validOperationTypes = ['update', 'insert', 'delete', 'replace', 'move'];
    if (!operation.type || !validOperationTypes.includes(operation.type)) {
      throw new Error(
        `Invalid operation type: ${operation.type}. Valid types are: ${validOperationTypes.join(', ')}`
      );
    }

    // Validate required operation properties
    if (!operation.path) {
      throw new Error('Operation must have a path property');
    }

    // Apply operational transform
    const result = operationalTransform.applyOperation(documentId, operation, userId);

    // Update document
    document.content = result.newState;
    document.version = result.operation.id.split('_')[0]; // Use timestamp as version
    document.lastModified = new Date();

    // Broadcast to collaborators
    this.broadcastOperation(documentId, result.operation, userId);

    return result;
  }

  /**
   * Join document collaboration
   */
  async joinDocument(documentId, userId) {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    document.collaborators.add(userId);

    // Update presence
    this.updatePresence(userId, {
      workspaceId: document.workspaceId,
      documentId,
      status: 'editing'
    });

    this.emit('userJoinedDocument', { documentId, userId });

    return {
      document: this.getDocumentInfo(documentId),
      operations: operationalTransform.getDocumentOperations(documentId)
    };
  }

  /**
   * Update cursor position
   */
  async updateCursor(documentId, userId, position) {
    const document = this.documents.get(documentId);
    if (!document) return;

    document.cursors.set(userId, {
      position,
      lastUpdate: new Date()
    });

    // Broadcast cursor update
    this.broadcastCursorUpdate(documentId, userId, position);
  }

  /**
   * Broadcast operation to collaborators
   */
  broadcastOperation(documentId, operation, excludeUserId) {
    const document = this.documents.get(documentId);
    if (!document) return;

    for (const collaborator of document.collaborators) {
      if (collaborator !== excludeUserId) {
        this.emit('operationReceived', {
          documentId,
          operation,
          targetUser: collaborator
        });
      }
    }
  }

  /**
   * Broadcast cursor update
   */
  broadcastCursorUpdate(documentId, userId, position) {
    const document = this.documents.get(documentId);
    if (!document) return;

    for (const collaborator of document.collaborators) {
      if (collaborator !== userId) {
        this.emit('cursorUpdated', {
          documentId,
          userId,
          position,
          targetUser: collaborator
        });
      }
    }
  }

  /**
   * Update user presence
   */
  updatePresence(userId, presenceData) {
    this.presence.set(userId, {
      ...presenceData,
      lastUpdate: new Date()
    });

    this.emit('presenceUpdated', { userId, presence: this.presence.get(userId) });
  }

  /**
   * Get document info
   */
  getDocumentInfo(documentId) {
    const document = this.documents.get(documentId);
    if (!document) return null;

    return {
      id: document.id,
      name: document.name,
      version: document.version,
      collaborators: Array.from(document.collaborators),
      collaboratorCount: document.collaborators.size,
      lastModified: document.lastModified
    };
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

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Join workspace
   */
  async joinWorkspace(workspaceId, userId) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    workspace.members.add(userId);
    workspace.permissions.read.add(userId);
    workspace.permissions.write.add(userId);

    this.emit('userJoinedWorkspace', { workspaceId, userId });

    return workspace;
  }

  /**
   * Get workspace information
   */
  getWorkspaceInfo(workspaceId, userId) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    const hasReadPermission = workspace.permissions.read.has(userId);
    const hasWritePermission = workspace.permissions.write.has(userId);
    const hasAdminPermission = workspace.permissions.admin.has(userId);

    if (!hasReadPermission) {
      return null;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      members: Array.from(workspace.members),
      memberCount: workspace.members.size,
      documents: Array.from(workspace.documents),
      created: workspace.created,
      permissions: {
        read: hasReadPermission,
        write: hasWritePermission,
        admin: hasAdminPermission
      }
    };
  }

  /**
   * Shutdown the collaboration service
   */
  async shutdown() {
    console.log('Collaboration Service shutting down...');

    // Clear all data
    this.workspaces.clear();
    this.documents.clear();
    this.presence.clear();
    this.listeners.clear();
    this.isInitialized = false;

    console.log('Collaboration Service shutdown complete');
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      workspaces: this.workspaces.size,
      documents: this.documents.size,
      activeUsers: this.presence.size
    };
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
export default CollaborationService;
