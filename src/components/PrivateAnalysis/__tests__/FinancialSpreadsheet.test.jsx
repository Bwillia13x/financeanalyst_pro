import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import FinancialSpreadsheet from '../FinancialSpreadsheet';

const mockData = {
  periods: ['Current Year', 'Year 1'],
  statements: {
    incomeStatement: {
      energyDevices: { 0: 100, 1: 110 }
    }
  }
};

describe('FinancialSpreadsheet', () => {
  test('renders the component with initial data', () => {
    render(<FinancialSpreadsheet data={mockData} onDataChange={() => {}} />);
    expect(screen.getByText('Financial Statements')).toBeInTheDocument();
    expect(screen.getByText('Energy Devices')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  test('allows editing a cell', () => {
    const onDataChange = vi.fn();
    render(<FinancialSpreadsheet data={mockData} onDataChange={onDataChange} />);

    // Find the cell by its display value and click it
    const cell = screen.getByDisplayValue('100');
    fireEvent.click(cell);

    // Change the value and blur to save
    fireEvent.change(cell, { target: { value: '120' } });
    fireEvent.blur(cell);

    expect(onDataChange).toHaveBeenCalled();
  });

  test('adds a new period', () => {
    window.prompt = vi.fn(() => 'Year 2');
    const onDataChange = vi.fn();
    render(<FinancialSpreadsheet data={mockData} onDataChange={onDataChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Period' }));
    expect(onDataChange).toHaveBeenCalledWith({
      ...mockData,
      periods: ['Current Year', 'Year 1', 'Year 2']
    });
  });

  test('toggles a section', () => {
    render(<FinancialSpreadsheet data={mockData} onDataChange={() => {}} />);
    expect(screen.getByText('Energy Devices')).toBeInTheDocument();
    // Find the Revenue section button and click to collapse
    const revenueButton = screen.getByText('Revenue');
    fireEvent.click(revenueButton);
    expect(screen.queryByText('Energy Devices')).not.toBeInTheDocument();
  });
});
