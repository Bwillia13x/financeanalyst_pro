// WebSocket Hook - Real-Time Collaboration
import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, options = {}) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    onOpen,
    onMessage,
    onClose,
    onError
  } = options;

  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageQueueRef = useRef([]);

  const connect = useCallback(() => {
    try {
      if (socket?.readyState === WebSocket.OPEN) {
        return;
      }

      setConnectionStatus('connecting');
      setError(null);

      const ws = new WebSocket(url);

      ws.onopen = event => {
        console.log('WebSocket connected');
        setSocket(ws);
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          ws.send(JSON.stringify(message));
        }

        // Start heartbeat
        startHeartbeat(ws);

        if (onOpen) {
          onOpen(event);
        }
      };

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);

          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = event => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setSocket(null);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        stopHeartbeat();

        if (onClose) {
          onClose(event);
        }

        // Auto-reconnect if enabled and not a normal closure
        if (
          autoReconnect &&
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          setConnectionStatus('reconnecting');

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionStatus('failed');
          setError('Max reconnection attempts reached');
        }
      };

      ws.onerror = event => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnectionStatus('error');

        if (onError) {
          onError(event);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err.message);
      setConnectionStatus('error');
    }
  }, [
    url,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    onOpen,
    onMessage,
    onClose,
    onError
  ]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }

    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [socket]);

  const send = useCallback(
    message => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        // Queue message for when connection is restored
        messageQueueRef.current.push(message);
      }
    },
    [socket]
  );

  const startHeartbeat = useCallback(
    ws => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, heartbeatInterval);
    },
    [heartbeatInterval]
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    socket,
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    send
  };
}

// Specialized hook for collaboration features
export function useCollaboration(analysisId, user) {
  const [activeUsers, setActiveUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';

  const { isConnected, send, connectionStatus } = useWebSocket(wsUrl, {
    onOpen: () => {
      // Authenticate
      send({
        type: 'auth',
        payload: {
          token: generateAuthToken(user)
        }
      });
    },
    onMessage: message => {
      switch (message.type) {
        case 'auth:success':
          // Join analysis room
          send({
            type: 'join:room',
            payload: {
              roomId: analysisId,
              metadata: { type: 'analysis' }
            }
          });
          break;

        case 'room:joined':
          setActiveUsers(message.users || []);
          break;

        case 'user:joined':
          setActiveUsers(prev => [...prev, message.user]);
          break;

        case 'user:left':
          setActiveUsers(prev => prev.filter(u => u.id !== message.userId));
          break;

        case 'comment:added':
          setComments(prev => [message.comment, ...prev]);
          break;

        case 'comment:updated':
          setComments(prev => prev.map(c => (c.id === message.comment.id ? message.comment : c)));
          break;

        case 'version:created':
          setVersions(prev => [message.version, ...prev]);
          break;

        case 'notification:received':
          setNotifications(prev => [message.notification, ...prev]);
          break;
      }
    }
  });

  const updatePresence = useCallback(
    presence => {
      send({
        type: 'presence:update',
        payload: {
          roomId: analysisId,
          presence
        }
      });
    },
    [send, analysisId]
  );

  const updateCursor = useCallback(
    cursor => {
      send({
        type: 'cursor:update',
        payload: {
          roomId: analysisId,
          cursor
        }
      });
    },
    [send, analysisId]
  );

  const addComment = useCallback(
    comment => {
      send({
        type: 'comment:add',
        payload: {
          roomId: analysisId,
          comment
        }
      });
    },
    [send, analysisId]
  );

  const createVersion = useCallback(
    version => {
      send({
        type: 'version:create',
        payload: {
          roomId: analysisId,
          version
        }
      });
    },
    [send, analysisId]
  );

  const updateDashboard = useCallback(
    (dashboard, changes) => {
      send({
        type: 'dashboard:update',
        payload: {
          roomId: analysisId,
          dashboard,
          changes
        }
      });
    },
    [send, analysisId]
  );

  return {
    isConnected,
    connectionStatus,
    activeUsers,
    comments,
    versions,
    notifications,
    updatePresence,
    updateCursor,
    addComment,
    createVersion,
    updateDashboard
  };
}

// Helper function to generate auth token (replace with actual implementation)
function generateAuthToken(user) {
  // In production, this would be a proper JWT token
  return btoa(
    JSON.stringify({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      timestamp: Date.now()
    })
  );
}
