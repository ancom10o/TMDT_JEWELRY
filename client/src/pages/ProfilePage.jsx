import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Tài Khoản</p>
          <h1 className="mt-3 text-3xl font-bold text-navy">Thông tin cá nhân</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Xem nhanh thông tin tài khoản, vai trò hiện tại và các thao tác liên quan đến đơn hàng.
          </p>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Họ tên</p>
              <p className="mt-2 text-lg font-semibold text-navy">{user?.fullName || '--'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-2 text-lg font-semibold text-navy">{user?.email || '--'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Số điện thoại</p>
              <p className="mt-2 text-lg font-semibold text-navy">{user?.phone || 'Chưa cập nhật'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Vai trò</p>
              <p className="mt-2 text-lg font-semibold capitalize text-navy">{user?.role || 'user'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-500">Địa chỉ</p>
              <p className="mt-2 text-lg font-semibold text-navy">{user?.address || 'Chưa cập nhật'}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/my-orders" className="btn-secondary">
              Xem đơn hàng của tôi
            </Link>
            {user?.role === 'admin' ? (
              <Link to="/admin" className="btn-outline">
                Mở khu vực admin
              </Link>
            ) : null}
            <button type="button" onClick={logout} className="btn-outline">
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
