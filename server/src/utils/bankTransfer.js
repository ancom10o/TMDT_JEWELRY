import Order from '../models/Order.js';

// Thay 3 gia tri nay bang thong tin ngan hang that cua shop khi deploy.
export const BANK_CODE = 'TCB';
export const BANK_NAME = 'Techcombank';
export const BANK_ACCOUNT = '0349865887';
export const ACCOUNT_NAME = 'NGUYEN DUC HA';

function formatDateCode(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function generateOrderCode({ session } = {}) {
  const dateCode = formatDateCode();
  const prefix = `JA-${dateCode}-`;

  const latestOrder = await Order.findOne({ orderCode: { $regex: `^${prefix}` } })
    .sort({ orderCode: -1 })
    .select('orderCode')
    .session(session || null);

  const latestNumber = latestOrder?.orderCode
    ? Number(latestOrder.orderCode.replace(prefix, ''))
    : 0;

  for (let offset = 1; offset <= 100; offset += 1) {
    const nextNumber = latestNumber + offset;
    const orderCode = `${prefix}${String(nextNumber).padStart(4, '0')}`;
    const existingOrder = await Order.findOne({ orderCode }).select('_id').session(session || null);

    if (!existingOrder) {
      return orderCode;
    }
  }

  throw new Error('Khong the tao ma don hang duy nhat. Vui long thu lai.');
}

export function buildBankQrUrl({ amount, orderCode }) {
  const safeAmount = Math.max(Math.round(Number(amount) || 0), 0);
  const encodedOrderCode = encodeURIComponent(orderCode);
  const encodedAccountName = encodeURIComponent(ACCOUNT_NAME);

  return `https://img.vietqr.io/image/${BANK_CODE}-${BANK_ACCOUNT}-compact2.png?amount=${safeAmount}&addInfo=${encodedOrderCode}&accountName=${encodedAccountName}`;
}

export function getBankTransferInfo() {
  return {
    bankCode: BANK_CODE,
    bankName: BANK_NAME,
    bankAccount: BANK_ACCOUNT,
    accountName: ACCOUNT_NAME
  };
}
