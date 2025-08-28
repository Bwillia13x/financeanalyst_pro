/**
 * Institutional Features Service
 * Multi-entity support, White-labeling, and Compliance workflows
 */

import { EventEmitter } from 'events';

class InstitutionalFeaturesService extends EventEmitter {
  constructor(config = {}) {
    super();

    this.multiEntity = new MultiEntityManager(config.multiEntity);
    this.whiteLabel = new WhiteLabelingService(config.whiteLabel);
    this.compliance = new ComplianceWorkflowEngine(config.compliance);
    this.audit = new AuditTrailManager(config.audit);
    this.permissions = new PermissionManager(config.permissions);
  }

  // Multi-entity operations
  async createEntity(entityData, parentEntityId = null) {
    this.emit('entity:create:start', { entityData, parentEntityId });

    const entity = await this.multiEntity.createEntity(entityData, parentEntityId);
    await this.audit.logAction('entity_created', { entityId: entity.id, data: entityData });

    this.emit('entity:create:complete', { entity });
    return entity;
  }

  async getEntityHierarchy(entityId) {
    return await this.multiEntity.getHierarchy(entityId);
  }

  // White-labeling operations
  async setupBrandingConfiguration(entityId, brandingConfig) {
    this.emit('branding:setup:start', { entityId, brandingConfig });

    const config = await this.whiteLabel.configureBranding(entityId, brandingConfig);
    await this.audit.logAction('branding_configured', { entityId, config });

    this.emit('branding:setup:complete', { entityId, config });
    return config;
  }

  // Compliance operations
  async initiateComplianceWorkflow(workflowType, data, entityId) {
    this.emit('compliance:workflow:start', { workflowType, entityId });

    const workflow = await this.compliance.initiate(workflowType, data, entityId);
    await this.audit.logAction('compliance_workflow_initiated', {
      workflowId: workflow.id,
      type: workflowType,
      entityId
    });

    this.emit('compliance:workflow:initiated', { workflow });
    return workflow;
  }

  async getComplianceStatus(entityId) {
    return await this.compliance.getEntityStatus(entityId);
  }

  // Audit and permissions
  async getAuditTrail(entityId, filters = {}) {
    return await this.audit.getTrail(entityId, filters);
  }

  async setPermissions(userId, entityId, permissions) {
    await this.permissions.setUserPermissions(userId, entityId, permissions);
    await this.audit.logAction('permissions_updated', { userId, entityId, permissions });
  }
}

/**
 * Multi-Entity Manager
 */
class MultiEntityManager {
  constructor(config = {}) {
    this.entities = new Map();
    this.hierarchies = new Map();
    this.config = config;
  }

  async createEntity(entityData, parentEntityId = null) {
    const entity = {
      id: this.generateEntityId(),
      ...entityData,
      parentId: parentEntityId,
      children: [],
      createdAt: new Date().toISOString(),
      status: 'active',
      settings: {
        timezone: entityData.timezone || 'UTC',
        currency: entityData.currency || 'USD',
        locale: entityData.locale || 'en-US',
        fiscalYearEnd: entityData.fiscalYearEnd || '12-31',
        reportingStandards: entityData.reportingStandards || ['GAAP'],
        ...entityData.settings
      }
    };

    this.entities.set(entity.id, entity);

    if (parentEntityId) {
      const parent = this.entities.get(parentEntityId);
      if (parent) {
        parent.children.push(entity.id);
        this.entities.set(parentEntityId, parent);
      }
    }

    await this.updateHierarchy(entity.id);
    return entity;
  }

  async getEntity(entityId) {
    return this.entities.get(entityId);
  }

  async updateEntity(entityId, updates) {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    const updatedEntity = {
      ...entity,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.entities.set(entityId, updatedEntity);
    return updatedEntity;
  }

  async getHierarchy(entityId) {
    const buildHierarchy = (id, visited = new Set()) => {
      if (visited.has(id)) {
        throw new Error(`Circular reference detected in entity hierarchy: ${id}`);
      }

      visited.add(id);
      const entity = this.entities.get(id);

      if (!entity) return null;

      return {
        ...entity,
        children: entity.children
          .map(childId => buildHierarchy(childId, new Set(visited)))
          .filter(child => child !== null)
      };
    };

    return buildHierarchy(entityId);
  }

  async getDescendants(entityId) {
    const descendants = [];
    const entity = this.entities.get(entityId);

    if (!entity) return descendants;

    const traverse = id => {
      const current = this.entities.get(id);
      if (current) {
        descendants.push(current);
        current.children.forEach(childId => traverse(childId));
      }
    };

    entity.children.forEach(childId => traverse(childId));
    return descendants;
  }

  async getAncestors(entityId) {
    const ancestors = [];
    let currentId = entityId;

    while (currentId) {
      const entity = this.entities.get(currentId);
      if (!entity) break;

      if (entity.parentId) {
        const parent = this.entities.get(entity.parentId);
        if (parent) {
          ancestors.unshift(parent);
          currentId = entity.parentId;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return ancestors;
  }

  async consolidateData(entityId, dataType, options = {}) {
    const { includeDescendants = true, consolidationMethod = 'sum' } = options;

    const entities = includeDescendants
      ? [await this.getEntity(entityId), ...(await this.getDescendants(entityId))]
      : [await this.getEntity(entityId)];

    const consolidatedData = {};

    for (const entity of entities) {
      if (!entity || !entity.data?.[dataType]) continue;

      const entityData = entity.data[dataType];

      Object.keys(entityData).forEach(key => {
        if (typeof entityData[key] === 'number') {
          if (consolidationMethod === 'sum') {
            consolidatedData[key] = (consolidatedData[key] || 0) + entityData[key];
          } else if (consolidationMethod === 'average') {
            consolidatedData[key] = consolidatedData[key] || [];
            consolidatedData[key].push(entityData[key]);
          }
        }
      });
    }

    if (consolidationMethod === 'average') {
      Object.keys(consolidatedData).forEach(key => {
        if (Array.isArray(consolidatedData[key])) {
          const values = consolidatedData[key];
          consolidatedData[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      });
    }

    return {
      entityId,
      dataType,
      consolidationMethod,
      entities: entities.map(e => e.id),
      data: consolidatedData,
      timestamp: new Date().toISOString()
    };
  }

  generateEntityId() {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async updateHierarchy(entityId) {
    const hierarchy = await this.getHierarchy(entityId);
    this.hierarchies.set(entityId, hierarchy);
  }
}

/**
 * White-Labeling Service
 */
class WhiteLabelingService {
  constructor(config = {}) {
    this.brandingConfigs = new Map();
    this.templates = new Map();
    this.config = config;
    this.initializeDefaultTemplates();
  }

  initializeDefaultTemplates() {
    const defaultTemplates = {
      corporate: {
        name: 'Corporate',
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#0f172a',
          background: '#ffffff',
          text: '#1e293b'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          headingWeight: '600',
          bodyWeight: '400'
        },
        layout: {
          borderRadius: '8px',
          spacing: 'comfortable',
          headerStyle: 'clean'
        }
      },
      investment: {
        name: 'Investment Firm',
        colors: {
          primary: '#059669',
          secondary: '#6b7280',
          accent: '#065f46',
          background: '#f9fafb',
          text: '#111827'
        },
        typography: {
          fontFamily: 'Roboto, system-ui, sans-serif',
          headingWeight: '700',
          bodyWeight: '400'
        },
        layout: {
          borderRadius: '4px',
          spacing: 'compact',
          headerStyle: 'professional'
        }
      },
      consulting: {
        name: 'Consulting',
        colors: {
          primary: '#7c3aed',
          secondary: '#9ca3af',
          accent: '#581c87',
          background: '#fefefe',
          text: '#374151'
        },
        typography: {
          fontFamily: 'Source Sans Pro, system-ui, sans-serif',
          headingWeight: '600',
          bodyWeight: '400'
        },
        layout: {
          borderRadius: '12px',
          spacing: 'relaxed',
          headerStyle: 'elegant'
        }
      }
    };

    Object.entries(defaultTemplates).forEach(([key, template]) => {
      this.templates.set(key, template);
    });
  }

  async configureBranding(entityId, brandingConfig) {
    const config = {
      entityId,
      ...brandingConfig,
      createdAt: new Date().toISOString(),
      version: this.generateVersion()
    };

    // Validate branding configuration
    this.validateBrandingConfig(config);

    // Apply template if specified
    if (config.template) {
      const template = this.templates.get(config.template);
      if (template) {
        config.colors = { ...template.colors, ...config.colors };
        config.typography = { ...template.typography, ...config.typography };
        config.layout = { ...template.layout, ...config.layout };
      }
    }

    // Generate CSS variables and theme
    config.cssVariables = this.generateCSSVariables(config);
    config.themeConfig = this.generateThemeConfig(config);

    this.brandingConfigs.set(entityId, config);
    return config;
  }

  async getBrandingConfig(entityId) {
    return this.brandingConfigs.get(entityId);
  }

  async updateBrandingConfig(entityId, updates) {
    const existing = this.brandingConfigs.get(entityId);
    if (!existing) {
      throw new Error(`No branding configuration found for entity ${entityId}`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: this.generateVersion()
    };

    this.validateBrandingConfig(updated);
    updated.cssVariables = this.generateCSSVariables(updated);
    updated.themeConfig = this.generateThemeConfig(updated);

    this.brandingConfigs.set(entityId, updated);
    return updated;
  }

  validateBrandingConfig(config) {
    const required = ['colors'];
    const missing = required.filter(field => !config[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required branding fields: ${missing.join(', ')}`);
    }

    // Validate colors
    if (config.colors) {
      const requiredColors = ['primary', 'background', 'text'];
      const missingColors = requiredColors.filter(color => !config.colors[color]);

      if (missingColors.length > 0) {
        throw new Error(`Missing required colors: ${missingColors.join(', ')}`);
      }
    }
  }

  generateCSSVariables(config) {
    const variables = {};

    // Colors
    if (config.colors) {
      Object.entries(config.colors).forEach(([key, value]) => {
        variables[`--color-${key}`] = value;
      });
    }

    // Typography
    if (config.typography) {
      Object.entries(config.typography).forEach(([key, value]) => {
        variables[`--typography-${key}`] = value;
      });
    }

    // Layout
    if (config.layout) {
      Object.entries(config.layout).forEach(([key, value]) => {
        variables[`--layout-${key}`] = value;
      });
    }

    return variables;
  }

  generateThemeConfig(config) {
    return {
      brand: {
        name: config.brandName || 'FinanceAnalyst Pro',
        logo: config.logoUrl || null,
        favicon: config.faviconUrl || null
      },
      colors: config.colors,
      typography: config.typography,
      layout: config.layout,
      customCSS: config.customCSS || '',
      features: config.features || {
        showBranding: true,
        customHeader: false,
        customFooter: false
      }
    };
  }

  async generateBrandedExport(entityId, reportData, format = 'pdf') {
    const brandingConfig = await this.getBrandingConfig(entityId);

    return {
      data: reportData,
      branding: brandingConfig,
      format,
      template: this.getBrandedTemplate(brandingConfig, format),
      generatedAt: new Date().toISOString()
    };
  }

  getBrandedTemplate(brandingConfig, _format) {
    const baseTemplate = {
      header: {
        logo: brandingConfig.logoUrl,
        brandName: brandingConfig.brandName,
        colors: brandingConfig.colors
      },
      footer: {
        text: brandingConfig.footerText || `Generated by ${brandingConfig.brandName}`,
        colors: brandingConfig.colors
      },
      styles: brandingConfig.themeConfig
    };

    return baseTemplate;
  }

  generateVersion() {
    return Date.now().toString();
  }
}

/**
 * Compliance Workflow Engine
 */
class ComplianceWorkflowEngine {
  constructor(config = {}) {
    this.workflows = new Map();
    this.rules = new Map();
    this.config = config;
    this.initializeComplianceRules();
  }

  initializeComplianceRules() {
    const rules = {
      sox_compliance: {
        name: 'Sarbanes-Oxley Compliance',
        description: 'SOX compliance checks for financial reporting',
        steps: [
          { id: 'financial_data_review', name: 'Financial Data Review', required: true },
          {
            id: 'internal_controls_assessment',
            name: 'Internal Controls Assessment',
            required: true
          },
          { id: 'management_certification', name: 'Management Certification', required: true },
          { id: 'external_audit_review', name: 'External Audit Review', required: false }
        ],
        requirements: {
          approvalLevels: ['analyst', 'manager', 'director'],
          documentation: ['supporting_docs', 'control_matrix', 'test_results'],
          retention: '7_years'
        }
      },
      ifrs_reporting: {
        name: 'IFRS Reporting Standards',
        description: 'International Financial Reporting Standards compliance',
        steps: [
          { id: 'ifrs_mapping', name: 'IFRS Standards Mapping', required: true },
          { id: 'fair_value_assessment', name: 'Fair Value Assessment', required: true },
          { id: 'disclosure_review', name: 'Disclosure Review', required: true },
          { id: 'reconciliation', name: 'GAAP to IFRS Reconciliation', required: false }
        ],
        requirements: {
          approvalLevels: ['analyst', 'senior_analyst', 'manager'],
          documentation: ['calculation_workpapers', 'assumptions_doc', 'disclosure_checklist'],
          retention: '5_years'
        }
      },
      mifid_compliance: {
        name: 'MiFID II Compliance',
        description: 'Markets in Financial Instruments Directive compliance',
        steps: [
          { id: 'best_execution_analysis', name: 'Best Execution Analysis', required: true },
          { id: 'transaction_reporting', name: 'Transaction Reporting', required: true },
          { id: 'investor_protection', name: 'Investor Protection Review', required: true }
        ],
        requirements: {
          approvalLevels: ['compliance_officer', 'head_of_compliance'],
          documentation: ['execution_reports', 'policy_docs', 'training_records'],
          retention: '5_years'
        }
      }
    };

    Object.entries(rules).forEach(([key, rule]) => {
      this.rules.set(key, rule);
    });
  }

  async initiate(workflowType, data, entityId) {
    const rule = this.rules.get(workflowType);
    if (!rule) {
      throw new Error(`Unknown compliance workflow type: ${workflowType}`);
    }

    const workflow = {
      id: this.generateWorkflowId(),
      type: workflowType,
      entityId,
      rule,
      data,
      status: 'initiated',
      currentStep: 0,
      steps: rule.steps.map(step => ({
        ...step,
        status: 'pending',
        assignee: null,
        completedAt: null,
        comments: []
      })),
      createdAt: new Date().toISOString(),
      dueDate: this.calculateDueDate(rule),
      metadata: {
        initiatedBy: data.initiatedBy,
        priority: data.priority || 'normal',
        tags: data.tags || []
      }
    };

    this.workflows.set(workflow.id, workflow);
    await this.advanceWorkflow(workflow.id);

    return workflow;
  }

  async advanceWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const currentStep = workflow.steps[workflow.currentStep];
    if (!currentStep) {
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      this.workflows.set(workflowId, workflow);
      return workflow;
    }

    if (currentStep.status === 'pending') {
      currentStep.status = 'in_progress';
      currentStep.startedAt = new Date().toISOString();

      // Auto-assign if configured
      if (this.config.autoAssign) {
        currentStep.assignee = await this.getNextAssignee(workflow, currentStep);
      }
    }

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  async completeStep(workflowId, stepId, completionData) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in workflow`);
    }

    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    step.completionData = completionData;

    // Move to next step
    if (workflow.currentStep < workflow.steps.length - 1) {
      workflow.currentStep += 1;
      await this.advanceWorkflow(workflowId);
    } else {
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
    }

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  async getEntityStatus(entityId) {
    const entityWorkflows = Array.from(this.workflows.values()).filter(
      w => w.entityId === entityId
    );

    const statusSummary = {
      entityId,
      totalWorkflows: entityWorkflows.length,
      activeWorkflows: entityWorkflows.filter(w => w.status !== 'completed').length,
      completedWorkflows: entityWorkflows.filter(w => w.status === 'completed').length,
      overdue: entityWorkflows.filter(
        w => w.status !== 'completed' && new Date(w.dueDate) < new Date()
      ).length,
      byType: {},
      recentActivity: entityWorkflows
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    };

    // Group by workflow type
    entityWorkflows.forEach(workflow => {
      if (!statusSummary.byType[workflow.type]) {
        statusSummary.byType[workflow.type] = {
          total: 0,
          active: 0,
          completed: 0
        };
      }

      statusSummary.byType[workflow.type].total += 1;
      if (workflow.status === 'completed') {
        statusSummary.byType[workflow.type].completed += 1;
      } else {
        statusSummary.byType[workflow.type].active += 1;
      }
    });

    return statusSummary;
  }

  calculateDueDate(rule) {
    const daysToAdd = rule.defaultDuration || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate.toISOString();
  }

  generateWorkflowId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getNextAssignee(workflow, _step) {
    // Simple round-robin assignment logic
    const approvalLevels = workflow.rule.requirements.approvalLevels;
    const currentLevel = approvalLevels[workflow.currentStep % approvalLevels.length];

    return {
      role: currentLevel,
      assignedAt: new Date().toISOString()
    };
  }
}

/**
 * Audit Trail Manager
 */
class AuditTrailManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.auditLogs = new Map();
    this.config = config;
  }

  async logAction(action, data) {
    const logEntry = {
      id: this.generateLogId(),
      action,
      data,
      timestamp: new Date().toISOString(),
      userId: data.userId || 'system',
      entityId: data.entityId,
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      sessionId: data.sessionId || null
    };

    if (!this.auditLogs.has(data.entityId)) {
      this.auditLogs.set(data.entityId, []);
    }

    this.auditLogs.get(data.entityId).push(logEntry);

    // Emit audit event
    this.emit('audit:log', logEntry);

    return logEntry;
  }

  async getTrail(entityId, filters = {}) {
    const logs = this.auditLogs.get(entityId) || [];

    let filteredLogs = [...logs];

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    if (filters.actions) {
      filteredLogs = filteredLogs.filter(log => filters.actions.includes(log.action));
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    return {
      entityId,
      filters,
      totalCount: filteredLogs.length,
      logs: filteredLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 100))
    };
  }

  generateLogId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Permission Manager
 */
class PermissionManager {
  constructor(config = {}) {
    this.permissions = new Map();
    this.roles = new Map();
    this.config = config;
    this.initializeDefaultRoles();
  }

  initializeDefaultRoles() {
    const defaultRoles = {
      viewer: {
        name: 'Viewer',
        permissions: ['read_data', 'view_reports', 'export_basic']
      },
      analyst: {
        name: 'Analyst',
        permissions: [
          'read_data',
          'write_data',
          'view_reports',
          'create_reports',
          'export_basic',
          'export_advanced'
        ]
      },
      manager: {
        name: 'Manager',
        permissions: [
          'read_data',
          'write_data',
          'delete_data',
          'view_reports',
          'create_reports',
          'manage_users',
          'export_all',
          'approve_workflows'
        ]
      },
      admin: {
        name: 'Administrator',
        permissions: ['all']
      }
    };

    Object.entries(defaultRoles).forEach(([key, role]) => {
      this.roles.set(key, role);
    });
  }

  async setUserPermissions(userId, entityId, permissions) {
    const key = `${userId}:${entityId}`;

    const userPermissions = {
      userId,
      entityId,
      permissions,
      updatedAt: new Date().toISOString()
    };

    this.permissions.set(key, userPermissions);
    return userPermissions;
  }

  async getUserPermissions(userId, entityId) {
    const key = `${userId}:${entityId}`;
    return this.permissions.get(key);
  }

  async checkPermission(userId, entityId, permission) {
    const userPerms = await this.getUserPermissions(userId, entityId);

    if (!userPerms) return false;

    return userPerms.permissions.includes(permission) || userPerms.permissions.includes('all');
  }

  async assignRole(userId, entityId, roleId) {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    return await this.setUserPermissions(userId, entityId, role.permissions);
  }

  async createCustomRole(roleId, roleName, permissions) {
    const role = {
      name: roleName,
      permissions,
      custom: true,
      createdAt: new Date().toISOString()
    };

    this.roles.set(roleId, role);
    return role;
  }
}

export default InstitutionalFeaturesService;
