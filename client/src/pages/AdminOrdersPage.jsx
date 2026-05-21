import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminModal from '../components/admin/AdminModal.jsx';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import FilterBar from '../components/admin/FilterBar.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { confirmOrderPayment, getOrderDetail, getOrders, getPublicAssetUrl, updateOrderStatus } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

const statusOptions = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
const AUTO_REFRESH_INTERVAL_MS = 5000;
const ORDERS_PER_PAGE = 20;

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

function formatDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getStatusTone(status) {
  const map = {
    pending: 'warning',
    confirmed: 'info',
    shipping: 'accent',
    completed: 'success',
    cancelled: 'danger'
  };

  return map[status] || 'neutral';
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };

  return labels[status] || status || '--';
}

function getPaymentMethodLabel(method) {
  const labels = {
    cod: 'COD',
    bank_transfer: 'Chuyển khoản',
    credit_card: 'Thẻ tín dụng',
    momo: 'MoMo'
  };

  return labels[method] || method || '--';
}

function getPaymentStatusLabel(order) {
  if (!order?.orderCode) {
    return 'Đã thanh toán';
  }

  const labels = {
    unpaid: 'Chưa thanh toán',
    pending: 'Chờ xác nhận',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán lỗi'
  };

  return labels[order.paymentStatus] || (order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán');
}

function getPaymentTone(order) {
  if (!order?.orderCode) return 'success';
  if (order.paymentStatus === 'paid' || order.isPaid) return 'success';
  if (order.paymentStatus === 'failed') return 'danger';
  return 'warning';
}

function getDisplayOrderCode(order) {
  return order?.orderCode || order?._id?.slice(-6).toUpperCase() || '--';
}

function canShowBankTransferPayment(order) {
  return Boolean(order?.orderCode) && order.paymentMethod === 'bank_transfer';
}

function canConfirmBankTransferPayment(order) {
  return canShowBankTransferPayment(order) && order.paymentStatus !== 'paid' && !order.isPaid;
}

function sortOrdersNewestFirst(items = []) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

function AdminOrdersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDateFilter = searchParams.get('date') || '';
  const initialMonthFilter = searchParams.get('month') || '';
  const initialDateFilterMode = searchParams.get('dateMode') || (initialDateFilter ? 'order-day' : initialMonthFilter ? 'order-month' : '');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState(initialDateFilterMode);
  const [dayFilter, setDayFilter] = useState(initialDateFilter);
  const [monthFilter, setMonthFilter] = useState(initialMonthFilter);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusValue, setStatusValue] = useState('pending');
  const [updating, setUpdating] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword = keyword
        ? [order._id, order.orderCode, order.user?.fullName, order.user?.email, order.shippingAddress?.fullName, order.shippingAddress?.phone]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(keyword))
        : true;
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const orderDay = formatDateInput(order.createdAt);
      const orderMonth = formatMonthInput(order.createdAt);
      const completedDay = formatDateInput(order.completedAt);
      const completedMonth = formatMonthInput(order.completedAt);
      const matchesDate =
        dateFilterMode === 'order-day'
          ? dayFilter
            ? orderDay === dayFilter
            : true
          : dateFilterMode === 'order-month'
            ? monthFilter
              ? orderMonth === monthFilter
              : true
            : dateFilterMode === 'completed-day'
              ? dayFilter
                ? completedDay === dayFilter
                : true
              : dateFilterMode === 'completed-month'
                ? monthFilter
                  ? completedMonth === monthFilter
                  : true
            : true;

      return matchesKeyword && matchesStatus && matchesDate;
    });
  }, [orders, searchKeyword, statusFilter, dateFilterMode, dayFilter, monthFilter]);

  const totalPages = Math.max(Math.ceil(filteredOrders.length / ORDERS_PER_PAGE), 1);
  const paginatedOrders = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [currentPage, filteredOrders, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, statusFilter, dateFilterMode, dayFilter, monthFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const nextParams = {};
    if (dateFilterMode) {
      nextParams.dateMode = dateFilterMode;
    }
    if ((dateFilterMode === 'order-day' || dateFilterMode === 'completed-day') && dayFilter) {
      nextParams.date = dayFilter;
    }
    if ((dateFilterMode === 'order-month' || dateFilterMode === 'completed-month') && monthFilter) {
      nextParams.month = monthFilter;
    }
    setSearchParams(nextParams, { replace: true });
  }, [dateFilterMode, dayFilter, monthFilter, setSearchParams]);

  function handleDateModeChange(value) {
    setDateFilterMode(value);
    if (value !== 'order-day' && value !== 'completed-day') setDayFilter('');
    if (value !== 'order-month' && value !== 'completed-month') setMonthFilter('');
  }

  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const response = await getOrders(token);
        const sortedOrders = sortOrdersNewestFirst(response.orders || []);

        setErrorMessage('');
        setOrders(sortedOrders);
      } catch (error) {
        if (!silent) {
          setErrorMessage(error.response?.data?.message || 'Không thể tải đơn hàng.');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    fetchOrders();

    const intervalId = globalThis.setInterval(() => {
      fetchOrders({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [fetchOrders]);

  async function openOrderDetail(orderId) {
    try {
      setLoadingDetail(true);
      setDetailOpen(true);
      const response = await getOrderDetail(orderId, token);
      const order = response.order;
      setSelectedOrder(order);
      setStatusValue(order.status || 'pending');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleUpdateOrder() {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const response = await updateOrderStatus(selectedOrder._id, { status: statusValue }, token);
      setSelectedOrder(response.order);
      setOrders((current) => current.map((item) => (item._id === response.order._id ? { ...item, ...response.order } : item)));
      showToast({ title: 'Đã cập nhật đơn hàng', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể cập nhật đơn hàng.');
      showToast({ title: 'Cập nhật đơn hàng thất bại', type: 'error' });
    } finally {
      setUpdating(false);
    }
  }

  async function handleConfirmPayment() {
    if (!selectedOrder) return;

    try {
      setConfirmingPayment(true);
      const response = await confirmOrderPayment(selectedOrder._id, token);
      setSelectedOrder(response.order);
      setStatusValue(response.order.status || 'confirmed');
      setOrders((current) => current.map((item) => (item._id === response.order._id ? { ...item, ...response.order } : item)));
      showToast({ title: 'Đã xác nhận thanh toán', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể xác nhận thanh toán.');
      showToast({ title: 'Xác nhận thanh toán thất bại', type: 'error' });
    } finally {
      setConfirmingPayment(false);
    }
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Đơn hàng"
        title="Quản lý đơn hàng"
        description=""
        meta={loading ? 'Đang tải đơn hàng...' : `${filteredOrders.length} đơn hàng`}
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <FilterBar>
        <input value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="Tìm mã đơn, tên, email..." className="input-field sm:max-w-sm" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel(status)}
            </option>
          ))}
        </select>
        <select value={dateFilterMode} onChange={(event) => handleDateModeChange(event.target.value)} className="select-field sm:w-56">
          <option value="">Theo mặc định</option>
          <option value="order-day">Ngày đặt hàng</option>
          <option value="order-month">Theo tháng đặt hàng</option>
          <option value="completed-day">Theo ngày hoàn thành</option>
          <option value="completed-month">Theo tháng hoàn thành</option>
        </select>
        {(dateFilterMode === 'order-day' || dateFilterMode === 'completed-day') ? (
          <input type="date" value={dayFilter} onChange={(event) => setDayFilter(event.target.value)} className="input-field sm:w-56" />
        ) : null}
        {(dateFilterMode === 'order-month' || dateFilterMode === 'completed-month') ? (
          <input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="input-field sm:w-56" />
        ) : null}
      </FilterBar>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-block h-20" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="state-empty">Chưa có đơn hàng phù hợp.</div>
      ) : (
        <>
          <DataTable
            columns={[
              { key: 'order', label: 'Mã đơn' },
              { key: 'customer', label: 'Khách hàng' },
              { key: 'total', label: 'Tổng tiền' },
              { key: 'status', label: 'Trạng thái' },
              { key: 'date', label: 'Ngày đặt' },
              { key: 'completedAt', label: 'Hoàn thành' },
              { key: 'actions', label: 'Hành động', align: 'right' }
            ]}
          >
            {paginatedOrders.map((order) => (
              <tr key={order._id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-semibold text-navy">#{getDisplayOrderCode(order)}</td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-700">{order.user?.fullName || order.shippingAddress?.fullName || '--'}</p>
                  <p className="mt-1 text-slate-500">{order.user?.email || '--'}</p>
                </td>
                <td className="px-5 py-4 text-slate-600">{formatCurrency(order.totalPrice)}</td>
                <td className="px-5 py-4">
                  <StatusBadge label={getStatusLabel(order.status)} tone={getStatusTone(order.status)} />
                </td>
                <td className="px-5 py-4 text-slate-500">{formatDateTime(order.createdAt)}</td>
                <td className="px-5 py-4 text-slate-500">{formatDateTime(order.completedAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => openOrderDetail(order._id)} className="btn-outline !px-4 !py-2">
                      Xem chi tiết
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>

          {filteredOrders.length > ORDERS_PER_PAGE ? (
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Trang <span className="font-semibold text-navy">{currentPage}</span> / <span className="font-semibold text-navy">{totalPages}</span>
                {' '}· Hiển thị <span className="font-semibold text-navy">{paginatedOrders.length}</span> / <span className="font-semibold text-navy">{filteredOrders.length}</span> đơn
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="btn-outline !px-4 !py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trang trước
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
                  .map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                        pageNumber === currentPage
                          ? 'bg-navy text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                          : 'border border-slate-200 text-navy hover:border-gold hover:bg-[#fff8eb]'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  className="btn-outline !px-4 !py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trang sau
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <AdminModal open={detailOpen} title="Chi tiết đơn hàng" description={selectedOrder ? `Đơn #${getDisplayOrderCode(selectedOrder)}` : ''} onClose={() => setDetailOpen(false)} width="max-w-5xl">
        {loadingDetail ? (
          <div className="space-y-3">
            <div className="skeleton-block h-24" />
            <div className="skeleton-block h-32" />
            <div className="skeleton-block h-48" />
          </div>
        ) : !selectedOrder ? (
          <div className="state-empty">Không có dữ liệu đơn hàng.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p><span className="font-semibold text-navy">Mã đơn:</span> #{getDisplayOrderCode(selectedOrder)}</p>
                <p><span className="font-semibold text-navy">Khách hàng:</span> {selectedOrder.user?.fullName || selectedOrder.shippingAddress?.fullName}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Email:</span> {selectedOrder.user?.email || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Điện thoại:</span> {selectedOrder.shippingAddress?.phone || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Địa chỉ:</span> {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.ward, selectedOrder.shippingAddress?.district, selectedOrder.shippingAddress?.addressLine].filter(Boolean).join(', ')}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Phương thức:</span> {getPaymentMethodLabel(selectedOrder.paymentMethod)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Trạng thái đơn:</span> {getStatusLabel(selectedOrder.status)}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p><span className="font-semibold text-navy">Tạm tính:</span> {formatCurrency(selectedOrder.totalBeforeDiscount)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Mã giảm giá:</span> {selectedOrder.couponCode || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Tiền giảm:</span> -{formatCurrency(selectedOrder.discountAmount)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Tổng tiền:</span> {formatCurrency(selectedOrder.totalPrice)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Ngày đặt:</span> {formatDateTime(selectedOrder.createdAt)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Ngày hoàn thành:</span> {formatDateTime(selectedOrder.completedAt)}</p>
              </div>
            </div>

            {canShowBankTransferPayment(selectedOrder) ? (
              <div className="rounded-[24px] border border-[#e8dcc0] bg-[#fff9ec] p-4">
                <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
                  {selectedOrder.bankTransferQrUrl ? (
                    <img
                      src={selectedOrder.bankTransferQrUrl}
                      alt={`QR thanh toán ${getDisplayOrderCode(selectedOrder)}`}
                      className="mx-auto h-[260px] w-[260px] rounded-2xl border border-slate-200 bg-white object-contain p-3 lg:h-[280px] lg:w-[280px]"
                    />
                  ) : null}
                  <div className="text-sm text-slate-600">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-base font-semibold text-navy">Thanh toán chuyển khoản</h4>
                      <StatusBadge label={getPaymentStatusLabel(selectedOrder)} tone={getPaymentTone(selectedOrder)} />
                    </div>
                    <p className="mt-2"><span className="font-semibold text-navy">Ngân hàng:</span> {selectedOrder.bankTransferBankName || 'Techcombank'}</p>
                    <p className="mt-2"><span className="font-semibold text-navy">Số tài khoản:</span> {selectedOrder.bankTransferAccountNumber || 'YOUR_TECHCOMBANK_ACCOUNT'}</p>
                    <p className="mt-2"><span className="font-semibold text-navy">Chủ tài khoản:</span> {selectedOrder.bankTransferAccountName || 'YOUR_ACCOUNT_NAME'}</p>
                    <p className="mt-2"><span className="font-semibold text-navy">Số tiền:</span> {formatCurrency(selectedOrder.totalPrice)}</p>
                    <p className="mt-2"><span className="font-semibold text-navy">Nội dung:</span> {selectedOrder.bankTransferContent || getDisplayOrderCode(selectedOrder)}</p>
                    {selectedOrder.paidAt ? (
                      <p className="mt-2"><span className="font-semibold text-navy">Ngày thanh toán:</span> {formatDateTime(selectedOrder.paidAt)}</p>
                    ) : null}
                    {canConfirmBankTransferPayment(selectedOrder) ? (
                      <button type="button" onClick={handleConfirmPayment} disabled={confirmingPayment} className="btn-secondary mt-4">
                        {confirmingPayment ? 'Đang xác nhận...' : 'Xác nhận đã thanh toán'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[24px] border border-slate-200 p-4">
              <h4 className="text-base font-semibold text-navy">Cập nhật trạng thái</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="field-label">Trạng thái đơn hàng</span>
                  <select value={statusValue} onChange={(event) => setStatusValue(event.target.value)} className="select-field">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleUpdateOrder} disabled={updating} className="btn-secondary">
                  {updating ? 'Đang cập nhật...' : 'Lưu trạng thái'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-navy">Sản phẩm trong đơn</h4>
              {selectedOrder.items.map((item, index) => (
                <article key={`${item.product?._id || item.name}-${index}`} className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 sm:grid-cols-[72px_minmax(0,1fr)]">
                  <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {(item.image || item.product?.images?.[0]) ? <img src={getPublicAssetUrl(item.image || item.product?.images?.[0])} alt={item.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-navy">{item.name}</p>
                    <p className="mt-1">Số lượng: {item.quantity}</p>
                    {item.selectedSize ? <p className="mt-1">Size: {item.selectedSize}</p> : null}
                    <p className="mt-1 font-semibold text-navy">{formatCurrency(item.price)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </AdminModal>
    </section>
  );
}

export default AdminOrdersPage;
