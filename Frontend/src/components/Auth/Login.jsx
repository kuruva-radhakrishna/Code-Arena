import axios from "axios";
import { useState } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import AuthShell, { Field, PasswordInput } from './AuthShell';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser } = useAuth();

    // ProtectedRoute sends people here with the page they wanted and a short message.
    const from = location.state?.from;
    const notice = location.state?.notice || location.state?.error;

    if (user) return <Navigate to={from?.pathname || "/"} replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError("");
        if (!email.trim() || !password) {
            setError("Enter your email and password.");
            return;
        }
        setLoading(true);
        try {
            const result = await axios.post(`${BACKEND_URL}/login`, { email: email.trim(), password }, { withCredentials: true });
            setUser(result.data.user);
            navigate(from?.pathname ? `${from.pathname}${from.search || ''}` : "/", { replace: true });
        } catch (err) {
            if (err.response?.status === 401) setError("Incorrect email or password.");
            else if (err.response?.data?.error) setError(err.response.data.error);
            else if (!err.response) setError("Cannot reach the server. Check your connection and try again.");
            else setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Log in to continue where you left off."
            footer={<>New to CodeArena? <Link to="/signup" state={location.state}>Create an account</Link></>}
        >
            {notice && !error && <div className="au-notice" role="status">{notice}</div>}
            <form onSubmit={handleSubmit} noValidate>
                <Field label="Email" id="login-email">
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />
                </Field>
                <Field label="Password" id="login-password" action={<Link to="/forgot-password" state={{ email }} className="au-forgot">Forgot password?</Link>}>
                    <PasswordInput id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Your password" />
                </Field>

                {error && <div className="au-alert" role="alert">{error}</div>}

                <button type="submit" className="au-submit" disabled={loading}>
                    {loading ? <><span className="au-spin" />Logging in…</> : 'Log in'}
                </button>
            </form>
        </AuthShell>
    );
}

export default Login;
