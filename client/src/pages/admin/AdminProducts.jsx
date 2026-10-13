import { useState } from 'react';
import { adminApi } from '../../lib/api';
import { money } from '../../lib/format';
import { useAsync, useDebounced, useTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import Modal, { ConfirmModal } from '../../components/Modal';
import ProductImage from '../../components/ProductImage';
import { EmptyState, ErrorBox, Field, PageSpinner, Pagination } from '../../components/ui';
import { ActiveBadge, CheckField, PageHeader, TableWrap, Td, Th } from '../../components/admin';
import { EditIcon, PlusIcon, TrashIcon } from '../../components/Icons';

const BLANK = { name: '', categoryId: '', price: '', oldPrice: '', stock: '', emoji: '', description: '', featured: false, active: true };

function ProductForm({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    product
      ? { name: product.name, categoryId: product.category.id, price: product.price, oldPrice: product.oldPrice ?? '', stock: product.stock, emoji: product.emoji || '', description: product.description, featured: product.featured, active: product.active }
      : { ...BLANK, categoryId: categories[0]?.id || '' }
  );
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const preview = file ? URL.createObjectURL(file) : removeImage ? null : product?.image;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    if (file) body.append('image', file);
    if (removeImage) body.append('removeImage', 'true');
    try {
      if (product) await adminApi.putForm(`/admin/products/${product.id}`, body);
      else await adminApi.postForm('/admin/products', body);
      toast.success(product ? 'Product updated' : 'Product added');
      onSaved();
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal
      title={product ? 'Edit product' : 'Add product'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" form="product-form" disabled={busy}>
            {busy ? 'Saving...' : 'Save product'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {errors.form && Object.keys(errors).length === 1 && <p className="field-error sm:col-span-2">{errors.form}</p>}
        <Field label="Name" error={errors.name} className="sm:col-span-2">
          <input className="input" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Category" error={errors.categoryId}>
          <select className="input" value={form.categoryId} onChange={set('categoryId')}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Emoji (shown when there is no photo)" error={errors.emoji}>
          <input className="input" value={form.emoji} onChange={set('emoji')} placeholder="📦" maxLength={8} />
        </Field>
        <Field label="Price (Rs)" error={errors.price}>
          <input type="number" min="0" className="input" value={form.price} onChange={set('price')} />
        </Field>
        <Field label="Old price (Rs, optional)" error={errors.oldPrice} hint="Fill in to show a sale badge.">
          <input type="number" min="0" className="input" value={form.oldPrice} onChange={set('oldPrice')} />
        </Field>
        <Field label="Stock" error={errors.stock}>
          <input type="number" min="0" className="input" value={form.stock} onChange={set('stock')} />
        </Field>
        <Field label="Photo (JPG, PNG or WebP, max 2 MB)" error={errors.image}>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="input" onChange={(e) => { setFile(e.target.files[0] || null); setRemoveImage(false); }} />
        </Field>
        {preview && (
          <div className="flex items-center gap-3 sm:col-span-2">
            <img src={preview} alt="Product preview" className="h-20 w-20 rounded-md object-cover" />
            {!file && product?.image && <CheckField label="Remove photo" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />}
          </div>
        )}
        <Field label="Description" error={errors.description} className="sm:col-span-2">
          <textarea rows={3} className="input" value={form.description} onChange={set('description')} maxLength={2000} />
        </Field>
        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <CheckField label="Featured on home page" checked={form.featured} onChange={set('featured')} />
          <CheckField label="Visible in the store" checked={form.active} onChange={set('active')} />
        </div>
      </form>
    </Modal>
  );
}

export default function AdminProducts() {
  useTitle('Manage products');
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const q = useDebounced(search);

  const cats = useAsync(() => adminApi.get('/admin/categories'), []);
  const { data, error, loading, reload } = useAsync(
    () => adminApi.get('/admin/products', { search: q, category, page, limit: 15, sort: 'newest' }),
    [q, category, page]
  );

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.del(`/admin/products/${deleting.id}`);
      toast.success('Product deleted');
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(e.message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        text={data ? `${data.total} products` : ''}
        action={
          <button className="btn btn-primary" onClick={() => setEditing('new')} disabled={!cats.data}>
            <PlusIcon size={16} /> Add product
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search products" aria-label="Search products" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="input !w-auto" aria-label="Filter by category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {cats.data?.categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading && !data ? (
        <PageSpinner />
      ) : data.items.length === 0 ? (
        <EmptyState icon="📦" title="No products found" />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <ProductImage product={p} className="h-10 w-10 shrink-0 rounded" emojiClass="text-xl" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </Td>
                  <Td>{p.category.name}</Td>
                  <Td className="text-right">{money(p.price)}</Td>
                  <Td className={`text-right font-semibold ${p.stock <= 10 ? 'text-chili' : ''}`}>{p.stock}</Td>
                  <Td>
                    <ActiveBadge on={p.active} />
                  </Td>
                  <Td className="text-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                      <EditIcon size={15} />
                    </button>
                    <button className="btn btn-ghost btn-sm !text-chili" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}>
                      <TrashIcon size={15} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}

      {editing && cats.data && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={cats.data.categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {deleting && (
        <ConfirmModal title="Delete product?" message={`"${deleting.name}" will be removed from the store. Old orders keep their copy of it.`} confirmLabel="Delete" danger busy={busy} onConfirm={remove} onClose={() => setDeleting(null)} />
      )}
    </>
  );
}
