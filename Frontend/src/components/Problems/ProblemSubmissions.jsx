import "./ProblemSubmissions.css";
import { Link } from "react-router-dom";

function formatFormalDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  let hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  return `${day} ${month} ${year}, ${hour}:${minute} ${ampm}`;
}

const LANGUAGE_LABELS = { cpp: 'C++', c: 'C', java: 'Java', python: 'Python' };

function verdictTone(verdict = '') {
  const v = verdict.toLowerCase();
  if (v.includes('accept')) return 'ok';
  if (v.includes('wrong') || v.includes('error') || v.includes('runtime') || v.includes('compil')) return 'bad';
  return 'warn';
}

function ProblemSubmissions({ submissions, refreshSubmissions }) {
    return (
        <div className="problem-submissions">
            <div className="ps-head">
                <h3>Your submissions</h3>
                {refreshSubmissions && (
                    <button className="ps-refresh" onClick={refreshSubmissions}>Refresh</button>
                )}
            </div>
            <div className="ps-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Language</th>
                            <th>Verdict</th>
                            <th>Submitted</th>
                            <th>Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions && submissions.length > 0 ? (
                            submissions.map((submission, index) => (
                                <tr key={submission._id}>
                                    <td>{submissions.length - index}</td>
                                    <td>{LANGUAGE_LABELS[submission.language] || submission.language}</td>
                                    <td>
                                        <span className={`ps-verdict ps-${verdictTone(submission.verdict)}`}>{submission.verdict}</span>
                                    </td>
                                    <td>{formatFormalDate(submission.submittedAt)}</td>
                                    <td>
                                        <Link to={`/submission/${submission._id}`} className="view-code-link">View</Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280' }}>No submissions yet — run your code and hit Submit.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProblemSubmissions;
