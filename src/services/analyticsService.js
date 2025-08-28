/**
 * User Analytics and Usage Tracking Service
 * Comprehensive analytics for user behavior, feature usage, and performance monitoring
 */

class AnalyticsService {
  constructor() {
    this.events = new Map();
    this.userSessions = new Map();
    this.featureUsage = new Map();
    this.performanceMetrics = new Map();
    this.userBehavior = new Map();
    this.isInitialized = false;
    this.currentSession = null;
    this.trackingEnabled = true;

    // Configuration
    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      batchSize: 50,
      flushInterval: 60 * 1000, // 1 minute
      storageKey: 'financeanalyst_analytics',
      enableLocalStorage: true,
      enableRemoteTracking: false
    };

    // Event queue for batch processing
    this.eventQueue = [];
    this.flushTimer = null;

    // Initialize service
    this.initialize();
  }

  /**
   * Initialize analytics service
   */
  initialize() {
    try {
      // Load stored data
      this.loadStoredData();

      // Start new session
      this.startSession();

      // Set up periodic data flushing
      this.startFlushTimer();

      // Set up page visibility tracking
      this.setupVisibilityTracking();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      this.isInitialized = true;
      this.trackEvent('analytics_initialized', { timestamp: Date.now() });

      console.log('AnalyticsService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AnalyticsService:', error);
    }
  }

  /**
   * Load stored analytics data from localStorage
   */
  loadStoredData() {
    if (!this.config.enableLocalStorage) return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);

        // Restore feature usage data
        if (data.featureUsage) {
          this.featureUsage = new Map(Object.entries(data.featureUsage));
        }

        // Restore user behavior data
        if (data.userBehavior) {
          this.userBehavior = new Map(Object.entries(data.userBehavior));
        }
      }
    } catch (error) {
      console.error('Failed to load stored analytics data:', error);
    }
  }

  /**
   * Save analytics data to localStorage
   */
  saveData() {
    if (!this.config.enableLocalStorage) return;

    try {
      const data = {
        featureUsage: Object.fromEntries(this.featureUsage),
        userBehavior: Object.fromEntries(this.userBehavior),
        lastSaved: Date.now()
      };

      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  }

  /**
   * Start a new user session
   */
  startSession() {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
      features: new Set(),
      errors: [],
      performance: {
        loadTime: performance.timing
          ? performance.timing.loadEventEnd - performance.timing.navigationStart
          : 0,
        interactions: 0,
        scrollDepth: 0
      }
    };

    this.userSessions.set(sessionId, this.currentSession);
    this.trackEvent('session_started', { sessionId });
  }

  /**
   * End current session
   */
  endSession() {
    if (!this.currentSession) return;

    const sessionDuration = Date.now() - this.currentSession.startTime;

    this.trackEvent('session_ended', {
      sessionId: this.currentSession.id,
      duration: sessionDuration,
      pageViews: this.currentSession.pageViews,
      eventsCount: this.currentSession.events.length,
      featuresUsed: Array.from(this.currentSession.features)
    });

    this.currentSession = null;
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName, properties = {}) {
    if (!this.trackingEnabled) return;

    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: eventName,
      eventType: eventName, // Add eventType for test compatibility
      timestamp: Date.now(),
      sessionId: this.currentSession?.id,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      data: properties // Add data property for test compatibility
    };

    // Add to event queue
    this.eventQueue.push(event);

    // Add to current session
    if (this.currentSession) {
      this.currentSession.events.push(event);
      this.currentSession.lastActivity = Date.now();
    }

    // Store in events map
    this.events.set(event.id, event);

    // Process for feature usage tracking
    this.processFeatureUsage(eventName, properties);

    // Process for user behavior analysis
    this.processUserBehavior(eventName, properties);

    // Flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Track page view
   */
  trackPageView(page, properties = {}) {
    if (this.currentSession) {
      this.currentSession.pageViews++;
    }

    this.trackEvent('page_view', {
      page,
      title: document.title,
      referrer: document.referrer,
      ...properties
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature, action = 'used', properties = {}) {
    const key = `${feature}_${action}`;

    // Update feature usage stats
    const usage = this.featureUsage.get(key) || {
      feature,
      action,
      count: 0,
      firstUsed: Date.now(),
      lastUsed: Date.now(),
      sessions: new Set(),
      avgTimeSpent: 0,
      totalTimeSpent: 0
    };

    usage.count++;
    usage.lastUsed = Date.now();

    if (this.currentSession) {
      usage.sessions.add(this.currentSession.id);
      this.currentSession.features.add(feature);
    }

    this.featureUsage.set(key, usage);

    this.trackEvent('feature_usage', {
      feature,
      action,
      usageCount: usage.count,
      ...properties
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(element, action, properties = {}) {
    if (this.currentSession) {
      this.currentSession.performance.interactions++;
    }

    this.trackEvent('user_interaction', {
      element,
      action,
      ...properties
    });
  }

  /**
   * Track error occurrences
   */
  trackError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      type: error.name,
      context,
      timestamp: Date.now()
    };

    if (this.currentSession) {
      this.currentSession.errors.push(errorData);
    }

    this.trackEvent('error_occurred', errorData);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric, value, properties = {}) {
    const performanceData = {
      metric,
      value,
      timestamp: Date.now(),
      ...properties
    };

    this.performanceMetrics.set(`${metric}_${Date.now()}`, performanceData);
    this.trackEvent('performance_metric', performanceData);
  }

  /**
   * Process feature usage patterns
   */
  processFeatureUsage(eventName, properties) {
    if (eventName === 'feature_usage') {
      const { feature, action: _action } = properties;

      // Track feature adoption over time
      const adoptionKey = `adoption_${feature}`;
      const adoption = this.userBehavior.get(adoptionKey) || {
        type: 'feature_adoption',
        feature,
        firstUsage: Date.now(),
        usageDays: new Set(),
        totalUsage: 0
      };

      adoption.totalUsage++;
      adoption.usageDays.add(new Date().toDateString());
      this.userBehavior.set(adoptionKey, adoption);
    }
  }

  /**
   * Process user behavior patterns
   */
  processUserBehavior(eventName, properties) {
    // Track navigation patterns
    if (eventName === 'page_view') {
      this.trackNavigationPattern(properties.page);
    }

    // Track workflow patterns
    if (eventName === 'feature_usage') {
      this.trackWorkflowPattern(properties.feature, properties.action);
    }

    // Track time-based patterns
    this.trackTimePattern(eventName);
  }

  /**
   * Track navigation patterns
   */
  trackNavigationPattern(page) {
    const navKey = 'navigation_pattern';
    const pattern = this.userBehavior.get(navKey) || {
      type: 'navigation',
      sequences: [],
      pageFrequency: new Map(),
      currentSequence: []
    };

    // Update page frequency
    const pageCount = pattern.pageFrequency.get(page) || 0;
    pattern.pageFrequency.set(page, pageCount + 1);

    // Track navigation sequence
    pattern.currentSequence.push({
      page,
      timestamp: Date.now()
    });

    // Keep sequence length manageable
    if (pattern.currentSequence.length > 10) {
      pattern.sequences.push([...pattern.currentSequence]);
      pattern.currentSequence = pattern.currentSequence.slice(-3);
    }

    this.userBehavior.set(navKey, pattern);
  }

  /**
   * Track workflow patterns
   */
  trackWorkflowPattern(feature, action) {
    const workflowKey = 'workflow_pattern';
    const workflow = this.userBehavior.get(workflowKey) || {
      type: 'workflow',
      sequences: [],
      featureChains: new Map(),
      currentChain: []
    };

    workflow.currentChain.push({
      feature,
      action,
      timestamp: Date.now()
    });

    // Analyze feature chains
    if (workflow.currentChain.length >= 2) {
      const chainKey = workflow.currentChain
        .slice(-2)
        .map(item => `${item.feature}_${item.action}`)
        .join(' -> ');
      const chainCount = workflow.featureChains.get(chainKey) || 0;
      workflow.featureChains.set(chainKey, chainCount + 1);
    }

    // Keep chain length manageable
    if (workflow.currentChain.length > 20) {
      workflow.sequences.push([...workflow.currentChain]);
      workflow.currentChain = workflow.currentChain.slice(-5);
    }

    this.userBehavior.set(workflowKey, workflow);
  }

  /**
   * Track time-based usage patterns
   */
  trackTimePattern(_eventName) {
    const timeKey = 'time_pattern';
    const pattern = this.userBehavior.get(timeKey) || {
      type: 'time_usage',
      hourlyActivity: new Array(24).fill(0),
      dailyActivity: new Array(7).fill(0),
      monthlyActivity: new Array(12).fill(0),
      peakHours: [],
      totalSessions: 0
    };

    const now = new Date();
    pattern.hourlyActivity[now.getHours()]++;
    pattern.dailyActivity[now.getDay()]++;
    pattern.monthlyActivity[now.getMonth()]++;

    this.userBehavior.set(timeKey, pattern);
  }

  /**
   * Set up page visibility tracking
   */
  setupVisibilityTracking() {
    let visibilityStart = Date.now();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeVisible = Date.now() - visibilityStart;
        this.trackEvent('page_hidden', { timeVisible });
      } else {
        visibilityStart = Date.now();
        this.trackEvent('page_visible');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Set up performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor initial page load
    if (performance.timing) {
      window.addEventListener('load', () => {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

        this.trackPerformance('page_load_time', loadTime);
        this.trackPerformance('dom_ready_time', domReady);
      });
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            if (entry.duration > 50) {
              // Tasks longer than 50ms
              this.trackPerformance('long_task', entry.duration, {
                startTime: entry.startTime,
                name: entry.name
              });
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // PerformanceObserver not supported
      }
    }
  }

  /**
   * Start periodic event flushing
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
      this.saveData();
    }, this.config.flushInterval);
  }

  /**
   * Flush events to storage/remote endpoint
   */
  flushEvents() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Save to local storage
    this.saveData();

    // Send to remote endpoint if enabled
    if (this.config.enableRemoteTracking) {
      this.sendToRemote(events);
    }

    console.log(`Flushed ${events.length} analytics events`);
  }

  /**
   * Send events to remote analytics endpoint
   */
  async sendToRemote(events) {
    try {
      // This would typically send to your analytics backend
      console.log('Would send events to remote endpoint:', events.length);
    } catch (error) {
      console.error('Failed to send events to remote endpoint:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Get analytics dashboard data
   */
  getDashboardData() {
    return {
      summary: this.getSummaryMetrics(),
      featureUsage: this.getFeatureUsageMetrics(),
      userBehavior: this.getUserBehaviorMetrics(),
      performance: this.getPerformanceMetrics(),
      sessions: this.getSessionMetrics(),
      trends: this.getTrendAnalysis()
    };
  }

  /**
   * Get summary metrics
   */
  getSummaryMetrics() {
    const totalEvents = this.events.size;
    const totalSessions = this.userSessions.size;
    const activeFeaturesCount = this.featureUsage.size;
    const errorCount = Array.from(this.userSessions.values()).reduce(
      (sum, session) => sum + session.errors.length,
      0
    );

    return {
      totalEvents,
      totalSessions,
      activeFeaturesCount,
      errorCount,
      averageSessionLength: this.getAverageSessionLength(),
      mostUsedFeature: this.getMostUsedFeature(),
      currentSession: this.currentSession
    };
  }

  /**
   * Get feature usage metrics
   */
  getFeatureUsageMetrics() {
    const features = Array.from(this.featureUsage.values()).sort((a, b) => b.count - a.count);

    return {
      topFeatures: features.slice(0, 10),
      totalFeatures: features.length,
      featureAdoption: this.calculateFeatureAdoption(),
      unusedFeatures: this.getUnusedFeatures()
    };
  }

  /**
   * Get user behavior metrics
   */
  getUserBehaviorMetrics() {
    const navigation = this.userBehavior.get('navigation_pattern');
    const workflow = this.userBehavior.get('workflow_pattern');
    const timePattern = this.userBehavior.get('time_pattern');

    return {
      navigation: navigation
        ? {
            topPages: Array.from(navigation.pageFrequency.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10),
            navigationSequences: navigation.sequences.slice(-10)
          }
        : null,
      workflow: workflow
        ? {
            topWorkflows: Array.from(workflow.featureChains.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10),
            workflowSequences: workflow.sequences.slice(-5)
          }
        : null,
      timePattern: timePattern || null
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = Array.from(this.performanceMetrics.values());

    return {
      averageLoadTime: this.calculateAverageMetric(metrics, 'page_load_time'),
      averageDomReady: this.calculateAverageMetric(metrics, 'dom_ready_time'),
      longTasks: metrics.filter(m => m.metric === 'long_task').length,
      performanceTrends: this.getPerformanceTrends(metrics)
    };
  }

  /**
   * Get session metrics
   */
  getSessionMetrics() {
    const sessions = Array.from(this.userSessions.values());

    return {
      totalSessions: sessions.length,
      averageDuration: this.getAverageSessionLength(),
      averagePageViews: sessions.reduce((sum, s) => sum + s.pageViews, 0) / sessions.length,
      bounceRate: this.calculateBounceRate(sessions),
      sessionDistribution: this.getSessionDistribution(sessions)
    };
  }

  /**
   * Get trend analysis
   */
  getTrendAnalysis() {
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    return {
      dailyGrowth: this.calculateGrowthRate(oneDay),
      weeklyGrowth: this.calculateGrowthRate(oneWeek),
      featureAdoptionTrend: this.getFeatureAdoptionTrend(),
      usagePatternChanges: this.getUsagePatternChanges()
    };
  }

  /**
   * Get comprehensive analytics data (used by integration tests)
   */
  getAnalytics() {
    const allEvents = Array.from(this.events.values());
    const sessionData = this.getSessionMetrics();
    const featureData = this.getFeatureUsageMetrics();

    return {
      events: allEvents,
      sessionData,
      featureUsage: featureData, // Map featureData to featureUsage for test compatibility
      performanceMetrics: this.getPerformanceMetrics(),
      userBehavior: this.getUserBehaviorMetrics(),
      summary: this.getSummaryMetrics(),
      currentSession: this.currentSession,
      timestamp: Date.now()
    };
  }

  // Helper methods for calculations
  getAverageSessionLength() {
    const sessions = Array.from(this.userSessions.values());
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      const duration = session.lastActivity - session.startTime;
      return sum + duration;
    }, 0);

    return totalDuration / sessions.length;
  }

  getMostUsedFeature() {
    const features = Array.from(this.featureUsage.values());
    if (features.length === 0) return null;

    return features.reduce((max, feature) => (feature.count > max.count ? feature : max));
  }

  calculateFeatureAdoption() {
    // This would calculate adoption rates over time
    return {
      rate: 0.75, // Placeholder
      trend: 'increasing'
    };
  }

  getUnusedFeatures() {
    // This would identify features that haven't been used
    return [];
  }

  calculateAverageMetric(metrics, metricName) {
    const filtered = metrics.filter(m => m.metric === metricName);
    if (filtered.length === 0) return 0;

    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
  }

  getPerformanceTrends(_metrics) {
    // This would analyze performance trends over time
    return {
      loadTimetrend: 'stable',
      errorRatetrend: 'decreasing'
    };
  }

  calculateBounceRate(sessions) {
    const singlePageSessions = sessions.filter(s => s.pageViews <= 1).length;
    return sessions.length > 0 ? singlePageSessions / sessions.length : 0;
  }

  getSessionDistribution(sessions) {
    const distribution = {
      short: 0, // < 1 minute
      medium: 0, // 1-10 minutes
      long: 0 // > 10 minutes
    };

    sessions.forEach(session => {
      const duration = session.lastActivity - session.startTime;
      const minutes = duration / (60 * 1000);

      if (minutes < 1) distribution.short++;
      else if (minutes < 10) distribution.medium++;
      else distribution.long++;
    });

    return distribution;
  }

  calculateGrowthRate(_timeframe) {
    // This would calculate growth rate over the specified timeframe
    return Math.random() * 20 - 10; // Placeholder: -10% to +10%
  }

  getFeatureAdoptionTrend() {
    // This would analyze feature adoption trends
    return { trend: 'positive', rate: 15 };
  }

  getUsagePatternChanges() {
    // This would identify changes in usage patterns
    return [];
  }

  /**
   * Enable/disable tracking
   */
  setTrackingEnabled(enabled) {
    this.trackingEnabled = enabled;
    if (enabled) {
      this.trackEvent('tracking_enabled');
    } else {
      this.trackEvent('tracking_disabled');
    }
  }

  /**
   * Clear all analytics data
   */
  clearData() {
    this.events.clear();
    this.userSessions.clear();
    this.featureUsage.clear();
    this.performanceMetrics.clear();
    this.userBehavior.clear();
    this.eventQueue = [];

    if (this.config.enableLocalStorage) {
      localStorage.removeItem(this.config.storageKey);
    }

    this.trackEvent('analytics_data_cleared');
  }

  /**
   * Cleanup and shutdown
   */
  cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.endSession();
    this.flushEvents();
    this.saveData();

    console.log('AnalyticsService cleaned up');
  }
}

// Export singleton instance
export default new AnalyticsService();
