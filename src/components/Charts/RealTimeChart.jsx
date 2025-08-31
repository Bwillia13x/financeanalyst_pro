import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Play, Pause, RotateCcw, TrendingUp, TrendingDown, Activity } from 'lucide-react';

import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

// ===== REAL-TIME DATA VISUALIZATION =====

/**
 * Institutional-grade real-time chart component with live data streaming,
 * performance monitoring, and advanced visualization features
 */

const STREAM_STATES = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  PAUSED: 'paused'
};

const UPDATE_FREQUENCIES = {
  REAL_TIME: 100, // 100ms - ultra fast
  HIGH: 500, // 500ms - high frequency
  MEDIUM: 1000, // 1s - medium frequency
  LOW: 5000, // 5s - low frequency
  MANUAL: 0 // Manual updates only
};

export const RealTimeChart = ({
  dataSource,
  title = 'Real-Time Data',
  subtitle,
  symbol,
  initialData = [],
  maxDataPoints = 100,
  updateFrequency = UPDATE_FREQUENCIES.MEDIUM,
  autoStart = true,
  showControls = true,
  showAlerts = true,
  alertThresholds = {},
  onDataUpdate,
  onConnectionChange,
  className,
  ...props
}) => {
  // ===== STATE MANAGEMENT =====
  const [data, setData] = useState(initialData);
  const [streamState, setStreamState] = useState(STREAM_STATES.DISCONNECTED);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [performance, setPerformance] = useState({
    updatesPerSecond: 0,
    latency: 0,
    dataPoints: 0
  });

  // ===== REFS =====
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const lastUpdateTimeRef = useRef(Date.now());
  const updateCountRef = useRef(0);
  const dataBufferRef = useRef([]);

  // ===== CONNECTION MANAGEMENT =====
  const connect = useCallback(async () => {
    if (streamState === STREAM_STATES.CONNECTED) return;

    setStreamState(STREAM_STATES.CONNECTING);
    setConnectionAttempts(prev => prev + 1);

    try {
      // WebSocket connection for real-time data
      if (dataSource.wsUrl) {
        const ws = new WebSocket(dataSource.wsUrl);

        ws.onopen = () => {
          console.log('Real-time connection established');
          setStreamState(STREAM_STATES.CONNECTED);
          onConnectionChange?.(STREAM_STATES.CONNECTED);

          // Subscribe to data stream
          if (symbol) {
            ws.send(
              JSON.stringify({
                type: 'subscribe',
                symbol: symbol,
                channels: ['price', 'volume', 'trades']
              })
            );
          }
        };

        ws.onmessage = event => {
          try {
            const message = JSON.parse(event.data);
            handleDataUpdate(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('Real-time connection closed');
          setStreamState(STREAM_STATES.DISCONNECTED);
          onConnectionChange?.(STREAM_STATES.DISCONNECTED);

          // Auto-reconnect with exponential backoff
          if (connectionAttempts < 5) {
            setTimeout(() => connect(), Math.pow(2, connectionAttempts) * 1000);
          }
        };

        ws.onerror = error => {
          console.error('WebSocket error:', error);
          setStreamState(STREAM_STATES.ERROR);
          onConnectionChange?.(STREAM_STATES.ERROR);
        };

        wsRef.current = ws;
      }
      // Polling fallback
      else if (dataSource.apiUrl) {
        startPolling();
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStreamState(STREAM_STATES.ERROR);
      onConnectionChange?.(STREAM_STATES.ERROR);
    }
  }, [dataSource, symbol, connectionAttempts, onConnectionChange]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setStreamState(STREAM_STATES.DISCONNECTED);
    setIsPlaying(false);
    onConnectionChange?.(STREAM_STATES.DISCONNECTED);
  }, [onConnectionChange]);

  // ===== POLLING FALLBACK =====
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (!isPlaying) return;

      try {
        const response = await fetch(`${dataSource.apiUrl}?symbol=${symbol}`);
        const newData = await response.json();
        handleDataUpdate(newData);
      } catch (error) {
        console.error('Polling error:', error);
        setStreamState(STREAM_STATES.ERROR);
      }
    }, updateFrequency);

    setStreamState(STREAM_STATES.CONNECTED);
  }, [dataSource, symbol, updateFrequency, isPlaying]);

  // ===== DATA HANDLING =====
  const handleDataUpdate = useCallback(
    newData => {
      const now = Date.now();
      const latency = now - (newData.timestamp || now);

      // Update performance metrics
      updateCountRef.current += 1;
      const timeDiff = now - lastUpdateTimeRef.current;
      if (timeDiff >= 1000) {
        setPerformance(prev => ({
          ...prev,
          updatesPerSecond: Math.round((updateCountRef.current / timeDiff) * 1000),
          latency: Math.round(latency),
          dataPoints: dataBufferRef.current.length
        }));
        updateCountRef.current = 0;
        lastUpdateTimeRef.current = now;
      }

      // Process new data
      const processedData = processDataPoint(newData);

      // Add to buffer
      dataBufferRef.current.push({
        ...processedData,
        timestamp: now,
        latency
      });

      // Maintain max data points
      if (dataBufferRef.current.length > maxDataPoints) {
        dataBufferRef.current.shift();
      }

      // Update state
      setData([...dataBufferRef.current]);
      setLastUpdate(new Date());

      // Check alerts
      checkAlerts(processedData);

      // Notify parent
      onDataUpdate?.(processedData, dataBufferRef.current);
    },
    [maxDataPoints, onDataUpdate]
  );

  // ===== DATA PROCESSING =====
  const processDataPoint = useCallback(rawData => {
    // Transform raw data into chart-friendly format
    return {
      time: rawData.time || new Date().toLocaleTimeString(),
      timestamp: rawData.timestamp || Date.now(),
      price: rawData.price || rawData.close || rawData.value || 0,
      volume: rawData.volume || 0,
      high: rawData.high || rawData.price,
      low: rawData.low || rawData.price,
      open: rawData.open || rawData.price,
      close: rawData.close || rawData.price,
      change: rawData.change || 0,
      changePercent: rawData.changePercent || 0,
      // Additional fields for different data types
      bid: rawData.bid,
      ask: rawData.ask,
      spread: rawData.spread,
      marketCap: rawData.marketCap,
      peRatio: rawData.peRatio
    };
  }, []);

  // ===== ALERT SYSTEM =====
  const checkAlerts = useCallback(
    dataPoint => {
      if (!showAlerts) return;

      const newAlerts = [];

      // Price alerts
      if (alertThresholds.priceHigh && dataPoint.price >= alertThresholds.priceHigh) {
        newAlerts.push({
          type: 'price-high',
          message: `Price reached ${dataPoint.price}`,
          value: dataPoint.price,
          threshold: alertThresholds.priceHigh,
          timestamp: new Date()
        });
      }

      if (alertThresholds.priceLow && dataPoint.price <= alertThresholds.priceLow) {
        newAlerts.push({
          type: 'price-low',
          message: `Price dropped to ${dataPoint.price}`,
          value: dataPoint.price,
          threshold: alertThresholds.priceLow,
          timestamp: new Date()
        });
      }

      // Volume alerts
      if (alertThresholds.volumeThreshold && dataPoint.volume >= alertThresholds.volumeThreshold) {
        newAlerts.push({
          type: 'high-volume',
          message: `High volume: ${dataPoint.volume}`,
          value: dataPoint.volume,
          threshold: alertThresholds.volumeThreshold,
          timestamp: new Date()
        });
      }

      // Change alerts
      if (
        alertThresholds.changeThreshold &&
        Math.abs(dataPoint.changePercent) >= alertThresholds.changeThreshold
      ) {
        newAlerts.push({
          type: 'significant-change',
          message: `Price change: ${dataPoint.changePercent >= 0 ? '+' : ''}${dataPoint.changePercent.toFixed(2)}%`,
          value: dataPoint.changePercent,
          threshold: alertThresholds.changeThreshold,
          timestamp: new Date()
        });
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev.slice(0, 4)]); // Keep last 5 alerts
      }
    },
    [showAlerts, alertThresholds]
  );

  // ===== CONTROLS =====
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      setStreamState(STREAM_STATES.PAUSED);
    } else {
      setIsPlaying(true);
      if (streamState === STREAM_STATES.DISCONNECTED) {
        connect();
      } else {
        setStreamState(STREAM_STATES.CONNECTED);
      }
    }
  }, [isPlaying, streamState, connect]);

  const handleReset = useCallback(() => {
    dataBufferRef.current = [];
    setData([]);
    setAlerts([]);
    setPerformance({
      updatesPerSecond: 0,
      latency: 0,
      dataPoints: 0
    });
  }, []);

  // ===== LIFECYCLE =====
  useEffect(() => {
    if (autoStart && isPlaying) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoStart, isPlaying, connect, disconnect]);

  // ===== STATUS INDICATOR =====
  const getStatusIndicator = () => {
    const statusConfig = {
      [STREAM_STATES.CONNECTED]: {
        color: 'text-brand-success',
        icon: Activity,
        text: 'Live'
      },
      [STREAM_STATES.CONNECTING]: {
        color: 'text-yellow-500',
        icon: Activity,
        text: 'Connecting'
      },
      [STREAM_STATES.DISCONNECTED]: {
        color: 'text-foreground-muted',
        icon: Activity,
        text: 'Disconnected'
      },
      [STREAM_STATES.ERROR]: {
        color: 'text-brand-error',
        icon: Activity,
        text: 'Error'
      },
      [STREAM_STATES.PAUSED]: {
        color: 'text-yellow-500',
        icon: Activity,
        text: 'Paused'
      }
    };

    const config = statusConfig[streamState] || statusConfig[STREAM_STATES.DISCONNECTED];
    const Icon = config.icon;

    return (
      <div className={cn('flex items-center gap-2 text-sm', config.color)}>
        <Icon className="w-4 h-4" />
        <span>{config.text}</span>
        {streamState === STREAM_STATES.CONNECTED && (
          <div className="flex items-center gap-1 text-xs text-foreground-muted">
            <span>{performance.updatesPerSecond} updates/s</span>
            <span>•</span>
            <span>{performance.latency}ms latency</span>
          </div>
        )}
      </div>
    );
  };

  // ===== CUSTOM TOOLTIP =====
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <div className="text-sm font-medium text-foreground mb-2">
          {new Date(dataPoint.timestamp).toLocaleString()}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-foreground-secondary">Price:</span>
            <span className="text-sm font-medium text-foreground">
              ${dataPoint.price?.toFixed(2)}
            </span>
          </div>

          {dataPoint.volume && (
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Volume:</span>
              <span className="text-sm font-medium text-foreground">
                {(dataPoint.volume / 1000000).toFixed(1)}M
              </span>
            </div>
          )}

          {dataPoint.changePercent && (
            <div className="flex justify-between">
              <span className="text-sm text-foreground-secondary">Change:</span>
              <span
                className={cn(
                  'text-sm font-medium',
                  dataPoint.changePercent >= 0 ? 'text-brand-success' : 'text-brand-error'
                )}
              >
                {dataPoint.changePercent >= 0 ? '+' : ''}
                {dataPoint.changePercent.toFixed(2)}%
              </span>
            </div>
          )}

          {dataPoint.latency && (
            <div className="flex justify-between border-t border-border pt-1 mt-2">
              <span className="text-xs text-foreground-muted">Latency:</span>
              <span className="text-xs text-foreground-muted">{dataPoint.latency}ms</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===== RENDER =====
  return (
    <Card className={cn('relative', className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbol && <span className="text-brand-accent font-bold">{symbol}</span>}
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-foreground-secondary mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            {getStatusIndicator()}

            {/* Controls */}
            {showControls && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  disabled={streamState === STREAM_STATES.CONNECTING}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis dataKey="time" stroke="#475569" fontSize={12} tick={{ fill: '#475569' }} />
              <YAxis
                stroke="#475569"
                fontSize={12}
                tick={{ fill: '#475569' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Main price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#059669', fill: '#ffffff' }}
                animationDuration={0}
              />

              {/* Volume bars (if available) */}
              {data.some(d => d.volume) && (
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#2563eb"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  yAxisId="volume"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        {showAlerts && alerts.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Recent Alerts</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alerts.slice(0, 3).map((alert, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-md text-sm',
                    alert.type.includes('high') || alert.type.includes('significant')
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  )}
                >
                  {alert.type.includes('price') ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : alert.type.includes('volume') ? (
                    <Activity className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{alert.message}</span>
                  <span className="text-xs opacity-75 ml-auto">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">{performance.updatesPerSecond}</div>
            <div className="text-xs text-foreground-secondary">Updates/sec</div>
          </div>

          <div>
            <div className="text-2xl font-bold text-foreground">{performance.latency}ms</div>
            <div className="text-xs text-foreground-secondary">Latency</div>
          </div>

          <div>
            <div className="text-2xl font-bold text-foreground">{data.length}</div>
            <div className="text-xs text-foreground-secondary">Data Points</div>
          </div>
        </div>

        {/* Connection Info */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-foreground-muted">
            <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            <span>Connection attempts: {connectionAttempts}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ===== REAL-TIME DATA PROVIDER =====

export const RealTimeDataProvider = ({
  children,
  dataSources = [],
  updateFrequency = UPDATE_FREQUENCIES.MEDIUM,
  maxConnections = 5
}) => {
  const [activeConnections, setActiveConnections] = useState(new Map());
  const [globalStats, setGlobalStats] = useState({
    totalConnections: 0,
    activeConnections: 0,
    totalUpdates: 0,
    averageLatency: 0
  });

  const connectionsRef = useRef(new Map());

  // Global connection management
  const connectToSource = useCallback(
    async (sourceId, config) => {
      if (connectionsRef.current.size >= maxConnections) {
        console.warn('Maximum connections reached');
        return;
      }

      try {
        const ws = new WebSocket(config.wsUrl);

        ws.onopen = () => {
          connectionsRef.current.set(sourceId, ws);
          setActiveConnections(prev => new Map(prev.set(sourceId, config)));

          setGlobalStats(prev => ({
            ...prev,
            totalConnections: prev.totalConnections + 1,
            activeConnections: prev.activeConnections + 1
          }));
        };

        ws.onmessage = event => {
          try {
            const data = JSON.parse(event.data);

            // Broadcast data to subscribers
            // Implementation would depend on the subscription system

            setGlobalStats(prev => ({
              ...prev,
              totalUpdates: prev.totalUpdates + 1
            }));
          } catch (error) {
            console.error('Error processing real-time data:', error);
          }
        };

        ws.onclose = () => {
          connectionsRef.current.delete(sourceId);
          setActiveConnections(prev => {
            const newMap = new Map(prev);
            newMap.delete(sourceId);
            return newMap;
          });

          setGlobalStats(prev => ({
            ...prev,
            activeConnections: Math.max(0, prev.activeConnections - 1)
          }));
        };
      } catch (error) {
        console.error('Connection error:', error);
      }
    },
    [maxConnections]
  );

  const disconnectFromSource = useCallback(sourceId => {
    const ws = connectionsRef.current.get(sourceId);
    if (ws) {
      ws.close();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectionsRef.current.forEach(ws => ws.close());
      connectionsRef.current.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      activeConnections,
      globalStats,
      connectToSource,
      disconnectFromSource,
      dataSources
    }),
    [activeConnections, globalStats, connectToSource, disconnectFromSource, dataSources]
  );

  return React.createElement(RealTimeContext.Provider, { value: contextValue }, children);
};

// Context for real-time data sharing
const RealTimeContext = React.createContext();

// Hook to use real-time data
export const useRealTimeData = () => {
  const context = React.useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTimeData must be used within RealTimeDataProvider');
  }
  return context;
};

// ===== EXPORT CONSTANTS =====
export { STREAM_STATES, UPDATE_FREQUENCIES };

export default RealTimeChart;
