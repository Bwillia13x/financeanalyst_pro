import Icon from '../../../components/AppIcon';

const ConnectionStatus = ({ connectionHealth, lastUpdate }) => {
  const getStatusColor = status => {
    switch (status) {
      case 'excellent':
        return 'text-success';
      case 'good':
        return 'text-primary';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'excellent':
        return 'Wifi';
      case 'good':
        return 'Wifi';
      case 'warning':
        return 'WifiOff';
      case 'error':
        return 'AlertTriangle';
      default:
        return 'Wifi';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Icon
          name={getStatusIcon(connectionHealth.overall)}
          size={16}
          className={getStatusColor(connectionHealth.overall)}
        />
        <span className="text-sm font-medium text-foreground">
          Connection: {connectionHealth.overall}
        </span>
      </div>

      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Icon name="Clock" size={14} />
        <span>Last update: {lastUpdate}</span>
      </div>

      <div className="flex items-center space-x-1">
        {Object.entries(connectionHealth.sources).map(([source, status]) => (
          <div
            key={source}
            className={`w-3 h-3 rounded-full ${
              status === 'connected'
                ? 'bg-success'
                : status === 'warning'
                  ? 'bg-warning'
                  : 'bg-destructive'
            }`}
            title={`${source}: ${status}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ConnectionStatus;
