import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { searchFAQs, getSuggestions } from '../api/searchApi';
import SearchBar from '../components/SearchBar';
import SearchSuggestions from '../components/SearchSuggestions';
import FaqAssistant from '../components/FaqAssistant';
import '../styles/search.css';
import '../styles/yaksha.css';
import NotificationBell from '../components/NotificationBell';

const CATEGORIES = [
  'about-internship', 'certificate', 'code-of-conduct', 'coursework-vibe',
  'interviews', 'noc', 'rosetta', 'selection-offer', 'team-formation',
  'timing-dates', 'vibe-platform', 'work-mentorship', 'yaksha-chat',
  'programme-overview',
];

export default function UserPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchFaqIds, setSearchFaqIds] = useState(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [highlightedFaq, setHighlightedFaq] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const debounceRef = useRef(null);
  const overviewRef = useRef(null);
  const faqRefs = useRef({});
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    setDark(theme === 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    fetchAllFAQs();
    fetchOverview();
  }, []);

  const fetchAllFAQs = async () => {
    setFaqsLoading(true);
    try {
      const { data } = await api.get('/faqs?limit=200');
      setFaqs(data.results || []);
    } catch {
      setFaqs([]);
    } finally {
      setFaqsLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/internship/overview');
      if (data.success) setOverview(data.sections);
    } catch {
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setSuggestionsLoading(true);
    try {
      const data = await getSuggestions(q);
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 3) return;
    setQuery(q);
    setShowSuggestions(false);
    setSemanticLoading(true);
    try {
      const data = await searchFAQs(q);
      if (data.sources && data.sources.length > 0) {
        const ids = data.sources.map(s => s.faqId);
        setSearchFaqIds(ids);
        setActiveCategory(null);
        setOverviewOpen(false);
        setTimeout(() => {
          const first = faqRefs.current[ids[0]];
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      } else {
        setSearchFaqIds([]);
      }
    } catch {
      setSearchFaqIds([]);
    } finally {
      setSemanticLoading(false);
    }
  }, []);

  const handleSelectSuggestion = useCallback((suggestion) => {
    if (!suggestion) { setQuery(''); setSuggestions([]); setShowSuggestions(false); return; }
    setQuery(suggestion.question);
    setShowSuggestions(false);
    handleSearch(suggestion.question);
  }, [handleSearch]);

  const handleInputChange = (val) => {
    setQuery(val);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 600);
  };

  const handleInputKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch(query);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) handleSelectSuggestion(suggestions[selectedIndex]);
      else handleSearch(query);
    } else if (e.key === 'Escape') setShowSuggestions(false);
  };

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  const isAdminOrSuper = user?.role === 'admin' || user?.role === 'super_admin';

  const roleLabel = user?.role === 'super_admin' ? 'Super Admin'
    : user?.role === 'admin' ? 'Administrator' : 'Member';

  const roleBadgeStyle = user?.role === 'super_admin'
    ? { background: 'rgba(234,179,8,0.15)', color: '#ca8a04' }
    : user?.role === 'admin'
    ? { background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }
    : { background: 'var(--accent-light)', color: 'var(--accent)' };

  const showOverview = overviewOpen && !searchFaqIds;
  const displayedFaqs = searchFaqIds ? faqs.filter(f => searchFaqIds.includes(f._id)) : activeCategory ? faqs.filter(f => f.category === activeCategory) : faqs;
  const topFaqs = searchFaqIds ? [] : faqs.slice(0, 4);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <div style={{
        width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 50
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
          Samagama FAQs
        </div>
        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: 'FAQ Hub', path: '/user' },
{ label: 'Dashboard', path: '/dashboard' },
...(!isAdminOrSuper ? [
  { label: 'Ask Question', path: '/ask-question' },
  { label: 'My Questions', path: '/my-questions' },
] : []),
{ label: 'Discussion Room', path: '/answer-center' },
{ label: 'Leaderboard', path: '/leaderboard' },
          ].map(({ label, path }) => (
            <a key={path} href={path} style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 14,
              fontWeight: path === '/user' ? 600 : 500,
              color: path === '/user' ? 'var(--accent)' : 'var(--text-secondary)',
              background: path === '/user' ? 'var(--accent-light)' : 'transparent',
              textDecoration: 'none', transition: 'all 150ms ease'
            }}
              onMouseOver={e => { if (path !== '/user') { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}}
              onMouseOut={e => { if (path !== '/user') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}>
              {label}
            </a>
          ))}
          {isAdminOrSuper && (
            <a href="/admin" style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 14,
              fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 150ms ease'
            }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              Admin Area
            </a>
          )}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{user?.name}</div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, ...roleBadgeStyle }}>
              {roleLabel}
            </span>
          </div>
          <button onClick={() => setDark(d => !d)} style={{
            width: '100%', padding: '8px', marginBottom: 8,
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'transparent', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13, fontFamily: 'inherit'
          }}>
            {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            fontSize: 13, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit'
          }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--error)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)', backdropFilter: 'blur(16px)'
        }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Dashboard / <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>FAQ Hub</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell />
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</span>
          </div>
        </header>

        <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '32px 24px 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 8 }}>How can we help you?</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Search our knowledge base for instant answers</p>
          </div>

          <div ref={searchContainerRef} className="faq-page-search-area" style={{ marginBottom: 24 }}>
            <SearchBar onSearch={handleSearch} onSelectSuggestion={handleSelectSuggestion} loading={semanticLoading} onQueryChange={handleInputChange} onKeyDown={handleInputKeyDown} />
            {showSuggestions && <SearchSuggestions suggestions={suggestions} loading={suggestionsLoading} onSelect={handleSelectSuggestion} selectedIndex={selectedIndex} query={query} />}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {CATEGORIES.map(cat => {
              const isActive = cat === activeCategory;
              return (
                <button key={cat} onClick={() => {
                  if (cat === 'programme-overview') {
                    if (overviewOpen) { setOverviewOpen(false); return; }
                    setQuery(''); setSearchFaqIds(null); setActiveCategory(null); setOverviewOpen(true);
                    setTimeout(() => overviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                  } else {
                    setActiveCategory(isActive ? null : cat); setSearchFaqIds(null); setOverviewOpen(false);
                  }
                }} style={{
                  padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease', textTransform: 'capitalize'
                }}
                  onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}}
                  onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}}>
                  {cat === 'programme-overview' ? 'Programme Overview' : cat.replace(/-/g, ' ')}
                </button>
              );
            })}
          </div>

          {showOverview && (
            <div ref={overviewRef} style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Programme Overview</span>
                <button onClick={() => setOverviewOpen(false)} style={{ padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
              </div>
              <div style={{ padding: '20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {overviewLoading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : overview ? overview.map((s, i) => sectionContent(s, i)) : <p style={{ color: 'var(--text-muted)' }}>Failed to load overview</p>}
              </div>
            </div>
          )}

          {!showOverview && (faqsLoading ? (
            <div>{[1,2,3,4,5].map(i => <div key={i} style={{ height: 48, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }} />)}</div>
          ) : (
            <div>
              {!searchFaqIds && !activeCategory && topFaqs.length > 0 && (
                <>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Trending FAQs</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
                    {topFaqs.map(faq => (
                      <div key={faq._id} onClick={() => document.querySelector(`details[data-faq-id="${faq._id}"]`)?.scrollIntoView({ behavior: 'smooth' })}
                        style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', transition: 'border-color 150ms ease' }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        {faq.question}
                      </div>
                    ))}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>All FAQs</h3>
                </>
              )}
              {activeCategory && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'capitalize' }}>Showing: <strong style={{ color: 'var(--text-primary)' }}>{activeCategory.replace(/-/g, ' ')}</strong></p>}
              {displayedFaqs.length === 0 && !faqsLoading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{searchFaqIds ? 'No matching FAQs found.' : 'No FAQs in this category yet.'}</div>}
              {displayedFaqs.map(faq => {
                const matched = searchFaqIds?.includes(faq._id);
                return (
                  <details key={faq._id} data-faq-id={faq._id} open={!!matched || highlightedFaq === faq._id}
                    ref={el => { if (el) faqRefs.current[faq._id] = el; }}
                    onToggle={e => { if (!e.target.open && highlightedFaq === faq._id) setHighlightedFaq(null); }}
                    style={{ display: searchFaqIds && !matched ? 'none' : 'block', background: matched ? 'var(--accent-light)' : 'var(--bg-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 8, overflow: 'hidden' }}>
                    <summary style={{ padding: '14px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{faq.question}</summary>
                    <div style={{ padding: '0 20px 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{faq.answer}</div>
                  </details>
                );
              })}
            </div>
          ))}
        </div>

        {user.role !== 'admin' && user.role !== 'super_admin' && (
          <button onClick={() => navigate('/query')} title="Raise a Query" style={{ position: 'fixed', bottom: 100, right: 24, zIndex: 100, width: 56, height: 56, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', transition: 'transform 150ms ease' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        )}
        <FaqAssistant />
      </div>
    </div>
  );
}