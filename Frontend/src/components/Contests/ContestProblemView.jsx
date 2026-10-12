import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Navigate, NavLink, Link, Routes, Route } from "react-router-dom";
import axios from "axios";
import CircularProgress from '@mui/material/CircularProgress';
import CodeEditor from '../Problems/CodeEditor';
import Verdict from '../Problems/Verdict';
import ProblemDescription from '../Problems/ProblemDescription';
import ProblemSubmissions from '../Problems/ProblemSubmissions';
import '../Problems/ProblemWorkspace.css';
import './ContestPage.css';
import { useAuth } from '../../contexts/AuthContext';
import { formatCountdown } from '../../utils/countdown';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const COMPILER_URL = import.meta.env.VITE_COMPILER_URL;

const LANGUAGES = [
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
];

const TEMPLATES = {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}\n`,
    python: `def main():\n    # your code here\n    pass\n\nif __name__ == "__main__":\n    main()\n`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code here\n    }\n}\n`,
};

const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const safeDel = (k) => { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } };

function Workspace({ contestId, problemId }) {
    const { user } = useAuth();
    const userId = user?._id || 'anon';

    const [contest, setContest] = useState(null);
    const [phase, setPhase] = useState('loading'); // loading | ongoing | over
    const [problem, setProblem] = useState();
    const [submissions, setSubmissions] = useState([]);
    const [now, setNow] = useState(Date.now());

    const [language, setLanguage] = useState(() => {
        const saved = safeGet('ca_language');
        return LANGUAGES.some((l) => l.value === saved) ? saved : 'cpp';
    });
    const codeKey = useCallback((lang) => `ca_code_${userId}_${problemId}_${lang}`, [userId, problemId]);
    const [code, setCode] = useState(() => safeGet(`ca_code_${userId}_${problemId}_${language}`) ?? TEMPLATES[language]);

    const [input, setInput] = useState('');
    const [runOutput, setRunOutput] = useState(null);
    const [verdicts, setVerdicts] = useState([]);
    const [consoleTab, setConsoleTab] = useState('testcase');
    const [runLoading, setRunLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const submittingRef = useRef(false);

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    // contest + live check
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/contests/${contestId}`, { withCredentials: true });
                if (cancelled) return;
                setContest(res.data);
                const t = Date.now();
                setPhase(t >= new Date(res.data.startTime) && t < new Date(res.data.endTime) ? 'ongoing' : 'over');
            } catch {
                if (!cancelled) setPhase('over');
            }
        })();
        return () => { cancelled = true; };
    }, [contestId]);

    // the contest finished while the page was open
    const endMs = contest ? new Date(contest.endTime).getTime() : null;
    useEffect(() => {
        if (phase === 'ongoing' && endMs && now >= endMs) setPhase('over');
    }, [now, endMs, phase]);

    const fetchSubmissions = useCallback(async () => {
        try {
            const result = await axios.get(`${BACKEND_URL}/submissions/${problemId}`, { withCredentials: true });
            const list = (Array.isArray(result.data) ? result.data : []).filter((s) => s.contest_id && s.contest_id === contestId);
            list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            setSubmissions(list);
        } catch {
            setSubmissions([]);
        }
    }, [problemId, contestId]);

    useEffect(() => {
        if (phase !== 'ongoing') return undefined;
        let cancelled = false;
        (async () => {
            try {
                const result = await axios.get(`${BACKEND_URL}/problems/${problemId}`, { withCredentials: true });
                if (cancelled) return;
                setProblem(result.data || null);
                const first = (result.data?.TestCases || []).find((t) => t.isPublic !== false) || result.data?.TestCases?.[0];
                setInput(first?.input ?? '');
            } catch {
                if (!cancelled) setProblem(null);
            }
        })();
        fetchSubmissions();
        return () => { cancelled = true; };
    }, [problemId, phase, fetchSubmissions]);

    // keep the draft (per problem + language)
    useEffect(() => {
        const id = setTimeout(() => {
            if (code === TEMPLATES[language]) safeDel(codeKey(language)); else safeSet(codeKey(language), code);
        }, 400);
        return () => clearTimeout(id);
    }, [code, language, codeKey]);

    const changeLanguage = (next) => {
        if (next === language) return;
        if (code === TEMPLATES[language]) safeDel(codeKey(language)); else safeSet(codeKey(language), code);
        safeSet('ca_language', next);
        setLanguage(next);
        setCode(safeGet(codeKey(next)) ?? TEMPLATES[next]);
    };

    const resetCode = () => {
        if (code !== TEMPLATES[language] && !window.confirm('Reset your code to the starter template?')) return;
        safeDel(codeKey(language));
        setCode(TEMPLATES[language]);
    };

    if (phase === 'loading') {
        return <div className="pv-loading"><CircularProgress size={56} thickness={5} /></div>;
    }
    if (phase !== 'ongoing') {
        // the contest is not running: fall back to the normal practice page
        return <Navigate to={`/problem/${problemId}/description`} replace />;
    }
    if (problem === undefined) {
        return <div className="pv-loading"><CircularProgress size={56} thickness={5} /></div>;
    }
    if (problem === null) {
        return <div className="pv-loading">Could not load this problem. <Link to={`/contests/${contestId}`}>Back to the contest</Link></div>;
    }

    const handleRun = async () => {
        setRunLoading(true);
        setConsoleTab('output');
        try {
            const { data } = await axios.post(`${COMPILER_URL}/run`, { language, code, input }, { withCredentials: true, timeout: 30000 });
            if (data.errorType) setRunOutput({ ok: false, text: [data.errorType, data.error].filter(Boolean).join('\n') });
            else setRunOutput({ ok: true, text: data.output?.output ?? '' });
        } catch {
            setRunOutput({ ok: false, text: 'Run failed. The compiler service did not respond.' });
        }
        setRunLoading(false);
    };

    const handleSubmit = async () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitLoading(true);
        setSubmitError('');
        setConsoleTab('result');
        try {
            const { data } = await axios.post(
                `${BACKEND_URL}/contests/submission/${contestId}/${problemId}`,
                { submission: { language, code } },
                { withCredentials: true, timeout: 120000 }
            );
            setVerdicts(Array.isArray(data) ? data : []);
            fetchSubmissions();
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
        }
        submittingRef.current = false;
        setSubmitLoading(false);
    };

    const problems = contest?.problems || [];
    const examples = (problem.TestCases || []).filter((t) => t.isPublic !== false).slice(0, 3);
    const msLeft = endMs ? endMs - now : 0;
    const urgent = msLeft < 5 * 60 * 1000;
    const accepted = verdicts.length > 0 && verdicts.every((v) => (v?.status ?? v) === 'Accepted');
    const base = `/contests/${contestId}/problem/${problemId}`;

    return (
        <div className="pv2">
            <div className="pv-toolbar">
                <Link className="pv-btn pv-btn-ghost" to={`/contests/${contestId}`}>‹ Contest</Link>
                <div className="pvc-switch" role="tablist" aria-label="Contest problems">
                    {problems.map((p, i) => {
                        const pid = p.problem_id?._id || p.problem_id;
                        return (
                            <Link
                                key={pid || i}
                                role="tab"
                                aria-selected={pid === problemId}
                                className={`pvc-q${pid === problemId ? ' active' : ''}`}
                                to={`/contests/${contestId}/problem/${pid}/description`}
                                title={p.problem_id?.problemName}
                            >
                                {String.fromCharCode(65 + i)}
                                <small>{p.points}</small>
                            </Link>
                        );
                    })}
                </div>
                <div className="pv-toolbar-title">
                    <span className="pvc-name" title={contest.contestTitle}>{contest.contestTitle}</span>
                </div>
                <div className={`pvc-clock${urgent ? ' urgent' : ''}`} role="timer" aria-label="Time left in contest">
                    <small>Time left</small>
                    <strong>{formatCountdown(msLeft)}</strong>
                </div>
            </div>

            <div className="pv-panes">
                <section className="pv-card pv-left">
                    <div className="pv-tabs" role="tablist">
                        <NavLink to={`${base}/description`} className={({ isActive }) => `pv-tab${isActive ? ' active' : ''}`}>Description</NavLink>
                        <NavLink to={`${base}/submissions`} className={({ isActive }) => `pv-tab${isActive ? ' active' : ''}`}>My submissions</NavLink>
                    </div>
                    <div className="pv-card-body">
                        <Routes>
                            <Route index element={<Navigate to="description" replace />} />
                            <Route path="description" element={<ProblemDescription problem={problem} showHints={false} />} />
                            <Route path="submissions" element={<ProblemSubmissions submissions={submissions} refreshSubmissions={fetchSubmissions} />} />
                            <Route path="*" element={<Navigate to="description" replace />} />
                        </Routes>
                    </div>
                </section>

                <section className="pv-card pv-right">
                    <div className="pv-editor-head">
                        <select value={language} onChange={(e) => changeLanguage(e.target.value)} className="pv-select" aria-label="Language">
                            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                        <button className="pv-btn pv-btn-ghost pv-btn-sm" onClick={resetCode} title="Reset to starter template">↺ Reset</button>
                    </div>

                    <div className="pv-editor">
                        <CodeEditor value={code} onChange={setCode} language={language} showLabel={false} height="100%" />
                    </div>

                    <div className="pv-actions">
                        <div className="pv-actions-group">
                            <button className="pv-btn pv-btn-run" onClick={handleRun} disabled={runLoading || submitLoading}>
                                {runLoading ? <><span className="pv-spin" />Running…</> : '▶ Run'}
                            </button>
                            <button className="pv-btn pv-btn-primary" onClick={handleSubmit} disabled={submitLoading || runLoading}>
                                {submitLoading ? <><span className="pv-spin" />Judging…</> : 'Submit'}
                            </button>
                        </div>
                        <span className="pvc-note">AI help is off during contests</span>
                    </div>

                    <div className="pv-console">
                        <div className="pv-console-tabs" role="tablist">
                            {[['testcase', 'Testcase'], ['output', 'Output'], ['result', 'Result']].map(([id, label]) => (
                                <button key={id} role="tab" aria-selected={consoleTab === id} className={`pv-ctab${consoleTab === id ? ' active' : ''}`} onClick={() => setConsoleTab(id)}>{label}</button>
                            ))}
                        </div>
                        <div className="pv-console-body">
                            {consoleTab === 'testcase' && (
                                <>
                                    {examples.length > 0 && (
                                        <div className="pv-example-chips">
                                            {examples.map((ex, i) => <button key={i} className="pv-chip" onClick={() => setInput(ex.input)}>Example {i + 1}</button>)}
                                        </div>
                                    )}
                                    <textarea className="pv-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Custom input (optional)" spellCheck={false} aria-label="Custom input" />
                                </>
                            )}
                            {consoleTab === 'output' && (
                                runOutput
                                    ? <pre className={`pv-output${runOutput.ok ? '' : ' pv-output-error'}`}>{runOutput.text === '' ? '(no output)' : runOutput.text}</pre>
                                    : <p className="pv-muted">Run your code to see the output here.</p>
                            )}
                            {consoleTab === 'result' && (
                                <>
                                    {submitError && <p className="pv-output pv-output-error">{submitError}</p>}
                                    {accepted && <p className="pvc-accepted">✓ Accepted — points awarded on the leaderboard.</p>}
                                    <Verdict verdicts={verdicts} />
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// Keyed by problem so switching A / B / C resets code, output and verdicts cleanly.
function ContestProblemView() {
    const { contestId, problemId } = useParams();
    return <Workspace key={`${contestId}-${problemId}`} contestId={contestId} problemId={problemId} />;
}

export default ContestProblemView;
