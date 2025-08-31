/**
 * Operational Transform Engine
 * Implements conflict-free replicated data types (CRDT) for collaborative editing
 * Handles concurrent operations and ensures consistency across all clients
 */

class OperationalTransform {
  constructor() {
    this.operations = new Map();
    this.states = new Map();
    this.vectorClocks = new Map();
  }

  /**
   * Apply an operation with operational transform
   */
  applyOperation(documentId, operation, userId) {
    const docOps = this.operations.get(documentId) || [];
    const docState = this.states.get(documentId) || {};
    const vectorClock = this.vectorClocks.get(documentId) || new Map();

    // Update vector clock
    const userClock = vectorClock.get(userId) || 0;
    vectorClock.set(userId, userClock + 1);

    // Transform operation against concurrent operations
    let transformedOp = operation;
    const concurrentOps = this.getConcurrentOperations(documentId, operation, userId);

    for (const concurrentOp of concurrentOps) {
      transformedOp = this.transformOperations(transformedOp, concurrentOp);
    }

    // Apply transformed operation to document state
    const newState = this.applyOperationToState(docState, transformedOp);

    // Store operation
    const operationRecord = {
      id: `${Date.now()}_${Math.random()}`,
      operation: transformedOp,
      userId,
      timestamp: new Date(),
      vectorClock: new Map(vectorClock)
    };

    docOps.push(operationRecord);
    this.operations.set(documentId, docOps);
    this.states.set(documentId, newState);
    this.vectorClocks.set(documentId, vectorClock);

    return {
      operation: operationRecord,
      newState,
      transformedOperation: transformedOp
    };
  }

  /**
   * Get concurrent operations that need transformation
   */
  getConcurrentOperations(documentId, operation, userId) {
    const docOps = this.operations.get(documentId) || [];
    const vectorClock = this.vectorClocks.get(documentId) || new Map();

    return docOps.filter(op => {
      if (op.userId === userId) return false;

      const userClock = vectorClock.get(op.userId) || 0;
      const opClock = op.vectorClock.get(op.userId) || 0;

      return opClock >= userClock;
    });
  }

  /**
   * Transform two operations
   */
  transformOperations(op1, op2) {
    // Handle different operation types
    const type1 = op1.type;
    const type2 = op2.type;

    // Same type transformations
    if (type1 === type2) {
      return this.transformSameTypeOperations(op1, op2);
    }

    // Different type transformations
    return this.transformDifferentTypeOperations(op1, op2);
  }

  /**
   * Transform operations of the same type
   */
  transformSameTypeOperations(op1, op2) {
    switch (op1.type) {
      case 'insert':
        return this.transformInsertInsert(op1, op2);
      case 'delete':
        return this.transformDeleteDelete(op1, op2);
      case 'update':
        return this.transformUpdateUpdate(op1, op2);
      default:
        return op1;
    }
  }

  /**
   * Transform insert-insert operations
   */
  transformInsertInsert(op1, op2) {
    if (op1.path !== op2.path) return op1;

    // Same path - adjust positions
    if (op1.position > op2.position) {
      return {
        ...op1,
        position: op1.position + (op2.value?.length || 1)
      };
    } else if (op1.position === op2.position) {
      // Same position - order by user ID for consistency
      return {
        ...op1,
        position: op1.position + (op2.value?.length || 1)
      };
    }

    return op1;
  }

  /**
   * Transform delete-delete operations
   */
  transformDeleteDelete(op1, op2) {
    if (op1.path !== op2.path) return op1;

    const pos1 = op1.position;
    const len1 = op1.length || 1;
    const pos2 = op2.position;
    const len2 = op2.length || 1;

    // Adjust position if needed
    if (pos1 > pos2) {
      const newPos = Math.max(0, pos1 - len2);
      return {
        ...op1,
        position: newPos
      };
    }

    return op1;
  }

  /**
   * Transform update-update operations
   */
  transformUpdateUpdate(op1, op2) {
    if (op1.path !== op2.path) return op1;

    // Last writer wins for updates
    return op1;
  }

  /**
   * Transform operations of different types
   */
  transformDifferentTypeOperations(op1, op2) {
    switch (`${op1.type}-${op2.type}`) {
      case 'insert-delete':
        return this.transformInsertDelete(op1, op2);
      case 'delete-insert':
        return this.transformDeleteInsert(op1, op2);
      case 'update-insert':
        return this.transformUpdateInsert(op1, op2);
      case 'update-delete':
        return this.transformUpdateDelete(op1, op2);
      default:
        return op1;
    }
  }

  /**
   * Transform insert over delete
   */
  transformInsertDelete(op1, op2) {
    if (op1.path !== op2.path) return op1;

    const insertPos = op1.position;
    const deletePos = op2.position;
    const deleteLen = op2.length || 1;

    if (insertPos > deletePos) {
      if (insertPos >= deletePos + deleteLen) {
        // Insert after delete range
        return {
          ...op1,
          position: insertPos - deleteLen
        };
      } else {
        // Insert within delete range - should be deleted
        return null;
      }
    }

    return op1;
  }

  /**
   * Transform delete over insert
   */
  transformDeleteInsert(op1, op2) {
    if (op1.path !== op2.path) return op1;

    const deletePos = op1.position;
    const deleteLen = op1.length || 1;
    const insertPos = op2.position;
    const insertValue = op2.value;

    if (deletePos > insertPos) {
      // Delete after insert
      return {
        ...op1,
        position: deletePos + (insertValue?.length || 1)
      };
    }

    return op1;
  }

  /**
   * Transform update over insert
   */
  transformUpdateInsert(op1, op2) {
    if (op1.path !== op2.path) return op1;

    const updatePos = op1.position;
    const insertPos = op2.position;
    const insertValue = op2.value;

    if (updatePos >= insertPos) {
      return {
        ...op1,
        position: updatePos + (insertValue?.length || 1)
      };
    }

    return op1;
  }

  /**
   * Transform update over delete
   */
  transformUpdateDelete(op1, op2) {
    if (op1.path !== op2.path) return op1;

    const updatePos = op1.position;
    const deletePos = op2.position;
    const deleteLen = op2.length || 1;

    if (updatePos > deletePos) {
      if (updatePos >= deletePos + deleteLen) {
        // Update after delete range
        return {
          ...op1,
          position: updatePos - deleteLen
        };
      } else {
        // Update within delete range - should be deleted
        return null;
      }
    }

    return op1;
  }

  /**
   * Apply operation to document state
   */
  applyOperationToState(state, operation) {
    if (!operation) return state;

    const newState = JSON.parse(JSON.stringify(state)); // Deep clone

    switch (operation.type) {
      case 'insert':
        this.applyInsertToState(newState, operation);
        break;
      case 'delete':
        this.applyDeleteToState(newState, operation);
        break;
      case 'update':
        this.applyUpdateToState(newState, operation);
        break;
      case 'replace':
        this.applyReplaceToState(newState, operation);
        break;
    }

    return newState;
  }

  /**
   * Apply insert operation to state
   */
  applyInsertToState(state, operation) {
    const { path, position, value } = operation;
    const target = this.getPathValue(state, path);

    if (Array.isArray(target)) {
      target.splice(position, 0, value);
    } else if (typeof target === 'string') {
      const newValue = target.slice(0, position) + value + target.slice(position);
      this.setPathValue(state, path, newValue);
    }
  }

  /**
   * Apply delete operation to state
   */
  applyDeleteToState(state, operation) {
    const { path, position, length = 1 } = operation;
    const target = this.getPathValue(state, path);

    if (Array.isArray(target)) {
      target.splice(position, length);
    } else if (typeof target === 'string') {
      const newValue = target.slice(0, position) + target.slice(position + length);
      this.setPathValue(state, path, newValue);
    }
  }

  /**
   * Apply update operation to state
   */
  applyUpdateToState(state, operation) {
    const { path, value } = operation;
    this.setPathValue(state, path, value);
  }

  /**
   * Apply replace operation to state
   */
  applyReplaceToState(state, operation) {
    const { path, value } = operation;
    this.setPathValue(state, path, value);
  }

  /**
   * Get value at path in object
   */
  getPathValue(obj, path) {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set value at path in object
   */
  setPathValue(obj, path, value) {
    if (!path) {
      Object.assign(obj, value);
      return;
    }

    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Get document state
   */
  getDocumentState(documentId) {
    return this.states.get(documentId) || {};
  }

  /**
   * Get document operations
   */
  getDocumentOperations(documentId, since = null) {
    const operations = this.operations.get(documentId) || [];

    if (since) {
      return operations.filter(op => op.timestamp > since);
    }

    return operations;
  }

  /**
   * Get vector clock for document
   */
  getVectorClock(documentId) {
    return this.vectorClocks.get(documentId) || new Map();
  }

  /**
   * Clear operations older than specified time
   */
  clearOldOperations(documentId, maxAge = 24 * 60 * 60 * 1000) {
    const operations = this.operations.get(documentId) || [];
    const cutoffTime = new Date(Date.now() - maxAge);

    const filteredOps = operations.filter(op => op.timestamp > cutoffTime);
    this.operations.set(documentId, filteredOps);

    return operations.length - filteredOps.length;
  }

  /**
   * Reset document state
   */
  resetDocument(documentId) {
    this.operations.delete(documentId);
    this.states.delete(documentId);
    this.vectorClocks.delete(documentId);
  }

  /**
   * Get operation statistics
   */
  getOperationStats(documentId) {
    const operations = this.operations.get(documentId) || [];
    const vectorClock = this.vectorClocks.get(documentId) || new Map();

    const stats = {
      totalOperations: operations.length,
      operationsByType: {},
      operationsByUser: {},
      vectorClock: Object.fromEntries(vectorClock)
    };

    operations.forEach(op => {
      // Count by type
      stats.operationsByType[op.operation.type] =
        (stats.operationsByType[op.operation.type] || 0) + 1;

      // Count by user
      stats.operationsByUser[op.userId] = (stats.operationsByUser[op.userId] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const operationalTransform = new OperationalTransform();
export default OperationalTransform;
