import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminModal from '../components/admin/AdminModal.jsx';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import FilterBar from '../components/admin/FilterBar.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getOrderDetail, getOrders, getPublicAssetUrl, updateOrderStatus } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

const statusOptions = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

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

function AdminOrdersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDateFilter = searchParams.get('date') || '';
  const initialMonthFilter = searchParams.get('month') || '';
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState(initialDateFilter ? 'day' : initialMonthFilter ? 'month' : '');
  const [dayFilter, setDayFilter] = useState(initialDateFilter);
  const [monthFilter, setMonthFilter] = useState(initialMonthFilter);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusValue, setStatusValue] = useState('pending');
  const [isPaidValue, setIsPaidValue] = useState(false);
  const [updating, setUpdating] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword = keyword
        ? [order._id, order.user?.fullName, order.user?.email, order.shippingAddress?.fullName, order.shippingAddress?.phone]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(keyword))
        : true;
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const orderDay = formatDateInput(order.createdAt);
      const orderMonth = formatMonthInput(order.createdAt);
      const matchesDate =
        dateFilterMode === 'day'
          ? dayFilter
            ? orderDay === dayFilter
            : true
          : dateFilterMode === 'month'
            ? monthFilter
              ? orderMonth === monthFilter
              : true
            : true;

      return matchesKeyword && matchesStatus && matchesDate;
    });
  }, [orders, searchKeyword, statusFilter, dateFilterMode, dayFilter, monthFilter]);

  useEffect(() => {
    const nextParams = {};
    if (dateFilterMode === 'day' && dayFilter) {
      nextParams.date = dayFilter;
    }
    if (dateFilterMode === 'month' && monthFilter) {
      nextParams.month = monthFilter;
    }
    setSearchParams(nextParams, { replace: true });
  }, [dateFilterMode, dayFilter, monthFilter, setSearchParams]);

  function handleDateModeChange(value) {
    setDateFilterMode(value);
    if (value !== 'day') setDayFilter('');
    if (value !== 'month') setMonthFilter('');
  }

  function clearDateFilter() {
    setDateFilterMode('');
    setDayFilter('');
    setMonthFilter('');
  }

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        const response = await getOrders(token);
        if (isMounted) setOrders(response.orders || []);
      } catch (error) {
        if (isMounted) setErrorMessage(error.response?.data?.message || 'Không thể tải đơn hàng.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [token]);

  async function openOrderDetail(orderId) {
    try {
      setLoadingDetail(true);
      setDetailOpen(true);
      const response = await getOrderDetail(orderId, token);
      const order = response.order;
      setSelectedOrder(order);
      setStatusValue(order.status || 'pending');
      setIsPaidValue(Boolean(order.isPaid));
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
      const response = await updateOrderStatus(selectedOrder._id, { status: statusValue, isPaid: isPaidValue }, token);
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

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Đơn hàng"
        title="Quản lý đơn hàng"
        description="Lọc theo trạng thái, xem chi tiết trong modal và cập nhật trạng thái xử lý mà không sửa tay tổng tiền."
        meta={loading ? 'Đang tải đơn hàng...' : `${filteredOrders.length} đơn hàng`}
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <FilterBar>
        <input value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="Tìm mã đơn, tên, email..." className="input-field sm:max-w-sm" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select value={dateFilterMode} onChange={(event) => handleDateModeChange(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Không lọc ngày</option>
          <option value="day">Theo ngày</option>
          <option value="month">Theo tháng</option>
        </select>
        {dateFilterMode === 'day' ? (
          <input type="date" value={dayFilter} onChange={(event) => setDayFilter(event.target.value)} className="input-field sm:max-w-xs" />
        ) : null}
        {dateFilterMode === 'month' ? (
          <input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="input-field sm:max-w-xs" />
        ) : null}
        {dateFilterMode ? (
          <button type="button" onClick={clearDateFilter} className="btn-outline !px-4 !py-3">
            Xóa lọc ngày
          </button>
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
        <DataTable
          columns={[
            { key: 'order', label: 'Mã đơn' },
            { key: 'customer', label: 'Khách hàng' },
            { key: 'total', label: 'Tổng tiền' },
            { key: 'payment', label: 'Thanh toán' },
            { key: 'status', label: 'Trạng thái' },
            { key: 'date', label: 'Ngày đặt' },
            { key: 'actions', label: 'Hành động', align: 'right' }
          ]}
        >
          {filteredOrders.map((order) => (
            <tr key={order._id} className="border-t border-slate-100">
              <td className="px-5 py-4 font-semibold text-navy">#{order._id.slice(-8).toUpperCase()}</td>
              <td className="px-5 py-4">
                <p className="font-medium text-slate-700">{order.user?.fullName || order.shippingAddress?.fullName || '--'}</p>
                <p className="mt-1 text-slate-500">{order.user?.email || '--'}</p>
              </td>
              <td className="px-5 py-4 text-slate-600">{formatCurrency(order.totalPrice)}</td>
              <td className="px-5 py-4">
                <StatusBadge label={order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'} tone={order.isPaid ? 'success' : 'warning'} />
              </td>
              <td className="px-5 py-4">
                <StatusBadge label={order.status} tone={getStatusTone(order.status)} />
              </td>
              <td className="px-5 py-4 text-slate-500">{formatDateTime(order.createdAt)}</td>
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
      )}

      <AdminModal open={detailOpen} title="Chi tiết đơn hàng" description={selectedOrder ? `Đơn #${selectedOrder._id.slice(-8).toUpperCase()}` : ''} onClose={() => setDetailOpen(false)} width="max-w-5xl">
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
                <p><span className="font-semibold text-navy">Khách hàng:</span> {selectedOrder.user?.fullName || selectedOrder.shippingAddress?.fullName}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Email:</span> {selectedOrder.user?.email || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Điện thoại:</span> {selectedOrder.shippingAddress?.phone || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Địa chỉ:</span> {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.ward, selectedOrder.shippingAddress?.district, selectedOrder.shippingAddress?.addressLine].filter(Boolean).join(', ')}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Thanh toán:</span> {selectedOrder.paymentMethod}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p><span className="font-semibold text-navy">Tạm tính:</span> {formatCurrency(selectedOrder.totalBeforeDiscount)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Mã giảm giá:</span> {selectedOrder.couponCode || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Tiền giảm:</span> -{formatCurrency(selectedOrder.discountAmount)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Tổng tiền:</span> {formatCurrency(selectedOrder.totalPrice)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Ngày đặt:</span> {formatDateTime(selectedOrder.createdAt)}</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 p-4">
              <h4 className="text-base font-semibold text-navy">Cập nhật trạng thái</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="field-label">Trạng thái đơn hàng</span>
                  <select value={statusValue} onChange={(event) => setStatusValue(event.target.value)} className="select-field">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 pt-9 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={isPaidValue} onChange={(event) => setIsPaidValue(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold" />
                  Đã thanh toán
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
