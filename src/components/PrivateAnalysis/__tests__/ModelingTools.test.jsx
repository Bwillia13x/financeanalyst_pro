import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ModelingTools from '../ModelingTools';

const mockData = {
  periods: ['Current Year', 'Year 1', 'Year 2'],
  statements: {
    incomeStatement: {
      totalRevenue: { 0: 1000, 1: 1100, 2: 1210 },
      totalCOGS: { 0: 400, 1: 440, 2: 484 },
      operatingIncome: { 0: 200, 1: 220, 2: 242 },
    },
  },
};

describe('ModelingTools', () => {
  test('renders the component with the DCF model active by default', () => {
    render(<ModelingTools data={mockData} onDataChange={() => {}} />);
    expect(screen.getByText('Financial Modeling Tools')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DCF Valuation/ })).toHaveClass('border-blue-500');
  });

  test('switches to a different model when clicked', () => {
    render(<ModelingTools data={mockData} onDataChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Ratio Analysis/ }));
    expect(screen.getByRole('button', { name: /Ratio Analysis/ })).toHaveClass('border-blue-500');
    expect(screen.getByRole('button', { name: /DCF Valuation/ })).not.toHaveClass('border-blue-500');
  });

  test('updates model inputs', () => {
    render(<ModelingTools data={mockData} onDataChange={() => {}} />);
    const discountRateInput = screen.getByDisplayValue('10');
    fireEvent.change(discountRateInput, { target: { value: '12' } });
    expect(discountRateInput.value).toBe('12');
  });

  test('calculates DCF correctly', () => {
    render(<ModelingTools data={mockData} onDataChange={() => {}} />);
    // Note: This is a simplified test. A more robust test would check the actual calculated values.
    const enterpriseValueElement = screen.getByText('Enterprise Value').parentElement;
    expect(enterpriseValueElement).toHaveTextContent('$1,840,195');
  });
});
