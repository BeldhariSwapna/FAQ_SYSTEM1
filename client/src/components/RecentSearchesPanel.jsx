import { useEffect, useState } from 'react';
import { getRecentSearches } from '../api/searchApi';

const LOCAL_KEY = 'recentSearches_v1';

export default function RecentSearchesPanel({ title = 'Recent searches', onSelect, className = '' }) {
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadRecentSearches = async () => {
      let merged = [];

      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (raw) {
          const localItems = JSON.parse(raw);
          if (Array.isArray(localItems)) merged = localItems;
        }
      } catch (_) {
        // ignore localStorage issues
      }

      try {
        const data = await getRecentSearches();
        if (data?.success && Array.isArray(data.searches)) {
          merged = [...new Set([...(data.searches || []), ...merged])].slice(0, 10);
        }
      } catch (_) {
        // ignore unauthenticated/network errors and keep local fallback
      }

      if (mounted) {
        setRecentSearches(merged);
      }
    };

    loadRecentSearches();
    return () => {
      mounted = false;
    };
  }, []);

  if (!recentSearches.length) return null;

  return (
    <div className={`glass-card ${className}`.trim()}>
      <h4 style={{ marginTop: 0, marginBottom: '0.9rem' }}>{title}</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {recentSearches.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect?.(item)}
            style={{
              padding: '8px 12px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              textAlign: 'left',
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}