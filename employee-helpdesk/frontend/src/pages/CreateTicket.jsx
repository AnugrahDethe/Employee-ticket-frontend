import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle, Tag, Layers, HelpCircle, Paperclip } from 'lucide-react';
import './CreateTicket.css';

const CreateTicket = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [priority, setPriority] = useState('Medium');
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
        setError('Maximum 5 files allowed.');
        return;
    }
    setAttachments(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create the ticket
      const { data: ticket } = await api.post('/tickets', {
        title,
        description,
        category,
        priority
      });

      // 2. Upload attachments if any
      if (attachments.length > 0) {
          const formData = new FormData();
          attachments.forEach(file => {
              formData.append('attachments', file);
          });

          await api.post(`/tickets/${ticket._id}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
      }

      navigate('/tickets');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket-container container">
      <header className="create-header">
        <h1>Submit a Ticket</h1>
        <p>Describe your issue and we'll route it to the right support agent.</p>
      </header>

      <div className="create-card card">
        {error && <div className="alert-danger create-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Issue Summary / Title</label>
            <input
              type="text"
              id="title"
              placeholder="e.g. My keyboard is missing keys"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <div className="select-wrapper">
                <Tag size={16} className="select-icon" />
                <select
                  id="category"
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Network">Network</option>
                  <option value="HR">HR</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <div className="select-wrapper">
                <Layers size={16} className="select-icon" />
                <select
                  id="priority"
                  className="form-control"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description</label>
            <textarea
              id="description"
              rows="6"
              placeholder="Please provide details about the problem, any error messages, and what steps you've already tried."
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="attachments">Attachments (Max 5 files, 5MB each, JPG/PNG/PDF)</label>
            <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Paperclip size={18} className="text-muted" />
              <input
                type="file"
                id="attachments"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="form-control"
              />
            </div>
            {attachments.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                    Selected: {attachments.map(f => f.name).join(', ')}
                </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => navigate('/tickets')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
