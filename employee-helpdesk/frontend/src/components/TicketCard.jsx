import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle, User } from 'lucide-react';
import './TicketCard.css';

const priorityColors = {
  Low: '#10b981',
  Medium: '#3b82f6',
  High: '#f59e0b',
  Critical: '#ef4444'
};

const statusColors = {
  OPEN: '#10b981',
  ASSIGNED: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#8b5cf6',
  CLOSED: '#6b7280'
};

const TicketCard = ({ ticket }) => {
  const priorityColor = priorityColors[ticket.priority] || '#6b7280';
  const statusColor = statusColors[ticket.status] || '#6b7280';

  return (
    <Link to={`/tickets/${ticket._id}`} className="ticket-card">
      <div className="ticket-card-header">
        <span className="ticket-category">{ticket.category}</span>
        <span className="ticket-priority" style={{ color: priorityColor, borderColor: priorityColor }}>
          {ticket.priority}
        </span>
      </div>
      <h3 className="ticket-title">{ticket.title}</h3>
      <p className="ticket-desc">{ticket.description}</p>
      <div className="ticket-card-footer">
        <span className="ticket-status" style={{ background: statusColor + '22', color: statusColor }}>
          {ticket.status.replace('_', ' ')}
        </span>
        <span className="ticket-meta">
          <Clock size={13} /> {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
        <span className="ticket-meta">
          <User size={13} /> {ticket.createdBy?.name || 'Unknown'}
        </span>
      </div>
    </Link>
  );
};

export default TicketCard;
