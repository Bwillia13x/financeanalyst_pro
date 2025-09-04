import {
  FileText,
  Download,
  Share,
  Eye,
  Settings,
  Sparkles,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import React, { useState, useRef } from 'react';

import advancedAIService from '../../services/ai/advancedAIService';

const AutomatedReportGenerator = ({
  analysisData,
  companyInfo,
  userPreferences = {},
  onReportGenerated,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportType, setReportType] = useState('comprehensive');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [tone, setTone] = useState('professional');
  const reportRef = useRef(null);

  const reportTypes = {
    executive: {
      title: 'Executive Summary',
      sections: ['overview', 'key_metrics', 'recommendations'],
      length: 'brief'
    },
    comprehensive: {
      title: 'Comprehensive Analysis',
      sections: [
        'overview',
        'financial_analysis',
        'market_analysis',
        'risk_assessment',
        'recommendations'
      ],
      length: 'detailed'
    },
    technical: {
      title: 'Technical Analysis',
      sections: ['methodology', 'data_analysis', 'model_validation', 'technical_insights'],
      length: 'detailed'
    },
    investment: {
      title: 'Investment Memorandum',
      sections: [
        'company_overview',
        'industry_analysis',
        'financial_analysis',
        'valuation',
        'investment_thesis'
      ],
      length: 'comprehensive'
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);

    try {
      // Generate insights using AI service
      const insights = await advancedAIService.generateInsights(analysisData, {
        company: companyInfo,
        reportType,
        preferences: userPreferences
      });

      // Generate sentiment analysis if available
      let sentimentData = null;
      if (companyInfo?.symbol) {
        sentimentData = await advancedAIService.analyzeSentiment(
          `Market analysis for ${companyInfo.symbol}: ${companyInfo.description || ''}`,
          { includeEntities: true }
        );
      }

      // Create report structure
      const report = {
        id: Date.now().toString(),
        title: `${companyInfo?.name || 'Company'} - ${reportTypes[reportType].title}`,
        type: reportType,
        generatedAt: new Date().toISOString(),
        company: companyInfo,
        sections: generateReportSections(insights, sentimentData),
        metadata: {
          version: '2.0',
          aiGenerated: true,
          confidence: insights?.insights?.[0]?.confidence || 0.8
        }
      };

      setGeneratedReport(report);
      onReportGenerated?.(report);
    } catch (error) {
      console.error('Report generation failed:', error);
      // Create fallback report
      const fallbackReport = createFallbackReport();
      setGeneratedReport(fallbackReport);
      onReportGenerated?.(fallbackReport);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportSections = (insights, sentimentData) => {
    const config = reportTypes[reportType];
    const sections = [];

    config.sections.forEach(sectionType => {
      switch (sectionType) {
        case 'overview':
          sections.push({
            title: 'Executive Overview',
            content: generateOverviewSection(insights, sentimentData),
            type: 'overview'
          });
          break;
        case 'financial_analysis':
          sections.push({
            title: 'Financial Analysis',
            content: generateFinancialAnalysis(insights),
            type: 'analysis'
          });
          break;
        case 'market_analysis':
          sections.push({
            title: 'Market Analysis',
            content: generateMarketAnalysis(sentimentData),
            type: 'market'
          });
          break;
        case 'risk_assessment':
          sections.push({
            title: 'Risk Assessment',
            content: generateRiskAssessment(insights),
            type: 'risk'
          });
          break;
        case 'recommendations':
          sections.push({
            title: 'Recommendations & Outlook',
            content: generateRecommendations(insights),
            type: 'recommendations'
          });
          break;
        default:
          sections.push({
            title: sectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            content: `Content for ${sectionType} section`,
            type: 'generic'
          });
      }
    });

    return sections;
  };

  const generateOverviewSection = (insights, sentimentData) => {
    const companyName = companyInfo?.name || 'the company';
    const sentiment = sentimentData?.sentiment || 'neutral';

    return `## Executive Overview

This comprehensive analysis provides an in-depth examination of ${companyName}'s financial performance, market position, and future outlook.

### Key Highlights
- **Financial Performance**: ${insights?.insights?.[0]?.description || 'Analysis indicates stable financial metrics with room for optimization.'}
- **Market Sentiment**: Current market sentiment appears ${sentiment}, with ${sentimentData?.confidence ? (sentimentData.confidence * 100).toFixed(0) + '%' : 'moderate'} confidence based on recent news and social media analysis.
- **Risk Profile**: ${insights?.insights?.find(i => i.type?.includes('risk'))?.description || 'Standard industry risk factors identified with mitigation strategies in place.'}

### Summary
${insights?.summary || 'AI-powered analysis reveals key opportunities and challenges that should be considered for strategic decision-making.'}`;
  };

  const generateFinancialAnalysis = insights => {
    const financialInsights =
      insights?.insights?.filter(
        i => i.type?.includes('financial') || i.description?.toLowerCase().includes('revenue')
      ) || [];

    return `## Financial Analysis

### Key Financial Metrics
${financialInsights.map(insight => `- **${insight.title}**: ${insight.description}`).join('\n')}

### Performance Trends
${insights?.insights?.find(i => i.type?.includes('trend'))?.description || 'Analysis shows consistent performance with identified growth opportunities.'}

### Financial Health Assessment
- **Revenue Analysis**: ${financialInsights[0]?.description || 'Revenue streams show stability with potential for expansion.'}
- **Profitability**: ${insights?.insights?.find(i => i.type?.includes('profit'))?.description || 'Profit margins within industry standards with improvement opportunities.'}
- **Cash Flow**: ${insights?.insights?.find(i => i.type?.includes('cash'))?.description || 'Cash flow management appears adequate for current operations.'}`;
  };

  const generateMarketAnalysis = sentimentData => {
    return `## Market Analysis

### Current Market Sentiment
${sentimentData ? `Market sentiment analysis indicates **${sentimentData.sentiment}** sentiment with ${(sentimentData.confidence * 100).toFixed(0)}% confidence. The sentiment score of ${(sentimentData.score * 100).toFixed(0)}% suggests ${sentimentData.sentiment === 'positive' ? 'favorable market conditions' : sentimentData.sentiment === 'negative' ? 'challenging market environment' : 'neutral market conditions'}.` : 'Market sentiment data currently unavailable. Manual analysis recommended.'}

### Competitive Landscape
- **Market Position**: ${companyInfo?.marketPosition || 'Analysis indicates stable competitive positioning'}
- **Industry Trends**: Current industry trends suggest ${sentimentData?.sentiment === 'positive' ? 'growth opportunities' : 'challenging conditions'}
- **Competitive Advantages**: ${companyInfo?.competitiveAdvantages || 'Key competitive factors identified and analyzed'}

### Market Opportunities
${sentimentData?.entities?.length ? `Key market entities identified: ${sentimentData.entities.join(', ')}` : 'Market analysis complete with identified growth opportunities.'}`;
  };

  const generateRiskAssessment = insights => {
    const riskInsights =
      insights?.insights?.filter(
        i => i.type?.includes('risk') || i.title?.toLowerCase().includes('risk')
      ) || [];

    return `## Risk Assessment

### Identified Risks
${riskInsights.map(risk => `- **${risk.title}**: ${risk.description}`).join('\n')}

### Risk Mitigation Strategies
${riskInsights.length > 0 ? riskInsights.map(risk => `- **Mitigation for ${risk.title}**: Implement monitoring and contingency planning`).join('\n') : '- Regular risk monitoring protocols established\n- Contingency planning for identified scenarios\n- Diversification strategies in place'}

### Overall Risk Rating
**${riskInsights.length > 2 ? 'High' : riskInsights.length > 0 ? 'Medium' : 'Low'}** - ${riskInsights.length > 2 ? 'Multiple risk factors require attention' : 'Manageable risk profile with monitoring requirements'}`;
  };

  const generateRecommendations = insights => {
    const positiveInsights = insights?.insights?.filter(i => i.type?.includes('positive')) || [];
    const riskInsights =
      insights?.insights?.filter(
        i => i.type?.includes('risk') || i.title?.toLowerCase().includes('risk')
      ) || [];

    return `## Recommendations & Outlook

### Strategic Recommendations
${positiveInsights.map(rec => `- **${rec.title}**: ${rec.action || 'Leverage identified opportunities'}`).join('\n')}

### Risk Management Actions
${riskInsights.map(risk => `- **Address ${risk.title}**: ${risk.action || 'Implement mitigation strategies'}`).join('\n')}

### Investment Outlook
${insights?.insights?.[0]?.action || 'Monitor key performance indicators and market conditions. Consider strategic initiatives to capitalize on identified opportunities.'}

### Next Steps
1. Implement recommended monitoring protocols
2. Schedule follow-up analysis in 3-6 months
3. Review strategic initiatives based on market developments
4. Update risk management framework as needed`;
  };

  const createFallbackReport = () => {
    return {
      id: Date.now().toString(),
      title: `${companyInfo?.name || 'Company'} - Fallback Analysis Report`,
      type: reportType,
      generatedAt: new Date().toISOString(),
      company: companyInfo,
      sections: [
        {
          title: 'Analysis Summary',
          content:
            '## Fallback Report\n\nDue to technical limitations, this is a basic analysis report. Please ensure all data sources are properly configured for full AI-powered analysis.\n\n### Key Findings\n- Basic company information compiled\n- Standard analysis framework applied\n- Recommendations based on general best practices',
          type: 'overview'
        }
      ],
      metadata: {
        version: '1.0',
        aiGenerated: false,
        confidence: 0.5
      }
    };
  };

  const exportReport = (format = 'pdf') => {
    if (!generatedReport) return;

    // In a real implementation, this would generate and download the actual file
    console.log(`Exporting report as ${format}:`, generatedReport);

    // Mock export functionality
    const blob = new Blob([JSON.stringify(generatedReport, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedReport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareReport = () => {
    if (!generatedReport) return;

    if (navigator.share) {
      navigator.share({
        title: generatedReport.title,
        text: `Check out this analysis report for ${companyInfo?.name || 'the company'}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${generatedReport.title}\n\nGenerated at: ${new Date(generatedReport.generatedAt).toLocaleString()}`
      );
      // Show success message
    }
  };

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Report Generator</h3>
            <p className="text-xs text-slate-400">Automated financial analysis reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="p-4 border-b border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              {Object.entries(reportTypes).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Tone</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="professional">Professional</option>
              <option value="conservative">Conservative</option>
              <option value="optimistic">Optimistic</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeCharts"
              checked={includeCharts}
              onChange={e => setIncludeCharts(e.target.checked)}
              className="rounded border-slate-600"
            />
            <label htmlFor="includeCharts" className="text-sm text-slate-300">
              Include Charts
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeRecommendations"
              checked={includeRecommendations}
              onChange={e => setIncludeRecommendations(e.target.checked)}
              className="rounded border-slate-600"
            />
            <label htmlFor="includeRecommendations" className="text-sm text-slate-300">
              Include Recommendations
            </label>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="p-4">
        <button
          onClick={generateReport}
          disabled={isGenerating || !analysisData}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate AI Report
            </>
          )}
        </button>
      </div>

      {/* Generated Report */}
      {generatedReport && (
        <div className="border-t border-slate-700">
          {/* Report Header */}
          <div className="p-4 bg-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-white">{generatedReport.title}</h4>
                <p className="text-sm text-slate-400">
                  Generated {new Date(generatedReport.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportReport('pdf')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={shareReport}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Share Report"
                >
                  <Share className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div ref={reportRef} className="p-4 max-h-96 overflow-y-auto">
            {generatedReport.sections.map((section, index) => (
              <div key={index} className="mb-6">
                <h5 className="text-md font-semibold text-white mb-3 border-b border-slate-600 pb-2">
                  {section.title}
                </h5>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">
                    {section.content}
                  </pre>
                </div>
              </div>
            ))}

            {/* Report Metadata */}
            <div className="mt-6 pt-4 border-t border-slate-600">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>
                  AI Confidence: {(generatedReport.metadata.confidence * 100).toFixed(0)}%
                </span>
                <span>Version: {generatedReport.metadata.version}</span>
                {generatedReport.metadata.aiGenerated && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    AI Generated
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysisData && (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h4 className="text-slate-400 mb-2">No Analysis Data</h4>
          <p className="text-sm text-slate-500">
            Add financial analysis data to generate AI-powered reports.
          </p>
        </div>
      )}
    </div>
  );
};

export default AutomatedReportGenerator;
