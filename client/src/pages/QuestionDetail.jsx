import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import questionService from '../services/questionService';
import answerService from '../services/answerService';
import { useAuth } from '../context/AuthContext';

const QuestionDetail = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const qData = await questionService.getQuestionById(id);
      const aData = await answerService.getAnswersByQuestionId(id);
      setQuestion(qData);
      setAnswers(aData);
    } catch (err) {
      setError('Failed to load question details');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    try {
      await answerService.createAnswer({ content: newAnswer, questionId: id });
      setNewAnswer('');
      fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to submit answer');
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (window.confirm('Delete this answer?')) {
      try {
        await answerService.deleteAnswer(answerId);
        fetchData();
      } catch (err) {
        alert('Failed to delete answer');
      }
    }
  };

  const handleUpvote = async (answerId) => {
    try {
      await answerService.upvoteAnswer(answerId);
      fetchData();
    } catch (err) {
      alert('Failed to upvote');
    }
  };

  const handleDownvote = async (answerId) => {
    try {
      await answerService.downvoteAnswer(answerId);
      fetchData();
    } catch (err) {
      alert('Failed to downvote');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!question) return <div>Question not found.</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{question.title}</h2>
          <span className={`badge ${question.status === 'answered' ? 'badge-answered' : 'badge-pending'}`}>
            {question.status.toUpperCase()}
          </span>
        </div>
        <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
          {question.description || 'No description provided.'}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Asked by {question.author?.username || 'Unknown'} on {new Date(question.createdAt).toLocaleDateString()}
        </p>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Answers ({answers.length})</h3>
      
      <div className="flex-col" style={{ marginBottom: '2rem' }}>
        {answers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No answers yet. Be the first to answer!</p>
        ) : (
          answers.map(ans => (
            <div key={ans._id} className="glass-card">
              <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                {ans.content}
              </p>
              <div className="flex-between">
                <div className="flex-row">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    By {ans.author?.username || 'Unknown'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '1rem' }}>
                    <button 
                      onClick={() => handleUpvote(ans._id)} 
                      style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--success-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      👍 {ans.upvotes?.length || 0}
                    </button>
                    <button 
                      onClick={() => handleDownvote(ans._id)} 
                      style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--danger-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      👎 {ans.downvotes?.length || 0}
                    </button>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDeleteAnswer(ans._id)} className="btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="glass-card">
        <h4 style={{ marginBottom: '1rem' }}>Post an Answer</h4>
        <form onSubmit={handleAnswerSubmit} className="flex-col">
          <textarea 
            className="form-input"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write your answer here..."
            required
            style={{ minHeight: '100px', resize: 'vertical' }}
          />
          <button type="submit" className="btn-primary" style={{ width: 'max-content' }}>
            Submit Answer
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionDetail;
