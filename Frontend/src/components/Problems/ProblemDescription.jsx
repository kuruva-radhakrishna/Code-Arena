import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import './ProblemDescription.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CircularProgress from '@mui/material/CircularProgress';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const MAX_EXAMPLES = 3;

/**
 * Renders a problem statement. ProblemView passes the problem it already
 * loaded; when mounted on its own (route element) it fetches it itself.
 */
function ProblemDescription({ problem: problemProp, showHints = true }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [fetched, setFetched] = useState();
    const [revealedHints, setRevealedHints] = useState(0);

    useEffect(() => {
        if (problemProp) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const result = await axios.get(`${BACKEND_URL}/problems/${id}`, { withCredentials: true });
                if (cancelled) return;
                if (!result.data) {
                    alert("Selected problem has been deleted.");
                    navigate("/problems");
                } else {
                    setFetched(result.data);
                }
            } catch {
                if (!cancelled) {
                    alert("Problem fetch error.");
                    navigate("/problems");
                }
            }
        })();
        return () => { cancelled = true; };
    }, [id, navigate, problemProp]);

    // New problem (prev / next) -> hints start hidden again.
    const problem = problemProp || fetched;
    const problemKey = problem?._id;
    useEffect(() => { setRevealedHints(0); }, [problemKey]);

    if (!problem) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <CircularProgress size={36} />
            </div>
        );
    }

    const constraints = problem.Constraints || [];
    const hints = problem.hints || [];
    // Only public cases are examples; fall back to the first case for old problems.
    const publicCases = (problem.TestCases || []).filter((t) => t.isPublic !== false);
    const examples = (publicCases.length ? publicCases : (problem.TestCases || [])).slice(0, MAX_EXAMPLES);

    return (
        <div className="problem-description">
            <div className="pd-title-row">
                <h1>{problem.problemName}</h1>
                <span className={`difficulty-box ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span>
            </div>

            {problem.topics && problem.topics.length > 0 && (
                <div className="pd-topics">
                    {problem.topics.map((topic) => (
                        <span key={topic} className="topic-tag">{topic}</span>
                    ))}
                </div>
            )}

            <div className="pd-statement">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.problemDescription}</ReactMarkdown>
            </div>

            {examples.map((ex, i) => (
                <div className="pd-example" key={i}>
                    <h3>Example {i + 1}</h3>
                    <div className="pd-io">
                        <div>
                            <span className="pd-io-label">Input</span>
                            <pre>{ex.input}</pre>
                        </div>
                        <div>
                            <span className="pd-io-label">Output</span>
                            <pre>{ex.output}</pre>
                        </div>
                    </div>
                </div>
            ))}

            {constraints.length > 0 && (
                <>
                    <h2>Constraints</h2>
                    <ul>
                        {constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                </>
            )}

            {showHints && hints.length > 0 && (
                <div className="pd-hints">
                    <h2>Hints</h2>
                    {hints.slice(0, revealedHints).map((h, i) => (
                        <div className="pd-hint" key={i}>
                            <strong>Hint {i + 1}</strong>
                            <span>{h}</span>
                        </div>
                    ))}
                    {revealedHints < hints.length ? (
                        <button className="pd-hint-btn" onClick={() => setRevealedHints((n) => n + 1)}>
                            {revealedHints === 0 ? 'Show a hint' : `Show hint ${revealedHints + 1} of ${hints.length}`}
                        </button>
                    ) : (
                        <button className="pd-hint-btn secondary" onClick={() => setRevealedHints(0)}>Hide hints</button>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProblemDescription;
