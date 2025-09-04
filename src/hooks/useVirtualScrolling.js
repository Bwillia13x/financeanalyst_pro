import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Virtual scrolling hook for large datasets
 * Renders only visible items to improve performance
 *
 * @param {Array} items - The full dataset
 * @param {number} itemHeight - Height of each item in pixels
 * @param {number} containerHeight - Height of the scrollable container
 * @param {number} overscan - Number of items to render outside visible area
 * @returns {Object} Virtual scrolling state and methods
 */
export const useVirtualScrolling = (
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      ...item,
      index: visibleRange.startIndex + index,
      style: {
        height: `${itemHeight}px`,
        transform: `translateY(${offsetY}px)`
      }
    }));
  }, [items, visibleRange, itemHeight, offsetY]);

  // Scroll handler
  const handleScroll = useCallback(event => {
    setScrollTop(event.target.scrollTop);
  }, []);

  // Jump to specific index
  const scrollToIndex = useCallback(
    index => {
      const targetScrollTop = Math.max(0, index * itemHeight);
      setScrollTop(targetScrollTop);

      // If we have a scroll container reference, scroll it
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = targetScrollTop;
      }
    },
    [itemHeight]
  );

  // Scroll to top
  const scrollToTop = useCallback(() => {
    setScrollTop(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    const maxScrollTop = Math.max(0, totalHeight - containerHeight);
    setScrollTop(maxScrollTop);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = maxScrollTop;
    }
  }, [totalHeight, containerHeight]);

  return {
    // State
    scrollTop,
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,

    // Methods
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,

    // Computed values
    isAtTop: scrollTop === 0,
    isAtBottom: scrollTop >= totalHeight - containerHeight,
    scrollProgress: totalHeight > 0 ? scrollTop / (totalHeight - containerHeight) : 0
  };
};

/**
 * Hook for managing scroll container reference
 * @returns {Object} Scroll container reference and utilities
 */
export const useScrollContainer = () => {
  const [scrollContainerRef, setScrollContainerRef] = useState(null);

  const setContainerRef = useCallback(element => {
    setScrollContainerRef(element);
  }, []);

  return {
    scrollContainerRef,
    setContainerRef
  };
};

/**
 * Hook for infinite scrolling with virtual scrolling
 * Loads more data as user scrolls near the bottom
 *
 * @param {Array} items - Current items
 * @param {Function} loadMore - Function to load more items
 * @param {Object} options - Configuration options
 * @returns {Object} Infinite scrolling state and methods
 */
export const useInfiniteVirtualScroll = (items = [], loadMore, options = {}) => {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
    threshold = 100, // Load more when within 100px of bottom
    hasNextPage = true,
    isLoading = false
  } = options;

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const virtualScroll = useVirtualScrolling(items, itemHeight, containerHeight, overscan);

  // Enhanced scroll handler with infinite loading
  const handleScroll = useCallback(
    event => {
      virtualScroll.handleScroll(event);

      if (!hasNextPage || isLoading || isLoadingMore) return;

      const { scrollTop, scrollHeight, clientHeight } = event.target;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < threshold) {
        setIsLoadingMore(true);
        loadMore().finally(() => setIsLoadingMore(false));
      }
    },
    [virtualScroll, hasNextPage, isLoading, isLoadingMore, loadMore, threshold]
  );

  return {
    ...virtualScroll,
    handleScroll,
    isLoadingMore,
    hasNextPage
  };
};

/**
 * Hook for optimizing re-renders in virtual lists
 * @param {Array} items - Items to optimize
 * @param {Function} getItemKey - Function to get unique key for each item
 * @returns {Object} Optimized items with stable references
 */
export const useOptimizedVirtualItems = (items, getItemKey) => {
  return useMemo(() => {
    return items.map((item, index) => ({
      ...item,
      _virtualKey: getItemKey ? getItemKey(item, index) : `item-${index}`,
      _originalIndex: index
    }));
  }, [items, getItemKey]);
};

/**
 * Performance monitoring for virtual scrolling
 * @returns {Object} Performance metrics
 */
export const useVirtualScrollPerformance = () => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalItems: 0,
    visibleItems: 0
  });

  const updateMetrics = useCallback(newMetrics => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics,
      renderCount: prev.renderCount + 1
    }));
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      totalItems: 0,
      visibleItems: 0
    });
  }, []);

  return {
    metrics,
    updateMetrics,
    resetMetrics
  };
};
