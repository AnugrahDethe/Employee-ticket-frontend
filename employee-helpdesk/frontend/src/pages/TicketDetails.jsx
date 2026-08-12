import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Loader, 
  MessageSquare, 
  History, 
  User, 
  Clock, 
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import './TicketDetails.css';

const TicketDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Action inputs
  const [commentText, setCommentText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data);
      setNewStatus(data.status);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await api.post(`/tickets/${id}/comments`, { text: commentText });
      setCommentText('');
      fetchTicket();
    } catch (err) {
      alert('Failed to add comment.');
    }
  };

  const handleAssignToSelf = async () => {
    try {
      await api.put(`/tickets/${id}/assign`, {});
      fetchTicket();
    } catch (err) {
      alert('Failed to assign ticket.');
    }
  };

  const handleStatusChange = async (e) => {
    const status = e.target.value;
    try {
      await api.put(`/tickets/${id}/status`, { status });
      fetchTicket();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this ticket?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      navigate('/tickets');
    } catch (err) {
      alert('Failed to delete ticket.');
    }
  };

  if (loading) {
    return (
      <div className="details-loading">
        <Loader className="spinner" size={40} />
        <p>Loading ticket details...</p>
      </div>
    );
  }

  if (error) {
    return <div className="details-error alert-danger">{error}</div>;
  }

  return (
    <div className="details-container container">
      {/* Header Info */}
      <div className="details-header">
        <div className="details-title-row">
          <h1>#{ticket._id.substring(ticket._id.length - 6).toUpperCase()} - {ticket.title}</h1>
          {user?.role === 'admin' && (
            <button className="btn btn-outline btn-delete-ticket" onClick={handleDeleteTicket}>
              Delete Ticket
            </button>
          )}
        </div>
        <div className="details-meta-badges">
          <span className={`status-pill ${ticket.status}`}>
            {ticket.status}
          </span>
          <span className="meta-item">
            <Calendar size={14} /> Filed: {new Date(ticket.createdAt).toLocaleDateString()}
          </span>
          <span className="meta-item">
            <User size={14} /> Created By: {ticket.createdBy?.name} ({ticket.createdBy?.role})
          </span>
        </div>
      </div>

      <div className="details-grid">
        {/* Main Details and Discussion */}
        <div className="details-main">
          {/* Ticket Description Card */}
          <div className="ticket-desc-card card">
            <h2>Description</h2>
            <p className="desc-text">{ticket.description}</p>
          </div>

          {/* Comments/Discussion Section */}
          <div className="comments-section card">
            <h2><MessageSquare size={18} /> Discussion</h2>
            
            <div className="comments-list">
              {ticket.comments?.length === 0 ? (
                <p className="no-comments">No conversation history yet.</p>
              ) : (
                ticket.comments.map((comment, index) => (
                  <div className="comment-bubble" key={index}>
                    <div className="comment-header">
                      <span className="comment-author">{comment.user?.name}</span>
                      <span className="comment-role-badge">{comment.user?.role}</span>
                      <span className="comment-time">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="comment-form">
              <div className="form-group">
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Type a response..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Send Response</button>
            </form>
          </div>
        </div>

        {/* Sidebar Controls (Actions/Workflow & History logs) */}
        <div className="details-sidebar">
          {/* Properties and Workflow Card */}
          <div className="sidebar-card card">
            <h2>Ticket Properties</h2>
            
            <div className="prop-row">
              <span className="prop-label">Category:</span>
              <span className="prop-val">{ticket.category}</span>
            </div>
            
            <div className="prop-row">
              <span className="prop-label">Priority:</span>
              <span className={`prop-val priority-${ticket.priority}`}>{ticket.priority}</span>
            </div>

            <div className="prop-row">
              <span className="prop-label">Assigned To:</span>
              <span className="prop-val">
                {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
              </span>
            </div>

            {/* Attachments Section */}
            {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="workflow-actions" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }}>
                        Attachments ({ticket.attachments.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {ticket.attachments.map((filePath, index) => {
                            const fileName = filePath.split('/').pop();
                            return (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>📎 {fileName}</span>
                                    <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${filePath}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '500' }}>
                                        View
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Support Actions */}
            {user?.role !== 'employee' && (
              <div className="workflow-actions">
                <h3>Workflow Actions</h3>
                
                {!ticket.assignedTo && (
                  <button className="btn btn-primary btn-block" onClick={handleAssignToSelf}>
                    Claim Ticket
                  </button>
                )}

                <div className="form-group status-select-group">
                  <label htmlFor="statusSelect">Transition Status</label>
                  <select 
                    id="statusSelect"
                    className="form-control"
                    value={newStatus}
                    onChange={handleStatusChange}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Ticket History Log */}
          <div className="sidebar-card card">
            <h2><History size={16} /> Audit Logs / History</h2>
            <div className="history-timeline">
              {ticket.history?.map((log, index) => (
                <div className="history-item" key={index}>
                  <div className="history-dot"></div>
                  <div className="history-info">
                    <p className="history-action">{log.action}</p>
                    <span className="history-time">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
