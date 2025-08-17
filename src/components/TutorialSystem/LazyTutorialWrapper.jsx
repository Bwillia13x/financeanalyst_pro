/**
 * Lazy Tutorial Wrapper
 * Optimizes tutorial content loading with progressive enhancement
 */

import { BookOpen, Loader } from 'lucide-react';
import React, { useState, useEffect } from 'react';

// Lazy load the heavy tutorial component
const InteractiveTutorial = React.lazy(() => import('./InteractiveTutorial'));

/**
 * Tutorial content loader with priority system
 */
const tutorialContentLoader = {
  cache: new Map(),

  async loadTutorialContent(tutorialId, priority = 'normal') {
    if (this.cache.has(tutorialId)) {
      return this.cache.get(tutorialId);
    }

    // Simulate progressive loading based on priority
    const delay = priority === 'high' ? 100 : priority === 'normal' ? 300 : 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Load tutorial content (would typically be from API/CMS)
    const content = await this.fetchTutorialContent(tutorialId);
    this.cache.set(tutorialId, content);

    return content;
  },

  async fetchTutorialContent(tutorialId) {
    // Mock tutorial content - would typically fetch from API
    const tutorials = {
      'dcf-basics': {
        title: 'DCF Valuation Fundamentals',
        steps: [
          { id: 1, title: 'Revenue Projections', content: 'Learn to project future revenues...' },
          { id: 2, title: 'Cash Flow Analysis', content: 'Convert revenues to free cash flows...' },
          { id: 3, title: 'Discount Rate Calculation', content: 'Determine appropriate discount rates...' }
        ]
      },
      'lbo-modeling': {
        title: 'LBO Model Construction',
        steps: [
          { id: 1, title: 'Deal Structure', content: 'Understanding LBO transaction structure...' },
          { id: 2, title: 'Debt Capacity', content: 'Analyzing debt capacity and leverage...' },
          { id: 3, title: 'Returns Analysis', content: 'Calculating IRR and money multiples...' }
        ]
      }
    };

    return tutorials[tutorialId] || { title: 'Tutorial Not Found', steps: [] };
  }
};

/**
 * Lightweight tutorial preview component
 */
const TutorialPreview = ({ tutorialId, onStartTutorial, isLoading }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="text-sm font-medium text-gray-900">Interactive Tutorial Available</h3>
          <p className="text-xs text-gray-600">Learn this feature step-by-step</p>
        </div>
      </div>
      <button
        onClick={onStartTutorial}
        disabled={isLoading}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader className="w-3 h-3 mr-1 animate-spin" />
            Loading...
          </>
        ) : (
          'Start Tutorial'
        )}
      </button>
    </div>
  </div>
);

/**
 * Main LazyTutorialWrapper component
 */
const LazyTutorialWrapper = ({
  tutorialId,
  children,
  priority = 'normal',
  autoStart = false,
  showPreview = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(autoStart);
  const [tutorialContent, setTutorialContent] = useState(null);
  const [error, setError] = useState(null);

  // Preload tutorial content in the background
  useEffect(() => {
    if (priority === 'high') {
      preloadTutorial();
    }
  }, [tutorialId, priority]);

  const preloadTutorial = async() => {
    try {
      const content = await tutorialContentLoader.loadTutorialContent(tutorialId, priority);
      setTutorialContent(content);
    } catch (err) {
      console.warn('Failed to preload tutorial:', err);
    }
  };

  const startTutorial = async() => {
    setIsLoading(true);
    setError(null);

    try {
      if (!tutorialContent) {
        const content = await tutorialContentLoader.loadTutorialContent(tutorialId, 'high');
        setTutorialContent(content);
      }
      setShowTutorial(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  return (
    <div className="relative">
      {/* Tutorial preview banner */}
      {showPreview && !showTutorial && (
        <TutorialPreview
          tutorialId={tutorialId}
          onStartTutorial={startTutorial}
          isLoading={isLoading}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-600">Failed to load tutorial: {error}</p>
        </div>
      )}

      {/* Main content */}
      {children}

      {/* Lazy-loaded tutorial modal */}
      {showTutorial && (
        <React.Suspense
          fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Loading tutorial...</span>
                </div>
              </div>
            </div>
          }
        >
          <InteractiveTutorial
            tutorialContent={tutorialContent}
            onClose={closeTutorial}
            isOpen={showTutorial}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default LazyTutorialWrapper;

/**
 * HOC for wrapping components with tutorial functionality
 */
export const withTutorial = (WrappedComponent, tutorialConfig = {}) => {
  return function TutorialEnhancedComponent(props) {
    return (
      <LazyTutorialWrapper
        tutorialId={tutorialConfig.tutorialId}
        priority={tutorialConfig.priority || 'normal'}
        showPreview={tutorialConfig.showPreview !== false}
      >
        <WrappedComponent {...props} />
      </LazyTutorialWrapper>
    );
  };
};
