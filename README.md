# HBK Store (demo)

A complete dummy online store for **HBK**, a general store (groceries, electronics, clothing, home, beauty).
All data is fake. Card payment is a demo and never charges anything.

**Stack:** React 19 + Tailwind CSS 4 (Vite) · Node.js + Express · SQLite (built into Node) · JWT login with bcrypt-hashed passwords

## Quick start

Needs Node.js 22.13 or newer (Node 22 LTS or 24). No Python or build tools needed.

```bash
npm run install:all          # install server + client packages
cp server/.env.example server/.env   # then set JWT_SECRET to a long random text
npm run seed                 # create the database with dummy data
```

Run in development (two terminals):

```bash
npm run server               # API on http://localhost:5000
npm run client               # shop on http://localhost:5173
```

Or run as one app: `npm run build` then `npm start`, and open http://localhost:5000.

## Demo logins

| Role | Email | Password | Where |
|---|---|---|---|
| Customer | customer@hbk.example | Customer@123 | /login |
| Admin | admin@hbk.example | Admin@123 | /admin/login |

Other demo customers exist too (see Admin > Customers). Their password is `Customer@123`.
Test card: `4242 4242 4242 4242`, any future date, any 3 digit CVV.
Discount codes: see Admin > Offers & codes (for example `WELCOME10`).

`npm run seed` wipes and recreates all data: 5 categories, 30 products, 11 users, 20 orders, 5 discount codes.

## Features

**Customer:** home (hero, offers, categories, featured), products (search, category/price/rating filters, sorting, pagination), product page (reviews, stock, wishlist), cart, checkout (address, cash on delivery or card, discount codes), orders with tracking and cancel, sign up/login/profile, wishlist, About, Contact form, Store location with map and hours, FAQ.

**Admin (separate login):** dashboard (sales, orders, customers, low stock, chart), products (add/edit/delete, image upload), categories, orders (status changes Pending > Shipped > Delivered / Cancelled), customers (enable/disable), discount codes and home page offers, sales reports (by day / by month, top products, by category), contact messages.

## Folder structure

```
hbk-store/
├── server/
│   ├── src/
│   │   ├── index.js          app setup, middleware, route mounting
│   │   ├── schema.js         database tables
│   │   ├── seed.js           dummy data
│   │   ├── validators.js     all input rules (zod)
│   │   ├── routes/           URL -> controller
│   │   ├── controllers/      request handling
│   │   ├── models/           database queries
│   │   └── middleware/       auth, validation, errors, uploads
│   ├── uploads/              uploaded product images
│   └── data/hbk.db           SQLite file (created by seed)
└── client/src/
    ├── pages/                shop pages + pages/admin/
    ├── components/           navbar, cards, modal, form helpers
    ├── context/              auth, cart, wishlist, store info, toasts
    └── lib/                  API client, helpers
```

## Database

`users` · `categories` · `products` · `reviews` · `wishlist` · `orders` · `order_items` (copies name and price, so old orders stay correct) · `order_events` (tracking timeline) · `discounts` · `offers` · `contact_messages` · `settings`. Money is stored as whole rupees. See `server/src/schema.js`.

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/admin/login` · `GET/PUT /api/auth/me` · `PUT /api/auth/password` |
| Shop | `GET /api/products` (search, category, minPrice, maxPrice, minRating, sort, page) · `GET /api/products/:slug` · `POST /api/products/:slug/reviews` · `GET /api/categories` · `GET /api/store` · `POST /api/contact` |
| Customer | `GET/POST /api/orders` · `GET /api/orders/:id` · `POST /api/orders/:id/cancel` · `GET/POST/DELETE /api/wishlist/:productId` · `POST /api/discounts/validate` |
| Admin | everything under `/api/admin/*`: `stats`, `reports/sales`, `products`, `categories`, `orders`, `customers`, `discounts`, `offers`, `messages` |

## Security notes

Passwords are hashed with bcrypt. Prices and stock are always checked on the server, never trusted from the browser. Inputs are validated with zod, login is rate limited, uploads are limited to small images, and only the last 4 card digits are stored (demo). Before using this for a real shop: set a strong `JWT_SECRET`, add HTTPS, and connect a real payment provider.
