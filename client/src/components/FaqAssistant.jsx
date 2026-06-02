import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchFAQs } from '../api/searchApi';

export default function FaqAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const sendQuestion = async (q) => {
    if (!q || busy) return;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setBusy(true);
    try {
      const data = await searchFAQs(q);
      const hasSources = data.sources?.length > 0;
      const isGeneric = /no (relevant )?information|does not provide|lacks sufficient|couldn't find|don't have enough|couldn't find an answer/i.test(data.answer || '');
      if (hasSources && !isGeneric) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.answer, sources: data.sources, confidence: data.confidence }]);
      } else if (hasSources) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.sources[0].answer || data.sources[0].question, sources: data.sources, confidence: data.confidence }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "I couldn't find a confident answer in the FAQ system.", noAnswer: true, query: q }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Please try again.', noAnswer: false }]);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendQuestion(query.trim());
  };

  return (
    <>
      {!open && (
        <button
          className="ym-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open Yaksha-mini chat"
        >
          <span className="ym-launcher-tooltip">Ask FAQ Assistant</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      <div className="yaksha-mini" hidden={!open}>
        <div className="yaksha-mini-head">
          <div className="ym-titles">
            <span className="ym-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="ym-title-stack">
              <span className="ym-title">FAQ Assistant</span>
              <span className="ym-sub">
                <span className="ym-online-dot" />
                Answers from Samagama FAQs
              </span>
            </span>
          </div>
          <button type="button" className="ym-close" onClick={() => setOpen(false)} aria-label="Close chat">&times;</button>
        </div>

        <div className="yaksha-mini-log" ref={logRef} role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="ym-welcome">
              Hi — I'm the FAQ Assistant. Ask me about the Vicharanashala internship — VINS, NOC, dates, certificates, and more.
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`ym-msg ${msg.role}`}>
              <div className="ym-bubble">
                {msg.text}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="ym-sources">
                    <span className="ym-sources-label">RELATED FAQS</span>
                    {msg.sources.slice(0, 3).map((s, si) => (
                      <div key={si} className="ym-source-item" onClick={() => sendQuestion(s.question)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && sendQuestion(s.question)}>{s.question}</div>
                    ))}
                  </div>
                )}
                {msg.noAnswer && user.role !== 'admin' && user.role !== 'super_admin' && (
                  <button
                    className="ym-raise-btn"
                    onClick={() => {
                      setOpen(false);
                      navigate('/query', { state: { question: msg.query } });
                    }}
                  >
                    Raise a Query
                  </button>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="ym-msg assistant">
              <div className="ym-bubble thinking">
                <span className="ym-dots"><span /><span /><span /></span>
              </div>
            </div>
          )}
        </div>

        <form className="yaksha-mini-form" onSubmit={handleSubmit} autoComplete="off">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a question..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            maxLength={300}
            disabled={busy}
            aria-label="Your question for Yaksha-mini"
          />
          <button type="submit" className="ym-send-btn" disabled={busy || !query.trim()} aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </form>

        <p className="yaksha-mini-foot">
          For your specific case, log in and ask on samagama.in
        </p>
      </div>
    </>
  );
}
