import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://auratext-admin-dashboard-gpbl.vercel.app';
const API_KEY = 'auratext_secret_key_2024_launch_secure';

function App() {
  const [overview, setOverview] = useState({ totalReplacements: 0, uniqueUsers: 0, totalErrors: 0, avgResponseTime: 0 });
  const [usage, setUsage] = useState([]);
  const [errors, setErrors] = useState([]);
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [methods, setMethods] = useState([]);
  const [realTime, setRealTime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dataStatus, setDataStatus] = useState({
    users: 'loading',
    apps: 'loading',
    methods: 'loading',
    realTime: 'loading'
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Trying to fetch from:', `${API_BASE_URL}/api/metrics/overview`);
      
      const headers = {
        'Authorization': `Bearer ${API_KEY}`
      };

      // Fetch data with fallbacks for missing endpoints
      const [overviewRes, usageRes, errorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/metrics/overview`, { headers }),
        axios.get(`${API_BASE_URL}/api/metrics/usage`, { headers }),
        axios.get(`${API_BASE_URL}/api/metrics/errors?limit=10`, { headers })
      ]);
      
      console.log('Overview data:', overviewRes.data);
      console.log('Usage data:', usageRes.data);
      console.log('Errors data:', errorsRes.data);
      
      setOverview(overviewRes.data);
      setUsage(usageRes.data);
      setErrors(errorsRes.data);

      // Try to fetch optional endpoints with fallbacks
      try {
        const usersRes = await axios.get(`${API_BASE_URL}/api/metrics/users`, { headers });
        setUsers(usersRes.data);
        setDataStatus(prev => ({ ...prev, users: 'live' }));
      } catch (err) {
        console.warn('Users endpoint not available, using mock data');
        setUsers([
          { user_id: 'user_123', replacement_count: 245, avg_response_time: 120, last_seen: new Date().toISOString() },
          { user_id: 'user_456', replacement_count: 189, avg_response_time: 156, last_seen: new Date(Date.now() - 7200000).toISOString() },
          { user_id: 'user_789', replacement_count: 134, avg_response_time: 98, last_seen: new Date(Date.now() - 86400000).toISOString() }
        ]);
        setDataStatus(prev => ({ ...prev, users: 'mock' }));
      }

      try {
        const appsRes = await axios.get(`${API_BASE_URL}/api/metrics/apps`, { headers });
        setApps(appsRes.data);
        setDataStatus(prev => ({ ...prev, apps: 'live' }));
      } catch (err) {
        console.warn('Apps endpoint not available, using mock data');
        setApps([
          { target_app: 'notepad.exe', usage_count: 456, unique_users: 23, avg_response_time: 120, success_rate: 94.5 },
          { target_app: 'WINWORD.EXE', usage_count: 389, unique_users: 18, avg_response_time: 145, success_rate: 91.2 },
          { target_app: 'EXCEL.EXE', usage_count: 234, unique_users: 12, avg_response_time: 167, success_rate: 88.9 }
        ]);
        setDataStatus(prev => ({ ...prev, apps: 'mock' }));
      }

      try {
        const methodsRes = await axios.get(`${API_BASE_URL}/api/metrics/methods`, { headers });
        setMethods(methodsRes.data);
        setDataStatus(prev => ({ ...prev, methods: 'live' }));
      } catch (err) {
        console.warn('Methods endpoint not available, using mock data');
        setMethods([
          { method: 'Win32DirectReplacer', usage_count: 567, avg_response_time: 120, success_rate: 95.2 },
          { method: 'TextPatternReplacer', usage_count: 423, avg_response_time: 145, success_rate: 92.1 },
          { method: 'ClipboardReplacer', usage_count: 189, avg_response_time: 98, success_rate: 88.5 }
        ]);
        setDataStatus(prev => ({ ...prev, methods: 'mock' }));
      }

      try {
        const realTimeRes = await axios.get(`${API_BASE_URL}/api/metrics/real-time`, { headers });
        setRealTime(realTimeRes.data);
        setDataStatus(prev => ({ ...prev, realTime: 'live' }));
      } catch (err) {
        console.warn('Real-time endpoint not available, using mock data');
        const mockRealTime = [];
        const now = new Date();
        for (let i = 59; i >= 0; i--) {
          const minute = new Date(now.getTime() - i * 60000);
          mockRealTime.push({
            minute: minute.toISOString().slice(0, 16) + ':00',
            replacements: Math.floor(Math.random() * 10),
            unique_users: Math.floor(Math.random() * 5) + 1
          });
        }
        setRealTime(mockRealTime);
        setDataStatus(prev => ({ ...prev, realTime: 'mock' }));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      console.error('Full error:', err.response?.data || err.message);
      setError(`Connection failed: ${err.response?.status || 'Network Error'} - ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="spinner"></div>
        <p>Loading AuraText Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>⚠️ Connection Error</h1>
        <p>Could not connect to backend: {error}</p>
        <p>Backend URL: {API_BASE_URL}</p>
      </div>
    );
  }

  // Chart data configurations
  const usageChartData = {
    labels: (Array.isArray(usage) ? usage : []).map(u => new Date(u.date).toLocaleDateString()),
    datasets: [{
      label: 'Replacements',
      data: (Array.isArray(usage) ? usage : []).map(u => u.replacements || 0),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
    }]
  };

  const errorChartData = {
    labels: ['Success', 'Errors'],
    datasets: [{
      data: [overview.totalReplacements - overview.totalErrors, overview.totalErrors],
      backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 99, 132, 0.8)']
    }]
  };

  const appsChartData = {
    labels: (Array.isArray(apps) ? apps : []).slice(0, 10).map(app => app.target_app || 'Unknown'),
    datasets: [{
      label: 'Usage Count',
      data: (Array.isArray(apps) ? apps : []).slice(0, 10).map(app => app.usage_count || 0),
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  const methodsChartData = {
    labels: (Array.isArray(methods) ? methods : []).map(method => method.method || 'Unknown'),
    datasets: [{
      label: 'Usage Count',
      data: (Array.isArray(methods) ? methods : []).map(method => method.usage_count || 0),
      backgroundColor: 'rgba(255, 206, 86, 0.8)',
      borderColor: 'rgba(255, 206, 86, 1)',
      borderWidth: 1
    }]
  };

  const realTimeChartData = {
    labels: (Array.isArray(realTime) ? realTime : []).slice(0, 20).map(rt => {
      const date = new Date(rt.minute);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [{
      label: 'Replacements (Last Hour)',
      data: (Array.isArray(realTime) ? realTime : []).slice(0, 20).map(rt => rt.replacements || 0),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.4
    }]
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'apps', label: '📱 Apps', icon: '📱' },
    { id: 'methods', label: '🔧 Methods', icon: '🔧' },
    { id: 'realtime', label: '⚡ Real-time', icon: '⚡' },
    { id: 'errors', label: '❌ Errors', icon: '❌' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div className="charts">
              <div className="chart-container">
                <h3>Usage Over Time (30 days)</h3>
                <Line data={usageChartData} options={{ responsive: true }} />
              </div>
              <div className="chart-container">
                <h3>Success vs Errors</h3>
                <Doughnut data={errorChartData} options={{ responsive: true }} />
              </div>
            </div>
          </>
        );
      
      case 'users':
        return (
          <div className="data-table">
            <h3>Top Users</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Replacements</th>
                    <th>Avg Response Time</th>
                    <th>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(users) ? users : []).map((user, i) => (
                    <tr key={i}>
                      <td>{user.user_id}</td>
                      <td>{user.replacement_count}</td>
                      <td>{Math.round(user.avg_response_time || 0)}ms</td>
                      <td>{new Date(user.last_seen).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'apps':
        return (
          <div className="charts">
            <div className="chart-container">
              <h3>App Usage Statistics</h3>
              <Bar data={appsChartData} options={{ responsive: true }} />
            </div>
            <div className="data-table">
              <h3>Detailed App Analytics</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Target App</th>
                      <th>Usage Count</th>
                      <th>Unique Users</th>
                      <th>Avg Response Time</th>
                      <th>Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(apps) ? apps : []).map((app, i) => (
                      <tr key={i}>
                        <td>{app.target_app || 'Unknown'}</td>
                        <td>{app.usage_count}</td>
                        <td>{app.unique_users}</td>
                        <td>{Math.round(app.avg_response_time || 0)}ms</td>
                        <td>{Math.round(app.success_rate || 0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      case 'methods':
        return (
          <div className="charts">
            <div className="chart-container">
              <h3>Method Usage Statistics</h3>
              <Bar data={methodsChartData} options={{ responsive: true }} />
            </div>
            <div className="data-table">
              <h3>Detailed Method Analytics</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Usage Count</th>
                      <th>Avg Response Time</th>
                      <th>Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(methods) ? methods : []).map((method, i) => (
                      <tr key={i}>
                        <td>{method.method || 'Unknown'}</td>
                        <td>{method.usage_count}</td>
                        <td>{Math.round(method.avg_response_time || 0)}ms</td>
                        <td>{Math.round(method.success_rate || 0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      case 'realtime':
        return (
          <div className="charts">
            <div className="chart-container">
              <h3>Real-time Activity (Last Hour)</h3>
              <Line data={realTimeChartData} options={{ responsive: true }} />
            </div>
            <div className="data-table">
              <h3>Minute-by-Minute Activity</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Replacements</th>
                      <th>Unique Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(realTime) ? realTime : []).slice(0, 30).map((rt, i) => (
                      <tr key={i}>
                        <td>{new Date(rt.minute).toLocaleTimeString()}</td>
                        <td>{rt.replacements}</td>
                        <td>{rt.unique_users}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      case 'errors':
        return (
          <div className="errors">
            <h3>Recent Errors</h3>
            {(Array.isArray(errors) ? errors : []).length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Error Type</th>
                      <th>Message</th>
                      <th>Target App</th>
                      <th>User ID</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(errors) ? errors : []).map((err, i) => (
                      <tr key={i}>
                        <td>{err.error_type}</td>
                        <td>{err.error_message}</td>
                        <td>{err.target_app || 'Unknown'}</td>
                        <td>{err.user_id}</td>
                        <td>{new Date(err.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>🎉 No errors found!</p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <header>
        <h1>⚡ AuraText Admin Dashboard</h1>
        <div className="header-info">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <div className="status-indicators">
            <span className="status-indicator">🟢 Core Data</span>
            {dataStatus.users === 'live' && <span className="status-indicator">🟢 Users</span>}
            {dataStatus.apps === 'live' && <span className="status-indicator">🟢 Apps</span>}
            {dataStatus.methods === 'live' && <span className="status-indicator">🟢 Methods</span>}
            {dataStatus.realTime === 'live' && <span className="status-indicator">🟢 Real-time</span>}
            {dataStatus.users === 'mock' && <span className="status-indicator mock">🟡 Users (Mock)</span>}
            {dataStatus.apps === 'mock' && <span className="status-indicator mock">🟡 Apps (Mock)</span>}
            {dataStatus.methods === 'mock' && <span className="status-indicator mock">🟡 Methods (Mock)</span>}
            {dataStatus.realTime === 'mock' && <span className="status-indicator mock">🟡 Real-time (Mock)</span>}
          </div>
        </div>
      </header>

      <div className="cards">
        <div className="card">
          <h3>Total Replacements</h3>
          <div className="metric">{overview.totalReplacements.toLocaleString()}</div>
        </div>
        <div className="card">
          <h3>Unique Users</h3>
          <div className="metric">{overview.uniqueUsers.toLocaleString()}</div>
        </div>
        <div className="card">
          <h3>Total Errors</h3>
          <div className="metric">{overview.totalErrors.toLocaleString()}</div>
        </div>
        <div className="card">
          <h3>Avg Response Time</h3>
          <div className="metric">{overview.avgResponseTime}ms</div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;




