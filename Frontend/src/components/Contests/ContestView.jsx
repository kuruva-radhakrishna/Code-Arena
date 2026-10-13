import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import "./ContestPage.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from "../../contexts/AuthContext";
import { formatCountdown } from "../../utils/countdown";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DEFAULT_RULES = [
    "Each problem carries the points shown in the table.",
    "You can submit as many times as you like; points are awarded for the first accepted solution.",
    "Plagiarism or cheating will result in disqualification.",
    "The leaderboard updates as submissions are judged.",
    "Do not discuss problems publicly until the contest ends.",
    "Ties are broken by the earliest last correct submission.",
];

const formatWhen = (iso) => new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
});

const initials = (u) => `${u?.firstname?.[0] || ''}${u?.lastname?.[0] || ''}`.toUpperCase() || '?';

function phaseOf(contest, now) {
    if (!contest) return null;
    const start = new Date(contest.startTime).getTime();
    const end = new Date(contest.endTime).getTime();
    return now < start ? 'future' : now < end ? 'ongoing' : 'past';
}

function ContestView({ contestId: contestIdProp }) {
    const params = useParams();
    const contestId = contestIdProp || params.id;
    const { user } = useAuth();

    const [contest, setContest] = useState(null);
    const [loadState, setLoadState] = useState('loading'); // loading | ready | error
    const [leaderboard, setLeaderboard] = useState([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const phase = phaseOf(contest, now);
    // true once we hold the full contest (with problem names), not just the list summary
    const hasProblems = !!contest?.problems?.[0]?.problem_id?.problemName || (contest?.problems || []).length === 0;

    // Load the contest. Before it starts the API answers 400, so fall back to the public
    // list entry (title, times) to still show a countdown. Reload when it goes live.
    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await axios.get(`${BACKEND_URL}/contests/${contestId}`, { withCredentials: true });
                if (!cancelled) { setContest(res.data); setLoadState('ready'); }
            } catch (err) {
                if (err.response?.status === 400) {
                    try {
                        const list = await axios.get(`${BACKEND_URL}/contests`, { withCredentials: true });
                        const summary = (list.data || []).find((c) => c._id === contestId);
                        if (!cancelled && summary) { setContest(summary); setLoadState('ready'); return; }
                    } catch { /* fall through */ }
                }
                if (!cancelled) setLoadState('error');
            }
        }
        if (!contest || (phase !== 'future' && !hasProblems)) load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contestId, phase === 'future']);

    // Leaderboard (live contests refresh every 30s)
    useEffect(() => {
        if (!contest || phase === 'future') return undefined;
        let cancelled = false;
        const fetchBoard = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/contests/${contestId}/leaderboard`, { withCredentials: true });
                if (!cancelled) setLeaderboard(Array.isArray(res.data) ? res.data : []);
            } catch {
                if (!cancelled) setLeaderboard([]);
            }
        };
        fetchBoard();
        const id = phase === 'ongoing' ? setInterval(fetchBoard, 30000) : null;
        return () => { cancelled = true; if (id) clearInterval(id); };
    }, [contestId, phase === 'future', phase === 'ongoing']); // eslint-disable-line react-hooks/exhaustive-deps

    const me = useMemo(() => leaderboard.find((e) => e.user?._id && e.user._id === user?._id), [leaderboard, user]);

    if (loadState === 'loading') {
        return <div className="cv-center"><CircularProgress size={48} thickness={5} /></div>;
    }
    if (loadState === 'error' || !contest) {
        return <div className="cv-center cv-error">Could not load this contest. It may not exist or has not been published yet.</div>;
    }

    const start = new Date(contest.startTime).getTime();
    const end = new Date(contest.endTime).getTime();
    const duration = end - start;
    const progress = phase === 'ongoing' ? Math.min(100, ((now - start) / duration) * 100) : phase === 'past' ? 100 : 0;
    const problems = contest.problems || [];
    const totalPoints = problems.reduce((s, p) => s + (p.points || 0), 0);
    const clock = phase === 'future'
        ? { label: 'Starts in', value: formatCountdown(start - now) }
        : phase === 'ongoing'
            ? { label: 'Time left', value: formatCountdown(end - now) }
            : { label: 'Contest ended', value: null };

    return (
        <div className="cv">
            <header className={`cv-hero cv-hero-${phase}`}>
                <div className="cv-hero-main">
                    <span className={`cv-status cv-status-${phase}`}>
                        {phase === 'ongoing' && <i className="cv-dot" />}
                        {phase === 'future' ? 'Upcoming' : phase === 'ongoing' ? 'Live' : 'Ended'}
                    </span>
                    <h1>{contest.contestTitle}</h1>
                    <ul className="cv-facts">
                        <li><span>Starts</span>{formatWhen(contest.startTime)}</li>
                        <li><span>Ends</span>{formatWhen(contest.endTime)}</li>
                        <li><span>Duration</span>{Math.round(duration / 60000 / 60 * 10) / 10}h</li>
                        {problems.length > 0 && <li><span>Problems</span>{problems.length} · {totalPoints} pts</li>}
                    </ul>
                </div>
                <div className="cv-clock">
                    <small>{clock.label}</small>
                    {clock.value && <strong>{clock.value}</strong>}
                    {phase === 'ongoing' && (
                        <div className="cv-progress" aria-hidden="true"><div style={{ width: `${progress}%` }} /></div>
                    )}
                    {phase === 'past' && me && <em>You ranked #{me.rank} with {me.totalPoints} pts</em>}
                </div>
            </header>

            <div className="cv-layout">
                <main className="cv-main">
                    {phase === 'future' ? (
                        <section className="cv-card cv-locked">
                            <div aria-hidden="true" className="cv-lock">🔒</div>
                            <h3>Problems unlock when the contest starts</h3>
                            <p>Come back in <strong>{formatCountdown(start - now)}</strong>. Read the rules on the right in the meantime.</p>
                        </section>
                    ) : (
                        <>
                            <section className="cv-card">
                                <h3>Problems</h3>
                                {problems.length === 0 ? <p className="cv-muted">No problems in this contest.</p> : (
                                    <table className="cv-table">
                                        <thead><tr><th>#</th><th>Problem</th><th>Points</th><th>{phase === 'ongoing' ? '' : ''}</th></tr></thead>
                                        <tbody>
                                            {problems.map((p, idx) => {
                                                const pid = p.problem_id?._id || p.problem_id;
                                                const mine = me?.problems?.[idx];
                                                const solved = mine?.verdict === 'Accepted';
                                                return (
                                                    <tr key={pid || idx}>
                                                        <td className="cv-q">{String.fromCharCode(65 + idx)}</td>
                                                        <td>
                                                            <Link className="cv-link" to={`/contests/${contest._id}/problem/${pid}/description`} state={{ contestId: contest._id }}>
                                                                {p.problem_id?.problemName || `Problem ${String.fromCharCode(65 + idx)}`}
                                                            </Link>
                                                            {solved && <span className="cv-solved" title="You solved this">✓ Solved</span>}
                                                        </td>
                                                        <td><span className="cv-pts">{p.points} pts</span></td>
                                                        <td className="cv-right">
                                                            <Link className="cv-btn" to={`/contests/${contest._id}/problem/${pid}/description`} state={{ contestId: contest._id }}>
                                                                {phase === 'ongoing' ? (solved ? 'Review' : 'Solve') : 'View'}
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </section>

                            <section className="cv-card">
                                <div className="cv-card-head">
                                    <h3>Leaderboard</h3>
                                    {phase === 'ongoing' && <span className="cv-muted">Updates every 30 seconds</span>}
                                </div>
                                {leaderboard.length === 0 ? <p className="cv-muted">No submissions yet — be the first on the board.</p> : (
                                    <div className="cv-scroll">
                                        <table className="cv-table cv-board">
                                            <thead>
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>User</th>
                                                    <th>Points</th>
                                                    {problems.map((p, i) => <th key={i} className="cv-center-cell">{String.fromCharCode(65 + i)}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaderboard.map((e, idx) => {
                                                    const isMe = me && e.user?._id === me.user?._id;
                                                    return (
                                                        <tr key={e.user?._id || idx} className={isMe ? 'cv-me' : ''}>
                                                            <td className="cv-rank">
                                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span>{idx + 1}</span>}
                                                            </td>
                                                            <td>
                                                                <span className="cv-user">
                                                                    <i className="cv-avatar">{initials(e.user)}</i>
                                                                    {e.user?.firstname} {e.user?.lastname}
                                                                    {isMe && <b className="cv-you">You</b>}
                                                                </span>
                                                            </td>
                                                            <td className="cv-total">{e.totalPoints}</td>
                                                            {problems.map((_, i) => {
                                                                const s = e.problems?.[i];
                                                                return (
                                                                    <td key={i} className="cv-center-cell">
                                                                        {s?.verdict === 'Accepted' ? <span className="cv-ac">✓</span> : s ? <span className="cv-wa">✗</span> : <span className="cv-none">–</span>}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </main>

                <aside className="cv-side">
                    <section className="cv-card">
                        <h3>About</h3>
                        <div className="cv-markdown">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{contest.description || 'No description provided.'}</ReactMarkdown>
                        </div>
                    </section>
                    <section className="cv-card">
                        <h3>Rules</h3>
                        <ul className="cv-rules">
                            {(contest.rules?.length ? contest.rules : DEFAULT_RULES).map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </section>
                </aside>
            </div>
        </div>
    );
}

export default ContestView;
