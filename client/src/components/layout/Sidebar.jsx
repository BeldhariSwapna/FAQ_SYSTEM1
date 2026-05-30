import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 style={{ fontSize: '1.2rem', lineHeight: '1.4' }}>Crowd Sourced FAQ Generation Web App</h2>
      </div>
      <div className="nav-links">
        <Link to="/user" className={`nav-item ${isActive('/user')}`}>FAQ Hub</Link>
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>Dashboard</Link>
        <Link to="/ask-question" className={`nav-item ${isActive('/ask-question')}`}>Ask Question</Link>
        <Link to="/my-questions" className={`nav-item ${isActive('/my-questions')}`}>My Questions</Link>
        <Link to="/answer-center" className={`nav-item ${isActive('/answer-center')}`}>Answer Center</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className={`nav-item ${isActive('/admin')}`}>Admin Area</Link>
        )}
      </div>
      <div className="sidebar-footer">
        <div className="user-info" style={{ overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={user?.name || user?.email}>
            {user?.name || user?.email}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            {user?.role === 'admin' ? 'Administrator' : 'Member'}
          </div>
        </div>
        <button onClick={() => setDark(d => !d)} style={{
          width: '100%', padding: '8px', marginBottom: 8,
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          background: 'transparent', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 13, fontFamily: 'inherit'
        }}>
          {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <button onClick={logout} className="btn-primary" style={{ width: '100%', padding: '0.5rem' }}>Logout</button>
      </div>
    </div>
  );
};

export default Sidebar;