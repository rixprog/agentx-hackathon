import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Activity, 
  HardDrive, 
  Database, 
  Thermometer, 
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
  running_processes: number;
  uptime: string;
  total_memory_gb: number;
  used_memory_gb: number;
  total_disk_gb: number;
  used_disk_gb: number;
}

interface HistoricalMetric {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
  running_processes: number;
  power_consumption: number;
  network_bytes_sent: number;
  network_bytes_recv: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
}

interface HistoricalData {
  metrics: HistoricalMetric[];
  time_range: string;
}

interface CircularProgressProps {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  icon: React.ReactNode;
  unit?: string;
  subtitle?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size,
  strokeWidth,
  color,
  label,
  icon,
  unit = '%',
  subtitle
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (value / max) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}22)` }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-white">
            {value}{unit}
          </div>
          {subtitle && (
            <div className="text-xs text-white/60">{subtitle}</div>
          )}
        </div>
        {/* Icon overlay */}
        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-orange-500 rounded-full p-2 shadow-xl">
          {icon}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-white/80">{label}</div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1h');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '1d', label: 'Last Day' },
    { value: '1w', label: 'Last Week' },
    { value: '1m', label: 'Last Month' }
  ];

  const fetchCurrentMetrics = async () => {
    try {
      const response = await fetch('/api/system-metrics');
      if (!response.ok) throw new Error('Failed to fetch current metrics');
      const data = await response.json();
      setCurrentMetrics(data);
    } catch (err) {
      console.error('Error fetching current metrics:', err);
      setError('Failed to load current metrics');
    }
  };

  const fetchHistoricalMetrics = async (timeRange: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/historical-metrics/${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch historical metrics');
      const data = await response.json();
      setHistoricalData(data);
    } catch (err) {
      console.error('Error fetching historical metrics:', err);
      setError('Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentMetrics();
    fetchHistoricalMetrics(selectedTimeRange);
    
    // Set up polling for current metrics
    const interval = setInterval(fetchCurrentMetrics, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchHistoricalMetrics(selectedTimeRange);
  }, [selectedTimeRange]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-0f1923 via-1a2942 to-132847 items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <p className="text-red-300 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-0f1923 via-1a2942 to-132847 relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-pink-500/8 rounded-full filter blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-500/8 to-cyan-500/6 rounded-full filter blur-3xl animate-pulse pointer-events-none" style={{animationDelay: '1s'}}></div>
      
      {/* Main Dashboard Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Time Range Selector */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-lg p-4">
              <Clock className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white tracking-wide">Time Range:</span>
              <div className="flex space-x-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTimeRange(option.value)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                      selectedTimeRange === option.value
                        ? 'bg-white/20 backdrop-blur-xl border border-white/30 text-white shadow-lg'
                        : 'bg-white/8 backdrop-blur-xl text-white/70 hover:bg-white/12 border border-white/15'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Metrics Cards with Circular Progress */}
          {currentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* CPU Usage */}
              <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-lg p-6 shadow-lg hover:shadow-xl hover:bg-white/12 transition-all">
                <CircularProgress
                  value={currentMetrics.cpu_usage}
                  max={100}
                  size={120}
                  strokeWidth={8}
                  color={currentMetrics.cpu_usage > 80 ? "#ef4444" : currentMetrics.cpu_usage > 60 ? "#f59e0b" : "#10b981"}
                  label="CPU Usage"
                  icon={<Activity className="w-4 h-4 text-white" />}
                  subtitle="Processing"
                />
              </div>

              {/* Memory Usage */}
              <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:bg-white/12 transition-all">
                <CircularProgress
                  value={currentMetrics.memory_usage}
                  max={100}
                  size={120}
                  strokeWidth={8}
                  color={currentMetrics.memory_usage > 80 ? "#ef4444" : currentMetrics.memory_usage > 60 ? "#f59e0b" : "#10b981"}
                  label="Memory Usage"
                  icon={<Database className="w-4 h-4 text-white" />}
                  subtitle={`${currentMetrics.used_memory_gb}GB / ${currentMetrics.total_memory_gb}GB`}
                />
              </div>

              {/* Disk Usage */}
              <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:bg-white/12 transition-all">
                <CircularProgress
                  value={currentMetrics.disk_usage}
                  max={100}
                  size={120}
                  strokeWidth={8}
                  color={currentMetrics.disk_usage > 80 ? "#ef4444" : currentMetrics.disk_usage > 60 ? "#f59e0b" : "#10b981"}
                  label="Disk Usage"
                  icon={<HardDrive className="w-4 h-4 text-white" />}
                  subtitle={`${currentMetrics.used_disk_gb}GB / ${currentMetrics.total_disk_gb}GB`}
                />
              </div>

              {/* Temperature */}
              <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:bg-white/12 transition-all">
                <CircularProgress
                  value={currentMetrics.temperature}
                  max={100}
                  size={120}
                  strokeWidth={8}
                  color={currentMetrics.temperature > 70 ? "#ef4444" : currentMetrics.temperature > 50 ? "#f59e0b" : "#10b981"}
                  label="Temperature"
                  icon={<Thermometer className="w-4 h-4 text-white" />}
                  unit="°C"
                  subtitle="CPU Temp"
                />
              </div>
            </div>
          )}

          {/* Historical Charts */}
          {historicalData && historicalData.metrics.length > 0 && (
            <div className="space-y-8">
              {/* CPU and Memory Chart */}
              <div className="bg-white/8 backdrop-blur-2xl border border-white/15 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bebas text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Activity className="w-5 h-5 text-c3ff16" />
                  CPU & Memory Usage
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTimestamp}
                      tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.6)' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.6)' }} />
                    <Tooltip 
                      labelFormatter={formatTimestamp}
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 25, 35, 0.95)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        color: '#ffffff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cpu_usage" 
                      stroke="#5F5CE5" 
                      strokeWidth={2}
                      name="CPU Usage (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory_usage" 
                      stroke="#FFE816" 
                      strokeWidth={2}
                      name="Memory Usage (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Power Consumption Chart */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bebas text-2e2e2e mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Zap className="w-5 h-5 text-ffd9800" />
                  Power Consumption
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData.metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 46, 46, 0.2)" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTimestamp}
                      tick={{ fontSize: 12, fill: '#2e2e2e' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#2e2e2e' }} />
                    <Tooltip 
                      labelFormatter={formatTimestamp}
                      formatter={(value: number) => [`${value.toFixed(1)}W`, 'Power']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        borderRadius: '8px',
                        color: '#2e2e2e'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="power_consumption" 
                      stroke="#FFE816" 
                      fill="rgba(255, 232, 22, 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Network Activity Chart */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bebas text-2e2e2e mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Activity className="w-5 h-5 text-f79cff" />
                  Network Activity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 46, 46, 0.2)" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTimestamp}
                      tick={{ fontSize: 12, fill: '#2e2e2e' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#2e2e2e' }} />
                    <Tooltip 
                      labelFormatter={formatTimestamp}
                      formatter={(value: number) => [formatBytes(value), '']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        borderRadius: '8px',
                        color: '#2e2e2e'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="network_bytes_sent" 
                      stroke="#5F5CE5" 
                      strokeWidth={2}
                      name="Bytes Sent"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="network_bytes_recv" 
                      stroke="#F79CFF" 
                      strokeWidth={2}
                      name="Bytes Received"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Disk I/O Chart */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bebas text-2e2e2e mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <HardDrive className="w-5 h-5 text-fd9800" />
                  Disk I/O Activity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData.metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 46, 46, 0.2)" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTimestamp}
                      tick={{ fontSize: 12, fill: '#2e2e2e' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#2e2e2e' }} />
                    <Tooltip 
                      labelFormatter={formatTimestamp}
                      formatter={(value: number) => [formatBytes(value), '']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        borderRadius: '8px',
                        color: '#2e2e2e'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="disk_read_bytes" 
                      stroke="#059669" 
                      strokeWidth={2}
                      name="Read Bytes"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="disk_write_bytes" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Write Bytes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-5f5ce5"></div>
              <span className="ml-2 text-2e2e2e font-general-sans font-semibold">Loading historical data...</span>
            </div>
          )}

          {/* No Data State */}
          {!loading && historicalData && historicalData.metrics.length === 0 && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl p-12 text-center">
              <TrendingUp className="w-12 h-12 text-2e2e2e/40 mx-auto mb-4" />
              <h3 className="text-lg font-bebas text-2e2e2e mb-2 uppercase tracking-wide">No Historical Data Available</h3>
              <p className="text-2e2e2e/60 font-general-sans">
                Historical metrics will appear here once data has been collected for the selected time range.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 