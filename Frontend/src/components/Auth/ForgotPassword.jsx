import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthShell, { Field } from './AuthShell';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const RESEND_AFTER_SECONDS = 30;

function ForgotPassword() {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || "");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sentTo, setSentTo] = useState(""); // set once a request has been accepted
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const submit = async (e) => {
        e?.preventDefault();
        if (loading) return;
        setError("");
        const value = email.trim();
        if (!/^\S+@\S+\.\S+$/.test(value)) {
            setError("Enter a valid email address.");
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${BACKEND_URL}/forgot-password`, { email: value }, { withCredentials: true });
            setSentTo(value);
            setCooldown(RESEND_AFTER_SECONDS);
        } catch (err) {
            if (err.response?.status === 429) setError("Too many requests. Please wait a few minutes and try again.");
            else if (err.response?.data?.message) setError(err.response.data.message);
            else if (!err.response) setError("Cannot reach the server. Check your connection and try again.");
            else setError("Something went wrong. Please try again.");
        }
        setLoading(false);
    };

    if (sentTo) {
        return (
            <AuthShell
                title="Check your email"
                subtitle={<>If an account exists for <strong>{sentTo}</strong>, we have sent a link to reset your password. It is valid for 30 minutes.</>}
                footer={<><Link to="/login">Back to log in</Link></>}
            >
                <div className="au-notice" role="status">
                    Nothing in your inbox? Check your spam folder, and make sure you used the email you signed up with.
                </div>
                {error && <div className="au-alert" role="alert">{error}</div>}
                <button type="button" className="au-submit au-secondary" onClick={submit} disabled={loading || cooldown > 0}>
                    {loading ? <><span className="au-spin" />Sending…</> : cooldown > 0 ? `Send again in ${cooldown}s` : 'Send the link again'}
                </button>
                <button type="button" className="au-textbtn" onClick={() => { setSentTo(""); setError(""); }}>
                    Use a different email
                </button>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Forgot your password?"
            subtitle="Enter your email and we will send you a link to choose a new one."
            footer={<>Remembered it? <Link to="/login">Log in</Link></>}
        >
            <form onSubmit={submit} noValidate>
                <Field label="Email" id="fp-email">
                    <input
                        id="fp-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />
                </Field>
                {error && <div className="au-alert" role="alert">{error}</div>}
                <button type="submit" className="au-submit" disabled={loading}>
                    {loading ? <><span className="au-spin" />Sending…</> : 'Send reset link'}
                </button>
            </form>
        </AuthShell>
    );
}

export default ForgotPassword;
