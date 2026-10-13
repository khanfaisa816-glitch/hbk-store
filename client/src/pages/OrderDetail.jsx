import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtDateTime, money } from '../lib/format';
import { useAsync, useTitle } from '../lib/hooks';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { EmptyState, ErrorBox, PageSpinner, StatusBadge } from '../components/ui';
import { CheckIcon } from '../components/Icons';

const STEPS = ['Pending', 'Shipped', 'Delivered'];
const STEP_TEXT = { Pending: 'Order placed', Shipped: 'On the way', Delivered: 'Delivered' };

// Order tracking: Pending -> Shipped -> Delivered (or Cancelled)
export function Tracker({ order }) {
  if (order.status === 'Cancelled') {
    return <div className="rounded-lg bg-chili-50 p-4 text-sm font-medium text-chili">This order was cancelled.</div>;
  }
  const reached = STEPS.indexOf(order.status);
  const time = (s) => order.events.filter((e) => e.status === s).at(-1)?.createdAt;

  return (
    <ol className="grid grid-cols-3" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i <= reached;
        return (
          <li key={s} className="relative flex flex-col items-center text-center" aria-current={i === reached ? 'step' : undefined}>
            {i > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full ${i <= reached ? 'bg-brand-600' : 'bg-line'}`} aria-hidden="true" />}
            <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${done ? 'bg-brand-600 text-white' : 'border-2 border-line bg-white text-ink-soft'}`}>
              {done ? <CheckIcon size={16} /> : i + 1}
            </span>
            <span className="mt-2 text-sm font-semibold">{STEP_TEXT[s]}</span>
            <span className="text-xs text-ink-soft">{done ? fmtDateTime(time(s)) : 'Waiting'}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useAsync(() => api.get(`/orders/${id}`), [id]);
  useTitle(`Order #${id}`);

  if (loading) return <PageSpinner />;
  if (error) {
    return (
      <div className="container-page max-w-3xl py-12">
        {error.status === 404 ? <EmptyState icon="🤷" title="Order not found" action={{ label: 'My orders', to: '/orders' }} /> : <ErrorBox error={error} onRetry={reload} />}
      </div>
    );
  }
  const o = data.order;

  const cancel = async () => {
    setBusy(true);
    try {
      await api.post(`/orders/${o.id}/cancel`);
      toast.success('Your order was cancelled.');
      setConfirm(false);
      reload();
    } catch (e) {
      toast.error(e.message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page max-w-3xl py-8">
      {location.state?.placed && (
        <div className="mb-6 rounded-lg bg-brand-50 p-5 text-brand-800" role="status">
          <h2 className="text-xl font-bold">Thank you! Your order is placed.</h2>
          <p className="mt-1 text-sm">
            {o.paymentMethod === 'cod' ? `Please keep ${money(o.total)} ready for the delivery person.` : 'Your card payment was received (demo).'} You can follow your order below.
          </p>
        </div>
      )}

      <Link to="/orders" className="link text-sm">
        &larr; All orders
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Order #{o.id}</h1>
        <StatusBadge status={o.status} />
      </div>

      <section className="panel mb-5 p-5">
        <Tracker order={o} />
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 text-lg font-bold">Items</h2>
          <ul className="space-y-2 text-sm">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>
                  {i.emoji} {i.quantity} x {i.name}
                </span>
                <span className="shrink-0 font-medium">{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
            {o.discountAmount > 0 && <div className="flex justify-between text-brand-600"><dt>Discount ({o.discountCode})</dt><dd>- {money(o.discountAmount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{o.shippingFee ? money(o.shippingFee) : 'Free'}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 font-display text-lg font-bold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
          </dl>
        </section>

        <section className="panel p-5 text-sm">
          <h2 className="mb-3 text-lg font-bold">Delivery and payment</h2>
          <p className="font-semibold">{o.shipping.name}</p>
          <p className="text-ink-soft">{o.shipping.phone}</p>
          <p className="text-ink-soft">{o.shipping.address}, {o.shipping.city}</p>
          {o.notes && <p className="mt-2 text-ink-soft">Note: {o.notes}</p>}
          <p className="mt-4">
            <span className="text-ink-soft">Payment: </span>
            {o.paymentMethod === 'cod' ? 'Cash on delivery' : `Card ending ${o.cardLast4}`} ({o.paymentStatus})
          </p>
          {o.status === 'Pending' && (
            <button className="btn btn-outline btn-sm mt-5 !text-chili" onClick={() => setConfirm(true)}>
              Cancel order
            </button>
          )}
        </section>
      </div>

      {confirm && (
        <ConfirmModal title="Cancel this order?" message="The items go back to stock. This cannot be undone." confirmLabel="Yes, cancel order" danger busy={busy} onConfirm={cancel} onClose={() => setConfirm(false)} />
      )}
    </div>
  );
}
