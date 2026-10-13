// All input rules in one place (zod schemas).
const { z } = require('zod');
const { luhnValid } = require('./utils/helpers');

const int = (min = 0, max = 100_000_000) => z.coerce.number().int().min(min).max(max);
const emptyToNull = (v) => (v === '' || v === undefined || v === null ? null : v);
const nullableInt = (min = 0) => z.preprocess(emptyToNull, z.coerce.number().int().min(min).nullable());
// Forms send booleans as the strings "true"/"false"
const bool = (def = false) =>
  z.preprocess((v) => (v === undefined ? def : v === true || v === 'true' || v === '1' || v === 1), z.boolean());

const email = z.string().trim().toLowerCase().email('Enter a valid email').max(120);
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');
const phone = z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number');
const optionalPhone = z.preprocess(emptyToNull, phone.nullable()).transform((v) => v ?? '');
const text = (min, max, label) =>
  z.string().trim().min(min, `${label} must be at least ${min} characters`).max(max, `${label} is too long`);

const schemas = {
  // ---- auth ----
  register: z.object({
    name: text(2, 60, 'Name'),
    email,
    password,
    phone: optionalPhone.optional(),
  }),
  login: z.object({ email, password: z.string().min(1, 'Password is required') }),
  profile: z.object({
    name: text(2, 60, 'Name'),
    phone: optionalPhone,
    address: z.string().trim().max(200).default(''),
    city: z.string().trim().max(60).default(''),
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: password,
  }),

  // ---- products ----
  productsQuery: z.object({
    search: z.string().trim().max(80).optional(),
    category: z.string().trim().max(80).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    featured: bool(false),
    inStock: bool(false),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
    page: int(1, 10000).default(1),
    limit: int(1, 100).default(12),
  }),
  product: z
    .object({
      name: text(2, 120, 'Name'),
      categoryId: int(1),
      description: z.string().trim().max(2000).default(''),
      price: int(0, 10_000_000),
      oldPrice: nullableInt(0),
      stock: int(0, 1_000_000),
      emoji: z.preprocess((v) => (v ? v : '📦'), z.string().trim().max(8)),
      featured: bool(false),
      active: bool(true),
    })
    .refine((d) => d.oldPrice == null || d.oldPrice > d.price, {
      message: 'Old price must be higher than the price',
      path: ['oldPrice'],
    }),
  review: z.object({
    rating: int(1, 5),
    comment: text(3, 500, 'Comment'),
  }),

  // ---- categories ----
  category: z.object({
    name: text(2, 60, 'Name'),
    description: z.string().trim().max(300).default(''),
    emoji: z.preprocess((v) => (v ? v : '🛍️'), z.string().trim().max(8)),
  }),

  // ---- orders ----
  createOrder: z
    .object({
      items: z
        .array(z.object({ productId: int(1), quantity: int(1, 20) }))
        .min(1, 'Your cart is empty')
        .max(50),
      shipping: z.object({
        name: text(2, 60, 'Name'),
        phone,
        address: text(5, 200, 'Address'),
        city: text(2, 60, 'City'),
      }),
      notes: z.string().trim().max(300).default(''),
      paymentMethod: z.enum(['cod', 'card']),
      card: z
        .object({
          holder: text(2, 60, 'Card holder'),
          number: z.string().transform((s) => s.replace(/[\s-]/g, '')),
          expiry: z.string().trim(),
          cvv: z.string().trim(),
        })
        .optional(),
      discountCode: z.string().trim().max(30).optional(),
    })
    .superRefine((d, ctx) => {
      if (d.paymentMethod !== 'card') return;
      if (!d.card) {
        ctx.addIssue({ code: 'custom', path: ['card'], message: 'Card details are required' });
        return;
      }
      if (!/^\d{13,19}$/.test(d.card.number) || !luhnValid(d.card.number)) {
        ctx.addIssue({ code: 'custom', path: ['card', 'number'], message: 'Card number is not valid' });
      }
      const m = /^(\d{2})\/(\d{2})$/.exec(d.card.expiry);
      const now = new Date();
      const month = m ? Number(m[1]) : 0;
      const year = m ? 2000 + Number(m[2]) : 0;
      const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
      if (!m || month < 1 || month > 12 || expired) {
        ctx.addIssue({ code: 'custom', path: ['card', 'expiry'], message: 'Card expiry must be MM/YY and in the future' });
      }
      if (!/^\d{3,4}$/.test(d.card.cvv)) {
        ctx.addIssue({ code: 'custom', path: ['card', 'cvv'], message: 'CVV must be 3 or 4 digits' });
      }
    }),
  orderStatus: z.object({
    status: z.enum(['Pending', 'Shipped', 'Delivered', 'Cancelled']),
    note: z.string().trim().max(200).optional(),
  }),
  ordersQuery: z.object({
    status: z.enum(['Pending', 'Shipped', 'Delivered', 'Cancelled']).optional(),
    search: z.string().trim().max(80).optional(),
    page: int(1, 10000).default(1),
    limit: int(1, 100).default(20),
  }),

  // ---- discounts & offers ----
  discountCheck: z.object({
    code: z.string().trim().min(1, 'Enter a discount code').max(30),
    subtotal: int(0),
  }),
  discount: z
    .object({
      code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9_-]{3,20}$/, 'Code must be 3-20 letters, numbers, - or _'),
      type: z.enum(['percent', 'fixed']),
      value: int(1),
      minOrder: int(0).default(0),
      usageLimit: nullableInt(1),
      expiresAt: z.preprocess(emptyToNull, z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use date format YYYY-MM-DD').nullable()),
      active: bool(true),
    })
    .refine((d) => d.type !== 'percent' || d.value <= 100, {
      message: 'Percent discount cannot be more than 100',
      path: ['value'],
    }),
  offer: z.object({
    title: text(3, 80, 'Title'),
    subtitle: z.string().trim().max(160).default(''),
    badge: z.string().trim().max(20).default(''),
    code: z.string().trim().toUpperCase().max(20).default(''),
    active: bool(true),
  }),

  // ---- misc ----
  contact: z.object({
    name: text(2, 60, 'Name'),
    email,
    subject: z.string().trim().max(120).default(''),
    message: text(10, 2000, 'Message'),
  }),
  customerStatus: z.object({ isActive: bool(true) }),
  customersQuery: z.object({
    search: z.string().trim().max(80).optional(),
  }),
  salesReportQuery: z.object({
    period: z.enum(['day', 'month']).default('day'),
  }),
};

module.exports = { schemas };
