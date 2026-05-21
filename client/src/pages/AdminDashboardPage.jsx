/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../components/admin/AdminModal.jsx';
import { Link, useNavigate } from 'react-router-dom';
import DataTable from '../components/admin/DataTable.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { downloadMonthlyRevenueExcel, getAdminDashboard, getCoupons, getPublicAssetUrl } from '../services/api.js';
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

function formatDateQuery(value) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function formatShortCurrency(value) {
  const safeValue = Number(value || 0);

  if (safeValue === 0) return '0';
  if (safeValue >= 1000000000) return `${Math.round(safeValue / 100000000) / 10}B`;
  if (safeValue >= 1000000) return `${Math.round(safeValue / 100000) / 10}M`;
  if (safeValue >= 1000) return `${Math.round(safeValue / 100) / 10}K`;
  return String(safeValue);
}

function RevenueChart({ data = [], selectedMonth, onSelectMonth }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue || 0), 1);

  return (
    <div className="space-y-5">
      <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
        <div className="flex h-[230px] items-end gap-2 overflow-x-auto pb-2">
        {data.map((item) => {
          const hasRevenue = item.revenue > 0;
          const height = hasRevenue ? Math.max(18, Math.round(((item.revenue || 0) / maxRevenue) * 150)) : 8;
          const isSelected = item.month === selectedMonth;

          return (
            <div key={item.month} className="flex min-w-[54px] flex-1 flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectMonth(item.month)}
                className={`group flex h-[190px] w-full items-end rounded-2xl border px-2 pb-2 transition ${
                  isSelected ? 'border-gold bg-white shadow-[0_14px_30px_rgba(212,175,55,0.18)]' : 'border-transparent bg-white/60 hover:border-slate-200 hover:bg-white'
                }`}
                title={`Tháng ${item.month}: ${formatCurrency(item.revenue || 0)}`}
              >
                <div
                  className={`relative w-full rounded-t-xl transition ${isSelected ? 'bg-gold' : hasRevenue ? 'bg-navy/75 group-hover:bg-navy' : 'bg-slate-300'}`}
                  style={{ height: `${height}px` }}
                >
                  <span className={`absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isSelected ? 'bg-gold/15 text-navy' : 'bg-white text-slate-600 shadow-sm'
                  }`}>
                    {formatShortCurrency(item.revenue)}
                  </span>
                </div>
              </button>
              <span className={`text-xs font-semibold ${isSelected ? 'text-navy' : 'text-slate-500'}`}>T{item.month}</span>
            </div>
          );
        })}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cao nhất</p>
          <p className="mt-2 text-lg font-bold text-navy">{formatCurrency(maxRevenue === 1 ? 0 : maxRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tổng năm</p>
          <p className="mt-2 text-lg font-bold text-navy">{formatCurrency(data.reduce((sum, item) => sum + (item.revenue || 0), 0))}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Đơn hoàn tất</p>
          <p className="mt-2 text-lg font-bold text-navy">{data.reduce((sum, item) => sum + (item.orders || 0), 0)}</p>
        </div>
      </div>
    </div>
  );
}

function DailyRevenueChart({ month, data = [], selectedDay, onSelectDay, onOpenDayOrders }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue || 0), 1);
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalOrders = data.reduce((sum, item) => sum + (item.orders || 0), 0);
  const selectedMetric = data.find((item) => item.day === selectedDay) || data[0] || { day: 1, revenue: 0, orders: 0 };

  return (
    <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-lg font-bold text-navy">Doanh thu theo ngày - Tháng {month}</h4>
          <p className="mt-1 text-sm text-slate-500">Click để xem nhanh số đơn, double click để lọc đơn hàng theo ngày.</p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ngày {selectedMetric.day}</p>
            <p className="mt-1 font-bold text-navy">{formatCurrency(selectedMetric.revenue || 0)}</p>
            <p className="text-xs text-slate-500">{selectedMetric.orders || 0} đơn</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tổng tháng</p>
            <p className="mt-1 font-bold text-navy">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-500">{totalOrders} đơn</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex h-[220px] items-end gap-1.5 overflow-x-auto pb-2">
        {data.map((item) => {
          const hasRevenue = item.revenue > 0;
          const height = hasRevenue ? Math.max(16, Math.round(((item.revenue || 0) / maxRevenue) * 145)) : 7;
          const isSelected = item.day === selectedDay;

          return (
            <div key={item.day} className="flex min-w-[34px] flex-1 flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectDay(item.day)}
                onDoubleClick={() => onOpenDayOrders(item.day)}
                className={`group flex h-[178px] w-full items-end rounded-xl border px-1.5 pb-1.5 transition ${
                  isSelected ? 'border-navy/30 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.12)]' : 'border-transparent bg-white/60 hover:border-slate-200 hover:bg-white'
                }`}
                title={`Ngày ${item.day}: ${formatCurrency(item.revenue || 0)} · ${item.orders || 0} đơn. Double click để xem đơn hàng.`}
              >
                <div
                  className={`relative w-full rounded-t-lg transition ${isSelected ? 'bg-navy' : hasRevenue ? 'bg-gold/85 group-hover:bg-gold' : 'bg-slate-300'}`}
                  style={{ height: `${height}px` }}
                >
                  {item.revenue > 0 ? (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-navy shadow-sm">
                      {formatShortCurrency(item.revenue)}
                    </span>
                  ) : null}
                </div>
              </button>
              <span className={`text-[11px] font-semibold ${isSelected ? 'text-navy' : 'text-slate-500'}`}>{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingRevenue, setExportingRevenue] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState('month');
  const currentDate = new Date();
  const [exportMonth, setExportMonth] = useState(currentDate.getMonth() + 1);
  const [exportYear, setExportYear] = useState(currentDate.getFullYear());
  const currentDateInput = currentDate.toISOString().slice(0, 10);
  const [exportFromDate, setExportFromDate] = useState(currentDateInput);
  const [exportToDate, setExportToDate] = useState(currentDateInput);
  const [chartYear, setChartYear] = useState(currentDate.getFullYear());
  const [selectedRevenueMonth, setSelectedRevenueMonth] = useState(currentDate.getMonth() + 1);
  const [selectedRevenueDay, setSelectedRevenueDay] = useState(currentDate.getDate());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setLoading(true);
        setErrorMessage('');
        const [dashboardResponse, couponsResponse] = await Promise.all([
          getAdminDashboard(token, { year: chartYear }),
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
  }, [chartYear, token]);

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

  const selectedDailyRevenue = useMemo(() => {
    return dashboard?.revenueByDay?.find((item) => item.month === selectedRevenueMonth)?.days || [];
  }, [dashboard?.revenueByDay, selectedRevenueMonth]);

  function handleSelectRevenueMonth(month) {
    setSelectedRevenueMonth(month);
    setSelectedRevenueDay(1);
  }

  function openOrdersByRevenueDay(day) {
    const date = `${chartYear}-${String(selectedRevenueMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    navigate(`/admin/orders?date=${date}`);
  }

  async function handleExportRevenue() {
    try {
      setExportingRevenue(true);
      const month = Number(exportMonth);
      const year = Number(exportYear);
      const payload = exportMode === 'range'
        ? { fromDate: exportFromDate, toDate: exportToDate }
        : { year, month };
      const blob = await downloadMonthlyRevenueExcel(payload, token);
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportMode === 'range'
        ? `revenue-${exportFromDate}-to-${exportToDate || exportFromDate}.xlsx`
        : `revenue-${year}-${String(month).padStart(2, '0')}.xlsx`;
      link.click();
      globalThis.URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Khong the export doanh thu thang.');
    } finally {
      setExportingRevenue(false);
    }
  }

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
      label: 'Tổng người dùng',
      value: dashboard?.stats?.totalUsers ?? 0,
      note: 'User đã đăng ký tài khoản',
      icon: 'user',
      accent: 'bg-slate-100 text-navy ring-slate-200',
      to: '/admin/users'
    },
    {
      label: 'Doanh thu',
      value: formatCurrency(dashboard?.stats?.monthlyRevenue ?? dashboard?.stats?.revenue ?? 0),
      note: 'Doanh thu tháng này từ đơn đã hoàn thành',
      icon: 'revenue',
      accent: 'bg-gold/10 text-[#9a761e] ring-gold/20',
      to: '/admin/orders',
      wide: true
    },
    {
      label: 'Đơn hàng tháng này',
      value: dashboard?.stats?.monthlyOrders ?? 0,
      note: 'Tất cả đơn phát sinh trong tháng này',
      icon: 'order',
      accent: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
      to: '/admin/orders'
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
              Theo dõi nhanh: doanh thu, đơn hàng, tồn kho, người dùng và khuyến mãi.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {loading ? 'Đang tải dữ liệu...' : `Cập nhật: ${formatDateTime(lastUpdated)}`}
            </div>
            <button type="button" onClick={() => setExportModalOpen(true)} className="btn-outline">
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`group rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.045)] transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_22px_60px_rgba(15,23,42,0.08)] ${item.wide ? 'sm:col-span-2 xl:col-span-2' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">{item.label}</p>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${item.accent}`}>
                <DashboardIcon type={item.icon} />
              </span>
            </div>
            <p className={`${item.wide ? 'text-[1.85rem] sm:text-4xl' : 'text-3xl'} mt-5 break-words font-extrabold tracking-tight text-navy`}>
              {loading ? '--' : item.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">{item.note}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-gold opacity-0 transition group-hover:opacity-100">
              Mở trang quản lý
            </p>
          </Link>
        ))}
      </div>

      <SectionCard
        title="Biểu đồ doanh thu tháng năm"
        description="Bấm vào một cột tháng để xem doanh thu từng ngày trong tháng đó."
        action={
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Năm</span>
            <input
              type="number"
              min="2020"
              max="2100"
              value={chartYear}
              onChange={(event) => setChartYear(Number(event.target.value) || currentDate.getFullYear())}
              className="input-field !w-24"
            />
          </div>
        }
      >
        {loading ? (
          <div className="skeleton-block h-72" />
        ) : (
          <div className="space-y-5">
            <RevenueChart
              data={dashboard?.revenueByMonth || []}
              selectedMonth={selectedRevenueMonth}
              onSelectMonth={handleSelectRevenueMonth}
            />
            <DailyRevenueChart
              month={selectedRevenueMonth}
              data={selectedDailyRevenue}
              selectedDay={selectedRevenueDay}
              onSelectDay={setSelectedRevenueDay}
              onOpenDayOrders={openOrdersByRevenueDay}
            />
          </div>
        )}
      </SectionCard>

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
              {dashboard.recentOrders.slice(0, 3).map((order) => (
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
                  <td
                    className="cursor-pointer px-5 py-4 text-slate-500 transition hover:text-gold"
                    title="Click đúp để lọc đơn hàng theo ngày này"
                    onDoubleClick={() => navigate(`/admin/orders?date=${formatDateQuery(order.createdAt)}`)}
                  >
                    <span className="select-none">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </td>
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

      <AdminModal
        open={exportModalOpen}
        title="Export Excel doanh thu"
        description="Chọn xuất theo tháng/năm hoặc theo khoảng ngày cần xem."
        onClose={() => setExportModalOpen(false)}
        width="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setExportMode('month')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                exportMode === 'month' ? 'border-gold bg-gold/10 text-navy' : 'border-slate-200 bg-white text-slate-600 hover:border-gold/50'
              }`}
            >
              <span className="block font-bold">Theo tháng</span>
              <span className="mt-1 block text-sm">Chọn tháng và năm.</span>
            </button>
            <button
              type="button"
              onClick={() => setExportMode('range')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                exportMode === 'range' ? 'border-gold bg-gold/10 text-navy' : 'border-slate-200 bg-white text-slate-600 hover:border-gold/50'
              }`}
            >
              <span className="block font-bold">Theo khoảng ngày</span>
              <span className="mt-1 block text-sm">Chọn từ ngày đến ngày.</span>
            </button>
          </div>

          {exportMode === 'month' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="field-label">Tháng</span>
                <select value={exportMonth} onChange={(event) => setExportMonth(Number(event.target.value))} className="select-field">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <option key={index + 1} value={index + 1}>
                      Tháng {index + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Năm</span>
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={exportYear}
                  onChange={(event) => setExportYear(Number(event.target.value) || currentDate.getFullYear())}
                  className="input-field"
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="field-label">Từ ngày</span>
                <input type="date" value={exportFromDate} onChange={(event) => setExportFromDate(event.target.value)} className="input-field" />
              </label>
              <label>
                <span className="field-label">Đến ngày</span>
                <input type="date" value={exportToDate} onChange={(event) => setExportToDate(event.target.value)} className="input-field" />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setExportModalOpen(false)} className="btn-outline">
              Hủy
            </button>
            <button type="button" onClick={handleExportRevenue} disabled={exportingRevenue} className="btn-secondary">
              {exportingRevenue ? 'Đang export...' : 'Tải Excel'}
            </button>
          </div>
        </div>
      </AdminModal>
    </section>
  );
}

export default AdminDashboardPage;
