import { useState, useEffect } from 'react';
import questionService from '../services/questionService';
import { Link } from 'react-router-dom';

const AnswerCenter = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await questionService.getQuestions();
        // Show pending questions first, then answered
        const sorted = data.sort((a, b) => a.status === 'pending' ? -1 : 1);
        setQuestions(sorted);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Answer Center</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Help the community by providing answers to open questions.</p>

      <div className="flex-col">
        {questions.length === 0 ? (
          <p>No questions have been asked yet.</p>
        ) : (
          questions.map(q => (
            <div key={q._id} className="glass-card flex-between">
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>{q.title}</h4>
                <div className="flex-row">
                  <span className={`badge ${q.status === 'answered' ? 'badge-answered' : 'badge-pending'}`}>
                    {q.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    By {q.author?.username || 'Unknown'}
                  </span>
                </div>
              </div>
              <Link to={`/questions/${q._id}`} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                View & Answer
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnswerCenter;
