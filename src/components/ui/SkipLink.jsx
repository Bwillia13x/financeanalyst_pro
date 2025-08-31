import React, { useEffect, useState } from 'react';

import { generateAriaId, ACCESSIBILITY } from '../../utils/accessibilityUtils';

const SkipLink = ({
  href = '#main-content',
  children = 'Skip to main content',
  className = '',
  variant = 'default',
  size = 'default',
  position = 'top-left'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [targetExists, setTargetExists] = useState(false);
  const skipLinkId = generateAriaId('skip-link');

  // Check if target element exists
  useEffect(() => {
    const checkTarget = () => {
      const targetElement = document.querySelector(href);
      setTargetExists(!!targetElement);
    };

    checkTarget();

    // Re-check when DOM changes
    const observer = new MutationObserver(checkTarget);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [href]);

  // Show skip link on first Tab press
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === ACCESSIBILITY.KEYS.TAB) {
        setIsVisible(true);
      }
    };

    const handleFocus = () => {
      setIsVisible(true);
    };

    const handleBlur = () => {
      // Hide after delay to allow for navigation
      setTimeout(() => setIsVisible(false), 3000);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Handle skip link activation
  const handleSkip = event => {
    event.preventDefault();

    const targetElement = document.querySelector(href);
    if (targetElement) {
      // Scroll to target
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Focus the target element
      setTimeout(() => {
        if (typeof targetElement.focus === 'function') {
          targetElement.focus();
          // Announce to screen readers
          if (targetElement.getAttribute('aria-label')) {
            announceToScreenReader(`Navigated to ${targetElement.getAttribute('aria-label')}`);
          }
        }
      }, 100);
    }
  };

  // Don't render if target doesn't exist
  if (!targetExists) {
    return null;
  }

  // ===== POSITION CLASSES =====
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // ===== SIZE CLASSES =====
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // ===== VARIANT CLASSES =====
  const variantClasses = {
    default: `
      bg-brand-primary text-foreground-inverse
      hover:bg-brand-secondary focus:bg-brand-secondary
      border border-brand-primary/20
    `,
    secondary: `
      bg-background-secondary text-foreground
      hover:bg-background-tertiary focus:bg-background-tertiary
      border border-border
    `,
    minimal: `
      bg-transparent text-brand-accent
      hover:bg-brand-accent/10 focus:bg-brand-accent/10
      border border-brand-accent/30
    `,
    outline: `
      bg-background text-brand-accent
      hover:bg-brand-accent/5 focus:bg-brand-accent/5
      border-2 border-brand-accent
    `
  };

  return (
    <a
      id={skipLinkId}
      href={href}
      onClick={handleSkip}
      className={`
        fixed z-[9999] rounded-lg font-medium shadow-lg
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-background
        transform
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-2 opacity-0 scale-95'}
        ${positionClasses[position]}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={`Skip navigation and go to ${children.toLowerCase()}`}
      role="navigation"
    >
      {/* Skip icon */}
      <svg
        className="inline-block w-4 h-4 mr-2 -mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>

      {/* Skip text */}
      <span>{children}</span>

      {/* Keyboard shortcut hint */}
      <span className="ml-2 text-xs opacity-75" aria-label="keyboard shortcut">
        (Tab)
      </span>
    </a>
  );
};

// ===== MULTIPLE SKIP LINKS COMPONENT =====
export const SkipLinks = ({ links = [] }) => {
  const defaultLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#search', label: 'Skip to search' }
  ];

  const allLinks = links.length > 0 ? links : defaultLinks;

  return (
    <>
      {allLinks.map((link, index) => (
        <SkipLink
          key={link.href}
          href={link.href}
          position={index === 0 ? 'top-left' : index === 1 ? 'top-right' : 'bottom-left'}
          variant={index === 0 ? 'default' : 'secondary'}
        >
          {link.label}
        </SkipLink>
      ))}
    </>
  );
};

// ===== ANNOUNCEMENT UTILITY =====
function announceToScreenReader(message) {
  // Create or reuse announcement element
  let announcement = document.getElementById('sr-announcements');

  if (!announcement) {
    announcement = document.createElement('div');
    announcement.id = 'sr-announcements';
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    document.body.appendChild(announcement);
  }

  announcement.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    if (announcement) {
      announcement.textContent = '';
    }
  }, 1000);
}

export default SkipLink;
