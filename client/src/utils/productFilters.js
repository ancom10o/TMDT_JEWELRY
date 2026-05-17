export const genderOptions = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Unisex', value: 'unisex' }
];

export const materialGroupOptions = [
  { label: 'Vàng', value: 'gold' },
  { label: 'Bạc', value: 'silver' },
  { label: 'Platinum', value: 'platinum' },
  { label: 'Khác', value: 'other' }
];

export const materialDetailOptionsByGroup = {
  gold: ['Vàng 10K', 'Vàng 14K', 'Vàng 18K', 'Vàng trắng', 'Vàng hồng'],
  silver: ['Bạc 925', 'Bạc Ý', 'Bạc xi'],
  platinum: ['Platinum 950', 'Platinum 900']
};

export const priceRangeOptions = [
  { id: 'under-2m', label: 'Dưới 2 triệu', min: '', max: '2000000' },
  { id: '2m-5m', label: '2 triệu - 5 triệu', min: '2000000', max: '5000000' },
  { id: '5m-10m', label: '5 triệu - 10 triệu', min: '5000000', max: '10000000' },
  { id: '10m-20m', label: '10 triệu - 20 triệu', min: '10000000', max: '20000000' },
  { id: 'over-20m', label: 'Trên 20 triệu', min: '20000000', max: '' }
];

export function getGenderLabel(value = '') {
  const legacyMap = {
    Nam: 'Nam',
    Nu: 'Nữ',
    'Nữ': 'Nữ',
    Unisex: 'Unisex'
  };

  return genderOptions.find((option) => option.value === value)?.label || legacyMap[value] || value || '';
}

export function getMaterialGroupLabel(value = '') {
  return materialGroupOptions.find((option) => option.value === value)?.label || value || '';
}

export function getProductMaterialLabel(product = {}) {
  return product.materialDetail || product.material || getMaterialGroupLabel(product.materialGroup);
}

export function normalizeMaterialDetail(value = '') {
  const normalizedValue = value.trim().toLowerCase();
  const detailMap = {
    'vang 10k': 'Vàng 10K',
    'vàng 10k': 'Vàng 10K',
    'vang 14k': 'Vàng 14K',
    'vàng 14k': 'Vàng 14K',
    'vang 18k': 'Vàng 18K',
    'vàng 18k': 'Vàng 18K',
    'vang trang 14k': 'Vàng trắng',
    'vang trang 18k': 'Vàng trắng',
    'vàng trắng 14k': 'Vàng trắng',
    'vàng trắng 18k': 'Vàng trắng',
    'vang hong': 'Vàng hồng',
    'vàng hồng': 'Vàng hồng',
    'bac 925': 'Bạc 925',
    'bạc 925': 'Bạc 925',
    'bac y': 'Bạc Ý',
    'bạc ý': 'Bạc Ý',
    'bac xi': 'Bạc xi',
    'bạc xi': 'Bạc xi',
    'platinum 950': 'Platinum 950',
    'platinum 900': 'Platinum 900',
    'thep khong gi': 'Thép không gỉ',
    'thép không gỉ': 'Thép không gỉ'
  };

  return detailMap[normalizedValue] || value;
}
