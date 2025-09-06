import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Calculator, BarChart3, Shield } from 'lucide-react';

const Landing = () => {
  console.log('Landing page rendering');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              <span className="text-primary">Valor-IVX</span>
            </h1>
            <p className="text-xl sm:text-2xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed">
              Professional financial modeling and analysis platform with real-time data integration
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-card p-6 rounded-xl shadow-elevation-1 border border-border">
              <Calculator className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground mb-2">DCF Modeling</h3>
              <p className="text-foreground-secondary text-sm">
                Advanced discounted cash flow analysis with sensitivity testing
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-elevation-1 border border-border">
              <BarChart3 className="w-12 h-12 text-success mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Analytics</h3>
              <p className="text-foreground-secondary text-sm">
                Live market data and comprehensive portfolio tracking
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-elevation-1 border border-border">
              <TrendingUp className="w-12 h-12 text-accent mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Insights</h3>
              <p className="text-foreground-secondary text-sm">
                Intelligent investment recommendations powered by AI
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-elevation-1 border border-border">
              <Shield className="w-12 h-12 text-destructive mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Risk Management</h3>
              <p className="text-foreground-secondary text-sm">
                Comprehensive risk assessment and portfolio optimization
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/private-analysis"
              className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-elevation-1 hover:shadow-elevation-2 transition-smooth focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Start Analysis
            </Link>

            <Link
              to="/model-lab"
              className="inline-flex items-center px-8 py-4 bg-background-tertiary text-foreground font-semibold rounded-lg border border-border shadow-elevation-1 hover:bg-interactive-hover transition-smooth focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Explore Models
            </Link>
          </div>

          {/* Status Indicator */}
          <div className="mt-12 p-4 bg-success/5 rounded-lg border border-success/20">
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-success rounded-full mr-3 animate-pulse"></div>
              <span className="text-success font-medium">
                System Status: All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
