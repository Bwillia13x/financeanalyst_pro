import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, MoveHorizontal } from 'lucide-react';

import { Card, CardHeader, CardTitle } from '../components/ui/Card';

const STORAGE_KEY = 'dashboard_layout_v1';

const DEFAULT_WIDGETS = [
  { id: 'w1', type: 'market_overview', title: 'Market Overview', size: 'md' },
  { id: 'w2', type: 'portfolio_summary', title: 'Portfolio Summary', size: 'md' },
  { id: 'w3', type: 'watchlist', title: 'Watchlist', size: 'sm' },
  { id: 'w4', type: 'performance_chart', title: 'Performance', size: 'lg' }
];

const AVAILABLE_WIDGETS = [
  { type: 'market_overview', title: 'Market Overview', size: 'md' },
  { type: 'portfolio_summary', title: 'Portfolio Summary', size: 'md' },
  { type: 'watchlist', title: 'Watchlist', size: 'sm' },
  { type: 'news_feed', title: 'News Feed', size: 'sm' },
  { type: 'performance_chart', title: 'Performance', size: 'lg' },
  { type: 'risk_heatmap', title: 'Risk Heatmap', size: 'lg' }
];

const sizeClass = (size) => {
  switch (size) {
    case 'sm':
      return 'col-span-1';
    case 'md':
      return 'col-span-2';
    case 'lg':
      return 'col-span-4';
    default:
      return 'col-span-2';
  }
};

const clampSize = (s) => (['sm','md','lg'].includes(s) ? s : 'md');

import LiveMarketDashboard from '../components/ui/LiveMarketDashboard';
import LivePriceWidget from '../components/ui/LivePriceWidget';
import MetricCard from '../components/ui/MetricCard';
import SensitivityHeatmap from '../components/ui/charts/SensitivityHeatmap';
import RevenueBreakdown from '../components/ui/charts/RevenueBreakdown';

const ResizeHandle = ({ onStart }) => (
  <div
    className="absolute bottom-2 right-2 w-4 h-4 cursor-se-resize opacity-60 hover:opacity-100"
    onMouseDown={onStart}
    title="Drag to resize"
  >
    <div className="w-full h-full border border-border bg-muted rounded-sm" />
  </div>
);

function WidgetBody({ item }) {
  // Render concrete widget content using existing platform components
  switch (item.type) {
    case 'market_overview':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { dataType: 'stock_price', symbol: 'AAPL', name: 'Apple Inc.' },
              { dataType: 'stock_price', symbol: 'MSFT', name: 'Microsoft Corp.' },
              { dataType: 'fx_rates', symbol: 'EURUSD', name: 'EUR/USD' },
              { dataType: 'commodity_prices', symbol: 'GOLD', name: 'Gold' }
            ].map(k => (
              <LivePriceWidget key={k.symbol} {...k} size="small" showChart={true} />
            ))}
          </div>
        </div>
      );
    case 'portfolio_summary':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard label="Total Value" value="$1,245,320" color="primary" />
          <MetricCard label="YTD Return" value="+12.4%" color="success" />
          <MetricCard label="Volatility" value="0.22" color="warning" />
        </div>
      );
    case 'watchlist':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { dataType: 'stock_price', symbol: 'NVDA', name: 'NVIDIA' },
            { dataType: 'stock_price', symbol: 'AMZN', name: 'Amazon' },
            { dataType: 'stock_price', symbol: 'META', name: 'Meta' },
            { dataType: 'stock_price', symbol: 'TSLA', name: 'Tesla' }
          ].map(k => (
            <LivePriceWidget key={k.symbol} {...k} size="small" showChart={true} />
          ))}
        </div>
      );
    case 'news_feed':
      return (
        <div className="space-y-2">
          {[
            { h: 'Markets rally on tech strength', ts: 'Just now' },
            { h: 'Fed minutes point to steady rates', ts: '12m ago' },
            { h: 'Energy sector leads gains', ts: '1h ago' }
          ].map((n, i) => (
            <div key={i} className="p-3 rounded-md border border-border bg-card">
              <div className="text-sm text-foreground font-medium">{n.h}</div>
              <div className="text-xs text-foreground-secondary">{n.ts}</div>
            </div>
          ))}
        </div>
      );
    case 'performance_chart':
      return (
        <RevenueBreakdown
          title="Revenue/Perf Mix"
          data={[
            { name: 'Equities', value: 1200000 },
            { name: 'Fixed Income', value: 520000 },
            { name: 'Alternatives', value: 330000 }
          ]}
          height={240}
          showLegend={false}
        />
      );
    case 'risk_heatmap':
      return (
        <SensitivityHeatmap
          title="Risk Heatmap"
          data={[
            [1.2, 0.8, -0.6, -1.1],
            [0.4, -0.2, -0.8, -1.5],
            [1.7, 0.9, 0.2, -0.4]
          ]}
          xAxisLabels={['-2%', '-1%', '+1%', '+2%']}
          yAxisLabels={['Rates', 'FX', 'Commodities']}
        />
      );
    default:
      return <div className="text-sm text-foreground-secondary">Unknown widget</div>;
  }
}

function SortableCard({ item, onRemove, onResize, dragHandleProps }) {
  return (
    <Card className="h-full w-full border-border" padding="sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-foreground-secondary select-none" {...dragHandleProps}>
          <GripVertical className="w-4 h-4" />
          <span className="text-sm font-medium">{item.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 text-xs border border-border rounded hover:bg-muted"
            onClick={() => onResize(item.id, item.size === 'sm' ? 'md' : item.size === 'md' ? 'lg' : 'sm')}
            title="Cycle size"
          >
            <MoveHorizontal className="w-3 h-3 inline mr-1" />Size: {item.size.toUpperCase()}
          </button>
          <button
            className="p-1 text-destructive border border-destructive/40 rounded hover:bg-destructive/10"
            onClick={() => onRemove(item.id)}
            aria-label="Remove widget"
            title="Remove widget"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="relative min-h-[140px] rounded-md border border-border text-sm p-3 bg-card">
        <WidgetBody item={item} />
        <ResizableSizer id={item.id} size={item.size} onResize={onResize} />
      </div>
    </Card>
  );
}

function ResizableSizer({ id, size, onResize }) {
  const [resizing, setResizing] = useState(false);
  const startXRef = React.useRef(0);
  const currentSizeRef = React.useRef(size);

  useEffect(() => { currentSizeRef.current = size; }, [size]);

  const onMouseDown = (e) => {
    e.stopPropagation();
    setResizing(true);
    startXRef.current = e.clientX;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!resizing) return;
    const dx = e.clientX - startXRef.current;
    if (dx > 80) {
      // grow one step
      const next = currentSizeRef.current === 'sm' ? 'md' : currentSizeRef.current === 'md' ? 'lg' : 'lg';
      if (next !== currentSizeRef.current) {
        onResize(id, next);
        startXRef.current = e.clientX;
      }
    } else if (dx < -80) {
      // shrink one step
      const next = currentSizeRef.current === 'lg' ? 'md' : currentSizeRef.current === 'md' ? 'sm' : 'sm';
      if (next !== currentSizeRef.current) {
        onResize(id, next);
        startXRef.current = e.clientX;
      }
    }
  };
  const onMouseUp = () => {
    setResizing(false);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return <ResizeHandle onStart={onMouseDown} />;
}

function SortableItem({ item, onRemove, onResize }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div ref={setNodeRef} style={style} className={sizeClass(item.size)}>
      <SortableCard item={item} onRemove={onRemove} onResize={onResize} dragHandleProps={{...attributes, ...listeners}} />
    </div>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_WIDGETS;
  });
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const onRemove = useCallback((id) => setItems(prev => prev.filter(w => w.id !== id)), []);
  const onResize = useCallback((id, size) => setItems(prev => prev.map(w => (w.id === id ? { ...w, size: clampSize(size) } : w))), []);
  const addWidget = useCallback((w) => setItems(prev => [...prev, { id: `w-${Date.now()}`, type: w.type, title: w.title, size: clampSize(w.size) }]), []);

  const handleDragStart = (event) => setActiveId(event.active.id);
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    setItems(arrayMove(items, oldIndex, newIndex));
  };

  // Simple sortable wrapper id list
  const ids = useMemo(() => items.map(i => i.id), [items]);

  // Palette of available widgets
  const palette = useMemo(() => AVAILABLE_WIDGETS, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Drag to rearrange • Resize via Size control</span>
        </div>
      </div>

      <Card className="mb-6" padding="sm">
        <div className="flex items-center gap-2 flex-wrap">
          {palette.map(w => (
            <button
              key={w.id}
              onClick={() => addWidget(w)}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-md hover:bg-muted text-sm"
              title={`Add ${w.title}`}
            >
              <Plus className="w-4 h-4" /> {w.title}
            </button>
          ))}
        </div>
      </Card>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-4 auto-rows-fr">
            {items.map(item => (
              <SortableItem key={item.id} item={item} onRemove={onRemove} onResize={onResize} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay />
      </DndContext>
    </div>
  );
}
