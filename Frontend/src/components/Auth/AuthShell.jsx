import { useState } from 'react';
import './AuthPages.css';
import { passwordStrength, STRENGTH_LABEL } from '../../utils/passwordStrength';

const POINTS = [
  ['100+ practice problems', 'Arrays to dynamic programming, with instant verdicts'],
  ['Timed contests', 'Live leaderboards and ranked results'],
  ['An AI tutor that hints, not spoils', 'Ask about the exact problem you are stuck on'],
];

/** Two-column layout shared by the login and sign-up pages. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="au">
      <aside className="au-brand" aria-hidden="false">
        <h2>Practice. Compete. Improve.</h2>
        <p>Everything you need to get better at problem solving, in one place.</p>
        <ul>
          {POINTS.map(([head, text]) => (
            <li key={head}>
              <i aria-hidden="true">✓</i>
              <div><strong>{head}</strong><span>{text}</span></div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="au-main">
        <div className="au-card">
          <h1>{title}</h1>
          <p className="au-sub">{subtitle}</p>
          {children}
          <p className="au-foot">{footer}</p>
        </div>
      </main>
    </div>
  );
}

/** Labelled input with an optional error line. */
export function Field({ label, id, error, hint, action, children }) {
  return (
    <div className={`au-field${error ? ' has-error' : ''}`}>
      <div className="au-labelrow">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      {children}
      {error ? <small className="au-error" id={`${id}-err`}>{error}</small> : hint ? <small className="au-hint">{hint}</small> : null}
    </div>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordInput({ id, value, onChange, onBlur, autoComplete, invalid, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="au-pass">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={invalid ? `${id}-err` : undefined}
      />
      <button type="button" className="au-show" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

/** Four-bar password strength hint (renders nothing for an empty password). */
export function StrengthMeter({ password }) {
  if (!password) return null;
  const strength = passwordStrength(password);
  return (
    <div className="au-meter" aria-live="polite">
      <div className="au-meter-bars">
        {[1, 2, 3, 4].map((n) => <i key={n} className={n <= strength ? `on s${strength}` : ''} />)}
      </div>
      <span>{STRENGTH_LABEL[strength]}</span>
    </div>
  );
}
