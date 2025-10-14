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
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './App.css';

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

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://auratext-admin-dashboard.vercel.app/api';

function App() {
  const [overviewData, setOverviewData] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [usageStats, setUsageStats] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching data from:', API_BASE_URL);
      
      const [overview, users, usage, errors] = await Promise.all([
        axios.get(`${API_BASE_URL}/metrics/overview`),
        axios.get(`${API_BASE_URL}/metrics/users`),
        axios.get(`${API_BASE_URL}/metrics/usage`),
        axios.get(`${API_BASE_URL}/metrics/errors?limit=10`)
      ]);

      console.log('✅ Data fetched successfully:', { overview: overview.data, users: users.data, usage: usage.data, errors: errors.data });

      setOverviewData(overview.data);
      setUserStats(users.data);
      setUsageStats(usage.data);
      setErrorLogs(errors.data);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading AuraText Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🚀 AuraText Admin Dashboard</h1>
          <div className="header-info">
            <span className="status-indicator online"></span>
            <span>Live</span>
            <span className="last-update">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      <main className="main">
        {overviewData && (
          <>
            {/* Overview Cards */}
            <section className="overview-cards">
              <div className="card">
                <div className="card-header">
                  <h3>Total Users</h3>
                  <div className="card-icon">👥</div>
                </div>
                <div className="card-value">{overviewData.totalUsers}</div>
                <div className="card-subtitle">
                  {overviewData.todayUsers} active today
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Text Replacements</h3>
                  <div className="card-icon">✏️</div>
                </div>
                <div className="card-value">{overviewData.totalReplacements}</div>
                <div className="card-subtitle">
                  {overviewData.todayReplacements} today
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Success Rate</h3>
                  <div className="card-icon">📊</div>
                </div>
                <div className="card-value">
                  {overviewData.successRate ? overviewData.successRate.toFixed(1) : 0}%
                </div>
                <div className="card-subtitle">Overall performance</div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Recent Errors</h3>
                  <div className="card-icon">⚠️</div>
                </div>
                <div className="card-value">{overviewData.recentErrors?.length || 0}</div>
                <div className="card-subtitle">In last 10 events</div>
              </div>
            </section>

            {/* Charts Section */}
            <section className="charts-section">
              <div className="chart-container">
                <h3>User Growth (Last 7 Days)</h3>
                <Line
                  data={{
                    labels: userStats.map(stat => new Date(stat.date).toLocaleDateString()),
                    datasets: [
                      {
                        label: 'New Users',
                        data: userStats.map(stat => stat.new_users),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                />
              </div>

              <div className="chart-container">
                <h3>App Usage Distribution</h3>
                <Doughnut
                  data={{
                    labels: usageStats.map(stat => stat.target_app),
                    datasets: [
                      {
                        data: usageStats.map(stat => stat.count),
                        backgroundColor: [
                          '#FF6384',
                          '#36A2EB',
                          '#FFCE56',
                          '#4BC0C0',
                          '#9966FF',
                          '#FF9F40',
                        ],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </section>

            {/* Usage Statistics */}
            <section className="usage-section">
              <h3>App Usage Statistics</h3>
              <div className="usage-table">
                <table>
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Total Usage</th>
                      <th>Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageStats.map((stat, index) => (
                      <tr key={index}>
                        <td>
                          <span className="app-name">{stat.target_app}</span>
                        </td>
                        <td>
                          <span className="usage-count">{stat.count}</span>
                        </td>
                        <td>
                          <span className={`success-rate ${stat.success_rate > 90 ? 'high' : stat.success_rate > 70 ? 'medium' : 'low'}`}>
                            {stat.success_rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent Errors */}
            <section className="errors-section">
              <h3>Recent Errors</h3>
              <div className="errors-list">
                {errorLogs.length > 0 ? (
                  errorLogs.map((error, index) => (
                    <div key={index} className="error-item">
                      <div className="error-header">
                        <span className="error-type">{error.error_type}</span>
                        <span className="error-time">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="error-message">{error.error_message}</div>
                      <div className="error-details">
                        <span className="error-app">App: {error.target_app}</span>
                        <span className="error-os">OS: {error.os}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-errors">
                    <p>🎉 No recent errors! Your app is running smoothly.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p>AuraText Admin Dashboard - Real-time Analytics</p>
        <p>Built for launch day monitoring</p>
      </footer>
    </div>
  );
}

export default App;
