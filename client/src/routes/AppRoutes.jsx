import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import AdminCategoriesPage from '../pages/AdminCategoriesPage.jsx';
import AdminCouponsPage from '../pages/AdminCouponsPage.jsx';
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx';
import AdminHomepagePage from '../pages/AdminHomepagePage.jsx';
import AdminOrdersPage from '../pages/AdminOrdersPage.jsx';
import AdminProductsPage from '../pages/AdminProductsPage.jsx';
import AdminSettingsPage from '../pages/AdminSettingsPage.jsx';
import AdminUsersPage from '../pages/AdminUsersPage.jsx';
import CartPage from '../pages/CartPage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import MyOrdersPage from '../pages/MyOrdersPage.jsx';
import OrderDetailPage from '../pages/OrderDetailPage.jsx';
import ProductDetailPage from '../pages/ProductDetailPage.jsx';
import ProductsPage from '../pages/ProductsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import WishlistPage from '../pages/WishlistPage.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="homepage" element={<AdminHomepagePage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
