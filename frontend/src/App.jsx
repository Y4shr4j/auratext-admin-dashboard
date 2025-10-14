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
import { Line, Doughnut } from 'react-chartjs-2';

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://auratext-admin-dashboard.vercel.app';
const API_KEY = 'auratext_secret_key_2024_launch_secure';

function App() {
  const [overview, setOverview] = useState({ totalReplacements: 0, uniqueUsers: 0, totalErrors: 0, avgResponseTime: 0 });
  const [usage, setUsage] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      const [overviewRes, usageRes, errorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/metrics/overview`, { headers }),
        axios.get(`${API_BASE_URL}/api/metrics/usage`, { headers }),
        axios.get(`${API_BASE_URL}/api/metrics/errors?limit=10`, { headers })
      ]);
      
      setOverview(overviewRes.data);
      setUsage(usageRes.data);
      setErrors(errorsRes.data);
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

  const usageChartData = {
    labels: usage.map(u => new Date(u.date).toLocaleDateString()),
    datasets: [{
      label: 'Replacements',
      data: usage.map(u => u.replacements),
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

  return (
    <div className="dashboard">
      <header>
        <h1>🚀 AuraText Admin Dashboard</h1>
      </header>

      <div className="cards">
        <div className="card">
          <h3>Total Replacements</h3>
          <div className="metric">{overview.totalReplacements}</div>
        </div>
        <div className="card">
          <h3>Unique Users</h3>
          <div className="metric">{overview.uniqueUsers}</div>
        </div>
        <div className="card">
          <h3>Total Errors</h3>
          <div className="metric">{overview.totalErrors}</div>
        </div>
        <div className="card">
          <h3>Avg Response Time</h3>
          <div className="metric">{overview.avgResponseTime}ms</div>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container">
          <h3>Usage Over Time</h3>
          <Line data={usageChartData} options={{ responsive: true }} />
        </div>
        <div className="chart-container">
          <h3>Success vs Errors</h3>
          <Doughnut data={errorChartData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="errors">
        <h3>Recent Errors</h3>
        {errors.length > 0 ? (
          errors.map((err, i) => (
            <div key={i} className="error-item">
              <strong>{err.error_type}</strong>: {err.error_message}
              <br />
              <small>{new Date(err.timestamp).toLocaleString()}</small>
            </div>
          ))
        ) : (
          <p>🎉 No errors found!</p>
        )}
      </div>
    </div>
  );
}

export default App;




