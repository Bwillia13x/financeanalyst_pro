import React, { useState, useEffect } from 'react';

import ReportBuilder from '../components/Reports/ReportBuilder';
import ReportGallery from '../components/Reports/ReportGallery';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { reportBuilderService } from '../services/reporting/ReportBuilderService';
import { scheduledReportsService } from '../services/reporting/ScheduledReportsService';

const Reports = () => {
  const [currentView, setCurrentView] = useState('gallery'); // 'gallery', 'builder', 'scheduled'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user reports and scheduled reports on mount
  useEffect(() => {
    loadUserReports();
    loadScheduledReports();
  }, []);

  const loadUserReports = async () => {
    try {
      // In a real implementation, this would fetch from backend
      const reports = reportBuilderService.listReports();
      setUserReports(reports);
    } catch (error) {
      console.error('Failed to load user reports:', error);
    }
  };

  const loadScheduledReports = async () => {
    try {
      const reports = scheduledReportsService.listScheduledReports();
      setScheduledReports(reports);
    } catch (error) {
      console.error('Failed to load scheduled reports:', error);
    }
  };

  const handleTemplateSelect = template => {
    setSelectedTemplate(template);
    setCurrentView('builder');
  };

  const handleSaveReport = async report => {
    try {
      setLoading(true);

      // Update the report in the service
      await reportBuilderService.updateReport(report.id, report);

      // Refresh user reports
      await loadUserReports();

      // Show success message
      console.log('Report saved successfully:', report.title);

      // Return to gallery
      setCurrentView('gallery');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReport = () => {
    setCurrentView('gallery');
    setSelectedTemplate(null);
  };

  const handleCreateScheduledReport = async () => {
    // This would open a modal or form for creating scheduled reports
    console.log('Create scheduled report');
  };

  const handleEditReport = report => {
    // This would load the report into the builder
    console.log('Edit report:', report);
  };

  const handleDeleteReport = async reportId => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        // In a real implementation, this would call a delete API
        reportBuilderService.deleteReport(reportId);
        await loadUserReports();
      } catch (error) {
        console.error('Failed to delete report:', error);
      }
    }
  };

  const handlePauseScheduledReport = async reportId => {
    try {
      await scheduledReportsService.pauseScheduledReport(reportId);
      await loadScheduledReports();
    } catch (error) {
      console.error('Failed to pause scheduled report:', error);
    }
  };

  const handleResumeScheduledReport = async reportId => {
    try {
      await scheduledReportsService.resumeScheduledReport(reportId);
      await loadScheduledReports();
    } catch (error) {
      console.error('Failed to resume scheduled report:', error);
    }
  };

  const handleDeleteScheduledReport = async reportId => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      try {
        await scheduledReportsService.deleteScheduledReport(reportId);
        await loadScheduledReports();
      } catch (error) {
        console.error('Failed to delete scheduled report:', error);
      }
    }
  };

  const renderGallery = () => <ReportGallery onSelectTemplate={handleTemplateSelect} />;

  const renderBuilder = () => (
    <ReportBuilder
      template={selectedTemplate}
      onSave={handleSaveReport}
      onCancel={handleCancelReport}
    />
  );

  const renderUserReports = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Reports</h2>
          <p className="text-foreground-secondary mt-1">View and manage your saved reports</p>
        </div>

        <Button onClick={() => setCurrentView('gallery')}>Create New Report</Button>
      </div>

      {/* Reports Grid */}
      {userReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No reports yet</h3>
            <p className="text-foreground-secondary mb-6">
              Create your first report using our professional templates
            </p>
            <Button onClick={() => setCurrentView('gallery')}>Browse Templates</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userReports.map(report => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <div className="text-sm text-foreground-secondary">{report.description}</div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-secondary">Sections</span>
                    <span className="font-medium">{report.sections?.length || 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-secondary">Created</span>
                    <span className="font-medium">
                      {new Date(report.created).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-secondary">Status</span>
                    <span
                      className={`font-medium capitalize ${
                        report.status === 'draft'
                          ? 'text-yellow-600'
                          : report.status === 'published'
                            ? 'text-green-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={() => handleEditReport(report)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Edit
                    </Button>

                    <Button
                      onClick={() => handleDeleteReport(report.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderScheduledReports = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scheduled Reports</h2>
          <p className="text-foreground-secondary mt-1">Automated report generation and delivery</p>
        </div>

        <Button onClick={handleCreateScheduledReport}>Schedule New Report</Button>
      </div>

      {/* Scheduled Reports List */}
      {scheduledReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No scheduled reports</h3>
            <p className="text-foreground-secondary mb-6">
              Set up automated report generation and email delivery
            </p>
            <Button onClick={handleCreateScheduledReport}>Create Schedule</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scheduledReports.map(report => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{report.name}</h3>
                    <p className="text-foreground-secondary mt-1">{report.description}</p>

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-foreground-secondary">Schedule:</span>
                        <span className="font-medium capitalize">{report.schedule.interval}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-foreground-secondary">Format:</span>
                        <span className="font-medium uppercase">{report.format}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-foreground-secondary">Recipients:</span>
                        <span className="font-medium">{report.recipients.length}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-foreground-secondary">Status:</span>
                        <span
                          className={`font-medium capitalize ${
                            report.status === 'active'
                              ? 'text-green-600'
                              : report.status === 'paused'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {report.status === 'active' ? (
                      <Button
                        onClick={() => handlePauseScheduledReport(report.id)}
                        variant="outline"
                        size="sm"
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleResumeScheduledReport(report.id)}
                        variant="outline"
                        size="sm"
                      >
                        Resume
                      </Button>
                    )}

                    <Button
                      onClick={() => handleDeleteScheduledReport(report.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4" />
          <p className="text-foreground-secondary">Processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('gallery')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentView === 'gallery'
                  ? 'bg-brand-accent text-white'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
              }`}
            >
              Template Gallery
            </button>

            <button
              onClick={() => setCurrentView('reports')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentView === 'reports'
                  ? 'bg-brand-accent text-white'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
              }`}
            >
              My Reports ({userReports.length})
            </button>

            <button
              onClick={() => setCurrentView('scheduled')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentView === 'scheduled'
                  ? 'bg-brand-accent text-white'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
              }`}
            >
              Scheduled Reports ({scheduledReports.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'gallery' && renderGallery()}
        {currentView === 'builder' && renderBuilder()}
        {currentView === 'reports' && renderUserReports()}
        {currentView === 'scheduled' && renderScheduledReports()}
      </div>
    </div>
  );
};

export default Reports;
