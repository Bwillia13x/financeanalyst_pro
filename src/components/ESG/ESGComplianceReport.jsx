import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Shield,
  Globe,
  Users,
  Target,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

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

  const generateTCFDCompliance = async portfolioAnalysis => {
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

  const calculateAdverseImpacts = async portfolioAnalysis => {
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
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
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
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">ESG Compliance Report</h3>
            <p className="text-xs text-slate-400">
              Regulatory compliance reporting and disclosures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Advanced settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={generateComplianceReport}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Regenerate report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Export report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="p-4 border-b border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Reporting Framework</label>
            <select
              value={selectedFramework}
              onChange={e => setSelectedFramework(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              {frameworks.map(framework => (
                <option key={framework.id} value={framework.id}>
                  {framework.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Reporting Period</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              {periods.map(period => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Portfolio Value</label>
            <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm">
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
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Overall Compliance</span>
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div
                className={`text-2xl font-bold ${getComplianceColor(reportMetrics.overallCompliance)}`}
              >
                {formatPercent(reportMetrics.overallCompliance / 100)}
              </div>
              <div className="text-xs text-slate-400">{selectedFramework} compliant</div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">ESG Score</span>
                <Target className="w-4 h-4 text-green-400" />
              </div>
              <div className={`text-2xl font-bold ${getComplianceColor(reportMetrics.esgScore)}`}>
                {reportMetrics.esgScore.toFixed(1)}
              </div>
              <div className="text-xs text-slate-400">Portfolio average</div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Carbon Intensity</span>
                <Globe className="w-4 h-4 text-orange-400" />
              </div>
              <div
                className={`text-2xl font-bold ${getComplianceColor(100 - reportMetrics.carbonFootprint)}`}
              >
                {reportMetrics.carbonFootprint.toFixed(1)}
              </div>
              <div className="text-xs text-slate-400">tons CO2e/$M revenue</div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Asset Compliance</span>
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {reportMetrics.compliantAssets}/{reportMetrics.totalAssets}
              </div>
              <div className="text-xs text-slate-400">Compliant assets</div>
            </div>
          </div>

          {/* Framework-Specific Content */}
          {selectedFramework === 'SFDR' && reportData.compliance.SFDR && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">SFDR Compliance Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Article 6 */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {getComplianceIcon(reportData.compliance.SFDR.article6.compliant)}
                    <h5 className="text-white font-medium">Article 6</h5>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        reportData.compliance.SFDR.article6.compliant
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {reportData.compliance.SFDR.article6.compliant
                        ? 'Compliant'
                        : 'Non-compliant'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-slate-400">Sustainability Risk Policies:</div>
                    <div className="text-white">
                      {reportData.compliance.SFDR.article6.riskPolicies}
                    </div>
                  </div>
                </div>

                {/* Article 8 */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {getComplianceIcon(reportData.compliance.SFDR.article8.compliant)}
                    <h5 className="text-white font-medium">Article 8</h5>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        reportData.compliance.SFDR.article8.compliant
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {reportData.compliance.SFDR.article8.compliant
                        ? 'Compliant'
                        : 'Non-compliant'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-slate-400">Sustainable Investment Objective:</div>
                    <div className="text-white text-xs">
                      {reportData.compliance.SFDR.article8.sustainableInvestmentObjective}
                    </div>
                  </div>
                </div>

                {/* Article 9 */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {getComplianceIcon(reportData.compliance.SFDR.article9.compliant)}
                    <h5 className="text-white font-medium">Article 9</h5>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        reportData.compliance.SFDR.article9.compliant
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {reportData.compliance.SFDR.article9.compliant
                        ? 'Compliant'
                        : 'Non-compliant'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-slate-400">Sustainable Investment Objective:</div>
                    <div className="text-white text-xs">
                      {reportData.compliance.SFDR.article9.sustainableInvestmentObjective}
                    </div>
                  </div>
                </div>
              </div>

              {/* Adverse Impacts */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h5 className="text-white font-medium mb-4">Principal Adverse Impacts (PAI)</h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h6 className="text-slate-400 font-medium mb-2">Greenhouse Gas Emissions</h6>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Scope 1:</span>
                        <span className="text-white">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.greenhouseGasEmissions?.scope1?.toLocaleString()}{' '}
                          tons
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Scope 2:</span>
                        <span className="text-white">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.greenhouseGasEmissions?.scope2?.toLocaleString()}{' '}
                          tons
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Scope 3:</span>
                        <span className="text-white">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.greenhouseGasEmissions?.scope3?.toLocaleString()}{' '}
                          tons
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h6 className="text-slate-400 font-medium mb-2">Other Adverse Impacts</h6>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Biodiversity Loss:</span>
                        <span className="text-white capitalize">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.biodiversityLoss}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Water Pollution:</span>
                        <span className="text-white capitalize">
                          {reportData.compliance.SFDR.article6.adverseImpacts?.waterPollution}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Labor Practices:</span>
                        <span className="text-white capitalize">
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
              <h4 className="text-lg font-semibold text-white">TCFD Compliance Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(reportData.compliance.TCFD).map(([category, data]) => (
                  <div key={category} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-white font-medium capitalize">
                        {category.replace(/([A-Z])/g, ' $1')}
                      </h5>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          data.status === 'Implemented' || data.status === 'Advanced'
                            ? 'bg-green-500/20 text-green-400'
                            : data.status === 'Partial'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {data.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-slate-400">Disclosures:</div>
                      <ul className="text-sm text-slate-300 space-y-1">
                        {data.disclosures.map((disclosure, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            {disclosure}
                          </li>
                        ))}
                      </ul>

                      {data.targets && (
                        <>
                          <div className="text-sm text-slate-400 mt-3">Targets:</div>
                          <ul className="text-sm text-slate-300 space-y-1">
                            {data.targets.map((target, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <Target className="w-3 h-3 text-blue-400" />
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
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">Asset-Level ESG Analysis</h4>

            <div className="space-y-3">
              {reportData.portfolio.assetBreakdown.map((asset, index) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-3 bg-slate-600/50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-white font-medium">{asset.symbol}</span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className={`font-medium ${getComplianceColor(asset.esgScore)}`}>
                        {asset.esgScore.toFixed(1)}
                      </div>
                      <div className="text-slate-400 text-xs">ESG Score</div>
                    </div>

                    <div className="text-center">
                      <div
                        className={`font-medium ${getComplianceColor(100 - asset.carbonIntensity)}`}
                      >
                        {asset.carbonIntensity.toFixed(1)}
                      </div>
                      <div className="text-slate-400 text-xs">Carbon</div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium text-white">{formatPercent(asset.weight)}</div>
                      <div className="text-slate-400 text-xs">Weight</div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium text-white">{asset.controversies.length}</div>
                      <div className="text-slate-400 text-xs">Controversies</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Metadata */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">Report Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Generated:</div>
                <div className="text-white">
                  {new Date(reportData.generatedAt).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-slate-400">Framework:</div>
                <div className="text-white">{selectedFramework}</div>
              </div>

              <div>
                <div className="text-slate-400">Period:</div>
                <div className="text-white">{selectedPeriod}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-slate-300">Generating compliance report...</span>
        </div>
      )}
    </div>
  );
};

export default ESGComplianceReport;
