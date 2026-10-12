import { useMemo, useState } from "react";
import axios from 'axios';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import AuthShell, { Field, PasswordInput } from './AuthShell';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Same rules as Backend/validators/userValidation.js
const RULES = {
    firstname: (v) => (v.trim().length < 2 ? 'Enter at least 2 characters.' : ''),
    lastname: (v) => (v.trim().length < 2 ? 'Enter at least 2 characters.' : ''),
    email: (v) => (!/^\S+@\S+\.\S+$/.test(v.trim()) ? 'Enter a valid email address.' : ''),
    password: (v) => (v.length < 6 ? 'Use at least 6 characters.' : ''),
};

function passwordStrength(pw) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
}
const STRENGTH_LABEL = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

function SignUp() {
    const [form, setForm] = useState({ firstname: '', lastname: '', email: '', password: '' });
    const [touched, setTouched] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser } = useAuth();

    const errors = useMemo(
        () => Object.fromEntries(Object.keys(RULES).map((k) => [k, RULES[k](form[k])])),
        [form]
    );
    const strength = passwordStrength(form.password);

    if (user) return <Navigate to="/problems" replace />;

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
    const shown = (k) => (touched[k] ? errors[k] : '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setServerError('');
        setTouched({ firstname: true, lastname: true, email: true, password: true });
        if (Object.values(errors).some(Boolean)) return;

        setLoading(true);
        try {
            const result = await axios.post(`${BACKEND_URL}/register`, {
                firstname: form.firstname.trim(),
                lastname: form.lastname.trim(),
                email: form.email.trim(),
                password: form.password,
            }, { withCredentials: true });
            setUser(result.data.user);
            const from = location.state?.from;
            navigate(from?.pathname ? `${from.pathname}${from.search || ''}` : '/problems', { replace: true });
        } catch (err) {
            const data = err.response?.data;
            if (data?.message || data?.error) setServerError(data.message || data.error);
            else if (!err.response) setServerError('Cannot reach the server. Check your connection and try again.');
            else setServerError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Create your account"
            subtitle="Free to join. Start solving in under a minute."
            footer={<>Already have an account? <Link to="/login" state={location.state}>Log in</Link></>}
        >
            <form onSubmit={handleSubmit} noValidate>
                <div className="au-row">
                    <Field label="First name" id="su-first" error={shown('firstname')}>
                        <input id="su-first" autoComplete="given-name" autoFocus value={form.firstname} onChange={set('firstname')} onBlur={blur('firstname')} aria-invalid={shown('firstname') ? 'true' : undefined} />
                    </Field>
                    <Field label="Last name" id="su-last" error={shown('lastname')}>
                        <input id="su-last" autoComplete="family-name" value={form.lastname} onChange={set('lastname')} onBlur={blur('lastname')} aria-invalid={shown('lastname') ? 'true' : undefined} />
                    </Field>
                </div>

                <Field label="Email" id="su-email" error={shown('email')}>
                    <input id="su-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} onBlur={blur('email')} aria-invalid={shown('email') ? 'true' : undefined} />
                </Field>

                <Field label="Password" id="su-password" error={shown('password')}>
                    <PasswordInput id="su-password" value={form.password} onChange={set('password')} onBlur={blur('password')} autoComplete="new-password" invalid={!!shown('password')} placeholder="At least 6 characters" />
                    {form.password && (
                        <div className="au-meter" aria-live="polite">
                            <div className="au-meter-bars">
                                {[1, 2, 3, 4].map((n) => <i key={n} className={n <= strength ? `on s${strength}` : ''} />)}
                            </div>
                            <span>{STRENGTH_LABEL[strength]}</span>
                        </div>
                    )}
                </Field>

                {serverError && <div className="au-alert" role="alert">{serverError}</div>}

                <button type="submit" className="au-submit" disabled={loading}>
                    {loading ? <><span className="au-spin" />Creating account…</> : 'Create account'}
                </button>
            </form>
        </AuthShell>
    );
}

export default SignUp;
