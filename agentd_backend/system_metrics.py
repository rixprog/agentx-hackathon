import psutil
import subprocess
import platform
import os
import time
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pathlib import Path

# Database setup
DB_PATH = Path("system_metrics.db")

def init_database():
    """Initialize the database for storing system metrics."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            cpu_usage REAL,
            memory_usage REAL,
            disk_usage REAL,
            temperature REAL,
            running_processes INTEGER,
            power_consumption REAL,
            network_bytes_sent INTEGER,
            network_bytes_recv INTEGER,
            disk_read_bytes INTEGER,
            disk_write_bytes INTEGER
        )
    ''')
    
    # Create index for faster queries
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_timestamp 
        ON system_metrics(timestamp)
    ''')
    
    conn.commit()
    conn.close()

def log_system_metrics():
    """Log current system metrics to database."""
    try:
        metrics = get_system_metrics()
        
        # Get additional metrics for logging
        network = psutil.net_io_counters()
        disk_io = psutil.disk_io_counters()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO system_metrics 
            (cpu_usage, memory_usage, disk_usage, temperature, running_processes,
             power_consumption, network_bytes_sent, network_bytes_recv,
             disk_read_bytes, disk_write_bytes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            metrics['cpu_usage'],
            metrics['memory_usage'],
            metrics['disk_usage'],
            metrics['temperature'],
            metrics['running_processes'],
            estimate_power_consumption(metrics),
            network.bytes_sent,
            network.bytes_recv,
            disk_io.read_bytes if disk_io else 0,
            disk_io.write_bytes if disk_io else 0
        ))
        
        conn.commit()
        conn.close()
        
        return True
    except Exception as e:
        print(f"Error logging system metrics: {e}")
        return False

def estimate_power_consumption(metrics: Dict[str, Any]) -> float:
    """Estimate power consumption based on CPU and memory usage."""
    # Simple estimation: CPU usage * 0.8 + Memory usage * 0.2
    # This is a rough estimate and not accurate for all systems
    cpu_factor = metrics['cpu_usage'] * 0.8
    memory_factor = metrics['memory_usage'] * 0.2
    base_power = 10.0  # Base power consumption in watts
    
    return base_power + cpu_factor + memory_factor

def get_historical_metrics(time_range: str) -> List[Dict[str, Any]]:
    """Get historical system metrics for the specified time range."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Calculate time range
        now = datetime.now()
        if time_range == '1h':
            start_time = now - timedelta(hours=1)
        elif time_range == '6h':
            start_time = now - timedelta(hours=6)
        elif time_range == '1d':
            start_time = now - timedelta(days=1)
        elif time_range == '1w':
            start_time = now - timedelta(weeks=1)
        elif time_range == '1m':
            start_time = now - timedelta(days=30)
        else:
            start_time = now - timedelta(hours=1)  # Default to 1 hour
        
        cursor.execute('''
            SELECT timestamp, cpu_usage, memory_usage, disk_usage, temperature,
                   running_processes, power_consumption, network_bytes_sent,
                   network_bytes_recv, disk_read_bytes, disk_write_bytes
            FROM system_metrics
            WHERE timestamp >= ?
            ORDER BY timestamp ASC
        ''', (start_time.isoformat(),))
        
        rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        metrics_list = []
        for row in rows:
            metrics_list.append({
                'timestamp': row[0],
                'cpu_usage': row[1],
                'memory_usage': row[2],
                'disk_usage': row[3],
                'temperature': row[4],
                'running_processes': row[5],
                'power_consumption': row[6],
                'network_bytes_sent': row[7],
                'network_bytes_recv': row[8],
                'disk_read_bytes': row[9],
                'disk_write_bytes': row[10]
            })
        
        return metrics_list
        
    except Exception as e:
        print(f"Error getting historical metrics: {e}")
        return []

def get_system_metrics() -> Dict[str, Any]:
    """
    Get comprehensive system metrics including CPU, memory, disk, temperature, and processes.
    """
    try:
        # CPU Usage
        cpu_usage = psutil.cpu_percent(interval=1)
        
        # Memory Usage
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        
        # Disk Usage
        disk = psutil.disk_usage('/')
        disk_usage = (disk.used / disk.total) * 100
        
        # Running Processes
        running_processes = len(psutil.pids())
        
        # System Uptime
        uptime_seconds = time.time() - psutil.boot_time()
        uptime_hours = int(uptime_seconds // 3600)
        uptime_minutes = int((uptime_seconds % 3600) // 60)
        uptime = f"{uptime_hours}h {uptime_minutes}m"
        
        # Temperature (Linux only)
        temperature = get_temperature()
        print('DEBUG SYSTEM METRICS:', cpu_usage, memory_usage, disk_usage, temperature, running_processes, uptime)
        return {
            "cpu_usage": round(cpu_usage, 1),
            "memory_usage": round(memory_usage, 1),
            "disk_usage": round(disk_usage, 1),
            "temperature": temperature,
            "running_processes": running_processes,
            "uptime": uptime,
            "total_memory_gb": round(memory.total / (1024**3), 1),
            "used_memory_gb": round(memory.used / (1024**3), 1),
            "total_disk_gb": round(disk.total / (1024**3), 1),
            "used_disk_gb": round(disk.used / (1024**3), 1)
        }
    except Exception as e:
        print(f"Error getting system metrics: {e}")
        import traceback
        traceback.print_exc()
        return {
            "cpu_usage": 0,
            "memory_usage": 0,
            "disk_usage": 0,
            "temperature": 0,
            "running_processes": 0,
            "uptime": "Unknown",
            "total_memory_gb": 0,
            "used_memory_gb": 0,
            "total_disk_gb": 0,
            "used_disk_gb": 0
        }

def get_temperature() -> float:
    """
    Get CPU temperature. This works on Linux systems with thermal sensors.
    """
    try:
        if platform.system() == "Linux":
            # Try different temperature sensor paths
            temp_paths = [
                "/sys/class/thermal/thermal_zone0/temp",
                "/sys/class/hwmon/hwmon0/temp1_input",
                "/sys/class/hwmon/hwmon1/temp1_input"
            ]
            
            for temp_path in temp_paths:
                if os.path.exists(temp_path):
                    with open(temp_path, 'r') as f:
                        temp_raw = int(f.read().strip())
                        # Convert from millidegrees to degrees Celsius
                        return temp_raw / 1000.0
            
            # Fallback: try using sensors command
            try:
                result = subprocess.run(['sensors'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    # Parse sensors output for CPU temperature
                    lines = result.stdout.split('\n')
                    for line in lines:
                        if 'Core 0:' in line or 'Package id 0:' in line:
                            # Extract temperature from line like "Core 0:        +45.0°C"
                            import re
                            match = re.search(r'\+(\d+\.?\d*)°C', line)
                            if match:
                                return float(match.group(1))
            except:
                pass
                
        elif platform.system() == "Darwin":  # macOS
            try:
                result = subprocess.run(['sudo', 'powermetrics', '-n', '1', '-i', '1000'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    # Parse powermetrics output for CPU temperature
                    lines = result.stdout.split('\n')
                    for line in lines:
                        if 'CPU die temperature:' in line:
                            import re
                            match = re.search(r'(\d+\.?\d*)', line)
                            if match:
                                return float(match.group(1))
            except:
                pass
        
        # Default temperature if we can't get real data
        return 45.0
        
    except Exception as e:
        print(f"Error getting temperature: {e}")
        return 45.0

def get_detailed_system_info() -> Dict[str, Any]:
    """
    Get detailed system information for the dashboard.
    """
    try:
        # Basic system info
        system_info = {
            "platform": platform.system(),
            "platform_version": platform.version(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "hostname": platform.node()
        }
        
        # CPU info
        cpu_info = {
            "cpu_count": psutil.cpu_count(),
            "cpu_freq": psutil.cpu_freq().current if psutil.cpu_freq() else 0,
            "cpu_usage_per_core": psutil.cpu_percent(interval=1, percpu=True)
        }
        
        # Memory info
        memory = psutil.virtual_memory()
        memory_info = {
            "total": memory.total,
            "available": memory.available,
            "used": memory.used,
            "free": memory.free,
            "percent": memory.percent
        }
        
        # Disk info
        disk = psutil.disk_usage('/')
        disk_info = {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": (disk.used / disk.total) * 100
        }
        
        # Network info
        network = psutil.net_io_counters()
        network_info = {
            "bytes_sent": network.bytes_sent,
            "bytes_recv": network.bytes_recv,
            "packets_sent": network.packets_sent,
            "packets_recv": network.packets_recv
        }
        
        return {
            "system": system_info,
            "cpu": cpu_info,
            "memory": memory_info,
            "disk": disk_info,
            "network": network_info,
            "temperature": get_temperature(),
            "uptime": time.time() - psutil.boot_time()
        }
        
    except Exception as e:
        print(f"Error getting detailed system info: {e}")
        return {}

# Initialize database on module import
init_database() 