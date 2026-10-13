export const money = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

// "35% off" badge value
export const percentOff = (price, oldPrice) =>
  oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

// Same rules as the server: Rs 3,000+ ships free
export const shippingFor = (subtotal, store) =>
  subtotal >= store.freeShippingMin ? 0 : store.shippingFee;

// Each category has its own soft colour, used for product images and category tiles.
export const CATEGORY_TINT = {
  groceries: '#e3efd2',
  electronics: '#d9e6f8',
  clothing: '#f8dde4',
  'home-kitchen': '#fbe8c8',
  'beauty-care': '#e9dcf4',
};
export const tintFor = (slug) => CATEGORY_TINT[slug] || '#e5e8e4';

export const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-900',
  Shipped: 'bg-sky-100 text-sky-900',
  Delivered: 'bg-brand-100 text-brand-800',
  Cancelled: 'bg-chili-50 text-chili',
};
