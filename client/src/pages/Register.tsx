import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { homeFor, useAuthActions } from '../hooks/useAuthActions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CITIES } from '../lib/format';
import { useAppSelector } from '../store';

export default function Register() {
  useDocumentTitle('Sign up');
  const { register } = useAuthActions();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [role, setRole] = useState<'customer' | 'owner'>('customer');
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', city: 'Karachi' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = role === 'owner' ? { ...form, role } : { name: form.name, email: form.email, password: form.password, role };
      const session = await register(body);
      navigate(homeFor(session.user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">Create your account</h1>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Account type">
          {(['customer', 'owner'] as const).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${role === r ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
              {r === 'customer' ? 'I want to book' : 'I rent out'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <Field label="Full name"><input required minLength={2} className="field" value={form.name} onChange={set('name')} autoComplete="name" /></Field>
          <Field label="Email"><input type="email" required className="field" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
          <Field label="Password" hint="At least 8 characters"><input type="password" required minLength={8} className="field" value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
          {role === 'owner' && (
            <>
              <Field label="Business name"><input required minLength={2} className="field" value={form.businessName} onChange={set('businessName')} /></Field>
              <Field label="City">
                <select className="field" value={form.city} onChange={set('city')}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select>
              </Field>
            </>
          )}
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <Button type="submit" className="w-full" loading={busy}>Create account</Button>
        </form>
        <p className="mt-5 text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link></p>
      </div>
    </div>
  );
}
