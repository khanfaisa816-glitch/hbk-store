import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AuthContext';
import { useTitle } from '../../lib/hooks';
import { Field } from '../../components/ui';
import { Logo } from '../../components/Navbar';

export default function AdminLogin() {
  useTitle('Admin login');
  const { user, login } = useAdminAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await login(form.email, form.password);
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-brand-800 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-white">
          <Logo className="text-2xl" />
          <h1 className="text-2xl font-bold">Admin panel</h1>
        </div>
        <form onSubmit={submit} noValidate className="space-y-4 rounded-xl bg-white p-6">
          {errors.form && !errors.email && !errors.password && (
            <p className="rounded bg-chili-50 p-3 text-sm text-chili" role="alert">
              {errors.form}
            </p>
          )}
          <Field label="Email" error={errors.email}>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="username" autoFocus />
          </Field>
          <Field label="Password" error={errors.password}>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          </Field>
          <button className="btn btn-primary w-full !py-3" disabled={busy}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
          <p className="rounded bg-paper p-3 text-[13px] text-ink-soft">
            Demo admin: <span className="font-mono">admin@hbk.example</span> / <span className="font-mono">Admin@123</span>
          </p>
        </form>
        <p className="mt-4 text-center text-sm text-white/75">
          <Link to="/" className="underline underline-offset-2 hover:text-white">
            Back to the store
          </Link>
        </p>
      </div>
    </div>
  );
}
