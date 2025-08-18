import { GitBranch, Zap, ArrowRight, Eye, Settings, Maximize2, Minimize2 } from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect } from 'react';

const Card = ({ title, right, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(title || right) && (
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        {title && <h3 className="text-[13px] font-semibold tracking-wide text-slate-700">{title}</h3>}
        {right}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

const Pill = ({ children, tone = 'slate', size = 'sm' }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };
  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    xs: 'text-[10px] px-1.5 py-0.5'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${tones[tone]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

const ModuleNode = ({
  module,
  position,
  isSelected,
  onSelect,
  onPositionChange,
  isDragging,
  connections = []
}) => {
  const [dragStart, setDragStart] = useState(null);
  const nodeRef = useRef(null);

  const getModuleColor = (type) => {
    switch (type) {
      case 'DCF': return 'border-blue-300 bg-blue-50';
      case 'LBO': return 'border-green-300 bg-green-50';
      case 'Comps': return 'border-amber-300 bg-amber-50';
      case 'EPV': return 'border-purple-300 bg-purple-50';
      case 'SOTP': return 'border-red-300 bg-red-50';
      default: return 'border-slate-300 bg-slate-50';
    }
  };

  const getModuleIcon = (type) => {
    switch (type) {
      case 'SOTP': return <GitBranch className="w-3 h-3" />;
      default: return <Zap className="w-3 h-3" />;
    }
  };

  const formatValue = (value) => {
    if (!value) return '—';
    return value >= 1e9 ? `$${(value / 1e9).toFixed(1)}B` :
      value >= 1e6 ? `$${(value / 1e6).toFixed(0)}M` :
        `$${value.toLocaleString()}`;
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    onSelect(module.id);
  };

  const handleMouseMove = (e) => {
    if (dragStart && isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      onPositionChange(module.id, newPosition);
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  useEffect(() => {
    if (dragStart) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragStart]);

  const hasIncomingConnections = connections.some(conn => conn.target === module.id);
  const hasOutgoingConnections = connections.some(conn => conn.source === module.id);

  return (
    <div
      ref={nodeRef}
      className={`absolute w-40 rounded-lg border-2 transition-all cursor-move select-none ${
        getModuleColor(module.kind)
      } ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-50' : ''} ${
        isDragging ? 'shadow-lg z-10' : 'shadow-sm'
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Pill
            tone={module.kind === 'DCF' ? 'blue' :
              module.kind === 'LBO' ? 'green' :
                module.kind === 'Comps' ? 'amber' :
                  module.kind === 'EPV' ? 'purple' : 'red'}
            size="xs"
          >
            {getModuleIcon(module.kind)}
            {module.kind}
          </Pill>
          {hasIncomingConnections && (
            <div className="w-2 h-2 rounded-full bg-blue-400" title="Has inputs" />
          )}
          {hasOutgoingConnections && (
            <div className="w-2 h-2 rounded-full bg-green-400" title="Has outputs" />
          )}
        </div>

        <div className="text-[11px] font-medium text-slate-800 mb-1 truncate">
          {module.name || 'Untitled'}
        </div>

        <div className="text-[10px] text-slate-600 space-y-1">
          {module.outputs?.ev && (
            <div>EV: {formatValue(module.outputs.ev)}</div>
          )}
          {module.outputs?.perShare && (
            <div>Per Share: {formatValue(module.outputs.perShare)}</div>
          )}
          {module.outputs?.irr && (
            <div>IRR: {(module.outputs.irr * 100).toFixed(1)}%</div>
          )}
          {module.totalValue && module.kind === 'SOTP' && (
            <div>Total: {formatValue(module.totalValue)}</div>
          )}
        </div>

        <div className="mt-2 text-[9px] text-slate-500">
          v{module.version || '1.0.0'}
        </div>
      </div>
    </div>
  );
};

const ConnectionLine = ({ connection, modules, positions }) => {
  const sourceModule = modules.find(m => m.id === connection.source);
  const targetModule = modules.find(m => m.id === connection.target);
  const sourcePos = positions[connection.source];
  const targetPos = positions[connection.target];

  if (!sourceModule || !targetModule || !sourcePos || !targetPos) {
    return null;
  }

  const sourceX = sourcePos.x + 160; // Right edge of source node
  const sourceY = sourcePos.y + 40;  // Middle of source node
  const targetX = targetPos.x;       // Left edge of target node
  const targetY = targetPos.y + 40;  // Middle of target node

  // Create curved path
  const controlX1 = sourceX + (targetX - sourceX) * 0.3;
  const controlY1 = sourceY;
  const controlX2 = sourceX + (targetX - sourceX) * 0.7;
  const controlY2 = targetY;

  const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${targetX} ${targetY}`;

  return (
    <g>
      <path
        d={pathData}
        stroke="#94a3b8"
        strokeWidth="2"
        fill="none"
        strokeDasharray={connection.type === 'dependency' ? '5,5' : 'none'}
        markerEnd="url(#arrowhead)"
      />
      {connection.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2 - 5}
          className="text-[9px] fill-slate-600"
          textAnchor="middle"
        >
          {connection.label}
        </text>
      )}
    </g>
  );
};

const ModuleGraphView = ({ models = [], sotpCompositions = [], onModuleSelect }) => {
  const [positions, setPositions] = useState({});
  const [selectedModule, setSelectedModule] = useState(null);
  const [draggedModule, setDraggedModule] = useState(null);
  const [viewMode, setViewMode] = useState('dependency'); // dependency, flow, hierarchy
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConnections, setShowConnections] = useState(true);

  // Combine models and SOTP compositions into modules
  const modules = useMemo(() => {
    const modelModules = models.map(model => ({
      ...model,
      type: 'model'
    }));

    const sotpModules = sotpCompositions.map(sotp => ({
      ...sotp,
      type: 'sotp',
      kind: 'SOTP'
    }));

    return [...modelModules, ...sotpModules];
  }, [models, sotpCompositions]);

  // Generate connections based on relationships
  const connections = useMemo(() => {
    const conns = [];

    // SOTP to model connections
    sotpCompositions.forEach(sotp => {
      sotp.components?.forEach(component => {
        if (component.type === 'model' && component.modelId) {
          conns.push({
            id: `${component.modelId}-${sotp.id}`,
            source: component.modelId,
            target: sotp.id,
            type: 'composition',
            label: 'input'
          });
        }
      });
    });

    // Model dependency connections (simplified - could be enhanced with actual dependency analysis)
    models.forEach(model => {
      if (model.basedOn || model.parentModelId) {
        conns.push({
          id: `${model.basedOn || model.parentModelId}-${model.id}`,
          source: model.basedOn || model.parentModelId,
          target: model.id,
          type: 'dependency',
          label: 'derives'
        });
      }
    });

    return conns;
  }, [models, sotpCompositions]);

  // Initialize positions when modules change
  useEffect(() => {
    const newPositions = {};

    modules.forEach((module, index) => {
      if (!positions[module.id]) {
        // Auto-layout logic - simple grid for now
        const row = Math.floor(index / 3);
        const col = index % 3;
        newPositions[module.id] = {
          x: 50 + col * 200,
          y: 50 + row * 120
        };
      }
    });

    if (Object.keys(newPositions).length > 0) {
      setPositions(prev => ({ ...prev, ...newPositions }));
    }
  }, [modules.length]);

  const handleModuleSelect = (moduleId) => {
    setSelectedModule(moduleId);
    const module = modules.find(m => m.id === moduleId);
    if (module && onModuleSelect) {
      onModuleSelect(module);
    }
  };

  const handlePositionChange = (moduleId, newPosition) => {
    setPositions(prev => ({
      ...prev,
      [moduleId]: newPosition
    }));
  };

  const autoLayout = () => {
    const newPositions = {};

    // Simple force-directed layout approximation
    modules.forEach((module, index) => {
      const hasConnections = connections.some(
        conn => conn.source === module.id || conn.target === module.id
      );

      if (hasConnections) {
        // Place connected modules closer to center
        const angle = (index / modules.length) * 2 * Math.PI;
        const radius = 150;
        newPositions[module.id] = {
          x: 300 + Math.cos(angle) * radius,
          y: 200 + Math.sin(angle) * radius
        };
      } else {
        // Place disconnected modules in outer ring
        const angle = (index / modules.length) * 2 * Math.PI;
        const radius = 250;
        newPositions[module.id] = {
          x: 300 + Math.cos(angle) * radius,
          y: 200 + Math.sin(angle) * radius
        };
      }
    });

    setPositions(newPositions);
  };

  const resetView = () => {
    setPositions({});
    setSelectedModule(null);
    setViewMode('dependency');
  };

  const exportGraph = () => {
    const graphData = {
      modules: modules.map(module => ({
        ...module,
        position: positions[module.id]
      })),
      connections,
      viewMode,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(graphData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'model-graph.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title="Module Graph View"
      right={
        <div className="flex items-center gap-2">
          <Pill tone="blue">{modules.length} modules</Pill>
          <Pill tone="green">{connections.length} connections</Pill>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="text-[11px] px-2 py-1 border border-slate-200 rounded bg-white"
          >
            <option value="dependency">Dependencies</option>
            <option value="flow">Data Flow</option>
            <option value="hierarchy">Hierarchy</option>
          </select>

          <button
            onClick={() => setShowConnections(!showConnections)}
            className={`px-2 py-1 text-[11px] rounded transition-colors ${
              showConnections ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Eye className="w-3 h-3" />
          </button>

          <button
            onClick={autoLayout}
            className="px-2 py-1 text-[11px] bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
            title="Auto layout"
          >
            <Settings className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2 py-1 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      }
      className={isFullscreen ? 'fixed inset-4 z-50 max-w-none max-h-none' : ''}
    >
      <div
        className={`relative bg-slate-50 rounded-lg overflow-hidden ${
          isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-96'
        }`}
      >
        {/* SVG for connections */}
        {showConnections && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#94a3b8"
                />
              </marker>
            </defs>
            {connections.map(connection => (
              <ConnectionLine
                key={connection.id}
                connection={connection}
                modules={modules}
                positions={positions}
              />
            ))}
          </svg>
        )}

        {/* Module nodes */}
        <div className="relative w-full h-full">
          {modules.map(module => (
            positions[module.id] && (
              <ModuleNode
                key={module.id}
                module={module}
                position={positions[module.id]}
                isSelected={selectedModule === module.id}
                onSelect={handleModuleSelect}
                onPositionChange={handlePositionChange}
                isDragging={draggedModule === module.id}
                connections={connections}
              />
            )
          ))}
        </div>

        {modules.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <GitBranch className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-[13px]">No modules to display</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Create models and SOTP compositions to see the graph
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            className="px-2 py-1 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
          >
            Reset View
          </button>
          <button
            onClick={exportGraph}
            className="px-2 py-1 text-[11px] bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
          >
            Export Graph
          </button>
        </div>

        {selectedModule && (
          <div className="text-[11px] text-slate-600">
            Selected: {modules.find(m => m.id === selectedModule)?.name || 'Unknown'}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 p-2 bg-slate-50 rounded text-[10px]">
        <div className="font-medium mb-1">Legend:</div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-blue-200 rounded" />
            <span>DCF</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-green-200 rounded" />
            <span>LBO</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-amber-200 rounded" />
            <span>Comps</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-purple-200 rounded" />
            <span>EPV</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-red-200 rounded" />
            <span>SOTP</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span>Connection</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ModuleGraphView;
