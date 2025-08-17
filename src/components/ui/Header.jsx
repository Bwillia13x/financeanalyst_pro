import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import Icon from '../AppIcon';

import Button from './Button';
import SkipLink from './SkipLink';

const Header = () => {
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigationTabs = [
    {
      id: 'workspace',
      label: 'Workspace',
      path: '/financial-model-workspace',
      tooltip: 'Primary financial modeling environment with terminal interface and formula builder'
    },
    {
      id: 'market-data',
      label: 'Market Data',
      path: '/real-time-market-data-center',
      tooltip: 'Real-time data aggregation from Bloomberg, FactSet, and Refinitiv feeds'
    },
    {
      id: 'analysis',
      label: 'Analysis',
      path: '/scenario-analysis-sensitivity-tools',
      tooltip: 'Scenario modeling and Monte Carlo simulation tools with sensitivity analysis'
    },
    {
      id: 'private-analysis',
      label: 'Private Analysis',
      path: '/private-analysis',
      tooltip: 'Manual financial data input and sophisticated modeling with spreadsheet-style interface'
    }
  ];

  const quickActions = [
    { id: 'export', icon: 'Download', label: 'Export' },
    { id: 'share', icon: 'Share2', label: 'Share' },
    { id: 'template', icon: 'FileTemplate', label: 'Template' }
  ];

  const getActiveTab = () => {
    return navigationTabs.find(tab => location.pathname === tab.path);
  };

  const getDataSyncStatus = () => {
    return {
      status: 'connected',
      lastUpdate: '2 min ago',
      sources: {
        bloomberg: 'connected',
        factset: 'connected',
        refinitiv: 'warning'
      }
    };
  };

  const getModelState = () => {
    return {
      name: 'DCF_Analysis_v2.3',
      saved: true,
      calculating: false,
      version: '2.3'
    };
  };

  const dataSyncStatus = getDataSyncStatus();
  const modelState = getModelState();
  const activeTab = getActiveTab();

  return (
    <>
      <SkipLink />
      <header className="fixed top-0 left-0 right-0 z-[1000] bg-card border-b border-border h-[60px]" role="banner">
        <div className="flex items-center h-full px-6">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" size={20} color="white" />
              </div>
              <span className="text-xl font-semibold text-foreground">FinanceAnalyst Pro</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center ml-8 space-x-1" role="navigation" aria-label="Main navigation">
            {navigationTabs.map(tab => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`
                relative px-6 py-3 text-sm font-medium transition-smooth rounded-lg
                ${
              location.pathname === tab.path
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
              `}
                title={tab.tooltip}
              >
                {tab.label}
                {location.pathname === tab.path && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Model State Indicator */}
          <div className="flex items-center ml-6 px-3 py-1 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${modelState.saved ? 'bg-success' : 'bg-warning'}`}
              />
              <span className="text-sm font-mono text-muted-foreground">{modelState.name}</span>
              <span className="text-xs text-muted-foreground">v{modelState.version}</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center ml-auto space-x-4">
            {/* Data Sync Status */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-lg">
              <div
                className={`w-2 h-2 rounded-full ${
                  dataSyncStatus.status === 'connected'
                    ? 'bg-success'
                    : dataSyncStatus.status === 'warning'
                      ? 'bg-warning'
                      : 'bg-error'
                }`}
              />
              <span className="text-xs text-muted-foreground">Data: {dataSyncStatus.lastUpdate}</span>
              <Icon name="Wifi" size={14} className="text-muted-foreground" />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              {quickActions.map(action => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  iconName={action.icon}
                  className="text-muted-foreground hover:text-foreground"
                  title={action.label}
                >
                  <span className="sr-only">{action.label}</span>
                </Button>
              ))}
            </div>

            {/* User Context Panel */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <Icon name="User" size={16} color="white" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">Senior Analyst</span>
                  <span className="text-xs text-muted-foreground">Active Session</span>
                </div>
                <Icon name="ChevronDown" size={16} />
              </Button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-elevation-2 z-[1100]">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <Icon name="User" size={20} color="white" />
                      </div>
                      <div>
                        <p className="font-medium text-popover-foreground">John Anderson</p>
                        <p className="text-sm text-muted-foreground">Senior Investment Analyst</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="space-y-1">
                      <button className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth">
                        Profile Settings
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth">
                        Permissions
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-muted rounded-md transition-smooth">
                        Active Collaborators (3)
                      </button>
                      <div className="border-t border-border my-1" />
                      <button className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted rounded-md transition-smooth">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
