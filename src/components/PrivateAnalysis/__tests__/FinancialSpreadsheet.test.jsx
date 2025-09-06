import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi, describe, test, expect, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
// userEvent not required here; using fireEvent for synchronous click

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

// Mock accessibility hook to avoid timers/effects in tests (use alias for reliability)
vi.mock('@/hooks/useAccessibility', () => ({
  useFinancialAccessibility: () => ({
    elementRef: { current: null },
    testFinancialFeatures: vi.fn()
  })
}));

// Also mock the component's relative import path (from component and from test)
vi.mock('../../hooks/useAccessibility', () => ({
  useFinancialAccessibility: () => ({
    elementRef: { current: null },
    testFinancialFeatures: vi.fn()
  })
}));
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
    // Values under 1000 are formatted to 2 decimals in display (may appear in multiple cells)
    expect(screen.getAllByText('100.00').length).toBeGreaterThan(0);
  });

  test('Adjusted column shows computed values for formula rows (Balance Sheet)', () => {
    const data = {
      periods: ['Current Year'],
      statements: {
        balanceSheet: {
          cash: { 0: 100 },
          receivables: { 0: 50 },
          ppe: { 0: 200 },
          accumulatedDepreciation: { 0: 50 },
          accountsPayable: { 0: 30 },
          accruedExpenses: { 0: 40 },
          longTermDebt: { 0: 30 },
          commonStock: { 0: 100 },
          retainedEarnings: { 0: 100 }
        }
      }
    };

    render(
      <FinancialSpreadsheet
        data={data}
        onDataChange={() => {}}
        initialActiveStatement="balanceSheet"
      />
    );

    const taAdjusted = screen.getByTestId('cell-balanceSheet-totalAssets-adjusted');
    expect(taAdjusted).toHaveTextContent('300');
    const tleAdjusted = screen.getByTestId('cell-balanceSheet-totalLiabilitiesEquity-adjusted');
    expect(tleAdjusted).toHaveTextContent('300');
  });

  test('Adjusted column shows computed values for formula rows (Cash Flow)', () => {
    const data = {
      periods: ['Current Year'],
      statements: {
        cashFlow: {
          netIncome: { 0: 100 },
          depreciation: { 0: 10 },
          receivablesChange: { 0: -10 },
          capex: { 0: -20 },
          debtIssuance: { 0: 30 },
          beginningCash: { 0: 50 }
        }
      }
    };

    render(
      <FinancialSpreadsheet
        data={data}
        onDataChange={() => {}}
        initialActiveStatement="cashFlow"
      />
    );

    const endAdjusted = screen.getByTestId('cell-cashFlow-endingCash-adjusted');
    expect(endAdjusted).toHaveTextContent('160');
  });

  test('Adjusted column shows computed values for formula rows (Income Statement)', () => {
    const data = {
      periods: ['Current Year', 'Year 1'],
      statements: {
        incomeStatement: {
          // Revenue total last period: 200 + 50 = 250
          energyDevices: { 0: 100, 1: 200 },
          retailSales: { 0: 25, 1: 50 },
          // COGS last period: 30
          energyDeviceSupplies: { 0: 10, 1: 30 }
        }
      }
    };

    render(
      <FinancialSpreadsheet
        data={data}
        onDataChange={() => {}}
        initialActiveStatement="incomeStatement"
      />
    );

    // Adjusted column for grossProfit should reflect last period computed: (250 - 30) = 220
    const adjustedCell = screen.getByTestId('cell-incomeStatement-grossProfit-adjusted');
    expect(adjustedCell).toHaveTextContent('220');
  });

  test('Balance Sheet totals: Total Assets and Total Liabilities & Equity compute correctly', () => {
    const data = {
      periods: ['Current Year'],
      statements: {
        incomeStatement: {},
        balanceSheet: {
          // Current Assets: 100 + 50 = 150
          cash: { 0: 100 },
          receivables: { 0: 50 },
          // Non-Current Assets: netPPE = 200 - 50 = 150; others = 0; totalNonCurrentAssets = 150
          ppe: { 0: 200 },
          accumulatedDepreciation: { 0: 50 },
          // Liabilities: current = 70, non-current = 30, totalLiabilities = 100
          accountsPayable: { 0: 30 },
          accruedExpenses: { 0: 40 },
          longTermDebt: { 0: 30 },
          // Equity = 200
          commonStock: { 0: 100 },
          retainedEarnings: { 0: 100 }
        }
      }
    };

    render(
      <FinancialSpreadsheet
        data={data}
        onDataChange={() => {}}
        initialActiveStatement="balanceSheet"
      />
    );

    // Assert row-level totals by cell testids for reliability
    const tcaCell = screen.getByTestId('cell-balanceSheet-totalCurrentAssets-0');
    expect(tcaCell).toHaveTextContent('150');
    const taCell = screen.getByTestId('cell-balanceSheet-totalAssets-0');
    expect(taCell).toHaveTextContent('300');
    const tleCell = screen.getByTestId('cell-balanceSheet-totalLiabilitiesEquity-0');
    expect(tleCell).toHaveTextContent('300');
  });

  test('Cash Flow totals: Ending Cash = Beginning Cash + Net Cash Flow', async () => {
    const data = {
      periods: ['Current Year'],
      statements: {
        incomeStatement: {},
        cashFlow: {
          // Operating: 100 + 10 + (-10) = 100
          netIncome: { 0: 100 },
          depreciation: { 0: 10 },
          receivablesChange: { 0: -10 },
          // Investing: -20
          capex: { 0: -20 },
          // Financing: +30
          debtIssuance: { 0: 30 },
          // Beginning cash:
          beginningCash: { 0: 50 }
        }
      }
    };

    render(
      <FinancialSpreadsheet
        data={data}
        onDataChange={() => {}}
        initialActiveStatement="cashFlow"
      />
    );

    // netCashFlow = 100 + (-20) + 30 = 110; ending = 50 + 110 = 160
    const ncfCell = screen.getByTestId('cell-cashFlow-netCashFromFinancing-0');
    expect(ncfCell).toHaveTextContent('30');
    const endCell = screen.getByTestId('cell-cashFlow-endingCash-0');
    expect(endCell).toHaveTextContent('160');
  });

  test('adds a new period', async () => {
    window.prompt = vi.fn(() => 'Year 2');
    const onDataChange = vi.fn();
    render(<FinancialSpreadsheet data={mockData} onDataChange={onDataChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Add Period/i }));
    expect(onDataChange).toHaveBeenCalledWith({
      ...mockData,
      periods: ['Current Year', 'Year 1', 'Year 2']
    });
  });

  test('computes Gross Profit as Revenue minus COGS', () => {
    const data = {
      periods: ['Current Year', 'Year 1'],
      statements: {
        incomeStatement: {
          // Revenue components
          energyDevices: { 0: 100 },
          retailSales: { 0: 50 },
          // COGS components
          energyDeviceSupplies: { 0: 30 }
        }
      }
    };
    render(<FinancialSpreadsheet data={data} onDataChange={() => {}} />);
    const row = screen.getByText('Gross Profit').closest('tr');
    expect(row).toBeTruthy();
    // 100 + 50 - 30 = 120 => formatted as 120.00
    expect(row && row.textContent).toContain('120.00');
  });
});
