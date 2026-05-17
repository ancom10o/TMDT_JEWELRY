import { useEffect, useState } from 'react';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getAdminDashboard, getPublicAssetUrl } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

function formatDateTime(value) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function getOrderTone(status) {
  const map = {
    pending: 'warning',
    confirmed: 'info',
    shipping: 'accent',
    completed: 'success',
    cancelled: 'danger'
  };

  return map[status] || 'neutral';
}

function AdminDashboardPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = await getAdminDashboard(token);

        if (isMounted) {
          setDashboard(response);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'Không thể tải tổng quan quản trị.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const stats = [
    { label: 'Tổng sản phẩm', value: dashboard?.stats?.totalProducts ?? 0, note: 'Tất cả sản phẩm trong hệ thống' },
    { label: 'Tổng đơn hàng', value: dashboard?.stats?.totalOrders ?? 0, note: 'Đã tạo từ khi vận hành' },
    { label: 'Tổng người dùng', value: dashboard?.stats?.totalUsers ?? 0, note: 'Bao gồm user và admin' },
    { label: 'Doanh thu', value: formatCurrency(dashboard?.stats?.revenue ?? 0), note: 'Tổng doanh thu không tính đơn hủy' },
    { label: 'Mã giảm giá hoạt động', value: dashboard?.stats?.activeCoupons ?? 0, note: 'Còn hạn và đang bật' }
  ];

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Tổng quan"
        title="Tổng quan quản trị"
        description="Theo dõi nhanh tình hình đơn hàng, sản phẩm sắp hết hàng, người dùng và khuyến mãi đang hoạt động."
        meta={loading ? 'Đang tải dữ liệu...' : 'Đã đồng bộ dữ liệu mới nhất'}
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <article key={item.label} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-4 text-3xl font-bold text-navy">{loading ? '--' : item.value}</p>
            <p className="mt-3 text-sm text-slate-600">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-navy">Đơn hàng mới nhất</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton-block h-20" />
              ))}
            </div>
          ) : !dashboard?.recentOrders?.length ? (
            <div className="state-empty">Chưa có đơn hàng nào để hiển thị.</div>
          ) : (
            <DataTable
              columns={[
                { key: 'order', label: 'Mã đơn' },
                { key: 'customer', label: 'Khách hàng' },
                { key: 'total', label: 'Tổng tiền' },
                { key: 'status', label: 'Trạng thái' },
                { key: 'date', label: 'Ngày tạo' }
              ]}
            >
              {dashboard.recentOrders.map((order) => (
                <tr key={order._id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold text-navy">#{order._id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-700">{order.user?.fullName || order.shippingAddress?.fullName || '--'}</p>
                    <p className="mt-1 text-slate-500">{order.user?.email || '--'}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatCurrency(order.totalPrice)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge label={order.status} tone={getOrderTone(order.status)} />
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-navy">Sản phẩm sắp hết hàng</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton-block h-24" />
              ))}
            </div>
          ) : !dashboard?.lowStockProducts?.length ? (
            <div className="state-empty">Không có sản phẩm nào sắp hết hàng.</div>
          ) : (
            <div className="space-y-3">
              {dashboard.lowStockProducts.map((product) => (
                <article key={product._id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {product.images?.[0] ? (
                        <img src={getPublicAssetUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{product.category?.name || '--'}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-red-600">Tồn kho: {product.stock}</span>
                        <span className="text-sm text-slate-500">{formatCurrency(product.price)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
