import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import FinancialInput from '../FinancialInput';

describe('FinancialInput', () => {
  it('renders with default props', () => {
    render(<FinancialInput />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<FinancialInput label="Test Label" />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<FinancialInput label="Test Label" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('formats currency values correctly', async() => {
    const mockOnChange = vi.fn();
    render(
      <FinancialInput
        value={1234.56}
        onChange={mockOnChange}
        type="currency"
        currency="USD"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input.value).toBe('$1,234.56');
  });

  it('handles focus and blur correctly', async() => {
    const mockOnChange = vi.fn();
    render(
      <FinancialInput
        value={1000}
        onChange={mockOnChange}
        type="currency"
      />
    );

    const input = screen.getByRole('textbox');

    // Focus should show raw value
    fireEvent.focus(input);
    await waitFor(() => {
      expect(input.value).toBe('1000');
    });

    // Blur should format value
    fireEvent.blur(input);
    await waitFor(() => {
      expect(input.value).toBe('$1,000.00');
    });
  });

  it('validates negative values when not allowed', async() => {
    const mockOnValidation = vi.fn();
    render(
      <FinancialInput
        allowNegative={false}
        onValidation={mockOnValidation}
        value={-100}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '-100' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnValidation).toHaveBeenCalledWith(false, 'Negative values are not allowed');
    });
  });

  it('handles percentage type correctly', () => {
    render(
      <FinancialInput
        value={25}
        type="percentage"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input.value).toBe('25.00%');
  });

  it('shows error message when provided', () => {
    render(<FinancialInput error="This is an error" />);
    expect(screen.getByText('This is an error')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<FinancialInput loading />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('calls onChange with parsed value', async() => {
    const mockOnChange = vi.fn();
    render(
      <FinancialInput
        onChange={mockOnChange}
        type="currency"
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '1500' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(1500);
    });
  });

  it('validates min and max values', async() => {
    const mockOnValidation = vi.fn();
    render(
      <FinancialInput
        min={0}
        max={1000}
        value={1500}
        onValidation={mockOnValidation}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockOnValidation).toHaveBeenCalledWith(false, expect.stringContaining('must not exceed'));
    });
  });
});
