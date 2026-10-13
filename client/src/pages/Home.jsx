import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { tintFor } from '../lib/format';
import { useAsync, useTitle } from '../lib/hooks';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { ErrorBox } from '../components/ui';
import { CopyIcon, TruckIcon, WalletIcon, StoreIcon, PackageIcon } from '../components/Icons';

// Three price tags hanging from a string (they swing once on load)
const TAGS = [
  { label: 'Fresh groceries', price: 'from Rs 80', r: '-5deg', d: '0s', bg: 'bg-white' },
  { label: 'Phones & gadgets', price: 'up to 20% off', r: '3deg', d: '0.15s', bg: 'bg-tag' },
  { label: 'Winter clothing', price: 'from Rs 1,500', r: '-2deg', d: '0.3s', bg: 'bg-white' },
];

function Hero({ store }) {
  return (
    <section className="overflow-hidden bg-brand-600 text-white">
      <div className="container-page grid items-center gap-10 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
        <div>
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">Now open online</p>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl lg:text-6xl">{store.tagline || 'Everything you need, under one roof'}</h1>
          <p className="mt-4 max-w-lg text-lg text-white/85">
            Groceries, electronics, clothing, home and beauty products from one store. Order online and pay by card or cash on delivery.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/products" className="btn btn-tag !px-6 !py-3 text-base">
              Start shopping
            </Link>
            <Link to="/location" className="btn !px-6 !py-3 text-base text-white ring-1 ring-inset ring-white/40 hover:bg-white/10">
              Visit the store
            </Link>
          </div>
        </div>

        <div className="relative mx-auto hidden h-60 w-full max-w-sm md:block" aria-hidden="true">
          <div className="absolute inset-x-0 top-3 h-0.5 bg-white/50" />
          <div className="flex justify-around">
            {TAGS.map((t) => (
              <div key={t.label} className="tag-hang flex flex-col items-center" style={{ '--r': t.r, '--d': t.d }}>
                <div className="h-8 w-px bg-white/60" />
                <div className={`price-tag ${t.bg} w-24 px-2 pb-4 pt-5 text-center text-ink`}>
                  <p className="font-display text-sm font-bold leading-tight">{t.label}</p>
                  <p className="mt-2 text-xs font-semibold text-chili">{t.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Perks({ store }) {
  const perks = [
    { icon: TruckIcon, title: 'Free delivery', text: `On orders above Rs ${store.freeShippingMin.toLocaleString('en-PK')}` },
    { icon: WalletIcon, title: 'Pay your way', text: 'Cash on delivery or card' },
    { icon: PackageIcon, title: 'Easy tracking', text: 'Follow your order step by step' },
    { icon: StoreIcon, title: 'Visit us', text: 'Open 7 days at our store' },
  ];
  return (
    <section className="border-b border-line bg-white">
      <div className="container-page grid grid-cols-2 gap-4 py-5 lg:grid-cols-4">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="text-[13px] leading-snug text-ink-soft">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Offers({ offers }) {
  const toast = useToast();
  if (!offers.length) return null;

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Code ${code} copied. Use it at checkout.`);
    } catch {
      toast.error(`Your code is ${code}`);
    }
  };

  return (
    <section className="container-page mt-12">
      <h2 className="mb-4 text-2xl font-bold">Offers for you</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {offers.slice(0, 3).map((o) => (
          <div key={o.id} className="flex flex-col rounded-lg border-2 border-dashed border-tag-dark bg-[#fff9e0] p-5">
            {o.badge && <span className="mb-2 w-fit rounded bg-chili px-2 py-0.5 text-xs font-bold uppercase text-white">{o.badge}</span>}
            <h3 className="text-xl font-bold">{o.title}</h3>
            <p className="mt-1 flex-1 text-sm text-ink-soft">{o.subtitle}</p>
            {o.code && (
              <button onClick={() => copy(o.code)} className="btn btn-outline mt-4 w-fit !border-dashed font-mono tracking-wider" aria-label={`Copy code ${o.code}`}>
                {o.code}
                <CopyIcon size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductRow({ title, link, state }) {
  return (
    <section className="container-page mt-12">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link to={link} className="link text-sm">
          See all
        </Link>
      </div>
      {state.error ? (
        <ErrorBox error={state.error} onRetry={state.reload} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {state.loading
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : state.data.items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  useTitle('');
  const { store, offers, categories } = useStore();
  const featured = useAsync(() => api.get('/products', { featured: 'true', limit: 8, sort: 'popular' }), []);
  const newest = useAsync(() => api.get('/products', { limit: 4, sort: 'newest' }), []);

  return (
    <>
      <Hero store={store} />
      <Perks store={store} />

      <section className="container-page mt-12">
        <h2 className="mb-4 text-2xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              className="group rounded-lg p-4 transition-transform hover:-translate-y-0.5"
              style={{ background: tintFor(c.slug) }}
            >
              <span className="text-4xl" aria-hidden="true">
                {c.emoji}
              </span>
              <h3 className="mt-3 text-base font-bold group-hover:underline">{c.name}</h3>
              <p className="text-[13px] text-ink-soft">{c.productCount} products</p>
            </Link>
          ))}
        </div>
      </section>

      <Offers offers={offers} />
      <ProductRow title="Popular right now" link="/products?sort=popular" state={featured} />
      <ProductRow title="Just arrived" link="/products?sort=newest" state={newest} />
    </>
  );
}
