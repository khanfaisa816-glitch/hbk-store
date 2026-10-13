import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useStore } from '../context/StoreContext';
import { money } from '../lib/format';
import { CartIcon, HeartIcon, MenuIcon, CloseIcon, SearchIcon, UserIcon, ChevronDownIcon } from './Icons';

const LINKS = [
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/location', label: 'Visit the store' },
  { to: '/contact', label: 'Contact' },
];

export function Logo({ className = 'text-xl' }) {
  return (
    <span className={`price-tag inline-block bg-brand-600 px-3 pb-1 pt-2.5 font-display font-extrabold leading-none tracking-tight text-tag ${className}`}>
      HBK
    </span>
  );
}

export default function Navbar() {
  const { store } = useStore();
  const { count } = useCart();
  const wishlist = useWishlist();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState('');
  const menuRef = useRef(null);

  // close menus when the page changes
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // close the account menu when clicking outside of it
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const search = (e) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setMobileOpen(false);
  };

  const navClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:text-ink'}`;

  // A plain function (not a component) so the input is not recreated on every keystroke
  const renderSearch = (id, className = '') => (
    <form onSubmit={search} role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search products"
        className="input !rounded-full !py-2 pl-4 pr-10"
      />
      <button type="submit" aria-label="Search" className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:bg-black/5 hover:text-ink">
        <SearchIcon size={18} />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand-800 px-4 py-1.5 text-center text-[13px] text-white">
        Free delivery on orders above {money(store.freeShippingMin)}. Pay by card or cash on delivery.
      </div>

      <div className="border-b border-line bg-white">
        <div className="container-page flex h-16 items-center gap-4">
          <Link to="/" aria-label="HBK home" className="shrink-0">
            <Logo />
          </Link>

          <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {renderSearch('search-desktop', 'ml-auto hidden max-w-xs flex-1 md:block')}

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link to="/wishlist" aria-label={`Wishlist, ${wishlist.items.length} items`} className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-black/5 hover:text-ink">
              <HeartIcon size={21} />
              {wishlist.items.length > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-chili px-1 text-[10px] font-bold text-white">
                  {wishlist.items.length}
                </span>
              )}
            </Link>
            <Link to="/cart" aria-label={`Cart, ${count} items`} className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-black/5 hover:text-ink">
              <CartIcon size={21} />
              {count > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-tag px-1 text-[10px] font-bold text-ink">{count}</span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-ink-soft hover:bg-black/5 hover:text-ink"
                >
                  <UserIcon size={20} />
                  <span className="hidden max-w-[7rem] truncate sm:inline">{user.name.split(' ')[0]}</span>
                  <ChevronDownIcon size={14} />
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-line bg-white py-1 text-sm shadow-lg">
                    {[
                      ['/orders', 'My orders'],
                      ['/wishlist', 'Wishlist'],
                      ['/profile', 'Profile'],
                    ].map(([to, label]) => (
                      <Link key={to} to={to} role="menuitem" className="block px-4 py-2 hover:bg-paper">
                        {label}
                      </Link>
                    ))}
                    <button
                      role="menuitem"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="block w-full border-t border-line px-4 py-2 text-left hover:bg-paper"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm ml-1">
                Log in
              </Link>
            )}

            <button onClick={() => setMobileOpen((o) => !o)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-black/5 lg:hidden">
              {mobileOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-line bg-white lg:hidden">
            <div className="container-page space-y-3 py-4">
              {renderSearch('search-mobile', 'md:hidden')}
              <nav className="flex flex-col" aria-label="Mobile">
                {LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-md px-3 py-2.5 font-semibold ${isActive ? 'bg-brand-50 text-brand-700' : ''}`}>
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
