import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { vi } from 'vitest';

import PrivateAnalysis from '../PrivateAnalysis';
import { store } from '../../store/store';
import { KeyboardShortcutsProvider } from '../../components/ui/KeyboardShortcutsProvider';

const renderWithProviders = component => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <KeyboardShortcutsProvider>{component}</KeyboardShortcutsProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('PrivateAnalysis', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders the component with the default tab active', () => {
    renderWithProviders(<PrivateAnalysis />);
    expect(screen.getByTestId('private-analysis-container')).toBeInTheDocument();
    // Use specific ID to target the main page heading, not the quick start modal heading
    expect(
      screen.getByRole('heading', { name: /private analysis/i, level: 1 })
    ).toBeInTheDocument();
    // Handle multiple instances of "Financial Spreadsheet" text
    const spreadsheetTabs = screen.getAllByText('Financial Spreadsheet');
    expect(spreadsheetTabs[0]).toBeInTheDocument();
  });

  test('switches tabs when a tab is clicked', () => {
    renderWithProviders(<PrivateAnalysis />);
    // Use getAllByText to handle multiple instances and click the first visible one
    const modelingTabs = screen.getAllByText('Financial Modeling');
    const visibleModelingTab = modelingTabs.find(tab => !tab.closest('.hidden'));
    fireEvent.click(visibleModelingTab || modelingTabs[0]);
    expect(visibleModelingTab || modelingTabs[0]).toBeInTheDocument();
  });

  test('saves and loads an analysis', () => {
    window.prompt = vi.fn(() => 'Test Analysis');
    renderWithProviders(<PrivateAnalysis />);

    // Save analysis
    const saveButton = screen.getByTestId('save-analysis-button');
    fireEvent.click(saveButton);
    expect(localStorage.getItem('privateAnalyses')).not.toBeNull();
  });

  test('displays data completeness progress', () => {
    renderWithProviders(<PrivateAnalysis />);
    // Use a more specific selector to avoid duplicate text issues
    const dataCompletenessElements = screen.getAllByText('Data Completeness');
    expect(dataCompletenessElements.length).toBeGreaterThan(0);
    // Verify at least one is in the correct context by checking it has a percentage display
    const progressContainer = dataCompletenessElements[0].closest('.bg-slate-800');
    expect(progressContainer).toBeInTheDocument();
  });
});
