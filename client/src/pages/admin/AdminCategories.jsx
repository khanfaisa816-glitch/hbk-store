import { useState } from 'react';
import { adminApi } from '../../lib/api';
import { useAsync, useTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import Modal, { ConfirmModal } from '../../components/Modal';
import { ErrorBox, Field, PageSpinner } from '../../components/ui';
import { PageHeader, TableWrap, Td, Th } from '../../components/admin';
import { EditIcon, PlusIcon, TrashIcon } from '../../components/Icons';

function CategoryForm({ category, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: category?.name || '', emoji: category?.emoji || '', description: category?.description || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (category) await adminApi.put(`/admin/categories/${category.id}`, form);
      else await adminApi.post('/admin/categories', form);
      toast.success(category ? 'Category updated' : 'Category added');
      onSaved();
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal
      title={category ? 'Edit category' : 'Add category'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" form="category-form" disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} noValidate className="space-y-4">
        {errors.form && !errors.name && <p className="field-error">{errors.form}</p>}
        <Field label="Name" error={errors.name}>
          <input className="input" value={form.name} onChange={set('name')} autoFocus />
        </Field>
        <Field label="Emoji" error={errors.emoji}>
          <input className="input" value={form.emoji} onChange={set('emoji')} placeholder="🛍️" maxLength={8} />
        </Field>
        <Field label="Description" error={errors.description}>
          <textarea rows={2} className="input" value={form.description} onChange={set('description')} maxLength={300} />
        </Field>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  useTitle('Manage categories');
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => adminApi.get('/admin/categories'), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.del(`/admin/categories/${deleting.id}`);
      toast.success('Category deleted');
      reload();
    } catch (e) {
      toast.error(e.message); // e.g. the category still has products
    } finally {
      setDeleting(null);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Categories" action={<button className="btn btn-primary" onClick={() => setEditing('new')}><PlusIcon size={16} /> Add category</button>} />
      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading ? (
        <PageSpinner />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Category</Th>
              <Th>Description</Th>
              <Th className="text-right">Products</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">
                  <span aria-hidden="true">{c.emoji}</span> {c.name}
                </Td>
                <Td className="text-ink-soft">{c.description}</Td>
                <Td className="text-right">{c.productCount}</Td>
                <Td className="text-right">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                    <EditIcon size={15} />
                  </button>
                  <button className="btn btn-ghost btn-sm !text-chili" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`}>
                    <TrashIcon size={15} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {editing && (
        <CategoryForm
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {deleting && <ConfirmModal title="Delete category?" message={`"${deleting.name}" will be deleted. This only works when it has no products.`} confirmLabel="Delete" danger busy={busy} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </>
  );
}
