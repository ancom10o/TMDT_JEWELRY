/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/admin/DataTable.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getAdminDashboard, getCoupons, getPublicAssetUrl } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

function formatDateTime(value) {
  if (!value) return '--';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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

function DashboardIcon({ type }) {
  const paths = {
    product: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm8 4.5 8-4.5M12 12v9M12 12 4 7.5',
    order: 'M7 4h10l2 17H5L7 4Zm2 0a3 3 0 0 1 6 0M9 9h6',
    user: 'M16 19a4 4 0 0 0-8 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 7a3 3 0 0 0-3-3',
    revenue: 'M12 3v18M17 7.5c-.8-1-2.2-1.6-4.1-1.6-2.3 0-3.9 1-3.9 2.7 0 4.2 8.5 1.7 8.5 6 0 1.9-1.8 3.4-4.7 3.4-2.2 0-4-.8-5.1-2.2',
    coupon: 'm5 19 14-14M7.5 8.5h.01M16.5 15.5h.01M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    warning: 'M12 4 3 20h18L12 4Zm0 5v5m0 3h.01',
    empty: 'M4 7h16M6 7v12h12V7M9 11h6M10 15h4',
    trend: 'M4 16 9 11l4 4 7-8M15 7h5v5'
  };

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[26px] border border-dashed border-slate-200 bg-white px-5 py-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
        <DashboardIcon type="empty" />
      </div>
      <p className="mt-4 font-semibold text-navy">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function SectionCard({ title, description, children, action }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-navy">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAllLink({ to, label = 'Xem tất cả' }) {
  return (
    <Link to={to} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-navy transition hover:border-gold hover:bg-gold/10">
      {label}
    </Link>
  );
}

function AdminDashboardPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setErrorMessage('');

        const [dashboardResponse, couponsResponse] = await Promise.all([
          getAdminDashboard(token),
          getCoupons(token).catch(() => ({ coupons: [] }))
        ]);

        setDashboard(dashboardResponse);
        setCoupons(couponsResponse.coupons || []);
        setLastUpdated(new Date());
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Không thể tải tổng quan quản trị.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setLoading(true);
        setErrorMessage('');
        const [dashboardResponse, couponsResponse] = await Promise.all([
          getAdminDashboard(token),
          getCoupons(token).catch(() => ({ coupons: [] }))
        ]);

        if (isMounted) {
          setDashboard(dashboardResponse);
          setCoupons(couponsResponse.coupons || []);
          setLastUpdated(new Date());
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

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const expiringCoupons = useMemo(() => {
    const now = Date.now();
    return coupons
      .filter((coupon) => coupon.isActive && new Date(coupon.endDate).getTime() >= now)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 4);
  }, [coupons]);

  const topProducts = useMemo(() => {
    return [...(dashboard?.lowStockProducts || [])]
      .filter((product) => Number(product.sold || 0) > 0)
      .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
      .slice(0, 4);
  }, [dashboard?.lowStockProducts]);

  const lowStockCount = dashboard?.lowStockProducts?.length ?? 0;
  const stats = [
    {
      label: 'Tổng sản phẩm',
      value: dashboard?.stats?.totalProducts ?? 0,
      note: 'Đang quản lý trong hệ thống',
      icon: 'product',
      accent: 'bg-blue-50 text-blue-700 ring-blue-100',
      to: '/admin/products'
    },
    {
      label: 'Tổng đơn hàng',
      value: dashboard?.stats?.totalOrders ?? 0,
      note: 'Tất cả đơn đã phát sinh',
      icon: 'order',
      accent: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      to: '/admin/orders'
    },
    {
      label: 'Tổng người dùng',
      value: dashboard?.stats?.totalUsers ?? 0,
      note: 'Bao gồm user và admin',
      icon: 'user',
      accent: 'bg-slate-100 text-navy ring-slate-200',
      to: '/admin/users'
    },
    {
      label: 'Doanh thu',
      value: formatCurrency(dashboard?.stats?.revenue ?? 0),
      note: 'Không tính đơn đã hủy',
      icon: 'revenue',
      accent: 'bg-gold/10 text-[#9a761e] ring-gold/20',
      to: '/admin/orders'
    },
    {
      label: 'Mã giảm giá hoạt động',
      value: dashboard?.stats?.activeCoupons ?? 0,
      note: 'Đang bật và còn hạn',
      icon: 'coupon',
      accent: 'bg-amber-50 text-amber-700 ring-amber-100',
      to: '/admin/coupons'
    },
    {
      label: 'Sản phẩm sắp hết hàng',
      value: lowStockCount,
      note: 'Tồn kho từ 10 sản phẩm trở xuống',
      icon: 'warning',
      accent: 'bg-red-50 text-red-700 ring-red-100',
      to: '/admin/products'
    }
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gold">Tổng quan</p>
            <h2 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">Tổng quan quản trị</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Theo dõi nhanh sức khỏe vận hành ecommerce: doanh thu, đơn hàng, tồn kho, người dùng và khuyến mãi.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {loading ? 'Đang tải dữ liệu...' : `Cập nhật: ${formatDateTime(lastUpdated)}`}
            </div>
            <button type="button" onClick={() => loadDashboard({ silent: true })} disabled={loading || refreshing} className="btn-secondary">
              {refreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
            </button>
          </div>
        </div>
      </div>

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.045)] transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">{item.label}</p>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${item.accent}`}>
                <DashboardIcon type={item.icon} />
              </span>
            </div>
            <p className="mt-5 break-words text-3xl font-extrabold tracking-tight text-navy">{loading ? '--' : item.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">{item.note}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-gold opacity-0 transition group-hover:opacity-100">
              Mở trang quản lý
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <SectionCard title="Đơn hàng mới nhất" description="Theo dõi các đơn vừa phát sinh để xử lý nhanh." action={<ViewAllLink to="/admin/orders" />}>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton-block h-20" />
              ))}
            </div>
          ) : !dashboard?.recentOrders?.length ? (
            <EmptyState title="Chưa có đơn hàng" description="Khi khách đặt hàng, các đơn mới nhất sẽ xuất hiện tại đây." />
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
                <tr key={order._id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-navy">
                    <Link to="/admin/orders" className="transition hover:text-gold">
                      #{order._id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-700">{order.user?.fullName || order.shippingAddress?.fullName || '--'}</p>
                    <p className="mt-1 text-slate-500">{order.user?.email || '--'}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{formatCurrency(order.totalPrice)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge label={order.status} tone={getOrderTone(order.status)} />
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Sản phẩm sắp hết hàng" description="Ưu tiên nhập thêm hoặc tạm ẩn sản phẩm." action={<ViewAllLink to="/admin/products" />}>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="skeleton-block h-24" />
                ))}
              </div>
            ) : !dashboard?.lowStockProducts?.length ? (
              <EmptyState title="Tồn kho ổn định" description="Hiện chưa có sản phẩm nào chạm ngưỡng sắp hết hàng." />
            ) : (
              <div className="space-y-3">
                {dashboard.lowStockProducts.slice(0, 5).map((product) => (
                  <Link key={product._id} to="/admin/products" className="block rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-gold/50 hover:bg-white">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {product.images?.[0] ? (
                          <img src={getPublicAssetUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gold">
                            <DashboardIcon type="product" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-navy">{product.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{product.category?.name || '--'}</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Tồn kho: {product.stock}</span>
                          <span className="text-sm font-semibold text-slate-600">{formatCurrency(product.price)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Mã giảm giá sắp hết hạn" description="Các mã còn hiệu lực, xếp theo ngày kết thúc gần nhất." action={<ViewAllLink to="/admin/coupons" />}>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="skeleton-block h-16" />
                ))}
              </div>
            ) : expiringCoupons.length === 0 ? (
              <EmptyState title="Chưa có mã sắp hết hạn" description="Khi có coupon còn hiệu lực, danh sách ưu tiên sẽ hiển thị ở đây." />
            ) : (
              <div className="space-y-3">
                {expiringCoupons.map((coupon) => (
                  <Link key={coupon._id} to="/admin/coupons" className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-gold hover:bg-gold/5">
                    <div>
                      <p className="font-bold tracking-[0.12em] text-navy">{coupon.code}</p>
                      <p className="mt-1 text-xs text-slate-500">Hết hạn: {formatDate(coupon.endDate)}</p>
                    </div>
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-[#9a761e]">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top sản phẩm bán chạy"
          description="Hiển thị khi dữ liệu sản phẩm có số lượng đã bán."
          action={
            <div className="flex items-center gap-2">
              <ViewAllLink to="/admin/products" />
              <span className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-gold/10 text-gold sm:flex">
                <DashboardIcon type="trend" />
              </span>
            </div>
          }
        >
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton-block h-16" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <EmptyState title="Chưa đủ dữ liệu bán chạy" description="Sau khi có đơn hoàn tất và sản phẩm có lượt bán, khu vực này sẽ tự hiển thị danh sách." />
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <Link key={product._id} to="/admin/products" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-gold hover:bg-white">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{index + 1}</span>
                    <div>
                      <p className="font-semibold text-navy">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.category?.name || '--'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{product.sold} đã bán</p>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Trạng thái vận hành" description="Tóm tắt nhanh các điểm cần chú ý trong ngày.">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <Link to="/admin/orders" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-gold hover:bg-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Đơn mới</p>
              <p className="mt-2 text-2xl font-bold text-navy">{loading ? '--' : dashboard?.recentOrders?.length ?? 0}</p>
            </Link>
            <Link to="/admin/products" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-gold hover:bg-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cảnh báo kho</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{loading ? '--' : lowStockCount}</p>
            </Link>
            <Link to="/admin/coupons" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-gold hover:bg-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Coupon ưu tiên</p>
              <p className="mt-2 text-2xl font-bold text-[#9a761e]">{loading ? '--' : expiringCoupons.length}</p>
            </Link>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
