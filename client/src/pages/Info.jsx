import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTitle } from '../lib/hooks';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { EmptyState, Field } from '../components/ui';
import { ClockIcon, MailIcon, PhoneIcon, PinIcon } from '../components/Icons';

const Page = ({ title, intro, children, narrow }) => (
  <div className={`container-page py-10 ${narrow ? 'max-w-3xl' : ''}`}>
    <h1 className="text-4xl font-bold">{title}</h1>
    {intro && <p className="mt-2 max-w-2xl text-lg text-ink-soft">{intro}</p>}
    <div className="mt-8">{children}</div>
  </div>
);

export function About() {
  useTitle('About us');
  const { store } = useStore();
  const values = [
    ['Fair prices', 'We keep margins small so everyday items stay affordable for every family.'],
    ['Fresh and genuine', 'Groceries are restocked daily and every electronic item comes with a warranty.'],
    ['Local and personal', 'We are a neighbourhood store first. Call us, visit us, or message us on WhatsApp.'],
  ];
  return (
    <Page title="About HBK" intro={`${store.tagline}. HBK started as a small shop and grew into a store for groceries, electronics, clothing, home and beauty.`}>
      <div className="grid gap-4 md:grid-cols-3">
        {values.map(([t, d]) => (
          <div key={t} className="panel p-5">
            <h2 className="text-xl font-bold">{t}</h2>
            <p className="mt-2 text-ink-soft">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-lg bg-brand-50 p-6">
        <h2 className="text-xl font-bold">Our story</h2>
        <p className="mt-2 max-w-3xl text-ink-soft">
          This is a demo store with made-up data, built to show how a real shop can sell online: browse products, pay by card or cash on delivery, and follow an order until it arrives. Every name, price, review and address on this site is fake.
        </p>
        <Link to="/products" className="btn btn-primary mt-4">
          Browse the store
        </Link>
      </div>
    </Page>
  );
}

export function Contact() {
  useTitle('Contact us');
  const { store } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api.post('/contact', form);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setErrors(err.fieldErrors);
      toast.error(Object.keys(err.fieldErrors).length ? 'Please fix the highlighted fields.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Contact us" intro="Questions about an order or a product? Send us a message and we will reply within one working day.">
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {sent ? (
          <div className="panel p-6" role="status">
            <h2 className="text-xl font-bold text-brand-600">Message sent. Thank you!</h2>
            <p className="mt-2 text-ink-soft">We will reply to your email soon.</p>
            <button className="btn btn-outline mt-4" onClick={() => setSent(false)}>
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="panel space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" error={errors.name}>
                <input className="input" value={form.name} onChange={set('name')} autoComplete="name" />
              </Field>
              <Field label="Email" error={errors.email}>
                <input type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" />
              </Field>
            </div>
            <Field label="Subject (optional)" error={errors.subject}>
              <input className="input" value={form.subject} onChange={set('subject')} />
            </Field>
            <Field label="Message" error={errors.message}>
              <textarea rows={5} className="input" value={form.message} onChange={set('message')} maxLength={2000} />
            </Field>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}

        <div className="space-y-4 text-sm">
          {[
            [PhoneIcon, 'Phone', store.phone],
            [MailIcon, 'Email', store.email],
            [PinIcon, 'Address', `${store.address}, ${store.city}`],
          ].map(([Icon, label, value]) => (
            <div key={label} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-ink-soft">{value}</p>
              </div>
            </div>
          ))}
          {store.whatsapp && (
            <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} className="btn btn-outline" target="_blank" rel="noreferrer">
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </Page>
  );
}

export function Location() {
  useTitle('Store location');
  const { store } = useStore();
  return (
    <Page title="Visit our store" intro="Come and see the products in person. Parking is available outside.">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          {store.mapQuery ? (
            <iframe
              title={`Map showing ${store.name} at ${store.address}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(store.mapQuery)}&output=embed`}
              className="h-[360px] w-full md:h-[440px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="grid h-[360px] place-items-center text-ink-soft">Map not available</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
              <PinIcon size={18} /> Address
            </h2>
            <p className="text-ink-soft">
              {store.address}
              <br />
              {store.city}
            </p>
            <p className="mt-2 text-sm">{store.phone}</p>
          </div>
          <div className="panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <ClockIcon size={18} /> Opening hours
            </h2>
            <ul className="space-y-1.5 text-sm">
              {store.hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-4">
                  <span className="font-medium">{h.day}</span>
                  <span className="text-ink-soft">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Page>
  );
}

const FAQS = [
  ['How do I place an order?', 'Add items to your cart, go to checkout, enter your delivery address and choose how to pay. You need a free account to check out.'],
  ['What payment methods do you accept?', 'Cash on delivery and card. Card payment in this demo store is fake: no real money is taken.'],
  ['How much is delivery?', 'Delivery is Rs 250. It is free when your items add up to Rs 3,000 or more.'],
  ['How long does delivery take?', 'Orders in the city usually arrive in 1 to 2 working days. You can follow the progress under "My orders".'],
  ['Can I cancel my order?', 'Yes, while the order is still "Pending". Open the order and press "Cancel order". After it is shipped, please contact us.'],
  ['How do discount codes work?', 'Enter the code at checkout and press Apply. Some codes need a minimum order or expire on a date.'],
  ['Can I return something?', 'If an item is damaged or wrong, contact us within 7 days with your order number and we will replace it or refund you.'],
  ['Can I visit the store?', 'Of course. See the Visit the store page for our address, map and opening hours.'],
];

export function Faq() {
  useTitle('FAQ');
  return (
    <Page narrow title="Questions and answers" intro="Short answers to the things people ask us most.">
      <div className="space-y-2">
        {FAQS.map(([q, a]) => (
          <details key={q} className="panel group p-4 open:border-brand-500">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {q}
              <span className="text-xl text-brand-600 transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-3 text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        Still stuck?{' '}
        <Link to="/contact" className="link">
          Send us a message
        </Link>
        .
      </p>
    </Page>
  );
}

export function NotFound() {
  useTitle('Page not found');
  return (
    <div className="container-page py-16">
      <EmptyState icon="🧭" title="Page not found" text="The page you are looking for does not exist or was moved." action={{ label: 'Back to home', to: '/' }} />
    </div>
  );
}
