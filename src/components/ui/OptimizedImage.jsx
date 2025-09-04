import React, { useState, useCallback, useEffect, useRef } from 'react';

import { cn } from '../../utils/cn';

/**
 * Optimized Image Component with lazy loading, responsive images, and performance optimizations
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Responsive images with srcset
 * - WebP/AVIF format support
 * - Blur placeholder while loading
 * - Error handling with fallback
 * - Performance monitoring
 */
const OptimizedImage = React.forwardRef(
  (
    {
      src,
      alt = '',
      className = '',
      width,
      height,
      sizes = '100vw',
      loading = 'lazy',
      quality = 80,
      placeholder = 'blur',
      blurDataURL,
      onLoad,
      onError,
      priority = false,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(!loading || loading === 'eager');
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState('');
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    // Generate responsive image sources
    const generateSources = useCallback(() => {
      if (!src) return [];

      const sources = [];
      const baseSrc = src.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');

      // Modern formats (AVIF, WebP)
      const modernFormats = ['avif', 'webp'];

      modernFormats.forEach(format => {
        const formatSrc = `${baseSrc}.${format}`;

        // Generate responsive sizes
        const responsiveSizes = [
          { width: 320, suffix: '_320' },
          { width: 640, suffix: '_640' },
          { width: 768, suffix: '_768' },
          { width: 1024, suffix: '_1024' },
          { width: 1280, suffix: '_1280' },
          { width: 1920, suffix: '_1920' }
        ];

        const srcset = responsiveSizes
          .map(({ width: w, suffix }) => `${baseSrc}${suffix}.${format} ${w}w`)
          .join(', ');

        sources.push({
          type: `image/${format}`,
          srcset,
          sizes
        });
      });

      // Fallback to original format
      const fallbackSrcset = [
        `${baseSrc}_320.${src.split('.').pop()} 320w`,
        `${baseSrc}_640.${src.split('.').pop()} 640w`,
        `${baseSrc}_768.${src.split('.').pop()} 768w`,
        `${baseSrc}_1024.${src.split('.').pop()} 1024w`,
        `${baseSrc}_1280.${src.split('.').pop()} 1280w`,
        `${src} 1920w`
      ].join(', ');

      sources.push({
        srcset: fallbackSrcset,
        sizes
      });

      return sources;
    }, [src, sizes]);

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (priority || loading === 'eager' || !imgRef.current) return;

      observerRef.current = new IntersectionObserver(
        entries => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        },
        {
          rootMargin: '50px', // Start loading 50px before entering viewport
          threshold: 0.1
        }
      );

      observerRef.current.observe(imgRef.current);

      return () => {
        observerRef.current?.disconnect();
      };
    }, [priority, loading]);

    // Handle image load
    const handleLoad = useCallback(
      event => {
        setIsLoaded(true);
        setCurrentSrc(event.target.currentSrc);

        // Performance monitoring
        if (window.performance && window.performance.mark) {
          window.performance.mark(`image-loaded-${src}`);
        }

        onLoad?.(event);
      },
      [src, onLoad]
    );

    // Handle image error
    const handleError = useCallback(
      event => {
        setHasError(true);
        console.warn(`Failed to load image: ${src}`);

        onError?.(event);
      },
      [src, onError]
    );

    // Generate blur placeholder
    const generateBlurPlaceholder = useCallback(() => {
      if (blurDataURL) return blurDataURL;

      // Generate a simple blur placeholder based on dimensions
      const canvas = document.createElement('canvas');
      canvas.width = width || 16;
      canvas.height = height || 9;

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/jpeg', 0.1);
    }, [width, height, blurDataURL]);

    const sources = generateSources();

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        style={{ width, height }}
      >
        {/* Blur placeholder */}
        {placeholder === 'blur' && !isLoaded && (
          <img
            src={generateBlurPlaceholder()}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
            aria-hidden="true"
          />
        )}

        {/* Loading skeleton */}
        {!isLoaded && !hasError && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}

        {/* Main image */}
        {(isInView || priority) && (
          <picture ref={imgRef}>
            {/* Modern format sources */}
            {sources.slice(0, -1).map((source, index) => (
              <source key={index} type={source.type} srcSet={source.srcset} sizes={source.sizes} />
            ))}

            {/* Fallback source */}
            {sources.length > 0 && (
              <source
                srcSet={sources[sources.length - 1].srcset}
                sizes={sources[sources.length - 1].sizes}
              />
            )}

            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading={loading}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0',
                hasError && 'opacity-50'
              )}
              {...props}
            />
          </picture>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
