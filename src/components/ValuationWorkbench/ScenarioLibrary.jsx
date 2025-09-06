import { Card } from 'src/components/ui/UIHelpers.jsx';
import PresetButton from '../ui/PresetButton';

const ScenarioLibrary = ({
  scenarios,
  setScenarios,
  assumptions,
  setAssumptions,
  rows,
  valuation
}) => {
  const save = () => {
    const id = Math.random().toString(36).slice(2);
    const scenario = {
      id,
      name: `${assumptions.name} • ${new Date().toISOString().slice(0, 10)}`,
      assumptions: { ...assumptions },
      created: new Date().toISOString()
    };
    setScenarios([scenario, ...scenarios].slice(0, 10));
  };

  const load = scenario => setAssumptions({ ...scenario.assumptions });

  const del = id => setScenarios(scenarios.filter(x => x.id !== id));

  const exportCSV = () => {
    const head = 'year,revenue,ebit%,ebit,nopat,reinvest,fcff,dep,capex,dnwc\n';
    const body = rows
      .map(
        r =>
          `${r.year},${r.revenue.toFixed(2)},${(100 * r.ebitMargin).toFixed(2)}%,${r.ebit.toFixed(2)},${r.nopat.toFixed(2)},${r.reinvest.toFixed(2)},${r.fcff.toFixed(2)},${r.dep.toFixed(2)},${r.capex.toFixed(2)},${r.dNWC.toFixed(2)}`
      )
      .join('\n');
    const foot = `\nEV,${valuation.ev.toFixed(2)}\nEquity,${valuation.equity.toFixed(2)}\nPerShare,${valuation.perShare.toFixed(2)}\n`;

    const blob = new Blob([head + body + foot], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a');
    aEl.href = url;
    aEl.download = 'valuation.csv';
    aEl.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ scenarios }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a');
    aEl.href = url;
    aEl.download = 'scenarios.json';
    aEl.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.scenarios && Array.isArray(data.scenarios)) {
          // Merge imported scenarios with existing ones, avoiding duplicates
          const existingIds = new Set(scenarios.map(s => s.id));
          const newScenarios = data.scenarios.filter(s => !existingIds.has(s.id));
          setScenarios([...newScenarios, ...scenarios].slice(0, 20)); // Keep max 20 scenarios
        }
      } catch (error) {
        console.error('Failed to import JSON:', error);
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  return (
    <Card
      title="Scenario Library"
      right={
        <PresetButton onClick={save} size="sm">Save Current</PresetButton>
      }
    >
      <div className="flex items-center justify-between text-[12px] mb-2">
        <div className="text-foreground-secondary">{scenarios.length} saved</div>
        <div className="flex items-center gap-2">
          <PresetButton onClick={exportCSV} size="sm">Export CSV</PresetButton>
          <PresetButton onClick={exportJSON} size="sm">Export JSON</PresetButton>
          <label className="cursor-pointer">
            <PresetButton size="sm">Import JSON</PresetButton>
            <input type="file" accept=".json" onChange={importJSON} className="hidden" />
          </label>
        </div>
      </div>
      <ul className="space-y-1 text-[12px]">
        {scenarios.map(s => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded border border-border px-2 py-1"
          >
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{s.name}</span>
              <span className="text-foreground-secondary">{new Date(s.created).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => load(s)}
                className="rounded-md border border-border bg-card px-2 py-1 hover:bg-muted"
              >
                Load
              </button>
              <button onClick={() => del(s.id)} className="text-destructive hover:opacity-80">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default ScenarioLibrary;
