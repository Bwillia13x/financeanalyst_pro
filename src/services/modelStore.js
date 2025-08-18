// Model Store - localStorage with API capability

const STORAGE_KEY = 'valor.models';
const SCHEMA_VERSION = '1.0';

/**
 * Generate unique ID for models
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Generate semantic version bump
 */
function bumpVersion(currentVersion) {
  const match = currentVersion.match(/^v(\d+)\.(\d+)$/);
  if (!match) return 'v1.0';

  const major = parseInt(match[1]);
  const minor = parseInt(match[2]);
  return `v${major}.${minor + 1}`;
}

/**
 * Create default model from template
 */
function createDefaultModel(kind, templateData = {}) {
  const now = new Date().toISOString();
  const defaults = {
    DCF: { rev0: 5_000_000_000, margin: 0.16, tax: 0.23, g: 0.05, tg: 0.02, wacc: 0.09, price: 25, shares: 300_000_000, netDebt: 2_000_000_000 },
    Comps: { metric: 800_000_000, multiple: 9, price: 25, shares: 300_000_000, netDebt: 2_000_000_000 },
    EPV: { ebit: 700_000_000, tax: 0.23, wacc: 0.09, price: 25, shares: 300_000_000, netDebt: 2_000_000_000 },
    LBO: { ebitda: 600_000_000, entryX: 9, exitX: 9, debtPct: 0.55, years: 5, ebitdaCAGR: 0.06 }
  };

  return {
    id: generateId(),
    name: `${kind} Model`,
    kind,
    tags: ['demo', kind.toLowerCase()],
    version: 'v1.0',
    created: now,
    updated: now,
    currency: 'USD',
    assumptions: { ...defaults[kind], ...templateData },
    outputs: {},
    selected: false,
    ...templateData
  };
}

/**
 * ModelStore Implementation
 */
class ModelStore {
  constructor() {
    this.models = this.loadFromStorage();
    this.listeners = new Set();
  }

  /**
   * Load models from localStorage with migration support
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const data = JSON.parse(stored);

      // Handle schema migration
      if (data.schemaVersion !== SCHEMA_VERSION) {
        console.log('Migrating model storage schema...');
        return this.migrateSchema(data);
      }

      return data.models || [];
    } catch (error) {
      console.error('Error loading models from storage:', error);
      return [];
    }
  }

  /**
   * Save models to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        schemaVersion: SCHEMA_VERSION,
        models: this.models,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving models to storage:', error);
      throw new Error('Failed to save models to storage');
    }
  }

  /**
   * Migrate from older schema versions
   */
  migrateSchema(oldData) {
    // Handle migration from simple array format
    if (Array.isArray(oldData)) {
      return oldData.map(model => ({
        ...model,
        currency: model.currency || 'USD',
        created: model.created || model.updated || new Date().toISOString()
      }));
    }

    return oldData.models || [];
  }

  /**
   * Add change listener
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.models));
  }

  /**
   * List all models
   */
  list() {
    return [...this.models];
  }

  /**
   * Get model by ID
   */
  get(id) {
    return this.models.find(m => m.id === id);
  }

  /**
   * Save or update model
   */
  save(model) {
    const now = new Date().toISOString();
    const existingIndex = this.models.findIndex(m => m.id === model.id);

    const updatedModel = {
      ...model,
      updated: now,
      // Set created timestamp for new models
      created: model.created || now
    };

    if (existingIndex >= 0) {
      this.models[existingIndex] = updatedModel;
    } else {
      this.models.push(updatedModel);
    }

    this.saveToStorage();
    return updatedModel;
  }

  /**
   * Delete model by ID
   */
  delete(id) {
    const initialLength = this.models.length;
    this.models = this.models.filter(m => m.id !== id);

    if (this.models.length < initialLength) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Clone existing model
   */
  clone(id) {
    const original = this.get(id);
    if (!original) return null;

    const cloned = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copy)`,
      version: 'v1.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      selected: false
    };

    return this.save(cloned);
  }

  /**
   * Bump model version
   */
  bumpVersion(id, changeReason = '') {
    const model = this.get(id);
    if (!model) return null;

    const updated = {
      ...model,
      version: bumpVersion(model.version),
      updated: new Date().toISOString()
    };

    return this.save(updated);
  }

  /**
   * Export models to JSON
   */
  export(ids = null) {
    const modelsToExport = ids ?
      this.models.filter(m => ids.includes(m.id)) :
      this.models;

    const exportData = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      models: modelsToExport
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return blob;
  }

  /**
   * Import models from JSON
   */
  import(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // Validate import data
      if (!data.models || !Array.isArray(data.models)) {
        throw new Error('Invalid import format: missing models array');
      }

      const importedModels = [];
      const now = new Date().toISOString();

      for (const modelData of data.models) {
        // Generate new ID to avoid conflicts
        const imported = {
          ...modelData,
          id: generateId(),
          created: now,
          updated: now,
          // Mark as imported
          tags: [...(modelData.tags || []), 'imported']
        };

        // Validate required fields
        if (!imported.kind || !imported.name || !imported.assumptions) {
          console.warn('Skipping invalid model:', imported);
          continue;
        }

        this.models.push(imported);
        importedModels.push(imported);
      }

      if (importedModels.length > 0) {
        this.saveToStorage();
      }

      return importedModels;
    } catch (error) {
      console.error('Error importing models:', error);
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Search models by query
   */
  search(query, tag = null) {
    const lowerQuery = query.toLowerCase();
    return this.models.filter(model => {
      const matchesQuery = !query ||
        model.name.toLowerCase().includes(lowerQuery) ||
        model.tags.some(t => t.toLowerCase().includes(lowerQuery));

      const matchesTag = !tag || model.tags.includes(tag);

      return matchesQuery && matchesTag;
    });
  }

  /**
   * Get all unique tags
   */
  getAllTags() {
    const tags = new Set();
    this.models.forEach(model => {
      model.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Create model from template
   */
  createFromTemplate(kind, name = null) {
    const model = createDefaultModel(kind);
    if (name) model.name = name;
    return this.save(model);
  }

  /**
   * Clear all models (with confirmation in UI)
   */
  clear() {
    this.models = [];
    this.saveToStorage();
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const totalSize = localStorage.getItem(STORAGE_KEY)?.length || 0;
    const modelCounts = {};

    this.models.forEach(model => {
      modelCounts[model.kind] = (modelCounts[model.kind] || 0) + 1;
    });

    return {
      totalModels: this.models.length,
      storageSize: totalSize,
      modelCounts,
      lastUpdated: this.models.length > 0 ?
        Math.max(...this.models.map(m => new Date(m.updated).getTime())) : null
    };
  }
}

// Export singleton instance
export const modelStore = new ModelStore();

// Export class for testing
export { ModelStore };
