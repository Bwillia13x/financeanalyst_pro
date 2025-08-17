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
    expect(screen.getByText('Financial Spreadsheet')).toBeInTheDocument();
    expect(screen.getByText('Energy Devices')).toBeInTheDocument();
    expect(screen.getByText('100.00')).toBeInTheDocument();
  });

  test('allows editing a cell', () => {
    const onDataChange = vi.fn();
    render(<FinancialSpreadsheet data={mockData} onDataChange={onDataChange} />);

    const cell = screen.getByText('100.00');
    fireEvent.click(cell);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '120' } });
    fireEvent.blur(input);

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
    fireEvent.click(screen.getByRole('button', { name: /Revenue/ }));
    expect(screen.queryByText('Energy Devices')).not.toBeInTheDocument();
  });

  test('shows adjusted value seeded from latest period', () => {
    const onAdjustedValuesChange = vi.fn();
    render(
      <FinancialSpreadsheet
        data={mockData}
        onDataChange={() => {}}
        onAdjustedValuesChange={onAdjustedValuesChange}
      />
    );
    const adjustedCell = screen.getByTestId('adjusted-cell-energyDevices');
    expect(adjustedCell).toHaveTextContent('110.00');
  });

  test('allows editing adjusted value and calls onAdjustedValuesChange', () => {
    const onAdjustedValuesChange = vi.fn();
    render(
      <FinancialSpreadsheet
        data={mockData}
        onDataChange={() => {}}
        onAdjustedValuesChange={onAdjustedValuesChange}
      />
    );

    // Open adjusted input
    fireEvent.click(screen.getByTestId('adjusted-cell-energyDevices'));
    const input = screen.getByTestId('adjusted-input-energyDevices');
    fireEvent.change(input, { target: { value: '120' } });
    fireEvent.blur(input);

    // Called at least once (initial seeding), and last call should have updated value
    expect(onAdjustedValuesChange).toHaveBeenCalled();
    const lastCallArgs = onAdjustedValuesChange.mock.calls[onAdjustedValuesChange.mock.calls.length - 1][0];
    expect(lastCallArgs.energyDevices).toBe(120);
  });
});
