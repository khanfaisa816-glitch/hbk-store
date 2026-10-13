import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtDate, money, percentOff } from '../lib/format';
import { useAsync, useTitle } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
import { Stars, StarInput } from '../components/Stars';
import { ErrorBox, EmptyState, Field, PageSpinner } from '../components/ui';
import { HeartIcon, MinusIcon, PlusIcon, TruckIcon } from '../components/Icons';

function ReviewForm({ slug, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setErrors({ rating: 'Choose a star rating' });
    setBusy(true);
    setErrors({});
    try {
      await api.post(`/products/${slug}/reviews`, { rating, comment });
      toast.success('Thanks for your review!');
      setComment('');
      onDone();
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel space-y-3 p-4" noValidate>
      <h3 className="text-lg font-bold">Write a review</h3>
      <div>
        <StarInput value={rating} onChange={setRating} />
        {errors.rating && <p className="field-error">{errors.rating}</p>}
      </div>
      <Field label="Your review" error={errors.comment}>
        <textarea rows={3} className="input" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} placeholder="What did you like or dislike?" />
      </Field>
      {errors.form && !errors.comment && <p className="field-error">{errors.form}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Sending...' : 'Submit review'}
      </button>
    </form>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const [qty, setQty] = useState(1);

  const { data, error, loading, reload } = useAsync(() => api.get(`/products/${slug}`), [slug]);
  const product = data?.product;
  useTitle(product?.name);

  const related = useAsync(
    () => (product ? api.get('/products', { category: product.category.slug, limit: 5 }) : Promise.resolve(null)),
    [product?.id]
  );

  if (loading) return <PageSpinner />;
  if (error) {
    return (
      <div className="container-page py-12">
        {error.status === 404 ? (
          <EmptyState icon="🤷" title="Product not found" text="It may have been removed." action={{ label: 'Back to shop', to: '/products' }} />
        ) : (
          <ErrorBox error={error} onRetry={reload} />
        )}
      </div>
    );
  }

  const out = product.stock <= 0;
  const maxQty = Math.min(product.stock, 20);
  const off = percentOff(product.price, product.oldPrice);
  const wished = wishlist.has(product.id);
  const myReview = user && data.reviews.find((r) => r.userId === user.id);

  const addToCart = (goToCart) => {
    if (cart.add(product, qty)) {
      toast.success(`${product.name} added to cart`);
      if (goToCart) navigate('/cart');
    }
  };

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-soft">
        <Link to="/products" className="hover:text-ink">Shop</Link> /{' '}
        <Link to={`/products?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link> /{' '}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <ProductImage product={product} className="aspect-square w-full rounded-xl" emojiClass="text-[9rem]" />

        <div>
          <p className="text-sm font-semibold text-brand-600">{product.category.name}</p>
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <div className="mt-2">
            <Stars value={product.ratingAvg} count={product.ratingCount} size={17} />
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl font-bold">{money(product.price)}</span>
            {product.oldPrice && <span className="text-lg text-ink-soft line-through">{money(product.oldPrice)}</span>}
            {off > 0 && <span className="rounded bg-chili px-2 py-0.5 text-sm font-bold text-white">Save {off}%</span>}
          </div>

          <p className="mt-3 text-sm font-semibold">
            {out ? <span className="text-chili">Out of stock</span> : product.stock <= 10 ? <span className="text-chili">Only {product.stock} left</span> : <span className="text-brand-600">In stock ({product.stock} available)</span>}
          </p>

          <p className="mt-5 leading-relaxed text-ink-soft">{product.description}</p>

          {!out && (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center rounded-md border border-line bg-white">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="grid h-10 w-10 place-items-center disabled:opacity-40">
                  <MinusIcon size={16} />
                </button>
                <span className="w-10 text-center font-semibold" aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity" className="grid h-10 w-10 place-items-center disabled:opacity-40">
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn btn-primary !px-6 !py-3" disabled={out} onClick={() => addToCart(false)}>
              {out ? 'Out of stock' : 'Add to cart'}
            </button>
            <button className="btn btn-tag !px-6 !py-3" disabled={out} onClick={() => addToCart(true)}>
              Buy now
            </button>
            <button onClick={() => wishlist.toggle(product)} aria-pressed={wished} className={`btn btn-outline !py-3 ${wished ? '!text-chili' : ''}`}>
              <HeartIcon size={18} filled={wished} /> {wished ? 'Saved' : 'Wishlist'}
            </button>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
            <TruckIcon size={18} /> Free delivery on orders above Rs 3,000. Pay on delivery or by card.
          </p>
        </div>
      </div>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_380px]" aria-labelledby="reviews-title">
        <div>
          <h2 id="reviews-title" className="mb-4 text-2xl font-bold">
            Reviews ({data.reviews.length})
          </h2>
          {data.reviews.length === 0 ? (
            <p className="text-ink-soft">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            <ul className="space-y-3">
              {data.reviews.map((r) => (
                <li key={r.id} className="panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.userName}</span>
                      <Stars value={r.rating} />
                    </div>
                    <span className="text-xs text-ink-soft">{fmtDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {user ? (
            <>
              {myReview && <p className="mb-2 text-sm text-ink-soft">You already reviewed this product. Sending again will replace your review.</p>}
              <ReviewForm slug={product.slug} onDone={reload} />
            </>
          ) : (
            <div className="panel p-4 text-sm">
              <p className="font-semibold">Want to leave a review?</p>
              <Link to="/login" state={{ from: `/products/${product.slug}` }} className="link">
                Log in
              </Link>{' '}
              to share your experience.
            </div>
          )}
        </div>
      </section>

      {related.data && related.data.items.filter((p) => p.id !== product.id).length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-2xl font-bold">More from {product.category.name}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.data.items
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
