import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Navbar';
import { ChartIcon, DashboardIcon, GridIcon, LogoutIcon, MessageIcon, PackageIcon, TagIcon, UsersIcon, StoreIcon } from '../../components/Icons';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/admin/orders', label: 'Orders', icon: PackageIcon },
  { to: '/admin/products', label: 'Products', icon: GridIcon },
  { to: '/admin/categories', label: 'Categories', icon: GridIcon },
  { to: '/admin/customers', label: 'Customers', icon: UsersIcon },
  { to: '/admin/discounts', label: 'Offers & codes', icon: TagIcon },
  { to: '/admin/reports', label: 'Reports', icon: ChartIcon },
  { to: '/admin/messages', label: 'Messages', icon: MessageIcon },
];

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();

  const link = ({ isActive }) =>
    `flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-paper md:flex">
      <aside className="bg-brand-800 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:flex-col md:items-start md:py-5">
          <Link to="/admin" aria-label="Admin home">
            <Logo className="text-xl" />
          </Link>
          <p className="text-xs text-white/60 md:hidden">{user.name}</p>
        </div>

        <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={link}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-white/15 p-3 md:absolute md:inset-x-0 md:bottom-0 md:block">
          <p className="truncate px-3 pb-2 text-xs text-white/60">{user.email}</p>
          <Link to="/" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
            <StoreIcon size={18} /> View store
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogoutIcon size={18} /> Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
        <div className="mt-10 flex gap-4 border-t border-line pt-4 text-sm md:hidden">
          <Link to="/" className="link">
            View store
          </Link>
          <button
            className="link"
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
          >
            Log out
          </button>
        </div>
      </main>
    </div>
  );
}
