import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  Edit,
  GitBranch,
  Users,
  Shield,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

import collaborationService from '../../services/collaboration/collaborationService';

const AuditTrail = ({ workspaceId, userId, onAuditEvent, className = '' }) => {
  const [auditLog, setAuditLog] = useState([]);
  const [filteredLog, setFilteredLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    eventType: 'all',
    userId: 'all',
    dateRange: 'all',
    severity: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load audit log on mount and when workspace changes
  useEffect(() => {
    if (workspaceId) {
      loadAuditLog();
    }
  }, [workspaceId]);

  // Apply filters and sorting when data or filters change
  useEffect(() => {
    applyFiltersAndSorting();
  }, [auditLog, searchTerm, filters, sortBy, sortOrder]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const log = await collaborationService.getAuditLog(workspaceId, {
        limit: 1000
      });

      setAuditLog(log);
      onAuditEvent?.(log);
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...auditLog];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        event =>
          event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.data.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.data.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply event type filter
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(event => event.type === filters.eventType);
    }

    // Apply user filter
    if (filters.userId !== 'all') {
      filtered = filtered.filter(event => event.data.userId === filters.userId);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate;

      switch (filters.dateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = null;
      }

      if (cutoffDate) {
        filtered = filtered.filter(event => new Date(event.timestamp) >= cutoffDate);
      }
    }

    // Apply severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(event => getEventSeverity(event) === filters.severity);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'user':
          aValue = a.data.userId || '';
          bValue = b.data.userId || '';
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLog(filtered);
  };

  const getEventIcon = eventType => {
    switch (eventType) {
      case 'user_joined_workspace':
        return <Users className="w-4 h-4 text-green-400" />;
      case 'user_left_workspace':
        return <User className="w-4 h-4 text-red-400" />;
      case 'document_edited':
        return <Edit className="w-4 h-4 text-blue-400" />;
      case 'document_created':
        return <FileText className="w-4 h-4 text-green-400" />;
      case 'version_created':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      case 'workspace_created':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'user_invited':
        return <User className="w-4 h-4 text-yellow-400" />;
      case 'invitation_accepted':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'security_alert':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEventSeverity = event => {
    const highSeverityEvents = [
      'security_alert',
      'user_left_workspace',
      'document_deleted',
      'workspace_deleted'
    ];

    const mediumSeverityEvents = ['document_edited', 'version_created', 'user_invited'];

    if (highSeverityEvents.includes(event.type)) {
      return 'high';
    } else if (mediumSeverityEvents.includes(event.type)) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  const getSeverityColor = severity => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-slate-400';
    }
  };

  const getEventDescription = event => {
    const { type, data } = event;

    switch (type) {
      case 'user_joined_workspace':
        return `${data.userId} joined the workspace`;
      case 'user_left_workspace':
        return `${data.userId} left the workspace`;
      case 'document_edited':
        return `${data.userId} edited document ${data.documentId}`;
      case 'document_created':
        return `${data.userId} created document ${data.documentId}`;
      case 'version_created':
        return `${data.userId} created version ${data.version} of document ${data.documentId}`;
      case 'workspace_created':
        return `${data.ownerId} created workspace "${data.workspaceName}"`;
      case 'user_invited':
        return `${data.inviterId} invited ${data.inviteeEmail} as ${data.role}`;
      case 'invitation_accepted':
        return `${data.userId} accepted invitation to workspace`;
      case 'security_alert':
        return `Security alert: ${data.threatType}`;
      default:
        return `${type.replace(/_/g, ' ')} by ${data.userId || 'system'}`;
    }
  };

  const formatTimestamp = timestamp => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Event Type', 'User', 'Description', 'Severity', 'IP Address'],
      ...filteredLog.map(event => [
        formatTimestamp(event.timestamp),
        event.type,
        event.data.userId || 'system',
        getEventDescription(event),
        getEventSeverity(event),
        event.ipAddress || 'N/A'
      ])
    ];

    const csvString = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${workspaceId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const eventTypes = [...new Set(auditLog.map(event => event.type))];
    const users = [...new Set(auditLog.map(event => event.data.userId).filter(Boolean))];

    return {
      eventTypes: eventTypes.sort(),
      users: users.sort()
    };
  }, [auditLog]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = auditLog.length;
    const today = auditLog.filter(event => {
      const eventDate = new Date(event.timestamp);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length;

    const byType = auditLog.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    const bySeverity = auditLog.reduce(
      (acc, event) => {
        const severity = getEventSeverity(event);
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    return { total, today, byType, bySeverity };
  }, [auditLog]);

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Audit Trail</h3>
            <p className="text-xs text-slate-400">
              {statistics.total} events • {statistics.today} today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Export audit log"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={loadAuditLog}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Refresh audit log"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-slate-700">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{statistics.total}</div>
          <div className="text-xs text-slate-400">Total Events</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{statistics.bySeverity.low}</div>
          <div className="text-xs text-slate-400">Low Severity</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-400">{statistics.bySeverity.medium}</div>
          <div className="text-xs text-slate-400">Medium Severity</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-400">{statistics.bySeverity.high}</div>
          <div className="text-xs text-slate-400">High Severity</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit events..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="timestamp">Sort by Time</option>
            <option value="type">Sort by Type</option>
            <option value="user">Sort by User</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-600">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Event Type</label>
              <select
                value={filters.eventType}
                onChange={e => setFilters({ ...filters, eventType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                {filterOptions.eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">User</label>
              <select
                value={filters.userId}
                onChange={e => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Users</option>
                {filterOptions.users.map(user => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={e => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Severity</label>
              <select
                value={filters.severity}
                onChange={e => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-slate-300">Loading audit log...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredLog.map(event => (
              <div
                key={event.id}
                className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
              >
                <div className="flex items-start gap-3">
                  {getEventIcon(event.type)}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">
                        {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(getEventSeverity(event))}`}
                      >
                        {getEventSeverity(event)}
                      </span>
                    </div>

                    <div className="text-sm text-slate-300 mb-1">{getEventDescription(event)}</div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>by {event.data.userId || 'system'}</span>
                      <span>{formatTimestamp(event.timestamp)}</span>
                      {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                    </div>
                  </div>

                  <div className="text-slate-400">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>

                {/* Expanded Event Details */}
                {selectedEvent?.id === event.id && (
                  <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="text-white font-medium mb-3">Event Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400 mb-1">Event ID</div>
                        <div className="text-white font-mono">{event.id}</div>
                      </div>

                      <div>
                        <div className="text-slate-400 mb-1">Timestamp</div>
                        <div className="text-white">{formatTimestamp(event.timestamp)}</div>
                      </div>

                      <div>
                        <div className="text-slate-400 mb-1">User Agent</div>
                        <div className="text-white text-xs">{event.userAgent}</div>
                      </div>

                      <div>
                        <div className="text-slate-400 mb-1">IP Address</div>
                        <div className="text-white">{event.ipAddress || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-slate-400 mb-1">Event Data</div>
                      <pre className="text-xs text-white bg-slate-800 p-3 rounded overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredLog.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                {searchTerm || Object.values(filters).some(f => f !== 'all')
                  ? 'No audit events match your search criteria'
                  : 'No audit events found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-700 text-xs text-slate-400">
        <div>
          Showing {filteredLog.length} of {auditLog.length} events
        </div>

        <div className="flex items-center gap-4">
          <span>Last updated: {formatTimestamp(new Date())}</span>
          <span>Retention: 365 days</span>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
