import React, { useState } from 'react';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const BulkOperationsPanel = ({ selectedSymbols, onBulkExport, onBulkAlert, onBulkHistorical }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [historicalPeriod, setHistoricalPeriod] = useState('1y');

  const handleBulkExport = () => {
    onBulkExport({
      symbols: selectedSymbols,
      format: exportFormat,
      timestamp: new Date().toISOString()
    });
  };

  const handleBulkAlert = () => {
    if (!alertThreshold) return;
    onBulkAlert({
      symbols: selectedSymbols,
      threshold: parseFloat(alertThreshold),
      type: 'price_change'
    });
    setAlertThreshold('');
  };

  const handleBulkHistorical = () => {
    onBulkHistorical({
      symbols: selectedSymbols,
      period: historicalPeriod
    });
  };

  if (selectedSymbols.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-1">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Layers" size={16} color="white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Bulk Operations</h3>
            <p className="text-sm text-muted-foreground">
              {selectedSymbols.length} symbol{selectedSymbols.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
        <Icon
          name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          size={20}
          className="text-muted-foreground"
        />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Selected Symbols */}
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">Selected Symbols:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSymbols.slice(0, 10).map(symbol => (
                <span
                  key={symbol}
                  className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                >
                  {symbol}
                </span>
              ))}
              {selectedSymbols.length > 10 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                  +{selectedSymbols.length - 10} more
                </span>
              )}
            </div>
          </div>

          {/* Operations */}
          <div className="p-4 space-y-4">
            {/* Export Operation */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Data Export</h4>
              <div className="flex items-center space-x-2">
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-input text-foreground"
                >
                  <option value="csv">CSV Format</option>
                  <option value="xlsx">Excel Format</option>
                  <option value="json">JSON Format</option>
                  <option value="pdf">PDF Report</option>
                </select>
                <Button
                  variant="outline" size="sm" iconName="Download"
                  onClick={handleBulkExport}
                >
                  Export Data
                </Button>
              </div>
            </div>

            {/* Alert Setup */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Price Alerts</h4>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Threshold %"
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Bell"
                  onClick={handleBulkAlert}
                  disabled={!alertThreshold}
                >
                  Set Alerts
                </Button>
              </div>
            </div>

            {/* Historical Data */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Historical Data</h4>
              <div className="flex items-center space-x-2">
                <select
                  value={historicalPeriod}
                  onChange={e => setHistoricalPeriod(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-input text-foreground"
                >
                  <option value="1d">1 Day</option>
                  <option value="1w">1 Week</option>
                  <option value="1m">1 Month</option>
                  <option value="3m">3 Months</option>
                  <option value="6m">6 Months</option>
                  <option value="1y">1 Year</option>
                  <option value="5y">5 Years</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="BarChart3"
                  onClick={handleBulkHistorical}
                >
                  Get Historical
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {selectedSymbols.length}
                </div>
                <div className="text-xs text-muted-foreground">Symbols</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {Math.min(selectedSymbols.length * 50, 1000)}
                </div>
                <div className="text-xs text-muted-foreground">Data Points</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">
                  ~{Math.ceil(selectedSymbols.length / 10)}s
                </div>
                <div className="text-xs text-muted-foreground">Est. Time</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperationsPanel;
