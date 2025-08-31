/**
 * Version Control System for Financial Models
 * Git-like versioning with branching and merging capabilities
 * Integrated with collaboration service for team workflows
 */

class VersionControl {
  constructor(options = {}) {
    this.options = {
      maxVersions: 1000,
      maxBranches: 50,
      autoCommit: true,
      ...options
    };

    this.repositories = new Map();
    this.branches = new Map();
    this.commits = new Map();
    this.tags = new Map();
  }

  /**
   * Initialize repository for a document/workspace
   */
  async initializeRepository(repositoryId, options = {}) {
    const repository = {
      id: repositoryId,
      name: options.name || `Repository ${repositoryId}`,
      created: new Date(),
      branches: new Map(),
      commits: [],
      tags: new Map(),
      head: null,
      defaultBranch: 'main',
      collaborators: new Set([options.owner || 'system'])
    };

    // Store repository first before creating branch
    this.repositories.set(repositoryId, repository);

    // Create default branch
    const mainBranch = await this.createBranch(repositoryId, 'main', null, {
      author: options.owner || 'system'
    });

    repository.branches.set('main', mainBranch);
    repository.head = mainBranch;

    // Create initial commit for the main branch
    const initialCommit = {
      id: `${repositoryId}_initial_${Date.now()}`,
      repositoryId,
      branchId: mainBranch.id,
      parentCommitId: null,
      author: options.owner || 'system',
      message: 'Initial commit',
      timestamp: new Date(),
      changes: {},
      metadata: { type: 'initial' }
    };

    this.commits.set(initialCommit.id, initialCommit);
    repository.commits.push(initialCommit);
    mainBranch.commits.push(initialCommit.id);
    mainBranch.head = initialCommit.id;

    return repository;
  }

  /**
   * Create branch
   */
  async createBranch(repositoryId, branchName, sourceCommitId = null, options = {}) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    if (repository.branches.size >= this.options.maxBranches) {
      throw new Error('Maximum number of branches reached');
    }

    const branch = {
      id: `${repositoryId}_${branchName}_${Date.now()}`,
      name: branchName,
      repositoryId,
      created: new Date(),
      author: options.author || 'system',
      sourceCommitId,
      head: sourceCommitId,
      commits: [],
      metadata: options.metadata || {}
    };

    repository.branches.set(branchName, branch);
    this.branches.set(branch.id, branch);

    return branch;
  }

  /**
   * Commit changes
   */
  async commit(repositoryId, changes, options = {}) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    const currentBranch = repository.head;
    if (!currentBranch) {
      throw new Error('No active branch');
    }

    // Create commit
    const commit = {
      id: `${repositoryId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      repositoryId,
      branchId: currentBranch.id,
      parentCommitId: currentBranch.head,
      author: options.author || 'system',
      message: options.message || 'Auto commit',
      timestamp: new Date(),
      changes: this.serializeChanges(changes),
      metadata: {
        type: options.type || 'auto',
        description: options.description || '',
        tags: options.tags || [],
        ...options.metadata
      }
    };

    // Store commit
    this.commits.set(commit.id, commit);
    repository.commits.push(commit);
    currentBranch.commits.push(commit.id);
    currentBranch.head = commit.id;

    // Prune old commits if needed
    this.pruneOldCommits(repository);

    return commit;
  }

  /**
   * Serialize changes for storage
   */
  serializeChanges(changes) {
    // Convert changes to serializable format
    if (typeof changes === 'object') {
      return JSON.parse(JSON.stringify(changes));
    }
    return changes;
  }

  /**
   * Get commit by ID
   */
  getCommit(commitId) {
    return this.commits.get(commitId);
  }

  /**
   * Get commit history for branch
   */
  getCommitHistory(repositoryId, branchName = null, limit = 50) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return [];

    const branch = branchName ? repository.branches.get(branchName) : repository.head;

    if (!branch) return [];

    const commits = [];
    let currentCommitId = branch.head;

    while (currentCommitId && commits.length < limit) {
      const commit = this.commits.get(currentCommitId);
      if (!commit) break;

      commits.push(commit);
      currentCommitId = commit.parentCommitId;
    }

    return commits;
  }

  /**
   * Checkout branch
   */
  async checkout(repositoryId, branchName) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    const branch = repository.branches.get(branchName);
    if (!branch) {
      throw new Error(`Branch ${branchName} not found`);
    }

    repository.head = branch;

    return branch;
  }

  /**
   * Merge branches
   */
  async merge(repositoryId, sourceBranchName, targetBranchName, options = {}) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    const sourceBranch = repository.branches.get(sourceBranchName);
    const targetBranch = repository.branches.get(targetBranchName);

    if (!sourceBranch || !targetBranch) {
      throw new Error('Source or target branch not found');
    }

    // Find merge base (common ancestor)
    const mergeBase = this.findMergeBase(sourceBranch, targetBranch);

    if (!mergeBase) {
      throw new Error('No common ancestor found');
    }

    // Check for conflicts
    const conflicts = this.detectMergeConflicts(sourceBranch, targetBranch, mergeBase);

    if (conflicts.length > 0) {
      if (!options.force) {
        return {
          success: false,
          conflicts,
          message: 'Merge conflicts detected'
        };
      }
    }

    // Create merge commit
    const mergeCommit = {
      id: `${repositoryId}_merge_${Date.now()}`,
      repositoryId,
      branchId: targetBranch.id,
      parentCommitId: targetBranch.head,
      mergeParents: [targetBranch.head, sourceBranch.head],
      author: options.author || 'system',
      message: options.message || `Merge branch '${sourceBranchName}' into '${targetBranchName}'`,
      timestamp: new Date(),
      changes: this.computeMergeChanges(sourceBranch, targetBranch, mergeBase),
      metadata: {
        type: 'merge',
        sourceBranch: sourceBranchName,
        targetBranch: targetBranchName,
        conflictsResolved: conflicts.length,
        ...options.metadata
      }
    };

    // Store merge commit
    this.commits.set(mergeCommit.id, mergeCommit);
    repository.commits.push(mergeCommit);
    targetBranch.commits.push(mergeCommit.id);
    targetBranch.head = mergeCommit.id;

    return {
      success: true,
      commit: mergeCommit,
      conflicts: conflicts.length
    };
  }

  /**
   * Find merge base (lowest common ancestor)
   */
  findMergeBase(branch1, branch2) {
    const commits1 = new Set(branch1.commits);
    const commits2 = new Set(branch2.commits);

    // Find intersection of commit histories
    for (const commitId of branch1.commits) {
      if (commits2.has(commitId)) {
        return this.commits.get(commitId);
      }
    }

    return null;
  }

  /**
   * Detect merge conflicts
   */
  detectMergeConflicts(sourceBranch, targetBranch, mergeBase) {
    const conflicts = [];

    // Get changes since merge base for both branches
    const sourceChanges = this.getChangesSince(sourceBranch, mergeBase?.id);
    const targetChanges = this.getChangesSince(targetBranch, mergeBase?.id);

    // Find conflicting changes
    for (const [path, sourceChange] of Object.entries(sourceChanges)) {
      const targetChange = targetChanges[path];

      if (targetChange && this.areChangesConflicting(sourceChange, targetChange)) {
        conflicts.push({
          path,
          source: sourceChange,
          target: targetChange
        });
      }
    }

    return conflicts;
  }

  /**
   * Get changes since commit
   */
  getChangesSince(branch, sinceCommitId) {
    const changes = {};
    let currentCommitId = branch.head;

    while (currentCommitId && currentCommitId !== sinceCommitId) {
      const commit = this.commits.get(currentCommitId);
      if (!commit) break;

      // Merge changes (later commits override earlier ones)
      Object.assign(changes, commit.changes);
      currentCommitId = commit.parentCommitId;
    }

    return changes;
  }

  /**
   * Check if changes conflict
   */
  areChangesConflicting(change1, change2) {
    // Simple conflict detection - same path modified differently
    return change1.value !== change2.value;
  }

  /**
   * Compute merge changes
   */
  computeMergeChanges(sourceBranch, targetBranch, mergeBase) {
    const sourceChanges = this.getChangesSince(sourceBranch, mergeBase?.id);
    const targetChanges = this.getChangesSince(targetBranch, mergeBase?.id);

    // Merge changes (target changes take precedence)
    return { ...sourceChanges, ...targetChanges };
  }

  /**
   * Create tag
   */
  async createTag(repositoryId, tagName, commitId, options = {}) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    const commit = this.commits.get(commitId);
    if (!commit) {
      throw new Error(`Commit ${commitId} not found`);
    }

    const tag = {
      id: `${repositoryId}_tag_${tagName}`,
      name: tagName,
      repositoryId,
      commitId,
      author: options.author || 'system',
      message: options.message || '',
      created: new Date(),
      metadata: options.metadata || {}
    };

    repository.tags.set(tagName, tag);
    this.tags.set(tag.id, tag);

    return tag;
  }

  /**
   * Get repository statistics
   */
  getRepositoryStats(repositoryId) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return null;

    const stats = {
      totalCommits: repository.commits.length,
      totalBranches: repository.branches.size,
      totalTags: repository.tags.size,
      collaborators: repository.collaborators.size,
      created: repository.created,
      lastActivity:
        repository.commits.length > 0
          ? repository.commits[repository.commits.length - 1].timestamp
          : repository.created
    };

    // Branch statistics
    stats.branches = {};
    for (const [branchName, branch] of repository.branches) {
      stats.branches[branchName] = {
        commits: branch.commits.length,
        lastCommit:
          branch.commits.length > 0
            ? this.commits.get(branch.commits[branch.commits.length - 1])?.timestamp
            : null
      };
    }

    return stats;
  }

  /**
   * Prune old commits to maintain performance
   */
  pruneOldCommits(repository) {
    if (repository.commits.length <= this.options.maxVersions) return;

    // Keep only recent commits
    const commitsToKeep = repository.commits.slice(-this.options.maxVersions);
    const commitsToRemove = repository.commits.slice(0, -this.options.maxVersions);

    // Remove from storage
    commitsToRemove.forEach(commit => {
      this.commits.delete(commit.id);
    });

    repository.commits = commitsToKeep;

    // Update branches to point to existing commits
    for (const branch of repository.branches.values()) {
      if (branch.head && commitsToRemove.some(c => c.id === branch.head)) {
        // Find the closest ancestor that still exists
        branch.head = this.findClosestExistingAncestor(branch, commitsToKeep);
      }
    }
  }

  /**
   * Find closest existing ancestor commit
   */
  findClosestExistingAncestor(branch, existingCommits) {
    const existingCommitIds = new Set(existingCommits.map(c => c.id));

    for (let i = branch.commits.length - 1; i >= 0; i--) {
      const commitId = branch.commits[i];
      if (existingCommitIds.has(commitId)) {
        return commitId;
      }
    }

    return null;
  }

  /**
   * Export repository
   */
  exportRepository(repositoryId) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return null;

    const exportData = {
      repository: {
        id: repository.id,
        name: repository.name,
        created: repository.created,
        defaultBranch: repository.defaultBranch
      },
      branches: {},
      commits: {},
      tags: {}
    };

    // Export branches
    for (const [branchName, branch] of repository.branches) {
      exportData.branches[branchName] = {
        id: branch.id,
        name: branch.name,
        head: branch.head,
        commits: branch.commits
      };
    }

    // Export commits
    for (const commit of repository.commits) {
      exportData.commits[commit.id] = {
        ...commit,
        changes: commit.changes // Include changes for full export
      };
    }

    // Export tags
    for (const [tagName, tag] of repository.tags) {
      exportData.tags[tagName] = tag;
    }

    return exportData;
  }

  /**
   * Import repository
   */
  async importRepository(importData) {
    const repositoryId = importData.repository.id;

    // Initialize repository
    const repository = await this.initializeRepository(repositoryId, {
      name: importData.repository.name,
      owner: 'import'
    });

    // Import commits
    for (const [commitId, commitData] of Object.entries(importData.commits)) {
      this.commits.set(commitId, commitData);
      repository.commits.push(commitData);
    }

    // Import branches
    for (const [branchName, branchData] of Object.entries(importData.branches)) {
      const branch = {
        ...branchData,
        repositoryId,
        created: new Date(branchData.created || Date.now())
      };

      repository.branches.set(branchName, branch);
      this.branches.set(branch.id, branch);
    }

    // Set head to default branch
    const defaultBranch = repository.branches.get(importData.repository.defaultBranch);
    if (defaultBranch) {
      repository.head = defaultBranch;
    }

    // Import tags
    for (const [tagName, tagData] of Object.entries(importData.tags)) {
      repository.tags.set(tagName, tagData);
      this.tags.set(tagData.id, tagData);
    }

    return repository;
  }

  /**
   * Get repository info
   */
  getRepositoryInfo(repositoryId) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return null;

    return {
      id: repository.id,
      name: repository.name,
      created: repository.created,
      branches: Array.from(repository.branches.keys()),
      tags: Array.from(repository.tags.keys()),
      head: repository.head?.name,
      collaborators: Array.from(repository.collaborators)
    };
  }

  /**
   * List repositories
   */
  listRepositories() {
    const repositories = [];

    for (const repository of this.repositories.values()) {
      repositories.push(this.getRepositoryInfo(repository.id));
    }

    return repositories;
  }

  /**
   * Delete repository
   */
  async deleteRepository(repositoryId) {
    const repository = this.repositories.get(repositoryId);
    if (!repository) return;

    // Delete all branches
    for (const branch of repository.branches.values()) {
      this.branches.delete(branch.id);
    }

    // Delete all commits
    for (const commit of repository.commits) {
      this.commits.delete(commit.id);
    }

    // Delete all tags
    for (const tag of repository.tags.values()) {
      this.tags.delete(tag.id);
    }

    this.repositories.delete(repositoryId);
  }

  /**
   * Get version control statistics
   */
  getStats() {
    return {
      repositories: this.repositories.size,
      branches: this.branches.size,
      commits: this.commits.size,
      tags: this.tags.size
    };
  }
}

// Export singleton instance
export const versionControl = new VersionControl({
  maxVersions: 1000,
  maxBranches: 50,
  autoCommit: true
});

export default VersionControl;
