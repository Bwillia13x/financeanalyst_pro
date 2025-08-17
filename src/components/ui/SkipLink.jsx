import React from 'react';

const SkipLink = ({ href = '#main-content', children = 'Skip to main content' }) => {
  return (
    <a
      href={href}
      className="
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
        bg-primary text-primary-foreground px-4 py-2 rounded-md z-[9999]
        font-medium shadow-lg transition-all duration-200
        focus:outline-2 focus:outline-blue-500 focus:outline-offset-2
      "
    >
      {children}
    </a>
  );
};

export default SkipLink;
