import React from 'react';
import { Calculator, TrendingUp, BarChart3, Zap, FileSpreadsheet, Target, PieChart, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivateAnalysis = () => {
  console.log('PrivateAnalysis component rendering');
  const navigate = useNavigate();

  const handleSpreadsheetClick = () => {
    console.log('Opening Financial Spreadsheet...');
    // Navigate to a spreadsheet interface or show a modal
    alert('Financial Spreadsheet feature coming soon! This would open an Excel-like interface.');
  };

  const handleModelingToolsClick = () => {
    console.log('Opening Modeling Tools...');
    // Navigate to model lab or modeling tools
    navigate('/model-lab');
  };

  const handleAnalysisResultsClick = () => {
    console.log('Opening Analysis Results...');
    // Navigate to reports or analysis results
    navigate('/reports');
  };

  const handleUpgradeToPro = () => {
    console.log('Redirecting to Pro upgrade...');
    // This would typically navigate to a pricing page or open a modal
    alert('Pro upgrade feature coming soon! Contact sales for premium features.');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card text-card-foreground border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <Calculator className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
              Private Analysis
            </h1>
            <p className="text-lg text-foreground-secondary max-w-3xl mx-auto leading-relaxed">
              Professional financial modeling and analysis for comprehensive investment evaluation
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={handleSpreadsheetClick}
            className="flex items-center p-6 bg-card text-card-foreground rounded-xl border border-border shadow-elevation-1 hover:shadow-elevation-2 transition-smooth group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-semibold text-foreground">Financial Spreadsheet</h3>
              <p className="text-foreground-secondary">Advanced Excel-like modeling interface</p>
            </div>
          </button>

          <button
            onClick={handleModelingToolsClick}
            className="flex items-center p-6 bg-card text-card-foreground rounded-xl border border-border shadow-elevation-1 hover:shadow-elevation-2 transition-smooth group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="p-3 bg-success/10 rounded-lg group-hover:bg-success/20 transition-colors">
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-semibold text-foreground">Modeling Tools</h3>
              <p className="text-foreground-secondary">Professional DCF and LBO analysis</p>
            </div>
          </button>

          <button
            onClick={handleAnalysisResultsClick}
            className="flex items-center p-6 bg-card text-card-foreground rounded-xl border border-border shadow-elevation-1 hover:shadow-elevation-2 transition-smooth group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
              <BarChart3 className="w-8 h-8 text-accent" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg font-semibold text-foreground">Analysis Results</h3>
              <p className="text-foreground-secondary">Comprehensive reporting and insights</p>
            </div>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-card text-card-foreground rounded-xl border border-border shadow-elevation-1 p-6">
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold text-foreground">Core Analysis Tools</h3>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => console.log('Opening DCF Models...')}
                  className="w-full flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer focus:outline-none focus:ring-2 focus:ring-success"
                >
                  <Calculator className="w-5 h-5 text-success mr-3" />
                  <span className="text-foreground">DCF Valuation Models</span>
                </button>
                <button
                  onClick={() => console.log('Opening LBO Analysis...')}
                  className="w-full flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <PieChart className="w-5 h-5 text-accent mr-3" />
                  <span className="text-foreground">LBO Analysis Framework</span>
                </button>
                <button
                  onClick={() => console.log('Opening Sensitivity Analysis...')}
                  className="w-full flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer focus:outline-none focus:ring-2 focus:ring-warning"
                >
                  <BarChart3 className="w-5 h-5 text-warning mr-3" />
                  <span className="text-foreground">Sensitivity Analysis</span>
                </button>
                <button
                  onClick={() => console.log('Opening Scenario Planning...')}
                  className="w-full flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer focus:outline-none focus:ring-2 focus:ring-destructive"
                >
                  <TrendingUp className="w-5 h-5 text-destructive mr-3" />
                  <span className="text-foreground">Scenario Planning</span>
                </button>
              </div>
            </div>

            <div className="bg-card text-card-foreground rounded-xl border border-border shadow-elevation-1 p-6">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-warning mr-3" />
                <h3 className="text-xl font-semibold text-foreground">Advanced Features</h3>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => console.log('Opening Formula Builder...')}
                  className="w-full flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <Settings className="w-5 h-5 text-accent mr-3" />
                  <span className="text-foreground">Custom Formula Builder</span>
                </button>
                <button
                  onClick={() => console.log('Opening Data Integration...')}
                  className="w-full flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer focus:outline-none focus:ring-2 focus:ring-success"
                >
                  <BarChart3 className="w-5 h-5 text-success mr-3" />
                  <span className="text-foreground">Real-time Data Integration</span>
                </button>
                <button
                  onClick={() => console.log('Opening Multi-sheet Workbooks...')}
                  className="w-full flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <FileSpreadsheet className="w-5 h-5 text-primary mr-3" />
                  <span className="text-foreground">Multi-sheet Workbooks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-card text-card-foreground rounded-xl border border-border shadow-elevation-1 p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Getting Started</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground">1. Create New Model</h4>
                  <p className="text-foreground-secondary text-sm">Start with a template or build from scratch</p>
                </div>
                <div className="border-l-4 border-success pl-4">
                  <h4 className="font-medium text-foreground">2. Input Your Data</h4>
                  <p className="text-foreground-secondary text-sm">Import data or enter manually with our spreadsheet interface</p>
                </div>
                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-medium text-foreground">3. Run Analysis</h4>
                  <p className="text-foreground-secondary text-sm">Execute DCF models, sensitivity analysis, and scenario planning</p>
                </div>
                <div className="border-l-4 border-warning pl-4">
                  <h4 className="font-medium text-foreground">4. Generate Reports</h4>
                  <p className="text-foreground-secondary text-sm">Export professional reports and presentations</p>
                </div>
              </div>
            </div>
            <div className="bg-card text-card-foreground rounded-xl border border-border p-6">
              <h3 className="text-xl font-semibold mb-2">Professional Features</h3>
              <p className="mb-4 text-foreground-secondary">Unlock the full power of Valor-IVX with advanced features</p>
              <button
                onClick={handleUpgradeToPro}
                className="px-6 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-smooth focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-success/5 rounded-lg border border-success/20">
            <div className="w-3 h-3 bg-success rounded-full mr-3 animate-pulse"></div>
            <span className="text-success font-medium">
              Private Analysis System: Ready for Professional Financial Modeling
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateAnalysis;
