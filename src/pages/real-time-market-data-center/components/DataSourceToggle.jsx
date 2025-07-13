import React from 'react';


const DataSourceToggle = ({ dataSources, onToggle }) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-foreground">Data Sources:</span>
      <div className="flex items-center space-x-2">
        {dataSources.map((source) => (
          <button
            key={source.id}
            onClick={() => onToggle(source.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-smooth
              ${source.enabled 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }
            `}
          >
            <div className={`w-2 h-2 rounded-full ${
              source.status === 'connected' ? 'bg-success' :
              source.status === 'warning' ? 'bg-warning' : 'bg-error'
            }`} />
            <span>{source.name}</span>
            <span className="text-xs opacity-75">{source.latency}ms</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DataSourceToggle;