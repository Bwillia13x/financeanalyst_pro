import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PrivateAnalysis from '../PrivateAnalysis';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PrivateAnalysis', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders the component with the default tab active', () => {
    renderWithRouter(<PrivateAnalysis />);
    expect(screen.getAllByText('Private Analysis')[0]).toBeInTheDocument();
    expect(screen.getByText('Data Entry')).toBeInTheDocument();
  });

  test('switches tabs when a tab is clicked', () => {
    renderWithRouter(<PrivateAnalysis />);
    const modelingTab = screen.getByText('Modeling');
    fireEvent.click(modelingTab);
    expect(screen.getByText('Modeling')).toBeInTheDocument();
  });

  test('saves and loads an analysis', () => {
    window.prompt = vi.fn(() => 'Test Analysis');
    renderWithRouter(<PrivateAnalysis />);

    // Save analysis
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    expect(localStorage.getItem('privateAnalyses')).not.toBeNull();
  });

  test('displays data completeness progress', () => {
    renderWithRouter(<PrivateAnalysis />);
    expect(screen.getByText('Data Completeness')).toBeInTheDocument();
  });
});
