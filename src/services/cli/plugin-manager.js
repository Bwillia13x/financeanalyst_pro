/**
 * CLI Plugin Manager
 * Manages plugin loading, registration, and lifecycle for extensible CLI functionality
 */

export class PluginManager {
  constructor(cli) {
    this.cli = cli;
    this.plugins = new Map();
    this.loadedPlugins = new Map();
    this.pluginRegistry = new Map();
    this.dependencies = new Map();

    // Plugin configuration
    this.config = {
      pluginPath: '/plugins',
      autoLoad: true,
      enableSandbox: true,
      maxPlugins: 50
    };

    // Core plugin definitions
    this.corePlugins = {
      calculators: {
        name: 'Financial Calculators',
        description: 'DCF, LBO, Comps, and other financial calculators',
        version: '1.0.0',
        commands: ['dcf', 'lbo', 'comps', 'epv'],
        dependencies: [],
        load: async () => {
          // Mock calculator plugin - in real implementation, this would load actual calculator modules
          return {
            dcf: (inputs, context) => ({ ev: 1000000000, perShare: 50 }),
            lbo: (inputs, context) => ({ irr: 0.25, npv: -50000000 }),
            comps: (inputs, context) => ({ ev: 1200000000, perShare: 60 }),
            epv: (inputs, context) => ({ ev: 800000000, perShare: 40 })
          };
        }
      },

      'market-data': {
        name: 'Market Data Provider',
        description: 'Real-time market data, quotes, and charts',
        version: '1.0.0',
        commands: ['quote', 'chart', 'news'],
        dependencies: ['calculators'],
        load: async () => {
          return {
            quote: (symbol, context) => ({ symbol, price: 150, change: 2.5 }),
            chart: (symbol, options, context) =>
              `Chart data for ${symbol}: [${Array.from({ length: 30 }, (_, i) => Math.random() * 100).join(',')}]`,
            news: (symbol, context) => [`News item 1 for ${symbol}`, `News item 2 for ${symbol}`]
          };
        }
      },

      portfolio: {
        name: 'Portfolio Management',
        description: 'Portfolio analysis, optimization, and risk management',
        version: '1.0.0',
        commands: ['portfolio', 'analyze', 'optimize'],
        dependencies: ['calculators', 'market-data'],
        load: async () => {
          return {
            portfolio: (args, context) => {
              if (args.action === 'create') {
                return { id: `p${Date.now()}`, name: args.name, created: new Date().toISOString() };
              } else if (args.action === 'list') {
                return [{ id: 'p1', name: 'Tech Growth Portfolio', holdings: 3 }];
              }
              return { error: 'Invalid portfolio action' };
            },
            analyze: (portfolio, context) => ({
              return: 0.12,
              risk: 0.15,
              sharpe: 1.8,
              maxDrawdown: -0.08,
              holdings: portfolio?.holdings || []
            }),
            optimize: (portfolio, target, context) => ({
              optimized: true,
              targetReturn: target || 0.15,
              newWeights: { AAPL: 0.5, MSFT: 0.3, TSLA: 0.2 }
            })
          };
        }
      },

      reporting: {
        name: 'Advanced Reporting',
        description: 'Export, visualization, and report generation',
        version: '1.0.0',
        commands: ['export', 'report', 'visualize'],
        dependencies: ['calculators'],
        load: async () => {
          return {
            export: (data, format, context) => {
              const timestamp = new Date().toISOString();
              return {
                format: format || 'excel',
                filename: `export_${timestamp}.${format || 'xlsx'}`,
                data: data || 'Sample export data',
                exported: true
              };
            },
            report: (type, context) => {
              const reportTypes = {
                monthly: 'Monthly Financial Report',
                quarterly: 'Quarterly Analysis Report',
                annual: 'Annual Comprehensive Report'
              };
              return {
                type: type || 'monthly',
                title: reportTypes[type] || 'Custom Report',
                generated: new Date().toISOString(),
                sections: [
                  'Executive Summary',
                  'Financial Analysis',
                  'Risk Assessment',
                  'Recommendations'
                ]
              };
            },
            visualize: (data, context) => ({
              type: 'chart',
              data: data || [10, 20, 30, 40, 50],
              format: 'interactive',
              rendered: true
            })
          };
        }
      },

      automation: {
        name: 'Workflow Automation',
        description: 'Automated analysis workflows and scheduled tasks',
        version: '1.0.0',
        commands: ['schedule', 'workflow', 'batch'],
        dependencies: ['calculators', 'reporting'],
        load: async () => {
          return {
            schedule: (task, schedule, context) => ({
              id: `s${Date.now()}`,
              task,
              schedule,
              created: new Date().toISOString()
            }),
            workflow: (name, context) => ({
              name,
              status: 'executed',
              result: `Workflow ${name} completed successfully`,
              executed: new Date().toISOString()
            }),
            batch: (tasks, context) => ({
              processed: tasks?.length || 0,
              successful: tasks?.length || 0,
              failed: 0,
              result: `${tasks?.length || 0} tasks processed successfully`
            })
          };
        }
      }
    };
  }

  /**
   * Initialize the plugin manager
   */
  async initialize() {
    console.log('🔌 Plugin Manager initializing...');

    // Load plugin registry from storage
    await this.loadPluginRegistry();

    // Register core plugins
    await this.registerCorePlugins();

    console.log('✅ Plugin Manager initialized');
  }

  /**
   * Register core plugins
   */
  async registerCorePlugins() {
    for (const [pluginId, pluginDef] of Object.entries(this.corePlugins)) {
      await this.registerPlugin(pluginId, pluginDef);
    }
  }

  /**
   * Register a plugin
   */
  async registerPlugin(pluginId, pluginDefinition) {
    const plugin = {
      id: pluginId,
      ...pluginDefinition,
      registeredAt: new Date().toISOString(),
      status: 'registered',
      instance: null
    };

    // Validate plugin definition
    if (!this.validatePluginDefinition(plugin)) {
      console.warn(`Invalid plugin definition for ${pluginId}, skipping`);
      return false;
    }

    // Register plugin
    this.plugins.set(pluginId, plugin);
    this.pluginRegistry.set(pluginId, pluginDefinition);

    // Register commands if provided
    if (pluginDefinition.commands) {
      await this.registerPluginCommands(pluginId, pluginDefinition);
    }

    // Store dependencies
    if (pluginDefinition.dependencies) {
      this.dependencies.set(pluginId, pluginDefinition.dependencies);
    }

    console.log(`📦 Registered plugin: ${pluginId} (${pluginDefinition.name})`);
    return true;
  }

  /**
   * Validate plugin definition
   */
  validatePluginDefinition(plugin) {
    const required = ['name', 'description', 'version', 'load'];

    for (const field of required) {
      if (!plugin[field]) {
        console.warn(`Plugin ${plugin.id} missing required field: ${field}`);
        return false;
      }
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(plugin.version)) {
      console.warn(`Plugin ${plugin.id} has invalid version format: ${plugin.version}`);
      return false;
    }

    return true;
  }

  /**
   * Register plugin commands
   */
  async registerPluginCommands(pluginId, pluginDefinition) {
    if (!pluginDefinition.commands) return;

    for (const commandName of pluginDefinition.commands) {
      const commandDefinition = {
        name: commandName,
        description: `Plugin command: ${commandName}`,
        category: 'plugin',
        handler: async (args, context) => {
          const plugin = this.loadedPlugins.get(pluginId);
          if (!plugin) {
            throw new Error(`Plugin ${pluginId} not loaded`);
          }

          // Route to appropriate plugin method
          return await this.executePluginMethod(pluginId, commandName, args, context);
        },
        plugin: pluginId,
        version: pluginDefinition.version
      };

      await this.cli.registry.register(commandName, commandDefinition.handler, commandDefinition);
    }
  }

  /**
   * Load core plugins
   */
  async loadCorePlugins() {
    if (!this.config.autoLoad) return;

    console.log('🔄 Loading core plugins...');

    for (const pluginId of this.plugins.keys()) {
      try {
        await this.loadPlugin(pluginId);
      } catch (error) {
        console.warn(`Failed to load plugin ${pluginId}:`, error.message);
      }
    }

    console.log(`✅ Loaded ${this.loadedPlugins.size} core plugins`);
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Check dependencies
    if (!(await this.checkDependencies(pluginId))) {
      throw new Error(`Dependencies not satisfied for plugin ${pluginId}`);
    }

    // Load plugin instance
    try {
      const instance = await plugin.load();
      plugin.instance = instance;
      plugin.status = 'loaded';
      plugin.loadedAt = new Date().toISOString();

      this.loadedPlugins.set(pluginId, plugin);

      console.log(`🔌 Loaded plugin: ${pluginId} v${plugin.version}`);
      return plugin;
    } catch (error) {
      plugin.status = 'error';
      plugin.error = error.message;
      throw new Error(`Failed to load plugin ${pluginId}: ${error.message}`);
    }
  }

  /**
   * Check plugin dependencies
   */
  async checkDependencies(pluginId) {
    const deps = this.dependencies.get(pluginId);
    if (!deps || deps.length === 0) return true;

    for (const dep of deps) {
      const depPlugin = this.plugins.get(dep);
      if (!depPlugin) {
        console.warn(`Dependency ${dep} not found for plugin ${pluginId}`);
        return false;
      }

      if (depPlugin.status !== 'loaded') {
        // Try to load dependency
        try {
          await this.loadPlugin(dep);
        } catch (error) {
          console.warn(`Failed to load dependency ${dep} for ${pluginId}:`, error.message);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Execute plugin method
   */
  async executePluginMethod(pluginId, methodName, args, context) {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin || !plugin.instance) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    const method = plugin.instance[methodName];
    if (!method) {
      throw new Error(`Method ${methodName} not found in plugin ${pluginId}`);
    }

    // Check if method is actually a function
    if (typeof method !== 'function') {
      throw new Error(`Method ${methodName} in plugin ${pluginId} is not a function`);
    }

    // Add plugin context
    const pluginContext = {
      ...context,
      pluginId,
      pluginVersion: plugin.version
    };

    return await method.call(plugin.instance, args, pluginContext);
  }

  /**
   * Get calculator from loaded plugins
   */
  getCalculator(type) {
    for (const [pluginId, plugin] of this.loadedPlugins) {
      if (pluginId === 'calculators' && plugin.instance && plugin.instance[type]) {
        return plugin.instance[type];
      }
    }
    return null;
  }

  /**
   * Get loaded plugins
   */
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get plugin information
   */
  getPluginInfo(pluginId) {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId) {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) return false;

    // Unregister plugin commands
    await this.unregisterPluginCommands(pluginId);

    // Clear plugin instance
    plugin.instance = null;
    plugin.status = 'unloaded';
    plugin.unloadedAt = new Date().toISOString();

    this.loadedPlugins.delete(pluginId);

    console.log(`🔌 Unloaded plugin: ${pluginId}`);
    return true;
  }

  /**
   * Unregister plugin commands
   */
  async unregisterPluginCommands(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.commands) return;

    for (const commandName of plugin.commands) {
      await this.cli.registry.unregister(commandName);
    }
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(pluginId) {
    await this.unloadPlugin(pluginId);
    await this.loadPlugin(pluginId);
    console.log(`🔄 Reloaded plugin: ${pluginId}`);
  }

  /**
   * Install a new plugin
   */
  async installPlugin(pluginDefinition) {
    const pluginId = pluginDefinition.id || `custom_${Date.now()}`;

    // Validate plugin
    if (!this.validatePluginDefinition(pluginDefinition)) {
      throw new Error(`Invalid plugin definition for ${pluginId}`);
    }

    // Register and load
    await this.registerPlugin(pluginId, pluginDefinition);
    await this.loadPlugin(pluginId);

    // Save to registry
    await this.savePluginRegistry();

    return pluginId;
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId) {
    await this.unloadPlugin(pluginId);
    this.plugins.delete(pluginId);
    this.pluginRegistry.delete(pluginId);
    this.dependencies.delete(pluginId);

    await this.savePluginRegistry();

    console.log(`🗑️ Uninstalled plugin: ${pluginId}`);
  }

  /**
   * Load plugin registry from storage
   */
  async loadPluginRegistry() {
    try {
      const saved = localStorage.getItem('cli-plugin-registry');
      if (saved) {
        const registry = JSON.parse(saved);
        // Restore custom plugins
        for (const [pluginId, pluginDef] of Object.entries(registry)) {
          if (!this.corePlugins[pluginId]) {
            await this.registerPlugin(pluginId, pluginDef);
          }
        }
        console.log('📋 Restored plugin registry');
      }
    } catch (error) {
      console.warn('Failed to load plugin registry:', error.message);
    }
  }

  /**
   * Save plugin registry to storage
   */
  async savePluginRegistry() {
    try {
      const customPlugins = {};
      for (const [pluginId, plugin] of this.plugins) {
        if (!this.corePlugins[pluginId]) {
          customPlugins[pluginId] = this.pluginRegistry.get(pluginId);
        }
      }

      localStorage.setItem('cli-plugin-registry', JSON.stringify(customPlugins));
    } catch (error) {
      console.warn('Failed to save plugin registry:', error.message);
    }
  }

  /**
   * Get plugin statistics
   */
  getPluginStats() {
    const stats = {
      total: this.plugins.size,
      loaded: this.loadedPlugins.size,
      core: Object.keys(this.corePlugins).length,
      custom: this.plugins.size - Object.keys(this.corePlugins).length
    };

    // Calculate plugin health
    let healthy = 0;
    let withErrors = 0;

    for (const plugin of this.plugins.values()) {
      if (plugin.status === 'loaded') {
        healthy++;
      } else if (plugin.status === 'error') {
        withErrors++;
      }
    }

    stats.healthy = healthy;
    stats.withErrors = withErrors;

    return stats;
  }

  /**
   * Validate plugin compatibility
   */
  validatePluginCompatibility(pluginDefinition) {
    const issues = [];

    // Check version compatibility
    if (pluginDefinition.minCLIVersion) {
      const cliVersion = this.cli.version || '1.0.0';
      if (this.compareVersions(cliVersion, pluginDefinition.minCLIVersion) < 0) {
        issues.push(`Plugin requires CLI v${pluginDefinition.minCLIVersion} or higher`);
      }
    }

    // Check dependency compatibility
    if (pluginDefinition.dependencies) {
      for (const dep of pluginDefinition.dependencies) {
        const depPlugin = this.plugins.get(dep);
        if (!depPlugin) {
          issues.push(`Missing dependency: ${dep}`);
        } else if (
          pluginDefinition.dependencyVersions &&
          pluginDefinition.dependencyVersions[dep]
        ) {
          const requiredVersion = pluginDefinition.dependencyVersions[dep];
          if (this.compareVersions(depPlugin.version, requiredVersion) < 0) {
            issues.push(`Dependency ${dep} requires v${requiredVersion} or higher`);
          }
        }
      }
    }

    return {
      compatible: issues.length === 0,
      issues
    };
  }

  /**
   * Compare version strings
   */
  compareVersions(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const part1 = v1[i] || 0;
      const part2 = v2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  /**
   * Get plugin dependencies graph
   */
  getDependencyGraph() {
    const graph = {};

    for (const [pluginId, deps] of this.dependencies) {
      graph[pluginId] = deps;
    }

    return graph;
  }

  /**
   * Destroy plugin manager
   */
  async destroy() {
    // Unload all plugins
    for (const pluginId of this.loadedPlugins.keys()) {
      await this.unloadPlugin(pluginId);
    }

    // Clear all data
    this.plugins.clear();
    this.loadedPlugins.clear();
    this.pluginRegistry.clear();
    this.dependencies.clear();

    console.log('🧹 Plugin Manager destroyed');
  }
}
