import React from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../AppIcon';

const ValuationTool = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Valuation Tool</h1>
          <p className="text-gray-400">
            Professional valuation models and analysis tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Icon name="TrendingUp" className="w-8 h-8 text-blue-400 mr-3" />
                <h3 className="text-xl font-semibold">DCF Analysis</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Discounted Cash Flow valuation with detailed projections
              </p>
              <Button className="w-full">
                Launch DCF Tool
              </Button>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Icon name="BarChart3" className="w-8 h-8 text-green-400 mr-3" />
                <h3 className="text-xl font-semibold">Comparable Analysis</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Peer comparison and relative valuation metrics
              </p>
              <Button className="w-full">
                Launch Comp Tool
              </Button>
            </div>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Icon name="Calculator" className="w-8 h-8 text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold">LBO Analysis</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Leveraged buyout modeling and returns analysis
              </p>
              <Button className="w-full">
                Launch LBO Tool
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Access Terminal</h3>
              <p className="text-gray-400 mb-4">
                Use the enhanced terminal interface for advanced valuation commands:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400">$ DCF(AAPL)</div>
                <div className="text-green-400">$ LBO(TSLA)</div>
                <div className="text-green-400">$ COMP(MSFT)</div>
                <div className="text-green-400">$ HELP("VALUATION")</div>
              </div>
              <div className="mt-4">
                <Button>
                  Open Terminal Interface
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ValuationTool;
