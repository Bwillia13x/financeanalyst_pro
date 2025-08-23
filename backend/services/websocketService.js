// WebSocket Service - Real-Time Collaboration Backend
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    this.rooms = new Map();
    this.sessions = new Map();
    this.heartbeatInterval = 30000; // 30 seconds
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', (ws, request) => {
      const clientId = uuidv4();
      
      // Store client connection
      this.clients.set(clientId, {
        id: clientId,
        ws,
        user: null,
        rooms: new Set(),
        lastHeartbeat: Date.now(),
        status: 'connected'
      });

      console.log(`WebSocket client connected: ${clientId}`);

      // Set up message handlers
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          this.sendError(clientId, 'Invalid message format');
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Handle connection errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });

      // Send connection acknowledgment
      this.send(clientId, {
        type: 'connection:ack',
        clientId,
        timestamp: new Date().toISOString()
      });
    });

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();

    console.log('WebSocket service initialized');
  }

  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Update heartbeat
    client.lastHeartbeat = Date.now();

    switch (message.type) {
      case 'auth':
        this.handleAuth(clientId, message.payload);
        break;
        
      case 'join:room':
        this.handleJoinRoom(clientId, message.payload);
        break;
        
      case 'leave:room':
        this.handleLeaveRoom(clientId, message.payload);
        break;
        
      case 'presence:update':
        this.handlePresenceUpdate(clientId, message.payload);
        break;
        
      case 'cursor:update':
        this.handleCursorUpdate(clientId, message.payload);
        break;
        
      case 'selection:update':
        this.handleSelectionUpdate(clientId, message.payload);
        break;
        
      case 'comment:add':
        this.handleCommentAdd(clientId, message.payload);
        break;
        
      case 'comment:update':
        this.handleCommentUpdate(clientId, message.payload);
        break;
        
      case 'version:create':
        this.handleVersionCreate(clientId, message.payload);
        break;
        
      case 'dashboard:update':
        this.handleDashboardUpdate(clientId, message.payload);
        break;
        
      case 'data:update':
        this.handleDataUpdate(clientId, message.payload);
        break;
        
      case 'heartbeat':
        this.handleHeartbeat(clientId);
        break;
        
      default:
        console.warn(`Unknown message type: ${message.type}`);
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  handleAuth(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Validate authentication token (implement your auth logic here)
    const user = this.validateAuthToken(payload.token);
    if (!user) {
      this.sendError(clientId, 'Authentication failed');
      return;
    }

    // Update client with user info
    client.user = user;
    client.status = 'authenticated';

    this.send(clientId, {
      type: 'auth:success',
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      }
    });

    console.log(`Client ${clientId} authenticated as ${user.name}`);
  }

  handleJoinRoom(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) {
      this.sendError(clientId, 'Authentication required');
      return;
    }

    const { roomId } = payload;
    
    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        clients: new Set(),
        metadata: payload.metadata || {},
        createdAt: new Date()
      });
    }

    const room = this.rooms.get(roomId);
    
    // Add client to room
    room.clients.add(clientId);
    client.rooms.add(roomId);

    // Notify other clients in the room
    this.broadcastToRoom(roomId, {
      type: 'user:joined',
      user: client.user,
      roomId,
      timestamp: new Date().toISOString()
    }, clientId);

    // Send room info to joining client
    const roomUsers = Array.from(room.clients)
      .map(id => this.clients.get(id))
      .filter(c => c && c.user)
      .map(c => ({
        id: c.user.id,
        name: c.user.name,
        avatar: c.user.avatar,
        role: c.user.role,
        status: c.status
      }));

    this.send(clientId, {
      type: 'room:joined',
      roomId,
      users: roomUsers,
      metadata: room.metadata
    });

    console.log(`Client ${clientId} joined room ${roomId}`);
  }

  handleLeaveRoom(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { roomId } = payload;
    const room = this.rooms.get(roomId);
    
    if (room && room.clients.has(clientId)) {
      room.clients.delete(clientId);
      client.rooms.delete(roomId);

      // Notify other clients
      this.broadcastToRoom(roomId, {
        type: 'user:left',
        userId: client.user?.id,
        roomId,
        timestamp: new Date().toISOString()
      }, clientId);

      // Clean up empty rooms
      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
      }

      console.log(`Client ${clientId} left room ${roomId}`);
    }
  }

  handlePresenceUpdate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) return;

    const { roomId, presence } = payload;

    // Broadcast presence update to room
    this.broadcastToRoom(roomId, {
      type: 'presence:updated',
      userId: client.user.id,
      presence,
      timestamp: new Date().toISOString()
    }, clientId);
  }

  handleCursorUpdate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) return;

    const { roomId, cursor } = payload;

    // Throttle cursor updates (only send every 100ms per user)
    const now = Date.now();
    const lastUpdate = client.lastCursorUpdate || 0;
    
    if (now - lastUpdate < 100) return;
    
    client.lastCursorUpdate = now;

    // Broadcast cursor update to room
    this.broadcastToRoom(roomId, {
      type: 'cursor:updated',
      userId: client.user.id,
      cursor,
      timestamp: new Date().toISOString()
    }, clientId);
  }

  handleSelectionUpdate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) return;

    const { roomId, selection } = payload;

    // Broadcast selection update to room
    this.broadcastToRoom(roomId, {
      type: 'selection:updated',
      userId: client.user.id,
      selection,
      timestamp: new Date().toISOString()
    }, clientId);
  }

  handleCommentAdd(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) return;

    const { roomId, comment } = payload;

    // Add user info to comment
    const commentWithAuthor = {
      ...comment,
      id: uuidv4(),
      author: {
        id: client.user.id,
        name: client.user.name,
        avatar: client.user.avatar
      },
      createdAt: new Date().toISOString()
    };

    // Broadcast new comment to room
    this.broadcastToRoom(roomId, {
      type: 'comment:added',
      comment: commentWithAuthor,
      timestamp: new Date().toISOString()
    });
  }

  handleCommentUpdate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) return;

    const { roomId, comment } = payload;

    // Broadcast comment update to room
    this.broadcastToRoom(roomId, {
      type: 'comment:updated',
      comment: {
        ...comment,
        updatedAt: new Date().toISOString(),
        updatedBy: client.user.id
      },
      timestamp: new Date().toISOString()
    });
  }

  handleVersionCreate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) return;

    const { roomId, version } = payload;

    // Broadcast new version to room
    this.broadcastToRoom(roomId, {
      type: 'version:created',
      version: {
        ...version,
        author: {
          id: client.user.id,
          name: client.user.name
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  handleDashboardUpdate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) return;

    const { roomId, dashboard, changes } = payload;

    // Broadcast dashboard update to room
    this.broadcastToRoom(roomId, {
      type: 'dashboard:updated',
      dashboard,
      changes,
      updatedBy: client.user.id,
      timestamp: new Date().toISOString()
    }, clientId);
  }

  handleDataUpdate(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.user) return;

    const { roomId, data, dataType } = payload;

    // Broadcast data update to room
    this.broadcastToRoom(roomId, {
      type: 'data:updated',
      data,
      dataType,
      updatedBy: client.user.id,
      timestamp: new Date().toISOString()
    }, clientId);
  }

  handleHeartbeat(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastHeartbeat = Date.now();
    
    this.send(clientId, {
      type: 'heartbeat:ack',
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client ${clientId} disconnected`);

    // Remove from all rooms
    client.rooms.forEach(roomId => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.clients.delete(clientId);
        
        // Notify other clients
        this.broadcastToRoom(roomId, {
          type: 'user:left',
          userId: client.user?.id,
          roomId,
          timestamp: new Date().toISOString()
        }, clientId);

        // Clean up empty rooms
        if (room.clients.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });

    // Remove client
    this.clients.delete(clientId);
  }

  // Utility methods
  send(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
      }
    }
  }

  sendError(clientId, errorMessage) {
    this.send(clientId, {
      type: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  broadcastToRoom(roomId, message, excludeClientId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.send(clientId, message);
      }
    });
  }

  broadcastToAll(message, excludeClientId = null) {
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId) {
        this.send(clientId, message);
      }
    });
  }

  startHeartbeatMonitoring() {
    setInterval(() => {
      const now = Date.now();
      const timeout = this.heartbeatInterval * 2; // 60 seconds timeout

      this.clients.forEach((client, clientId) => {
        if (now - client.lastHeartbeat > timeout) {
          console.log(`Client ${clientId} timed out`);
          client.ws.terminate();
          this.handleDisconnect(clientId);
        }
      });
    }, this.heartbeatInterval);
  }

  validateAuthToken(token) {
    // Implement your authentication logic here
    // This is a placeholder - replace with actual auth validation
    try {
      // For now, assume token contains user info (in production, validate JWT)
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Statistics and monitoring
  getStats() {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      totalUsers: Array.from(this.clients.values()).filter(c => c.user).length,
      uptime: process.uptime()
    };
  }

  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: roomId,
      userCount: room.clients.size,
      users: Array.from(room.clients)
        .map(clientId => this.clients.get(clientId))
        .filter(client => client && client.user)
        .map(client => ({
          id: client.user.id,
          name: client.user.name,
          status: client.status
        })),
      createdAt: room.createdAt,
      metadata: room.metadata
    };
  }
}

module.exports = WebSocketService;
