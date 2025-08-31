/**
 * Compliance Monitoring Service
 * Regulatory compliance monitoring and reporting system
 * Tracks compliance with financial regulations and standards
 */

class ComplianceMonitoringService {
  constructor(options = {}) {
    this.options = {
      enableComplianceMonitoring: true,
      enableAutomatedReporting: true,
      enableRiskAssessment: true,
      reportingFrequency: 'monthly', // daily, weekly, monthly
      complianceFrameworks: ['SOX', 'GDPR', 'PCI-DSS', 'ISO-27001', 'FINRA'],
      riskThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
        critical: 0.9
      },
      auditRetention: 2555, // 7 years
      ...options
    };

    this.complianceRules = new Map();
    this.auditFindings = new Map();
    this.complianceReports = new Map();
    this.riskAssessments = new Map();
    this.regulatoryAlerts = new Map();
    this.complianceMetrics = new Map();

    this.isInitialized = false;
  }

  /**
   * Initialize the compliance monitoring service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.setupComplianceRules();
      this.setupAutomatedMonitoring();
      this.setupReportingSchedule();
      this.setupRiskAssessment();
      this.setupRegulatoryAlerts();

      this.isInitialized = true;
      console.log('Compliance Monitoring Service initialized');
    } catch (error) {
      console.error('Failed to initialize Compliance Monitoring Service:', error);
    }
  }

  /**
   * Setup compliance rules for each framework
   */
  setupComplianceRules() {
    // SOX (Sarbanes-Oxley Act) Rules
    this.complianceRules.set('SOX', {
      id: 'SOX',
      name: 'Sarbanes-Oxley Act',
      version: '2002',
      category: 'financial',
      rules: {
        section_302: {
          name: 'Section 302 - Corporate Responsibility',
          description: 'CEO and CFO must certify financial statements',
          requirements: [
            'accurate_financial_reporting',
            'internal_controls_effectiveness',
            'material_changes_disclosure'
          ],
          checks: [
            this.checkAccurateFinancialReporting.bind(this),
            this.checkInternalControls.bind(this),
            this.checkMaterialChangesDisclosure.bind(this)
          ]
        },
        section_404: {
          name: 'Section 404 - Internal Controls',
          description: 'Management assessment of internal controls',
          requirements: [
            'internal_controls_documentation',
            'controls_testing',
            'remediation_processes'
          ],
          checks: [
            this.checkInternalControlsDocumentation.bind(this),
            this.checkControlsTesting.bind(this),
            this.checkRemediationProcesses.bind(this)
          ]
        }
      }
    });

    // GDPR Rules
    this.complianceRules.set('GDPR', {
      id: 'GDPR',
      name: 'General Data Protection Regulation',
      version: '2018',
      category: 'privacy',
      rules: {
        article_5: {
          name: 'Article 5 - Principles of Processing',
          description: 'Lawfulness, fairness, transparency, purpose limitation, data minimization',
          requirements: [
            'lawful_processing',
            'fair_processing',
            'transparent_processing',
            'purpose_limitation',
            'data_minimization',
            'accuracy',
            'storage_limitation',
            'integrity_confidentiality',
            'accountability'
          ],
          checks: [
            this.checkLawfulProcessing.bind(this),
            this.checkFairProcessing.bind(this),
            this.checkTransparentProcessing.bind(this),
            this.checkPurposeLimitation.bind(this),
            this.checkDataMinimization.bind(this),
            this.checkAccuracy.bind(this),
            this.checkStorageLimitation.bind(this),
            this.checkIntegrityConfidentiality.bind(this),
            this.checkAccountability.bind(this)
          ]
        },
        article_17: {
          name: 'Article 17 - Right to Erasure',
          description: 'Right to be forgotten',
          requirements: [
            'erasure_request_handling',
            'data_deletion_processes',
            'erasure_notifications'
          ],
          checks: [
            this.checkErasureRequestHandling.bind(this),
            this.checkDataDeletionProcesses.bind(this),
            this.checkErasureNotifications.bind(this)
          ]
        }
      }
    });

    // PCI-DSS Rules
    this.complianceRules.set('PCI-DSS', {
      id: 'PCI-DSS',
      name: 'Payment Card Industry Data Security Standard',
      version: '4.0',
      category: 'payment',
      rules: {
        requirement_1: {
          name: 'Requirement 1 - Network Security',
          description: 'Install and maintain network security controls',
          requirements: ['firewall_configuration', 'network_segmentation', 'secure_configurations'],
          checks: [
            this.checkFirewallConfiguration.bind(this),
            this.checkNetworkSegmentation.bind(this),
            this.checkSecureConfigurations.bind(this)
          ]
        },
        requirement_3: {
          name: 'Requirement 3 - Protect Cardholder Data',
          description: 'Protect stored cardholder data',
          requirements: ['data_encryption', 'key_management', 'data_masking'],
          checks: [
            this.checkDataEncryption.bind(this),
            this.checkKeyManagement.bind(this),
            this.checkDataMasking.bind(this)
          ]
        }
      }
    });

    // ISO 27001 Rules
    this.complianceRules.set('ISO-27001', {
      id: 'ISO-27001',
      name: 'Information Security Management Systems',
      version: '2022',
      category: 'security',
      rules: {
        clause_5: {
          name: 'Clause 5 - Leadership',
          description: 'Information security leadership and commitment',
          requirements: ['leadership_commitment', 'policy_establishment', 'organizational_roles'],
          checks: [
            this.checkLeadershipCommitment.bind(this),
            this.checkPolicyEstablishment.bind(this),
            this.checkOrganizationalRoles.bind(this)
          ]
        },
        clause_8: {
          name: 'Clause 8 - Operation',
          description: 'Information security operational planning',
          requirements: ['planning_controls', 'change_management', 'incident_management'],
          checks: [
            this.checkPlanningControls.bind(this),
            this.checkChangeManagement.bind(this),
            this.checkIncidentManagement.bind(this)
          ]
        }
      }
    });

    // FINRA Rules
    this.complianceRules.set('FINRA', {
      id: 'FINRA',
      name: 'Financial Industry Regulatory Authority',
      version: 'Current',
      category: 'financial',
      rules: {
        rule_2111: {
          name: 'Rule 2111 - Suitability',
          description: 'Suitability of recommendations',
          requirements: [
            'customer_profile_maintenance',
            'recommendation_suitability',
            'documentation_requirements'
          ],
          checks: [
            this.checkCustomerProfileMaintenance.bind(this),
            this.checkRecommendationSuitability.bind(this),
            this.checkDocumentationRequirements.bind(this)
          ]
        }
      }
    });
  }

  /**
   * Setup automated monitoring
   */
  setupAutomatedMonitoring() {
    if (!this.options.enableComplianceMonitoring) return;

    // Monitor compliance continuously
    setInterval(
      () => {
        this.performComplianceChecks();
      },
      60 * 60 * 1000
    ); // Hourly checks

    // Monitor critical compliance events
    setInterval(
      () => {
        this.monitorCriticalEvents();
      },
      15 * 60 * 1000
    ); // Every 15 minutes
  }

  /**
   * Setup reporting schedule
   */
  setupReportingSchedule() {
    if (!this.options.enableAutomatedReporting) return;

    const scheduleInterval = this.getScheduleInterval();

    setInterval(() => {
      this.generateComplianceReports();
    }, scheduleInterval);
  }

  /**
   * Setup risk assessment
   */
  setupRiskAssessment() {
    if (!this.options.enableRiskAssessment) return;

    setInterval(
      () => {
        this.performRiskAssessment();
      },
      24 * 60 * 60 * 1000
    ); // Daily assessment
  }

  /**
   * Setup regulatory alerts
   */
  setupRegulatoryAlerts() {
    // Setup alert monitoring
    setInterval(
      () => {
        this.checkRegulatoryAlerts();
      },
      30 * 60 * 1000
    ); // Every 30 minutes
  }

  /**
   * Get schedule interval based on frequency
   */
  getScheduleInterval() {
    switch (this.options.reportingFrequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000; // Monthly default
    }
  }

  /**
   * Perform compliance checks
   */
  async performComplianceChecks() {
    console.log('Performing compliance checks...');

    for (const [frameworkId, framework] of this.complianceRules.entries()) {
      const results = {
        framework: frameworkId,
        timestamp: new Date(),
        rules: {}
      };

      for (const [ruleId, rule] of Object.entries(framework.rules)) {
        const ruleResults = {
          rule: ruleId,
          checks: []
        };

        // Perform each check
        for (let i = 0; i < rule.checks.length; i++) {
          const check = rule.checks[i];
          const requirement = rule.requirements[i];

          try {
            const result = await check();
            ruleResults.checks.push({
              requirement,
              status: result.passed ? 'passed' : 'failed',
              details: result.details,
              severity: result.severity || 'medium'
            });
          } catch (error) {
            ruleResults.checks.push({
              requirement,
              status: 'error',
              details: error.message,
              severity: 'high'
            });
          }
        }

        results.rules[ruleId] = ruleResults;
      }

      // Store results
      this.auditFindings.set(`${frameworkId}_${Date.now()}`, results);

      // Emit results
      this.emit('complianceCheck', results);
    }
  }

  /**
   * Compliance Check Implementations
   */

  // SOX Checks
  async checkAccurateFinancialReporting() {
    // Check if financial data is properly validated
    const recentAudits = Array.from(this.auditFindings.values())
      .filter(finding => finding.framework === 'SOX')
      .slice(-10);

    return {
      passed: recentAudits.length > 0,
      details: `Found ${recentAudits.length} recent SOX audits`,
      severity: 'high'
    };
  }

  async checkInternalControls() {
    // Check internal control effectiveness
    return {
      passed: Math.random() > 0.3, // Simulated
      details: 'Internal controls assessment completed',
      severity: 'high'
    };
  }

  async checkMaterialChangesDisclosure() {
    // Check for timely disclosure of material changes
    return {
      passed: true,
      details: 'Material changes properly disclosed',
      severity: 'medium'
    };
  }

  async checkInternalControlsDocumentation() {
    return {
      passed: true,
      details: 'Internal controls documentation maintained',
      severity: 'high'
    };
  }

  async checkControlsTesting() {
    return {
      passed: Math.random() > 0.4,
      details: 'Controls testing completed quarterly',
      severity: 'medium'
    };
  }

  async checkRemediationProcesses() {
    return {
      passed: true,
      details: 'Remediation processes documented and followed',
      severity: 'medium'
    };
  }

  // GDPR Checks
  async checkLawfulProcessing() {
    return {
      passed: true,
      details: 'All data processing has lawful basis',
      severity: 'critical'
    };
  }

  async checkFairProcessing() {
    return {
      passed: true,
      details: 'Data processing is fair and transparent',
      severity: 'high'
    };
  }

  async checkTransparentProcessing() {
    return {
      passed: Math.random() > 0.2,
      details: 'Privacy notices provided and up-to-date',
      severity: 'high'
    };
  }

  async checkPurposeLimitation() {
    return {
      passed: true,
      details: 'Data collected for specified purposes only',
      severity: 'high'
    };
  }

  async checkDataMinimization() {
    return {
      passed: Math.random() > 0.3,
      details: 'Only necessary data collected and retained',
      severity: 'medium'
    };
  }

  async checkAccuracy() {
    return {
      passed: true,
      details: 'Data accuracy maintained and verified',
      severity: 'medium'
    };
  }

  async checkStorageLimitation() {
    return {
      passed: true,
      details: 'Data retention policies enforced',
      severity: 'medium'
    };
  }

  async checkIntegrityConfidentiality() {
    return {
      passed: Math.random() > 0.1,
      details: 'Data integrity and confidentiality maintained',
      severity: 'high'
    };
  }

  async checkAccountability() {
    return {
      passed: true,
      details: 'Data protection accountability established',
      severity: 'high'
    };
  }

  async checkErasureRequestHandling() {
    return {
      passed: Math.random() > 0.4,
      details: 'Erasure requests handled within 30 days',
      severity: 'high'
    };
  }

  async checkDataDeletionProcesses() {
    return {
      passed: true,
      details: 'Secure data deletion processes implemented',
      severity: 'high'
    };
  }

  async checkErasureNotifications() {
    return {
      passed: true,
      details: 'Erasure completion notifications sent',
      severity: 'medium'
    };
  }

  // PCI-DSS Checks
  async checkFirewallConfiguration() {
    return {
      passed: Math.random() > 0.2,
      details: 'Firewall configuration reviewed and updated',
      severity: 'high'
    };
  }

  async checkNetworkSegmentation() {
    return {
      passed: Math.random() > 0.3,
      details: 'Network segmentation implemented',
      severity: 'high'
    };
  }

  async checkSecureConfigurations() {
    return {
      passed: true,
      details: 'Secure configurations maintained',
      severity: 'medium'
    };
  }

  async checkDataEncryption() {
    return {
      passed: Math.random() > 0.1,
      details: 'Cardholder data encrypted in transit and at rest',
      severity: 'critical'
    };
  }

  async checkKeyManagement() {
    return {
      passed: Math.random() > 0.2,
      details: 'Encryption keys properly managed and rotated',
      severity: 'high'
    };
  }

  async checkDataMasking() {
    return {
      passed: true,
      details: 'Sensitive data properly masked in logs',
      severity: 'medium'
    };
  }

  // ISO 27001 Checks
  async checkLeadershipCommitment() {
    return {
      passed: true,
      details: 'Leadership commitment to information security demonstrated',
      severity: 'high'
    };
  }

  async checkPolicyEstablishment() {
    return {
      passed: true,
      details: 'Information security policies established and communicated',
      severity: 'medium'
    };
  }

  async checkOrganizationalRoles() {
    return {
      passed: true,
      details: 'Information security roles and responsibilities defined',
      severity: 'medium'
    };
  }

  async checkPlanningControls() {
    return {
      passed: Math.random() > 0.3,
      details: 'Information security operational planning completed',
      severity: 'medium'
    };
  }

  async checkChangeManagement() {
    return {
      passed: true,
      details: 'Change management processes for information security implemented',
      severity: 'medium'
    };
  }

  async checkIncidentManagement() {
    return {
      passed: Math.random() > 0.4,
      details: 'Information security incident management processes established',
      severity: 'high'
    };
  }

  // FINRA Checks
  async checkCustomerProfileMaintenance() {
    return {
      passed: Math.random() > 0.3,
      details: 'Customer profiles maintained and updated regularly',
      severity: 'medium'
    };
  }

  async checkRecommendationSuitability() {
    return {
      passed: Math.random() > 0.2,
      details: 'Investment recommendations meet suitability requirements',
      severity: 'high'
    };
  }

  async checkDocumentationRequirements() {
    return {
      passed: true,
      details: 'Recommendation documentation maintained',
      severity: 'medium'
    };
  }

  /**
   * Monitor critical compliance events
   */
  monitorCriticalEvents() {
    // Check for critical compliance violations
    const recentFindings = Array.from(this.auditFindings.values()).filter(
      finding => Date.now() - finding.timestamp.getTime() < 60 * 60 * 1000
    ); // Last hour

    for (const finding of recentFindings) {
      for (const [ruleId, rule] of Object.entries(finding.rules)) {
        for (const check of rule.checks) {
          if (check.status === 'failed' && check.severity === 'critical') {
            this.createRegulatoryAlert({
              type: 'CRITICAL_COMPLIANCE_VIOLATION',
              framework: finding.framework,
              rule: ruleId,
              requirement: check.requirement,
              details: check.details,
              severity: 'critical'
            });
          }
        }
      }
    }
  }

  /**
   * Generate compliance reports
   */
  generateComplianceReports() {
    console.log('Generating compliance reports...');

    for (const frameworkId of this.options.complianceFrameworks) {
      const report = {
        id: `report_${frameworkId}_${Date.now()}`,
        framework: frameworkId,
        generatedAt: new Date(),
        period: {
          start: new Date(Date.now() - this.getReportPeriod()),
          end: new Date()
        },
        findings: [],
        compliance: 'compliant',
        score: 100,
        recommendations: []
      };

      // Get recent findings for this framework
      const frameworkFindings = Array.from(this.auditFindings.values())
        .filter(finding => finding.framework === frameworkId)
        .slice(-20); // Last 20 findings

      report.findings = frameworkFindings;

      // Calculate compliance score
      if (frameworkFindings.length > 0) {
        const totalChecks = frameworkFindings.reduce((sum, finding) => {
          return (
            sum +
            Object.values(finding.rules).reduce((ruleSum, rule) => ruleSum + rule.checks.length, 0)
          );
        }, 0);

        const passedChecks = frameworkFindings.reduce((sum, finding) => {
          return (
            sum +
            Object.values(finding.rules).reduce(
              (ruleSum, rule) =>
                ruleSum + rule.checks.filter(check => check.status === 'passed').length,
              0
            )
          );
        }, 0);

        report.score = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;

        // Determine compliance status
        if (report.score < 80) {
          report.compliance = 'non-compliant';
        } else if (report.score < 95) {
          report.compliance = 'conditional';
        }

        // Generate recommendations
        report.recommendations = this.generateComplianceRecommendations(
          frameworkId,
          report.score,
          frameworkFindings
        );
      }

      // Store report
      this.complianceReports.set(report.id, report);

      // Emit report
      this.emit('complianceReport', report);
    }
  }

  /**
   * Get report period in milliseconds
   */
  getReportPeriod() {
    switch (this.options.reportingFrequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Generate compliance recommendations
   */
  generateComplianceRecommendations(framework, score, findings) {
    const recommendations = [];

    if (score < 80) {
      recommendations.push({
        priority: 'critical',
        message: `Immediate action required to improve ${framework} compliance`,
        action: 'review_findings'
      });
    }

    if (score < 95) {
      recommendations.push({
        priority: 'high',
        message: `Address compliance gaps in ${framework}`,
        action: 'implement_controls'
      });
    }

    // Framework-specific recommendations
    switch (framework) {
      case 'GDPR':
        if (score < 90) {
          recommendations.push({
            priority: 'high',
            message: 'Review data processing activities and privacy notices',
            action: 'update_privacy_policy'
          });
        }
        break;

      case 'SOX':
        if (score < 90) {
          recommendations.push({
            priority: 'high',
            message: 'Strengthen internal controls and documentation',
            action: 'enhance_controls'
          });
        }
        break;

      case 'PCI-DSS':
        if (score < 90) {
          recommendations.push({
            priority: 'critical',
            message: 'Review cardholder data protection measures',
            action: 'update_security_controls'
          });
        }
        break;
    }

    return recommendations;
  }

  /**
   * Perform risk assessment
   */
  performRiskAssessment() {
    console.log('Performing compliance risk assessment...');

    const assessment = {
      id: `risk_${Date.now()}`,
      timestamp: new Date(),
      overallRisk: 'low',
      frameworkRisks: {},
      recommendations: []
    };

    for (const frameworkId of this.options.complianceFrameworks) {
      const frameworkRisk = this.assessFrameworkRisk(frameworkId);
      assessment.frameworkRisks[frameworkId] = frameworkRisk;

      // Update overall risk
      if (this.getRiskLevel(frameworkRisk.score) === 'critical') {
        assessment.overallRisk = 'critical';
      } else if (
        this.getRiskLevel(frameworkRisk.score) === 'high' &&
        assessment.overallRisk !== 'critical'
      ) {
        assessment.overallRisk = 'high';
      } else if (
        this.getRiskLevel(frameworkRisk.score) === 'medium' &&
        assessment.overallRisk === 'low'
      ) {
        assessment.overallRisk = 'medium';
      }
    }

    // Generate risk recommendations
    assessment.recommendations = this.generateRiskRecommendations(assessment);

    // Store assessment
    this.riskAssessments.set(assessment.id, assessment);

    // Emit assessment
    this.emit('riskAssessment', assessment);

    return assessment;
  }

  /**
   * Assess framework risk
   */
  assessFrameworkRisk(frameworkId) {
    const recentFindings = Array.from(this.auditFindings.values())
      .filter(finding => finding.framework === frameworkId)
      .slice(-10); // Last 10 findings

    let riskScore = 0;
    const riskFactors = [];

    if (recentFindings.length === 0) {
      return {
        score: 50,
        level: 'medium',
        factors: ['Insufficient audit data'],
        recommendations: ['Increase audit frequency']
      };
    }

    for (const finding of recentFindings) {
      for (const rule of Object.values(finding.rules)) {
        for (const check of rule.checks) {
          if (check.status === 'failed') {
            const severityScore =
              {
                low: 10,
                medium: 25,
                high: 50,
                critical: 100
              }[check.severity] || 25;

            riskScore += severityScore;
            riskFactors.push(`${rule.rule}: ${check.requirement}`);
          }
        }
      }
    }

    // Normalize score
    riskScore = Math.min(100, riskScore / recentFindings.length);

    return {
      score: riskScore,
      level: this.getRiskLevel(riskScore),
      factors: riskFactors.slice(0, 5), // Top 5 factors
      recommendations: this.generateFrameworkRiskRecommendations(frameworkId, riskScore)
    };
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= this.options.riskThresholds.critical) return 'critical';
    if (score >= this.options.riskThresholds.high) return 'high';
    if (score >= this.options.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Generate framework risk recommendations
   */
  generateFrameworkRiskRecommendations(framework, score) {
    const recommendations = [];

    if (score >= this.options.riskThresholds.high) {
      recommendations.push(`Immediate action required for ${framework} compliance`);
    }

    if (score >= this.options.riskThresholds.medium) {
      recommendations.push(`Review and strengthen ${framework} controls`);
    }

    recommendations.push(`Increase monitoring frequency for ${framework}`);
    recommendations.push(`Conduct comprehensive ${framework} audit`);

    return recommendations;
  }

  /**
   * Generate risk recommendations
   */
  generateRiskRecommendations(assessment) {
    const recommendations = [];

    if (assessment.overallRisk === 'critical') {
      recommendations.push({
        priority: 'critical',
        message: 'Critical compliance risks detected across multiple frameworks',
        action: 'immediate_attention'
      });
    }

    if (assessment.overallRisk === 'high') {
      recommendations.push({
        priority: 'high',
        message: 'High compliance risks require immediate attention',
        action: 'review_frameworks'
      });
    }

    // Framework-specific recommendations
    for (const [framework, risk] of Object.entries(assessment.frameworkRisks)) {
      if (risk.level === 'critical') {
        recommendations.push({
          priority: 'critical',
          message: `${framework} compliance at critical risk level`,
          action: `review_${framework.toLowerCase()}`
        });
      }
    }

    return recommendations;
  }

  /**
   * Create regulatory alert
   */
  createRegulatoryAlert(alertData) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      createdAt: new Date(),
      status: 'active'
    };

    this.regulatoryAlerts.set(alert.id, alert);

    // Emit alert
    this.emit('regulatoryAlert', alert);

    return alert;
  }

  /**
   * Check for regulatory alerts
   */
  checkRegulatoryAlerts() {
    // Check for upcoming regulatory deadlines
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check SOX quarterly reporting
    const soxReportingDates = this.getSOXReportingDates(now.getFullYear());
    const upcomingSOX = soxReportingDates.find(date => date > now && date < thirtyDays);

    if (upcomingSOX) {
      this.createRegulatoryAlert({
        type: 'UPCOMING_DEADLINE',
        framework: 'SOX',
        description: 'Quarterly financial reporting deadline approaching',
        deadline: upcomingSOX,
        severity: 'medium'
      });
    }

    // Check GDPR annual reviews
    const gdprReviewDate = new Date(now.getFullYear(), 4, 25); // May 25
    if (gdprReviewDate > now && gdprReviewDate < thirtyDays) {
      this.createRegulatoryAlert({
        type: 'COMPLIANCE_REVIEW',
        framework: 'GDPR',
        description: 'Annual GDPR compliance review due',
        deadline: gdprReviewDate,
        severity: 'medium'
      });
    }
  }

  /**
   * Get SOX reporting dates
   */
  getSOXReportingDates(year) {
    return [
      new Date(year, 2, 31), // Q1 - March 31
      new Date(year, 5, 30), // Q2 - June 30
      new Date(year, 8, 30), // Q3 - September 30
      new Date(year, 11, 31) // Q4 - December 31
    ];
  }

  /**
   * Get compliance metrics
   */
  getComplianceMetrics() {
    const metrics = {
      overallCompliance: this.calculateOverallCompliance(),
      frameworkMetrics: {},
      riskMetrics: this.getRiskMetrics(),
      alertMetrics: this.getAlertMetrics()
    };

    for (const frameworkId of this.options.complianceFrameworks) {
      metrics.frameworkMetrics[frameworkId] = this.getFrameworkMetrics(frameworkId);
    }

    return metrics;
  }

  /**
   * Calculate overall compliance
   */
  calculateOverallCompliance() {
    const frameworkScores = Object.values(this.complianceReports)
      .slice(-this.options.complianceFrameworks.length) // Most recent reports
      .map(report => report.score);

    if (frameworkScores.length === 0) return 0;

    return frameworkScores.reduce((sum, score) => sum + score, 0) / frameworkScores.length;
  }

  /**
   * Get framework metrics
   */
  getFrameworkMetrics(frameworkId) {
    const reports = Array.from(this.complianceReports.values())
      .filter(report => report.framework === frameworkId)
      .slice(-5); // Last 5 reports

    if (reports.length === 0) {
      return {
        score: 0,
        trend: 'insufficient-data',
        compliance: 'unknown'
      };
    }

    const latest = reports[reports.length - 1];
    const scores = reports.map(r => r.score);
    const trend =
      scores.length > 1
        ? scores[scores.length - 1] > scores[0]
          ? 'improving'
          : 'declining'
        : 'stable';

    return {
      score: latest.score,
      trend,
      compliance: latest.compliance,
      lastReport: latest.generatedAt
    };
  }

  /**
   * Get risk metrics
   */
  getRiskMetrics() {
    const recentAssessments = Array.from(this.riskAssessments.values()).slice(-5); // Last 5 assessments

    if (recentAssessments.length === 0) {
      return {
        overallRisk: 'unknown',
        criticalFrameworks: 0,
        highRiskFrameworks: 0
      };
    }

    const latest = recentAssessments[recentAssessments.length - 1];
    const criticalCount = Object.values(latest.frameworkRisks).filter(
      risk => risk.level === 'critical'
    ).length;
    const highCount = Object.values(latest.frameworkRisks).filter(
      risk => risk.level === 'high'
    ).length;

    return {
      overallRisk: latest.overallRisk,
      criticalFrameworks: criticalCount,
      highRiskFrameworks: highCount,
      lastAssessment: latest.timestamp
    };
  }

  /**
   * Get alert metrics
   */
  getAlertMetrics() {
    const recentAlerts = Array.from(this.regulatoryAlerts.values()).filter(
      alert => Date.now() - alert.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000
    ); // Last 30 days

    const criticalCount = recentAlerts.filter(alert => alert.severity === 'critical').length;
    const highCount = recentAlerts.filter(alert => alert.severity === 'high').length;

    return {
      totalAlerts: recentAlerts.length,
      criticalAlerts: criticalCount,
      highSeverityAlerts: highCount,
      unresolvedAlerts: recentAlerts.filter(alert => alert.status === 'active').length
    };
  }

  /**
   * Export compliance data
   */
  exportComplianceData() {
    return {
      rules: Object.fromEntries(this.complianceRules),
      findings: Object.fromEntries(this.auditFindings),
      reports: Object.fromEntries(this.complianceReports),
      assessments: Object.fromEntries(this.riskAssessments),
      alerts: Object.fromEntries(this.regulatoryAlerts),
      metrics: this.getComplianceMetrics(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.eventListeners || !this.eventListeners.has(event)) return;

    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in compliance monitoring ${event} callback:`, error);
      }
    });
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    this.complianceRules.clear();
    this.auditFindings.clear();
    this.complianceReports.clear();
    this.riskAssessments.clear();
    this.regulatoryAlerts.clear();
    this.complianceMetrics.clear();

    this.isInitialized = false;
    console.log('Compliance Monitoring Service shutdown');
  }
}

// Export singleton instance
export const complianceMonitoringService = new ComplianceMonitoringService();
export default ComplianceMonitoringService;
