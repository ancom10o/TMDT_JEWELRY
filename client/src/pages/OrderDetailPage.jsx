import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { cancelMyOrder, getOrderDetail, getPublicAssetUrl } from '../services/api.js';
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
    cod: 'Thanh toán khi nhận hàng',
    bank_transfer: 'Chuyển khoản',
    credit_card: 'Thẻ tín dụng',
    momo: 'MoMo'
  };

  return labels[method] || method || '--';
}

function canCancelOrder(status) {
  return ['pending', 'confirmed'].includes(status);
}

function OrderDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      setError('');
      setCancelError('');

      try {
        const response = await getOrderDetail(id, token);
        setOrder(response.order || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Không thể tải chi tiết đơn hàng.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [id, token]);

  async function handleCancelOrder() {
    if (!order || !canCancelOrder(order.status)) {
      return;
    }

    setIsCancelling(true);
    setCancelError('');

    try {
      const response = await cancelMyOrder(order._id, token);
      setOrder(response.order || order);
    } catch (requestError) {
      setCancelError(requestError.response?.data?.message || 'Không thể hủy đơn hàng lúc này.');
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <section className="container-page py-10 sm:py-12">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600">
          Đang tải chi tiết đơn hàng...
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="container-page py-10 sm:py-12">
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-700">
          {error || 'Không tìm thấy đơn hàng.'}
        </div>
        <Link
          to="/my-orders"
          className="mt-6 inline-flex rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-navy transition hover:border-gold hover:text-gold"
        >
          Quay lại đơn hàng của tôi
        </Link>
      </section>
    );
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Chi Tiết Đơn Hàng</p>
          <h1 className="mt-3 text-3xl font-bold text-navy">Đơn #{order._id?.slice(-8).toUpperCase()}</h1>
          <p className="mt-3 text-slate-600">Ngày đặt: {formatDateTime(order.createdAt)}</p>
        </div>

        <Link
          to="/my-orders"
          className="inline-flex rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-navy transition hover:border-gold hover:text-gold"
        >
          Quay lại danh sách
        </Link>
      </div>

      {cancelError ? <div className="state-error mb-6">{cancelError}</div> : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-navy">Sản phẩm</h2>
          <div className="mt-6 space-y-4">
            {order.items.map((item, index) => {
              const imageUrl = getPublicAssetUrl(item.image || item.product?.images?.[0] || '');

              return (
                <article
                  key={`${item.product?._id || item.name}-${index}`}
                  className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 rounded-[24px] border border-slate-200 bg-[#fffdfa] p-4"
                >
                  <div className="overflow-hidden rounded-[18px] bg-white">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.name} className="h-[84px] w-[84px] object-cover" />
                    ) : (
                      <div className="flex h-[84px] w-[84px] items-center justify-center text-[10px] font-semibold uppercase tracking-[0.18em] text-navy">
                        JewelAura
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-base font-semibold text-navy">{item.name}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>Số lượng: {item.quantity}</span>
                      {item.selectedSize ? <span>Size: {item.selectedSize}</span> : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-navy">{formatCurrency(item.price)} / sản phẩm</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="h-fit rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-xl font-semibold text-navy">Thông tin đơn hàng</h2>

          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Trạng thái</span>
              <span className="font-semibold text-navy">{getStatusLabel(order.status)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Thanh toán</span>
              <span className={`font-semibold ${order.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Phương thức</span>
              <span className="font-semibold text-navy">{getPaymentMethodLabel(order.paymentMethod)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Tạm tính</span>
              <span className="font-semibold text-navy">{formatCurrency(order.totalBeforeDiscount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Mã giảm giá</span>
              <span className="font-semibold text-navy">{order.couponCode || 'Không có'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Giảm giá</span>
              <span className="font-semibold text-emerald-700">-{formatCurrency(order.discountAmount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Tổng tiền</span>
              <span className="text-lg font-bold text-navy">{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-base font-semibold text-navy">Địa chỉ nhận hàng</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-navy">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.phone}</p>
              <p>
                {[order.shippingAddress?.city, order.shippingAddress?.ward, order.shippingAddress?.district]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>{order.shippingAddress?.addressLine}</p>
              {order.shippingAddress?.note ? <p>Ghi chú: {order.shippingAddress.note}</p> : null}
            </div>
          </div>
          {canCancelOrder(order.status) ? (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="w-full rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCancelling ? 'Đang hủy đơn hàng...' : 'Hủy đơn hàng'}
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

export default OrderDetailPage;
