// Performance optimization utilities

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical CSS
  const criticalStyles = document.createElement('link');
  criticalStyles.rel = 'preload';
  criticalStyles.as = 'style';
  criticalStyles.href = '/assets/critical.css';
  document.head.appendChild(criticalStyles);

  // Preload essential fonts with proper CORS
  const fontPreloads = ['/assets/fonts/inter-var.woff2', '/assets/fonts/fira-code.woff2'];

  fontPreloads.forEach(fontUrl => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = fontUrl;
    document.head.appendChild(link);
  });
};

// Optimize image loading with intersection observer
export const createImageObserver = callback => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }
  return null;
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  if ('performance' in window && 'mark' in performance) {
    try {
      performance.mark(`${name}-start`);
      const result = fn();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      return result;
    } catch (_error) {
      // Fallback if performance API fails
      return fn();
    }
  }
  return fn();
};

// Bundle size optimization - dynamic imports
export const loadChartLibrary = () => import('recharts');
export const loadD3Library = () => import('d3');
export const loadAnimationLibrary = () => import('framer-motion');

// Resource hints for better loading
export const addResourceHints = () => {
  // DNS prefetch for external domains
  const domains = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });

  // Preconnect to critical third parties
  const preconnectDomains = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addResourceHints();
      preloadCriticalResources();
    });
  } else {
    addResourceHints();
    preloadCriticalResources();
  }
};
