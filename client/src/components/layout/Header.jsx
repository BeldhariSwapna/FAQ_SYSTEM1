import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Dashboard / <span style={{ color: 'var(--text-primary)' }}>Overview</span>
      </div>
      <div className="flex-row">
        {user?.role === 'admin' && <span className="badge badge-answered" style={{ marginRight: '1rem' }}>ADMIN MODE</span>}
      </div>
    </header>
  );
};

export default Header;