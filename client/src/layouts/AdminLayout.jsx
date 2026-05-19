/* eslint-disable react/prop-types */
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const adminMenuItems = [
  { label: 'Tổng quan', path: '/admin', icon: '◇' },
  { label: 'Homepage CMS', path: '/admin/homepage', icon: '▣' },
  { label: 'Sản phẩm', path: '/admin/products', icon: '◈' },
  { label: 'Danh mục', path: '/admin/categories', icon: '▤' },
  { label: 'Đơn hàng', path: '/admin/orders', icon: '□' },
  { label: 'Người dùng', path: '/admin/users', icon: '○' },
  { label: 'Mã giảm giá', path: '/admin/coupons', icon: '%' },
];

function AdminSidebar({ onNavigate }) {
  return (
    <aside className="flex h-dvh w-72 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-[18px_0_60px_rgba(15,23,42,0.06)] lg:fixed lg:inset-y-0 lg:left-0 lg:z-40">
      <div className="bg-navy px-6 py-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Bảng quản trị</p>
        <h1 className="mt-2 text-3xl font-bold">JewelAura</h1>
        <p className="mt-2 text-sm text-slate-200">Tỏa sáng theo cách của bạn</p>
      </div>

      {/* <div className="border-b border-slate-100 px-5 py-5">
        <p className="text-sm font-semibold text-navy">{user?.fullName || 'Quản trị viên'}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{user?.email || 'admin@jewelaura.vn'}</p>
        <span className="mt-3 inline-flex rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a761e]">
          {user?.role || 'admin'}
        </span>
      </div> */}

      <nav className="premium-scrollbar flex-1 space-y-2 overflow-y-auto p-4" aria-label="Điều hướng quản trị">
        {adminMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-navy text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-navy'
              }`
            }
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/10 bg-white/10 text-base text-gold">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function AdminLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.12),_transparent_28%),linear-gradient(135deg,_#f8fbff_0%,_#eef4fb_48%,_#ffffff_100%)] text-slate-900">
      <div className="flex h-screen overflow-hidden">
        <div className="hidden w-72 shrink-0 lg:block">
          <AdminSidebar />
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
            <button
              type="button"
              className="absolute inset-0 bg-navy/50"
              aria-label="Đóng menu quản trị"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative h-full max-w-[18rem]">
              <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="icon-button lg:hidden"
                  aria-label="Mở menu quản trị"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="text-lg">☰</span>
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Không gian quản trị</p>
                  <p className="mt-1 hidden text-sm text-slate-600 sm:block">
                    Quản lý sản phẩm, đơn hàng, khách hàng, khuyến mãi và nội dung homepage.
                  </p>
                </div>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right sm:block">
                <p className="text-sm font-semibold text-navy">{user?.fullName || 'Quản trị viên'}</p>
                <p className="text-xs text-slate-500">{user?.email || 'admin@jewelaura.vn'}</p>
              </div>
            </div>
          </header>

          <div className="premium-scrollbar h-full min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-[1440px]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
