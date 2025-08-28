import { forwardRef, useState, useRef, useEffect } from 'react';

// Optimized Image component with modern format support and lazy loading
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  sizes = '100vw',
  priority = false,
  placeholder = 'blur',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate source sets for different formats
  const generateSrcSet = (baseSrc, format) => {
    if (!baseSrc) return '';

    const baseName = baseSrc.split('.').slice(0, -1).join('.');
    const sizes = [320, 640, 768, 1024, 1280, 1920];

    return sizes.map(size => `${baseName}-${size}w.${format} ${size}w`).join(', ');
  };

  // Get WebP and AVIF versions if available
  const webpSrcSet = generateSrcSet(src, 'webp');
  const avifSrcSet = generateSrcSet(src, 'avif');
  const jpegSrcSet = generateSrcSet(src, 'jpg');

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  const handleLoad = event => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError = event => {
    setHasError(true);
    onError?.(event);
  };

  // Placeholder while loading
  const renderPlaceholder = () => {
    if (placeholder === 'blur') {
      return (
        <div
          className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse ${className}`}
          style={{ width, height }}
        />
      );
    }

    if (placeholder === 'skeleton') {
      return (
        <div className={`absolute inset-0 bg-gray-200 ${className}`} style={{ width, height }}>
          <div className="animate-pulse h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
        </div>
      );
    }

    return null;
  };

  // Error fallback
  const renderError = () => (
    <div
      className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
      style={{ width, height }}
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );

  if (hasError) {
    return renderError();
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!isLoaded && renderPlaceholder()}

      {isInView && (
        <picture>
          {/* AVIF format for modern browsers */}
          {avifSrcSet && <source srcSet={avifSrcSet} sizes={sizes} type="image/avif" />}

          {/* WebP format for better compression */}
          {webpSrcSet && <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />}

          {/* JPEG fallback */}
          {jpegSrcSet && <source srcSet={jpegSrcSet} sizes={sizes} type="image/jpeg" />}

          {/* Final fallback */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={`
              transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
              ${className}
            `}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </picture>
      )}
    </div>
  );
};

// Higher-order component for automatic optimization
export const withImageOptimization = WrappedComponent => {
  const OptimizedComponent = forwardRef((props, ref) => {
    // Automatically optimize image props
    const optimizedProps = {
      ...props,
      loading: props.priority ? 'eager' : 'lazy',
      decoding: 'async'
    };

    return <WrappedComponent ref={ref} {...optimizedProps} />;
  });

  OptimizedComponent.displayName = `withImageOptimization(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return OptimizedComponent;
};

// Hook for responsive image sizes
export const useResponsiveImage = (breakpoints = {}) => {
  const defaultBreakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1920
  };

  const allBreakpoints = { ...defaultBreakpoints, ...breakpoints };

  const generateSizes = sizeMap => {
    return Object.entries(allBreakpoints)
      .sort(([, a], [, b]) => b - a) // Sort by width descending
      .map(([breakpoint, width]) => {
        const size = sizeMap[breakpoint] || sizeMap.default || '100vw';
        return `(min-width: ${width}px) ${size}`;
      })
      .join(', ');
  };

  return { generateSizes };
};

// Utility for generating optimized image URLs
export const getOptimizedImageUrl = (src, options = {}) => {
  const { width, height, quality = 80, format = 'auto', fit = 'cover' } = options;

  // In production, this would integrate with your image optimization service
  // For now, return the original URL with query parameters
  const params = new URLSearchParams();

  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality !== 80) params.set('q', quality.toString());
  if (format !== 'auto') params.set('f', format);
  if (fit !== 'cover') params.set('fit', fit);

  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
};

// Image preloading utility
export const preloadImage = (src, options = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;

    // Set up responsive preloading
    if (options.srcSet) {
      img.srcset = options.srcSet;
    }
    if (options.sizes) {
      img.sizes = options.sizes;
    }

    img.src = src;
  });
};

// Critical image preloader for above-the-fold content
export const preloadCriticalImages = imageList => {
  const preloadPromises = imageList.map(imageConfig => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = imageConfig.src;

    if (imageConfig.srcSet) {
      link.setAttribute('imagesrcset', imageConfig.srcSet);
    }
    if (imageConfig.sizes) {
      link.setAttribute('imagesizes', imageConfig.sizes);
    }

    document.head.appendChild(link);

    return preloadImage(imageConfig.src, imageConfig);
  });

  return Promise.allSettled(preloadPromises);
};

export default OptimizedImage;
