export function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getGenderSearchLabels(gender = '') {
  const normalizedGender = normalizeText(gender);
  const labelMap = {
    male: ['nam', 'gioi nam', 'trang suc nam'],
    nam: ['nam', 'gioi nam', 'trang suc nam'],
    female: ['nu', 'gioi nu', 'trang suc nu'],
    nu: ['nu', 'gioi nu', 'trang suc nu'],
    unisex: ['unisex', 'nam nu', 'trang suc unisex']
  };

  return labelMap[normalizedGender] || [];
}

export function getMaterialGroupSearchLabels(materialGroup = '') {
  const normalizedMaterialGroup = normalizeText(materialGroup);
  const labelMap = {
    gold: ['vang', 'vang 10k', 'vang 14k', 'vang 18k'],
    silver: ['bac', 'bac 925', 'bac y'],
    platinum: ['platinum', 'bach kim'],
    other: ['khac', 'chat lieu khac']
  };

  return labelMap[normalizedMaterialGroup] || [];
}

export function buildProductSearchText(product = {}, category = null) {
  const categoryName = category?.name || product.categoryName || product.category?.name || '';
  const categorySlug = category?.slug || product.categorySlug || product.category?.slug || '';
  const materialGroupLabels = getMaterialGroupSearchLabels(product.materialGroup);
  const genderLabels = getGenderSearchLabels(product.gender);

  return normalizeText(
    [
      product.name,
      product.slug,
      product.description,
      categoryName,
      categorySlug,
      product.gender,
      ...genderLabels,
      product.material,
      product.materialDetail,
      product.materialGroup,
      ...materialGroupLabels,
      product.stone
    ]
      .filter(Boolean)
      .join(' ')
  );
}

export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
