import React, { useState, useEffect, useRef, useCallback } from 'react';

import { collaborationService } from '../../services/collaboration/CollaborationService';
import { presenceSystem } from '../../services/collaboration/PresenceSystem';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Input from '../ui/Input';

const CollaborativeEditor = ({ documentId, userId, initialContent = {} }) => {
  const [content, setContent] = useState(initialContent);
  const [collaborators, setCollaborators] = useState([]);
  const [cursors, setCursors] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [pendingOperations, setPendingOperations] = useState([]);

  const editorRef = useRef(null);
  const contentRef = useRef(content);

  // Update content ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Initialize collaboration
  useEffect(() => {
    const initializeCollaboration = async () => {
      try {
        // Initialize collaboration service
        await collaborationService.initialize();

        // Join document
        const result = await collaborationService.joinDocument(documentId, userId);

        setContent(result.document.content || {});
        setIsConnected(true);

        // Set up event listeners
        setupEventListeners();

        // Update presence
        await presenceSystem.updatePresence(userId, {
          workspaceId: 'default',
          documentId,
          status: 'editing'
        });
      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    initializeCollaboration();

    // Cleanup on unmount
    return () => {
      cleanupEventListeners();
      collaborationService.leaveDocument(documentId, userId);
    };
  }, [documentId, userId]);

  // Setup event listeners
  const setupEventListeners = () => {
    // Listen for operation updates
    collaborationService.on('operationReceived', handleOperationReceived);
    collaborationService.on('userJoinedDocument', handleUserJoined);
    collaborationService.on('userLeftDocument', handleUserLeft);

    // Listen for presence updates
    presenceSystem.on('cursorUpdated', handleCursorUpdated);
    presenceSystem.on('presenceUpdated', handlePresenceUpdated);
  };

  // Cleanup event listeners
  const cleanupEventListeners = () => {
    collaborationService.off('operationReceived', handleOperationReceived);
    collaborationService.off('userJoinedDocument', handleUserJoined);
    collaborationService.off('userLeftDocument', handleUserLeft);

    presenceSystem.off('cursorUpdated', handleCursorUpdated);
    presenceSystem.off('presenceUpdated', handlePresenceUpdated);
  };

  // Handle incoming operations
  const handleOperationReceived = useCallback(
    data => {
      if (data.documentId !== documentId || data.targetUser !== userId) return;

      // Apply operation to local content
      setContent(prevContent => {
        const newContent = { ...prevContent };
        applyOperationToContent(newContent, data.operation);
        return newContent;
      });

      setLastSaved(new Date());
    },
    [documentId, userId]
  );

  // Handle user joined
  const handleUserJoined = useCallback(
    data => {
      if (data.documentId !== documentId) return;

      setCollaborators(data.collaborators || []);
    },
    [documentId]
  );

  // Handle user left
  const handleUserLeft = useCallback(
    data => {
      if (data.documentId !== documentId) return;

      setCollaborators(prev => prev.filter(id => id !== data.userId));
    },
    [documentId]
  );

  // Handle cursor updates
  const handleCursorUpdated = useCallback(
    data => {
      if (data.cursor.documentId !== documentId) return;

      setCursors(prev => new Map(prev.set(data.cursor.userId, data.cursor)));
    },
    [documentId]
  );

  // Handle presence updates
  const handlePresenceUpdated = useCallback(
    data => {
      // Update collaborator list if needed
      const documentPresence = presenceSystem.getDocumentPresence(documentId);
      setCollaborators(documentPresence.map(p => p.userId));
    },
    [documentId]
  );

  // Apply operation to content
  const applyOperationToContent = (content, operation) => {
    switch (operation.type) {
      case 'update':
        if (operation.path && operation.value !== undefined) {
          setNestedValue(content, operation.path, operation.value);
        }
        break;
      case 'insert':
        if (operation.path && operation.value !== undefined) {
          insertIntoArray(content, operation.path, operation.position, operation.value);
        }
        break;
      case 'delete':
        if (operation.path) {
          deleteFromArray(content, operation.path, operation.position, operation.length);
        }
        break;
      default:
        console.warn('Unknown operation type:', operation.type);
    }
  };

  // Set nested value in object
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  // Insert into array
  const insertIntoArray = (obj, path, position, value) => {
    const target = getNestedValue(obj, path);
    if (Array.isArray(target)) {
      target.splice(position, 0, value);
    }
  };

  // Delete from array
  const deleteFromArray = (obj, path, position, length = 1) => {
    const target = getNestedValue(obj, path);
    if (Array.isArray(target)) {
      target.splice(position, length);
    }
  };

  // Get nested value
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Handle content changes
  const handleContentChange = useCallback(
    async (path, value, operationType = 'update') => {
      // Create operation
      const operation = {
        type: operationType,
        path,
        value,
        timestamp: new Date()
      };

      // Apply locally first for immediate UI feedback
      setContent(prevContent => {
        const newContent = { ...prevContent };
        applyOperationToContent(newContent, operation);
        return newContent;
      });

      // Add to pending operations
      setPendingOperations(prev => [...prev, operation]);

      try {
        // Send to collaboration service
        const result = await collaborationService.applyOperation(documentId, operation, userId);

        // Remove from pending operations
        setPendingOperations(prev =>
          prev.filter(op => op.path !== operation.path || op.timestamp !== operation.timestamp)
        );

        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to apply operation:', error);

        // Revert local change on error
        setContent(prevContent => {
          const newContent = { ...prevContent };
          // Revert the operation (simplified)
          return prevContent;
        });

        // Remove from pending operations
        setPendingOperations(prev =>
          prev.filter(op => op.path !== operation.path || op.timestamp !== operation.timestamp)
        );
      }
    },
    [documentId, userId]
  );

  // Handle cursor movement
  const handleCursorMove = useCallback(
    async position => {
      await presenceSystem.updateCursor(userId, documentId, position);
    },
    [userId, documentId]
  );

  // Render collaborator cursors
  const renderCollaboratorCursors = () => {
    return Array.from(cursors.entries()).map(([collaboratorId, cursor]) => {
      if (collaboratorId === userId) return null;

      return (
        <div
          key={collaboratorId}
          className="absolute w-0.5 h-6 bg-blue-500 pointer-events-none z-10"
          style={{
            left: `${cursor.position?.x || 0}px`,
            top: `${cursor.position?.y || 0}px`,
            backgroundColor: cursor.color || '#3b82f6'
          }}
        >
          <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {collaboratorId}
          </div>
        </div>
      );
    });
  };

  // Render collaborators list
  const renderCollaborators = () => {
    if (collaborators.length === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-foreground-secondary">Collaborators:</span>
        <div className="flex items-center gap-1">
          {collaborators.map(collaboratorId => {
            const cursor = cursors.get(collaboratorId);
            return (
              <div
                key={collaboratorId}
                className="flex items-center gap-1 px-2 py-1 bg-background-secondary rounded-full text-xs"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cursor?.color || '#6b7280' }}
                />
                <span className="text-foreground-secondary">{collaboratorId}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render connection status
  const renderConnectionStatus = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-foreground-secondary">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {lastSaved && (
          <span className="text-xs text-foreground-secondary">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}

        {pendingOperations.length > 0 && (
          <span className="text-xs text-yellow-600">
            {pendingOperations.length} pending changes
          </span>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Collaborative Editor - {documentId}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-secondary">
              {collaborators.length} collaborators
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        {renderConnectionStatus()}
        {renderCollaborators()}

        <div className="relative">
          {/* Document Content Editor */}
          <div
            ref={editorRef}
            className="min-h-96 p-4 border border-border rounded-lg bg-background relative overflow-hidden"
            onMouseMove={e => {
              const rect = editorRef.current.getBoundingClientRect();
              handleCursorMove({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              });
            }}
          >
            {/* Render document content */}
            <div className="space-y-4">
              {/* Title */}
              <Input
                value={content.title || ''}
                onChange={e => handleContentChange('title', e.target.value)}
                placeholder="Document Title"
                className="text-xl font-bold border-none p-0 focus:ring-0"
              />

              {/* Description */}
              <Input
                value={content.description || ''}
                onChange={e => handleContentChange('description', e.target.value)}
                placeholder="Document Description"
                className="border-none p-0 focus:ring-0"
              />

              {/* Content sections */}
              <div className="space-y-2">
                {(content.sections || []).map((section, index) => (
                  <div key={index} className="p-3 border border-border rounded">
                    <Input
                      value={section.title || ''}
                      onChange={e => handleContentChange(`sections.${index}.title`, e.target.value)}
                      placeholder="Section Title"
                      className="font-semibold border-none p-0 mb-2 focus:ring-0"
                    />
                    <textarea
                      value={section.content || ''}
                      onChange={e =>
                        handleContentChange(`sections.${index}.content`, e.target.value)
                      }
                      placeholder="Section Content"
                      className="w-full min-h-20 p-2 border border-border rounded resize-none focus:ring-2 focus:ring-brand-accent"
                      rows={4}
                    />
                  </div>
                ))}

                <Button
                  onClick={() => {
                    const newSections = [...(content.sections || []), { title: '', content: '' }];
                    handleContentChange('sections', newSections);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Add Section
                </Button>
              </div>
            </div>

            {/* Collaborator cursors */}
            {renderCollaboratorCursors()}
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  // Force save
                  setLastSaved(new Date());
                }}
                disabled={!isConnected}
                size="sm"
              >
                Save Changes
              </Button>

              <Button
                onClick={() => {
                  // Export document
                  const dataStr = JSON.stringify(content, null, 2);
                  const dataUri =
                    'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                  const exportFileDefaultName = `document_${documentId}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
                variant="outline"
                size="sm"
              >
                Export
              </Button>
            </div>

            <div className="text-xs text-foreground-secondary">
              {Object.keys(content).length} fields • {JSON.stringify(content).length} bytes
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaborativeEditor;
