import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LayoutDashboard, Ticket, PlusCircle, Users, LogOut, Headphones, Bell } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = async (notif) => {
    setShowDropdown(false);
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        // Update local state to reflect change instantly
        setNotifications(notifications.map(n => 
          n._id === notif._id ? { ...n, isRead: true } : n
        ));
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
    navigate(`/tickets/${notif.relatedTicket?._id || notif.relatedTicket}`);
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Headphones size={22} />
        <span>HelpDesk</span>
      </div>

      <ul className="navbar-links">
        <li>
          <Link to="/dashboard" className={isActive('/dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        </li>

        {user?.role === 'employee' ? (
          <>
            <li>
              <Link to="/tickets" className={isActive('/tickets')}>
                <Ticket size={18} /> My Tickets
              </Link>
            </li>
            <li>
              <Link to="/tickets/create" className={isActive('/tickets/create')}>
                <PlusCircle size={18} /> New Ticket
              </Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/tickets" className={isActive('/tickets')}>
                <Ticket size={18} /> All Tickets
              </Link>
            </li>
            {user?.role === 'admin' && (
              <li>
                <Link to="/users" className={isActive('/users')}>
                  <Users size={18} /> Users
                </Link>
              </li>
            )}
          </>
        )}
      </ul>

      <div className="navbar-user">
        {user && (
          <div className="notification-wrapper" ref={dropdownRef}>
            <button className="notification-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            
            {showDropdown && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>Notifications</h4>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <p>{notif.message}</p>
                        <span className="time">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <span className="user-badge">{user?.role}</span>
        <span className="user-name">{user?.name}</span>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
