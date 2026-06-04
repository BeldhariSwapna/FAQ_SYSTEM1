import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import questionService from '../services/questionService';
import RecentSearchesPanel from '../components/RecentSearchesPanel';

const DashboardHome = () => {
  const [stats, setStats] = useState({ asked: 0, answered: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questions = await questionService.getQuestions();
        const asked = questions.length;
        const answered = questions.filter(q => q.status === 'answered').length;
        const pending = asked - answered;
        
        setStats({ asked, answered, pending });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  return (
    <div>
      <h2>Welcome to the Crowd Sourced FAQ Generation Web App!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>This is your central dashboard. Use the sidebar on the left to navigate through the application.</p>
      
      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="flex-row" style={{ flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ flex: '1', minWidth: '200px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Questions Asked</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.asked}</div>
          </div>
          <div className="glass-card" style={{ flex: '1', minWidth: '200px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Questions Answered</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.answered}</div>
          </div>
          <div className="glass-card" style={{ flex: '1', minWidth: '200px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Pending Approvals</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{stats.pending}</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', maxWidth: '860px' }}>
        <RecentSearchesPanel
          title="Recent searches"
          onSelect={(value) => navigate('/ask-question', { state: { prefillTitle: value } })}
        />
      </div>
    </div>
  );
};

export default DashboardHome;
