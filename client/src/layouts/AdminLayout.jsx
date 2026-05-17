import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const adminMenuItems = [
  { label: 'Tong quan', path: '/admin' },
  { label: 'Homepage CMS', path: '/admin/homepage' },
  { label: 'San pham', path: '/admin/products' },
  { label: 'Danh muc', path: '/admin/categories' },
  { label: 'Don hang', path: '/admin/orders' },
  { label: 'Nguoi dung', path: '/admin/users' },
  { label: 'Ma giam gia', path: '/admin/coupons' },
  { label: 'Cai dat', path: '/admin/settings' }
];

function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="page-shell min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-6 sm:px-6 lg:flex-row lg:gap-6 lg:px-8">
        <aside className="surface-card mb-6 overflow-hidden lg:mb-0 lg:w-72 lg:flex-shrink-0">
          <div className="border-b border-slate-100 bg-navy px-6 py-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Bang Quan Tri</p>
            <h1 className="mt-2 text-2xl font-bold">JewelAura</h1>
            <p className="mt-2 text-sm text-slate-200">{user?.fullName || 'Quan tri vien'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">{user?.role || 'admin'}</p>
          </div>

          <nav className="flex flex-col gap-2 p-4" aria-label="Dieu huong quan tri">
            {adminMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-navy text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-navy'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="surface-card mb-6 flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Khong Gian Quan Tri</p>
              <p className="mt-1 text-sm text-slate-600">
                Quan ly san pham, don hang, nguoi dung, khuyen mai va noi dung homepage.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <p className="text-sm font-semibold text-navy">{user?.fullName || 'Quan tri vien'}</p>
              <p className="text-xs text-slate-500">{user?.email || 'admin@jewelaura.vn'}</p>
            </div>
          </div>

          <div className="surface-card p-5 sm:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
