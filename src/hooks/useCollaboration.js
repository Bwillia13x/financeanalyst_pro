/**
 * React Hook for Real-Time Collaboration
 * Provides easy integration with CollaborationService for React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import collaborationService from '../services/collaborationService';
// import { performanceMonitoring } from '../utils/performanceMonitoring'; // Missing module

/**
 * Main collaboration hook
 */
export function useCollaboration(userId, userProfile = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    online: navigator.onLine,
    connected: false
  });
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const initialized = useRef(false);

  // Initialize collaboration service
  useEffect(() => {
    if (!userId || initialized.current) return;

    const initializeService = async() => {
      try {
        setIsLoading(true);
        setError(null);

        await collaborationService.initialize(userId, userProfile);
        setIsInitialized(true);
        initialized.current = true;

        // Track initialization success
        if (typeof performanceMonitoring !== 'undefined') {
          // performanceMonitoring.trackCustomMetric('collaboration_hook_init_success', 1);
        }
      } catch (err) {
        setError(err.message);
        console.error('Failed to initialize collaboration:', err);

        if (typeof performanceMonitoring !== 'undefined') {
          // performanceMonitoring.trackCustomMetric('collaboration_hook_init_error', 1);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      if (initialized.current) {
        collaborationService.cleanup();
        initialized.current = false;
      }
    };
  }, [userId, userProfile]);

  // Set up event listeners
  useEffect(() => {
    if (!isInitialized) return;

    const handleConnectionStatus = (status) => {
      setConnectionStatus(status);
    };

    const handleWorkspaceJoined = ({ workspace }) => {
      setCurrentWorkspace(workspace);
      setWorkspaceMembers(Array.from(workspace.members.values()));
    };

    const handleWorkspaceLeft = () => {
      setCurrentWorkspace(null);
      setWorkspaceMembers([]);
    };

    const handleUserJoined = ({ user, workspaceId }) => {
      if (currentWorkspace?.id === workspaceId) {
        setWorkspaceMembers(prev => {
          const existing = prev.find(member => member.id === user.id);
          if (existing) return prev;
          return [...prev, user];
        });
      }
    };

    const handleUserLeft = ({ userId: leftUserId, workspaceId }) => {
      if (currentWorkspace?.id === workspaceId) {
        setWorkspaceMembers(prev => prev.filter(member => member.id !== leftUserId));
      }
    };

    // Add event listeners
    collaborationService.on('connectionStatus', handleConnectionStatus);
    collaborationService.on('workspaceJoined', handleWorkspaceJoined);
    collaborationService.on('workspaceLeft', handleWorkspaceLeft);
    collaborationService.on('userJoined', handleUserJoined);
    collaborationService.on('userLeft', handleUserLeft);

    // Cleanup listeners
    return () => {
      collaborationService.off('connectionStatus', handleConnectionStatus);
      collaborationService.off('workspaceJoined', handleWorkspaceJoined);
      collaborationService.off('workspaceLeft', handleWorkspaceLeft);
      collaborationService.off('userJoined', handleUserJoined);
      collaborationService.off('userLeft', handleUserLeft);
    };
  }, [isInitialized, currentWorkspace?.id]);

  // Join workspace
  const joinWorkspace = useCallback(async(workspaceId, options = {}) => {
    if (!isInitialized) {
      throw new Error('Collaboration service not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);

      const workspace = await collaborationService.joinWorkspace(workspaceId, options);
      return workspace;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Leave workspace
  const leaveWorkspace = useCallback(async(workspaceId) => {
    if (!isInitialized) return;

    try {
      await collaborationService.leaveWorkspace(workspaceId);
    } catch (err) {
      setError(err.message);
      console.error('Failed to leave workspace:', err);
    }
  }, [isInitialized]);

  return {
    isInitialized,
    connectionStatus,
    currentWorkspace,
    workspaceMembers,
    isLoading,
    error,
    joinWorkspace,
    leaveWorkspace,
    // Expose service methods
    shareModel: collaborationService.shareModel.bind(collaborationService),
    updateModel: collaborationService.updateModel.bind(collaborationService),
    addAnnotation: collaborationService.addAnnotation.bind(collaborationService),
    updateCursor: collaborationService.updateCursor.bind(collaborationService),
    getWorkspaceModels: collaborationService.getWorkspaceModels.bind(collaborationService),
    getModelAnnotations: collaborationService.getModelAnnotations.bind(collaborationService)
  };
}

/**
 * Hook for real-time model sharing
 */
export function useModelSharing(workspaceId, modelId) {
  const [model, setModel] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [isShared, setIsShared] = useState(false);
  const [collaborators, _setCollaborators] = useState([]);
  const [modelVersion, setModelVersion] = useState(0);

  useEffect(() => {
    if (!workspaceId || !modelId) return;

    const handleModelShared = ({ sharedModel, workspaceId: wsId, modelId: mId }) => {
      if (wsId === workspaceId && mId === modelId) {
        setModel(sharedModel);
        setIsShared(true);
        setModelVersion(sharedModel.version);
      }
    };

    const handleModelUpdate = ({ workspaceId: wsId, modelId: mId, updates, version }) => {
      if (wsId === workspaceId && mId === modelId) {
        setModel(prev => prev ? { ...prev, data: { ...prev.data, ...updates }, version } : null);
        setModelVersion(version);
      }
    };

    const handleAnnotationAdded = ({ annotation, workspaceId: wsId, modelId: mId }) => {
      if (wsId === workspaceId && mId === modelId) {
        setAnnotations(prev => [...prev, annotation]);
      }
    };

    // Add event listeners
    collaborationService.on('modelShared', handleModelShared);
    collaborationService.on('modelUpdate', handleModelUpdate);
    collaborationService.on('annotationAdded', handleAnnotationAdded);

    // Load existing data
    const existingModels = collaborationService.getWorkspaceModels(workspaceId);
    const existingModel = existingModels.find(m => m.id === modelId);
    if (existingModel) {
      setModel(existingModel);
      setIsShared(true);
      setModelVersion(existingModel.version);
    }

    const existingAnnotations = collaborationService.getModelAnnotations(workspaceId, modelId);
    setAnnotations(existingAnnotations);

    // Cleanup listeners
    return () => {
      collaborationService.off('modelShared', handleModelShared);
      collaborationService.off('modelUpdate', handleModelUpdate);
      collaborationService.off('annotationAdded', handleAnnotationAdded);
    };
  }, [workspaceId, modelId]);

  const shareModel = useCallback(async(modelData, permissions = {}) => {
    if (!workspaceId || !modelId) return;

    try {
      const sharedModel = await collaborationService.shareModel(
        workspaceId,
        modelId,
        modelData,
        permissions
      );
      return sharedModel;
    } catch (error) {
      console.error('Failed to share model:', error);
      throw error;
    }
  }, [workspaceId, modelId]);

  const updateModel = useCallback(async(updates) => {
    if (!workspaceId || !modelId) return;

    try {
      const updatedModel = await collaborationService.updateModel(
        workspaceId,
        modelId,
        updates
      );
      return updatedModel;
    } catch (error) {
      console.error('Failed to update model:', error);
      throw error;
    }
  }, [workspaceId, modelId]);

  const addAnnotation = useCallback(async(annotation) => {
    if (!workspaceId || !modelId) return;

    try {
      const newAnnotation = await collaborationService.addAnnotation(
        workspaceId,
        modelId,
        annotation
      );
      return newAnnotation;
    } catch (error) {
      console.error('Failed to add annotation:', error);
      throw error;
    }
  }, [workspaceId, modelId]);

  return {
    model,
    annotations,
    isShared,
    collaborators,
    modelVersion,
    shareModel,
    updateModel,
    addAnnotation
  };
}

/**
 * Hook for real-time presence and cursors
 */
export function usePresence(workspaceId) {
  const [cursors, setCursors] = useState(new Map());
  const [presence, setPresence] = useState(new Map());
  const [activeCursors, setActiveCursors] = useState([]);

  useEffect(() => {
    if (!workspaceId) return;

    const handleCursorUpdate = ({ userId, position, workspaceId: wsId }) => {
      if (wsId === workspaceId) {
        setCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.set(userId, { position, timestamp: Date.now() });
          return newCursors;
        });
      }
    };

    const handlePresenceUpdate = ({ userId, status, workspaceId: wsId }) => {
      if (wsId === workspaceId) {
        setPresence(prev => {
          const newPresence = new Map(prev);
          newPresence.set(userId, { status, timestamp: Date.now() });
          return newPresence;
        });
      }
    };

    // Add event listeners
    collaborationService.on('cursorUpdate', handleCursorUpdate);
    collaborationService.on('presenceUpdate', handlePresenceUpdate);

    // Cleanup old cursors periodically
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const threshold = 30000; // 30 seconds

      setCursors(prev => {
        const filtered = new Map();
        for (const [userId, data] of prev) {
          if (now - data.timestamp < threshold) {
            filtered.set(userId, data);
          }
        }
        return filtered;
      });
    }, 5000);

    // Cleanup listeners
    return () => {
      collaborationService.off('cursorUpdate', handleCursorUpdate);
      collaborationService.off('presenceUpdate', handlePresenceUpdate);
      clearInterval(cleanupInterval);
    };
  }, [workspaceId]);

  // Convert cursors map to array for easier rendering
  useEffect(() => {
    setActiveCursors(Array.from(cursors.entries()).map(([userId, data]) => ({
      userId,
      ...data
    })));
  }, [cursors]);

  const updateCursor = useCallback((position) => {
    if (workspaceId) {
      collaborationService.updateCursor(workspaceId, position);
    }
  }, [workspaceId]);

  return {
    cursors: activeCursors,
    presence: Array.from(presence.entries()).map(([userId, data]) => ({
      userId,
      ...data
    })),
    updateCursor
  };
}

/**
 * Hook for workspace management
 */
export function useWorkspace(workspaceId) {
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [models, setModels] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    setIsLoading(true);

    // Load workspace data
    const loadWorkspaceData = () => {
      const workspaceMembers = collaborationService.getWorkspaceMembers(workspaceId);
      const workspaceModels = collaborationService.getWorkspaceModels(workspaceId);

      setMembers(workspaceMembers);
      setModels(workspaceModels);
      setIsLoading(false);
    };

    loadWorkspaceData();

    const handleWorkspaceUpdate = ({ workspaceId: wsId, data }) => {
      if (wsId === workspaceId) {
        setWorkspace(prev => ({ ...prev, ...data }));
      }
    };

    const handleUserJoined = ({ user, workspaceId: wsId }) => {
      if (wsId === workspaceId) {
        setMembers(prev => {
          const existing = prev.find(member => member.id === user.id);
          if (existing) return prev;
          return [...prev, user];
        });

        setActivity(prev => [{
          id: `activity_${Date.now()}`,
          type: 'user_joined',
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
          data: { user }
        }, ...prev.slice(0, 49)]); // Keep last 50 activities
      }
    };

    const handleUserLeft = ({ userId, workspaceId: wsId }) => {
      if (wsId === workspaceId) {
        setMembers(prev => prev.filter(member => member.id !== userId));

        setActivity(prev => [{
          id: `activity_${Date.now()}`,
          type: 'user_left',
          userId,
          timestamp: new Date().toISOString(),
          data: { userId }
        }, ...prev.slice(0, 49)]);
      }
    };

    const handleModelShared = ({ sharedModel, workspaceId: wsId }) => {
      if (wsId === workspaceId) {
        setModels(prev => [...prev, sharedModel]);

        setActivity(prev => [{
          id: `activity_${Date.now()}`,
          type: 'model_shared',
          userId: sharedModel.sharedBy,
          timestamp: sharedModel.sharedAt,
          data: { modelId: sharedModel.id, modelName: sharedModel.name }
        }, ...prev.slice(0, 49)]);
      }
    };

    // Add event listeners
    collaborationService.on('workspaceUpdate', handleWorkspaceUpdate);
    collaborationService.on('userJoined', handleUserJoined);
    collaborationService.on('userLeft', handleUserLeft);
    collaborationService.on('modelShared', handleModelShared);

    // Cleanup listeners
    return () => {
      collaborationService.off('workspaceUpdate', handleWorkspaceUpdate);
      collaborationService.off('userJoined', handleUserJoined);
      collaborationService.off('userLeft', handleUserLeft);
      collaborationService.off('modelShared', handleModelShared);
    };
  }, [workspaceId]);

  return {
    workspace,
    members,
    models,
    activity,
    isLoading
  };
}

export default useCollaboration;
