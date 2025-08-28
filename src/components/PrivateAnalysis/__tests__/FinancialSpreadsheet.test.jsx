import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi, describe, test, expect, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock icons to avoid heavy SVG/forwardRef behaviors
vi.mock('lucide-react', () => ({
  Plus: props => React.createElement('svg', { 'data-icon': 'Plus', ...props }),
  ChevronDown: props => React.createElement('svg', { 'data-icon': 'ChevronDown', ...props }),
  ChevronRight: props => React.createElement('svg', { 'data-icon': 'ChevronRight', ...props }),
  Calculator: props => React.createElement('svg', { 'data-icon': 'Calculator', ...props }),
  FileText: props => React.createElement('svg', { 'data-icon': 'FileText', ...props }),
  TrendingUp: props => React.createElement('svg', { 'data-icon': 'TrendingUp', ...props }),
  Edit2: props => React.createElement('svg', { 'data-icon': 'Edit2', ...props })
}));

// Mock accessibility hook to avoid timers/effects in tests
vi.mock('../../../hooks/useAccessibility', () => ({
  useFinancialAccessibility: () => ({
    elementRef: { current: null },
    testFinancialFeatures: vi.fn()
  })
}));

// Common DOM polyfills that some components rely on
beforeAll(() => {
  if (!globalThis.matchMedia) {
    // @ts-ignore
    globalThis.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  }

  if (!('ResizeObserver' in globalThis)) {
    // @ts-ignore
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (!('IntersectionObserver' in globalThis)) {
    // @ts-ignore
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = '';
      thresholds = [];
    };
  }

  if (!globalThis.requestAnimationFrame) {
    // @ts-ignore
    globalThis.requestAnimationFrame = cb => setTimeout(cb, 0);
  }

  if (!Element.prototype.scrollIntoView) {
    // @ts-ignore
    Element.prototype.scrollIntoView = vi.fn();
  }
});

// Import after mocks so they take effect for module evaluation
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
  test('renders with initial data', () => {
    render(<FinancialSpreadsheet data={mockData} onDataChange={() => {}} />);
    expect(screen.getByRole('heading', { name: /Financial Statements/i })).toBeInTheDocument();
    expect(screen.getByText('Energy Devices')).toBeInTheDocument();
    // Values under 1000 are formatted to 2 decimals in display
    expect(screen.getByText('100.00')).toBeInTheDocument();
  });

  test('adds a new period', async () => {
    window.prompt = vi.fn(() => 'Year 2');
    const onDataChange = vi.fn();
    render(<FinancialSpreadsheet data={mockData} onDataChange={onDataChange} />);

    await userEvent.click(screen.getByRole('button', { name: /Add Period/i }));
    expect(onDataChange).toHaveBeenCalledWith({
      ...mockData,
      periods: ['Current Year', 'Year 1', 'Year 2']
    });
  });
});
