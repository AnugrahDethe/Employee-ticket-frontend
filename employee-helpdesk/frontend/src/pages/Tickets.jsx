import { useState, useEffect } from 'react';
import api from '../services/api';
import TicketCard from '../components/TicketCard';
import { Loader, Search, Filter } from 'lucide-react';
import './Tickets.css';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters state
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (search) params.search = search;

      const { data } = await api.get('/tickets', { params });
      setTickets(data);
    } catch (err) {
      setError('Failed to load tickets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [status, priority, category]); // auto-reload when drop-down filters change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  return (
    <div className="tickets-container container">
      <header className="tickets-header">
        <h1>Support Tickets</h1>
        <p>View and manage helpdesk tickets</p>
      </header>

      {/* Filter & Search Bar */}
      <div className="filters-card card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="dropdowns-row">
          <div className="filter-group">
            <Filter size={14} className="filter-label-icon" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control">
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="filter-group">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-control">
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="filter-group">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-control">
              <option value="">All Categories</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Network">Network</option>
              <option value="HR">HR</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="tickets-loading">
          <Loader className="spinner" size={40} />
          <p>Fetching tickets...</p>
        </div>
      ) : error ? (
        <div className="alert-danger" style={{ padding: '1rem', borderRadius: '8px' }}>{error}</div>
      ) : tickets.length === 0 ? (
        <div className="no-tickets card">
          <h3>No tickets found</h3>
          <p>Try clearing your search/filters or create a new ticket if you are an employee.</p>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tickets;
