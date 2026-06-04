import { useState, useEffect, useRef } from 'react';
import questionService from '../services/questionService';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import RecentSearchesPanel from '../components/RecentSearchesPanel';

const DRAFT_KEY = 'ask_question_draft';

const AskQuestion = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [dupLoading, setDupLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const debounceRef = useRef(null);

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      const { title: t, description: d } = JSON.parse(draft);
      if (t) setTitle(t);
      if (d) setDescription(d);
    }
  }, []);

  useEffect(() => {
    const prefillTitle = location.state?.prefillTitle;
    if (prefillTitle && !title) {
      setTitle(prefillTitle);
      checkDuplicates(prefillTitle);
    }
  }, [location.state]);

  useEffect(() => {
    if (!title && !description) return;
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, description }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, description]);

  const checkDuplicates = async (text) => {
    if (!text || text.trim().length < 10) { setDuplicates([]); return; }
    setDupLoading(true);
    try {
      const { data } = await api.get(`/search/suggestions?q=${encodeURIComponent(text)}`);
      setDuplicates(data.results?.slice(0, 3) || []);
    } catch {
      setDuplicates([]);
    } finally {
      setDupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await questionService.createQuestion({ title, description });
      localStorage.removeItem(DRAFT_KEY);
      navigate('/my-questions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit question');
    } finally {
      setLoading(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    setDescription('');
    setDuplicates([]);
  };

  const handleRecentSelect = (value) => {
    setTitle(value);
    checkDuplicates(value);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2>Ask a Question</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Have a question that isn't answered in the FAQ? Ask it here!
      </p>
      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      <div className="glass-card">
        <form onSubmit={handleSubmit} className="flex-col">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => checkDuplicates(e.target.value), 600);
              }}
              placeholder="e.g., How do I reset my password?"
            />
            {dupLoading && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Checking for similar questions...</div>}
            {duplicates.length > 0 && (
              <div style={{
                background: 'rgba(217,119,6,0.08)', border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginTop: 8
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', marginBottom: 8 }}>
                  ⚠️ Similar questions already exist — check these first:
                </div>
                {duplicates.map((d, i) => (
                  <div key={i} style={{
                    fontSize: 13, color: 'var(--text-primary)', padding: '6px 0',
                    borderBottom: i < duplicates.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    → {d.question}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional details..."
              style={{ minHeight: '120px', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'max-content' }}>
                {loading ? 'Submitting...' : 'Submit Question'}
              </button>
              {(title || description) && (
                <button type="button" onClick={clearDraft} style={{
                  padding: '0 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13
                }}>Clear</button>
              )}
            </div>
            {draftSaved && <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ Draft saved</span>}
          </div>
        </form>
      </div>
      <div style={{ marginTop: '1.25rem' }}>
        <RecentSearchesPanel title="Reuse a recent search" onSelect={handleRecentSelect} />
      </div>
    </div>
  );
};

export default AskQuestion;