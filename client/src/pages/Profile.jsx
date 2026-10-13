import { useState } from 'react';
import { api } from '../lib/api';
import { fmtDate } from '../lib/format';
import { useTitle } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field } from '../components/ui';

export default function Profile() {
  useTitle('My profile');
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', address: user.address || '', city: user.city || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const d = await api.put('/auth/me', form);
      setUser(d.user);
      toast.success('Profile saved');
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwBusy(true);
    setPwErrors({});
    try {
      await api.put('/auth/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      setPwErrors({ ...err.fieldErrors, ...(err.status === 400 && !Object.keys(err.fieldErrors).length ? { currentPassword: err.message } : {}) });
    } finally {
      setPwBusy(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-3xl font-bold">My profile</h1>
      <p className="mb-6 mt-1 text-sm text-ink-soft">
        {user.email} - member since {fmtDate(user.createdAt)}
      </p>

      <form onSubmit={save} noValidate className="panel mb-6 space-y-4 p-5">
        <h2 className="text-xl font-bold">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name}>
            <input className="input" value={form.name} onChange={set('name')} autoComplete="name" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
          </Field>
          <Field label="Delivery address" error={errors.address} className="sm:col-span-2" hint="Used to fill in checkout for you.">
            <input className="input" value={form.address} onChange={set('address')} autoComplete="street-address" />
          </Field>
          <Field label="City" error={errors.city}>
            <input className="input" value={form.city} onChange={set('city')} autoComplete="address-level2" />
          </Field>
        </div>
        {errors.form && !Object.keys(errors).some((k) => k !== 'form') && <p className="field-error">{errors.form}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={changePassword} noValidate className="panel space-y-4 p-5">
        <h2 className="text-xl font-bold">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password" error={pwErrors.currentPassword}>
            <input type="password" className="input" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} autoComplete="current-password" />
          </Field>
          <Field label="New password" error={pwErrors.newPassword} hint="At least 8 characters with a letter and a number.">
            <input type="password" className="input" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} autoComplete="new-password" />
          </Field>
        </div>
        <button className="btn btn-outline" disabled={pwBusy}>
          {pwBusy ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
