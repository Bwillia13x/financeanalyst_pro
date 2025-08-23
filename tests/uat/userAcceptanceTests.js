// User Acceptance Testing Framework - Financial Professional Workflows
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

export class UserAcceptanceTestFramework {
  constructor() {
    this.testScenarios = new Map();
    this.userProfiles = new Map();
    this.testResults = new Map();
    this.feedbackCollector = new Map();
    this.performanceMetrics = new Map();
    this.initializeUserProfiles();
    this.initializeTestScenarios();
  }

  initializeUserProfiles() {
    const profiles = {
      investment_banker: {
        name: 'Investment Banking Analyst',
        experience: 'intermediate',
        primaryTasks: ['m&a_modeling', 'dcf_valuation', 'presentation_creation', 'peer_analysis'],
        expectations: {
          speed: 'fast',
          accuracy: 'high',
          collaboration: 'essential',
          visualization: 'professional'
        },
        painPoints: ['manual_calculations', 'version_control', 'data_gathering', 'formatting_time']
      },
      equity_researcher: {
        name: 'Equity Research Analyst',
        experience: 'senior',
        primaryTasks: ['company_analysis', 'industry_research', 'forecast_modeling', 'report_writing'],
        expectations: {
          speed: 'moderate',
          accuracy: 'very_high',
          collaboration: 'moderate',
          visualization: 'detailed'
        },
        painPoints: ['data_reliability', 'model_complexity', 'research_synthesis', 'peer_comparison']
      },
      portfolio_manager: {
        name: 'Portfolio Manager',
        experience: 'senior',
        primaryTasks: ['portfolio_analysis', 'risk_assessment', 'performance_attribution', 'client_reporting'],
        expectations: {
          speed: 'fast',
          accuracy: 'high',
          collaboration: 'low',
          visualization: 'executive'
        },
        painPoints: ['real_time_data', 'risk_monitoring', 'client_communication', 'regulatory_compliance']
      },
      credit_analyst: {
        name: 'Credit Analyst',
        experience: 'intermediate',
        primaryTasks: ['credit_modeling', 'default_analysis', 'covenant_monitoring', 'risk_rating'],
        expectations: {
          speed: 'moderate',
          accuracy: 'very_high',
          collaboration: 'moderate',
          visualization: 'analytical'
        },
        painPoints: ['data_quality', 'model_validation', 'regulatory_requirements', 'stress_testing']
      },
      financial_consultant: {
        name: 'Financial Consultant',
        experience: 'beginner',
        primaryTasks: ['client_analysis', 'proposal_creation', 'basic_modeling', 'presentation_prep'],
        expectations: {
          speed: 'learning_curve_ok',
          accuracy: 'guided',
          collaboration: 'high',
          visualization: 'simple'
        },
        painPoints: ['complexity', 'learning_curve', 'template_access', 'client_customization']
      }
    };

    Object.entries(profiles).forEach(([key, profile]) => {
      this.userProfiles.set(key, profile);
    });
  }

  initializeTestScenarios() {
    const scenarios = {
      complete_dcf_analysis: {
        title: 'Complete DCF Valuation Analysis',
        description: 'User performs end-to-end DCF analysis from data input to presentation',
        userTypes: ['investment_banker', 'equity_researcher'],
        steps: [
          'login_and_setup',
          'create_new_analysis',
          'input_financial_data',
          'build_dcf_model',
          'perform_sensitivity_analysis',
          'create_executive_summary',
          'export_presentation',
          'share_with_team'
        ],
        expectedDuration: 45, // minutes
        successCriteria: {
          completion_rate: 0.95,
          error_rate: 0.05,
          user_satisfaction: 4.0,
          task_efficiency: 0.8
        }
      },

      collaborative_model_review: {
        title: 'Collaborative Model Review Process',
        description: 'Multiple users collaborate on model review with comments and version control',
        userTypes: ['investment_banker', 'equity_researcher', 'portfolio_manager'],
        steps: [
          'access_shared_model',
          'review_assumptions',
          'add_comments_feedback',
          'suggest_modifications',
          'track_version_changes',
          'approve_final_version',
          'notify_stakeholders'
        ],
        expectedDuration: 30, // minutes
        successCriteria: {
          completion_rate: 0.9,
          error_rate: 0.1,
          user_satisfaction: 4.2,
          collaboration_effectiveness: 0.85
        }
      },

      real_time_dashboard_monitoring: {
        title: 'Real-time Portfolio Dashboard Monitoring',
        description: 'Portfolio manager monitors real-time dashboard with alerts and updates',
        userTypes: ['portfolio_manager'],
        steps: [
          'access_portfolio_dashboard',
          'configure_alert_thresholds',
          'monitor_real_time_updates',
          'drill_down_into_positions',
          'generate_risk_report',
          'export_client_summary'
        ],
        expectedDuration: 20, // minutes
        successCriteria: {
          completion_rate: 0.98,
          error_rate: 0.02,
          user_satisfaction: 4.5,
          real_time_accuracy: 0.99
        }
      },

      credit_risk_assessment: {
        title: 'Comprehensive Credit Risk Assessment',
        description: 'Credit analyst performs complete credit analysis with multiple models',
        userTypes: ['credit_analyst'],
        steps: [
          'import_company_financials',
          'run_altman_z_score',
          'perform_ratio_analysis',
          'conduct_peer_comparison',
          'assess_covenant_compliance',
          'generate_risk_rating',
          'create_credit_memo'
        ],
        expectedDuration: 60, // minutes
        successCriteria: {
          completion_rate: 0.92,
          error_rate: 0.08,
          user_satisfaction: 4.1,
          model_accuracy: 0.95
        }
      },

      beginner_onboarding: {
        title: 'New User Onboarding Experience',
        description: 'First-time user completes guided onboarding and basic analysis',
        userTypes: ['financial_consultant'],
        steps: [
          'complete_guided_tour',
          'explore_template_library',
          'create_first_analysis',
          'use_help_system',
          'join_collaboration_session',
          'export_basic_report'
        ],
        expectedDuration: 90, // minutes
        successCriteria: {
          completion_rate: 0.85,
          error_rate: 0.15,
          user_satisfaction: 3.8,
          learning_effectiveness: 0.8
        }
      },

      advanced_visualization_creation: {
        title: 'Advanced Visualization and Dashboard Creation',
        description: 'User creates custom dashboards with advanced charts and interactive elements',
        userTypes: ['equity_researcher', 'portfolio_manager'],
        steps: [
          'access_dashboard_builder',
          'select_visualization_types',
          'configure_data_connections',
          'customize_chart_properties',
          'add_interactive_elements',
          'test_real_time_updates',
          'publish_and_share'
        ],
        expectedDuration: 40, // minutes
        successCriteria: {
          completion_rate: 0.88,
          error_rate: 0.12,
          user_satisfaction: 4.3,
          visualization_quality: 0.9
        }
      },

      mobile_workflow_testing: {
        title: 'Mobile Device Workflow Testing',
        description: 'Users access and interact with platform on mobile devices',
        userTypes: ['portfolio_manager', 'investment_banker'],
        steps: [
          'login_mobile_device',
          'access_dashboard_mobile',
          'review_notifications',
          'approve_model_changes',
          'view_charts_mobile',
          'send_quick_updates'
        ],
        expectedDuration: 15, // minutes
        successCriteria: {
          completion_rate: 0.8,
          error_rate: 0.2,
          user_satisfaction: 3.5,
          mobile_usability: 0.75
        }
      }
    };

    Object.entries(scenarios).forEach(([key, scenario]) => {
      this.testScenarios.set(key, scenario);
    });
  }

  async runUserAcceptanceTest(scenarioId, userProfileId, testEnvironment = 'staging') {
    const scenario = this.testScenarios.get(scenarioId);
    const userProfile = this.userProfiles.get(userProfileId);
    
    if (!scenario || !userProfile) {
      throw new Error('Invalid scenario or user profile');
    }

    const testSession = {
      id: this.generateTestId(),
      scenarioId,
      userProfileId,
      environment: testEnvironment,
      startTime: Date.now(),
      steps: [],
      metrics: {
        completionTime: 0,
        errorCount: 0,
        successfulSteps: 0,
        userSatisfactionRating: 0,
        feedbackComments: []
      }
    };

    console.log(`Starting UAT: ${scenario.title} for ${userProfile.name}`);

    try {
      // Execute test steps
      for (const stepName of scenario.steps) {
        const stepResult = await this.executeTestStep(stepName, userProfile, testEnvironment);
        testSession.steps.push(stepResult);
        
        if (stepResult.success) {
          testSession.metrics.successfulSteps++;
        } else {
          testSession.metrics.errorCount++;
        }
      }

      testSession.metrics.completionTime = Date.now() - testSession.startTime;
      
      // Collect user feedback
      testSession.metrics.userSatisfactionRating = await this.collectUserFeedback(
        scenario,
        userProfile,
        testSession
      );

      // Analyze results
      const analysisResults = this.analyzeTestResults(testSession, scenario);
      testSession.analysis = analysisResults;

      // Store results
      this.testResults.set(testSession.id, testSession);

      return testSession;

    } catch (error) {
      console.error('UAT execution failed:', error);
      testSession.error = error.message;
      testSession.metrics.completionTime = Date.now() - testSession.startTime;
      
      this.testResults.set(testSession.id, testSession);
      return testSession;
    }
  }

  async executeTestStep(stepName, userProfile, environment) {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (stepName) {
        case 'login_and_setup':
          result = await this.simulateLogin(userProfile, environment);
          break;
          
        case 'create_new_analysis':
          result = await this.simulateAnalysisCreation(userProfile);
          break;
          
        case 'input_financial_data':
          result = await this.simulateDataInput(userProfile);
          break;
          
        case 'build_dcf_model':
          result = await this.simulateDCFModeling(userProfile);
          break;
          
        case 'perform_sensitivity_analysis':
          result = await this.simulateSensitivityAnalysis(userProfile);
          break;
          
        case 'create_executive_summary':
          result = await this.simulateExecutiveSummary(userProfile);
          break;
          
        case 'export_presentation':
          result = await this.simulatePresentationExport(userProfile);
          break;
          
        case 'share_with_team':
          result = await this.simulateTeamSharing(userProfile);
          break;
          
        case 'access_shared_model':
          result = await this.simulateSharedModelAccess(userProfile);
          break;
          
        case 'add_comments_feedback':
          result = await this.simulateCommentAddition(userProfile);
          break;
          
        case 'track_version_changes':
          result = await this.simulateVersionTracking(userProfile);
          break;
          
        default:
          result = await this.simulateGenericStep(stepName, userProfile);
      }

      return {
        stepName,
        success: true,
        duration: Date.now() - startTime,
        result,
        userExperience: this.assessUserExperience(stepName, userProfile, result)
      };

    } catch (error) {
      return {
        stepName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        userExperience: 'poor'
      };
    }
  }

  async simulateLogin(userProfile, environment) {
    // Simulate login process
    const loginDuration = userProfile.experience === 'beginner' ? 2000 : 1000;
    await this.delay(loginDuration);
    
    return {
      authenticated: true,
      sessionId: 'test-session-123',
      userRoles: userProfile.primaryTasks,
      environment
    };
  }

  async simulateAnalysisCreation(userProfile) {
    const creationTime = userProfile.experience === 'beginner' ? 3000 : 1500;
    await this.delay(creationTime);
    
    return {
      analysisId: 'analysis-' + Date.now(),
      template: 'dcf_model',
      created: true
    };
  }

  async simulateDataInput(userProfile) {
    const inputComplexity = userProfile.experience === 'beginner' ? 'guided' : 'direct';
    const inputDuration = inputComplexity === 'guided' ? 5000 : 3000;
    
    await this.delay(inputDuration);
    
    // Simulate potential errors based on user experience
    if (userProfile.experience === 'beginner' && Math.random() < 0.2) {
      throw new Error('Data validation error - guided help needed');
    }
    
    return {
      dataRows: 120,
      validationErrors: userProfile.experience === 'beginner' ? 2 : 0,
      inputMethod: inputComplexity,
      completed: true
    };
  }

  async simulateDCFModeling(userProfile) {
    const modelingDuration = 4000;
    await this.delay(modelingDuration);
    
    // Assess model quality based on user experience
    const modelQuality = {
      'beginner': 0.7,
      'intermediate': 0.85,
      'senior': 0.95
    };
    
    return {
      modelCompleted: true,
      assumptions: 15,
      scenarios: userProfile.experience === 'senior' ? 3 : 1,
      qualityScore: modelQuality[userProfile.experience],
      validationPassed: true
    };
  }

  async simulateSensitivityAnalysis(userProfile) {
    const analysisDuration = 2500;
    await this.delay(analysisDuration);
    
    return {
      sensitivityRuns: userProfile.experience === 'senior' ? 5 : 3,
      variablesAnalyzed: ['revenue_growth', 'discount_rate', 'terminal_growth'],
      chartGenerated: true,
      insightsProvided: userProfile.experience !== 'beginner'
    };
  }

  async simulateExecutiveSummary(userProfile) {
    const summaryDuration = 3000;
    await this.delay(summaryDuration);
    
    return {
      summaryGenerated: true,
      keyMetrics: 8,
      visualizations: 4,
      narrativeQuality: userProfile.experience === 'senior' ? 'excellent' : 'good'
    };
  }

  async simulatePresentationExport(userProfile) {
    const exportDuration = 2000;
    await this.delay(exportDuration);
    
    return {
      format: 'pptx',
      slides: 12,
      exportTime: exportDuration,
      fileSize: '2.3MB',
      quality: 'professional'
    };
  }

  async simulateTeamSharing(userProfile) {
    const sharingDuration = 1500;
    await this.delay(sharingDuration);
    
    return {
      shareMethod: 'secure_link',
      permissions: 'view_comment',
      recipients: 3,
      notificationsSent: true
    };
  }

  async simulateSharedModelAccess(userProfile) {
    const accessDuration = 1000;
    await this.delay(accessDuration);
    
    return {
      modelLoaded: true,
      loadTime: accessDuration,
      permissions: ['view', 'comment'],
      versionInfo: 'v2.1'
    };
  }

  async simulateCommentAddition(userProfile) {
    const commentDuration = 2000;
    await this.delay(commentDuration);
    
    return {
      commentsAdded: userProfile.experience === 'senior' ? 3 : 1,
      threadCreated: true,
      mentionsUsed: userProfile.experience !== 'beginner'
    };
  }

  async simulateVersionTracking(userProfile) {
    const trackingDuration = 1500;
    await this.delay(trackingDuration);
    
    return {
      versionsViewed: 4,
      changesIdentified: 7,
      comparisonGenerated: true,
      understandingLevel: userProfile.experience
    };
  }

  async simulateGenericStep(stepName, userProfile) {
    const genericDuration = 2000;
    await this.delay(genericDuration);
    
    return {
      stepCompleted: true,
      duration: genericDuration,
      userAdaptation: userProfile.experience
    };
  }

  assessUserExperience(stepName, userProfile, result) {
    // Assess user experience based on step complexity and user profile
    const complexSteps = ['build_dcf_model', 'perform_sensitivity_analysis', 'create_executive_summary'];
    const isComplex = complexSteps.includes(stepName);
    
    if (isComplex && userProfile.experience === 'beginner') {
      return result.error ? 'poor' : 'challenging';
    }
    
    if (result.error) {
      return 'poor';
    }
    
    if (result.duration > 5000) {
      return userProfile.experience === 'beginner' ? 'acceptable' : 'slow';
    }
    
    return 'good';
  }

  async collectUserFeedback(scenario, userProfile, testSession) {
    // Simulate user feedback collection
    await this.delay(1000);
    
    // Base satisfaction on scenario success and user expectations
    const successRate = testSession.metrics.successfulSteps / scenario.steps.length;
    const expectedDuration = scenario.expectedDuration * 60 * 1000; // Convert to ms
    const actualDuration = testSession.metrics.completionTime;
    
    let satisfactionScore = 3.0; // Base score
    
    // Adjust based on success rate
    satisfactionScore += (successRate - 0.8) * 5; // +/- 1 point for success rate
    
    // Adjust based on timing
    if (actualDuration <= expectedDuration) {
      satisfactionScore += 0.5;
    } else if (actualDuration > expectedDuration * 1.5) {
      satisfactionScore -= 0.5;
    }
    
    // Adjust based on user profile expectations
    if (userProfile.expectations.speed === 'fast' && actualDuration > expectedDuration) {
      satisfactionScore -= 0.3;
    }
    
    // Clamp to 1-5 range
    satisfactionScore = Math.max(1, Math.min(5, satisfactionScore));
    
    return Math.round(satisfactionScore * 10) / 10; // Round to 1 decimal
  }

  analyzeTestResults(testSession, scenario) {
    const metrics = testSession.metrics;
    const successRate = metrics.successfulSteps / scenario.steps.length;
    const errorRate = metrics.errorCount / scenario.steps.length;
    const efficiencyScore = scenario.expectedDuration * 60 * 1000 / metrics.completionTime;
    
    return {
      overallSuccess: successRate >= scenario.successCriteria.completion_rate,
      successRate,
      errorRate,
      efficiencyScore: Math.min(1, efficiencyScore),
      satisfactionMet: metrics.userSatisfactionRating >= scenario.successCriteria.user_satisfaction,
      recommendations: this.generateRecommendations(testSession, scenario),
      passedCriteria: this.evaluateCriteria(testSession, scenario)
    };
  }

  generateRecommendations(testSession, scenario) {
    const recommendations = [];
    const metrics = testSession.metrics;
    
    if (metrics.errorCount > 0) {
      recommendations.push({
        priority: 'high',
        area: 'error_reduction',
        suggestion: 'Improve error handling and user guidance'
      });
    }
    
    if (metrics.completionTime > scenario.expectedDuration * 60 * 1000 * 1.2) {
      recommendations.push({
        priority: 'medium',
        area: 'performance',
        suggestion: 'Optimize workflow efficiency and reduce task complexity'
      });
    }
    
    if (metrics.userSatisfactionRating < 4.0) {
      recommendations.push({
        priority: 'high',
        area: 'user_experience',
        suggestion: 'Enhance user interface and provide better onboarding'
      });
    }
    
    return recommendations;
  }

  evaluateCriteria(testSession, scenario) {
    const criteria = scenario.successCriteria;
    const metrics = testSession.metrics;
    const successRate = metrics.successfulSteps / scenario.steps.length;
    const errorRate = metrics.errorCount / scenario.steps.length;
    
    return {
      completion_rate: successRate >= criteria.completion_rate,
      error_rate: errorRate <= criteria.error_rate,
      user_satisfaction: metrics.userSatisfactionRating >= criteria.user_satisfaction,
      overall_pass: successRate >= criteria.completion_rate && 
                   errorRate <= criteria.error_rate && 
                   metrics.userSatisfactionRating >= criteria.user_satisfaction
    };
  }

  async runFullUATSuite() {
    const results = [];
    
    console.log('Starting Full UAT Suite...');
    
    // Run all scenarios for appropriate user types
    for (const [scenarioId, scenario] of this.testScenarios) {
      for (const userType of scenario.userTypes) {
        try {
          const result = await this.runUserAcceptanceTest(scenarioId, userType);
          results.push(result);
          console.log(`✓ Completed: ${scenario.title} - ${userType}`);
        } catch (error) {
          console.error(`✗ Failed: ${scenario.title} - ${userType}:`, error);
          results.push({ error: error.message, scenarioId, userType });
        }
      }
    }
    
    // Generate comprehensive report
    const report = this.generateUATReport(results);
    console.log('UAT Suite completed. Report generated.');
    
    return report;
  }

  generateUATReport(results) {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.analysis?.passedCriteria?.overall_pass).length;
    const failedTests = totalTests - passedTests;
    
    const avgSatisfaction = results.reduce((sum, r) => 
      sum + (r.metrics?.userSatisfactionRating || 0), 0) / totalTests;
    
    const avgDuration = results.reduce((sum, r) => 
      sum + (r.metrics?.completionTime || 0), 0) / totalTests;
    
    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        passRate: (passedTests / totalTests) * 100,
        averageSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        averageDuration: Math.round(avgDuration / 1000 / 60), // minutes
        testDate: new Date().toISOString()
      },
      detailedResults: results,
      recommendations: this.aggregateRecommendations(results),
      nextSteps: this.generateNextSteps(results)
    };
  }

  aggregateRecommendations(results) {
    const recommendations = new Map();
    
    results.forEach(result => {
      if (result.analysis?.recommendations) {
        result.analysis.recommendations.forEach(rec => {
          const key = rec.area;
          if (!recommendations.has(key)) {
            recommendations.set(key, { ...rec, count: 0 });
          }
          recommendations.get(key).count++;
        });
      }
    });
    
    return Array.from(recommendations.values()).sort((a, b) => b.count - a.count);
  }

  generateNextSteps(results) {
    const passRate = results.filter(r => r.analysis?.passedCriteria?.overall_pass).length / results.length;
    
    if (passRate >= 0.9) {
      return ['Ready for production deployment', 'Monitor user feedback post-launch'];
    } else if (passRate >= 0.7) {
      return ['Address critical issues', 'Run targeted re-testing', 'Prepare staged rollout'];
    } else {
      return ['Major redesign required', 'Focus on core user workflows', 'Extended testing phase'];
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateTestId() {
    return 'uat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Export for testing framework integration
export const uatFramework = new UserAcceptanceTestFramework();

// Jest test suite for UAT automation
describe('User Acceptance Tests - FinanceAnalyst Pro Phase 2', () => {
  let framework;

  beforeEach(() => {
    framework = new UserAcceptanceTestFramework();
  });

  describe('Investment Banking Workflows', () => {
    it('should complete DCF analysis workflow successfully', async () => {
      const result = await framework.runUserAcceptanceTest('complete_dcf_analysis', 'investment_banker');
      
      expect(result.analysis.overallSuccess).toBe(true);
      expect(result.metrics.userSatisfactionRating).toBeGreaterThanOrEqual(4.0);
      expect(result.metrics.errorCount).toBeLessThanOrEqual(2);
    }, 60000);

    it('should handle collaborative model review', async () => {
      const result = await framework.runUserAcceptanceTest('collaborative_model_review', 'investment_banker');
      
      expect(result.analysis.successRate).toBeGreaterThanOrEqual(0.9);
      expect(result.analysis.satisfactionMet).toBe(true);
    }, 45000);
  });

  describe('Portfolio Management Workflows', () => {
    it('should provide effective dashboard monitoring', async () => {
      const result = await framework.runUserAcceptanceTest('real_time_dashboard_monitoring', 'portfolio_manager');
      
      expect(result.analysis.overallSuccess).toBe(true);
      expect(result.analysis.efficiencyScore).toBeGreaterThanOrEqual(0.8);
    }, 30000);
  });

  describe('Credit Analysis Workflows', () => {
    it('should complete comprehensive credit assessment', async () => {
      const result = await framework.runUserAcceptanceTest('credit_risk_assessment', 'credit_analyst');
      
      expect(result.analysis.passedCriteria.overall_pass).toBe(true);
      expect(result.metrics.successfulSteps).toBeGreaterThanOrEqual(6);
    }, 75000);
  });

  describe('User Onboarding', () => {
    it('should provide effective onboarding for beginners', async () => {
      const result = await framework.runUserAcceptanceTest('beginner_onboarding', 'financial_consultant');
      
      expect(result.analysis.successRate).toBeGreaterThanOrEqual(0.85);
      expect(result.metrics.userSatisfactionRating).toBeGreaterThanOrEqual(3.8);
    }, 120000);
  });

  describe('Advanced Features', () => {
    it('should support advanced visualization creation', async () => {
      const result = await framework.runUserAcceptanceTest('advanced_visualization_creation', 'equity_researcher');
      
      expect(result.analysis.overallSuccess).toBe(true);
    }, 50000);

    it('should work on mobile devices', async () => {
      const result = await framework.runUserAcceptanceTest('mobile_workflow_testing', 'portfolio_manager');
      
      expect(result.analysis.successRate).toBeGreaterThanOrEqual(0.8);
    }, 20000);
  });

  describe('Full UAT Suite', () => {
    it('should pass comprehensive UAT across all user types', async () => {
      const report = await framework.runFullUATSuite();
      
      expect(report.summary.passRate).toBeGreaterThanOrEqual(85);
      expect(report.summary.averageSatisfaction).toBeGreaterThanOrEqual(4.0);
      expect(report.recommendations).toBeDefined();
      expect(report.nextSteps).toContain('Ready for production deployment');
    }, 600000); // 10 minutes for full suite
  });
});
