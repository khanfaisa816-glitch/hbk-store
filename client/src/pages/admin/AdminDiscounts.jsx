import { useState } from 'react';
import { adminApi } from '../../lib/api';
import { money } from '../../lib/format';
import { useAsync, useTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import Modal, { ConfirmModal } from '../../components/Modal';
import { ErrorBox, Field, PageSpinner } from '../../components/ui';
import { ActiveBadge, CheckField, PageHeader, TableWrap, Td, Th } from '../../components/admin';
import { EditIcon, PlusIcon, TrashIcon } from '../../components/Icons';

// ---------- discount codes ----------
function DiscountForm({ discount, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    code: discount?.code || '',
    type: discount?.type || 'percent',
    value: discount?.value ?? '',
    minOrder: discount?.minOrder ?? 0,
    usageLimit: discount?.usageLimit ?? '',
    expiresAt: discount?.expiresAt || '',
    active: discount ? discount.active : true,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (discount) await adminApi.put(`/admin/discounts/${discount.id}`, form);
      else await adminApi.post('/admin/discounts', form);
      toast.success('Discount code saved');
      onSaved();
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal
      title={discount ? 'Edit discount code' : 'Add discount code'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" form="discount-form" disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form id="discount-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {errors.form && Object.keys(errors).length === 1 && <p className="field-error sm:col-span-2">{errors.form}</p>}
        <Field label="Code" error={errors.code}>
          <input className="input font-mono uppercase" value={form.code} onChange={set('code')} placeholder="SAVE10" />
        </Field>
        <Field label="Type" error={errors.type}>
          <select className="input" value={form.type} onChange={set('type')}>
            <option value="percent">Percent off (%)</option>
            <option value="fixed">Fixed amount (Rs)</option>
          </select>
        </Field>
        <Field label={form.type === 'percent' ? 'Percent' : 'Amount (Rs)'} error={errors.value}>
          <input type="number" min="1" className="input" value={form.value} onChange={set('value')} />
        </Field>
        <Field label="Minimum order (Rs)" error={errors.minOrder}>
          <input type="number" min="0" className="input" value={form.minOrder} onChange={set('minOrder')} />
        </Field>
        <Field label="Usage limit (optional)" error={errors.usageLimit} hint="Leave empty for unlimited.">
          <input type="number" min="1" className="input" value={form.usageLimit} onChange={set('usageLimit')} />
        </Field>
        <Field label="Expires on (optional)" error={errors.expiresAt}>
          <input type="date" className="input" value={form.expiresAt} onChange={set('expiresAt')} />
        </Field>
        <div className="sm:col-span-2">
          <CheckField label="Code is active" checked={form.active} onChange={set('active')} />
        </div>
      </form>
    </Modal>
  );
}

function Discounts() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => adminApi.get('/admin/discounts'), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.del(`/admin/discounts/${deleting.id}`);
      toast.success('Code deleted');
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="codes-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="codes-title" className="text-xl font-bold">
          Discount codes
        </h2>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <PlusIcon size={15} /> Add code
        </button>
      </div>
      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading ? (
        <PageSpinner />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Min. order</Th>
              <Th>Used</Th>
              <Th>Expires</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.discounts.map((d) => (
              <tr key={d.id}>
                <Td className="font-mono font-semibold">{d.code}</Td>
                <Td>{d.type === 'percent' ? `${d.value}% off` : `${money(d.value)} off`}</Td>
                <Td>{d.minOrder ? money(d.minOrder) : '-'}</Td>
                <Td>
                  {d.usedCount}
                  {d.usageLimit ? ` / ${d.usageLimit}` : ''}
                </Td>
                <Td>{d.expiresAt || 'Never'}</Td>
                <Td>{d.expired ? <ActiveBadge on={false} no="Expired" /> : <ActiveBadge on={d.active} no="Off" />}</Td>
                <Td className="text-right">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(d)} aria-label={`Edit ${d.code}`}>
                    <EditIcon size={15} />
                  </button>
                  <button className="btn btn-ghost btn-sm !text-chili" onClick={() => setDeleting(d)} aria-label={`Delete ${d.code}`}>
                    <TrashIcon size={15} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {editing && <DiscountForm discount={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {deleting && <ConfirmModal title="Delete code?" message={`The code ${deleting.code} will stop working.`} confirmLabel="Delete" danger busy={busy} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </section>
  );
}

// ---------- promo banners shown on the home page ----------
function OfferForm({ offer, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: offer?.title || '', subtitle: offer?.subtitle || '', badge: offer?.badge || '', code: offer?.code || '', active: offer ? offer.active : true });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (offer) await adminApi.put(`/admin/offers/${offer.id}`, form);
      else await adminApi.post('/admin/offers', form);
      toast.success('Offer saved');
      onSaved();
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal
      title={offer ? 'Edit offer' : 'Add offer'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" form="offer-form" disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form id="offer-form" onSubmit={submit} noValidate className="space-y-4">
        {errors.form && Object.keys(errors).length === 1 && <p className="field-error">{errors.form}</p>}
        <Field label="Title" error={errors.title}>
          <input className="input" value={form.title} onChange={set('title')} placeholder="10% off your first order" />
        </Field>
        <Field label="Short text" error={errors.subtitle}>
          <input className="input" value={form.subtitle} onChange={set('subtitle')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Badge (optional)" error={errors.badge}>
            <input className="input" value={form.badge} onChange={set('badge')} placeholder="New" maxLength={20} />
          </Field>
          <Field label="Discount code to show (optional)" error={errors.code}>
            <input className="input font-mono uppercase" value={form.code} onChange={set('code')} maxLength={20} />
          </Field>
        </div>
        <CheckField label="Show on home page" checked={form.active} onChange={set('active')} />
      </form>
    </Modal>
  );
}

function Offers() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => adminApi.get('/admin/offers'), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.del(`/admin/offers/${deleting.id}`);
      toast.success('Offer deleted');
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="offers-title" className="mt-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="offers-title" className="text-xl font-bold">
          Home page offers
        </h2>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <PlusIcon size={15} /> Add offer
        </button>
      </div>
      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading ? (
        <PageSpinner />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Badge</Th>
              <Th>Code</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.offers.map((o) => (
              <tr key={o.id}>
                <Td>
                  <span className="font-medium">{o.title}</span>
                  <span className="block text-xs text-ink-soft">{o.subtitle}</span>
                </Td>
                <Td>{o.badge || '-'}</Td>
                <Td className="font-mono">{o.code || '-'}</Td>
                <Td>
                  <ActiveBadge on={o.active} no="Hidden" />
                </Td>
                <Td className="text-right">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(o)} aria-label={`Edit ${o.title}`}>
                    <EditIcon size={15} />
                  </button>
                  <button className="btn btn-ghost btn-sm !text-chili" onClick={() => setDeleting(o)} aria-label={`Delete ${o.title}`}>
                    <TrashIcon size={15} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {editing && <OfferForm offer={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {deleting && <ConfirmModal title="Delete offer?" message={`"${deleting.title}" will be removed from the home page.`} confirmLabel="Delete" danger busy={busy} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </section>
  );
}

export default function AdminDiscounts() {
  useTitle('Offers and discount codes');
  return (
    <>
      <PageHeader title="Offers & discount codes" text="Codes work at checkout. Offers are the banners on the home page." />
      <Discounts />
      <Offers />
    </>
  );
}
