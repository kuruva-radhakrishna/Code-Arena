import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "./ContestList.css";
import { useAuth } from "../../contexts/AuthContext";
import CircularProgress from '@mui/material/CircularProgress';
import { formatCountdown } from '../../utils/countdown';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const PAST_PREVIEW = 6;

const formatWhen = (start, end) => {
    const s = new Date(start), e = new Date(end);
    const day = s.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const t = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${day} · ${t(s)} – ${t(e)}`;
};

const formatDuration = (start, end) => {
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    const h = Math.floor(mins / 60), m = mins % 60;
    return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

const STATUS = {
    live: { label: 'Live', cta: 'Enter contest →' },
    upcoming: { label: 'Upcoming', cta: 'View details →' },
    past: { label: 'Ended', cta: 'View results →' },
};

function ContestCard({ contest, status, now }) {
    const start = new Date(contest.startTime), end = new Date(contest.endTime);
    const problemCount = contest.problems?.length || 0;
    const clock = status === 'live'
        ? { label: 'Ends in', value: formatCountdown(end - now) }
        : status === 'upcoming'
            ? { label: 'Starts in', value: formatCountdown(start - now) }
            : { label: 'Ended', value: end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) };

    return (
        <article className={`cl-card cl-${status}`}>
            <div className="cl-top">
                <span className={`cl-status cl-status-${status}`}>
                    {status === 'live' && <i className="cl-dot" />}{STATUS[status].label}
                </span>
                <span className="cl-meta">{problemCount} problem{problemCount === 1 ? '' : 's'} · {formatDuration(contest.startTime, contest.endTime)}</span>
            </div>
            <h3 className="cl-title">
                <Link to={`/contests/${contest._id}`}>{contest.contestTitle}</Link>
            </h3>
            <p className="cl-when">{formatWhen(contest.startTime, contest.endTime)}</p>
            <div className="cl-bottom">
                <div className="cl-clock">
                    <small>{clock.label}</small>
                    <strong className={status === 'past' ? 'cl-clock-past' : ''}>{clock.value}</strong>
                </div>
                <Link to={`/contests/${contest._id}`} className={`cl-cta cl-cta-${status}`}>{STATUS[status].cta}</Link>
            </div>
        </article>
    );
}

function Contests() {
    const [contests, setContests] = useState([]);
    const [now, setNow] = useState(Date.now());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState('all'); // all | live | upcoming | past
    const [showAllPast, setShowAllPast] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const result = await axios.get(`${BACKEND_URL}/contests`, { withCredentials: true });
                if (!cancelled) setContests(Array.isArray(result.data) ? result.data : []);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const groups = useMemo(() => {
        const t = (c, k) => new Date(c[k]).getTime();
        return {
            live: contests.filter((c) => now >= t(c, 'startTime') && now < t(c, 'endTime')).sort((a, b) => t(a, 'endTime') - t(b, 'endTime')),
            upcoming: contests.filter((c) => now < t(c, 'startTime')).sort((a, b) => t(a, 'startTime') - t(b, 'startTime')),
            past: contests.filter((c) => now >= t(c, 'endTime')).sort((a, b) => t(b, 'endTime') - t(a, 'endTime')),
        };
    }, [contests, now]);

    const tabs = [
        { id: 'all', label: 'All', count: contests.length },
        { id: 'live', label: 'Live', count: groups.live.length },
        { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
        { id: 'past', label: 'Past', count: groups.past.length },
    ];

    const section = (key, title, hint) => {
        if (filter !== 'all' && filter !== key) return null;
        let list = groups[key];
        if (!list.length) return null;
        const trimmed = key === 'past' && filter === 'all' && !showAllPast && list.length > PAST_PREVIEW;
        if (trimmed) list = list.slice(0, PAST_PREVIEW);
        return (
            <section className="cl-section" key={key}>
                <div className="cl-section-head">
                    <h2>{title}</h2>
                    <span>{hint}</span>
                </div>
                <div className="cl-grid">
                    {list.map((c) => <ContestCard key={c._id} contest={c} status={key} now={now} />)}
                </div>
                {trimmed && (
                    <button className="cl-more" onClick={() => setShowAllPast(true)}>Show all {groups.past.length} past contests</button>
                )}
            </section>
        );
    };

    return (
        <div className="cl">
            <header className="cl-header">
                <div>
                    <h1>Contests</h1>
                    <p>Compete against other coders in timed rounds and climb the leaderboard.</p>
                </div>
                {user && user.role === 'admin' && (
                    <Link to="/contests/new" className="cl-create">+ Create contest</Link>
                )}
            </header>

            {loading ? (
                <div className="cl-center"><CircularProgress size={48} thickness={5} /></div>
            ) : error ? (
                <div className="cl-empty">Could not load contests. Please try again later.</div>
            ) : contests.length === 0 ? (
                <div className="cl-empty">
                    <div className="cl-empty-icon" aria-hidden="true">🏆</div>
                    <strong>No contests yet</strong>
                    <p>Check back soon{user?.role === 'admin' ? ' or create the first one.' : '.'}</p>
                </div>
            ) : (
                <>
                    <div className="cl-tabs" role="tablist">
                        {tabs.map((t) => (
                            <button key={t.id} role="tab" aria-selected={filter === t.id} className={`cl-tab${filter === t.id ? ' active' : ''}`} onClick={() => setFilter(t.id)}>
                                {t.label}<span>{t.count}</span>
                            </button>
                        ))}
                    </div>
                    {section('live', 'Live now', 'Running right now')}
                    {section('upcoming', 'Upcoming', 'Get ready')}
                    {section('past', 'Past contests', 'Results and leaderboards')}
                    {groups[filter]?.length === 0 && <div className="cl-empty">No {filter} contests.</div>}
                </>
            )}
        </div>
    );
}

export default Contests;
