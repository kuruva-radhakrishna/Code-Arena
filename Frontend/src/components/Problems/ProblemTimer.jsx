import { useCallback, useEffect, useRef, useState } from 'react';
import './ProblemTimer.css';
import { formatClock } from '../../utils/formatClock';

// Rough "interview pace" targets in minutes.
const TARGET_MINUTES = { easy: 20, medium: 40, hard: 60 };

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

/**
 * Per-problem stopwatch (each problem keeps its own time, saved in this browser).
 *
 * It only counts *active* time: it runs while this problem is open and the tab
 * is visible, and pauses automatically when you switch tabs, minimise the
 * window, or leave the page. Coming back resumes from where it stopped.
 * The pause button stops it until you resume it yourself. Once the problem is
 * solved it stops for good.
 *
 * Mount it with `key={problemId}` so each problem gets a fresh instance.
 */
function ProblemTimer({ problemId, difficulty = 'medium', userId = 'anon', solved = false, onFinish }) {
  const key = `ca_timer_${userId}_${problemId}`;

  // elapsed = banked ms; segStart = start of the segment currently running (null = not running)
  const [saved] = useState(() => read(key) || {});
  const [elapsed, setElapsed] = useState(Number(saved.elapsed) || 0);
  const [segStart, setSegStart] = useState(
    saved.finished || saved.manualPaused || document.hidden ? null : Date.now()
  );
  const [finished, setFinished] = useState(!!saved.finished);
  const [manualPaused, setManualPaused] = useState(!!saved.manualPaused);
  const [now, setNow] = useState(Date.now());
  const [hidden, setHidden] = useState(() => read('ca_timer_hidden') === true);

  const live = useRef({});
  const total = elapsed + (segStart != null ? now - segStart : 0);
  live.current = { total, finished, manualPaused, segStart, elapsed };

  const persist = useCallback((over = {}) => {
    const s = live.current;
    write(key, {
      elapsed: s.segStart != null ? s.elapsed + (Date.now() - s.segStart) : s.elapsed,
      finished: s.finished,
      manualPaused: s.manualPaused,
      ...over,
    });
  }, [key]);

  // tick + save once a second while running
  useEffect(() => {
    if (segStart == null) return undefined;
    const id = setInterval(() => { setNow(Date.now()); persist(); }, 1000);
    return () => clearInterval(id);
  }, [segStart, persist]);

  // auto-pause when the tab is hidden, auto-resume when it is shown again
  useEffect(() => {
    const onVisibility = () => {
      const s = live.current;
      if (s.finished || s.manualPaused) return;
      if (document.hidden) {
        if (s.segStart != null) {
          setElapsed(s.elapsed + (Date.now() - s.segStart));
          setSegStart(null);
        }
      } else if (s.segStart == null) {
        setNow(Date.now());
        setSegStart(Date.now());
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // leaving the problem (navigation / unmount / closing the tab) banks the time
  useEffect(() => {
    const save = () => persist();
    window.addEventListener('pagehide', save);
    return () => { window.removeEventListener('pagehide', save); persist(); };
  }, [persist]);

  const pause = () => {
    setElapsed(live.current.total);
    setSegStart(null);
    setManualPaused(true);
    persist({ elapsed: live.current.total, manualPaused: true });
  };
  const resume = () => {
    setNow(Date.now());
    setSegStart(Date.now());
    setManualPaused(false);
    persist({ manualPaused: false });
  };
  const reset = () => {
    setElapsed(0);
    setFinished(false);
    setManualPaused(false);
    setNow(Date.now());
    setSegStart(Date.now());
    write(key, { elapsed: 0, finished: false, manualPaused: false });
  };

  // stop the clock the first time the problem is solved
  useEffect(() => {
    const s = live.current;
    if (!solved || s.finished) return;
    const final = s.total;
    setElapsed(final);
    setSegStart(null);
    setFinished(true);
    write(key, { elapsed: final, finished: true, manualPaused: false });
    if (onFinish) onFinish(final);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved]);

  const toggleHidden = () => {
    setHidden((h) => { write('ca_timer_hidden', !h); return !h; });
  };

  const running = segStart != null;
  const targetMs = (TARGET_MINUTES[difficulty] || 40) * 60 * 1000;
  const ratio = total / targetMs;
  const tone = finished ? 'done' : ratio < 0.6 ? 'ok' : ratio <= 1 ? 'warn' : 'over';

  let status;
  if (finished) status = ratio <= 1 ? 'Solved within target' : 'Solved';
  else if (manualPaused) status = 'Paused';
  else if (!running) status = 'Paused (tab hidden)';
  else if (ratio < 0.6) status = 'On pace';
  else if (ratio <= 1) status = 'Wrap up soon';
  else status = `Over by ${formatClock(total - targetMs)}`;

  if (hidden) {
    return <button className="ptimer-show" onClick={toggleHidden} title="Show timer">⏱ Timer</button>;
  }

  return (
    <div
      className={`ptimer ptimer-${tone}`}
      role="timer"
      aria-label="Problem timer"
      title="Time spent on this problem. Saved per problem; counts only while this page is open and visible."
    >
      <div className="ptimer-main">
        <span className="ptimer-clock">{formatClock(total)}</span>
        <span className="ptimer-controls">
          {!finished && (
            <button
              className="ptimer-icon"
              onClick={manualPaused ? resume : pause}
              title={manualPaused ? 'Resume' : 'Pause'}
              aria-label={manualPaused ? 'Resume timer' : 'Pause timer'}
            >
              {manualPaused ? '▶' : '⏸'}
            </button>
          )}
          <button className="ptimer-icon" onClick={reset} title="Restart this problem's timer" aria-label="Restart timer">↺</button>
          <button className="ptimer-icon" onClick={toggleHidden} title="Hide timer" aria-label="Hide timer">✕</button>
        </span>
      </div>
      <div className="ptimer-meta">
        <span className="ptimer-status">{status}</span>
        <span className="ptimer-target">Target {TARGET_MINUTES[difficulty] || 40}m</span>
      </div>
      <div className="ptimer-bar" aria-hidden="true">
        <div className="ptimer-fill" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
      </div>
    </div>
  );
}

export default ProblemTimer;
