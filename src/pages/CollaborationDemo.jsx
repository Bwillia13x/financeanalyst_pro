import React, { useState, useEffect } from 'react';

import CollaborativeEditor from '../components/Collaboration/CollaborativeEditor';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { collaborationService } from '../services/collaboration/CollaborationService';
import { presenceSystem } from '../services/collaboration/PresenceSystem';
import { versionControl } from '../services/collaboration/VersionControl';

const CollaborationDemo = () => {
  const [currentUser, setCurrentUser] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [presence, setPresence] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize collaboration service
        await collaborationService.initialize();

        // Initialize presence system
        await presenceSystem.initialize();

        // Set up event listeners
        setupEventListeners();

        // Load initial data
        loadInitialData();
      } catch (error) {
        console.error('Failed to initialize services:', error);
        addToActivityLog('Error', 'Failed to initialize collaboration services');
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      cleanupEventListeners();
    };
  }, []);

  // Setup event listeners
  const setupEventListeners = () => {
    // Collaboration events
    collaborationService.on('workspaceCreated', handleWorkspaceEvent);
    collaborationService.on('documentCreated', handleDocumentEvent);
    collaborationService.on('userJoinedDocument', handleUserEvent);
    collaborationService.on('operationApplied', handleOperationEvent);

    // Presence events
    presenceSystem.on('presenceUpdated', handlePresenceEvent);
    presenceSystem.on('cursorUpdated', handleCursorEvent);
  };

  // Cleanup event listeners
  const cleanupEventListeners = () => {
    collaborationService.off('workspaceCreated', handleWorkspaceEvent);
    collaborationService.off('documentCreated', handleDocumentEvent);
    collaborationService.off('userJoinedDocument', handleUserEvent);
    collaborationService.off('operationApplied', handleOperationEvent);

    presenceSystem.off('presenceUpdated', handlePresenceEvent);
    presenceSystem.off('cursorUpdated', handleCursorEvent);
  };

  // Event handlers
  const handleWorkspaceEvent = data => {
    addToActivityLog('Workspace', `Workspace ${data.workspaceId} created`);
    loadWorkspaces();
  };

  const handleDocumentEvent = data => {
    addToActivityLog(
      'Document',
      `Document ${data.documentId} created in workspace ${data.workspaceId}`
    );
    if (currentWorkspace === data.workspaceId) {
      loadDocuments(data.workspaceId);
    }
  };

  const handleUserEvent = data => {
    addToActivityLog('User', `User ${data.userId} joined document ${data.documentId}`);
  };

  const handleOperationEvent = data => {
    addToActivityLog(
      'Operation',
      `Operation applied to document ${data.documentId} by ${data.userId}`
    );
  };

  const handlePresenceEvent = data => {
    updatePresence();
  };

  const handleCursorEvent = data => {
    // Cursor updates are handled in the editor component
  };

  // Load initial data
  const loadInitialData = async () => {
    loadWorkspaces();
    updatePresence();
  };

  // Load workspaces
  const loadWorkspaces = () => {
    // In a real implementation, this would fetch from a backend
    setWorkspaces([
      { id: 'workspace_1', name: 'Financial Models', created: new Date() },
      { id: 'workspace_2', name: 'Research Reports', created: new Date() }
    ]);
  };

  // Load documents for workspace
  const loadDocuments = workspaceId => {
    // In a real implementation, this would fetch from a backend
    const workspaceDocuments = {
      workspace_1: [
        { id: 'doc_1', name: 'DCF Model Q4', type: 'financial-model', collaborators: 3 },
        { id: 'doc_2', name: 'Portfolio Analysis', type: 'analysis', collaborators: 2 }
      ],
      workspace_2: [
        { id: 'doc_3', name: 'Market Research Report', type: 'research', collaborators: 1 },
        { id: 'doc_4', name: 'Industry Analysis', type: 'analysis', collaborators: 4 }
      ]
    };

    setDocuments(workspaceDocuments[workspaceId] || []);
  };

  // Update presence information
  const updatePresence = () => {
    const presenceData = presenceSystem.getWorkspacePresence(currentWorkspace || 'workspace_1');
    setPresence(presenceData);
  };

  // Add to activity log
  const addToActivityLog = (type, message) => {
    const entry = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };

    setActivityLog(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  // Create new workspace
  const createWorkspace = async () => {
    try {
      const workspaceId = `workspace_${Date.now()}`;
      await collaborationService.createWorkspace(workspaceId, {
        name: `New Workspace ${workspaces.length + 1}`,
        owner: currentUser
      });

      setCurrentWorkspace(workspaceId);
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to create workspace:', error);
      addToActivityLog('Error', 'Failed to create workspace');
    }
  };

  // Create new document
  const createDocument = async () => {
    if (!currentWorkspace) {
      addToActivityLog('Error', 'Please select a workspace first');
      return;
    }

    try {
      const documentId = `doc_${Date.now()}`;
      await collaborationService.createDocument(currentWorkspace, documentId, {
        name: `New Document ${documents.length + 1}`,
        author: currentUser,
        initialContent: {
          title: 'New Collaborative Document',
          description: 'Created with FinanceAnalyst Pro collaboration features',
          sections: [
            {
              title: 'Introduction',
              content:
                'This is a collaborative document that can be edited by multiple users in real-time.'
            }
          ]
        }
      });

      loadDocuments(currentWorkspace);
    } catch (error) {
      console.error('Failed to create document:', error);
      addToActivityLog('Error', 'Failed to create document');
    }
  };

  // Select workspace
  const selectWorkspace = workspaceId => {
    setCurrentWorkspace(workspaceId);
    setCurrentDocument(null);
    loadDocuments(workspaceId);
    updatePresence();
  };

  // Select document
  const selectDocument = documentId => {
    setCurrentDocument(documentId);
  };

  // Get service status
  const getServiceStatus = () => {
    const collabStatus = collaborationService.getStatus();
    const presenceStatus = presenceSystem.getPresenceStats();

    return {
      collaboration: collabStatus,
      presence: presenceStatus
    };
  };

  const serviceStatus = getServiceStatus();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Collaboration Demo</h1>
            <p className="text-foreground-secondary mt-1">
              Real-time collaborative editing with presence indicators
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-secondary">User:</span>
              <span className="font-semibold text-foreground">{currentUser}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-foreground-secondary">
                {serviceStatus.collaboration.initialized ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Workspaces</span>
                <span className="font-semibold">{serviceStatus.collaboration.workspaces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Documents</span>
                <span className="font-semibold">{serviceStatus.collaboration.documents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Users</span>
                <span className="font-semibold">{serviceStatus.presence.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Users</span>
                <span className="font-semibold">{serviceStatus.presence.totalUsers}</span>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Management */}
          <Card>
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={createWorkspace} className="w-full">
                Create Workspace
              </Button>

              <div className="space-y-2">
                {workspaces.map(workspace => (
                  <div
                    key={workspace.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      currentWorkspace === workspace.id
                        ? 'border-brand-accent bg-brand-accent/10'
                        : 'border-border hover:border-brand-accent/50'
                    }`}
                    onClick={() => selectWorkspace(workspace.id)}
                  >
                    <div className="font-semibold text-foreground">{workspace.name}</div>
                    <div className="text-xs text-foreground-secondary">
                      Created {workspace.created.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Management */}
          {currentWorkspace && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={createDocument} className="w-full">
                  Create Document
                </Button>

                <div className="space-y-2">
                  {documents.map(document => (
                    <div
                      key={document.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentDocument === document.id
                          ? 'border-brand-accent bg-brand-accent/10'
                          : 'border-border hover:border-brand-accent/50'
                      }`}
                      onClick={() => selectDocument(document.id)}
                    >
                      <div className="font-semibold text-foreground">{document.name}</div>
                      <div className="text-xs text-foreground-secondary">
                        {document.collaborators} collaborators
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Users */}
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {presence.map(user => (
                  <div key={user.userId} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.cursor?.color || '#6b7280' }}
                    />
                    <span className="text-sm text-foreground">{user.userId}</span>
                    <span className="text-xs text-foreground-secondary">{user.status}</span>
                  </div>
                ))}

                {presence.length === 0 && (
                  <div className="text-sm text-foreground-secondary">No active users</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {currentDocument ? (
            <CollaborativeEditor
              documentId={currentDocument}
              userId={currentUser}
              initialContent={{
                title: 'Collaborative Financial Document',
                description: 'Real-time collaborative editing demo',
                sections: [
                  {
                    title: 'Executive Summary',
                    content: 'This document demonstrates real-time collaboration features...'
                  },
                  {
                    title: 'Financial Analysis',
                    content: 'Add your financial analysis here...'
                  }
                ]
              }}
            />
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">Select a Document</h3>
                <p className="text-foreground-secondary mb-4">
                  Choose a workspace and document to start collaborating
                </p>

                {!currentWorkspace && (
                  <p className="text-sm text-foreground-secondary">
                    Or create a new workspace to get started
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {activityLog.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-foreground-secondary w-16">{entry.type}</span>
                    <span className="text-foreground flex-1">{entry.message}</span>
                    <span className="text-xs text-foreground-secondary">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}

                {activityLog.length === 0 && (
                  <div className="text-sm text-foreground-secondary text-center py-4">
                    No activity yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollaborationDemo;
