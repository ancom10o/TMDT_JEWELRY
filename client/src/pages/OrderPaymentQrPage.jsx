import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { getOrderDetail } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

function getDisplayOrderCode(order) {
  return order?.orderCode || order?._id?.slice(-6).toUpperCase() || '--';
}

function canShowQrPayment(order) {
  return order?.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid' && !order.isPaid;
}

async function copyText(value) {
  if (!value) return;
  await globalThis.navigator?.clipboard?.writeText(value);
}

function OrderPaymentQrPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      setError('');

      try {
        const response = await getOrderDetail(id, token);
        setOrder(response.order || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Không thể tải thông tin thanh toán.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [id, token]);

  if (isLoading) {
    return (
      <section className="container-page py-10 sm:py-12">
        <div className="state-loading">Đang tải mã QR thanh toán...</div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="container-page py-10 sm:py-12">
        <div className="state-error">{error || 'Không tìm thấy đơn hàng.'}</div>
        <Link to="/my-orders" className="btn-outline mt-6">
          Quay lại đơn hàng của tôi
        </Link>
      </section>
    );
  }

  const displayOrderCode = getDisplayOrderCode(order);
  const bankAccount = order.bankTransferAccountNumber || 'YOUR_TECHCOMBANK_ACCOUNT';
  const accountName = order.bankTransferAccountName || 'YOUR_ACCOUNT_NAME';
  const transferContent = order.bankTransferContent || displayOrderCode;

  if (!canShowQrPayment(order)) {
    return (
      <section className="container-page py-10 sm:py-12">
        <div className="surface-card mx-auto max-w-2xl p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Thanh Toán QR</p>
          <h1 className="mt-3 text-3xl font-bold text-navy">Đơn hàng không cần thanh toán QR</h1>
          <p className="mt-4 text-slate-600">
            Đơn #{displayOrderCode} đã được thanh toán hoặc không dùng phương thức chuyển khoản ngân hàng.
          </p>
          <Link to={`/my-orders/${order._id}`} className="btn-secondary mt-6">
            Xem chi tiết đơn hàng
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="surface-card mx-auto max-w-5xl p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Thanh Toán QR</p>
            <h1 className="mt-3 text-3xl font-bold text-navy">Quét mã để thanh toán</h1>
            <p className="mt-3 text-slate-600">Đơn #{displayOrderCode}</p>
          </div>
          <Link to={`/my-orders/${order._id}`} className="btn-outline">
            Quay lại chi tiết đơn
          </Link>
        </div>

        <div className="rounded-[28px] border border-[#e8dcc0] bg-[#fff9ec] p-5 sm:p-6">
          <p className="text-sm text-slate-600">
            Vui lòng chuyển đúng số tiền và đúng nội dung để đơn hàng được xác nhận.
          </p>

          <div className="mt-6 grid gap-7 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-center">
            {order.bankTransferQrUrl ? (
              <img
                src={order.bankTransferQrUrl}
                alt={`QR thanh toán ${displayOrderCode}`}
                className="mx-auto h-[320px] w-[320px] rounded-2xl border border-slate-200 bg-white object-contain p-3 sm:h-[380px] sm:w-[380px]"
              />
            ) : null}

            <div className="space-y-4 text-sm text-slate-600">
              <p><span className="font-semibold text-navy">Ngân hàng:</span> {order.bankTransferBankName || 'Techcombank'}</p>
              <p><span className="font-semibold text-navy">Số tài khoản:</span> {bankAccount}</p>
              <p><span className="font-semibold text-navy">Chủ tài khoản:</span> {accountName}</p>
              <p><span className="font-semibold text-navy">Số tiền:</span> {formatCurrency(order.totalPrice)}</p>
              <p><span className="font-semibold text-navy">Nội dung chuyển khoản:</span> {transferContent}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => copyText(transferContent)} className="btn-outline !px-4 !py-2">
                  Copy nội dung
                </button>
                <button type="button" onClick={() => copyText(bankAccount)} className="btn-outline !px-4 !py-2">
                  Copy số tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrderPaymentQrPage;
