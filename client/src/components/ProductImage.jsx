import { tintFor } from '../lib/format';

// Shows the uploaded photo if there is one. Otherwise an emoji on the category colour,
// so the dummy store looks good without any image files.
export default function ProductImage({ product, className = '', emojiClass = 'text-6xl' }) {
  if (product.image) {
    return <img src={product.image} alt={product.name} loading="lazy" className={`object-cover ${className}`} />;
  }
  const slug = product.category?.slug || product.categorySlug;
  return (
    <div role="img" aria-label={product.name} className={`flex items-center justify-center ${className}`} style={{ background: tintFor(slug) }}>
      <span className={emojiClass} aria-hidden="true">
        {product.emoji || '📦'}
      </span>
    </div>
  );
}
