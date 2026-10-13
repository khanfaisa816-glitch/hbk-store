import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { ToastProvider } from './context/ToastContext';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, AdminAuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { RequireAuth, RequireAdmin, ScrollToTop, ShopLayout } from './components/RouteGuards';
import { PageSpinner } from './components/ui';

// Customer pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import { Login, Register } from './pages/Auth';
import { About, Contact, Location, Faq, NotFound } from './pages/Info';

// The admin panel is loaded only when someone opens it (keeps the shop fast)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminDiscounts = lazy(() => import('./pages/admin/AdminDiscounts'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ScrollToTop />
                <Suspense fallback={<PageSpinner />}>
                  <Routes>
                    <Route element={<ShopLayout />}>
                      <Route index element={<Home />} />
                      <Route path="products" element={<Products />} />
                      <Route path="products/:slug" element={<ProductDetail />} />
                      <Route path="cart" element={<Cart />} />
                      <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                      <Route path="orders" element={<RequireAuth><Orders /></RequireAuth>} />
                      <Route path="orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                      <Route path="wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
                      <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="about" element={<About />} />
                      <Route path="contact" element={<Contact />} />
                      <Route path="location" element={<Location />} />
                      <Route path="faq" element={<Faq />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>

                    <Route path="admin/login" element={<AdminLogin />} />
                    <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                      <Route index element={<Dashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="discounts" element={<AdminDiscounts />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="messages" element={<AdminMessages />} />
                    </Route>
                  </Routes>
                </Suspense>
              </WishlistProvider>
            </CartProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </StoreProvider>
    </ToastProvider>
  );
}
