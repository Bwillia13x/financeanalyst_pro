/**
 * Canvas API Service
 * Handles persistence of thesis canvas graphs with proper error handling and validation
 */

class CanvasApiService {
  constructor() {
    this.baseUrl = '/api/canvas';
    this.mockMode = true; // Set to false when backend is ready
    this.mockStorage = new Map(); // Simulate database in mock mode
    this.mockUserId = 'user_123'; // Simulate authenticated user
  }

  // Validate graph structure before persistence
  validateGraph(graph) {
    if (!graph || typeof graph !== 'object') {
      throw new Error('Invalid graph: must be an object');
    }

    if (!Array.isArray(graph.nodes)) {
      throw new Error('Invalid graph: nodes must be an array');
    }

    if (!Array.isArray(graph.edges)) {
      throw new Error('Invalid graph: edges must be an array');
    }

    // Validate nodes
    for (const node of graph.nodes) {
      if (!node.id || typeof node.x !== 'number' || typeof node.y !== 'number') {
        throw new Error('Invalid node: missing required fields (id, x, y)');
      }
    }

    // Validate edges reference existing nodes
    const nodeIds = new Set(graph.nodes.map(n => n.id));
    for (const edge of graph.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        throw new Error('Invalid edge: references non-existent node');
      }
    }

    return true;
  }

  // Create a new canvas
  async createCanvas(name, graph, description = '') {
    this.validateGraph(graph);

    if (this.mockMode) {
      const id = `canvas_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const canvas = {
        id,
        name: name || `Canvas ${new Date().toISOString().slice(0, 19)}`,
        description,
        graph,
        userId: this.mockUserId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: 1
      };
      this.mockStorage.set(id, canvas);
      return { success: true, data: canvas };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, graph })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update existing canvas
  async updateCanvas(id, graph, name = null, description = null) {
    this.validateGraph(graph);

    if (this.mockMode) {
      const existing = this.mockStorage.get(id);
      if (!existing) {
        return { success: false, error: 'Canvas not found' };
      }

      const updated = {
        ...existing,
        graph,
        ...(name && { name }),
        ...(description !== null && { description }),
        updated: new Date().toISOString(),
        version: existing.version + 1
      };

      this.mockStorage.set(id, updated);
      return { success: true, data: updated };
    }

    try {
      const body = { graph };
      if (name) body.name = name;
      if (description !== null) body.description = description;

      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get canvas by ID
  async getCanvas(id) {
    if (this.mockMode) {
      const canvas = this.mockStorage.get(id);
      if (!canvas) {
        return { success: false, error: 'Canvas not found' };
      }
      return { success: true, data: canvas };
    }

    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Canvas not found' };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // List user's canvases
  async listCanvases(userId = null) {
    if (this.mockMode) {
      const userCanvases = Array.from(this.mockStorage.values())
        .filter(canvas => !userId || canvas.userId === userId)
        .sort((a, b) => new Date(b.updated) - new Date(a.updated));

      return { success: true, data: userCanvases };
    }

    try {
      const url = userId ? `${this.baseUrl}?user=${userId}` : this.baseUrl;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete canvas
  async deleteCanvas(id) {
    if (this.mockMode) {
      const deleted = this.mockStorage.delete(id);
      if (!deleted) {
        return { success: false, error: 'Canvas not found' };
      }
      return { success: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Canvas not found' };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Initialize with some sample data in mock mode
  initializeMockData() {
    if (!this.mockMode) return;

    // Sample canvas 1: Basic investment thesis
    const sampleCanvas1 = {
      id: 'sample_1',
      name: 'SaaS Investment Thesis',
      description: 'Analysis of a high-growth SaaS company',
      graph: {
        nodes: [
          {
            id: 'thesis_1',
            type: 'thesis',
            x: 240,
            y: 220,
            text: 'Investment thesis for high-growth SaaS company with strong unit economics',
            pins: [],
            collapsed: false,
            created: Date.now() - 86400000 // 1 day ago
          },
          {
            id: 'claim_1',
            type: 'claim',
            x: 460,
            y: 160,
            text: 'Recurring revenue model with 95%+ retention',
            pins: [],
            collapsed: false,
            created: Date.now() - 86400000
          }
        ],
        edges: [
          {
            id: 'edge_1',
            from: 'thesis_1',
            to: 'claim_1',
            created: Date.now() - 86400000
          }
        ]
      },
      userId: this.mockUserId,
      created: new Date(Date.now() - 86400000).toISOString(),
      updated: new Date(Date.now() - 3600000).toISOString(),
      version: 2
    };

    this.mockStorage.set(sampleCanvas1.id, sampleCanvas1);
  }

  // Export for debugging/backup
  exportMockData() {
    if (!this.mockMode) return null;
    return Array.from(this.mockStorage.values());
  }

  // Import for debugging/restore
  importMockData(canvases) {
    if (!this.mockMode) return;
    this.mockStorage.clear();
    for (const canvas of canvases) {
      this.mockStorage.set(canvas.id, canvas);
    }
  }
}

// Create singleton instance
const canvasApiService = new CanvasApiService();

// Initialize with sample data
canvasApiService.initializeMockData();

export default canvasApiService;
