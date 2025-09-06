/**
 * User Analytics & Usage Tracking
 * Comprehensive analytics system for FinanceAnalyst Pro
 */

import monitoring from './monitoring.js';

// ===== USER BEHAVIOR ANALYTICS =====
class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.sessionId = null;
    this.userId = null;
    this.userProperties = {};
    this.featureUsage = new Map();
    this.userJourney = [];
    this.pageViews = [];
    this.interactions = [];
    this.conversionEvents = [];
    this.abandonedFlows = [];

    // Initialize if not in test environment
    if (this.shouldInitialize()) {
      this.initializeAnalytics();
    }
  }

  shouldInitialize() {
    return (
      typeof window !== 'undefined' && !this.isTestEnvironment() && !this.isAutomatedEnvironment()
    );
  }

  isTestEnvironment() {
    return (
      import.meta?.env?.MODE === 'test' ||
      (typeof process !== 'undefined' && (process.env?.VITEST || process.env?.NODE_ENV === 'test'))
    );
  }

  isAutomatedEnvironment() {
    if (typeof navigator === 'undefined') return false;

    return (
      navigator.webdriver === true ||
      window.location.search.includes('lhci') ||
      window.location.search.includes('ci') ||
      window.location.search.includes('audit')
    );
  }

  initializeAnalytics() {
    if (this.isInitialized) return;

    this.sessionId = this.generateSessionId();
    this.trackPageView();
    this.trackUserJourney('session_start');
    this.setupEventListeners();
    this.trackDeviceInfo();

    this.isInitialized = true;

    console.log('Analytics initialized:', this.sessionId);
  }

  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  setupEventListeners() {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackUserJourney('page_hidden');
      } else {
        this.trackUserJourney('page_visible');
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.trackUserJourney('session_end');
      this.flushAnalytics();
    });

    // Click tracking for feature usage
    document.addEventListener('click', event => {
      this.trackClickInteraction(event);
    });

    // Form interactions
    document.addEventListener('submit', event => {
      this.trackFormSubmission(event);
    });

    // Scroll depth tracking
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if (scrollDepth >= 25 && scrollDepth % 25 === 0) {
          this.trackScrollDepth(scrollDepth);
        }
      }
    });

    // Error tracking
    window.addEventListener('error', event => {
      this.trackJavaScriptError(event);
    });

    window.addEventListener('unhandledrejection', event => {
      this.trackUnhandledRejection(event);
    });
  }

  trackDeviceInfo() {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      touchSupport: 'ontouchstart' in window,
      connection: this.getConnectionInfo()
    };

    this.trackEvent('device_info', deviceInfo);
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  // ===== USER IDENTIFICATION =====
  identifyUser(userId, userProperties = {}) {
    this.userId = userId;
    this.userProperties = {
      ...this.userProperties,
      ...userProperties,
      identified_at: new Date().toISOString()
    };

    this.trackEvent('user_identified', {
      user_id: userId,
      ...userProperties
    });

    // Update monitoring service
    monitoring.trackUser({
      id: userId,
      ...userProperties
    });
  }

  // ===== PAGE TRACKING =====
  trackPageView(pageName = null, properties = {}) {
    const pageView = {
      page: pageName || window.location.pathname,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      ...properties
    };

    this.pageViews.push(pageView);
    this.trackEvent('page_view', pageView);

    console.log('Page view tracked:', pageView.page);
  }

  // ===== USER JOURNEY TRACKING =====
  trackUserJourney(step, properties = {}) {
    const journeyEvent = {
      step,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      page: window.location.pathname,
      ...properties
    };

    this.userJourney.push(journeyEvent);
    this.trackEvent('user_journey', journeyEvent);
  }

  // ===== FEATURE USAGE TRACKING =====
  trackFeatureUsage(featureName, action = 'used', properties = {}) {
    const featureEvent = {
      feature_name: featureName,
      action,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      ...properties
    };

    // Track in feature usage map
    if (!this.featureUsage.has(featureName)) {
      this.featureUsage.set(featureName, []);
    }
    this.featureUsage.get(featureName).push(featureEvent);

    this.trackEvent('feature_usage', featureEvent);

    // Also track in monitoring service
    monitoring.trackFeatureUsage(featureName, action, properties);
  }

  // ===== CONVERSION TRACKING =====
  trackConversion(conversionType, value = null, properties = {}) {
    const conversionEvent = {
      conversion_type: conversionType,
      value,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      ...properties
    };

    this.conversionEvents.push(conversionEvent);
    this.trackEvent('conversion', conversionEvent);
  }

  // ===== ABANDONMENT TRACKING =====
  trackAbandonment(flowName, step, reason = null, properties = {}) {
    const abandonmentEvent = {
      flow_name: flowName,
      step,
      reason,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId,
      ...properties
    };

    this.abandonedFlows.push(abandonmentEvent);
    this.trackEvent('flow_abandonment', abandonmentEvent);
  }

  // ===== INTERACTION TRACKING =====
  trackClickInteraction(event) {
    const target = event.target;
    const elementInfo = this.getElementInfo(target);

    if (this.shouldTrackElement(elementInfo)) {
      const interactionEvent = {
        type: 'click',
        element: elementInfo,
        page: window.location.pathname,
        position: {
          x: event.clientX,
          y: event.clientY
        },
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        user_id: this.userId
      };

      this.interactions.push(interactionEvent);
      this.trackEvent('interaction', interactionEvent);
    }
  }

  trackFormSubmission(event) {
    const form = event.target;
    const formData = this.getFormData(form);

    const submissionEvent = {
      type: 'form_submission',
      form_id: form.id || form.name || 'unnamed_form',
      form_action: form.action,
      fields_count: formData.length,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId
    };

    this.trackEvent('form_submission', submissionEvent);
  }

  trackScrollDepth(depth) {
    this.trackEvent('scroll_depth', {
      depth_percentage: depth,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId
    });
  }

  trackJavaScriptError(event) {
    const errorEvent = {
      type: 'javascript_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId
    };

    this.trackEvent('javascript_error', errorEvent);
    monitoring.trackError(event.error || new Error(event.message));
  }

  trackUnhandledRejection(event) {
    const rejectionEvent = {
      type: 'unhandled_rejection',
      reason: event.reason?.message || String(event.reason),
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId
    };

    this.trackEvent('unhandled_rejection', rejectionEvent);
    monitoring.trackError(event.reason);
  }

  // ===== UTILITY FUNCTIONS =====
  getElementInfo(element) {
    const info = {
      tagName: element.tagName?.toLowerCase(),
      id: element.id,
      className: String(element.className || ''), // Ensure it's always a string
      textContent: element.textContent?.substring(0, 100),
      dataAttributes: {}
    };

    // Get data attributes
    for (const attr of element.attributes || []) {
      if (attr.name.startsWith('data-')) {
        info.dataAttributes[attr.name] = attr.value;
      }
    }

    // Get parent context
    if (element.parentElement) {
      info.parentTag = element.parentElement.tagName?.toLowerCase();
      info.parentClass = String(element.parentElement.className || ''); // Ensure it's always a string
    }

    return info;
  }

  shouldTrackElement(elementInfo) {
    // Track buttons, links, and interactive elements
    const trackableTags = ['button', 'a', 'input', 'select', 'textarea'];
    const trackableClasses = ['btn', 'button', 'link', 'nav', 'menu'];

    return (
      trackableTags.includes(elementInfo.tagName) ||
      trackableClasses.some(cls => elementInfo.className?.includes(cls)) ||
      elementInfo.dataAttributes['data-track'] === 'true'
    );
  }

  getFormData(form) {
    const formData = [];
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      if (input.type !== 'password' && input.type !== 'hidden') {
        formData.push({
          name: input.name,
          type: input.type,
          value: input.type === 'checkbox' ? input.checked : input.value?.substring(0, 100)
        });
      }
    });

    return formData;
  }

  // ===== ANALYTICS EVENT TRACKING =====
  trackEvent(eventName, properties = {}) {
    // Send to monitoring service
    monitoring.trackEvent(eventName, properties);

    // Console logging in development
    if (import.meta.env.DEV) {
      console.log(`Analytics Event: ${eventName}`, properties);
    }

    // Store locally for batch processing
    this.storeEventLocally(eventName, properties);
  }

  storeEventLocally(eventName, properties) {
    try {
      const eventData = {
        event: eventName,
        properties,
        timestamp: new Date().toISOString()
      };

      // Store in localStorage for persistence
      const existingEvents = JSON.parse(localStorage.getItem('fa_analytics_events') || '[]');
      existingEvents.push(eventData);

      // Keep only last 100 events to prevent storage bloat
      if (existingEvents.length > 100) {
        existingEvents.splice(0, existingEvents.length - 100);
      }

      localStorage.setItem('fa_analytics_events', JSON.stringify(existingEvents));
    } catch (error) {
      console.warn('Failed to store analytics event locally:', error);
    }
  }

  // ===== ANALYTICS DASHBOARD DATA =====
  getAnalyticsSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      sessionDuration: this.calculateSessionDuration(),
      pageViews: this.pageViews.length,
      interactions: this.interactions.length,
      featureUsage: Object.fromEntries(this.featureUsage),
      conversions: this.conversionEvents.length,
      abandonments: this.abandonedFlows.length,
      deviceInfo: this.getDeviceSummary(),
      journeySteps: this.userJourney.length
    };
  }

  calculateSessionDuration() {
    if (this.userJourney.length === 0) return 0;

    const startTime = new Date(this.userJourney[0].timestamp);
    const endTime =
      this.userJourney[this.userJourney.length - 1].step === 'session_end'
        ? new Date(this.userJourney[this.userJourney.length - 1].timestamp)
        : new Date();

    return Math.round((endTime - startTime) / 1000); // seconds
  }

  getDeviceSummary() {
    return {
      mobile: /Mobi|Android/i.test(navigator.userAgent),
      tablet: /Tablet|iPad/i.test(navigator.userAgent),
      desktop: !/Mobi|Android|Tablet|iPad/i.test(navigator.userAgent),
      browser: this.getBrowserName(),
      os: this.getOSName()
    };
  }

  getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  getOSName() {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // ===== BATCH PROCESSING =====
  flushAnalytics() {
    // Send any queued analytics data
    try {
      const queuedEvents = JSON.parse(localStorage.getItem('fa_analytics_events') || '[]');

      if (queuedEvents.length > 0) {
        console.log(`Flushing ${queuedEvents.length} queued analytics events`);

        // In a real implementation, this would send to your analytics backend
        // For now, we'll just clear the queue
        localStorage.removeItem('fa_analytics_events');
      }
    } catch (error) {
      console.warn('Failed to flush analytics:', error);
    }
  }

  // ===== EXPORT FUNCTIONS =====
  exportAnalyticsData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userProperties: this.userProperties,
      pageViews: this.pageViews,
      userJourney: this.userJourney,
      featureUsage: Object.fromEntries(this.featureUsage),
      interactions: this.interactions,
      conversionEvents: this.conversionEvents,
      abandonedFlows: this.abandonedFlows,
      summary: this.getAnalyticsSummary(),
      exportTimestamp: new Date().toISOString()
    };
  }

  // ===== CLEANUP =====
  resetSession() {
    this.sessionId = this.generateSessionId();
    this.pageViews = [];
    this.userJourney = [];
    this.interactions = [];
    this.conversionEvents = [];
    this.abandonedFlows = [];
    this.featureUsage.clear();

    console.log('Analytics session reset');
  }
}

// ===== PREDEFINED TRACKING FUNCTIONS =====

export const trackButtonClick = (buttonName, properties = {}) => {
  analytics.trackFeatureUsage('button_click', buttonName, properties);
};

export const trackFeatureAccess = (featureName, properties = {}) => {
  analytics.trackFeatureUsage(featureName, 'accessed', properties);
};

export const trackFormStart = (formName, properties = {}) => {
  analytics.trackUserJourney('form_start', { form_name: formName, ...properties });
};

export const trackFormComplete = (formName, properties = {}) => {
  analytics.trackUserJourney('form_complete', { form_name: formName, ...properties });
  analytics.trackConversion('form_completion', null, { form_name: formName, ...properties });
};

export const trackOnboardingStep = (step, properties = {}) => {
  analytics.trackUserJourney('onboarding_step', { step, ...properties });
};

export const trackSearchQuery = (query, resultsCount, properties = {}) => {
  analytics.trackEvent('search', {
    query,
    results_count: resultsCount,
    ...properties
  });
};

export const trackFileDownload = (fileName, fileType, properties = {}) => {
  analytics.trackEvent('file_download', {
    file_name: fileName,
    file_type: fileType,
    ...properties
  });
};

export const trackErrorBoundary = (error, errorInfo, properties = {}) => {
  analytics.trackEvent('error_boundary', {
    error_message: error.message,
    error_stack: error.stack,
    component_stack: errorInfo.componentStack,
    ...properties
  });
};

// ===== REACT HOOKS FOR ANALYTICS =====

export const useAnalytics = () => {
  return {
    trackEvent: (eventName, properties) => analytics.trackEvent(eventName, properties),
    trackFeatureUsage: (featureName, action, properties) =>
      analytics.trackFeatureUsage(featureName, action, properties),
    trackUserJourney: (step, properties) => analytics.trackUserJourney(step, properties),
    trackConversion: (conversionType, value, properties) =>
      analytics.trackConversion(conversionType, value, properties),
    identifyUser: (userId, properties) => analytics.identifyUser(userId, properties),
    getAnalyticsSummary: () => analytics.getAnalyticsSummary()
  };
};

// ===== ANALYTICS DASHBOARD COMPONENT =====

export const AnalyticsDashboard = ({ userId }) => {
  const [analyticsData, setAnalyticsData] = React.useState(null);

  React.useEffect(() => {
    if (userId) {
      analytics.identifyUser(userId);
    }
    setAnalyticsData(analytics.getAnalyticsSummary());
  }, [userId]);

  if (!analyticsData) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="analytics-dashboard p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Session Duration</h3>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(analyticsData.sessionDuration / 60)} min
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Page Views</h3>
          <p className="text-2xl font-bold text-green-600">{analyticsData.pageViews}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Interactions</h3>
          <p className="text-2xl font-bold text-purple-600">{analyticsData.interactions}</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800">Features Used</h3>
          <p className="text-2xl font-bold text-orange-600">
            {Object.keys(analyticsData.featureUsage).length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">User Journey</h3>
          <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
            {analyticsData.journeySteps > 0 ? (
              <div className="space-y-1">
                {analytics.userJourney.slice(-10).map((step, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {new Date(step.timestamp).toLocaleTimeString()} - {step.step}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No journey data available</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Device Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Device:</span>{' '}
                {analyticsData.deviceInfo.mobile
                  ? 'Mobile'
                  : analyticsData.deviceInfo.tablet
                    ? 'Tablet'
                    : 'Desktop'}
              </div>
              <div>
                <span className="font-medium">Browser:</span> {analyticsData.deviceInfo.browser}
              </div>
              <div>
                <span className="font-medium">OS:</span> {analyticsData.deviceInfo.os}
              </div>
              <div>
                <span className="font-medium">Session ID:</span>{' '}
                {analyticsData.sessionId?.substring(0, 12)}...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create singleton instance
const analytics = new AnalyticsService();

export default analytics;
