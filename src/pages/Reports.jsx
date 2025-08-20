import { FileText } from 'lucide-react';
import React from 'react';

import ReportBuilder from '../components/Reporting/ReportBuilder';
import SEOHead from '../components/SEO/SEOHead';
import Header from '../components/ui/Header';

const Reports = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SEOHead
        title="Reports & IC Memos | FinanceAnalyst Pro"
        description="Generate professional investment reports, IC memos, and financial analysis documents with customizable templates and automated PDF/DOCX export."
        canonical="/reports"
        keywords="investment reports, IC memos, financial analysis reports, PDF export, investment committee, due diligence reports"
      />

      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Reports & IC Memos
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
            Generate professional investment reports and IC memos with customizable templates,
            automated data integration, and one-click PDF/DOCX export capabilities.
          </p>
        </div>

        {/* Report Builder */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
          <ReportBuilder
            onReportGenerated={(report) => {
              console.log('Report generated:', report);
              // Handle report generation success
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Reports;
