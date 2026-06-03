import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getMyOrders } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

const ORDERS_PER_PAGE = 8;

function formatDate(value) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
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

function getStatusBadgeClass(status) {
  const classes = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-sky-100 text-sky-700',
    shipping: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return classes[status] || 'bg-slate-100 text-slate-700';
}

function getPaymentLabel(isPaid) {
  return isPaid ? 'Đã thanh toán' : 'Chưa thanh toán';
}

function getPaymentStatusLabel(order) {
  if (order?.paymentMethod === 'cod') {
    return 'Thanh toán khi nhận hàng';
  }
  const labels = {
    unpaid: 'Chưa thanh toán',
    pending: 'Chờ xác nhận CK',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán lỗi'
  };

  return labels[order.paymentStatus] || getPaymentLabel(order.isPaid);
}

function getPaymentBadgeClass(order) {
  if (order?.paymentMethod === 'cod') {
    return 'bg-sky-100 text-sky-700';
  }

  if (order?.isPaid) {
    return 'bg-emerald-100 text-emerald-700';
  }

  return 'bg-amber-100 text-amber-700';
}

function getDisplayOrderCode(order) {
  return order?.orderCode || order?._id?.slice(-6).toUpperCase() || '--';
}

function MyOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      setError('');

      try {
        const response = await getMyOrders(token);
        const nextOrders = Array.isArray(response.orders) ? response.orders : [];
        setOrders(nextOrders);
        setCurrentPage(1);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [token]);

  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const paginatedOrders = orders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Tài Khoản</p>
        <h1 className="mt-3 text-3xl font-bold text-navy">Đơn hàng của tôi</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Theo dõi các đơn hàng đã đặt, trạng thái xử lý và tình trạng thanh toán theo giao diện rõ ràng hơn.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="surface-card p-6">
              <div className="skeleton-line h-5 w-36" />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="skeleton-line h-4 w-full" />
                <div className="skeleton-line h-4 w-full" />
                <div className="skeleton-line h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && error ? <div className="state-error">{error}</div> : null}

      {!isLoading && !error && orders.length === 0 ? (
        <div className="state-empty">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4d6] text-xl font-bold text-navy">
            JA
          </div>
          <h2 className="mt-4 text-xl font-semibold text-navy">Bạn chưa có đơn hàng nào</h2>
          <p className="mt-2">Hãy khám phá thêm sản phẩm để bắt đầu đơn hàng đầu tiên.</p>
          <Link to="/products" className="btn-secondary mt-6">
            Mua sắm ngay
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && orders.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#fff9ec]">
                <tr className="text-left text-sm text-navy">
                  <th className="px-5 py-4 font-semibold">Mã đơn</th>
                  <th className="px-5 py-4 font-semibold">Ngày đặt</th>
                  <th className="px-5 py-4 font-semibold">Tổng tiền</th>
                  <th className="px-5 py-4 font-semibold">Trạng thái</th>
                  <th className="px-5 py-4 font-semibold">Thanh toán</th>
                  <th className="px-5 py-4 font-semibold">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="border-t border-slate-200 text-sm text-slate-700 transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-navy">#{getDisplayOrderCode(order)}</td>
                    <td className="px-5 py-4">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-4 font-semibold text-navy">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(order)}`}>
                        {getPaymentStatusLabel(order)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/my-orders/${order._id}`} className="font-semibold text-navy underline-offset-2 hover:text-gold hover:underline">
                        Xem đơn
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Trang {currentPage}/{totalPages}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                      pageNumber === currentPage
                        ? 'bg-navy text-white'
                        : 'border border-slate-300 text-navy hover:border-gold hover:text-gold'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default MyOrdersPage;
