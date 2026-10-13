import { useTitle } from '../lib/hooks';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { EmptyState } from '../components/ui';

export default function Wishlist() {
  useTitle('Wishlist');
  const { items } = useWishlist();

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">My wishlist</h1>
      {items.length === 0 ? (
        <EmptyState icon="💚" title="Nothing saved yet" text="Tap the heart on any product to save it for later." action={{ label: 'Browse products', to: '/products' }} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
