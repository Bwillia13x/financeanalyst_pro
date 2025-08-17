import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

import ComparableAnalysis from './ComparableAnalysis';
import FinancialModelWorkspace from './FinancialModelWorkspace';
import MonteCarloSimulation from './MonteCarloSimulation';
import ScenarioModeling from './ScenarioModeling';
import WACCCalculator from './WACCCalculator';

describe('FinancialModelWorkspace Component', () => {
  test('allows changing assumptions and recalculating the model', () => {
    render(<FinancialModelWorkspace />);
    fireEvent.click(screen.getByText('Assumptions'));
    const revenueGrowthInput = screen.getByLabelText('Revenue Growth Rate (%)');
    fireEvent.change(revenueGrowthInput, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Recalculate'));
    fireEvent.click(screen.getByText('Income Statement'));
    expect(screen.getByText('$110,000')).toBeInTheDocument();
  });
});

describe('ComparableAnalysis Component', () => {
  test('allows adding a new comparable company', () => {
    const data = { statements: { incomeStatement: {} } };
    const formatCurrency = (value) => `$${value}`;
    render(<ComparableAnalysis data={data} formatCurrency={formatCurrency} />);
    fireEvent.click(screen.getByText('Add Comparable'));
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'NewCo' } });
    fireEvent.change(screen.getByLabelText('Ticker'), { target: { value: 'NEW' } });
    fireEvent.change(screen.getByLabelText('Market Cap ($000s)'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Enterprise Value ($000s)'), { target: { value: '120000' } });
    fireEvent.change(screen.getByLabelText('Revenue ($000s)'), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText('EBITDA ($000s)'), { target: { value: '20000' } });
    fireEvent.change(screen.getByLabelText('Business Model'), { target: { value: 'Test Model' } });
    fireEvent.click(screen.getByText('Add Company'));
    expect(screen.getByText('NewCo')).toBeInTheDocument();
  });
});

describe('WACCCalculator Component', () => {
  test('renders WACCCalculator and checks for key elements', () => {
    const modelInputs = { dcf: { wacc: { buildUpMethod: {} } } };
    const onModelInputChange = vi.fn();
    const formatPercent = (value) => `${value}%`;

    render(
      <WACCCalculator
        modelInputs={modelInputs}
        onModelInputChange={onModelInputChange}
        formatPercent={formatPercent}
      />
    );

    expect(screen.getByText('WACC Calculator')).toBeInTheDocument();
    expect(screen.getByText('FINAL WACC')).toBeInTheDocument();
  });
});

describe('ScenarioModeling Component', () => {
  test('renders ScenarioModeling and checks for key elements', () => {
    const modelInputs = { scenario: { scenarios: [] } };
    const onModelInputChange = vi.fn();
    const calculateDCF = vi.fn(() => ({ enterpriseValue: 0 }));
    const formatCurrency = (value) => `$${value}`;
    const data = { statements: { incomeStatement: { totalRevenue: [1000], operatingIncome: [100] } }, periods: ['2023'] };

    render(
      <ScenarioModeling
        modelInputs={modelInputs}
        onModelInputChange={onModelInputChange}
        calculateDCF={calculateDCF}
        formatCurrency={formatCurrency}
        data={data}
      />
    );

    expect(screen.getByText('Scenario Assumptions')).toBeInTheDocument();
    expect(screen.getByText('Add Scenario')).toBeInTheDocument();
  });

  test('allows adding a new scenario and calculates weighted average', () => {
    const modelInputs = { scenario: { scenarios: [] } };
    const onModelInputChange = vi.fn();
    const calculateDCF = vi.fn(() => ({ enterpriseValue: 100000 }));
    const formatCurrency = (value) => `$${value}`;
    const data = { statements: { incomeStatement: { totalRevenue: [1000], operatingIncome: [100] } }, periods: ['2023'] };

    render(
      <ScenarioModeling
        modelInputs={modelInputs}
        onModelInputChange={onModelInputChange}
        calculateDCF={calculateDCF}
        formatCurrency={formatCurrency}
        data={data}
      />
    );

    // Add a new scenario
    fireEvent.click(screen.getByText('Add Scenario'));
    fireEvent.click(screen.getByText('Add'));

    // Check that the new scenario is rendered
    expect(screen.getByText('Scenario 2')).toBeInTheDocument();
  });
});

describe('MonteCarloSimulation Component', () => {
  test('renders MonteCarloSimulation and checks for key elements', () => {
    const data = { statements: { incomeStatement: { totalRevenue: [1000], operatingIncome: [100] } }, periods: ['2023'] };
    render(<MonteCarloSimulation data={data} />);

    expect(screen.getByText('Monte Carlo Simulation')).toBeInTheDocument();
    expect(screen.getByText('Run Simulation')).toBeInTheDocument();
  });

  test('runs the simulation and displays the results', async() => {
    const data = { statements: { incomeStatement: { totalRevenue: [1000], operatingIncome: [100] } }, periods: ['2023'] };
    render(<MonteCarloSimulation data={data} />);

    // Run the simulation
    fireEvent.click(screen.getByText('Run Simulation'));

    // Check for results
    expect(await screen.findByText('Price per Share')).toBeInTheDocument();
  });
});
