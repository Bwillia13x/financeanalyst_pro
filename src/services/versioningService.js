// Versioning Service for Model Lab
// Provides version history, diff calculation, and revert capabilities

class VersioningService {
  constructor() {
    this.storageKey = 'model_versions';
    this.maxVersionsPerModel = 50; // Keep last 50 versions
  }

  // Get all versions for a model
  getVersionHistory(modelId) {
    const allVersions = this.getAllVersions();
    return allVersions[modelId] || [];
  }

  // Save a new version of a model
  saveVersion(model, changeDescription = 'Updated model') {
    const allVersions = this.getAllVersions();
    const modelId = model.id;

    if (!allVersions[modelId]) {
      allVersions[modelId] = [];
    }

    // Create version entry
    const version = {
      id: this.generateVersionId(),
      modelId,
      version: this.getNextVersionNumber(modelId),
      timestamp: new Date().toISOString(),
      changeDescription,
      model: this.deepClone(model),
      author: 'User', // Would be actual user in production
      checksum: this.calculateChecksum(model)
    };

    allVersions[modelId].unshift(version);

    // Keep only the most recent versions
    if (allVersions[modelId].length > this.maxVersionsPerModel) {
      allVersions[modelId] = allVersions[modelId].slice(0, this.maxVersionsPerModel);
    }

    this.saveAllVersions(allVersions);
    return version;
  }

  // Get a specific version
  getVersion(modelId, versionId) {
    const history = this.getVersionHistory(modelId);
    return history.find(v => v.id === versionId);
  }

  // Revert to a specific version
  revertToVersion(modelId, versionId) {
    const version = this.getVersion(modelId, versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    // Create a new version based on the reverted state
    const revertedModel = this.deepClone(version.model);
    revertedModel.updatedAt = new Date().toISOString();

    const newVersion = this.saveVersion(
      revertedModel,
      `Reverted to version ${version.version} (${version.changeDescription})`
    );

    return {
      model: revertedModel,
      version: newVersion
    };
  }

  // Calculate diff between two model versions
  calculateDiff(modelId, fromVersionId, toVersionId) {
    const fromVersion = this.getVersion(modelId, fromVersionId);
    const toVersion = this.getVersion(modelId, toVersionId);

    if (!fromVersion || !toVersion) {
      throw new Error('One or both versions not found');
    }

    return this.diffModels(fromVersion.model, toVersion.model);
  }

  // Calculate diff between current model and a version
  calculateDiffFromCurrent(currentModel, versionId) {
    const version = this.getVersion(currentModel.id, versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    return this.diffModels(version.model, currentModel);
  }

  // Internal diff calculation
  diffModels(fromModel, toModel) {
    const changes = {
      metadata: {},
      assumptions: {},
      outputs: {},
      summary: {
        totalChanges: 0,
        assumptionChanges: 0,
        metadataChanges: 0,
        outputChanges: 0
      }
    };

    // Compare metadata
    const metadataFields = ['name', 'description', 'kind', 'version'];
    metadataFields.forEach(field => {
      if (fromModel[field] !== toModel[field]) {
        changes.metadata[field] = {
          from: fromModel[field],
          to: toModel[field],
          type: 'modified'
        };
        changes.summary.metadataChanges++;
        changes.summary.totalChanges++;
      }
    });

    // Compare assumptions
    const allAssumptionKeys = new Set([
      ...Object.keys(fromModel.assumptions || {}),
      ...Object.keys(toModel.assumptions || {})
    ]);

    allAssumptionKeys.forEach(key => {
      const fromValue = fromModel.assumptions?.[key];
      const toValue = toModel.assumptions?.[key];

      if (fromValue !== toValue) {
        if (fromValue === undefined) {
          changes.assumptions[key] = {
            from: undefined,
            to: toValue,
            type: 'added'
          };
        } else if (toValue === undefined) {
          changes.assumptions[key] = {
            from: fromValue,
            to: undefined,
            type: 'removed'
          };
        } else {
          changes.assumptions[key] = {
            from: fromValue,
            to: toValue,
            type: 'modified',
            difference: this.calculateNumericDifference(fromValue, toValue)
          };
        }
        changes.summary.assumptionChanges++;
        changes.summary.totalChanges++;
      }
    });

    // Compare outputs
    const allOutputKeys = new Set([
      ...Object.keys(fromModel.outputs || {}),
      ...Object.keys(toModel.outputs || {})
    ]);

    allOutputKeys.forEach(key => {
      const fromValue = fromModel.outputs?.[key];
      const toValue = toModel.outputs?.[key];

      if (fromValue !== toValue) {
        changes.outputs[key] = {
          from: fromValue,
          to: toValue,
          type: fromValue === undefined ? 'added' : toValue === undefined ? 'removed' : 'modified',
          difference: this.calculateNumericDifference(fromValue, toValue)
        };
        changes.summary.outputChanges++;
        changes.summary.totalChanges++;
      }
    });

    return changes;
  }

  // Calculate numeric difference (absolute and percentage)
  calculateNumericDifference(from, to) {
    if (typeof from !== 'number' || typeof to !== 'number') {
      return null;
    }

    const absolute = to - from;
    const percentage = from !== 0 ? (absolute / from) * 100 : null;

    return {
      absolute,
      percentage,
      direction: absolute > 0 ? 'increase' : absolute < 0 ? 'decrease' : 'unchanged'
    };
  }

  // Get version statistics for a model
  getVersionStats(modelId) {
    const history = this.getVersionHistory(modelId);
    if (history.length === 0) return null;

    const _now = new Date();
    const oldestVersion = history[history.length - 1];
    const newestVersion = history[0];

    return {
      totalVersions: history.length,
      oldestVersion: {
        timestamp: oldestVersion.timestamp,
        age: this.getTimeAgo(oldestVersion.timestamp)
      },
      newestVersion: {
        timestamp: newestVersion.timestamp,
        age: this.getTimeAgo(newestVersion.timestamp)
      },
      averageChangesPerDay: this.calculateAverageChangesPerDay(history),
      mostActiveWeek: this.findMostActiveWeek(history)
    };
  }

  // Helper methods
  getAllVersions() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading versions:', error);
      return {};
    }
  }

  saveAllVersions(versions) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(versions));
    } catch (error) {
      console.error('Error saving versions:', error);
    }
  }

  generateVersionId() {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getNextVersionNumber(modelId) {
    const history = this.getVersionHistory(modelId);
    if (history.length === 0) return '1.0.0';

    const latestVersion = history[0].version;
    const parts = latestVersion.split('.').map(Number);
    parts[2]++; // Increment patch version

    return parts.join('.');
  }

  calculateChecksum(model) {
    // Simple checksum for integrity verification
    const str = JSON.stringify(model, Object.keys(model).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  }

  calculateAverageChangesPerDay(history) {
    if (history.length < 2) return 0;

    const oldest = new Date(history[history.length - 1].timestamp);
    const newest = new Date(history[0].timestamp);
    const daysDiff = (newest - oldest) / (1000 * 60 * 60 * 24);

    return daysDiff > 0 ? (history.length / daysDiff).toFixed(1) : 0;
  }

  findMostActiveWeek(history) {
    if (history.length < 2) return null;

    const weekCounts = {};
    history.forEach(version => {
      const date = new Date(version.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    });

    const maxWeek = Object.entries(weekCounts).reduce(
      (max, [week, count]) => (count > max.count ? { week, count } : max),
      { week: null, count: 0 }
    );

    return maxWeek.week
      ? {
          weekStart: maxWeek.week,
          changeCount: maxWeek.count
        }
      : null;
  }

  // Cleanup old versions
  cleanup(maxAge = 30) {
    // Default: 30 days
    const allVersions = this.getAllVersions();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    Object.keys(allVersions).forEach(modelId => {
      allVersions[modelId] = allVersions[modelId].filter(version => {
        const versionDate = new Date(version.timestamp);
        return versionDate >= cutoffDate;
      });

      // Keep at least the last 5 versions even if they're old
      if (allVersions[modelId].length < 5) {
        const originalHistory = this.getVersionHistory(modelId);
        allVersions[modelId] = originalHistory.slice(0, 5);
      }
    });

    this.saveAllVersions(allVersions);
  }

  // Export version history
  exportVersionHistory(modelId) {
    const history = this.getVersionHistory(modelId);
    const stats = this.getVersionStats(modelId);

    return {
      modelId,
      exportTimestamp: new Date().toISOString(),
      statistics: stats,
      versions: history.map(version => ({
        id: version.id,
        version: version.version,
        timestamp: version.timestamp,
        changeDescription: version.changeDescription,
        author: version.author,
        checksum: version.checksum,
        // Exclude the full model data to reduce size
        assumptions: Object.keys(version.model.assumptions || {}),
        outputs: Object.keys(version.model.outputs || {})
      }))
    };
  }
}

// Singleton instance
const versioningService = new VersioningService();
export default versioningService;
