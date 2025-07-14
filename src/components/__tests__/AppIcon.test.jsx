// Tests for AppIcon component
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Icon from '../AppIcon';

describe('AppIcon', () => {
  it('should render a valid Lucide icon', () => {
    render(<Icon name="Home" />);

    // Check if the icon is rendered (Lucide icons have an SVG element)
    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });

  it('should render HelpCircle for invalid icon names', () => {
    render(<Icon name="InvalidIconName" />);

    // Should render the fallback HelpCircle icon
    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });

  it('should apply custom size prop', () => {
    render(<Icon name="Home" size={32} />);

    const iconElement = document.querySelector('svg');
    expect(iconElement).toHaveAttribute('width', '32');
    expect(iconElement).toHaveAttribute('height', '32');
  });

  it('should apply custom className', () => {
    render(<Icon name="Home" className="custom-class" />);

    const iconElement = document.querySelector('svg');
    expect(iconElement).toHaveClass('custom-class');
  });

  it('should apply custom color', () => {
    render(<Icon name="Home" color="red" />);

    const iconElement = document.querySelector('svg');
    expect(iconElement).toHaveAttribute('stroke', 'red');
  });

  it('should apply custom strokeWidth', () => {
    render(<Icon name="Home" strokeWidth={3} />);

    const iconElement = document.querySelector('svg');
    expect(iconElement).toHaveAttribute('stroke-width', '3');
  });

  it('should pass through additional props', () => {
    render(<Icon name="Home" data-testid="test-icon" />);

    const iconElement = screen.getByTestId('test-icon');
    expect(iconElement).toBeInTheDocument();
  });

  it('should use default props when not specified', () => {
    render(<Icon name="Home" />);

    const iconElement = document.querySelector('svg');
    expect(iconElement).toHaveAttribute('width', '24');
    expect(iconElement).toHaveAttribute('height', '24');
    expect(iconElement).toHaveAttribute('stroke', 'currentColor');
    expect(iconElement).toHaveAttribute('stroke-width', '2');
  });
});
