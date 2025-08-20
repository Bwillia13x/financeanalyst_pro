import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for managing focus in financial applications
 * Handles focus trapping, restoration, and keyboard navigation
 */
export const useFocusManagement = (options = {}) => {
  const {
    trapFocus = false,
    restoreFocus = true,
    initialFocus = null,
    onEscape = null
  } = options;

  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Store the previously focused element when component mounts
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement;
    }

    return () => {
      // Restore focus when component unmounts
      if (restoreFocus && previousActiveElement.current?.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus]);

  // Set initial focus
  useEffect(() => {
    if (initialFocus) {
      const element = typeof initialFocus === 'string'
        ? document.querySelector(initialFocus)
        : initialFocus.current;

      if (element?.focus) {
        setTimeout(() => element.focus(), 0);
      }
    }
  }, [initialFocus]);

  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container = containerRef.current) => {
    if (!container) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      'details summary',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        return element.offsetWidth > 0 &&
               element.offsetHeight > 0 &&
               getComputedStyle(element).visibility !== 'hidden';
      });
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    const { key, shiftKey } = event;

    // Handle Escape key
    if (key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    // Handle Tab for focus trapping
    if (key === 'Tab' && trapFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    // Handle arrow keys for financial data tables
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      handleArrowKeyNavigation(event);
    }
  }, [trapFocus, onEscape, getFocusableElements]);

  // Enhanced arrow key navigation for financial tables
  const handleArrowKeyNavigation = useCallback((event) => {
    const { key, target } = event;
    const isInTable = target.closest('table');

    if (!isInTable) return;

    const cell = target.closest('td, th');
    if (!cell) return;

    event.preventDefault();

    let nextCell = null;

    switch (key) {
      case 'ArrowRight':
        nextCell = cell.nextElementSibling;
        break;
      case 'ArrowLeft':
        nextCell = cell.previousElementSibling;
        break;
      case 'ArrowDown': {
        const rowIndex = cell.parentElement.rowIndex;
        const cellIndex = cell.cellIndex;
        const nextRow = isInTable.rows[rowIndex + 1];
        nextCell = nextRow?.cells[cellIndex];
        break;
      }
      case 'ArrowUp': {
        const currentRowIndex = cell.parentElement.rowIndex;
        const currentCellIndex = cell.cellIndex;
        const prevRow = isInTable.rows[currentRowIndex - 1];
        nextCell = prevRow?.cells[currentCellIndex];
        break;
      }
    }

    if (nextCell) {
      const focusableInCell = nextCell.querySelector('button, input, select, textarea, a');
      (focusableInCell || nextCell).focus();
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (trapFocus && containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);

      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [trapFocus, handleKeyDown]);

  // Focus first element in container
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  // Focus last element in container
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements,
    handleKeyDown
  };
};

/**
 * Hook for managing modal focus
 */
export const useModalFocus = (isOpen) => {
  return useFocusManagement({
    trapFocus: isOpen,
    restoreFocus: true,
    onEscape: null // Should be handled by modal component
  });
};

/**
 * Hook for managing dropdown/combobox focus
 */
export const useDropdownFocus = (isOpen, onClose) => {
  return useFocusManagement({
    trapFocus: isOpen,
    restoreFocus: false,
    onEscape: onClose
  });
};
