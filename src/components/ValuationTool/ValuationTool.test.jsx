import { render, screen } from '@testing-library/react';
import React from 'react';

import ValuationTool from './ValuationTool';

describe('ValuationTool', () => {
  it('should render without crashing', () => {
    render(<ValuationTool />);
    expect(screen.getByText('Valuation Tool')).toBeInTheDocument();
  });
});
