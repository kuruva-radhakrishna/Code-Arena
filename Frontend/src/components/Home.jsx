import { Link } from 'react-router-dom';
import './HomePage.css';
import { useAuth } from '../contexts/AuthContext';

const STATS = [
  ['100+', 'Practice problems'],
  ['3', 'Languages: C++, Java, Python'],
  ['Live', 'Timed contests'],
  ['AI', 'Tutor for every problem'],
];

const FEATURES = [
  { icon: '</>', tone: 'blue', title: 'Practice problems', text: 'Easy to hard problems across arrays, strings, graphs, trees and dynamic programming, judged instantly against hidden tests.' },
  { icon: '🏆', tone: 'orange', title: 'Timed contests', text: 'Compete in live rounds, watch the leaderboard move and see exactly where you rank when it ends.' },
  { icon: '✨', tone: 'purple', title: 'AI tutor', text: 'Stuck? Ask about the exact problem you are on. It nudges you toward the idea instead of handing over the answer.' },
  { icon: '⏱', tone: 'green', title: 'Pace yourself', text: 'A built-in timer shows how you are doing against a target for each difficulty, and stops when you solve it.' },
  { icon: '📈', tone: 'teal', title: 'Track progress', text: 'See what you have solved by difficulty and topic, review past submissions and spot what to practise next.' },
  { icon: '💬', tone: 'red', title: 'Discuss', text: 'Ask questions and share approaches on every problem and contest.' },
];

const STEPS = [
  ['1', 'Pick a problem', 'Filter by topic or difficulty, or hit "Pick one" and let us choose.'],
  ['2', 'Code and run', 'Write in C++, Java or Python, test on the examples, then submit.'],
  ['3', 'Learn from the verdict', 'Get a verdict on every test, ask the AI tutor for hints and improve.'],
];

function EditorPreview() {
  return (
    <div className="hm-editor" aria-hidden="true">
      <div className="hm-editor-bar">
        <span className="hm-dots"><i /><i /><i /></span>
        <span className="hm-file">two_sum.py</span>
        <em className="hm-accepted">Accepted ✓</em>
      </div>
      <pre>
        <span className="k">def</span> <span className="f">two_sum</span>(nums, target):{'\n'}
        {'    '}seen = {'{}'}{'\n'}
        {'    '}<span className="k">for</span> i, x <span className="k">in</span> <span className="f">enumerate</span>(nums):{'\n'}
        {'        '}<span className="k">if</span> target - x <span className="k">in</span> seen:{'\n'}
        {'            '}<span className="k">return</span> [seen[target - x], i]{'\n'}
        {'        '}seen[x] = i
      </pre>
      <div className="hm-editor-foot">
        <span>⏱ 08:12</span>
        <span>3 / 3 tests passed</span>
        <span>Runtime 42 ms</span>
      </div>
    </div>
  );
}

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="hm">
      <section className="hm-hero">
        <div className="hm-hero-text">
          {user ? (
            <>
              <span className="hm-pill">Welcome back</span>
              <h1>Good to see you, <span>{user.firstname}</span>.</h1>
              <p>Pick up where you left off, take on a contest, or ask the AI tutor about a problem you are stuck on.</p>
              <div className="hm-actions">
                <Link to="/problems" className="hm-btn hm-btn-primary">Continue practising</Link>
                <Link to="/contests" className="hm-btn hm-btn-ghost">Browse contests</Link>
              </div>
            </>
          ) : (
            <>
              <span className="hm-pill">Free to use · No setup</span>
              <h1>Get better at coding, <span>one problem at a time.</span></h1>
              <p>Practise with 100+ problems, compete in timed contests and get hints from an AI tutor that teaches instead of spoiling.</p>
              <div className="hm-actions">
                <Link to="/signup" className="hm-btn hm-btn-primary">Start for free</Link>
                <Link to="/problems" className="hm-btn hm-btn-ghost">Browse problems</Link>
              </div>
              <p className="hm-login">Already have an account? <Link to="/login">Log in</Link></p>
            </>
          )}
        </div>
        <EditorPreview />
      </section>

      <section className="hm-stats" aria-label="Highlights">
        {STATS.map(([big, small]) => (
          <div key={small}><strong>{big}</strong><span>{small}</span></div>
        ))}
      </section>

      <section className="hm-section">
        <header>
          <h2>Everything you need to improve</h2>
          <p>One place to practise, compete and learn.</p>
        </header>
        <div className="hm-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="hm-card">
              <span className={`hm-icon hm-${f.tone}`}>{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hm-section hm-steps-wrap">
        <header>
          <h2>How it works</h2>
        </header>
        <ol className="hm-steps">
          {STEPS.map(([n, title, text]) => (
            <li key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {!user && (
        <section className="hm-cta">
          <h2>Ready to start?</h2>
          <p>Create a free account and solve your first problem in minutes.</p>
          <Link to="/signup" className="hm-btn hm-btn-primary">Create your account</Link>
        </section>
      )}
    </div>
  );
};

export default Home;
