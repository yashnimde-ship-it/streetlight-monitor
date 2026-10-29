import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-xl bg-amber-500 p-3 text-slate-900">
            <Icon name="bulb" className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">StreetLight Monitor</h1>
          <p className="mt-1 text-sm text-slate-400">Churchgate to Virar streetlight monitoring · sustainable energy management</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-xl">
          <h2 className="font-semibold text-slate-900">Administrator login</h2>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {import.meta.env.DEV && (
            <p className="text-center text-xs text-slate-500">
              Dev login: <code>admin@streetlight.local</code> / <code>admin123</code>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
