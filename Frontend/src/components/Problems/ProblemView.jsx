import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CircularProgress from '@mui/material/CircularProgress';
import './ProblemView.css'; // legacy styles still shared with the contest problem page
import './ProblemWorkspace.css';
import ProblemDescription from "./ProblemDescription";
import ProblemSubmissions from "./ProblemSubmissions";
import ProblemDiscussion from "./ProblemDiscussion";
import ProblemAIChat from "./ProblemAIChat";
import ProblemTimer from "./ProblemTimer";
import { formatClock } from "../../utils/formatClock";
import CodeEditor from './CodeEditor';
import Verdict from './Verdict';
import useProblemList from '../../hooks/useProblemList';
import { useAuth } from '../../contexts/AuthContext';

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

const TABS = [
    { id: 'description', label: 'Description' },
    { id: 'tutor', label: '✨ AI Tutor' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'discussions', label: 'Discussion' },
];

/* ───────────────────────── toolbar: prev / list / next ───────────────────────── */

function ProblemNav({ problems, solvedSet, currentId, onGo }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const wrapRef = useRef(null);

    const index = problems.findIndex((p) => p._id === currentId);
    const prev = index > 0 ? problems[index - 1] : null;
    const next = index >= 0 && index < problems.length - 1 ? problems[index + 1] : null;

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return problems
            .map((p, i) => ({ p, n: i + 1 }))
            .filter(({ p }) => !s || p.problemName.toLowerCase().includes(s));
    }, [problems, q]);

    return (
        <div className="pv-nav" ref={wrapRef}>
            <button className="pv-btn pv-btn-ghost" disabled={!prev} onClick={() => prev && onGo(prev._id)} title={prev ? `Previous: ${prev.problemName}` : 'No previous problem'} aria-label="Previous problem">
                ‹ Prev
            </button>
            <button className="pv-btn pv-btn-ghost pv-list-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox">
                ☰ <span className="pv-list-count">{index >= 0 ? `${index + 1} / ${problems.length}` : 'Problems'}</span>
            </button>
            <button className="pv-btn pv-btn-ghost" disabled={!next} onClick={() => next && onGo(next._id)} title={next ? `Next: ${next.problemName}` : 'No next problem'} aria-label="Next problem">
                Next ›
            </button>

            {open && (
                <div className="pv-drawer" role="listbox" aria-label="Problem list">
                    <input
                        autoFocus
                        className="pv-drawer-search"
                        placeholder="Search problems"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <ul>
                        {filtered.map(({ p, n }) => (
                            <li key={p._id}>
                                <button
                                    className={`pv-drawer-item${p._id === currentId ? ' current' : ''}`}
                                    onClick={() => { setOpen(false); if (p._id !== currentId) onGo(p._id); }}
                                >
                                    <span className="pv-drawer-no">{n}</span>
                                    <span className="pv-drawer-name">{p.problemName}</span>
                                    {solvedSet.has(p._id) && <span className="pv-drawer-solved" title="Solved">✓</span>}
                                    <span className={`pv-dot ${p.difficulty}`} title={p.difficulty} />
                                </button>
                            </li>
                        ))}
                        {filtered.length === 0 && <li className="pv-drawer-empty">No matches</li>}
                    </ul>
                </div>
            )}
        </div>
    );
}

/* ───────────────────────────── the workspace ───────────────────────────── */

function Workspace({ problemId, tab, setTab }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const userId = user?._id || 'anon';
    const { problems, solvedSet } = useProblemList();

    const [problem, setProblem] = useState();
    const [submissions, setSubmissions] = useState([]);

    const [language, setLanguage] = useState(() => {
        const saved = safeGet('ca_language');
        return LANGUAGES.some((l) => l.value === saved) ? saved : 'cpp';
    });
    const codeKey = useCallback((lang) => `ca_code_${userId}_${problemId}_${lang}`, [userId, problemId]);
    const [code, setCode] = useState(() => safeGet(`ca_code_${userId}_${problemId}_${language}`) ?? TEMPLATES[language]);
    const codeRef = useRef(code);
    codeRef.current = code;

    const [input, setInput] = useState('');
    const [runOutput, setRunOutput] = useState(null); // { ok, text }
    const [verdicts, setVerdicts] = useState([]);
    const [failedCase, setFailedCase] = useState(null);
    const [consoleTab, setConsoleTab] = useState('testcase');
    const [runLoading, setRunLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [solvedNow, setSolvedNow] = useState(false);
    const [solveTime, setSolveTime] = useState(null);

    const [aiPanel, setAiPanel] = useState(null); // { kind: 'review' | 'debug', text }
    const [aiLoading, setAiLoading] = useState(null); // 'review' | 'debug' | null

    // ── data ──
    const fetchSubmissions = useCallback(async () => {
        try {
            const result = await axios.get(`${BACKEND_URL}/submissions/${problemId}`, { withCredentials: true });
            const subs = Array.isArray(result.data) ? [...result.data] : [];
            subs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            setSubmissions(subs);
        } catch {
            setSubmissions([]);
        }
    }, [problemId]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const result = await axios.get(`${BACKEND_URL}/problems/${problemId}`, { withCredentials: true });
                if (cancelled) return;
                if (!result.data || !result.data._id) {
                    alert("Selected problem has been deleted.");
                    navigate("/problems");
                    return;
                }
                setProblem(result.data);
                const firstPublic = (result.data.TestCases || []).find((t) => t.isPublic !== false) || (result.data.TestCases || [])[0];
                setInput(firstPublic?.input ?? '');
            } catch {
                if (!cancelled) {
                    alert("Problem fetch error.");
                    navigate("/problems");
                }
            }
        })();
        fetchSubmissions();
        return () => { cancelled = true; };
    }, [problemId, navigate, fetchSubmissions]);

    // ── code persistence (per problem + language, survives refresh) ──
    useEffect(() => {
        const id = setTimeout(() => {
            if (code === TEMPLATES[language]) safeDel(codeKey(language));
            else safeSet(codeKey(language), code);
        }, 400);
        return () => clearTimeout(id);
    }, [code, language, codeKey]);

    const changeLanguage = (next) => {
        if (next === language) return;
        // flush the current draft before switching so nothing is lost
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

    // ── actions ──
    const handleRun = async () => {
        setRunLoading(true);
        setConsoleTab('output');
        try {
            const { data } = await axios.post(`${COMPILER_URL}/run`, { language, code, input }, { withCredentials: true, timeout: 30000 });
            if (data.errorType) {
                setRunOutput({ ok: false, text: [data.errorType, data.error].filter(Boolean).join('\n') });
            } else {
                setRunOutput({ ok: true, text: data.output?.output ?? '' });
            }
        } catch {
            setRunOutput({ ok: false, text: 'Run failed. The compiler service did not respond.' });
        }
        setRunLoading(false);
    };

    const handleSubmit = async () => {
        setSubmitLoading(true);
        setConsoleTab('result');
        try {
            const { data } = await axios.post(
                `${BACKEND_URL}/submissions/${problemId}`,
                { problem_id: problemId, language, code },
                { withCredentials: true, timeout: 120000 }
            );
            const v = data.verdicts || [];
            setVerdicts(v);
            setFailedCase(data.failedCase || null);
            const accepted = v.length > 0 && v.every((x) => (x?.status ?? x) === 'Accepted');
            if (accepted && !solvedNow) {
                setSolvedNow(true);
            }
            fetchSubmissions();
        } catch (error) {
            console.log(error);
            setVerdicts([{ status: 'Submission failed.' }]);
            setFailedCase(null);
        }
        setSubmitLoading(false);
    };

    const handleAI = async (kind) => {
        setAiLoading(kind);
        setConsoleTab('ai');
        setAiPanel({ kind, text: '' });
        try {
            const { data } = kind === 'review'
                ? await axios.post(`${BACKEND_URL}/ai/review`, { code, problemId }, { withCredentials: true })
                : await axios.post(`${BACKEND_URL}/ai/debug`, { code, problemDescription: problem?.problemDescription }, { withCredentials: true });
            setAiPanel({ kind, text: (kind === 'review' ? data.review : data.debug) || 'No response from the AI.' });
        } catch {
            setAiPanel({ kind, text: `AI ${kind} failed. Please try again.` });
        }
        setAiLoading(null);
    };

    const getCode = useCallback(() => codeRef.current, []);
    const goToProblem = (id) => navigate(`/problem/${id}/description`);

    if (!problem) {
        return <div className="pv-loading"><CircularProgress size={56} thickness={5} /></div>;
    }

    const alreadySolved = solvedNow || solvedSet.has(problemId) || submissions.some((s) => s.verdict === 'Accepted');
    const examples = (problem.TestCases || []).filter((t) => t.isPublic !== false).slice(0, 3);

    return (
        <div className="pv2">
            <div className="pv-toolbar">
                <ProblemNav
                    problems={problems}
                    solvedSet={solvedNow ? new Set([...solvedSet, problemId]) : solvedSet}
                    currentId={problemId}
                    onGo={goToProblem}
                />
                <div className="pv-toolbar-title" title={problem.problemName}>
                    {alreadySolved && <span className="pv-solved-badge" title="You have solved this problem">✓ Solved</span>}
                </div>
                <ProblemTimer
                    key={problemId}
                    problemId={problemId}
                    difficulty={problem.difficulty}
                    userId={userId}
                    solved={solvedNow}
                    onFinish={setSolveTime}
                />
            </div>

            {solvedNow && (
                <div className="pv-banner" role="status">
                    🎉 Accepted! You solved <strong>{problem.problemName}</strong>
                    {solveTime != null && <> in <strong>{formatClock(solveTime)}</strong></>}.
                    {(() => {
                        const idx = problems.findIndex((p) => p._id === problemId);
                        const nxt = idx >= 0 ? problems[idx + 1] : null;
                        return nxt ? <button className="pv-btn pv-btn-primary pv-banner-btn" onClick={() => goToProblem(nxt._id)}>Next: {nxt.problemName} ›</button> : null;
                    })()}
                </div>
            )}

            <div className="pv-panes">
                {/* ── left: statement / submissions / discussion / tutor ── */}
                <section className="pv-card pv-left">
                    <div className="pv-tabs" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={tab === t.id}
                                className={`pv-tab${tab === t.id ? ' active' : ''}`}
                                onClick={() => setTab(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className={`pv-card-body${tab === 'tutor' ? ' pv-card-body-fill' : ''}`}>
                        {tab === 'description' && <ProblemDescription problem={problem} />}
                        {tab === 'submissions' && <ProblemSubmissions submissions={submissions} refreshSubmissions={fetchSubmissions} />}
                        {tab === 'discussions' && <ProblemDiscussion problemId={problemId} />}
                        {tab === 'tutor' && <ProblemAIChat problemId={problemId} getCode={getCode} language={language} />}
                    </div>
                </section>

                {/* ── right: editor + console ── */}
                <section className="pv-card pv-right">
                    <div className="pv-editor-head">
                        <select
                            value={language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="pv-select"
                            aria-label="Language"
                        >
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
                        <div className="pv-actions-group">
                            <button className="pv-btn pv-btn-ai" onClick={() => handleAI('review')} disabled={!!aiLoading}>
                                {aiLoading === 'review' ? <><span className="pv-spin" />Reviewing…</> : '📝 AI Review'}
                            </button>
                            <button className="pv-btn pv-btn-ai" onClick={() => handleAI('debug')} disabled={!!aiLoading}>
                                {aiLoading === 'debug' ? <><span className="pv-spin" />Debugging…</> : '🐞 AI Debug'}
                            </button>
                        </div>
                    </div>

                    <div className="pv-console">
                        <div className="pv-console-tabs" role="tablist">
                            {[
                                ['testcase', 'Testcase'],
                                ['output', 'Output'],
                                ['result', 'Result'],
                                ['ai', 'AI'],
                            ].map(([id, label]) => (
                                <button
                                    key={id}
                                    role="tab"
                                    aria-selected={consoleTab === id}
                                    className={`pv-ctab${consoleTab === id ? ' active' : ''}`}
                                    onClick={() => setConsoleTab(id)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="pv-console-body">
                            {consoleTab === 'testcase' && (
                                <>
                                    {examples.length > 0 && (
                                        <div className="pv-example-chips">
                                            {examples.map((ex, i) => (
                                                <button key={i} className="pv-chip" onClick={() => setInput(ex.input)}>Example {i + 1}</button>
                                            ))}
                                        </div>
                                    )}
                                    <textarea
                                        className="pv-textarea"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Custom input (optional)"
                                        spellCheck={false}
                                        aria-label="Custom input"
                                    />
                                </>
                            )}

                            {consoleTab === 'output' && (
                                runOutput ? (
                                    <pre className={`pv-output${runOutput.ok ? '' : ' pv-output-error'}`}>{runOutput.text === '' ? '(no output)' : runOutput.text}</pre>
                                ) : (
                                    <p className="pv-muted">Run your code to see the output here.</p>
                                )
                            )}

                            {consoleTab === 'result' && (
                                <>
                                    <Verdict verdicts={verdicts} />
                                    {failedCase && (
                                        <div className="pv-failed">
                                            <strong>Failed test case</strong>
                                            <div><span>Input</span><pre>{failedCase.input}</pre></div>
                                            <div><span>Expected</span><pre>{failedCase.expectedOutput ?? failedCase.expected}</pre></div>
                                            <div><span>Your output</span><pre>{failedCase.actualOutput ?? failedCase.actual}</pre></div>
                                        </div>
                                    )}
                                </>
                            )}

                            {consoleTab === 'ai' && (
                                aiPanel ? (
                                    <div className="pv-ai">
                                        <div className="pv-ai-title">{aiPanel.kind === 'review' ? '📝 AI Review' : '🐞 AI Debug'}</div>
                                        {aiLoading ? (
                                            <p className="pv-muted"><span className="pv-spin pv-spin-dark" />Thinking…</p>
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiPanel.text}</ReactMarkdown>
                                        )}
                                    </div>
                                ) : (
                                    <p className="pv-muted">Use <strong>AI Review</strong> or <strong>AI Debug</strong> to get feedback on your code.</p>
                                )
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

/* Keyed by problem id so every field (code, output, timer…) resets cleanly on prev / next. */
function Problem(props) {
    const params = useParams();
    const problemId = props.problemId || params.problemId || params.id;
    const [tab, setTab] = useState('description');
    return <Workspace key={problemId} problemId={problemId} tab={tab} setTab={setTab} />;
}

export default Problem;
