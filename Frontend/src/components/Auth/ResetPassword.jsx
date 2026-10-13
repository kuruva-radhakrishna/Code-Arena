import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell, { Field, PasswordInput, StrengthMeter } from './AuthShell';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const TOKEN_FORMAT = /^[a-f0-9]{64}$/;

function ResetPassword() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    // Keep the token in state and take it out of the address bar, so it does not linger in
    // the browser history or leak through a Referer header.
    const [token] = useState(() => params.get('token') || '');
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [touched, setTouched] = useState({});
    const [error, setError] = useState("");
    const [expired, setExpired] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (params.has('token')) navigate('/reset-password', { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const linkProblem = !TOKEN_FORMAT.test(token) || expired;

    if (linkProblem) {
        return (
            <AuthShell
                title="This link has expired"
                subtitle="Password reset links work once and are valid for 30 minutes."
                footer={<><Link to="/login">Back to log in</Link></>}
            >
                <Link to="/forgot-password" className="au-submit au-linkbtn">Request a new link</Link>
            </AuthShell>
        );
    }

    const passwordError = password.length < 6 ? 'Use at least 6 characters.' : '';
    const confirmError = confirm !== password ? 'The passwords do not match.' : '';

    const submit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError("");
        setTouched({ password: true, confirm: true });
        if (passwordError || confirmError) return;
        setLoading(true);
        try {
            await axios.post(`${BACKEND_URL}/reset-password`, { token, password }, { withCredentials: true });
            navigate('/login', { replace: true, state: { notice: 'Password updated. Log in with your new password.' } });
        } catch (err) {
            if (err.response?.status === 429) setError("Too many attempts. Please wait a few minutes and try again.");
            else if (err.response?.status === 400 && /invalid or has expired/i.test(err.response.data?.message || '')) setExpired(true);
            else if (err.response?.data?.message) setError(err.response.data.message);
            else if (!err.response) setError("Cannot reach the server. Check your connection and try again.");
            else setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Choose a new password"
            subtitle="Pick something you have not used before. You will be logged out on other devices."
            footer={<><Link to="/login">Back to log in</Link></>}
        >
            <form onSubmit={submit} noValidate>
                <Field label="New password" id="rp-password" error={touched.password ? passwordError : ''}>
                    <PasswordInput
                        id="rp-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        autoComplete="new-password"
                        invalid={!!(touched.password && passwordError)}
                        placeholder="At least 6 characters"
                    />
                    <StrengthMeter password={password} />
                </Field>
                <Field label="Confirm new password" id="rp-confirm" error={touched.confirm ? confirmError : ''}>
                    <PasswordInput
                        id="rp-confirm"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                        autoComplete="new-password"
                        invalid={!!(touched.confirm && confirmError)}
                        placeholder="Type it again"
                    />
                </Field>

                {error && <div className="au-alert" role="alert">{error}</div>}

                <button type="submit" className="au-submit" disabled={loading}>
                    {loading ? <><span className="au-spin" />Updating…</> : 'Update password'}
                </button>
            </form>
        </AuthShell>
    );
}

export default ResetPassword;
