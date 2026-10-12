import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Loads the problem list (same endpoint the Problems page uses, so it already
 * excludes problems locked inside a running contest) together with the set of
 * problem ids the current user has solved.
 */
export default function useProblemList() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${BACKEND_URL}/problems`, { withCredentials: true });
        if (cancelled) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProblems(res.data.filter((p) => p && p._id));
        } else {
          setProblems([]);
          setError('Problems not found.');
        }
      } catch {
        if (!cancelled) {
          setProblems([]);
          setError('Loading issues. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/submissions/`, { withCredentials: true })
      .then((res) => { if (!cancelled) setSubmissions(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setSubmissions([]); });
    return () => { cancelled = true; };
  }, [user]);

  const solvedSet = useMemo(() => {
    const set = new Set();
    submissions.forEach((sub) => {
      if (!sub || !sub.problem_id || sub.verdict !== 'Accepted') return;
      const pid = typeof sub.problem_id === 'object' ? sub.problem_id._id : sub.problem_id;
      if (pid) set.add(pid.toString());
    });
    return set;
  }, [submissions]);

  return { problems, solvedSet, loading, error };
}
