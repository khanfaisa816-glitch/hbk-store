import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Logo } from './Navbar';

export default function Footer() {
  const { store, categories } = useStore();
  const col = 'space-y-2 text-sm';
  const head = 'mb-3 font-display text-base font-bold text-white';
  const link = 'text-white/75 hover:text-white';

  return (
    <footer className="mt-16 bg-brand-800 text-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="text-2xl" />
          <p className="mt-4 max-w-xs text-sm text-white/75">{store.tagline}</p>
          <p className="mt-4 text-sm text-white/75">
            {store.address}
            <br />
            {store.city}
          </p>
        </div>

        <div>
          <h3 className={head}>Shop</h3>
          <ul className={col}>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/products?category=${c.slug}`} className={link}>
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/products" className={link}>
                All products
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className={head}>Help</h3>
          <ul className={col}>
            {[
              ['/orders', 'Track my order'],
              ['/faq', 'Questions and answers'],
              ['/contact', 'Contact us'],
              ['/location', 'Store location'],
              ['/about', 'About HBK'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className={link}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={head}>Opening hours</h3>
          <ul className={col}>
            {store.hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4 text-white/75">
                <span>{h.day}</span>
                <span className="text-right">{h.time}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-white/75">
            {store.phone}
            <br />
            {store.email}
          </p>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-page flex flex-col gap-2 py-5 text-[13px] text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>HBK is a demo store with dummy data. No real orders or payments are processed.</p>
          <p>
            &copy; {new Date().getFullYear()} HBK.{' '}
            <Link to="/admin/login" className="underline underline-offset-2 hover:text-white">
              Admin login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
