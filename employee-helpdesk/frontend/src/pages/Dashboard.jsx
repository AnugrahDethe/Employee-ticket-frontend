import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Inbox, 
  UserCheck, 
  Loader, 
  CheckCircle, 
  Archive, 
  AlertTriangle, 
  FileText,
  Tag
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/tickets/stats');
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard statistics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader className="spinner" size={40} />
        <p>Loading your metrics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-error alert-danger">{error}</div>;
  }

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: Inbox, color: '#4b5563' },
    { label: 'Open', value: stats.open, icon: FileText, color: '#10b981' },
    { label: 'Assigned', value: stats.assigned, icon: UserCheck, color: '#3b82f6' },
    { label: 'In Progress', value: stats.inProgress, icon: Loader, color: '#f59e0b' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: '#8b5cf6' },
    { label: 'Closed', value: stats.closed, icon: Archive, color: '#6b7280' },
    { label: 'Critical Priority', value: stats.critical, icon: AlertTriangle, color: '#ef4444' }
  ];

  return (
    <div className="dashboard-container container">
      <header className="dashboard-header">
        <h1>Welcome Back, {user?.name}</h1>
        <p>Here is the status of the helpdesk tickets.</p>
      </header>

      {/* Numerical Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div className="stat-card card" key={idx}>
              <div className="stat-card-icon" style={{ backgroundColor: card.color + '15', color: card.color }}>
                <IconComponent size={24} />
              </div>
              <div className="stat-card-info">
                <h3>{card.value}</h3>
                <p>{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      <div className="dashboard-sections">
        <div className="category-section card">
          <h2>Tickets by Category</h2>
          <div className="category-list">
            {Object.entries(stats.categories || {}).map(([category, count]) => (
              <div className="category-item" key={category}>
                <div className="category-meta">
                  <Tag size={16} className="category-icon" />
                  <span className="category-name">{category.toUpperCase()}</span>
                </div>
                <div className="category-bar-wrapper">
                  <div 
                    className="category-bar" 
                    style={{ 
                      width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%' 
                    }}
                  ></div>
                </div>
                <span className="category-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
