import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Problems.css'; // shared .difficulty-box / .topic-tag used by other pages
import './ProblemSet.css';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from './Pagination';
import useProblemList from '../../hooks/useProblemList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownIcon from '@mui/icons-material/ArrowDownward';

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3 };
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const PAGE_SIZES = [20, 50, 100];
const TOPICS_COLLAPSED = 14;

const topicsOf = (p) => {
  if (Array.isArray(p.topics)) return p.topics.map((t) => t.trim().toLowerCase());
  if (p.topics) return [p.topics.trim().toLowerCase()];
  return [];
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function ProgressCard({ stats }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const pct = stats.total ? stats.solved / stats.total : 0;
  return (
    <section className="ps-card ps-progress">
      <h3>Your progress</h3>
      <div className="ps-progress-body">
        <div className="ps-ring" role="img" aria-label={`${stats.solved} of ${stats.total} solved`}>
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} className="ps-ring-track" />
            <circle
              cx="50" cy="50" r={R}
              className="ps-ring-fill"
              strokeDasharray={`${C * pct} ${C}`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="ps-ring-label">
            <strong>{stats.solved}</strong>
            <span>/ {stats.total}</span>
            <em>Solved</em>
          </div>
        </div>
        <ul className="ps-legend">
          {DIFFICULTIES.map((d) => (
            <li key={d}>
              <span className={`ps-diff ps-${d}`}>{cap(d)}</span>
              <span className="ps-legend-count">{stats.by[d].solved}<small>/{stats.by[d].total}</small></span>
              <div className="ps-bar"><div className={`ps-bar-fill ps-bg-${d}`} style={{ width: `${stats.by[d].total ? (stats.by[d].solved / stats.by[d].total) * 100 : 0}%` }} /></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Problems() {
  const { problems, solvedSet, loading, error } = useProblemList();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState(''); // '' | 'solved' | 'todo'
  const [query, setQuery] = useState('');
  const [sortDir, setSortDir] = useState(null); // null | 'asc' | 'desc'
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('ca_problems_page_size'));
      return PAGE_SIZES.includes(saved) ? saved : 50;
    } catch { return 50; }
  });

  const isSolved = (p) => solvedSet.has(p._id.toString());

  // Stable problem number = position in the full list (does not change with filters).
  const numberById = useMemo(() => new Map(problems.map((p, i) => [p._id, i + 1])), [problems]);

  const stats = useMemo(() => {
    const by = Object.fromEntries(DIFFICULTIES.map((d) => [d, { solved: 0, total: 0 }]));
    let solved = 0;
    problems.forEach((p) => {
      const d = by[p.difficulty];
      if (d) d.total++;
      if (solvedSet.has(p._id.toString())) { solved++; if (d) d.solved++; }
    });
    return { solved, total: problems.length, by };
  }, [problems, solvedSet]);

  const topicCounts = useMemo(() => {
    const m = new Map();
    problems.forEach((p) => topicsOf(p).forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [problems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = problems.filter((p) => {
      if (q && !(p.problemName || '').toLowerCase().includes(q)) return false;
      if (topic && !topicsOf(p).includes(topic)) return false;
      if (difficulty && (p.difficulty || '').toLowerCase() !== difficulty) return false;
      if (status === 'solved' && !solvedSet.has(p._id.toString())) return false;
      if (status === 'todo' && solvedSet.has(p._id.toString())) return false;
      return true;
    });
    if (sortDir) {
      const dir = sortDir === 'asc' ? 1 : -1;
      list = [...list].sort(
        (a, b) =>
          dir * ((DIFFICULTY_ORDER[a.difficulty] || 0) - (DIFFICULTY_ORDER[b.difficulty] || 0)) ||
          numberById.get(a._id) - numberById.get(b._id)
      );
    }
    return list;
  }, [problems, query, topic, difficulty, status, solvedSet, sortDir, numberById]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [query, topic, difficulty, status, sortDir, pageSize]);

  const changePageSize = (size) => {
    setPageSize(size);
    try { localStorage.setItem('ca_problems_page_size', String(size)); } catch { /* storage unavailable */ }
  };

  const pickRandom = () => {
    const pool = filtered.filter((p) => !isSolved(p));
    const from = pool.length ? pool : filtered;
    if (from.length) navigate(`/problem/${from[Math.floor(Math.random() * from.length)]._id}/description`);
  };

  const anyFilter = topic || difficulty || status || query;
  const resetFilters = () => { setTopic(null); setDifficulty(''); setStatus(''); setQuery(''); setSortDir(null); };
  const cycleSort = () => setSortDir((d) => (d === null ? 'asc' : d === 'asc' ? 'desc' : null));

  if (loading) {
    return <div className="ps"><div className="ps-loading"><CircularProgress size={48} thickness={5} /></div></div>;
  }

  const shownTopics = showAllTopics ? topicCounts : topicCounts.slice(0, TOPICS_COLLAPSED);

  return (
    <div className="ps">
      <div className="ps-layout">
        <main className="ps-main">
          <div className="ps-toolbar">
            <label className="ps-search">
              <SearchIcon fontSize="small" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions"
                aria-label="Search questions"
              />
            </label>
            <select className="ps-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Difficulty">
              <option value="">Difficulty</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{cap(d)}</option>)}
            </select>
            <select className="ps-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              <option value="">Status</option>
              <option value="todo">Todo</option>
              <option value="solved">Solved</option>
            </select>
            <button className="ps-pick" onClick={pickRandom} disabled={!filtered.length} title="Open a random unsolved problem from the current list">
              <ShuffleIcon fontSize="small" /> Pick one
            </button>
          </div>

          {anyFilter && (
            <div className="ps-active">
              {topic && <button className="ps-pill" onClick={() => setTopic(null)}>{cap(topic)} <CloseIcon style={{ fontSize: 14 }} /></button>}
              {difficulty && <button className="ps-pill" onClick={() => setDifficulty('')}>{cap(difficulty)} <CloseIcon style={{ fontSize: 14 }} /></button>}
              {status && <button className="ps-pill" onClick={() => setStatus('')}>{cap(status)} <CloseIcon style={{ fontSize: 14 }} /></button>}
              {query && <button className="ps-pill" onClick={() => setQuery('')}>“{query}” <CloseIcon style={{ fontSize: 14 }} /></button>}
              <button className="ps-reset" onClick={resetFilters}>Reset all</button>
              <span className="ps-count">{filtered.length} problem{filtered.length === 1 ? '' : 's'}</span>
            </div>
          )}

          {error && <p className="ps-error">{error}</p>}

          {!error && filtered.length === 0 && <p className="ps-empty">No problems match your filters.</p>}

          {visible.length > 0 && (
            <div className="ps-list" role="table" aria-label="Problems">
              <div className="ps-row ps-headrow" role="row">
                <span className="ps-c-status" role="columnheader">Status</span>
                <span className="ps-c-title" role="columnheader">Title</span>
                <span className="ps-c-topics" role="columnheader">Topics</span>
                <button className="ps-c-diff ps-sort" onClick={cycleSort} role="columnheader" title="Sort by difficulty">
                  Difficulty
                  {sortDir === 'asc' && <ArrowUpIcon style={{ fontSize: 14 }} />}
                  {sortDir === 'desc' && <ArrowDownIcon style={{ fontSize: 14 }} />}
                </button>
              </div>
              {visible.map((p) => {
                const solved = isSolved(p);
                const tps = topicsOf(p);
                return (
                  <Link key={p._id} to={`/problem/${p._id}/description`} className="ps-row ps-item" role="row">
                    <span className="ps-c-status" role="cell">
                      {solved && <CheckCircleOutlineIcon className="ps-solved" titleAccess="Solved" fontSize="small" />}
                    </span>
                    <span className="ps-c-title" role="cell">
                      <span className="ps-no">{numberById.get(p._id)}.</span> {p.problemName}
                    </span>
                    <span className="ps-c-topics" role="cell">
                      {tps.slice(0, 2).map((t) => <span key={t} className="ps-tag">{t}</span>)}
                      {tps.length > 2 && <span className="ps-tag ps-tag-more">+{tps.length - 2}</span>}
                    </span>
                    <span className={`ps-c-diff ps-diff ps-${p.difficulty}`} role="cell">{cap(p.difficulty || '')}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {filtered.length > 0 && (
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPage={(p) => setPage(Math.min(Math.max(1, p), pageCount))}
              pageSize={pageSize}
              pageSizes={PAGE_SIZES}
              onPageSize={changePageSize}
              totalItems={filtered.length}
            />
          )}
        </main>

        <aside className="ps-side">
          <ProgressCard stats={stats} />
          <section className="ps-card ps-topics">
            <h3>Topics</h3>
            <div className="ps-topic-list">
              {shownTopics.map(([t, n]) => (
                <button key={t} className={`ps-topic${topic === t ? ' active' : ''}`} onClick={() => setTopic(topic === t ? null : t)}>
                  {cap(t)} <span>{n}</span>
                </button>
              ))}
            </div>
            {topicCounts.length > TOPICS_COLLAPSED && (
              <button className="ps-more" onClick={() => setShowAllTopics((s) => !s)}>
                {showAllTopics ? 'Show fewer' : `Show all ${topicCounts.length} topics`}
              </button>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Problems;
