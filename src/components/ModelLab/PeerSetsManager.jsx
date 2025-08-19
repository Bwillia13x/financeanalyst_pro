import { Plus, Users, Trash2, BarChart3, Target } from 'lucide-react';
import React, { useState, useMemo } from 'react';

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

const PeerCompany = ({ peer, onUpdate, onRemove, isEditable = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const _formatCurrency = (value) => {
    if (!value) return '—';
    return value >= 1e9 ? `$${(value / 1e9).toFixed(1)}B` :
      value >= 1e6 ? `$${(value / 1e6).toFixed(0)}M` :
        `$${value.toLocaleString()}`;
  };

  const formatMultiple = (value) => {
    if (!value) return '—';
    return `${value.toFixed(1)}x`;
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50">
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-5 h-5 rounded bg-white hover:bg-slate-50 flex items-center justify-center text-[11px] transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>
            <span className="text-[12px] font-medium">{peer.name}</span>
            <Pill size="xs">{peer.ticker}</Pill>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-600">
              {formatMultiple(peer.evMultiple)} EV/Revenue
            </span>
            {isEditable && (
              <button
                onClick={() => onRemove(peer.id)}
                className="w-5 h-5 rounded bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`peer-${peer.id}-name`} className="block text-[10px] font-medium text-slate-600 mb-1">
                  Company Name
                </label>
                <input
                  id={`peer-${peer.id}-name`}
                  type="text"
                  value={peer.name}
                  onChange={(e) => onUpdate(peer.id, { name: e.target.value })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label htmlFor={`peer-${peer.id}-ticker`} className="block text-[10px] font-medium text-slate-600 mb-1">
                  Ticker
                </label>
                <input
                  id={`peer-${peer.id}-ticker`}
                  type="text"
                  value={peer.ticker}
                  onChange={(e) => onUpdate(peer.id, { ticker: e.target.value.toUpperCase() })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor={`peer-${peer.id}-marketcap`} className="block text-[10px] font-medium text-slate-600 mb-1">
                  Market Cap
                </label>
                <input
                  id={`peer-${peer.id}-marketcap`}
                  type="number"
                  value={peer.marketCap || 0}
                  onChange={(e) => onUpdate(peer.id, { marketCap: parseFloat(e.target.value) || 0 })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label htmlFor={`peer-${peer.id}-revenue`} className="block text-[10px] font-medium text-slate-600 mb-1">
                  Revenue
                </label>
                <input
                  id={`peer-${peer.id}-revenue`}
                  type="number"
                  value={peer.revenue || 0}
                  onChange={(e) => onUpdate(peer.id, { revenue: parseFloat(e.target.value) || 0 })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label htmlFor={`peer-${peer.id}-evmultiple`} className="block text-[10px] font-medium text-slate-600 mb-1">
                  EV/Revenue
                </label>
                <input
                  id={`peer-${peer.id}-evmultiple`}
                  type="number"
                  step="0.1"
                  value={peer.evMultiple || 0}
                  onChange={(e) => onUpdate(peer.id, { evMultiple: parseFloat(e.target.value) || 0 })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`peer-${peer.id}-sector`} className="block text-[10px] font-medium text-slate-600 mb-1">
                  Sector
                </label>
                <select
                  id={`peer-${peer.id}-sector`}
                  value={peer.sector || ''}
                  onChange={(e) => onUpdate(peer.id, { sector: e.target.value })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                >
                  <option value="">Select sector...</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Consumer Discretionary">Consumer Discretionary</option>
                  <option value="Industrials">Industrials</option>
                  <option value="Energy">Energy</option>
                  <option value="Materials">Materials</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Utilities">Utilities</option>
                </select>
              </div>
              <div>
                <label htmlFor={`peer-${peer.id}-geography`} className="block text-[10px] font-medium text-slate-600 mb-1">
                  Geography
                </label>
                <select
                  id={`peer-${peer.id}-geography`}
                  value={peer.geography || ''}
                  onChange={(e) => onUpdate(peer.id, { geography: e.target.value })}
                  className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  disabled={!isEditable}
                >
                  <option value="">Select geography...</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                  <option value="Latin America">Latin America</option>
                  <option value="Global">Global</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor={`peer-${peer.id}-notes`} className="block text-[10px] font-medium text-slate-600 mb-1">
                Notes
              </label>
              <textarea
                id={`peer-${peer.id}-notes`}
                value={peer.notes || ''}
                onChange={(e) => onUpdate(peer.id, { notes: e.target.value })}
                className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded h-12 resize-none"
                disabled={!isEditable}
                placeholder="Additional notes about this peer..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PeerSetsManager = ({ models = [], onPeerSetSave }) => {
  const [peerSets, setPeerSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [showNewSet, setShowNewSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  const createNewPeerSet = () => {
    if (!newSetName.trim()) return;

    const newSet = {
      id: `peerSet_${Date.now()}`,
      name: newSetName.trim(),
      description: '',
      peers: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    setPeerSets(prev => [...prev, newSet]);
    setSelectedSet(newSet.id);
    setNewSetName('');
    setShowNewSet(false);
  };

  const addPeerToPeerSet = (peerSetId) => {
    const newPeer = {
      id: `peer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: '',
      ticker: '',
      marketCap: 0,
      revenue: 0,
      evMultiple: 0,
      sector: '',
      geography: '',
      notes: '',
      createdAt: new Date().toISOString()
    };

    setPeerSets(prev => prev.map(set =>
      set.id === peerSetId
        ? {
          ...set,
          peers: [...set.peers, newPeer],
          lastUpdated: new Date().toISOString()
        }
        : set
    ));
  };

  const updatePeer = (peerSetId, peerId, updates) => {
    setPeerSets(prev => prev.map(set =>
      set.id === peerSetId
        ? {
          ...set,
          peers: set.peers.map(peer =>
            peer.id === peerId ? { ...peer, ...updates } : peer
          ),
          lastUpdated: new Date().toISOString()
        }
        : set
    ));
  };

  const removePeer = (peerSetId, peerId) => {
    setPeerSets(prev => prev.map(set =>
      set.id === peerSetId
        ? {
          ...set,
          peers: set.peers.filter(peer => peer.id !== peerId),
          lastUpdated: new Date().toISOString()
        }
        : set
    ));
  };

  const deletePeerSet = (peerSetId) => {
    setPeerSets(prev => prev.filter(set => set.id !== peerSetId));
    if (selectedSet === peerSetId) {
      setSelectedSet(null);
    }
  };

  const currentSet = peerSets.find(set => set.id === selectedSet);

  // Calculate peer set statistics
  const peerSetStats = useMemo(() => {
    if (!currentSet?.peers.length) return null;

    const multiples = currentSet.peers
      .map(peer => peer.evMultiple)
      .filter(m => m > 0)
      .sort((a, b) => a - b);

    if (!multiples.length) return null;

    return {
      count: multiples.length,
      min: multiples[0],
      max: multiples[multiples.length - 1],
      median: multiples.length % 2 === 0
        ? (multiples[multiples.length / 2 - 1] + multiples[multiples.length / 2]) / 2
        : multiples[Math.floor(multiples.length / 2)],
      average: multiples.reduce((sum, val) => sum + val, 0) / multiples.length,
      percentile25: multiples[Math.floor(multiples.length * 0.25)],
      percentile75: multiples[Math.floor(multiples.length * 0.75)]
    };
  }, [currentSet]);

  const applyPeerSetToModel = (modelId) => {
    if (!currentSet || !peerSetStats) return;

    const model = models.find(m => m.id === modelId);
    if (!model) return;

    // Apply median multiple as benchmark
    const benchmarkMultiple = peerSetStats.median;
    const revenue = model.assumptions?.rev0 || 0;
    const benchmarkValue = revenue * benchmarkMultiple;

    // Create a comparison analysis
    const comparison = {
      modelId,
      peerSetId: currentSet.id,
      appliedAt: new Date().toISOString(),
      benchmarkMultiple,
      benchmarkValue,
      modelValue: model.outputs?.ev || 0,
      difference: benchmarkValue - (model.outputs?.ev || 0),
      percentageDifference: model.outputs?.ev
        ? ((benchmarkValue - model.outputs.ev) / model.outputs.ev) * 100
        : 0
    };

    if (onPeerSetSave) {
      onPeerSetSave(comparison);
    }
  };

  return (
    <Card
      title="Peer Sets Manager"
      right={
        <div className="flex items-center gap-2">
          <Pill tone="blue">{peerSets.length} sets</Pill>
          {currentSet && (
            <Pill tone="green">{currentSet.peers.length} peers</Pill>
          )}
          <button
            onClick={() => setShowNewSet(true)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Set
          </button>
        </div>
      }
    >
      {/* New peer set form */}
      {showNewSet && (
        <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-medium">Create New Peer Set</h4>
            <button
              onClick={() => setShowNewSet(false)}
              className="w-5 h-5 rounded bg-white hover:bg-slate-50 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Peer set name..."
              className="flex-1 text-[11px] px-2 py-1 border border-slate-200 rounded"
              onKeyPress={(e) => e.key === 'Enter' && createNewPeerSet()}
            />
            <button
              onClick={createNewPeerSet}
              disabled={!newSetName.trim()}
              className="px-3 py-1 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Peer set selector */}
      <div className="mb-4">
        <div className="flex gap-1 flex-wrap">
          {peerSets.map(set => (
            <button
              key={set.id}
              onClick={() => setSelectedSet(set.id)}
              className={`px-3 py-1 text-[11px] rounded border transition-colors ${
                selectedSet === set.id
                  ? 'border-blue-300 bg-blue-100 text-blue-700'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              {set.name} ({set.peers.length})
            </button>
          ))}
        </div>
      </div>

      {/* Selected peer set management */}
      {currentSet ? (
        <div className="space-y-4">
          {/* Peer set metadata */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <input
              type="text"
              value={currentSet.name}
              onChange={(e) => setPeerSets(prev => prev.map(set =>
                set.id === currentSet.id ? { ...set, name: e.target.value } : set
              ))}
              className="w-full text-[12px] font-medium px-2 py-1 border border-slate-200 rounded mb-2"
            />
            <textarea
              value={currentSet.description}
              onChange={(e) => setPeerSets(prev => prev.map(set =>
                set.id === currentSet.id ? { ...set, description: e.target.value } : set
              ))}
              className="w-full text-[11px] px-2 py-1 border border-slate-200 rounded h-16 resize-none"
              placeholder="Peer set description..."
            />
          </div>

          {/* Peer set statistics */}
          {peerSetStats && (
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-[11px] font-medium text-emerald-800 mb-2">
                <BarChart3 className="w-3 h-3 inline mr-1" />
                Multiple Statistics (EV/Revenue)
              </div>
              <div className="grid grid-cols-5 gap-3 text-[10px]">
                <div className="text-center">
                  <div className="font-bold text-[12px]">{peerSetStats.min.toFixed(1)}x</div>
                  <div className="text-emerald-700">Min</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[12px]">{peerSetStats.percentile25.toFixed(1)}x</div>
                  <div className="text-emerald-700">P25</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[12px]">{peerSetStats.median.toFixed(1)}x</div>
                  <div className="text-emerald-700">Median</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[12px]">{peerSetStats.percentile75.toFixed(1)}x</div>
                  <div className="text-emerald-700">P75</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[12px]">{peerSetStats.max.toFixed(1)}x</div>
                  <div className="text-emerald-700">Max</div>
                </div>
              </div>
            </div>
          )}

          {/* Peers list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[12px] font-medium">Peer Companies</h4>
              <button
                onClick={() => addPeerToPeerSet(currentSet.id)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Peer
              </button>
            </div>

            <div className="space-y-2">
              {currentSet.peers.map(peer => (
                <PeerCompany
                  key={peer.id}
                  peer={peer}
                  onUpdate={(peerId, updates) => updatePeer(currentSet.id, peerId, updates)}
                  onRemove={(peerId) => removePeer(currentSet.id, peerId)}
                />
              ))}

              {currentSet.peers.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-[13px]">No peer companies added yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Add peer companies to build your comparable set
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Apply to models */}
          {models.length > 0 && peerSetStats && (
            <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
              <div className="text-[11px] font-medium text-amber-800 mb-2">
                Apply to Models
              </div>
              <div className="grid grid-cols-2 gap-2">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => applyPeerSetToModel(model.id)}
                    className="flex items-center justify-between p-2 bg-white border border-amber-200 rounded hover:bg-amber-50 transition-colors"
                  >
                    <span className="text-[11px]">{model.name || 'Untitled'}</span>
                    <Target className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (onPeerSetSave) onPeerSetSave(currentSet);
              }}
              className="flex-1 px-3 py-2 text-[11px] bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
            >
              Save Peer Set
            </button>
            <button
              onClick={() => deletePeerSet(currentSet.id)}
              className="px-3 py-2 text-[11px] bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Delete Set
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-[13px]">No peer set selected</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Create or select a peer set to manage comparable companies
          </p>
        </div>
      )}
    </Card>
  );
};

export default PeerSetsManager;
