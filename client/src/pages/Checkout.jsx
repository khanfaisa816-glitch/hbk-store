import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { money, shippingFor } from '../lib/format';
import { useTitle } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Field } from '../components/ui';
import { WalletIcon, CartIcon } from '../components/Icons';

// 4242 4242 4242 4242 -> groups of four
const formatCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
// 1226 -> 12/26
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function Checkout() {
  useTitle('Checkout');
  const { user } = useAuth();
  const cart = useCart();
  const { store } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const placed = useRef(false);

  const [ship, setShip] = useState({ name: user.name, phone: user.phone || '', address: user.address || '', city: user.city || '' });
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState('cod');
  const [card, setCard] = useState({ holder: '', number: '', expiry: '', cvv: '' });
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (cart.items.length === 0 && !placed.current) return <Navigate to="/cart" replace />;

  const shipping = shippingFor(cart.subtotal, store);
  const discountAmount = discount ? discount.amount : 0;
  const total = cart.subtotal - discountAmount + shipping;

  const applyCode = async () => {
    setCodeError('');
    try {
      const d = await api.post('/discounts/validate', { code, subtotal: cart.subtotal });
      setDiscount(d.discount);
      toast.success(`Code ${d.discount.code} applied`);
    } catch (e) {
      setDiscount(null);
      setCodeError(e.fieldErrors.code || e.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const { order } = await api.post('/orders', {
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shipping: ship,
        notes,
        paymentMethod: method,
        ...(method === 'card' ? { card } : {}),
        ...(discount ? { discountCode: discount.code } : {}),
      });
      placed.current = true;
      cart.clear();
      navigate(`/orders/${order.id}`, { replace: true, state: { placed: true } });
    } catch (err) {
      setErrors(err.fieldErrors);
      toast.error(Object.keys(err.fieldErrors).length ? 'Please fix the highlighted fields.' : err.message);
      if (err.status === 409 || err.status === 400) cart.sync(); // stock or price changed
    } finally {
      setBusy(false);
    }
  };

  const setS = (k) => (e) => setShip((s) => ({ ...s, [k]: e.target.value }));
  const setC = (k, fmt = (v) => v) => (e) => setCard((c) => ({ ...c, [k]: fmt(e.target.value) }));
  const option = (value, active) =>
    `flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${active ? 'border-brand-600 bg-brand-50' : 'border-line bg-white'}`;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

      <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-4 text-xl font-bold">Delivery address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors['shipping.name']}>
                <input className="input" value={ship.name} onChange={setS('name')} autoComplete="name" />
              </Field>
              <Field label="Phone" error={errors['shipping.phone']}>
                <input className="input" value={ship.phone} onChange={setS('phone')} autoComplete="tel" inputMode="tel" placeholder="0300 1234567" />
              </Field>
              <Field label="Address" error={errors['shipping.address']} className="sm:col-span-2">
                <input className="input" value={ship.address} onChange={setS('address')} autoComplete="street-address" placeholder="House, street, area" />
              </Field>
              <Field label="City" error={errors['shipping.city']}>
                <input className="input" value={ship.city} onChange={setS('city')} autoComplete="address-level2" />
              </Field>
              <Field label="Delivery note (optional)" error={errors.notes}>
                <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call before arriving" maxLength={300} />
              </Field>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-4 text-xl font-bold">Payment</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              <label className={option('cod', method === 'cod')}>
                <input type="radio" name="pay" checked={method === 'cod'} onChange={() => setMethod('cod')} className="accent-brand-600" />
                <span>
                  <span className="block font-semibold">Cash on delivery</span>
                  <span className="text-[13px] text-ink-soft">Pay when your order arrives</span>
                </span>
              </label>
              <label className={option('card', method === 'card')}>
                <input type="radio" name="pay" checked={method === 'card'} onChange={() => setMethod('card')} className="accent-brand-600" />
                <span>
                  <span className="block font-semibold">Card</span>
                  <span className="text-[13px] text-ink-soft">Demo only, no real charge</span>
                </span>
              </label>
            </div>

            {method === 'card' && (
              <div className="mt-4 space-y-4">
                <p className="rounded bg-[#fff9e0] p-3 text-sm">
                  <WalletIcon size={15} className="mr-1 inline" /> This is a demo. Use the test card <strong className="font-mono">4242 4242 4242 4242</strong>, any future date, any 3 digit CVV.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name on card" error={errors['card.holder']} className="sm:col-span-2">
                    <input className="input" value={card.holder} onChange={setC('holder')} autoComplete="cc-name" />
                  </Field>
                  <Field label="Card number" error={errors['card.number']} className="sm:col-span-2">
                    <input className="input font-mono" value={card.number} onChange={setC('number', formatCard)} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" />
                  </Field>
                  <Field label="Expiry (MM/YY)" error={errors['card.expiry']}>
                    <input className="input font-mono" value={card.expiry} onChange={setC('expiry', formatExpiry)} inputMode="numeric" autoComplete="cc-exp" placeholder="12/30" />
                  </Field>
                  <Field label="CVV" error={errors['card.cvv']}>
                    <input className="input font-mono" value={card.cvv} onChange={setC('cvv', (v) => v.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="123" type="password" />
                  </Field>
                </div>
              </div>
            )}
            {errors.card && <p className="field-error">{errors.card}</p>}
          </section>
        </div>

        <aside className="panel h-fit space-y-4 p-5 lg:sticky lg:top-32" aria-label="Order summary">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CartIcon size={20} /> Order summary
          </h2>
          <ul className="max-h-60 space-y-2 overflow-y-auto text-sm">
            {cart.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {i.quantity} x {i.name}
                </span>
                <span className="shrink-0 font-medium">{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-line pt-4">
            <label htmlFor="code" className="label">
              Discount code
            </label>
            <div className="flex gap-2">
              <input id="code" className="input font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" />
              <button type="button" className="btn btn-outline" onClick={applyCode} disabled={!code.trim()}>
                Apply
              </button>
            </div>
            {codeError && <p className="field-error">{codeError}</p>}
            {discount && (
              <p className="mt-1 text-[13px] font-medium text-brand-600">
                {discount.code} applied.{' '}
                <button type="button" className="underline" onClick={() => { setDiscount(null); setCode(''); }}>
                  Remove
                </button>
              </p>
            )}
          </div>

          <div className="space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>{money(cart.subtotal)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-brand-600"><span>Discount</span><span>- {money(discountAmount)}</span></div>}
            <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><span>{shipping === 0 ? 'Free' : money(shipping)}</span></div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-xl font-bold"><span>Total</span><span>{money(total)}</span></div>
          </div>

          <button className="btn btn-primary w-full !py-3" disabled={busy}>
            {busy ? 'Placing order...' : method === 'cod' ? 'Place order' : `Pay ${money(total)}`}
          </button>
          <Link to="/cart" className="btn btn-ghost w-full">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
