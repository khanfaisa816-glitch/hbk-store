import { useState } from 'react';
import { adminApi } from '../../lib/api';
import { fmtDate, fmtDateTime, money } from '../../lib/format';
import { useAsync, useDebounced, useTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { EmptyState, ErrorBox, PageSpinner, Pagination, StatusBadge } from '../../components/ui';
import { PageHeader, TableWrap, Td, Th } from '../../components/admin';
import { Tracker } from '../OrderDetail';

const STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
// Same rules as the server
const NEXT = { Pending: ['Shipped', 'Cancelled'], Shipped: ['Delivered', 'Cancelled'], Delivered: [], Cancelled: [] };

function OrderModal({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => adminApi.get(`/admin/orders/${id}`), [id]);
  const [busy, setBusy] = useState(false);

  const move = async (status) => {
    setBusy(true);
    try {
      await adminApi.put(`/admin/orders/${id}/status`, { status });
      toast.success(`Order #${id} is now ${status}`);
      reload();
      onChanged();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const o = data?.order;
  return (
    <Modal title={`Order #${id}`} size="lg" onClose={onClose}>
      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <StatusBadge status={o.status} /> <span className="ml-2 text-sm text-ink-soft">{fmtDateTime(o.createdAt)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {NEXT[o.status].length === 0 && <span className="text-sm text-ink-soft">This order is final.</span>}
              {NEXT[o.status].map((s) => (
                <button key={s} disabled={busy} onClick={() => move(s)} className={`btn btn-sm ${s === 'Cancelled' ? 'btn-outline !text-chili' : 'btn-primary'}`}>
                  Mark as {s}
                </button>
              ))}
            </div>
          </div>

          <Tracker order={o} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="text-sm">
              <h3 className="mb-1 font-display font-bold">Customer</h3>
              <p>{o.customer?.name || 'Deleted account'}</p>
              <p className="text-ink-soft">{o.customer?.email}</p>
              <h3 className="mb-1 mt-4 font-display font-bold">Deliver to</h3>
              <p>{o.shipping.name}, {o.shipping.phone}</p>
              <p className="text-ink-soft">{o.shipping.address}, {o.shipping.city}</p>
              {o.notes && <p className="mt-1 text-ink-soft">Note: {o.notes}</p>}
              <h3 className="mb-1 mt-4 font-display font-bold">Payment</h3>
              <p>{o.paymentMethod === 'cod' ? 'Cash on delivery' : `Card ending ${o.cardLast4}`} ({o.paymentStatus})</p>
            </div>
            <div className="text-sm">
              <h3 className="mb-1 font-display font-bold">Items</h3>
              <ul className="space-y-1">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>{i.quantity} x {i.name}</span>
                    <span>{money(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-line pt-2">
                <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>{money(o.subtotal)}</span></div>
                {o.discountAmount > 0 && <div className="flex justify-between"><span className="text-ink-soft">Discount ({o.discountCode})</span><span>- {money(o.discountAmount)}</span></div>}
                <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><span>{money(o.shippingFee)}</span></div>
                <div className="flex justify-between font-display text-base font-bold"><span>Total</span><span>{money(o.total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminOrders() {
  useTitle('Manage orders');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const q = useDebounced(search);

  const { data, error, loading, reload } = useAsync(() => adminApi.get('/admin/orders', { status, search: q, page, limit: 15 }), [status, q, page]);

  const tab = (s) => `btn btn-sm ${status === s ? 'btn-primary' : 'btn-outline'}`;

  return (
    <>
      <PageHeader title="Orders" text="Open an order to change its status." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className={tab('')} onClick={() => { setStatus(''); setPage(1); }}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} className={tab(s)} onClick={() => { setStatus(s); setPage(1); }}>
            {s}
            {data && ` (${data.counts[s] || 0})`}
          </button>
        ))}
        <input className="input ml-auto max-w-[14rem]" placeholder="Search name or #id" aria-label="Search orders" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading && !data ? (
        <PageSpinner />
      ) : data.items.length === 0 ? (
        <EmptyState icon="📭" title="No orders found" />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-paper" onClick={() => setOpenId(o.id)}>
                  <Td>
                    <button className="font-semibold text-brand-600 underline-offset-2 hover:underline" onClick={(e) => { e.stopPropagation(); setOpenId(o.id); }}>
                      #{o.id}
                    </button>
                  </Td>
                  <Td>
                    {o.customer?.name || o.shipping.name}
                    <span className="block text-xs text-ink-soft">{o.itemCount} items</span>
                  </Td>
                  <Td>{fmtDate(o.createdAt)}</Td>
                  <Td className="capitalize">{o.paymentMethod === 'cod' ? 'COD' : 'Card'} - {o.paymentStatus}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td className="text-right font-medium">{money(o.total)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}

      {openId && <OrderModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </>
  );
}
