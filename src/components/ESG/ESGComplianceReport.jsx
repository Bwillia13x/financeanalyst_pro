import { FileText, Download, CheckCircle, AlertTriangle, Shield, Globe, Target, BarChart3, RefreshCw, Settings } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import esgService from '../../services/esg/esgService';

const ESGComplianceReport = ({
  portfolio = {},
  reportingFramework = 'SFDR',
  reportingPeriod = '2023',
  onReportGenerated,
  className = ''
}) => {
  const [reportData, setReportData] = useState(null);
  const [selectedFramework, setSelectedFramework] = useState(reportingFramework);
  const [selectedPeriod, setSelectedPeriod] = useState(reportingPeriod);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Default portfolio
  const defaultPortfolio = {
    assets: [
      { symbol: 'AAPL', weight: 0.4 },
      { symbol: 'MSFT', weight: 0.3 },
      { symbol: 'GOOGL', weight: 0.2 },
      { symbol: 'TSLA', weight: 0.1 }
    ],
    portfolioValue: 77500,
    ...portfolio
  };

  // Generate compliance report
  useEffect(() => {
    generateComplianceReport();
  }, [selectedFramework, selectedPeriod]);

  const generateComplianceReport = async () => {
    setLoading(true);

    try {
      // Analyze portfolio ESG
      const portfolioAnalysis = await esgService.analyzeESGPortfolio(defaultPortfolio, {
        minESGScore: 60,
        maxCarbonIntensity: 150,
        excludeControversial: false
      });

      // Generate framework-specific compliance data
      const complianceData = await generateFrameworkCompliance(
        selectedFramework,
        portfolioAnalysis
      );

      const report = {
        framework: selectedFramework,
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        portfolio: portfolioAnalysis,
        compliance: complianceData,
        metadata: {
          reportVersion: '1.0',
          dataProvider: 'FinanceAnalyst Pro',
          complianceStandards: ['SFDR', 'TCFD', 'SASB']
        }
      };

      setReportData(report);
      onReportGenerated?.(report);
    } catch (error) {
      console.error('Compliance report generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFrameworkCompliance = async (framework, portfolioAnalysis) => {
    const compliance = {};

    switch (framework) {
      case 'SFDR':
        compliance.SFDR = await generateSFDRCompliance(portfolioAnalysis);
        break;
      case 'TCFD':
        compliance.TCFD = await generateTCFDCompliance(portfolioAnalysis);
        break;
      case 'SAS':
        compliance.SAS = await generateSASCompliance(portfolioAnalysis);
        break;
      default:
        compliance.general = generateGeneralCompliance(portfolioAnalysis);
    }

    return compliance;
  };

  const generateSFDRCompliance = async portfolioAnalysis => {
    // Mock SFDR compliance data - in real implementation, this would use actual regulatory data
    return {
      article6: {
        compliant: portfolioAnalysis.portfolioESGScore >= 60,
        sustainabilityRisks: ['Climate change risk', 'Transition risk', 'Physical risk'],
        riskPolicies: portfolioAnalysis.portfolioESGScore >= 60 ? 'Implemented' : 'Partial',
        adverseImpacts: await calculateAdverseImpacts(portfolioAnalysis)
      },
      article8: {
        compliant: portfolioAnalysis.portfolioESGScore >= 70,
        sustainableInvestmentObjective: 'Reduce carbon footprint by 30% over 5 years',
        environmentalCharacteristics: [
          'Low carbon intensity',
          'Renewable energy focus',
          'Sustainable supply chain'
        ]
      },
      article9: {
        compliant: portfolioAnalysis.portfolioESGScore >= 80,
        sustainableInvestmentObjective: 'Achieve net-zero emissions by 2050',
        environmentalCharacteristics: [
          'Net-zero aligned',
          'High ESG standards',
          'Impact investing focus'
        ]
      }
    };
  };

  const generateTCFDCompliance = async _portfolioAnalysis => {
    return {
      governance: {
        status: 'Implemented',
        disclosures: [
          'Board oversight of climate risks',
          'Climate risk management committee',
          'Executive compensation linked to ESG goals'
        ]
      },
      strategy: {
        status: 'Partial',
        disclosures: [
          'Scenario analysis for 2°C pathway',
          'Transition risk assessment',
          'Physical risk mapping'
        ]
      },
      riskManagement: {
        status: 'Implemented',
        disclosures: [
          'Climate risk integrated into ERM',
          'Regular climate stress testing',
          'Climate risk monitoring dashboard'
        ]
      },
      metrics: {
        status: 'Advanced',
        disclosures: [
          'Carbon footprint tracking',
          'ESG score monitoring',
          'Sustainability KPI reporting'
        ],
        targets: [
          '30% carbon reduction by 2030',
          'ESG score above 75',
          '100% sustainable supply chain by 2025'
        ]
      }
    };
  };

  const generateSASCompliance = async portfolioAnalysis => {
    return {
      environmentalMetrics: {
        carbonEmissions: portfolioAnalysis.carbonFootprint,
        energyConsumption: 150000, // MWh
        waterUsage: 2000000, // cubic meters
        wasteGeneration: 5000 // tons
      },
      socialMetrics: {
        employeeDiversity: 68,
        laborPractices: 75,
        communityInvestment: 2.5, // % of profits
        humanRightsScore: 82
      },
      governanceMetrics: {
        boardIndependence: 85,
        executiveCompensation: 78,
        shareholderRights: 92,
        transparencyScore: 88
      }
    };
  };

  const generateGeneralCompliance = portfolioAnalysis => {
    return {
      overallCompliance: portfolioAnalysis.compliant,
      esgScore: portfolioAnalysis.portfolioESGScore,
      carbonIntensity: portfolioAnalysis.carbonFootprint,
      controversies: portfolioAnalysis.assetBreakdown.filter(a => a.controversies.length > 0)
        .length,
      recommendations: portfolioAnalysis.recommendations
    };
  };

  const calculateAdverseImpacts = async _portfolioAnalysis => {
    // Mock adverse impact calculation
    return {
      greenhouseGasEmissions: {
        scope1: 150000,
        scope2: 200000,
        scope3: 500000,
        total: 850000
      },
      biodiversityLoss: 'Medium',
      waterPollution: 'Low',
      laborPractices: 'Low',
      humanRights: 'Low'
    };
  };

  // Calculate report metrics
  const reportMetrics = useMemo(() => {
    if (!reportData) return null;

    const { portfolio, compliance } = reportData;

    return {
      overallCompliance: calculateOverallCompliance(compliance),
      esgScore: portfolio.portfolioESGScore,
      carbonFootprint: portfolio.carbonFootprint,
      highRiskAssets: portfolio.assetBreakdown.filter(a => a.esgScore < 50).length,
      compliantAssets: portfolio.assetBreakdown.filter(a => a.esgScore >= 70).length,
      totalAssets: portfolio.assetBreakdown.length
    };
  }, [reportData]);

  const calculateOverallCompliance = compliance => {
    if (compliance.SFDR) {
      const sfdrScore =
        (compliance.SFDR.article6.compliant ? 33 : 0) +
        (compliance.SFDR.article8.compliant ? 33 : 0) +
        (compliance.SFDR.article9.compliant ? 34 : 0);
      return sfdrScore;
    }

    if (compliance.TCFD) {
      const tcfdCategories = ['governance', 'strategy', 'riskManagement', 'metrics'];
      const compliantCategories = tcfdCategories.filter(
        cat =>
          compliance.TCFD[cat].status === 'Implemented' ||
          compliance.TCFD[cat].status === 'Advanced'
      ).length;
      return (compliantCategories / tcfdCategories.length) * 100;
    }

    return 75; // Default
  };

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value, decimals = 1) => {
    return (value * 100).toFixed(decimals) + '%';
  };

  const getComplianceColor = score => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getComplianceIcon = compliant => {
    return compliant ? CheckCircle : AlertTriangle;
  };

  const exportReport = (format = 'pdf') => {
    // Mock export functionality
    console.log(`Exporting ${selectedFramework} report as ${format}`);

    // In real implementation, this would generate and download the actual report
    const reportContent = {
      framework: selectedFramework,
      period: selectedPeriod,
      data: reportData,
      format
    };

    // Create downloadable file
    const blob = new Blob([JSON.stringify(reportContent, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFramework}_Compliance_Report_${selectedPeriod}.${format === 'pdf' ? 'json' : format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const frameworks = [
    { id: 'SFDR', name: 'SFDR (EU)', description: 'Sustainable Finance Disclosure Regulation' },
    {
      id: 'TCFD',
      name: 'TCFD',
      description: 'Task Force on Climate-related Financial Disclosures'
    },
    { id: 'SAS', name: 'SAS', description: 'Sustainability Accounting Standards' },
    { id: 'general', name: 'General ESG', description: 'General ESG compliance overview' }
  ];

  const periods = ['2022', '2023', '2024'];

  return (
    <div className={`bg-card text-foreground border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">ESG Compliance Report</h3>
            <p className="text-xs text-foreground-secondary">
              Regulatory compliance reporting and disclosures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Advanced settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={generateComplianceReport}
            disabled={loading}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="Regenerate report"
          >
            <RefreshCw className={`${loading ? 'animate-spin' : ''} w-4 h-4`} />
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Export report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="framework-select" className="block text-sm text-foreground-secondary mb-2">Reporting Framework</label>
            <select
              id="framework-select"
              value={selectedFramework}
              onChange={e => setSelectedFramework(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-sm"
            >
              {frameworks.map(framework => (
                <option key={framework.id} value={framework.id}>
                  {framework.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="period-select" className="block text-sm text-foreground-secondary mb-2">Reporting Period</label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border rounded text-foreground text-sm"
            >
              {periods.map(period => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="block text-sm text-foreground-secondary mb-2">Portfolio Value</div>
            <div className="px-3 py-2 bg-muted border border-border rounded text-foreground text-sm" aria-label="Portfolio value">
              {formatCurrency(defaultPortfolio.portfolioValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      {reportMetrics && reportData && (
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Overall Compliance</span>
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <div
                className={`text-2xl font-bold ${getComplianceColor(reportMetrics.overallCompliance)}`}
              >
                {formatPercent(reportMetrics.overallCompliance / 100)}
              </div>
              <div className="text-xs text-foreground-secondary">{selectedFramework} compliant</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">ESG Score</span>
                <Target className="w-4 h-4 text-success" />
              </div>
              <div className={`text-2xl font-bold ${getComplianceColor(reportMetrics.esgScore)}`}>
                {reportMetrics.esgScore.toFixed(1)}
              </div>
              <div className="text-xs text-foreground-secondary">Portfolio average</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Carbon Intensity</span>
                <Globe className="w-4 h-4 text-warning" />
              </div>
              <div
                className={`text-2xl font-bold ${getComplianceColor(100 - reportMetrics.carbonFootprint)}`}
              >
                {reportMetrics.carbonFootprint.toFixed(1)}
              </div>
              <div className="text-xs text-foreground-secondary">tons CO2e/$M revenue</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-secondary">Asset Compliance</span>
                <BarChart3 className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent">
                {reportMetrics.compliantAssets}/{reportMetrics.totalAssets}
              </div>
              <div className="text-xs text-foreground-secondary">Compliant assets</div>
            </div>
          </div>

          {/* Framework-Specific Content */}
          {selectedFramework === 'SFDR' && reportData.compliance.SFDR && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-foreground">SFDR Compliance Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Article 6 */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {React.createElement(
                      getComplianceIcon(reportData.compliance.SFDR.article6.compliant),
                      { className: `w-4 h-4 ${reportData.compliance.SFDR.article6.compliant ? 'text-success' : 'text-destructive'}` }
                    )}
                    <h5 className="text-foreground font-medium">Article 6</h5>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        reportData.compliance.SFDR.article6.compliant
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {reportData.compliance.SFDR.article6.compliant
                        ? 'Compliant'
                        : 'Non-compliant'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-foreground-secondary">Sustainability Risk Policies:</div>
                    <div className="text-foreground">
                      {reportData.compliance.SFDR.article6.riskPolicies}
                    </div>
                  </div>
                </div>

                {/* Article 8 */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {React.createElement(
                      getComplianceIcon(reportData.compliance.SFDR.article8.compliant),
                      { className: `w-4 h-4 ${reportData.compliance.SFDR.article8.compliant ? 'text-success' : 'text-destructive'}` }
                    )}
                    <h5 className="text-foreground font-medium">Article 8</h5>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        reportData.compliance.SFDR.article8.compliant
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {reportData.compliance.SFDR.article8.compliant
                        ? 'Compliant'
                        : 'Non-compliant'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-foreground-secondary">Sustainable Investment Objective:</div>
                    <div className="text-foreground text-xs">
                      {reportData.compliance.SFDR.article8.sustainableInvestmentObjective}
                    </div>
                  </div>
                </div>

                {/* Article 9 */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {React.createElement(
                      getComplianceIcon(reportData.compliance.SFDR.article9.compliant),
                      { className: `w-4 h-4 ${reportData.compliance.SFDR.article9.compliant ? 'text-success' : 'text-destructive'}` }
                    )}
                    <h5 className="text-foreground font-medium">Article 9</h5>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        reportData.compliance.SFDR.article9.compliant
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {reportData.compliance.SFDR.article9.compliant
                        ? 'Compliant'
                        : 'Non-compliant'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-foreground-secondary">Sustainable Investment Objective:</div>
                    <div className="text-foreground text-xs">
                      {reportData.compliance.SFDR.article9.sustainableInvestmentObjective}
                    </div>
                  </div>
                </div>
              </div>

              {/* Adverse Impacts */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h5 className="text-foreground font-medium mb-4">Principal Adverse Impacts (PAI)</h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h6 className="text-foreground-secondary font-medium mb-2">Greenhouse Gas Emissions</h6>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Scope 1:</span>
                        <span className="text-foreground">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.greenhouseGasEmissions?.scope1?.toLocaleString()}{' '}
                          tons
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Scope 2:</span>
                        <span className="text-foreground">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.greenhouseGasEmissions?.scope2?.toLocaleString()}{' '}
                          tons
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Scope 3:</span>
                        <span className="text-foreground">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.greenhouseGasEmissions?.scope3?.toLocaleString()}{' '}
                          tons
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h6 className="text-foreground-secondary font-medium mb-2">Other Adverse Impacts</h6>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Biodiversity Loss:</span>
                        <span className="text-foreground capitalize">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.biodiversityLoss}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Water Pollution:</span>
                        <span className="text-foreground capitalize">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.waterPollution}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Labor Practices:</span>
                        <span className="text-foreground capitalize">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.laborPractices}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedFramework === 'TCFD' && reportData.compliance.TCFD && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-foreground">TCFD Compliance Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(reportData.compliance.TCFD).map(([category, data]) => (
                  <div key={category} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-foreground font-medium capitalize">
                        {category.replace(/([A-Z])/g, ' $1')}
                      </h5>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          data.status === 'Implemented' || data.status === 'Advanced'
                            ? 'bg-success/10 text-success'
                            : data.status === 'Partial'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {data.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-foreground-secondary">Disclosures:</div>
                      <ul className="text-sm text-foreground space-y-1">
                        {data.disclosures.map((disclosure, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-success" />
                            {disclosure}
                          </li>
                        ))}
                      </ul>

                      {data.targets && (
                        <>
                          <div className="text-sm text-foreground-secondary mt-3">Targets:</div>
                          <ul className="text-sm text-foreground space-y-1">
                            {data.targets.map((target, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <Target className="w-3 h-3 text-accent" />
                                {target}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asset-Level Analysis */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-foreground font-medium mb-4">Asset-Level ESG Analysis</h4>

            <div className="space-y-3">
              {reportData.portfolio.assetBreakdown.map(asset => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-3 bg-muted border border-border rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-accent rounded-full" />
                    <span className="text-foreground font-medium">{asset.symbol}</span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className={`font-medium ${getComplianceColor(asset.esgScore)}`}>
                        {asset.esgScore.toFixed(1)}
                      </div>
                      <div className="text-foreground-secondary text-xs">ESG Score</div>
                    </div>

                    <div className="text-center">
                      <div
                        className={`font-medium ${getComplianceColor(100 - asset.carbonIntensity)}`}
                      >
                        {asset.carbonIntensity.toFixed(1)}
                      </div>
                      <div className="text-foreground-secondary text-xs">Carbon</div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium text-foreground">{formatPercent(asset.weight)}</div>
                      <div className="text-foreground-secondary text-xs">Weight</div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium text-foreground">{asset.controversies.length}</div>
                      <div className="text-foreground-secondary text-xs">Controversies</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Metadata */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-foreground font-medium mb-4">Report Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-foreground-secondary">Generated:</div>
                <div className="text-foreground">
                  {new Date(reportData.generatedAt).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-foreground-secondary">Framework:</div>
                <div className="text-foreground">{selectedFramework}</div>
              </div>

              <div>
                <div className="text-foreground-secondary">Period:</div>
                <div className="text-foreground">{selectedPeriod}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          <span className="ml-3 text-foreground-secondary">Generating compliance report...</span>
        </div>
      )}
    </div>
  );
};

export default ESGComplianceReport;
