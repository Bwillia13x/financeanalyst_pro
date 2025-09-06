/**
 * User Preferences and Workspace Customization Service
 * Manages user settings, preferences, and workspace personalization
 */

class UserPreferencesService {
  constructor() {
    this.preferences = new Map();
    this.workspaces = new Map();
    this.themes = new Map();
    this.layouts = new Map();
    this.shortcuts = new Map();
    this.isInitialized = false;

    this.defaultPreferences = {
      // Appearance
      theme: 'professional',
      fontSize: 'medium',
      density: 'comfortable',
      colorScheme: 'light',
      animations: true,

      // Dashboard & Layout
      defaultView: 'dashboard',
      sidebarCollapsed: false,
      gridSize: 'medium',
      widgetAnimations: true,
      autoSaveInterval: 30000, // 30 seconds

      // Data & Analysis
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'standard',
      precision: 2,
      autoRefreshData: true,
      refreshInterval: 300000, // 5 minutes

      // Notifications
      enableNotifications: true,
      emailNotifications: false,
      soundEffects: true,
      pushNotifications: true,

      // Analysis & Modeling
      defaultTimeHorizon: '5Y',
      riskFreeRate: 0.03,
      marketRiskPremium: 0.07,
      defaultDiscountRate: 0.1,
      confidenceLevel: 0.95,

      // Collaboration
      shareByDefault: false,
      allowComments: true,
      trackChanges: true,
      notifyOnChanges: true,

      // Performance & Data
      enableCaching: true,
      offlineMode: false,
      dataValidation: true,
      autoBackup: true,

      // Keyboard & Navigation
      keyboardShortcuts: true,
      mouseNavigation: true,
      touchGestures: true,
      commandPalette: true,

      // CLI
      alwaysShowCLI: true
    };

    this.initializeService();
  }

  /**
   * Initialize the preferences service
   */
  async initializeService() {
    try {
      await this.loadUserPreferences();
      await this.loadWorkspaceConfigurations();
      await this.initializeThemes();
      await this.initializeLayouts();
      await this.setupAutoSave();

      this.isInitialized = true;
      console.log('User preferences service initialized');
    } catch (error) {
      console.error('Error initializing preferences service:', error);
    }
  }

  /**
   * Load user preferences from storage
   */
  async loadUserPreferences() {
    try {
      const storedPrefs = localStorage.getItem('financeanalyst_user_preferences');
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        this.preferences.set('current', {
          ...this.defaultPreferences,
          ...parsed,
          lastUpdated: new Date().toISOString()
        });
      } else {
        this.preferences.set('current', {
          ...this.defaultPreferences,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      this.preferences.set('current', this.defaultPreferences);
    }
  }

  /**
   * Load workspace configurations
   */
  async loadWorkspaceConfigurations() {
    try {
      const storedWorkspaces = localStorage.getItem('financeanalyst_workspaces');
      if (storedWorkspaces) {
        const parsed = JSON.parse(storedWorkspaces);
        Object.entries(parsed).forEach(([id, workspace]) => {
          this.workspaces.set(id, workspace);
        });
      }

      // Ensure default workspace exists
      if (!this.workspaces.has('default')) {
        this.createDefaultWorkspace();
      }
    } catch (error) {
      console.error('Error loading workspace configurations:', error);
      this.createDefaultWorkspace();
    }
  }

  /**
   * Initialize available themes
   */
  async initializeThemes() {
    const themes = {
      light: {
        id: 'light',
        name: 'Light',
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#06b6d4',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#0f172a',
          border: '#e2e8f0'
        },
        shadows: true,
        borderRadius: '8px'
      },
      dark: {
        id: 'dark',
        name: 'Dark',
        colors: {
          primary: '#60a5fa',
          secondary: '#94a3b8',
          accent: '#22d3ee',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          border: '#334155'
        },
        shadows: false,
        borderRadius: '8px'
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        colors: {
          primary: '#1e40af',
          secondary: '#475569',
          accent: '#0ea5e9',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          border: '#cbd5e1'
        },
        shadows: true,
        borderRadius: '6px'
      },
      high_contrast: {
        id: 'high_contrast',
        name: 'High Contrast',
        colors: {
          primary: '#000000',
          secondary: '#666666',
          accent: '#0066cc',
          background: '#ffffff',
          surface: '#f5f5f5',
          text: '#000000',
          border: '#999999'
        },
        shadows: false,
        borderRadius: '4px'
      }
    };

    Object.entries(themes).forEach(([id, theme]) => {
      this.themes.set(id, theme);
    });
  }

  /**
   * Initialize layout templates
   */
  async initializeLayouts() {
    const layouts = {
      dashboard: {
        id: 'dashboard',
        name: 'Dashboard',
        grid: { rows: 6, cols: 12 },
        widgets: [
          { id: 'market_overview', x: 0, y: 0, w: 6, h: 2 },
          { id: 'portfolio_summary', x: 6, y: 0, w: 6, h: 2 },
          { id: 'watchlist', x: 0, y: 2, w: 4, h: 4 },
          { id: 'news_feed', x: 4, y: 2, w: 4, h: 4 },
          { id: 'performance_chart', x: 8, y: 2, w: 4, h: 4 }
        ]
      },
      analysis: {
        id: 'analysis',
        name: 'Analysis Focused',
        grid: { rows: 8, cols: 12 },
        widgets: [
          { id: 'financial_model', x: 0, y: 0, w: 8, h: 6 },
          { id: 'assumptions', x: 8, y: 0, w: 4, h: 3 },
          { id: 'results', x: 8, y: 3, w: 4, h: 3 },
          { id: 'scenarios', x: 0, y: 6, w: 12, h: 2 }
        ]
      },
      research: {
        id: 'research',
        name: 'Research',
        grid: { rows: 6, cols: 12 },
        widgets: [
          { id: 'company_data', x: 0, y: 0, w: 6, h: 3 },
          { id: 'peer_comparison', x: 6, y: 0, w: 6, h: 3 },
          { id: 'analyst_notes', x: 0, y: 3, w: 8, h: 3 },
          { id: 'documents', x: 8, y: 3, w: 4, h: 3 }
        ]
      },
      minimal: {
        id: 'minimal',
        name: 'Minimal',
        grid: { rows: 4, cols: 8 },
        widgets: [
          { id: 'key_metrics', x: 0, y: 0, w: 8, h: 2 },
          { id: 'primary_chart', x: 0, y: 2, w: 8, h: 2 }
        ]
      }
    };

    Object.entries(layouts).forEach(([id, layout]) => {
      this.layouts.set(id, layout);
    });
  }

  /**
   * Setup auto-save functionality
   */
  setupAutoSave() {
    const prefs = this.getPreferences();
    const interval = prefs.autoSaveInterval || 30000;

    setInterval(() => {
      this.saveToStorage();
    }, interval);

    // Save on browser unload
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }

  /**
   * Get current user preferences
   */
  getPreferences() {
    return this.preferences.get('current') || this.defaultPreferences;
  }

  /**
   * Update user preferences
   */
  updatePreferences(updates) {
    const current = this.getPreferences();
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    this.preferences.set('current', updated);
    this.saveToStorage();
    this.applyPreferences(updated);

    return updated;
  }

  /**
   * Reset preferences to default
   */
  resetPreferences() {
    const reset = {
      ...this.defaultPreferences,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    this.preferences.set('current', reset);
    this.saveToStorage();
    this.applyPreferences(reset);

    return reset;
  }

  /**
   * Create default workspace
   */
  createDefaultWorkspace() {
    const defaultWorkspace = {
      id: 'default',
      name: 'Default Workspace',
      layout: 'dashboard',
      widgets: this.layouts.get('dashboard')?.widgets || [],
      pinnedItems: [],
      quickAccess: [
        { id: 'private_analysis', name: 'Private Analysis', icon: 'BarChart3' },
        { id: 'market_data', name: 'Market Data', icon: 'TrendingUp' },
        { id: 'portfolio', name: 'Portfolio', icon: 'PieChart' },
        { id: 'reports', name: 'Reports', icon: 'FileText' }
      ],
      customizations: {
        showWelcome: true,
        compactMode: false,
        showTips: true
      },
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };

    this.workspaces.set('default', defaultWorkspace);
  }

  /**
   * Create new workspace
   */
  createWorkspace(config) {
    const id = config.id || `workspace_${Date.now()}`;
    const workspace = {
      id,
      name: config.name || 'New Workspace',
      layout: config.layout || 'dashboard',
      widgets: config.widgets || this.layouts.get(config.layout || 'dashboard')?.widgets || [],
      pinnedItems: config.pinnedItems || [],
      quickAccess: config.quickAccess || [],
      customizations: config.customizations || {},
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };

    this.workspaces.set(id, workspace);
    this.saveToStorage();

    return workspace;
  }

  /**
   * Update workspace
   */
  updateWorkspace(id, updates) {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace ${id} not found`);
    }

    const updated = {
      ...workspace,
      ...updates,
      lastAccessed: new Date().toISOString()
    };

    this.workspaces.set(id, updated);
    this.saveToStorage();

    return updated;
  }

  /**
   * Delete workspace
   */
  deleteWorkspace(id) {
    if (id === 'default') {
      throw new Error('Cannot delete default workspace');
    }

    this.workspaces.delete(id);
    this.saveToStorage();
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id) {
    return this.workspaces.get(id);
  }

  /**
   * Get all workspaces
   */
  getWorkspaces() {
    return Array.from(this.workspaces.values());
  }

  /**
   * Switch to workspace
   */
  switchWorkspace(id) {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace ${id} not found`);
    }

    // Update last accessed
    workspace.lastAccessed = new Date().toISOString();
    this.workspaces.set(id, workspace);

    // Update current workspace preference
    this.updatePreferences({ currentWorkspace: id });

    return workspace;
  }

  /**
   * Get available themes
   */
  getThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme by ID
   */
  getTheme(id) {
    return this.themes.get(id);
  }

  /**
   * Get available layouts
   */
  getLayouts() {
    return Array.from(this.layouts.values());
  }

  /**
   * Get layout by ID
   */
  getLayout(id) {
    return this.layouts.get(id);
  }

  /**
   * Apply preferences to the application
   */
  applyPreferences(preferences) {
    // Apply theme
    this.applyTheme(preferences.theme);

    // Apply font size
    this.applyFontSize(preferences.fontSize);

    // Apply animations setting
    this.applyAnimationSettings(preferences.animations);

    // Apply keyboard shortcuts
    if (preferences.keyboardShortcuts) {
      this.enableKeyboardShortcuts();
    }

    // Trigger preference change event
    window.dispatchEvent(
      new CustomEvent('preferencesChanged', {
        detail: preferences
      })
    );
  }

  /**
   * Apply theme to document
   */
  applyTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) return;

    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply theme class
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeId}`);
  }

  /**
   * Apply font size setting
   */
  applyFontSize(size) {
    const root = document.documentElement;
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      extra_large: '20px'
    };

    root.style.setProperty('--base-font-size', sizes[size] || sizes.medium);
    document.body.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');

    const classList = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      extra_large: 'text-xl'
    };

    document.body.classList.add(classList[size] || 'text-base');
  }

  /**
   * Apply animation settings
   */
  applyAnimationSettings(enabled) {
    document.body.classList.toggle('reduce-motion', !enabled);

    if (!enabled) {
      document.body.style.setProperty('--animation-duration', '0ms');
      document.body.style.setProperty('--transition-duration', '0ms');
    } else {
      document.body.style.removeProperty('--animation-duration');
      document.body.style.removeProperty('--transition-duration');
    }
  }

  /**
   * Enable keyboard shortcuts
   */
  enableKeyboardShortcuts() {
    // This would integrate with a keyboard shortcut manager
    console.log('Keyboard shortcuts enabled');
  }

  /**
   * Save preferences and workspaces to storage
   */
  saveToStorage() {
    try {
      // Save preferences
      const prefs = this.preferences.get('current');
      if (prefs) {
        localStorage.setItem('financeanalyst_user_preferences', JSON.stringify(prefs));
      }

      // Save workspaces
      const workspacesObj = {};
      this.workspaces.forEach((workspace, id) => {
        workspacesObj[id] = workspace;
      });
      localStorage.setItem('financeanalyst_workspaces', JSON.stringify(workspacesObj));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  /**
   * Export preferences and workspace settings
   */
  exportSettings() {
    const settings = {
      preferences: this.preferences.get('current'),
      workspaces: Array.from(this.workspaces.values()),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return settings;
  }

  /**
   * Import preferences and workspace settings
   */
  importSettings(settings) {
    try {
      if (settings.preferences) {
        this.preferences.set('current', {
          ...this.defaultPreferences,
          ...settings.preferences,
          lastUpdated: new Date().toISOString()
        });
      }

      if (settings.workspaces) {
        settings.workspaces.forEach(workspace => {
          this.workspaces.set(workspace.id, workspace);
        });
      }

      this.saveToStorage();
      this.applyPreferences(this.getPreferences());

      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }

  /**
   * Get preference categories for UI organization
   */
  getPreferenceCategories() {
    return {
      appearance: {
        name: 'Appearance',
        icon: 'Palette',
        preferences: ['theme', 'fontSize', 'density', 'colorScheme', 'animations']
      },
      dashboard: {
        name: 'Dashboard & Layout',
        icon: 'Layout',
        preferences: [
          'defaultView',
          'sidebarCollapsed',
          'gridSize',
          'widgetAnimations',
          'autoSaveInterval'
        ]
      },
      data: {
        name: 'Data & Analysis',
        icon: 'Database',
        preferences: [
          'currency',
          'dateFormat',
          'numberFormat',
          'precision',
          'autoRefreshData',
          'refreshInterval'
        ]
      },
      notifications: {
        name: 'Notifications',
        icon: 'Bell',
        preferences: [
          'enableNotifications',
          'emailNotifications',
          'soundEffects',
          'pushNotifications'
        ]
      },
      modeling: {
        name: 'Analysis & Modeling',
        icon: 'Calculator',
        preferences: [
          'defaultTimeHorizon',
          'riskFreeRate',
          'marketRiskPremium',
          'defaultDiscountRate',
          'confidenceLevel'
        ]
      },
      collaboration: {
        name: 'Collaboration',
        icon: 'Users',
        preferences: ['shareByDefault', 'allowComments', 'trackChanges', 'notifyOnChanges']
      },
      performance: {
        name: 'Performance & Data',
        icon: 'Zap',
        preferences: ['enableCaching', 'offlineMode', 'dataValidation', 'autoBackup']
      },
      navigation: {
        name: 'Keyboard & Navigation',
        icon: 'Navigation',
        preferences: ['keyboardShortcuts', 'mouseNavigation', 'touchGestures', 'commandPalette', 'alwaysShowCLI']
      }
    };
  }
}

export default new UserPreferencesService();
