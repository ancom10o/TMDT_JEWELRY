/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminModal from '../components/admin/AdminModal.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { confirmOrderPayment, getAdminDashboard, getOrderDetail, getPublicAssetUrl, updateOrderStatus } from '../services/api.js';
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

function formatDateQuery(value) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatShortCurrency(value) {
  const safeValue = Number(value || 0);

  if (safeValue === 0) return '0';
  if (safeValue >= 1000000000) return `${Math.round(safeValue / 100000000) / 10}B`;
  if (safeValue >= 1000000) return `${Math.round(safeValue / 100000) / 10}M`;
  if (safeValue >= 1000) return `${Math.round(safeValue / 100) / 10}K`;
  return String(safeValue);
}

function getOrderCode(order) {
  return order?.orderCode || order?._id?.slice(-8).toUpperCase() || '--';
}

function getOrderStatusLabel(status) {
  const labels = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };

  return labels[status] || status || '--';
}

function getOrderStatusTone(status) {
  const tones = {
    pending: 'warning',
    processing: 'info',
    confirmed: 'info',
    shipping: 'accent',
    completed: 'success',
    cancelled: 'danger'
  };

  return tones[status] || 'neutral';
}

function getPaymentMethodLabel(method) {
  const labels = {
    cod: 'COD',
    bank_transfer: 'Chuyển khoản',
    credit_card: 'Thẻ',
    momo: 'MoMo'
  };

  return labels[method] || method || '--';
}

function getPaymentStatusLabel(status, isPaid) {
  if (status === 'paid' || isPaid) return 'Đã thanh toán';

  const labels = {
    unpaid: 'Chưa thanh toán',
    pending: 'Chờ xác nhận',
    failed: 'Thất bại'
  };

  return labels[status] || 'Chưa thanh toán';
}

function getPaymentTone(status, isPaid) {
  if (status === 'paid' || isPaid) return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'danger';
  return 'neutral';
}

function canShowBankTransferPayment(order) {
  return Boolean(order?.orderCode) && order.paymentMethod === 'bank_transfer';
}

function canConfirmBankTransferPayment(order) {
  return canShowBankTransferPayment(order) && order.status === 'pending' && order.paymentStatus !== 'paid' && !order.isPaid;
}

function getNextOrderAction(order) {
  if (!order) return null;

  if (order.status === 'pending' && order.paymentMethod === 'cod') {
    return {
      status: 'confirmed',
      label: 'Xác nhận đơn COD',
      description: 'Đơn COD sẽ chuyển sang trạng thái đã xác nhận.'
    };
  }

  if (order.status === 'confirmed') {
    return {
      status: 'shipping',
      label: 'Đang giao hàng',
      description: 'Đơn đã xác nhận sẽ chuyển sang trạng thái đang giao.'
    };
  }

  if (order.status === 'shipping') {
    return {
      status: 'completed',
      label: 'Hoàn thành đơn',
      description: 'Đơn đang giao sẽ chuyển sang trạng thái hoàn thành.'
    };
  }

  return null;
}

function getWorkflowNote(order) {
  if (!order) return '';

  if (order.status === 'pending' && order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid' && !order.isPaid) {
    return 'Đơn chuyển khoản cần xác nhận thanh toán trước. Sau khi xác nhận, đơn sẽ tự chuyển sang đã xác nhận.';
  }

  if (order.status === 'completed') return 'Đơn hàng đã hoàn thành.';
  if (order.status === 'cancelled') return 'Đơn hàng đã bị hủy.';
  return '';
}

function DashboardIcon({ type }) {
  const paths = {
    product: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm8 4.5 8-4.5M12 12v9M12 12 4 7.5',
    order: 'M7 4h10l2 17H5L7 4Zm2 0a3 3 0 0 1 6 0M9 9h6',
    revenue: 'M12 3v18M17 7.5c-.8-1-2.2-1.6-4.1-1.6-2.3 0-3.9 1-3.9 2.7 0 4.2 8.5 1.7 8.5 6 0 1.9-1.8 3.4-4.7 3.4-2.2 0-4-.8-5.1-2.2',
    clock: 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    payment: 'M4 7h16v10H4V7Zm0 3h16M7 15h4',
    warning: 'M12 4 3 20h18L12 4Zm0 5v5m0 3h.01',
    empty: 'M4 7h16M6 7v12h12V7M9 11h6M10 15h4'
  };

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-7 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
        <DashboardIcon type="empty" />
      </div>
      <p className="mt-4 font-semibold text-navy">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function SectionCard({ title, description, children, action }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-navy">{title}</h3>
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
    <Link to={to} className="w-fit rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-navy transition hover:border-gold hover:bg-gold/10">
      {label}
    </Link>
  );
}

function getShippingAddressText(address = {}) {
  return [address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ') || '--';
}

function OrderDetailPanel({ order, loading, updating, confirmingPayment, onUpdateStatus, onConfirmPayment }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-block h-16" />
        ))}
      </div>
    );
  }

  if (!order) {
    return <div className="state-empty">Chưa có dữ liệu chi tiết đơn hàng.</div>;
  }

  const nextAction = getNextOrderAction(order);
  const workflowNote = getWorkflowNote(order);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <h4 className="text-base font-semibold text-navy">Khách hàng</h4>
          <p className="mt-3"><span className="font-semibold text-navy">Tên:</span> {order.user?.fullName || order.shippingAddress?.fullName || '--'}</p>
          <p className="mt-2"><span className="font-semibold text-navy">Email:</span> {order.user?.email || '--'}</p>
          <p className="mt-2"><span className="font-semibold text-navy">Điện thoại:</span> {order.shippingAddress?.phone || '--'}</p>
          <p className="mt-2"><span className="font-semibold text-navy">Địa chỉ:</span> {getShippingAddressText(order.shippingAddress)}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <h4 className="text-base font-semibold text-navy">Thông tin đơn</h4>
          <p className="mt-3"><span className="font-semibold text-navy">Mã đơn:</span> #{getOrderCode(order)}</p>
          <p className="mt-2"><span className="font-semibold text-navy">Ngày đặt:</span> {formatDateTime(order.createdAt)}</p>
          <p className="mt-2"><span className="font-semibold text-navy">Phương thức:</span> {getPaymentMethodLabel(order.paymentMethod)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge label={getPaymentStatusLabel(order.paymentStatus, order.isPaid)} tone={getPaymentTone(order.paymentStatus, order.isPaid)} />
            <StatusBadge label={getOrderStatusLabel(order.status)} tone={getOrderStatusTone(order.status)} />
          </div>
        </div>
      </div>

      {order.paymentMethod === 'bank_transfer' ? (
        <div className="rounded-2xl border border-[#e8dcc0] bg-[#fff9ec] p-4 text-sm text-slate-600">
          <h4 className="text-base font-semibold text-navy">Thanh toán chuyển khoản</h4>
          <div className="mt-3 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
            {order.bankTransferQrUrl ? (
              <img src={order.bankTransferQrUrl} alt={`QR thanh toán ${getOrderCode(order)}`} className="h-40 w-40 rounded-2xl border border-slate-200 bg-white object-contain p-2" />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">Chưa có QR thanh toán.</div>
            )}
            <div>
              <p><span className="font-semibold text-navy">Ngân hàng:</span> {order.bankTransferBankName || '--'}</p>
              <p className="mt-2"><span className="font-semibold text-navy">Số tài khoản:</span> {order.bankTransferAccountNumber || '--'}</p>
              <p className="mt-2"><span className="font-semibold text-navy">Chủ tài khoản:</span> {order.bankTransferAccountName || '--'}</p>
              <p className="mt-2"><span className="font-semibold text-navy">Nội dung:</span> {order.bankTransferContent || getOrderCode(order)}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-base font-semibold text-navy">Xử lý đơn hàng</h4>
            <p className="mt-1 text-sm text-slate-500">Trạng thái hiện tại của đơn và bước xử lý kế tiếp.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={getOrderStatusLabel(order.status)} tone={getOrderStatusTone(order.status)} />
            <StatusBadge label={getPaymentStatusLabel(order.paymentStatus, order.isPaid)} tone={getPaymentTone(order.paymentStatus, order.isPaid)} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Trạng thái đơn hàng</p>
            <div className="mt-3">
              <StatusBadge label={getOrderStatusLabel(order.status)} tone={getOrderStatusTone(order.status)} />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Thanh toán</p>
            <div className="mt-3">
              <StatusBadge label={getPaymentStatusLabel(order.paymentStatus, order.isPaid)} tone={getPaymentTone(order.paymentStatus, order.isPaid)} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {workflowNote || nextAction?.description || 'Đơn hiện không còn bước xử lý tiếp theo.'}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          {canConfirmBankTransferPayment(order) ? (
            <button type="button" onClick={onConfirmPayment} disabled={confirmingPayment} className="btn-secondary">
              {confirmingPayment ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
            </button>
          ) : null}
          <button type="button" onClick={() => onUpdateStatus(nextAction?.status)} disabled={updating || !nextAction} className="btn-outline">
            {updating ? 'Đang cập nhật...' : (nextAction?.label || 'Không có bước tiếp theo')}
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-base font-semibold text-navy">Sản phẩm</h4>
        <div className="mt-3 space-y-3">
          {(order.items || []).map((item, index) => {
            const imageUrl = getPublicAssetUrl(item.image || item.product?.images?.[0]);

            return (
              <article key={`${item.product?._id || item.name}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {imageUrl ? <img src={imageUrl} alt={item.name || item.productName} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{item.name || item.productName || item.product?.name || '--'}</p>
                  <p className="mt-1 text-sm text-slate-500">SL: {item.quantity} {item.selectedSize ? `· Size: ${item.selectedSize}` : ''}</p>
                </div>
                <p className="font-semibold text-slate-700">{formatCurrency((item.price || 0) * (item.quantity || 0))}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <div className="flex justify-between gap-3"><span>Tạm tính</span><span className="font-semibold text-navy">{formatCurrency(order.totalBeforeDiscount)}</span></div>
        <div className="mt-2 flex justify-between gap-3"><span>Giảm giá</span><span className="font-semibold text-emerald-700">-{formatCurrency(order.discountAmount)}</span></div>
        <div className="mt-2 flex justify-between gap-3"><span>Phí vận chuyển</span><span className="font-semibold text-navy">{order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'Miễn phí'}</span></div>
        <div className="mt-3 flex justify-between gap-3 border-t border-slate-200 pt-3 text-base"><span className="font-semibold text-navy">Tổng tiền</span><span className="font-bold text-navy">{formatCurrency(order.totalPrice)}</span></div>
      </div>
    </div>
  );
}

function RevenueChart({ data = [], selectedMonth, onSelectMonth }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue || 0), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-[210px] items-end gap-2 overflow-x-auto pb-2">
        {data.map((item) => {
          const hasRevenue = item.revenue > 0;
          const height = hasRevenue ? Math.max(18, Math.round(((item.revenue || 0) / maxRevenue) * 145)) : 8;
          const isSelected = item.month === selectedMonth;

          return (
            <div key={item.month} className="flex min-w-[52px] flex-1 flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectMonth(item.month)}
                className={`group flex h-[175px] w-full items-end rounded-2xl border px-2 pb-2 transition ${
                  isSelected ? 'border-gold bg-white shadow-[0_12px_26px_rgba(212,175,55,0.18)]' : 'border-transparent bg-white/70 hover:border-slate-200'
                }`}
                title={`Tháng ${item.month}: ${formatCurrency(item.revenue || 0)}`}
              >
                <div
                  className={`relative w-full rounded-t-xl transition ${isSelected ? 'bg-gold' : hasRevenue ? 'bg-navy/80 group-hover:bg-navy' : 'bg-slate-300'}`}
                  style={{ height: `${height}px` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-navy shadow-sm">
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
  );
}

function DailyRevenueChart({ month, data = [], selectedDay, onSelectDay, onOpenDayOrders }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue || 0), 1);
  const selectedMetric = data.find((item) => item.day === selectedDay) || data[0] || { day: 1, revenue: 0, orders: 0 };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-navy">Doanh thu theo ngày - Tháng {month}</h4>
          <p className="mt-1 text-sm text-slate-500">Click để xem nhanh, double click để lọc đơn hàng theo ngày.</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Ngày {selectedMetric.day}</p>
          <p className="mt-1 font-bold text-navy">{formatCurrency(selectedMetric.revenue || 0)}</p>
          <p className="text-xs text-slate-500">{selectedMetric.orders || 0} đơn hợp lệ</p>
        </div>
      </div>

      <div className="mt-5 flex h-[200px] items-end gap-1.5 overflow-x-auto pb-2">
        {data.map((item) => {
          const hasRevenue = item.revenue > 0;
          const height = hasRevenue ? Math.max(16, Math.round(((item.revenue || 0) / maxRevenue) * 132)) : 7;
          const isSelected = item.day === selectedDay;

          return (
            <div key={item.day} className="flex min-w-[34px] flex-1 flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectDay(item.day)}
                onDoubleClick={() => onOpenDayOrders(item.day)}
                className={`group flex h-[160px] w-full items-end rounded-xl border px-1.5 pb-1.5 transition ${
                  isSelected ? 'border-navy/30 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.12)]' : 'border-transparent bg-white/70 hover:border-slate-200'
                }`}
                title={`Ngày ${item.day}: ${formatCurrency(item.revenue || 0)} - ${item.orders || 0} đơn hợp lệ`}
              >
                <div
                  className={`relative w-full rounded-t-lg transition ${isSelected ? 'bg-navy' : hasRevenue ? 'bg-gold/85 group-hover:bg-gold' : 'bg-slate-300'}`}
                  style={{ height: `${height}px` }}
                >
                  <span className={`absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold ${hasRevenue ? 'text-navy' : 'text-slate-400'}`}>
                    {formatShortCurrency(item.revenue)}
                  </span>
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
  const currentDate = new Date();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartYear, setChartYear] = useState(currentDate.getFullYear());
  const [selectedRevenueMonth, setSelectedRevenueMonth] = useState(currentDate.getMonth() + 1);
  const [selectedRevenueDay, setSelectedRevenueDay] = useState(currentDate.getDate());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage('');
        const dashboardResponse = await getAdminDashboard(token, { year: chartYear });

        if (isMounted) {
          setDashboard(dashboardResponse);
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

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [chartYear, token]);

  const selectedDailyRevenue = useMemo(() => {
    return dashboard?.revenueByDay?.find((item) => item.month === selectedRevenueMonth)?.days || [];
  }, [dashboard?.revenueByDay, selectedRevenueMonth]);

  function handleSelectRevenueMonth(month) {
    setSelectedRevenueMonth(month);
    setSelectedRevenueDay(1);
  }

  function openOrdersByRevenueDay(day) {
    const date = `${chartYear}-${String(selectedRevenueMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    navigate(`/admin/orders?dateMode=completed-day&date=${date}&scrollTop=1`);
  }

  async function openDashboardOrderDetail(orderId) {
    try {
      setDetailOpen(true);
      setLoadingDetail(true);
      setSelectedOrder(null);
      setErrorMessage('');
      const response = await getOrderDetail(orderId, token);
      setSelectedOrder(response.order || null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeDashboardOrderDetail() {
    setDetailOpen(false);
    setSelectedOrder(null);
  }

  async function refreshDashboardSnapshot() {
    const dashboardResponse = await getAdminDashboard(token, { year: chartYear });
    setDashboard(dashboardResponse);
    setLastUpdated(new Date());
  }

  function mergeDashboardOrder(updatedOrder) {
    setSelectedOrder(updatedOrder);
    setDashboard((current) => {
      if (!current) return current;

      const patchOrder = (order) => (order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order);

      return {
        ...current,
        recentOrders: (current.recentOrders || []).map(patchOrder),
        pendingBankTransferOrders: (current.pendingBankTransferOrders || [])
          .map(patchOrder)
          .filter((order) => order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && order.status !== 'cancelled')
      };
    });
  }

  async function handleDashboardUpdateOrder(nextStatus) {
    if (!selectedOrder || !nextStatus) return;

    try {
      setUpdatingOrder(true);
      setErrorMessage('');
      const response = await updateOrderStatus(selectedOrder._id, { status: nextStatus }, token);
      mergeDashboardOrder(response.order);
      await refreshDashboardSnapshot();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.');
    } finally {
      setUpdatingOrder(false);
    }
  }

  async function handleDashboardConfirmPayment() {
    if (!selectedOrder) return;

    try {
      setConfirmingPayment(true);
      setErrorMessage('');
      const response = await confirmOrderPayment(selectedOrder._id, token);
      mergeDashboardOrder(response.order);
      await refreshDashboardSnapshot();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể xác nhận thanh toán.');
    } finally {
      setConfirmingPayment(false);
    }
  }

  const stats = [
    {
      label: 'Tổng sản phẩm',
      value: dashboard?.stats?.totalProducts ?? 0,
      note: 'Tất cả sản phẩm trong hệ thống',
      icon: 'product',
      accent: 'bg-blue-50 text-blue-700 ring-blue-100',
      to: '/admin/products'
    },
    {
      label: 'Đơn hàng tháng này',
      value: dashboard?.stats?.monthlyOrders ?? 0,
      note: 'Đơn được tạo trong tháng hiện tại',
      icon: 'order',
      accent: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
      to: '/admin/orders'
    },
    {
      label: 'Doanh thu tháng này',
      value: formatCurrency(dashboard?.stats?.monthlyRevenue ?? 0),
      note: 'Theo ngày hoàn thành đơn; chuyển khoản phải đã thanh toán',
      icon: 'revenue',
      accent: 'bg-gold/10 text-[#9a761e] ring-gold/20',
      to: '/admin/orders'
    },
    {
      label: 'Đơn chờ xử lý',
      value: dashboard?.stats?.pendingOrders ?? 0,
      note: 'Đơn pending/confirmed cần xử lý',
      icon: 'clock',
      accent: 'bg-amber-50 text-amber-700 ring-amber-100',
      to: '/admin/orders'
    },
    {
      label: 'Đơn hoàn thành tháng này',
      value: dashboard?.stats?.monthlyCompletedOrders ?? 0,
      note: 'Đơn có status completed trong tháng',
      icon: 'payment',
      accent: 'bg-sky-50 text-sky-700 ring-sky-100',
      to: '/admin/orders'
    },
    {
      label: 'Sản phẩm sắp hết hàng',
      value: dashboard?.stats?.lowStockProductsCount ?? 0,
      note: `Tồn kho <= ${dashboard?.stats?.lowStockThreshold ?? 10}`,
      icon: 'warning',
      accent: 'bg-red-50 text-red-700 ring-red-100',
      to: '/admin/products'
    }
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">Tổng quan</p>
            <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Dashboard quản trị</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Theo dõi nhanh tình trạng bán hàng, đơn hàng cần xử lý và tồn kho thấp.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {loading ? 'Đang tải dữ liệu...' : `Cập nhật: ${formatDateTime(lastUpdated)}`}
          </div>
        </div>
      </div>

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_18px_44px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">{item.label}</p>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${item.accent}`}>
                <DashboardIcon type={item.icon} />
              </span>
            </div>
            <p className="mt-4 break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {loading ? '--' : item.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.note}</p>
          </Link>
        ))}
      </div>

      <SectionCard
        title="Biểu đồ doanh thu"
        description="Doanh thu tính theo ngày hoàn thành đơn: COD hoàn thành, chuyển khoản hoàn thành và đã thanh toán."
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
          <div className="space-y-4">
            <RevenueChart data={dashboard?.revenueByMonth || []} selectedMonth={selectedRevenueMonth} onSelectMonth={handleSelectRevenueMonth} />
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

      <SectionCard title="Đơn hàng mới nhất" description="5 đơn vừa phát sinh để admin xử lý nhanh." action={<ViewAllLink to="/admin/orders" />}>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton-block h-16" />
            ))}
          </div>
        ) : !dashboard?.recentOrders?.length ? (
          <EmptyState title="Chưa có đơn hàng" description="Khi khách đặt hàng, 5 đơn mới nhất sẽ hiển thị tại đây." />
        ) : (
          <DataTable
            columns={[
              { key: 'order', label: 'Mã đơn' },
              { key: 'customer', label: 'Khách hàng' },
              { key: 'total', label: 'Tổng tiền' },
              { key: 'method', label: 'Thanh toán' },
              { key: 'payment', label: 'Trạng thái tiền' },
              { key: 'status', label: 'Trạng thái đơn' },
              { key: 'date', label: 'Ngày đặt' },
              { key: 'action', label: 'Chi tiết', align: 'right' }
            ]}
          >
            {dashboard.recentOrders.slice(0, 5).map((order) => (
              <tr key={order._id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold text-navy">#{getOrderCode(order)}</td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-700">{order.user?.fullName || order.shippingAddress?.fullName || '--'}</p>
                  <p className="mt-1 text-slate-500">{order.user?.email || order.shippingAddress?.phone || '--'}</p>
                </td>
                <td className="px-5 py-4 font-semibold text-slate-700">{formatCurrency(order.totalPrice)}</td>
                <td className="px-5 py-4 text-slate-600">{getPaymentMethodLabel(order.paymentMethod)}</td>
                <td className="px-5 py-4">
                  <StatusBadge label={getPaymentStatusLabel(order.paymentStatus, order.isPaid)} tone={getPaymentTone(order.paymentStatus, order.isPaid)} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge label={getOrderStatusLabel(order.status)} tone={getOrderStatusTone(order.status)} />
                </td>
                <td
                  className="cursor-pointer px-5 py-4 text-slate-500 transition hover:text-gold"
                  title="Double click để lọc đơn hàng theo ngày này"
                  onDoubleClick={() => navigate(`/admin/orders?date=${formatDateQuery(order.createdAt)}&scrollTop=1`)}
                >
                  {formatDateTime(order.createdAt)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button type="button" onClick={() => openDashboardOrderDetail(order._id)} className="btn-outline !px-4 !py-2">
                    Xem
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <SectionCard title="Đơn chờ xác nhận thanh toán" description="Các đơn chuyển khoản có paymentStatus = pending." action={<ViewAllLink to="/admin/orders" />}>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton-block h-16" />
              ))}
            </div>
          ) : !dashboard?.pendingBankTransferOrders?.length ? (
            <EmptyState title="Không có đơn chờ xác nhận" description="Các đơn chuyển khoản pending sẽ xuất hiện ở khu vực này." />
          ) : (
            <DataTable
              columns={[
                { key: 'order', label: 'Mã đơn' },
                { key: 'total', label: 'Tổng tiền' },
                { key: 'content', label: 'Nội dung chuyển khoản' },
                { key: 'date', label: 'Ngày đặt' },
                { key: 'action', label: 'Chi tiết', align: 'right' }
              ]}
            >
              {dashboard.pendingBankTransferOrders.map((order) => (
                <tr key={order._id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-navy">#{getOrderCode(order)}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{formatCurrency(order.totalPrice)}</td>
                  <td className="px-5 py-4 text-slate-600">{order.bankTransferContent || getOrderCode(order)}</td>
                  <td className="px-5 py-4 text-slate-500">{formatDateTime(order.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button type="button" onClick={() => openDashboardOrderDetail(order._id)} className="btn-outline !px-4 !py-2">
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </SectionCard>

        <SectionCard title="Sản phẩm sắp hết hàng" description={`Hiển thị 5 sản phẩm tồn kho <= ${dashboard?.stats?.lowStockThreshold ?? 10}.`} action={<ViewAllLink to="/admin/products" />}>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton-block h-20" />
              ))}
            </div>
          ) : !dashboard?.lowStockProducts?.length ? (
            <EmptyState title="Tồn kho ổn định" description="Hiện chưa có sản phẩm nào chạm ngưỡng sắp hết hàng." />
          ) : (
            <div className="space-y-3">
              {dashboard.lowStockProducts.slice(0, 5).map((product) => (
                <Link key={product._id} to="/admin/products" className="block rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-gold/50 hover:bg-white">
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
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{product.sku || '--'}</p>
                      <p className="mt-1 truncate font-semibold text-navy">{product.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Tồn: {product.stock}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{formatCurrency(product.price)}</span>
                        <span className="text-xs font-bold text-gold">Xem/Sửa</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <AdminModal
        open={detailOpen}
        title="Chi tiết đơn hàng"
        description={selectedOrder ? `Đơn #${getOrderCode(selectedOrder)}` : 'Đang tải thông tin đơn hàng'}
        onClose={closeDashboardOrderDetail}
        width="max-w-5xl"
      >
        <OrderDetailPanel
          order={selectedOrder}
          loading={loadingDetail}
          updating={updatingOrder}
          confirmingPayment={confirmingPayment}
          onUpdateStatus={handleDashboardUpdateOrder}
          onConfirmPayment={handleDashboardConfirmPayment}
        />
      </AdminModal>
    </section>
  );
}

export default AdminDashboardPage;
