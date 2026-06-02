import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Custom animated checkbox
const Checkbox = ({ checked, onChange }) => (
  <div onClick={onChange} style={{
    width: 20, height: 20, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
    border: checked ? '2px solid var(--accent)' : '2px solid var(--border)',
    background: checked ? 'var(--accent)' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
    transform: checked ? 'scale(1.08)' : 'scale(1)',
    boxShadow: checked ? '0 0 0 3px var(--accent-light)' : 'none',
  }}>
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{
      opacity: checked ? 1 : 0,
      transform: checked ? 'scale(1)' : 'scale(0.5)',
      transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// Role badge
const RoleBadge = ({ role }) => {
  const styles = {
    super_admin: { background: 'rgba(234,179,8,0.15)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.3)' },
    admin: { background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' },
    intern: { background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' },
  };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      ...styles[role] || styles.intern
    }}>{role}</span>
  );
};

const ACTION_LABELS = {
  promote_to_admin: 'Promoted to admin',
  promote_to_super_admin: 'Promoted to super_admin',
  demote_to_intern: 'Demoted to intern',
  role_change: 'Role changed',
  delete_user: 'User deleted',
  create_faq: 'FAQ created',
  update_faq: 'FAQ updated',
  delete_faq: 'FAQ deleted',
  promote_question_to_faq: 'Question promoted to FAQ',
};

const AdminArea = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pendingAnswers, setPendingAnswers] = useState([]);
  const [pendingAnswersPagination, setPendingAnswersPagination] = useState(null);
  const [answersPage, setAnswersPage] = useState(1);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // FAQ form state
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: '' });
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqLoading, setFaqLoading] = useState(false);

  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedQueries, setSelectedQueries] = useState(new Set());
  const [respondModal, setRespondModal] = useState({ open: false, query: null, response: '' });
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === 'faq manager' && isSuperAdmin) fetchFaqs();
    if (activeTab === 'audit log' && isSuperAdmin) fetchAuditLogs();
    if (activeTab === 'answer center') fetchPendingAnswers();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const statsData = await adminService.getStats();
      setStats(statsData);
      const { default: questionService } = await import('../services/questionService');
      const qs = await questionService.getQuestions();
      setQuestions(qs);
      const usersData = await adminService.getUsers();
      setUsers(usersData.users || []);
      const queriesData = await api.get('/queries/all');
      setQueries(queriesData.data.queries || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAnswers = async () => {
  setAnswersLoading(true);
  try {
    const { data } = await api.get('/answers');
    setPendingAnswers(data || []);
  } catch { setPendingAnswers([]); }
  finally { setAnswersLoading(false); }
};

  const handleApproveAnswer = async (id) => {
    try {
      await api.put(`/answers/${id}/approve`);
      fetchPendingAnswers(answersPage);
    } catch { alert('Failed to approve answer'); }
  };

  const handleRejectAnswer = async (id) => {
    try {
      await api.put(`/answers/${id}/reject`);
      fetchPendingAnswers(answersPage);
    } catch { alert('Failed to reject answer'); }
  };

  const fetchFaqs = async () => {
    try {
      const data = await adminService.getAllFaqs();
      setFaqs(data.faqs || []);
    } catch { alert('Failed to load FAQs'); }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await adminService.getAuditLogs();
      setAuditLogs(data.logs || []);
    } catch { alert('Failed to load audit logs'); }
  };

  const toggleSelect = (set, setFn, id) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setFn(next);
  };

  const toggleAll = (items, set, setFn) => {
    if (set.size === items.length) setFn(new Set());
    else setFn(new Set(items.map(i => i._id)));
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const { default: questionService } = await import('../services/questionService');
      await questionService.deleteQuestion(id);
      fetchData();
    } catch { alert('Failed to delete question'); }
  };

  const handleBulkDeleteQuestions = async () => {
    if (!selectedQuestions.size) return;
    if (!window.confirm(`Delete ${selectedQuestions.size} question(s)?`)) return;
    try {
      const { default: questionService } = await import('../services/questionService');
      await Promise.all([...selectedQuestions].map(id => questionService.deleteQuestion(id)));
      setSelectedQuestions(new Set());
      fetchData();
    } catch { alert('Failed to delete some questions'); }
  };

  const handleBulkDeleteUsers = async () => {
    if (!selectedUsers.size) return;
    if (!window.confirm(`Delete ${selectedUsers.size} user(s)?`)) return;
    try {
      await Promise.all([...selectedUsers].map(id => adminService.deleteUser(id)));
      setSelectedUsers(new Set());
      fetchData();
    } catch { alert('Failed to delete some users'); }
  };

  const handleBulkDeleteQueries = async () => {
    if (!selectedQueries.size) return;
    if (!window.confirm(`Delete ${selectedQueries.size} query(ies)?`)) return;
    try {
      await Promise.all([...selectedQueries].map(id => api.delete(`/queries/${id}`)));
      setSelectedQueries(new Set());
      fetchData();
    } catch { alert('Failed to delete some queries'); }
  };

  const handlePromoteToFaq = async (q) => {
    try {
      await adminService.createFaq({ question: q.title, answer: q.title, category: 'general' });
      alert('Successfully promoted to FAQ!');
    } catch { alert('Failed to promote to FAQ'); }
  };

  const handlePromoteUser = async (id) => {
    if (!window.confirm('Promote this user to admin?')) return;
    try { await adminService.promoteUser(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to promote user'); }
  };

  const handlePromoteToSuperAdmin = async (id) => {
    if (!window.confirm('Promote this user to super_admin?')) return;
    try { await adminService.promoteToSuperAdmin(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDemoteAdmin = async (id) => {
    if (!window.confirm('Demote this user to intern?')) return;
    try { await adminService.demoteAdmin(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to demote'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try { await adminService.deleteUser(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete user'); }
  };

  const handleResolveQuery = async (id, response) => {
    try { await api.patch(`/queries/${id}/respond`, { response, status: 'resolved' }); fetchData(); }
    catch { alert('Failed to resolve query'); }
  };

  const handlePromoteQueryToFaq = async (q) => {
    try {
      await adminService.createFaq({ question: q.question, answer: q.adminResponse || q.question, category: 'general' });
      await api.delete(`/queries/${q._id}`);
      setToast({ type: 'success', message: 'Promoted to FAQ and deleted from queries!' });
      fetchData();
    } catch { setToast({ type: 'error', message: 'Failed to promote query to FAQ' }); }
  };

  const handleDeleteQuery = async (id) => {
    if (!window.confirm('Delete this query?')) return;
    try { await api.delete(`/queries/${id}`); fetchData(); }
    catch { alert('Failed to delete query'); }
  };

  // FAQ Manager handlers
  const handleFaqSubmit = async () => {
    if (!faqForm.question || !faqForm.answer || !faqForm.category) {
      alert('All fields required'); return;
    }
    setFaqLoading(true);
    try {
      if (editingFaq) {
        await adminService.updateFaq(editingFaq._id, faqForm);
      } else {
        await adminService.createFaq(faqForm);
      }
      setFaqForm({ question: '', answer: '', category: '' });
      setEditingFaq(null);
      fetchFaqs();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save FAQ'); }
    finally { setFaqLoading(false); }
  };

  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category });
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Delete this FAQ? It will be removed from search too.')) return;
    try { await adminService.deleteFaq(id); fetchFaqs(); }
    catch { alert('Failed to delete FAQ'); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading admin area...</div>;
  if (error) return <div className="alert-error">{error}</div>;

  const openQueries = queries.filter(q => q.status === 'open');
  const tabs = ['overview', 'questions', 'users', 'unresolved queries', 'answer center',
    ...(isSuperAdmin ? ['faq manager', 'audit log'] : [])
  ];

  const bulkBarStyle = (count) => ({
    display: count > 0 ? 'flex' : 'none',
    alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--accent-light)', border: '1px solid var(--accent)',
    borderRadius: 'var(--radius-sm)', padding: '10px 16px', marginBottom: 12
  });

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Admin Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage users, questions, and content</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Users', value: stats.totalUsers, tab: 'users', color: '#6366f1' },
            { label: 'Total Questions', value: stats.totalQuestions, tab: 'questions', color: '#f59e0b' },
            { label: 'Total Answers', value: stats.totalAnswers, tab: 'answer center', color: '#10b981' },
            { label: 'Total FAQs', value: stats.totalFaqs, tab: isSuperAdmin ? 'faq manager' : null, color: '#3b82f6' },
            { label: 'Unresolved', value: openQueries.length, tab: 'unresolved queries', color: '#ef4444' },
          ].map(({ label, value, tab, color }) => (
            <div key={label} onClick={() => tab && setActiveTab(tab)} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '20px 24px',
              cursor: tab ? 'pointer' : 'default', transition: 'all 0.2s',
              borderLeft: `4px solid ${color}`
            }}
              onMouseOver={e => { if (tab) e.currentTarget.style.borderColor = color; }}
              onMouseOut={e => { if (tab) e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
              {tab && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Click to view →</div>}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', border: 'none', background: 'transparent',
            fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            textTransform: 'capitalize', transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}>
            {tab}
            {tab === 'unresolved queries' && openQueries.length > 0 && (
              <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {openQueries.length}
              </span>
            )}
            {tab === 'answer center' && stats?.pendingAnswers > 0 && (
              <span style={{ marginLeft: 6, background: '#f59e0b', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {stats.pendingAnswers}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <h4 style={{ marginBottom: 12, fontSize: 15 }}>Recent Questions</h4>
            {questions.slice(0, 3).map(q => (
              <div key={q._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{q.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Status: {q.status}</div>
              </div>
            ))}
            <button onClick={() => setActiveTab('questions')} style={{ marginTop: 12, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <h4 style={{ marginBottom: 12, fontSize: 15 }}>Recent Unresolved Queries</h4>
            {openQueries.slice(0, 3).map(q => (
              <div key={q._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{q.question}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                  {q.user?.name || 'Unknown'} · {new Date(q.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {openQueries.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No unresolved queries 🎉</p>}
            <button onClick={() => setActiveTab('unresolved queries')} style={{ marginTop: 12, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={bulkBarStyle(selectedQuestions.size)}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{selectedQuestions.size} selected</span>
            <button onClick={handleBulkDeleteQuestions} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', background: 'rgba(220,38,38,0.08)', color: 'var(--error)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete Selected</button>
          </div>
          {questions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
              <Checkbox checked={selectedQuestions.size === questions.length} onChange={() => toggleAll(questions, selectedQuestions, setSelectedQuestions)} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => toggleAll(questions, selectedQuestions, setSelectedQuestions)}>Select all</span>
            </div>
          )}
          {questions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No questions yet.</p>}
          {questions.map(q => (
            <div key={q._id} style={{
              background: selectedQuestions.has(q._id) ? 'var(--accent-light)' : 'var(--bg-card)',
              border: `1px solid ${selectedQuestions.has(q._id) ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <Checkbox checked={selectedQuestions.has(q._id)} onChange={() => toggleSelect(selectedQuestions, setSelectedQuestions, q._id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{q.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: q.status === 'answered' ? 'rgba(16,185,129,0.1)' : 'rgba(217,119,6,0.1)', color: q.status === 'answered' ? 'var(--success)' : 'var(--warning)' }}>{q.status?.toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handlePromoteToFaq(q)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)', background: 'rgba(16,185,129,0.08)', color: 'var(--success)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⬆ Promote to FAQ</button>
                <button onClick={() => handleDeleteQuestion(q._id)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', background: 'rgba(220,38,38,0.08)', color: 'var(--error)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={bulkBarStyle(selectedUsers.size)}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{selectedUsers.size} selected</span>
            <button onClick={handleBulkDeleteUsers} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', background: 'rgba(220,38,38,0.08)', color: 'var(--error)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete Selected</button>
          </div>
          {users.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
              <Checkbox checked={selectedUsers.size === users.length} onChange={() => toggleAll(users, selectedUsers, setSelectedUsers)} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => toggleAll(users, selectedUsers, setSelectedUsers)}>Select all</span>
            </div>
          )}
          {users.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No users found.</p>}
          {users.map(u => (
            <div key={u._id} style={{
              background: selectedUsers.has(u._id) ? 'var(--accent-light)' : 'var(--bg-card)',
              border: `1px solid ${selectedUsers.has(u._id) ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Checkbox checked={selectedUsers.has(u._id)} onChange={() => toggleSelect(selectedUsers, setSelectedUsers, u._id)} />
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email} · ⭐ {u.points || 0} pts</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RoleBadge role={u.role} />
                {/* Admin can promote interns to admin */}
                {u.role === 'intern' && (
                  <button onClick={() => handlePromoteUser(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⬆ Admin</button>
                )}
                {/* Super admin extras */}
                {isSuperAdmin && u.role === 'admin' && (
                  <>
                    <button onClick={() => handlePromoteToSuperAdmin(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #ca8a04', background: 'rgba(234,179,8,0.08)', color: '#ca8a04', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⬆ Super</button>
                    <button onClick={() => handleDemoteAdmin(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--warning)', background: 'rgba(217,119,6,0.08)', color: 'var(--warning)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⬇ Demote</button>
                  </>
                )}
                {isSuperAdmin && u.role === 'intern' && (
                  <button onClick={() => handlePromoteToSuperAdmin(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #ca8a04', background: 'rgba(234,179,8,0.08)', color: '#ca8a04', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⬆ Super</button>
                )}
                {/* Can't delete super_admin, admin can't delete admin */}
                {u.role !== 'super_admin' && (isSuperAdmin || u.role === 'intern') && (
                  <button onClick={() => handleDeleteUser(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', background: 'rgba(220,38,38,0.08)', color: 'var(--error)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unresolved Queries Tab */}
      {activeTab === 'unresolved queries' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={bulkBarStyle(selectedQueries.size)}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{selectedQueries.size} selected</span>
            <button onClick={handleBulkDeleteQueries} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', background: 'rgba(220,38,38,0.08)', color: 'var(--error)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete Selected</button>
          </div>
          {queries.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
              <Checkbox checked={selectedQueries.size === queries.length} onChange={() => toggleAll(queries, selectedQueries, setSelectedQueries)} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => toggleAll(queries, selectedQueries, setSelectedQueries)}>Select all</span>
            </div>
          )}
          {queries.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No unresolved queries 🎉</p>}
          {queries.map(q => (
            <div key={q._id} style={{
              background: selectedQueries.has(q._id) ? 'var(--accent-light)' : 'var(--bg-card)',
              border: `1px solid ${selectedQueries.has(q._id) ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 10, transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                  <Checkbox checked={selectedQueries.has(q._id)} onChange={() => toggleSelect(selectedQueries, setSelectedQueries, q._id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{q.question}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: q.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: q.status === 'resolved' ? 'var(--success)' : '#ef4444' }}>{q.status?.toUpperCase()}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.user?.name || 'Unknown'} · {new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handlePromoteQueryToFaq(q)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)', background: 'rgba(16,185,129,0.08)', color: 'var(--success)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>⬆ Promote to FAQ</button>
                  {q.status !== 'resolved' && (
                    <button onClick={() => setRespondModal({ open: true, query: q, response: '' })} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Respond & Resolve</button>
                  )}
                  <button onClick={() => handleDeleteQuery(q._id)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', background: 'rgba(220,38,38,0.08)', color: 'var(--error)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete</button>
                </div>
              </div>
              {q.adminResponse && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent)' }}>
                  <strong>Admin response:</strong> {q.adminResponse}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Answer Center Tab */}
      {activeTab === 'answer center' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {answersLoading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}
    {!answersLoading && pendingAnswers.length === 0 && (
      <p style={{ color: 'var(--text-muted)' }}>No answers yet.</p>
    )}
    {pendingAnswers.map(a => (
      <div key={a._id} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {a.isAccepted && (
              <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'inline-block' }}>
                ✓ Accepted
              </span>
            )}
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
              {a.author?.name || 'Unknown'}
              <span style={{ fontSize: 11, color: 'var(--accent)' }}>⭐ {a.author?.points || 0} pts</span>
              <RoleBadge role={a.author?.role || 'intern'} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              {a.author?.email} · {new Date(a.createdAt).toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {a.content?.slice(0, 300)}{a.content?.length > 300 ? '...' : ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-word' }}>
              On: <strong>{a.question?.title || 'Deleted question'}</strong>
              <span style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>▲</span> {a.upvotes?.length || 0}
  <span style={{ color: 'var(--text-muted)', fontWeight: 700, marginLeft: 6 }}>▼</span> {a.downvotes?.length || 0}
</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {!a.isAccepted && (
              <button onClick={async () => {
                try { await api.put(`/answers/${a._id}/accept`); fetchPendingAnswers(); }
                catch { alert('Failed to accept'); }
              }} style={{
                padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)',
                background: 'rgba(16,185,129,0.08)', color: 'var(--success)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>✓ Accept</button>
            )}
            <button onClick={async () => {
              if (!window.confirm('Delete this answer?')) return;
              try { await api.delete(`/answers/${a._id}`); fetchPendingAnswers(); }
              catch { alert('Failed to delete'); }
            }} style={{
              padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)',
              background: 'rgba(220,38,38,0.08)', color: 'var(--error)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>🗑 Delete</button>
            {a.author?.role !== 'super_admin' && (
              <button onClick={async () => {
                if (!window.confirm(`Ban ${a.author?.name}? This will delete their account.`)) return;
                try { await adminService.deleteUser(a.author._id); fetchPendingAnswers(); fetchData(); }
                catch { alert('Failed to ban user'); }
              }} style={{
                padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #f59e0b',
                background: 'rgba(245,158,11,0.08)', color: '#f59e0b',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>🚫 Ban</button>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
)}

      {/* FAQ Manager Tab (super_admin only) */}
      {activeTab === 'faq manager' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Form */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
            <h4 style={{ marginBottom: 16, fontSize: 15 }}>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputStyle} placeholder="Question" value={faqForm.question}
                onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} />
              <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} placeholder="Answer"
                value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} />
              <input style={inputStyle} placeholder="Category (e.g. general, technical)" value={faqForm.category}
                onChange={e => setFaqForm(f => ({ ...f, category: e.target.value }))} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleFaqSubmit} disabled={faqLoading} style={{
                  padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
                  background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: faqLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: faqLoading ? 0.7 : 1
                }}>{faqLoading ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Add FAQ'}</button>
                {editingFaq && (
                  <button onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '', category: '' }); }} style={{
                    padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}>Cancel</button>
                )}
              </div>
            </div>
          </div>

          {/* FAQ List */}
          {faqs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No FAQs yet.</p>}
          {faqs.map(faq => (
            <div key={faq._id} style={{
              background: editingFaq?._id === faq._id ? 'var(--accent-light)' : 'var(--bg-card)',
              border: `1px solid ${editingFaq?._id === faq._id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', padding: '16px 20px', transition: 'all 0.15s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{faq.question}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, whiteSpace: 'pre-wrap' }}>{faq.answer}</div>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>{faq.category}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleEditFaq(faq)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏ Edit</button>
                  <button onClick={() => handleDeleteFaq(faq._id)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', background: 'rgba(220,38,38,0.08)', color: 'var(--error)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Modal */}
      {toast && (
        <div onClick={() => setToast(null)} style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            padding: 32, width: 420, maxWidth: '90vw',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: toast.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>
              {toast.type === 'success' ? '✅' : '❌'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {toast.type === 'success' ? 'Success' : 'Error'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {toast.message}
            </div>
            <button onClick={() => setToast(null)} style={{
              marginTop: 8, padding: '9px 28px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'var(--accent)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>OK</button>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {respondModal.open && (
        <div onClick={() => setRespondModal({ open: false, query: null, response: '' })} style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            padding: 28, width: 500, maxWidth: '90vw',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Respond & Resolve</h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Query:</strong> {respondModal.query.question}
            </div>
            <textarea
              autoFocus
              placeholder="Type your response..."
              value={respondModal.response}
              onChange={e => setRespondModal(m => ({ ...m, response: e.target.value }))}
              style={{
                width: '100%', minHeight: 120, resize: 'vertical', boxSizing: 'border-box',
                padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setRespondModal({ open: false, query: null, response: '' })} style={{
                padding: '9px 20px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
              <button
                disabled={!respondModal.response.trim()}
                onClick={() => {
                  handleResolveQuery(respondModal.query._id, respondModal.response);
                  setRespondModal({ open: false, query: null, response: '' });
                }}
                style={{
                  padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
                  background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: respondModal.response.trim() ? 'pointer' : 'not-allowed',
                  opacity: respondModal.response.trim() ? 1 : 0.5, fontFamily: 'inherit',
                }}
              >Resolve</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Tab (super_admin only) */}
      {activeTab === 'audit log' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last 100 actions</p>
            <button onClick={fetchAuditLogs} style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>↻ Refresh</button>
          </div>
          {auditLogs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No audit logs yet.</p>}
          {auditLogs.map(log => (
            <div key={log._id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: log.action.includes('delete') ? '#ef4444' :
                    log.action.includes('promote') ? '#10b981' :
                      log.action.includes('demote') ? '#f59e0b' : 'var(--accent)'
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ACTION_LABELS[log.action] || log.action}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    by <strong>{log.performedBy?.name || 'Unknown'}</strong>
                    {log.targetUser && <> → <strong>{log.targetUser.name}</strong></>}
                    {log.details && <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>· {log.details}</span>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminArea;