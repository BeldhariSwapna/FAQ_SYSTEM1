import { useState, useRef, useEffect, useCallback } from 'react';
import { getRecentSearches as apiGetRecent, saveRecentSearch as apiSaveRecent } from '../api/searchApi';

const RECENT_KEY = 'recentSearches_v1';

export default function SearchBar({ onSearch, onSelectSuggestion, loading, onQueryChange, onKeyDown }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    // try fetching server-side recent searches (if user authenticated)
    let mounted = true;
    (async () => {
      try {
        const res = await apiGetRecent();
        if (mounted && res?.success && Array.isArray(res.searches) && res.searches.length > 0) {
          setRecent(res.searches);
          localStorage.setItem(RECENT_KEY, JSON.stringify(res.searches));
        }
      } catch (e) {
        // ignore if unauthenticated or network error
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveRecent = useCallback((q) => {
    try {
      if (!q) return;
      const normalized = q.trim();
      if (!normalized) return;
      const next = [normalized, ...recent.filter((r) => r !== normalized)].slice(0, 10);
      setRecent(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      // attempt to persist server-side; ignore failures
      (async () => {
        try {
          await apiSaveRecent(normalized);
        } catch (_) {}
      })();
    } catch (e) {
      // ignore
    }
  }, [recent]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (query.trim().length >= 3) {
      onSearch(query.trim());
      saveRecent(query.trim());
    }
  }, [query, onSearch, saveRecent]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
    onKeyDown?.(e);
  };

  useEffect(() => {
    const handler = (e) => {
      // focus search when user presses `/` and focus isn't on an input or textarea
      if (e.key === '/' && document.activeElement && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        // clear and blur
        setQuery('');
        inputRef.current?.blur();
        onSelectSuggestion?.(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSelectSuggestion]);

  const handleSelectRecent = (q) => {
    setQuery(q);
    onQueryChange?.(q);
    onSearch?.(q);
    saveRecent(q);
  };

  return (
    <div className={`search-bar-wrapper-outer`}>
      <form onSubmit={handleSubmit} className={`search-bar-wrapper ${focused ? 'search-bar-focused' : ''}`}>
        <div className="search-bar-inner">
          <svg className="search-bar-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-bar-input"
            placeholder="Ask anything... (press / to focus)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); onQueryChange?.(e.target.value); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onKeyDown={handleKeyDown}
            minLength={3}
            maxLength={300}
            autoComplete="off"
          />
          {loading && (
            <span className="search-bar-spinner" />
          )}
          {!loading && query && (
            <button type="button" className="search-bar-clear" onClick={() => { setQuery(''); onSelectSuggestion(null); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <button type="submit" className="search-bar-submit" title="Search" disabled={query.trim().length < 3}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </form>

      {focused && !query && recent && recent.length > 0 && (
        <div className="search-recent">
          <div className="search-recent-header">Recent searches</div>
          {recent.map((r, i) => (
            <button key={`${r}-${i}`} className="search-recent-item" onMouseDown={(e) => { e.preventDefault(); handleSelectRecent(r); }}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
