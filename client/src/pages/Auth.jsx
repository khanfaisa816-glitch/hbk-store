import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../lib/hooks';
import { Field } from '../components/ui';
import { Logo } from '../components/Navbar';

function AuthShell({ title, children, footer }) {
  return (
    <div className="container-page flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo className="text-2xl" />
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        <div className="panel p-6">{children}</div>
        <p className="mt-5 text-center text-sm text-ink-soft">{footer}</p>
      </div>
    </div>
  );
}

export function Login() {
  useTitle('Log in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      footer={
        <>
          New to HBK?{' '}
          <Link to="/register" state={location.state} className="link">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {location.state?.notice && <p className="rounded bg-brand-50 p-3 text-sm text-brand-800">{location.state.notice}</p>}
        {errors.form && !errors.email && !errors.password && (
          <p className="rounded bg-chili-50 p-3 text-sm text-chili" role="alert">
            {errors.form}
          </p>
        )}
        <Field label="Email" error={errors.email}>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" autoFocus />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        </Field>
        <button className="btn btn-primary w-full !py-3" disabled={busy}>
          {busy ? 'Logging in...' : 'Log in'}
        </button>
        <p className="rounded bg-paper p-3 text-[13px] text-ink-soft">
          Demo account: <span className="font-mono">customer@hbk.example</span> / <span className="font-mono">Customer@123</span>
        </p>
      </form>
    </AuthShell>
  );
}

export function Register() {
  useTitle('Create account');
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await register(form);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="link">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {errors.form && !errors.name && !errors.email && !errors.password && !errors.phone && (
          <p className="rounded bg-chili-50 p-3 text-sm text-chili" role="alert">
            {errors.form}
          </p>
        )}
        <Field label="Full name" error={errors.name}>
          <input className="input" value={form.name} onChange={set('name')} autoComplete="name" autoFocus />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Phone (optional)" error={errors.phone}>
          <input className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters with a letter and a number.">
          <input type="password" className="input" value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
        <button className="btn btn-primary w-full !py-3" disabled={busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
