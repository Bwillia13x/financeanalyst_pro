import { useEffect, useCallback } from 'react';
import { 
  preloadCriticalComponents, 
  preloadAnalysisComponents, 
  preloadAdvancedTools, 
  preloadExportTools 
} from '../utils/lazyComponents';

/**
 * Intelligent preloading hook that predicts user intent
 * and preloads components accordingly for better performance
 */
export const usePreloader = () => {
  const preloadOnUserIntent = useCallback(() => {
    let mouseMovements = 0;
    let keystrokes = 0;
    let scrolls = 0;

    const trackActivity = () => {
      mouseMovements++;
      if (mouseMovements > 5) {
        preloadCriticalComponents();
      }
    };

    const trackKeystrokes = () => {
      keystrokes++;
      if (keystrokes > 3) {
        preloadAnalysisComponents();
      }
    };

    const trackScrolling = () => {
      scrolls++;
      if (scrolls > 2) {
        preloadAdvancedTools();
      }
    };

    // Preload on user activity indicators
    document.addEventListener('mousemove', trackActivity, { passive: true });
    document.addEventListener('keydown', trackKeystrokes, { passive: true });
    document.addEventListener('scroll', trackScrolling, { passive: true });

    return () => {
      document.removeEventListener('mousemove', trackActivity);
      document.removeEventListener('keydown', trackKeystrokes);
      document.removeEventListener('scroll', trackScrolling);
    };
  }, []);

  const preloadOnHover = useCallback((componentName) => {
    switch (componentName) {
      case 'export':
        preloadExportTools();
        break;
      case 'analysis':
        preloadAnalysisComponents();
        break;
      case 'advanced':
        preloadAdvancedTools();
        break;
      default:
        preloadCriticalComponents();
    }
  }, []);

  const preloadOnIdle = useCallback(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadCriticalComponents();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        preloadCriticalComponents();
      }, 2000);
    }
  }, []);

  useEffect(() => {
    // Set up intelligent preloading
    const cleanup = preloadOnUserIntent();
    
    // Preload during idle time
    preloadOnIdle();

    return cleanup;
  }, [preloadOnUserIntent, preloadOnIdle]);

  return {
    preloadOnHover,
    preloadCriticalComponents,
    preloadAnalysisComponents,
    preloadAdvancedTools,
    preloadExportTools
  };
};

/**
 * Hook for monitoring component load times
 */
export const useLoadTimeMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      
      // Only log significant load times in development
      if (import.meta.env.DEV && loadTime > 100) {
        console.log(`⏱️ ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
      
      // Track to analytics in production (but not during automated tests)
      if (import.meta.env.PROD && !navigator.webdriver) {
        // Send to monitoring service
        if (window.gtag) {
          window.gtag('event', 'component_load_time', {
            component_name: componentName,
            load_time: Math.round(loadTime),
            custom_parameter: loadTime > 1000 ? 'slow' : 'fast'
          });
        }
      }
    };
  }, [componentName]);
};

/**
 * Hook for optimizing images with lazy loading and progressive enhancement
 */
export const useImageOptimization = () => {
  const createOptimizedImageSrc = useCallback((src, { width, quality = 80, format = 'webp' } = {}) => {
    // If image is already optimized or external, return as-is
    if (src.includes('http') || src.includes('webp') || src.includes('avif')) {
      return src;
    }

    // Generate optimized image path based on vite image optimization
    const basePath = src.replace(/\.[^/.]+$/, '');
    const widthSuffix = width ? `_${width}w` : '';
    
    return `${basePath}${widthSuffix}.${format}`;
  }, []);

  const getImageSrcSet = useCallback((src, sizes = [320, 640, 768, 1024, 1280]) => {
    return sizes
      .map(size => `${createOptimizedImageSrc(src, { width: size })} ${size}w`)
      .join(', ');
  }, [createOptimizedImageSrc]);

  return {
    createOptimizedImageSrc,
    getImageSrcSet
  };
};
