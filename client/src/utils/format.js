export function formatNumber(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatCurrency(value, options = {}) {
  const { currency = 'VND', currencyDisplay = 'symbol' } = options;
  const amount = Number(value) || 0;

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    currencyDisplay,
    maximumFractionDigits: 0
  }).format(amount);
}

export function parseCurrencyInput(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/[^\d]/g, '');
}

export function formatCurrencyInput(value) {
  const normalized = parseCurrencyInput(value);
  return normalized ? formatNumber(normalized) : '';
}
