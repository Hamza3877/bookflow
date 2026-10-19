import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Logo } from '../components/layout/Logo';
import { homeFor, useAuthActions } from '../hooks/useAuthActions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAppSelector } from '../store';

const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'demo@bookflow.dev', password: 'Demo@123', note: 'Search, book and pay' },
  { label: 'Business owner', email: 'owner@bookflow.dev', password: 'Owner@123', note: 'Dashboard and listings' },
  { label: 'Admin', email: 'admin@bookflow.dev', password: 'Admin@123', note: 'Users and audit log' },
];

export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from ?? homeFor(user.role)} replace />;

  const submit = async (emailValue: string, passwordValue: string) => {
    setBusy(true);
    setError('');
    try {
      const session = await login(emailValue, passwordValue);
      navigate(from ?? homeFor(session.user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(email, password);
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-2">
      <div className="card p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">Welcome back</h1>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <Field label="Email"><input type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><input type="password" required autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <Button type="submit" className="w-full" loading={busy}>Log in</Button>
        </form>
        <p className="mt-5 text-sm text-slate-600">New here? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link></p>
      </div>

      <div>
        <h2 className="text-lg font-bold">Try a demo account</h2>
        <p className="mt-1 text-sm text-slate-600">One click, no sign-up. Each role sees a different part of the platform.</p>
        <div className="mt-4 space-y-3">
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.email} disabled={busy} onClick={() => submit(a.email, a.password)} className="card flex w-full items-center justify-between p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60">
              <span><span className="block font-semibold">{a.label}</span><span className="text-sm text-slate-500">{a.note}</span></span>
              <span className="text-sm font-semibold text-brand-700">Log in</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
