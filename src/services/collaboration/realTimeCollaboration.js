// Real-Time Collaboration Service - Phase 2 Implementation
export class RealTimeCollaborationService {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.currentRoom = null;
    this.currentUser = null;
    this.activeUsers = new Map();
    this.pendingOperations = [];
    this.eventHandlers = new Map();
    this.operationalTransform = new OperationalTransformService();
    this.conflictResolver = new ConflictResolutionService();
  }

  // Initialize collaboration session
  async connect(userId, userName, modelId) {
    try {
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080/collaboration';
      this.websocket = new WebSocket(`${wsUrl}?modelId=${modelId}&userId=${userId}`);

      this.currentUser = { id: userId, name: userName };
      this.currentRoom = modelId;

      this.websocket.onopen = this.handleConnectionOpen.bind(this);
      this.websocket.onmessage = this.handleMessage.bind(this);
      this.websocket.onclose = this.handleConnectionClose.bind(this);
      this.websocket.onerror = this.handleError.bind(this);

      // Send join room message
      await this.waitForConnection();
      this.sendMessage({
        type: 'join_room',
        roomId: modelId,
        user: this.currentUser,
        timestamp: Date.now()
      });

      return { success: true, roomId: modelId };
    } catch (error) {
      console.error('Failed to connect to collaboration service:', error);
      return { success: false, error: error.message };
    }
  }

  async waitForConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Connection timeout')), timeout);

      const checkConnection = () => {
        if (this.websocket.readyState === WebSocket.OPEN) {
          clearTimeout(timer);
          this.isConnected = true;
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  // Handle real-time model edits
  async applyEdit(cellId, newValue, oldValue, editType = 'value') {
    const operation = {
      id: this.generateOperationId(),
      type: 'edit',
      cellId,
      editType,
      newValue,
      oldValue,
      userId: this.currentUser.id,
      timestamp: Date.now(),
      modelVersion: this.getModelVersion()
    };

    // Apply locally first (optimistic update)
    this.applyOperationLocally(operation);

    // Send to server for synchronization
    this.sendMessage({
      type: 'model_operation',
      operation,
      roomId: this.currentRoom
    });

    return operation;
  }

  // Handle formula changes
  async applyFormulaEdit(cellId, newFormula, dependencies) {
    const operation = {
      id: this.generateOperationId(),
      type: 'formula_edit',
      cellId,
      formula: newFormula,
      dependencies,
      userId: this.currentUser.id,
      timestamp: Date.now(),
      affects: this.calculateAffectedCells(cellId, dependencies)
    };

    this.applyOperationLocally(operation);
    this.sendMessage({
      type: 'model_operation',
      operation,
      roomId: this.currentRoom
    });

    return operation;
  }

  // Handle assumption changes
  async updateAssumption(assumptionId, newValue, rationale) {
    const operation = {
      id: this.generateOperationId(),
      type: 'assumption_change',
      assumptionId,
      newValue,
      rationale,
      userId: this.currentUser.id,
      timestamp: Date.now(),
      impact: this.calculateAssumptionImpact(assumptionId, newValue)
    };

    this.applyOperationLocally(operation);
    this.sendMessage({
      type: 'model_operation',
      operation,
      roomId: this.currentRoom
    });

    // Trigger model recalculation
    this.emit('assumption_changed', operation);
    return operation;
  }

  // User presence management
  updateCursor(cellId, position) {
    const presenceUpdate = {
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      cellId,
      position,
      timestamp: Date.now(),
      type: 'cursor_move'
    };

    this.sendMessage({
      type: 'presence_update',
      presence: presenceUpdate,
      roomId: this.currentRoom
    });
  }

  updateSelection(selectedRange) {
    const presenceUpdate = {
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      selectedRange,
      timestamp: Date.now(),
      type: 'selection_change'
    };

    this.sendMessage({
      type: 'presence_update',
      presence: presenceUpdate,
      roomId: this.currentRoom
    });
  }

  // Message handling
  handleConnectionOpen() {
    console.log('Connected to collaboration service');
    this.isConnected = true;
    this.emit('connected', { roomId: this.currentRoom });
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'user_joined':
          this.handleUserJoined(message);
          break;
        case 'user_left':
          this.handleUserLeft(message);
          break;
        case 'model_operation':
          this.handleRemoteOperation(message);
          break;
        case 'presence_update':
          this.handlePresenceUpdate(message);
          break;
        case 'conflict_detected':
          this.handleConflict(message);
          break;
        case 'sync_state':
          this.handleSyncState(message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  handleUserJoined(message) {
    const { user } = message;
    this.activeUsers.set(user.id, {
      ...user,
      joinedAt: Date.now(),
      isActive: true
    });

    this.emit('user_joined', user);
  }

  handleUserLeft(message) {
    const { userId } = message;
    this.activeUsers.delete(userId);
    this.emit('user_left', { userId });
  }

  handleRemoteOperation(message) {
    const { operation } = message;

    // Skip if it's our own operation echoed back
    if (operation.userId === this.currentUser.id) return;

    // Apply operational transformation
    const transformedOperation = this.operationalTransform.transform(
      operation,
      this.pendingOperations
    );

    this.applyOperationRemotely(transformedOperation);
    this.emit('remote_operation', transformedOperation);
  }

  handlePresenceUpdate(message) {
    const { presence } = message;

    if (presence.userId === this.currentUser.id) return;

    const user = this.activeUsers.get(presence.userId);
    if (user) {
      user.lastActivity = Date.now();
      user.cursor = presence.cellId;
      user.selection = presence.selectedRange;

      this.emit('presence_updated', presence);
    }
  }

  handleConflict(message) {
    const { conflict } = message;

    // Use conflict resolution strategy
    const resolution = this.conflictResolver.resolve(
      conflict.operations,
      this.currentUser.id
    );

    this.emit('conflict_detected', { conflict, resolution });
  }

  handleSyncState(message) {
    const { modelState, version } = message;

    // Synchronize local state with server
    this.syncLocalState(modelState, version);
    this.emit('state_synced', { version });
  }

  // Operation handling
  applyOperationLocally(operation) {
    // Add to pending operations queue
    this.pendingOperations.push(operation);

    // Apply operation to local model
    this.updateLocalModel(operation);

    // Clean up old pending operations
    this.cleanupPendingOperations();
  }

  applyOperationRemotely(operation) {
    this.updateLocalModel(operation);

    // Remove corresponding pending operation if exists
    this.pendingOperations = this.pendingOperations.filter(
      op => op.id !== operation.id
    );
  }

  updateLocalModel(operation) {
    switch (operation.type) {
      case 'edit':
        this.updateCell(operation.cellId, operation.newValue);
        break;
      case 'formula_edit':
        this.updateFormula(operation.cellId, operation.formula);
        break;
      case 'assumption_change':
        this.updateAssumption(operation.assumptionId, operation.newValue);
        break;
      default:
        console.warn('Unknown operation type:', operation.type);
    }
  }

  // Utility methods
  generateOperationId() {
    return `${this.currentUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getModelVersion() {
    // This would be managed by version control system
    return window.financialModelVersion || 1;
  }

  calculateAffectedCells(cellId, dependencies) {
    // Calculate which cells are affected by this change
    // This would integrate with the financial model dependency graph
    return dependencies.map(dep => dep.cellId);
  }

  calculateAssumptionImpact(assumptionId, newValue) {
    // Calculate the impact of assumption change on model outputs
    // This would use sensitivity analysis
    return {
      affectedMetrics: ['revenue', 'ebitda', 'fcf'],
      estimatedImpact: 'medium',
      confidenceLevel: 0.8
    };
  }

  cleanupPendingOperations(maxAge = 30000) {
    const now = Date.now();
    this.pendingOperations = this.pendingOperations.filter(
      op => now - op.timestamp < maxAge
    );
  }

  sendMessage(message) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: not connected');
    }
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
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Connection management
  handleConnectionClose() {
    this.isConnected = false;
    console.log('Disconnected from collaboration service');

    // Attempt reconnection
    setTimeout(() => {
      if (this.currentRoom && this.currentUser) {
        this.connect(this.currentUser.id, this.currentUser.name, this.currentRoom);
      }
    }, 3000);

    this.emit('disconnected');
  }

  handleError(error) {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }

  disconnect() {
    if (this.websocket) {
      this.sendMessage({
        type: 'leave_room',
        roomId: this.currentRoom,
        userId: this.currentUser.id
      });

      this.websocket.close();
      this.websocket = null;
    }

    this.isConnected = false;
    this.activeUsers.clear();
    this.pendingOperations = [];
  }

  // State management
  syncLocalState(modelState, version) {
    // Synchronize local model state with server state
    window.financialModelVersion = version;
    this.emit('model_updated', { state: modelState, version });
  }

  getActiveUsers() {
    return Array.from(this.activeUsers.values());
  }

  isUserActive(userId) {
    const user = this.activeUsers.get(userId);
    return user && user.isActive;
  }

  getUserPresence(userId) {
    const user = this.activeUsers.get(userId);
    return user ? {
      cursor: user.cursor,
      selection: user.selection,
      lastActivity: user.lastActivity
    } : null;
  }
}

// Operational Transform Service for conflict resolution
class OperationalTransformService {
  transform(remoteOperation, localOperations) {
    // Implement operational transformation algorithm
    // This is a simplified version - production would need more sophisticated OT

    let transformedOp = { ...remoteOperation };

    localOperations.forEach(localOp => {
      if (this.operationsConflict(transformedOp, localOp)) {
        transformedOp = this.resolveConflict(transformedOp, localOp);
      }
    });

    return transformedOp;
  }

  operationsConflict(op1, op2) {
    // Check if operations conflict (same cell, overlapping time, etc.)
    return op1.cellId === op2.cellId &&
           Math.abs(op1.timestamp - op2.timestamp) < 1000;
  }

  resolveConflict(remoteOp, localOp) {
    // Resolve conflict using timestamp-based precedence
    // More sophisticated conflict resolution could consider user roles, operation types, etc.

    if (remoteOp.timestamp > localOp.timestamp) {
      return remoteOp; // Remote operation wins
    } else {
      return { ...remoteOp, conflicted: true, precedence: 'local' };
    }
  }
}

// Conflict Resolution Service
class ConflictResolutionService {
  resolve(conflictingOperations, currentUserId) {
    const strategies = {
      'last_writer_wins': this.lastWriterWins,
      'merge_changes': this.mergeChanges,
      'user_priority': this.userPriority,
      'manual_resolution': this.manualResolution
    };

    // Default to last writer wins for now
    return strategies.last_writer_wins(conflictingOperations, currentUserId);
  }

  lastWriterWins(operations, currentUserId) {
    const sortedOps = operations.sort((a, b) => b.timestamp - a.timestamp);
    return {
      strategy: 'last_writer_wins',
      winningOperation: sortedOps[0],
      discardedOperations: sortedOps.slice(1),
      requiresUserConfirmation: false
    };
  }

  mergeChanges(operations, currentUserId) {
    // Attempt to merge non-conflicting changes
    return {
      strategy: 'merge_changes',
      mergedOperation: this.createMergedOperation(operations),
      requiresUserConfirmation: true
    };
  }

  userPriority(operations, currentUserId) {
    // Prioritize operations based on user roles/permissions
    const currentUserOp = operations.find(op => op.userId === currentUserId);
    return {
      strategy: 'user_priority',
      winningOperation: currentUserOp || operations[0],
      requiresUserConfirmation: !!currentUserOp
    };
  }

  manualResolution(operations, currentUserId) {
    return {
      strategy: 'manual_resolution',
      conflictingOperations: operations,
      requiresUserConfirmation: true,
      requiresManualReview: true
    };
  }

  createMergedOperation(operations) {
    // Simple merge strategy - this would be more sophisticated in production
    return {
      id: this.generateMergeId(operations),
      type: 'merged_operation',
      originalOperations: operations,
      timestamp: Date.now()
    };
  }

  generateMergeId(operations) {
    return `merge_${operations.map(op => op.id).join('_')}`;
  }
}

export const realTimeCollaborationService = new RealTimeCollaborationService();
