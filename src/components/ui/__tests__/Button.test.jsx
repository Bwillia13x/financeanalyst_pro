// Tests for Button component
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Button from '../Button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);

    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled button
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled button/i });
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Button</Button>);

    const button = screen.getByRole('button', { name: /button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('should render with icon when iconName is provided', () => {
    render(<Button iconName="Home">Button with icon</Button>);

    const button = screen.getByRole('button', { name: /button with icon/i });
    expect(button).toBeInTheDocument();

    // Check if icon is rendered (should have an SVG element)
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render as full width when fullWidth prop is true', () => {
    render(<Button fullWidth>Full width button</Button>);

    const button = screen.getByRole('button', { name: /full width button/i });
    expect(button).toHaveClass('w-full');
  });

  it('should apply different variants correctly', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    let button = screen.getByRole('button', { name: /default/i });
    expect(button).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-secondary');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveClass('border');

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button', { name: /ghost/i });
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('should apply different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('h-9');

    rerender(<Button size="default">Default</Button>);
    button = screen.getByRole('button', { name: /default/i });
    expect(button).toHaveClass('h-10');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('h-11');
  });

  it('should pass through additional props', () => {
    render(
      <Button data-testid="test-button" type="submit">
        Submit
      </Button>
    );

    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should show loading state when loading prop is true', () => {
    render(<Button loading>Loading button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    // Should show loading spinner
    const spinner = button.querySelector('[data-loading="true"]');
    expect(spinner).toBeInTheDocument();
  });
});
