import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RecentSearchesPanel from '../components/RecentSearchesPanel';

export default function QueryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const prefillQuestion = location.state?.question || '';

  const [form, setForm] = useState({
    question: prefillQuestion,
    category: 'general',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    'general', 'account', 'courses', 'payments', 'technical', 'certifications', 'other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim()) {
      toast.error('Please enter your question');
      return;
    }
    setLoading(true);
    try {
      await api.post('/queries', form);
      setSubmitted(true);
      toast.success('Query submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit query');
    } finally {
      setLoading(false);
    }
  };

  const bgCard = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 };
  const inputBase = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
        <div style={{ ...bgCard, textAlign: 'center', padding: 48 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
            <path d="M8 12l2 2 4-4" />
          </svg>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '16px 0 8px' }}>Query Submitted</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>We'll review your question and get back to you soon.</p>
          <button onClick={() => navigate('/dashboard', { replace: true })} style={{
            padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Back to FAQs
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = { ...inputBase };
  const selectStyle = { ...inputBase, cursor: 'pointer' };
  const textareaStyle = { ...inputBase, resize: 'vertical', minHeight: 90 };

  const handleRecentSelect = (value) => {
    setForm((prev) => ({ ...prev, question: value }));
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ ...bgCard }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Submit a Query</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Didn't find what you were looking for? Let us know.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label htmlFor="q-question" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
              Question <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="q-question"
              type="text"
              placeholder="What would you like to know?"
              value={form.question}
              onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label htmlFor="q-category" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
              Category
            </label>
            <select
              id="q-category"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              style={selectStyle}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="q-desc" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
              Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="q-desc"
              placeholder="Provide any additional details..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={textareaStyle}
            />
          </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Query'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem' }}>
            <RecentSearchesPanel title="Recent searches" onSelect={handleRecentSelect} />
          </div>
        </div>
      </main>
          <button type="submit" disabled={loading} style={{
            padding: '11px 24px', borderRadius: 'var(--radius-sm)', border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1, alignSelf: 'flex-start',
          }}>
            {loading ? 'Submitting...' : 'Submit Query'}
          </button>
        </form>
      </div>
    </div>
  );
}
