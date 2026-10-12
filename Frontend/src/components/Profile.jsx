import { useEffect, useMemo, useState } from "react";
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import './ProfilePage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const LANGUAGE_LABELS = { cpp: 'C++', c: 'C', java: 'Java', python: 'Python' };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function timeAgo(dateStr) {
    const t = new Date(dateStr).getTime();
    if (Number.isNaN(t)) return '—';
    const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return 'just now';
    const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [name, secs] of units) {
        if (s >= secs) { const n = Math.floor(s / secs); return `${n} ${name}${n > 1 ? 's' : ''} ago`; }
    }
    return 'just now';
}

function verdictTone(verdict = '') {
    const v = verdict.toLowerCase();
    if (v.includes('accept')) return 'ok';
    if (v.includes('wrong') || v.includes('error') || v.includes('runtime') || v.includes('compil')) return 'bad';
    return 'warn';
}

function Stat({ label, value, hint }) {
    return (
        <div className="pf-stat" title={hint}>
            <strong>{value}</strong>
            <span>{label}</span>
        </div>
    );
}

function ProgressCard({ solvedStats, problemTotals }) {
    const R = 44;
    const C = 2 * Math.PI * R;
    const by = DIFFICULTIES.map((d) => ({ d, solved: solvedStats?.[d] || 0, total: problemTotals?.[d] || 0 }));
    const solved = by.reduce((s, x) => s + x.solved, 0);
    const total = by.reduce((s, x) => s + x.total, 0);
    const pct = total ? solved / total : 0;
    return (
        <section className="pf-card">
            <h3>Solved problems</h3>
            <div className="pf-progress">
                <div className="pf-ring" role="img" aria-label={`${solved} of ${total} solved`}>
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={R} className="pf-ring-track" />
                        <circle cx="50" cy="50" r={R} className="pf-ring-fill" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 50 50)" />
                    </svg>
                    <div className="pf-ring-label">
                        <strong>{solved}</strong>
                        <span>/ {total}</span>
                    </div>
                </div>
                <ul className="pf-legend">
                    {by.map(({ d, solved: s, total: t }) => (
                        <li key={d}>
                            <span className={`pf-diff pf-${d}`}>{cap(d)}</span>
                            <span className="pf-legend-count">{s}<small>/{t}</small></span>
                            <div className="pf-bar"><div className={`pf-bar-fill pf-bg-${d}`} style={{ width: `${t ? (s / t) * 100 : 0}%` }} /></div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

function Profile() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [message, setMessage] = useState(null); // { ok, text }
    const [tab, setTab] = useState('submissions');
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/api/profile/summary`, { withCredentials: true });
                if (!cancelled) setData(res.data);
            } catch {
                if (!cancelled) setFailed(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!message) return undefined;
        const id = setTimeout(() => setMessage(null), 3500);
        return () => clearTimeout(id);
    }, [message]);

    const submissions = useMemo(
        () => [...(data?.submissionsByUser || [])]
            .filter((s) => s && s._id && s.problem_id)
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
        [data]
    );

    if (loading) {
        return <div className="pf-loading"><CircularProgress size={48} thickness={5} /></div>;
    }
    if (failed || !data?.user) {
        return <div className="pf-loading pf-error">Could not load your profile. Please refresh or log in again.</div>;
    }

    const { user, solvedStats, problemTotals, submissionStats } = data;
    const attended = data.attendedContests || [];
    const createdContests = data.createdContests || [];
    const createdProblems = data.problemsByUser || [];
    const isAdmin = user.role === 'admin';
    const showCreated = isAdmin || createdContests.length > 0;

    const solvedTotal = solvedStats?.total || 0;
    const subTotal = submissionStats?.total ?? submissions.length;
    const subAccepted = submissionStats?.accepted ?? submissions.filter((s) => s.verdict === 'Accepted').length;
    const acceptance = subTotal ? `${Math.round((subAccepted / subTotal) * 100)}%` : '—';
    const ranks = attended.map((c) => c.userStats?.rank).filter(Boolean);
    const bestRank = ranks.length ? `#${Math.min(...ranks)}` : '—';
    const initials = `${(user.firstname?.[0] || '')}${(user.lastname?.[0] || '')}`.toUpperCase();
    const isNewUser = user.createdAt && (Date.now() - new Date(user.createdAt)) < 7 * 24 * 60 * 60 * 1000;

    const tabs = [
        { id: 'submissions', label: 'Submissions', count: submissions.length },
        { id: 'contests', label: 'Contests', count: attended.length },
        ...(showCreated ? [{ id: 'created', label: 'Created by me' }] : []),
    ];

    const handleDeleteContest = async (contestId) => {
        if (!window.confirm('Delete this contest? This cannot be undone.')) return;
        try {
            await axios.delete(`${BACKEND_URL}/admin/contests/${contestId}`, { withCredentials: true });
            setData((prev) => ({ ...prev, createdContests: prev.createdContests.filter((c) => c._id !== contestId) }));
            setMessage({ ok: true, text: 'Contest deleted.' });
        } catch {
            setMessage({ ok: false, text: 'Failed to delete the contest.' });
        }
    };

    const handleDeleteProblem = async (problemId) => {
        if (!window.confirm('Delete this problem and all its submissions? This cannot be undone.')) return;
        try {
            await axios.delete(`${BACKEND_URL}/admin/problems/${problemId}`, { withCredentials: true });
            setData((prev) => ({ ...prev, problemsByUser: prev.problemsByUser.filter((p) => p._id !== problemId) }));
            setMessage({ ok: true, text: 'Problem deleted.' });
        } catch {
            setMessage({ ok: false, text: 'Failed to delete the problem.' });
        }
    };

    return (
        <div className="pf">
            <header className="pf-header">
                <div className="pf-avatar" aria-hidden="true">{initials}</div>
                <div className="pf-id">
                    <h1>
                        {user.firstname} {user.lastname}
                        {isAdmin && <span className="pf-chip pf-chip-admin">Admin</span>}
                        {isNewUser && <span className="pf-chip pf-chip-new">New</span>}
                    </h1>
                    <p>{user.email}</p>
                </div>
                <div className="pf-stats">
                    <Stat label="Solved" value={solvedTotal} />
                    <Stat label="Acceptance" value={acceptance} hint={`${subAccepted} accepted of ${subTotal} submissions`} />
                    <Stat label="Submissions" value={subTotal} />
                    <Stat label="Contests" value={attended.length} />
                    <Stat label="Best rank" value={bestRank} />
                </div>
            </header>

            {message && <div className={`pf-toast ${message.ok ? 'ok' : 'bad'}`} role="status">{message.text}</div>}

            <div className="pf-layout">
                <aside className="pf-side">
                    <ProgressCard solvedStats={solvedStats} problemTotals={problemTotals} />
                </aside>

                <main className="pf-main pf-card">
                    <div className="pf-tabs" role="tablist">
                        {tabs.map((t) => (
                            <button key={t.id} role="tab" aria-selected={tab === t.id} className={`pf-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                                {t.label}{t.count != null && <span className="pf-count">{t.count}</span>}
                            </button>
                        ))}
                    </div>

                    {tab === 'submissions' && (
                        submissions.length === 0 ? (
                            <div className="pf-empty">
                                <p>No submissions yet.</p>
                                <Link className="pf-btn pf-btn-primary" to="/problems">Solve your first problem</Link>
                            </div>
                        ) : (
                            <div className="pf-scroll">
                                <table className="pf-table">
                                    <thead>
                                        <tr><th>Problem</th><th>Language</th><th>Verdict</th><th>Submitted</th><th /></tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((s) => (
                                            <tr key={s._id}>
                                                <td>
                                                    <Link className="pf-link" to={`/problem/${s.problem_id._id || s.problem_id}/description`}>
                                                        {s.problem_id.problemName || 'Problem'}
                                                    </Link>
                                                </td>
                                                <td>{LANGUAGE_LABELS[s.language] || s.language}</td>
                                                <td><span className={`pf-verdict pf-v-${verdictTone(s.verdict)}`}>{s.verdict}</span></td>
                                                <td title={formatDate(s.submittedAt)}>{timeAgo(s.submittedAt)}</td>
                                                <td className="pf-right"><Link className="pf-btn pf-btn-ghost" to={`/submission/${s._id}`}>View code</Link></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="pf-note">Showing your 20 most recent submissions.</p>
                            </div>
                        )
                    )}

                    {tab === 'contests' && (
                        attended.length === 0 ? (
                            <div className="pf-empty">
                                <p>You haven&apos;t taken part in a contest yet.</p>
                                <Link className="pf-btn pf-btn-primary" to="/contests">Browse contests</Link>
                            </div>
                        ) : (
                            <div className="pf-scroll">
                                <table className="pf-table">
                                    <thead><tr><th>Contest</th><th>Date</th><th>Rank</th><th>Solved</th></tr></thead>
                                    <tbody>
                                        {attended.map((c) => (
                                            <tr key={c._id}>
                                                <td><Link className="pf-link" to={`/contests/${c._id}`}>{c.contestTitle}</Link></td>
                                                <td>{formatDate(c.startTime)}</td>
                                                <td>{c.userStats ? `#${c.userStats.rank}` : '—'}</td>
                                                <td>{c.userStats ? c.userStats.solvedProblems : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {tab === 'created' && (
                        <div className="pf-created">
                            <section>
                                <div className="pf-section-head">
                                    <h4>Contests</h4>
                                    {isAdmin && <Link className="pf-btn pf-btn-ghost" to="/contests/new">+ New contest</Link>}
                                </div>
                                {createdContests.length === 0 ? <p className="pf-note">No contests created.</p> : (
                                    <div className="pf-scroll">
                                        <table className="pf-table">
                                            <thead><tr><th>Title</th><th>Starts</th><th>Ends</th><th>Problems</th><th /></tr></thead>
                                            <tbody>
                                                {createdContests.map((c) => (
                                                    <tr key={c._id}>
                                                        <td><Link className="pf-link" to={`/contests/${c._id}`}>{c.contestTitle}</Link></td>
                                                        <td>{formatDate(c.startTime)}</td>
                                                        <td>{formatDate(c.endTime)}</td>
                                                        <td>{c.problems ? c.problems.length : 0}</td>
                                                        <td className="pf-right pf-actions">
                                                            {new Date(c.startTime) > new Date() && (
                                                                <button className="pf-btn pf-btn-ghost" onClick={() => navigate(`/contests/${c._id}/edit`)}>Edit</button>
                                                            )}
                                                            <button className="pf-btn pf-btn-danger" onClick={() => handleDeleteContest(c._id)}>Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            {isAdmin && (
                                <section>
                                    <div className="pf-section-head">
                                        <h4>Problems</h4>
                                        <Link className="pf-btn pf-btn-ghost" to="/problems/new">+ New problem</Link>
                                    </div>
                                    {createdProblems.length === 0 ? <p className="pf-note">No problems created.</p> : (
                                        <div className="pf-scroll">
                                            <table className="pf-table">
                                                <thead><tr><th>Problem</th><th>Created</th><th /></tr></thead>
                                                <tbody>
                                                    {createdProblems.map((p) => (
                                                        <tr key={p._id}>
                                                            <td><Link className="pf-link" to={`/problem/${p._id}/description`}>{p.problemName}</Link></td>
                                                            <td>{formatDate(p.CreatedAt)}</td>
                                                            <td className="pf-right pf-actions">
                                                                <Link className="pf-btn pf-btn-ghost" to={`/problems/${p._id}/edit`}>Edit</Link>
                                                                <button className="pf-btn pf-btn-danger" onClick={() => handleDeleteProblem(p._id)}>Delete</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Profile;
