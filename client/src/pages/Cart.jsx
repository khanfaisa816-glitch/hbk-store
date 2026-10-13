import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { money, shippingFor } from '../lib/format';
import { useTitle } from '../lib/hooks';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import ProductImage from '../components/ProductImage';
import { EmptyState } from '../components/ui';
import { MinusIcon, PlusIcon, TrashIcon } from '../components/Icons';

export default function Cart() {
  useTitle('Your cart');
  const cart = useCart();
  const { store } = useStore();
  const [notes, setNotes] = useState([]);

  // Refresh prices and stock when the page opens
  useEffect(() => {
    if (cart.items.length) cart.sync().then(setNotes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-12">
        {notes.length > 0 && <Notes notes={notes} />}
        <EmptyState icon="🛒" title="Your cart is empty" text="Add a few things and they will show up here." action={{ label: 'Start shopping', to: '/products' }} />
      </div>
    );
  }

  const shipping = shippingFor(cart.subtotal, store);
  const toFree = store.freeShippingMin - cart.subtotal;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Your cart ({cart.count})</h1>
      {notes.length > 0 && <Notes notes={notes} />}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-3">
          {cart.items.map((item) => (
            <li key={item.productId} className="panel flex gap-4 p-3 sm:p-4">
              <Link to={`/products/${item.slug}`} className="shrink-0" aria-label={item.name}>
                <ProductImage product={item} className="h-24 w-24 rounded-md sm:h-28 sm:w-28" emojiClass="text-5xl" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/products/${item.slug}`} className="font-semibold hover:text-brand-600">
                  {item.name}
                </Link>
                <p className="text-sm text-ink-soft">{money(item.price)} each</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center rounded-md border border-line">
                    <button onClick={() => cart.setQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label={`Decrease quantity of ${item.name}`} className="grid h-9 w-9 place-items-center disabled:opacity-40">
                      <MinusIcon size={15} />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => cart.setQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= Math.min(item.stock, 20)} aria-label={`Increase quantity of ${item.name}`} className="grid h-9 w-9 place-items-center disabled:opacity-40">
                      <PlusIcon size={15} />
                    </button>
                  </div>
                  <span className="font-display text-lg font-bold">{money(item.price * item.quantity)}</span>
                  <button onClick={() => cart.remove(item.productId)} className="btn btn-ghost btn-sm !text-chili" aria-label={`Remove ${item.name}`}>
                    <TrashIcon size={15} /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="panel h-fit space-y-3 p-5 lg:sticky lg:top-32" aria-label="Order summary">
          <h2 className="text-xl font-bold">Summary</h2>
          <Row label="Subtotal" value={money(cart.subtotal)} />
          <Row label="Delivery" value={shipping === 0 ? 'Free' : money(shipping)} />
          {toFree > 0 && <p className="rounded bg-brand-50 p-2 text-[13px] text-brand-800">Add {money(toFree)} more for free delivery.</p>}
          <div className="border-t border-line pt-3">
            <Row label="Total" value={money(cart.subtotal + shipping)} bold />
            <p className="mt-1 text-xs text-ink-soft">Discount codes can be added at checkout.</p>
          </div>
          <Link to="/checkout" className="btn btn-primary w-full !py-3">
            Go to checkout
          </Link>
          <Link to="/products" className="btn btn-ghost w-full">
            Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

const Row = ({ label, value, bold }) => (
  <div className={`flex justify-between gap-4 ${bold ? 'font-display text-xl font-bold' : 'text-sm'}`}>
    <span className={bold ? '' : 'text-ink-soft'}>{label}</span>
    <span>{value}</span>
  </div>
);

const Notes = ({ notes }) => (
  <div className="mb-4 rounded-lg border border-tag-dark bg-[#fff9e0] p-4 text-sm" role="status">
    {notes.map((n) => (
      <p key={n}>{n}</p>
    ))}
  </div>
);
