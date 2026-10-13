import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { money, percentOff } from '../lib/format';
import ProductImage from './ProductImage';
import { Stars } from './Stars';
import { HeartIcon } from './Icons';

const LOW_STOCK = 10;

export default function ProductCard({ product }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();

  const off = percentOff(product.price, product.oldPrice);
  const out = product.stock <= 0;
  const low = !out && product.stock <= LOW_STOCK;
  const wished = wishlist.has(product.id);
  const url = `/products/${product.slug}`;

  const addToCart = () => {
    if (cart.add(product, 1)) toast.success(`${product.name} added to cart`);
  };

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-ink/40">
      <Link to={url} className="relative block" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} className="aspect-square w-full" emojiClass="text-6xl sm:text-7xl" />
        {out && <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1 text-center text-xs font-semibold text-white">Out of stock</span>}
      </Link>
      {off > 0 && <span className="absolute left-2 top-2 rounded bg-chili px-1.5 py-0.5 text-xs font-bold text-white">{off}% off</span>}
      <button
        onClick={() => wishlist.toggle(product)}
        aria-pressed={wished}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 transition-colors hover:bg-white ${wished ? 'text-chili' : 'text-ink-soft hover:text-chili'}`}
      >
        <HeartIcon size={17} filled={wished} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-xs text-ink-soft">{product.category.name}</p>
        <Link to={url} className="line-clamp-2 min-h-[2.7em] text-[15px] font-semibold leading-snug hover:text-brand-600">
          {product.name}
        </Link>
        <Stars value={product.ratingAvg} count={product.ratingCount} />
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <span className="font-display text-lg font-bold">{money(product.price)}</span>
          {product.oldPrice && <span className="text-sm text-ink-soft line-through">{money(product.oldPrice)}</span>}
        </div>
        {low && <p className="text-xs font-semibold text-chili">Only {product.stock} left</p>}
        <button className="btn btn-primary mt-1.5 w-full" disabled={out} onClick={addToCart}>
          {out ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}

// Grey placeholder shown while products load
export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-line bg-white" aria-hidden="true">
    <div className="aspect-square bg-black/[0.06]" />
    <div className="space-y-2 p-3">
      <div className="h-3 w-1/3 rounded bg-black/[0.06]" />
      <div className="h-4 w-4/5 rounded bg-black/[0.06]" />
      <div className="h-4 w-1/2 rounded bg-black/[0.06]" />
      <div className="h-9 rounded bg-black/[0.06]" />
    </div>
  </div>
);
