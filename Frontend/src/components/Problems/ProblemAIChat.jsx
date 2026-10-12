import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../contexts/AuthContext';
import './ProblemAIChat.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const MAX_MESSAGES = 40;

const SUGGESTIONS = [
  { label: 'Explain the problem simply', text: 'Explain this problem in simple words, with a tiny example. Do not suggest an approach yet.' },
  { label: 'Give me a hint', text: 'Give me a small hint to get started without spoiling the solution.' },
  { label: 'Key observation?', text: 'What is the key observation or trick I should notice for this problem?' },
  { label: 'Which technique fits?', text: 'Which data structure or technique fits this problem, and why?' },
  { label: 'Edge cases', text: 'What edge cases should I test before submitting?' },
  { label: 'Check my code', text: 'Look at my current code. What is wrong or missing? Point to the specific issue.', withCode: true },
  { label: 'Target complexity', text: 'What time and space complexity should I aim for given the constraints?' },
];

const storageKey = (userId, problemId) => `ca_ptutor_${userId || 'anon'}_${problemId}`;

function ProblemAIChat({ problemId, getCode, language }) {
  const { user } = useAuth();
  const key = storageKey(user?._id, problemId);

  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [shareCode, setShareCode] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_MESSAGES))); } catch { /* storage unavailable */ }
  }, [key, messages]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Grow the textarea with its content (up to a few lines).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const send = useCallback(async (text, { withCode = shareCode } = {}) => {
    const content = (text ?? '').trim();
    if (!content || sending) return;

    const userMsg = { id: `u${Date.now()}`, role: 'user', content, sharedCode: withCode };
    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, userMsg].slice(-MAX_MESSAGES));
    setInput('');
    setSending(true);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/ai/problem-chat`,
        {
          problemId,
          message: content,
          history,
          language,
          code: withCode ? getCode?.() : undefined,
        },
        { withCredentials: true }
      );
      if (!res.data?.response) throw new Error(res.data?.message || 'Empty reply');
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', content: res.data.response }].slice(-MAX_MESSAGES));
    } catch (err) {
      const msg = err.response?.data?.message || 'The tutor could not answer. Please try again.';
      setMessages((m) => [...m, { id: `e${Date.now()}`, role: 'assistant', content: msg, error: true, retry: { content, withCode } }].slice(-MAX_MESSAGES));
    } finally {
      setSending(false);
    }
  }, [messages, sending, shareCode, problemId, language, getCode]);

  const retry = (msg) => {
    setMessages((m) => m.filter((x) => x.id !== msg.id));
    send(msg.retry.content, { withCode: msg.retry.withCode });
  };

  const clear = () => {
    if (messages.length === 0 || window.confirm('Clear this conversation?')) setMessages([]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="ptutor">
      <div className="ptutor-head">
        <div>
          <h3>AI Tutor</h3>
          <p>Ask anything about <em>this</em> problem. I&apos;ll nudge you instead of handing over the answer.</p>
        </div>
        {messages.length > 0 && (
          <button className="ptutor-clear" onClick={clear} title="Clear conversation">Clear</button>
        )}
      </div>

      <div className="ptutor-list" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="ptutor-empty">
            <div className="ptutor-empty-icon" aria-hidden="true">💬</div>
            <p>Stuck, or just want to talk it through? Pick a starter or type your own question.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`ptutor-msg ${m.role}${m.error ? ' error' : ''}`}>
            <div className="ptutor-bubble">
              {m.role === 'assistant' && !m.error ? (
                <ReactMarkdown>{m.content}</ReactMarkdown>
              ) : (
                <p>{m.content}</p>
              )}
              {m.sharedCode && <span className="ptutor-tag">your code was shared</span>}
              {m.error && m.retry && (
                <button className="ptutor-retry" onClick={() => retry(m)}>Retry</button>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="ptutor-msg assistant">
            <div className="ptutor-bubble ptutor-typing" aria-label="Tutor is typing">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      <div className="ptutor-chips">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            className="ptutor-chip"
            disabled={sending}
            onClick={() => send(s.text, { withCode: !!s.withCode || shareCode })}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form
        className="ptutor-form"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <label className="ptutor-share">
          <input type="checkbox" checked={shareCode} onChange={(e) => setShareCode(e.target.checked)} />
          Include my current code
        </label>
        <div className="ptutor-inputrow">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about this problem…"
            maxLength={2000}
            disabled={sending}
            aria-label="Message to the AI tutor"
          />
          <button type="submit" className="ptutor-send" disabled={sending || !input.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProblemAIChat;
