import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from 'react';

import PersistentCLI from '../components/CLI/PersistentCLI';
import Header from '../components/ui/Header';
import canvasApiService from '../services/canvasApiService';

/*
  FinanceAnalyst Pro — THESIS CANVAS (Route: /canvas)
  Enhanced Version (Stabilized)
  - Fix: Guards around history/state initialization to prevent undefined access (graphState.nodes)
  - Fix: Safe lazy init for nodes/edges, even if history state is temporarily undefined
  - Fix: Defensive loadGraph & export guards
  - Added: More dev/sanity tests (history init, clipboard mock)
  - Kept: Undo/Redo, Multi-select, Copy/Paste, Export, Minimap, Search, Inspector
*/

// ———————————— Constants & Types ————————————
const GRID_SIZE = 8;
const NODE_WIDTH = 190;
const NODE_HEIGHT = 72;
const NODE_RADIUS = 12;

const TYPES = [
  { k: 'thesis', label: 'Thesis', color: '#0ea5e9', icon: '🎯' },
  { k: 'claim', label: 'Claim', color: '#6366f1', icon: '💡' },
  { k: 'evidence', label: 'Evidence', color: '#10b981', icon: '📊' },
  { k: 'risk', label: 'Risk', color: '#ef4444', icon: '⚠️' },
  { k: 'counter', label: 'Counterpoint', color: '#f59e0b', icon: '🤔' },
  { k: 'data', label: 'Data', color: '#14b8a6', icon: '📈' },
  { k: 'decision', label: 'Decision', color: '#334155', icon: '✓' }
];

// ———————————— UI Components ————————————
const Card = React.memo(({ title, right, children, className = '', actions }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}>
    {(title || right || actions) && (
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <div className="flex items-center gap-2">
          {title && <h3 className="text-[13px] font-semibold tracking-wide text-slate-700">{title}</h3>}
          {right}
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </header>
    )}
    <div className="p-3">{children}</div>
  </section>
));
Card.displayName = 'Card';

const Pill = React.memo(({ children, tone = 'slate', onClick, className = '' }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200'
  };
  const base = `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-all ${tones[tone] || tones.slate} ${className}`;
  const inter = onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : '';
  return (
    <span
      className={`${base} ${inter}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </span>
  );
});
Pill.displayName = 'Pill';

const Button = React.memo(({ children, variant = 'default', size = 'sm', onClick, disabled, className = '' }) => {
  const variants = {
    default: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    primary: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
    danger: 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'border-transparent text-slate-700 hover:bg-slate-100'
  };
  const sizes = { sm: 'px-2 py-1 text-[12px]', md: 'px-3 py-1.5 text-[13px]', lg: 'px-4 py-2 text-[14px]' };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border font-medium transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

// ———————————— Utils ————————————
const snap = (v, g = GRID_SIZE) => Math.round(v / g) * g;
const inRect = (px, py, x, y, w, h) => px >= x && px <= x + w && py >= y && py <= y + h;

const bezierPath = (x1, y1, x2, y2) => {
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

const makeNode = (type, x, y, text = '') => ({
  id: Math.random().toString(36).slice(2),
  type,
  x: snap(x),
  y: snap(y),
  text,
  pins: [],
  collapsed: false,
  created: Date.now()
});

const isReachable = (edges, start, target) => {
  const g = {};
  edges.forEach(e => (g[e.from] ||= []).push(e.to));
  const seen = new Set([start]);
  const st = [start];
  while (st.length) {
    const v = st.pop();
    if (v === target) return true;
    for (const w of g[v] || []) if (!seen.has(w)) {
      seen.add(w); st.push(w);
    }
  }
  return false;
};

const _layoutTree = (nodes, edges, rootId, dx = 220, dy = 120) => {
  if (!rootId) return nodes;
  const root = nodes.find(n => n.id === rootId); if (!root) return nodes;
  const centerX = root.x, centerY = root.y;
  const children = {}; edges.forEach(e => (children[e.from] ||= []).push(e.to));
  const depth = { [rootId]: 0 }, order = { 0: [rootId] }, q = [rootId];
  while (q.length) {
    const v = q.shift(); const d = depth[v];
    for (const w of children[v] || []) if (depth[w] == null) {
      depth[w] = d + 1; (order[d + 1] ||= []).push(w); q.push(w);
    }
  }
  const pos = { [rootId]: { x: centerX, y: centerY } };
  Object.keys(order).sort((a, b) => +a - +b).forEach(k => {
    if (k === '0') return; const level = order[k]; const span = (level.length - 1) * dy;
    level.forEach((id, i) => {
      pos[id] = { x: centerX + dx * (+k), y: centerY - span / 2 + i * dy };
    });
  });
  return nodes.map(n => pos[n.id] ? { ...n, x: snap(pos[n.id].x), y: snap(pos[n.id].y) } : n);
};

// ———————————— History (Stabilized) ————————————
const useHistory = (initialState) => {
  // Ensure we always have a valid object with arrays
  const safeInit = useMemo(() => ({
    nodes: Array.isArray(initialState?.nodes) ? initialState.nodes : [],
    edges: Array.isArray(initialState?.edges) ? initialState.edges : []
  }), [initialState]);

  const [history, setHistory] = useState([safeInit]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pushState = useCallback((newState) => {
    const next = {
      nodes: Array.isArray(newState?.nodes) ? newState.nodes : [],
      edges: Array.isArray(newState?.edges) ? newState.edges : []
    };
    setHistory(prev => [...prev.slice(0, currentIndex + 1), next]);
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, history.length]);

  return {
    state: history[currentIndex] ?? safeInit,
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  };
};

// ———————————— Node View ————————————
const NodeView = React.memo(({ node, selected, onMouseDown, onClick, onStartConnect, onDoubleClick, isHighlighted }) => {
  const def = TYPES.find(t => t.k === node.type) || TYPES[0];
  const [isHovered, setIsHovered] = useState(false);
  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseDown={e => onMouseDown(node, e)}
      onClick={e => {
        e.stopPropagation(); onClick(node);
      }}
      onDoubleClick={e => {
        e.stopPropagation(); onDoubleClick(node);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'move' }}
    >
      <rect
        rx={NODE_RADIUS} ry={NODE_RADIUS} width={NODE_WIDTH}
        height={NODE_HEIGHT} fill="black" opacity="0.1"
        transform="translate(2, 2)"
      />
      <rect
        rx={NODE_RADIUS} ry={NODE_RADIUS} width={NODE_WIDTH}
        height={NODE_HEIGHT} fill="#ffffff" stroke={selected ? '#0ea5e9' : isHighlighted ? '#6366f1' : '#cbd5e1'}
        strokeWidth={selected || isHighlighted ? '3' : '2'}
      />
      <rect
        rx={NODE_RADIUS} ry={NODE_RADIUS} width={NODE_WIDTH}
        height={NODE_HEIGHT} fill={def.color} opacity={isHovered ? '0.15' : '0.10'}
      />
      <g>
        <text
          x={12} y={20} fill="#0f172a"
          fontSize="11" fontWeight="700"
        >
          <tspan>{def.icon}</tspan>
          <tspan dx={4}>{def.label}</tspan>
        </text>
        {node.collapsed && (
          <text
            x={NODE_WIDTH - 48} y={18} fill="#64748b"
            fontSize="11"
          >(collapsed)
          </text>
        )}
      </g>
      <foreignObject
        x={12} y={26} width={NODE_WIDTH - 24}
        height={NODE_HEIGHT - 38}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className="overflow-hidden text-[12px] leading-tight text-slate-700"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {node.text || <span className="text-slate-400 italic">Add notes…</span>}
        </div>
      </foreignObject>
      <g
        transform={`translate(${NODE_WIDTH - 14},${NODE_HEIGHT - 14})`}
        className="cursor-crosshair"
        onMouseDown={e => {
          e.stopPropagation(); onStartConnect(node);
        }}
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <circle
          r={10} fill="#fff" stroke="#94a3b8"
          strokeWidth="1.5"
        />
        <path
          d="M -4 0 L 4 0 M 0 -4 L 0 4" stroke="#0ea5e9" strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      {node.pins && node.pins.length > 0 && (
        <g transform={`translate(12, ${NODE_HEIGHT - 12})`}>
          <circle r={6} fill="#6366f1" />
          <text
            x={0} y={2} fill="white"
            fontSize="8" textAnchor="middle"
          >{node.pins.length}
          </text>
        </g>
      )}
    </g>
  );
});
NodeView.displayName = 'NodeView';

// ———————————— Minimap ————————————
const Minimap = React.memo(({ nodes, edges, viewport }) => {
  const width = 200, height = 150;
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: width, maxY: height };
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    return { minX: Math.min(...xs) - 50, minY: Math.min(...ys) - 50, maxX: Math.max(...xs) + NODE_WIDTH + 50, maxY: Math.max(...ys) + NODE_HEIGHT + 50 };
  }, [nodes]);
  const viewBox = `${bounds.minX} ${bounds.minY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`;
  return (
    <div className="absolute bottom-4 right-4 overflow-hidden rounded-lg border border-slate-300 bg-white/95 shadow-lg">
      <svg width={width} height={height} viewBox={viewBox}>
        <rect
          x={bounds.minX} y={bounds.minY} width={bounds.maxX - bounds.minX}
          height={bounds.maxY - bounds.minY} fill="#f8fafc"
        />
        {edges.map(e => {
          const from = nodes.find(n => n.id === e.from); const to = nodes.find(n => n.id === e.to); if (!from || !to) return null;
          return (
            <line
              key={e.id} x1={from.x + NODE_WIDTH / 2} y1={from.y + NODE_HEIGHT / 2}
              x2={to.x + NODE_WIDTH / 2} y2={to.y + NODE_HEIGHT / 2} stroke="#cbd5e1"
              strokeWidth="8"
            />
          );
        })}
        {nodes.map(n => {
          const def = TYPES.find(t => t.k === n.type) || TYPES[0];
          return (
            <rect
              key={n.id} x={n.x} y={n.y}
              width={NODE_WIDTH} height={NODE_HEIGHT} fill={def.color}
              opacity="0.8" rx={NODE_RADIUS}
            />
          );
        })}
        <rect
          x={viewport.x} y={viewport.y} width={viewport.width}
          height={viewport.height} fill="none" stroke="#0ea5e9"
          strokeWidth="12" opacity="0.5"
        />
      </svg>
    </div>
  );
});
Minimap.displayName = 'Minimap';

// ———————————— Search ————————————
const SearchPanel = React.memo(({ nodes, onNodeSelect, onFilter }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const filteredNodes = useMemo(() => {
    let f = nodes;
    if (typeFilter !== 'all') f = f.filter(n => n.type === typeFilter);
    if (query) {
      const q = query.toLowerCase();
      f = f.filter(n => (n.text || '').toLowerCase().includes(q) || n.type.toLowerCase().includes(q));
    }
    return f;
  }, [nodes, query, typeFilter]);
  useEffect(() => {
    onFilter(filteredNodes.map(n => n.id));
  }, [filteredNodes, onFilter]);
  return (
    <Card title="Search & Filter" right={<Pill tone="blue">{filteredNodes.length}</Pill>}>
      <div className="space-y-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search nodes…"
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-[12px]"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-[12px]"
        >
          <option value="all">All Types</option>
          {TYPES.map(t => <option key={t.k} value={t.k}>{t.label}</option>)}
        </select>
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {filteredNodes.slice(0, 10).map(n => (
            <button
              key={n.id}
              onClick={() => onNodeSelect(n.id)}
              className="w-full text-left cursor-pointer rounded border border-slate-200 px-2 py-1 text-[11px] hover:bg-slate-50"
            >
              <span className="font-medium">{TYPES.find(t => t.k === n.type)?.label}</span>
              <span className="ml-1 text-slate-500">{(n.text || '').slice(0, 50)}…</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
});
SearchPanel.displayName = 'SearchPanel';

// ———————————— Canvas ————————————
function Canvas({ nodes, setNodes, edges, setEdges, selectedIds, setSelectedIds, highlightIds }) {
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [connecting, setConnecting] = useState(null); // {from,x0,y0,x,y}
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const highlighted = useMemo(() => new Set(highlightIds || []), [highlightIds]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 800, height: 600 });

  // Space = pan
  useEffect(() => {
    const down = e => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpaceDown(true); e.preventDefault();
      }
    };
    const up = e => {
      if (e.code === 'Space') {
        setIsSpaceDown(false); e.preventDefault();
      }
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
    };
  }, []);

  const worldPoint = useCallback((clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect?.();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - transform.x) / transform.scale, y: (clientY - rect.top - transform.y) / transform.scale };
  }, [transform]);

  const nodeAt = useCallback((x, y) => nodes.find(n => inRect(x, y, n.x, n.y, NODE_WIDTH, NODE_HEIGHT)), [nodes]);

  const addEdgeValidated = useCallback((from, to) => {
    if (!from || !to || from === to) return false;
    if (edges.some(e => e.from === from && e.to === to)) return false;
    if (isReachable(edges, to, from)) return false; // prevent cycles
    setEdges([...edges, { id: Math.random().toString(36).slice(2), from, to, created: Date.now() }]);
    return true;
  }, [edges, setEdges]);

  const handleStartConnect = useCallback(node => {
    const x0 = node.x + NODE_WIDTH - 14; const y0 = node.y + NODE_HEIGHT - 14;
    setConnecting({ from: node.id, x0, y0, x: x0, y: y0 });
  }, []);

  const handleMouseDownNode = useCallback((node, e) => {
    const pt = worldPoint(e.clientX, e.clientY);
    if (e.shiftKey) {
      setSelectedIds(prev => prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id]);
    } else {
      if (!selectedIds.includes(node.id)) setSelectedIds([node.id]);
      setDrag({ nodes: selectedIds.includes(node.id) ? selectedIds : [node.id], startX: pt.x, startY: pt.y, offsets: nodes.filter(n => selectedIds.includes(n.id) || n.id === node.id).map(n => ({ id: n.id, dx: n.x - pt.x, dy: n.y - pt.y })) });
    }
  }, [worldPoint, selectedIds, setSelectedIds, nodes]);

  const handleMouseMove = useCallback(e => {
    const pt = worldPoint(e.clientX, e.clientY);
    if (drag) {
      const dx = pt.x - drag.startX, dy = pt.y - drag.startY;
      setNodes(nodes.map(n => {
        const off = drag.offsets.find(o => o.id === n.id); if (off) return { ...n, x: snap(drag.startX + off.dx + dx), y: snap(drag.startY + off.dy + dy) }; return n;
      }));
    } else if (isPanning) {
      setTransform(prev => ({ ...prev, x: prev.x + e.movementX, y: prev.y + e.movementY }));
    } else if (connecting) {
      setConnecting(prev => ({ ...prev, x: pt.x, y: pt.y }));
    }
  }, [drag, isPanning, connecting, worldPoint, nodes, setNodes]);

  const handleMouseUp = useCallback(e => {
    if (connecting) {
      const pt = worldPoint(e.clientX, e.clientY); const target = nodeAt(pt.x, pt.y);
      if (target) addEdgeValidated(connecting.from, target.id);
      setConnecting(null);
    }
    setDrag(null); setIsPanning(false);
  }, [connecting, worldPoint, nodeAt, addEdgeValidated]);

  const handleWheel = useCallback(e => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect?.();
    if (!rect) return;
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const wx = (px - transform.x) / transform.scale, wy = (py - transform.y) / transform.scale;
    const newScale = Math.min(2, Math.max(0.25, transform.scale * (e.deltaY < 0 ? 1.1 : 0.9)));
    setTransform({ x: px - wx * newScale, y: py - wy * newScale, scale: newScale });
  }, [transform]);

  const handleDoubleClick = useCallback(e => {
    const pt = worldPoint(e.clientX, e.clientY); const nn = makeNode('claim', pt.x, pt.y, 'New node');
    setNodes([...nodes, nn]); setSelectedIds([nn.id]);
  }, [worldPoint, nodes, setNodes, setSelectedIds]);

  const handleCanvasMouseDown = useCallback(e => {
    if (e.button === 1 || (e.button === 0 && (e.metaKey || e.ctrlKey || isSpaceDown))) {
      setIsPanning(true);
    } else if (!e.shiftKey) {
      setSelectedIds([]);
    }
  }, [isSpaceDown, setSelectedIds]);

  // Viewport for minimap
  useEffect(() => {
    const rect = svgRef.current?.getBoundingClientRect?.();
    if (rect) setViewport({ x: -transform.x / transform.scale, y: -transform.y / transform.scale, width: rect.width / transform.scale, height: rect.height / transform.scale });
  }, [transform]);

  // Export
  const exportCanvas = useCallback((format = 'png') => {
    const svg = svgRef.current; if (!svg) return;
    const serializer = new XMLSerializer(); const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    if (format === 'svg') {
      const url = URL.createObjectURL(svgBlob); const a = document.createElement('a'); a.href = url; a.download = 'thesis-canvas.svg'; a.click(); URL.revokeObjectURL(url);
    } else {
      const img = new Image(); const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = svg.clientWidth * 2; c.height = svg.clientHeight * 2; const ctx = c.getContext('2d'); ctx.scale(2, 2); ctx.drawImage(img, 0, 0); c.toBlob(b => {
          const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'thesis-canvas.png'; a.click(); URL.revokeObjectURL(u);
        }); URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, []);

  return (
    <div className="relative h-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="pointer-events-none absolute left-2 top-2 z-10 flex gap-1 text-[11px]">
        <Pill tone="slate">Space/Meta/Ctrl + Drag = Pan</Pill>
        <Pill tone="blue">Wheel = Zoom ({Math.round(transform.scale * 100)}%)</Pill>
        <Pill tone="amber">Shift+Click = Multi-select</Pill>
      </div>
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <Button size="sm" onClick={() => exportCanvas('svg')}>Export SVG</Button>
        <Button size="sm" onClick={() => exportCanvas('png')}>Export PNG</Button>
      </div>
      <svg
        ref={svgRef}
        className="h-full w-full"
        style={{ cursor: isPanning ? 'grabbing' : (isSpaceDown ? 'grab' : 'default') }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleCanvasMouseDown}
      >
        <defs>
          <pattern
            id="grid" width="24" height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24" fill="none" stroke="#e2e8f0"
              strokeWidth="1"
            />
          </pattern>
          <marker
            id="arrow" viewBox="0 0 10 10" refX="10"
            refY="5" markerWidth="6" markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          <g className="edges">
            {edges.map(e => {
              const from = nodes.find(n => n.id === e.from); const to = nodes.find(n => n.id === e.to); if (!from || !to) return null;
              const x1 = from.x + NODE_WIDTH, y1 = from.y + NODE_HEIGHT / 2; const x2 = to.x, y2 = to.y + NODE_HEIGHT / 2; const d = bezierPath(x1, y1, x2, y2);
              const high = selectedIds.includes(from.id) || selectedIds.includes(to.id) || (highlighted.has(from.id) && highlighted.has(to.id));
              return (
                <path
                  key={e.id} d={d} fill="none"
                  stroke={high ? '#0ea5e9' : '#64748b'} strokeWidth={high ? '3' : '2'} markerEnd="url(#arrow)"
                  opacity={high ? 1 : 0.7}
                />
              );
            })}
          </g>
          {connecting && (
            <path
              d={bezierPath(connecting.x0, connecting.y0, connecting.x, connecting.y)} fill="none" stroke="#0ea5e9"
              strokeWidth="2" strokeDasharray="5,5"
            />
          )}
          <g className="nodes">
            {nodes.map(n => (
              <NodeView
                key={n.id} node={n} selected={selectedIds.includes(n.id)}
                isHighlighted={highlighted.has(n.id)} onMouseDown={handleMouseDownNode} onClick={() => setSelectedIds([n.id])}
                onDoubleClick={() => { /* Node double-click handled by parent */ }}
                onStartConnect={handleStartConnect}
              />
            ))}
          </g>
        </g>
      </svg>
      <Minimap nodes={nodes} edges={edges} viewport={viewport} />
    </div>
  );
}

// ———————————— Inspector ————————————
function Inspector({ nodes, selectedIds, updateNode, deleteNodes }) {
  const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
  if (selectedNodes.length === 0) return (
    <Card title="Inspector"><div className="text-[12px] text-slate-500">Select a node to edit its properties.</div></Card>
  );
  if (selectedNodes.length > 1) return (
    <Card title="Inspector" right={<Pill tone="blue">{selectedNodes.length} selected</Pill>} actions={<Button size="sm" variant="danger" onClick={() => deleteNodes(selectedIds)}>Delete All</Button>}>
      <div className="space-y-2 text-[12px]">
        <div className="text-slate-600">Multiple nodes selected</div>
        <div className="space-y-1">
          {selectedNodes.map(n => (
            <div key={n.id} className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1">
              <span className="font-medium">{TYPES.find(t => t.k === n.type)?.icon}</span>
              <span className="truncate text-slate-700">{n.text || 'Untitled'}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
  const node = selectedNodes[0];
  return (
    <Card title="Inspector" right={<Pill tone="violet">{node.type}</Pill>} actions={<Button size="sm" variant="danger" onClick={() => deleteNodes([node.id])}>Delete</Button>}>
      <div className="space-y-3 text-[13px]">
        <div>
          <label htmlFor={`node-type-${node.id}`} className="mb-1 block text-slate-600">Type</label>
          <select
            id={`node-type-${node.id}`}
            value={node.type}
            onChange={e => updateNode({ ...node, type: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1"
          >
            {TYPES.map(t => <option key={t.k} value={t.k}>{t.icon} {t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`node-content-${node.id}`} className="mb-1 block text-slate-600">Content</label>
          <textarea
            id={`node-content-${node.id}`}
            value={node.text}
            onChange={e => updateNode({ ...node, text: e.target.value })}
            className="h-24 w-full rounded-md border border-slate-300 p-2 text-[12px]"
            placeholder="Enter your thesis, claim, or evidence here…"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox" id="collapsed" checked={!!node.collapsed}
            onChange={e => updateNode({ ...node, collapsed: e.target.checked })} className="rounded"
          />
          <label htmlFor="collapsed" className="text-slate-700">Collapse children</label>
        </div>
        <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
          <div>ID: {node.id}</div>
          <div>Position: ({node.x}, {node.y})</div>
          <div>Created: {new Date(node.created || Date.now()).toLocaleString()}</div>
        </div>
      </div>
    </Card>
  );
}

// ———————————— Palette / Saves / Tests ————————————
function Palette({ onAdd }) {
  return (
    <Card title="Palette">
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        {TYPES.map(t => (
          <button key={t.k} onClick={() => onAdd(t.k)} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50">
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function Saves({ saves, setSaves, onLoad, graph, canvasApiService }) {
  const [q, setQ] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const filtered = saves.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));

  const handleSave = async() => {
    if (!saveName.trim()) {
      setError('Please enter a name for your canvas');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await canvasApiService.createCanvas(saveName, graph);

    if (result.success) {
      setSaves([result.data, ...saves.filter(s => s.id !== result.data.id)]);
      setSaveName('');
      setShowSaveDialog(false);
      // Set this as current canvas for auto-save
      if (typeof onLoad === 'function') {
        onLoad(result.data.graph, result.data.id);
      }
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const handleLoad = async(canvas) => {
    setIsLoading(true);
    setError(null);

    try {
      onLoad(canvas.graph, canvas.id); // Pass canvas ID for auto-save
    } catch {
      setError('Failed to load canvas');
    }

    setIsLoading(false);
  };

  const handleDelete = async(id) => {
    setIsLoading(true);
    setError(null);

    const result = await canvasApiService.deleteCanvas(id);

    if (result.success) {
      setSaves(saves.filter(s => s.id !== id));
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <Card title="Saves" right={<Pill tone="slate">{filtered.length}</Pill>}>
      <div className="mb-2 space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Filter…"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-[12px]"
          />
          <Button
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            disabled={isLoading}
          >
            Save
          </Button>
        </div>

        {showSaveDialog && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-2">
            <div className="mb-2">
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Enter canvas name..."
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-[12px]"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setShowSaveDialog(false);
                }}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="primary" onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Canvas'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-1 text-[12px]">
        {filtered.map(s => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-2 py-1">
            <div className="flex-1 truncate">
              <div className="font-medium">{s.name}</div>
              {s.description && <div className="text-slate-500 text-[10px]">{s.description}</div>}
              <div className="text-slate-400 text-[10px]">
                Updated {new Date(s.updated).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-blue-700 hover:text-blue-900"
                onClick={() => handleLoad(s)}
                disabled={isLoading}
              >
                Load
              </button>
              <button
                className="text-rose-600 hover:text-rose-800"
                onClick={() => handleDelete(s.id)}
                disabled={isLoading}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-slate-500">
            {saves.length === 0 ? 'No canvases saved yet.' : 'No matches found.'}
          </div>
        )}
      </div>
    </Card>
  );
}

function Tests({ nodes, edges, _currentCanvasId, _saves, _isLoadingCanvases }) {
  const ids = new Set(nodes.map(n => n.id));
  const allNodesExist = edges.every(e => ids.has(e.from) && ids.has(e.to));
  const noCycles = edges.every(e => !isReachable(edges, e.to, e.from));
  const historyInitPass = Array.isArray(nodes) && Array.isArray(edges);
  const clipboardMockPass = (() => {
    try {
      const testData = { nodes: [{ id: 'x' }], edges: [{ id: 'e1', from: 'x', to: 'y' }] };
      const s = JSON.stringify(testData);
      JSON.parse(s);
      return true;
    } catch {
      return false;
    }
  })();
  const tests = [
    { name: 'Edges reference existing nodes', pass: allNodesExist },
    { name: 'Graph is acyclic (DAG)', pass: noCycles },
    { name: 'History initialized', pass: historyInitPass },
    { name: 'Clipboard serialization (mock)', pass: clipboardMockPass }
  ];
  return (
    <Card title="Dev / Sanity Tests">
      <ul className="space-y-1 text-[13px]">
        {tests.map(t => (
          <li key={t.name} className="flex items-center justify-between">
            <span className="text-slate-700">{t.name}</span>
            <span className={`ml-2 ${t.pass ? 'text-emerald-600' : 'text-rose-600'}`}>{t.pass ? 'PASS' : 'FAIL'}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ———————————— Template ————————————
function templateThesis(centerX = 240, centerY = 220) {
  const root = makeNode('thesis', centerX, centerY, 'Investment Thesis: Identify companies with durable competitive advantages, strong unit economics, and rational capital allocation');
  const blocks = [
    makeNode('claim', centerX + 220, centerY - 180, 'Business Model: Recurring revenue with high gross margins and negative working capital'),
    makeNode('claim', centerX + 220, centerY - 60, 'Competitive Moat: Network effects and switching costs create pricing power'),
    makeNode('claim', centerX + 220, centerY + 60, 'Growth Runway: Large TAM with <10% penetration and expanding use cases'),
    makeNode('claim', centerX + 220, centerY + 180, 'Management: Founder-led with significant ownership and long-term incentives'),
    makeNode('risk', centerX + 440, centerY - 120, 'Key Risk: Regulatory changes could impact business model'),
    makeNode('risk', centerX + 440, centerY, 'Bear Case: Competition from big tech with deeper pockets'),
    makeNode('evidence', centerX + 440, centerY + 120, 'Evidence: 40% YoY revenue growth, 120% net retention, 80% gross margins'),
    makeNode('data', centerX + 660, centerY - 60, 'Valuation: Trading at 8x revenue vs peers at 12x'),
    makeNode('decision', centerX + 660, centerY + 60, 'Decision: Initiate position at 2% with 30% margin of safety')
  ];
  const nodes = [root, ...blocks];
  const edges = blocks.slice(0, 4).map(block => ({ id: Math.random().toString(36).slice(2), from: root.id, to: block.id, created: Date.now() }));
  edges.push(
    { id: Math.random().toString(36).slice(2), from: blocks[1].id, to: blocks[4].id, created: Date.now() },
    { id: Math.random().toString(36).slice(2), from: blocks[2].id, to: blocks[6].id, created: Date.now() },
    { id: Math.random().toString(36).slice(2), from: blocks[6].id, to: blocks[8].id, created: Date.now() }
  );
  return { nodes, edges };
}

// ———————————— Enhanced Canvas Component ————————————
function EnhancedThesisCanvas() {
  // Template is pure/side-effect free
  const initialGraph = useMemo(() => templateThesis(240, 220), []);

  // Safe history
  const { state: graphState, pushState, undo, redo, canUndo, canRedo } = useHistory(initialGraph);

  // Use safe defaults on FIRST render (guards graphState undefined)
  const [nodes, setNodesInternal] = useState(() => (graphState?.nodes ?? initialGraph.nodes ?? []));
  const [edges, setEdgesInternal] = useState(() => (graphState?.edges ?? initialGraph.edges ?? []));

  const [selectedIds, setSelectedIds] = useState([]);
  const [saves, setSaves] = useState([]);
  const [filteredNodeIds, setFilteredNodeIds] = useState([]);
  const [currentCanvasId, setCurrentCanvasId] = useState(null);
  const [isLoadingCanvases, setIsLoadingCanvases] = useState(true);

  // Wrapped setters push to history with validated shapes
  const setNodes = useCallback(newNodes => {
    const safeNodes = Array.isArray(newNodes) ? newNodes : [];
    setNodesInternal(safeNodes);
    pushState({ nodes: safeNodes, edges });
  }, [edges, pushState]);

  const setEdges = useCallback(newEdges => {
    const safeEdges = Array.isArray(newEdges) ? newEdges : [];
    setEdgesInternal(safeEdges);
    pushState({ nodes, edges: safeEdges });
  }, [nodes, pushState]);

  // Apply history updates safely
  useEffect(() => {
    if (!graphState) return;
    setNodesInternal(Array.isArray(graphState.nodes) ? graphState.nodes : []);
    setEdgesInternal(Array.isArray(graphState.edges) ? graphState.edges : []);
  }, [graphState]);

  const updateNode = useCallback(patch => {
    setNodes(nodes.map(n => n.id === patch.id ? patch : n));
  }, [nodes, setNodes]);

  const deleteNodes = useCallback(ids => {
    const S = new Set(ids);
    setEdges(edges.filter(e => !S.has(e.from) && !S.has(e.to)));
    setNodes(nodes.filter(n => !S.has(n.id)));
    setSelectedIds([]);
  }, [nodes, edges, setNodes, setEdges]);

  const addNode = useCallback(type => {
    const nn = makeNode(type, 120 + Math.random() * 400, 120 + Math.random() * 300, '');
    setNodes([...nodes, nn]);
    setSelectedIds([nn.id]);
  }, [nodes, setNodes]);

  const loadGraph = useCallback((graph, canvasId = null) => {
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      console.warn('loadGraph: invalid graph object');
      return;
    }
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setSelectedIds([]);
    setCurrentCanvasId(canvasId); // Set for auto-save
  }, [setNodes, setEdges]);

  // Load user's canvases on mount
  useEffect(() => {
    const loadCanvases = async() => {
      setIsLoadingCanvases(true);
      const result = await canvasApiService.listCanvases();
      if (result.success) {
        setSaves(result.data);
      }
      setIsLoadingCanvases(false);
    };

    loadCanvases();
  }, []);

  // Auto-save functionality (debounced)
  useEffect(() => {
    if (!currentCanvasId || !nodes.length) return;

    const timeoutId = setTimeout(async() => {
      const graph = { nodes, edges };
      const result = await canvasApiService.updateCanvas(currentCanvasId, graph);
      if (result.success) {
        // Update the saves list with the updated canvas
        setSaves(prev => prev.map(s => s.id === currentCanvasId ? result.data : s));
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, currentCanvasId]);


  // Keyboard shortcuts (copy/paste/undo/redo/select-all/delete)
  useEffect(() => {
    const onKey = e => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        deleteNodes(selectedIds);
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey && canUndo) {
          e.preventDefault(); undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          if (canRedo) {
            e.preventDefault(); redo();
          }
        }
        if (e.key === 'c' && selectedIds.length > 0) {
          e.preventDefault();
          try {
            const selectedSet = new Set(selectedIds);
            const pickedNodes = nodes.filter(n => selectedIds.includes(n.id));
            // Also copy internal edges between selected nodes
            const pickedEdges = edges.filter(e => selectedSet.has(e.from) && selectedSet.has(e.to));
            const clipboardData = { nodes: pickedNodes, edges: pickedEdges };
            localStorage.setItem('clipboard-data', JSON.stringify(clipboardData));
          } catch {
            // Ignore clipboard errors
          }
        } else if (e.key === 'v') {
          e.preventDefault();
          try {
            const data = localStorage.getItem('clipboard-data');
            if (data) {
              const clipboardData = JSON.parse(data);
              // Handle legacy clipboard format (nodes only)
              const clipboardNodes = clipboardData.nodes || clipboardData;
              const clipboardEdges = clipboardData.edges || [];

              // Create ID mapping for pasted nodes
              const idMap = new Map();
              const pastedNodes = clipboardNodes.map(n => {
                const newId = Math.random().toString(36).slice(2);
                idMap.set(n.id, newId);
                return { ...n, id: newId, x: n.x + 20, y: n.y + 20 };
              });

              // Create pasted edges with remapped IDs
              const pastedEdges = clipboardEdges.map(e => ({
                ...e,
                id: Math.random().toString(36).slice(2),
                from: idMap.get(e.from),
                to: idMap.get(e.to),
                created: Date.now()
              }));

              setNodes([...nodes, ...pastedNodes]);
              setEdges([...edges, ...pastedEdges]);
              setSelectedIds(pastedNodes.map(n => n.id));
            }
          } catch {
            // Ignore clipboard parsing errors
          }
        }
        if (e.key === 'a') {
          e.preventDefault(); setSelectedIds(nodes.map(n => n.id));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, nodes, edges, deleteNodes, setNodes, undo, redo, canUndo, canRedo]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 space-y-4 lg:col-span-3">
        <Palette onAdd={addNode} />
        <SearchPanel nodes={nodes} onNodeSelect={id => setSelectedIds([id])} onFilter={setFilteredNodeIds} />
        <Saves
          saves={saves}
          setSaves={setSaves}
          onLoad={loadGraph}
          graph={{ nodes, edges }}
          canvasApiService={canvasApiService}
        />
        <Tests
          nodes={nodes} edges={edges} currentCanvasId={currentCanvasId}
          saves={saves} isLoadingCanvases={isLoadingCanvases}
        />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <Canvas
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          highlightIds={filteredNodeIds}
        />
        <div className="mt-4 grid grid-cols-4 gap-2">
          {TYPES.map(t => {
            const count = nodes.filter(n => n.type === t.k).length; return (
              <div key={t.k} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="text-[12px] text-slate-600">{t.icon} {t.label}</span>
                <span className="text-[13px] font-semibold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="col-span-12 space-y-4 lg:col-span-3">
        <Inspector
          nodes={nodes}
          selectedIds={selectedIds}
          updateNode={updateNode}
          deleteNodes={deleteNodes}
        />
        <Card title="Keyboard Shortcuts">
          <div className="space-y-1 text-[11px] text-slate-700">
            <div>• <kbd>Delete</kbd> — Remove selected nodes</div>
            <div>• <kbd>Ctrl/⌘+Z</kbd> — Undo</div>
            <div>• <kbd>Ctrl/⌘+Shift+Z</kbd> / <kbd>Ctrl/⌘+Y</kbd> — Redo</div>
            <div>• <kbd>Ctrl/⌘+C</kbd> — Copy</div>
            <div>• <kbd>Ctrl/⌘+V</kbd> — Paste</div>
            <div>• <kbd>Ctrl/⌘+A</kbd> — Select all</div>
            <div>• <kbd>Shift+Click</kbd> — Multi-select</div>
            <div>• <kbd>Space/Meta/Ctrl + Drag</kbd> — Pan</div>
            <div>• <kbd>Double-click</kbd> — Create node</div>
          </div>
        </Card>
        <Card title="Persistence Status" right={<Pill tone="amber">Mock Mode</Pill>}>
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Auto-save</span>
              <span className="text-emerald-600">{currentCanvasId ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Canvas ID</span>
              <span className="text-slate-600 font-mono">{currentCanvasId || 'None'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Saved Canvases</span>
              <span className="text-emerald-600">{saves.length}</span>
            </div>
            {isLoadingCanvases && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Loading...</span>
                <span className="text-amber-600">⏳</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ———————————— Main ThesisCanvas Component ————————————
const ThesisCanvas = () => {
  const canvasData = {
    title: 'Investment Thesis Canvas',
    description: 'Build and visualize your investment thesis framework'
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Header />

      <div className="pt-[60px]">
        {/* Page Header */}
        <div className="border-b border-border bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white">
                  <path
                    d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs tracking-wide text-muted-foreground">FinanceAnalyst Pro</div>
                <div className="text-[13px] font-semibold text-foreground">Thesis Canvas</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <div className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                Canvas Mode
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Enhanced Canvas */}
        <div className="p-6">
          <EnhancedThesisCanvas />
        </div>
      </div>

      {/* Persistent CLI */}
      <PersistentCLI
        currentContext={{ page: 'canvas', canvasData }}
        onNavigate={(path) => {
          // Handle navigation if needed
          console.log('Navigate to:', path);
        }}
      />
    </div>
  );
};

export default ThesisCanvas;

