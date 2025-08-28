// Version Control & Audit Trail Service - Phase 2 Implementation
export class VersionControlService {
  constructor() {
    this.versions = new Map();
    this.branches = new Map();
    this.auditLog = [];
    this.currentVersion = null;
    this.pendingChanges = [];
    this.mergeStrategies = new Map();
    this.hooks = new Map();
  }

  // Initialize version control for a model
  async initializeModel(modelId, initialData, userId) {
    const initialVersion = {
      id: this.generateVersionId(),
      modelId,
      version: '1.0.0',
      parentVersion: null,
      branch: 'main',
      data: this.deepClone(initialData),
      metadata: {
        createdBy: userId,
        createdAt: new Date().toISOString(),
        title: 'Initial model version',
        description: 'Model initialization',
        tags: ['initial'],
        size: this.calculateDataSize(initialData)
      },
      checksum: await this.calculateChecksum(initialData)
    };

    this.versions.set(initialVersion.id, initialVersion);
    this.currentVersion = initialVersion.id;

    // Initialize main branch
    this.branches.set('main', {
      name: 'main',
      head: initialVersion.id,
      createdAt: new Date().toISOString(),
      isProtected: true
    });

    this.logAuditEvent({
      type: 'model_initialized',
      modelId,
      versionId: initialVersion.id,
      userId,
      timestamp: new Date().toISOString()
    });

    return initialVersion;
  }

  // Create new version/commit
  async createVersion(modelId, changes, metadata, userId) {
    const parentVersion = this.getVersion(this.currentVersion);
    if (!parentVersion) {
      throw new Error('No parent version found');
    }

    // Apply changes to create new data state
    const newData = this.applyChanges(parentVersion.data, changes);

    // Validate changes
    const validation = await this.validateChanges(changes, parentVersion.data, newData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const newVersion = {
      id: this.generateVersionId(),
      modelId,
      version: this.incrementVersion(parentVersion.version, metadata.changeType || 'minor'),
      parentVersion: parentVersion.id,
      branch: parentVersion.branch,
      data: newData,
      changes,
      metadata: {
        ...metadata,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        changeCount: changes.length,
        size: this.calculateDataSize(newData),
        diffSize: this.calculateDiffSize(changes)
      },
      checksum: await this.calculateChecksum(newData)
    };

    this.versions.set(newVersion.id, newVersion);
    this.currentVersion = newVersion.id;

    // Update branch head
    const branch = this.branches.get(newVersion.branch);
    if (branch) {
      branch.head = newVersion.id;
      branch.lastModified = new Date().toISOString();
    }

    // Clear pending changes
    this.pendingChanges = [];

    this.logAuditEvent({
      type: 'version_created',
      modelId,
      versionId: newVersion.id,
      parentVersionId: parentVersion.id,
      userId,
      changeCount: changes.length,
      timestamp: new Date().toISOString(),
      metadata
    });

    return newVersion;
  }

  // Branch operations
  async createBranch(branchName, fromVersionId, userId, options = {}) {
    const sourceVersion = this.getVersion(fromVersionId || this.currentVersion);
    if (!sourceVersion) {
      throw new Error('Source version not found');
    }

    if (this.branches.has(branchName)) {
      throw new Error(`Branch '${branchName}' already exists`);
    }

    const branch = {
      name: branchName,
      head: sourceVersion.id,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      sourceVersion: sourceVersion.id,
      isProtected: options.protected || false,
      description: options.description || '',
      tags: options.tags || []
    };

    this.branches.set(branchName, branch);

    this.logAuditEvent({
      type: 'branch_created',
      branchName,
      sourceVersionId: sourceVersion.id,
      userId,
      timestamp: new Date().toISOString()
    });

    return branch;
  }

  async switchBranch(branchName, userId) {
    const branch = this.branches.get(branchName);
    if (!branch) {
      throw new Error(`Branch '${branchName}' not found`);
    }

    const headVersion = this.getVersion(branch.head);
    if (!headVersion) {
      throw new Error('Branch head version not found');
    }

    this.currentVersion = headVersion.id;

    this.logAuditEvent({
      type: 'branch_switched',
      branchName,
      versionId: headVersion.id,
      userId,
      timestamp: new Date().toISOString()
    });

    return headVersion;
  }

  async mergeBranch(sourceBranch, targetBranch, userId, strategy = 'auto') {
    const source = this.branches.get(sourceBranch);
    const target = this.branches.get(targetBranch);

    if (!source || !target) {
      throw new Error('Source or target branch not found');
    }

    const sourceVersion = this.getVersion(source.head);
    const targetVersion = this.getVersion(target.head);

    // Find common ancestor
    const commonAncestor = this.findCommonAncestor(sourceVersion.id, targetVersion.id);

    // Collect changes from both branches
    const sourceChanges = this.getChangesSince(commonAncestor.id, sourceVersion.id);
    const targetChanges = this.getChangesSince(commonAncestor.id, targetVersion.id);

    // Detect conflicts
    const conflicts = this.detectConflicts(sourceChanges, targetChanges);

    if (conflicts.length > 0 && strategy === 'auto') {
      return {
        success: false,
        conflicts,
        requiresManualResolution: true
      };
    }

    // Apply merge strategy
    const mergedData = await this.applyMergeStrategy(
      commonAncestor.data,
      sourceChanges,
      targetChanges,
      conflicts,
      strategy
    );

    // Create merge commit
    const mergeVersion = await this.createVersion(
      targetVersion.modelId,
      this.generateMergeChanges(targetVersion.data, mergedData),
      {
        title: `Merge ${sourceBranch} into ${targetBranch}`,
        description: `Merged ${sourceChanges.length} changes from ${sourceBranch}`,
        changeType: 'merge',
        mergeInfo: {
          sourceBranch,
          targetBranch,
          sourceVersion: sourceVersion.id,
          targetVersion: targetVersion.id,
          commonAncestor: commonAncestor.id,
          conflictsResolved: conflicts.length,
          strategy
        }
      },
      userId
    );

    this.logAuditEvent({
      type: 'branch_merged',
      sourceBranch,
      targetBranch,
      mergeVersionId: mergeVersion.id,
      conflictsCount: conflicts.length,
      userId,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      mergeVersion,
      conflictsResolved: conflicts.length
    };
  }

  // Change tracking
  trackChange(change) {
    const changeRecord = {
      id: this.generateChangeId(),
      ...change,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.pendingChanges.push(changeRecord);
    return changeRecord;
  }

  getChanges(versionId, options = {}) {
    const version = this.getVersion(versionId);
    if (!version) return [];

    const {
      includeMetadata = true,
      filterByType = null,
      filterByUser = null,
      since: _since = null
    } = options;

    let changes = version.changes || [];

    if (filterByType) {
      changes = changes.filter(change => change.type === filterByType);
    }

    if (filterByUser) {
      changes = changes.filter(change => change.userId === filterByUser);
    }

    if (_since) {
      const sinceDate = new Date(_since);
      changes = changes.filter(change => new Date(change.timestamp) >= sinceDate);
    }

    if (!includeMetadata) {
      changes = changes.map(({ metadata: _metadata, ...change }) => change);
    }

    return changes;
  }

  getChangesSince(ancestorVersionId, versionId) {
    const changes = [];
    let currentVersionId = versionId;

    while (currentVersionId && currentVersionId !== ancestorVersionId) {
      const version = this.getVersion(currentVersionId);
      if (!version) break;

      if (version.changes) {
        changes.unshift(...version.changes);
      }

      currentVersionId = version.parentVersion;
    }

    return changes;
  }

  // Audit trail
  getAuditTrail(options = {}) {
    const {
      modelId = null,
      userId = null,
      eventType = null,
      since = null,
      until = null,
      limit = null
    } = options;

    let events = [...this.auditLog];

    if (modelId) {
      events = events.filter(event => event.modelId === modelId);
    }

    if (userId) {
      events = events.filter(event => event.userId === userId);
    }

    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }

    if (since) {
      const sinceDate = new Date(since);
      events = events.filter(event => new Date(event.timestamp) >= sinceDate);
    }

    if (until) {
      const untilDate = new Date(until);
      events = events.filter(event => new Date(event.timestamp) <= untilDate);
    }

    if (limit) {
      events = events.slice(-limit);
    }

    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  logAuditEvent(event) {
    const auditEvent = {
      id: this.generateAuditId(),
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    };

    this.auditLog.push(auditEvent);

    // Emit event for real-time updates
    this.emitEvent('audit_event', auditEvent);
  }

  // Version comparison
  async compareVersions(versionId1, versionId2, options = {}) {
    const version1 = this.getVersion(versionId1);
    const version2 = this.getVersion(versionId2);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    const diff = this.calculateDiff(version1.data, version2.data, options);

    return {
      version1: {
        id: version1.id,
        version: version1.version,
        createdAt: version1.metadata.createdAt
      },
      version2: {
        id: version2.id,
        version: version2.version,
        createdAt: version2.metadata.createdAt
      },
      differences: diff,
      summary: this.summarizeDiff(diff)
    };
  }

  calculateDiff(data1, data2, options = {}) {
    const { ignoreFields = [], precision = 2 } = options;
    const diff = [];

    const compare = (obj1, obj2, path = '') => {
      const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

      for (const key of keys) {
        const fullPath = path ? `${path}.${key}` : key;

        if (ignoreFields.includes(fullPath)) continue;

        const val1 = obj1 ? obj1[key] : undefined;
        const val2 = obj2 ? obj2[key] : undefined;

        if (val1 === undefined && val2 !== undefined) {
          diff.push({ type: 'added', path: fullPath, value: val2 });
        } else if (val1 !== undefined && val2 === undefined) {
          diff.push({ type: 'removed', path: fullPath, value: val1 });
        } else if (this.isObject(val1) && this.isObject(val2)) {
          compare(val1, val2, fullPath);
        } else if (val1 !== val2) {
          if (typeof val1 === 'number' && typeof val2 === 'number') {
            const rounded1 = Math.round(val1 * Math.pow(10, precision)) / Math.pow(10, precision);
            const rounded2 = Math.round(val2 * Math.pow(10, precision)) / Math.pow(10, precision);
            if (rounded1 !== rounded2) {
              diff.push({
                type: 'modified',
                path: fullPath,
                oldValue: val1,
                newValue: val2,
                change: val2 - val1,
                percentChange: val1 !== 0 ? ((val2 - val1) / val1) * 100 : null
              });
            }
          } else {
            diff.push({ type: 'modified', path: fullPath, oldValue: val1, newValue: val2 });
          }
        }
      }
    };

    compare(data1, data2);
    return diff;
  }

  // Rollback operations
  async rollbackToVersion(versionId, userId, reason = '') {
    const targetVersion = this.getVersion(versionId);
    if (!targetVersion) {
      throw new Error('Target version not found');
    }

    const currentVersion = this.getVersion(this.currentVersion);

    // Create rollback version
    const rollbackChanges = this.generateRollbackChanges(currentVersion.data, targetVersion.data);

    const rollbackVersion = await this.createVersion(
      currentVersion.modelId,
      rollbackChanges,
      {
        title: `Rollback to version ${targetVersion.version}`,
        description: `Rolled back from ${currentVersion.version}. Reason: ${reason}`,
        changeType: 'rollback',
        rollbackInfo: {
          targetVersion: versionId,
          sourceVersion: this.currentVersion,
          reason
        }
      },
      userId
    );

    this.logAuditEvent({
      type: 'version_rollback',
      modelId: currentVersion.modelId,
      fromVersionId: this.currentVersion,
      toVersionId: versionId,
      rollbackVersionId: rollbackVersion.id,
      reason,
      userId,
      timestamp: new Date().toISOString()
    });

    return rollbackVersion;
  }

  // Utility methods
  getVersion(versionId) {
    return this.versions.get(versionId);
  }

  getCurrentVersion() {
    return this.getVersion(this.currentVersion);
  }

  getVersionHistory(modelId, options = {}) {
    const { branch = null, limit = null, since = null } = options;

    let versions = Array.from(this.versions.values()).filter(v => v.modelId === modelId);

    if (branch) {
      versions = versions.filter(v => v.branch === branch);
    }

    if (since) {
      const sinceDate = new Date(since);
      versions = versions.filter(v => new Date(v.metadata.createdAt) >= sinceDate);
    }

    versions.sort((a, b) => new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt));

    if (limit) {
      versions = versions.slice(0, limit);
    }

    return versions;
  }

  findCommonAncestor(versionId1, versionId2) {
    const ancestors1 = this.getAncestors(versionId1);
    const ancestors2 = this.getAncestors(versionId2);

    for (const ancestor1 of ancestors1) {
      if (ancestors2.some(ancestor2 => ancestor2.id === ancestor1.id)) {
        return ancestor1;
      }
    }

    return null;
  }

  getAncestors(versionId) {
    const ancestors = [];
    let currentVersionId = versionId;

    while (currentVersionId) {
      const version = this.getVersion(currentVersionId);
      if (!version) break;

      ancestors.push(version);
      currentVersionId = version.parentVersion;
    }

    return ancestors;
  }

  // Helper methods
  generateVersionId() {
    return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateChangeId() {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  incrementVersion(currentVersion, changeType) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (changeType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  async calculateChecksum(data) {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  calculateDataSize(data) {
    return JSON.stringify(data).length;
  }

  calculateDiffSize(changes) {
    return JSON.stringify(changes).length;
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  isObject(val) {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  applyChanges(data, changes) {
    const newData = this.deepClone(data);

    changes.forEach(change => {
      const { path, type, value, oldValue: _oldValue } = change;
      const pathArray = path.split('.');

      let current = newData;
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }

      const finalKey = pathArray[pathArray.length - 1];

      switch (type) {
        case 'add':
        case 'modify':
          current[finalKey] = value;
          break;
        case 'delete':
          delete current[finalKey];
          break;
      }
    });

    return newData;
  }

  async validateChanges(changes, oldData, newData) {
    const errors = [];

    // Basic validation
    changes.forEach(change => {
      if (!change.path) {
        errors.push('Change missing path');
      }
      if (!change.type) {
        errors.push('Change missing type');
      }
    });

    // Data integrity checks
    try {
      JSON.stringify(newData);
    } catch (_e) {
      errors.push('New data is not serializable');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  detectConflicts(changes1, changes2) {
    const conflicts = [];

    changes1.forEach(change1 => {
      changes2.forEach(change2 => {
        if (change1.path === change2.path && change1.type !== change2.type) {
          conflicts.push({
            path: change1.path,
            conflict: 'type_mismatch',
            change1,
            change2
          });
        } else if (change1.path === change2.path && change1.value !== change2.value) {
          conflicts.push({
            path: change1.path,
            conflict: 'value_mismatch',
            change1,
            change2
          });
        }
      });
    });

    return conflicts;
  }

  emitEvent(eventName, data) {
    // This would integrate with the event system
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(`version_control_${eventName}`, { detail: data }));
    }
  }
}

export const versionControlService = new VersionControlService();
