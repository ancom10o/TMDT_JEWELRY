export const sectionTypeOptions = [
  {
    value: 'hero_banner',
    label: 'Hero banner',
    description: 'Banner đầu trang, có thể dùng slider nhiều banner.'
  },
  {
    value: 'category_grid',
    label: 'Grid danh mục',
    description: 'Lưới danh mục với items thủ công.'
  },
  {
    value: 'product_slider',
    label: 'Slider sản phẩm',
    description: 'Hiển thị sản phẩm dạng slider.'
  },
  {
    value: 'image_text_block',
    label: 'Image + text block',
    description: 'Khối nội dung 1 ảnh + text + button.'
  },
  {
    value: 'promo_banner',
    label: 'Promo banner',
    description: 'Banner khuyến mãi giữa trang.'
  },
  {
    value: 'service_grid',
    label: 'Grid dịch vụ',
    description: 'Lưới các điểm dịch vụ như bảo hành, giao hàng, đổi size.'
  },
  {
    value: 'collection_cards',
    label: 'Thế giới sưu tập',
    description: 'Danh sách card thế giới sưu tập với ảnh, text và link.'
  }
];

export const legacySectionTypeMap = {
  'banner-slider': 'hero_banner',
  banner_slider: 'hero_banner',
  'category-grid': 'category_grid',
  category_grid: 'category_grid',
  product_grid: 'product_slider',
  product_carousel: 'product_slider',
  editorial_grid: 'collection_cards',
  service_grid: 'service_grid'
};

const defaultSettingsByType = {
  hero_banner: { autoplay: true, showButton: true },
  category_grid: { columns: 4, showButton: true },
  product_slider: { limit: 8, variant: 'listing', autoplay: true, showButton: true, sourceMode: 'manual', productQuery: '/products' },
  image_text_block: { layout: 'imageLeft', showButton: true },
  promo_banner: { showButton: true },
  service_grid: { columns: 4 },
  collection_cards: { columns: 3, variant: 'standard', showButton: true }
};

function resolveRelationArray(primaryValue, fallbackValue) {
  if (Array.isArray(primaryValue) && primaryValue.length > 0) {
    return primaryValue;
  }

  if (Array.isArray(fallbackValue) && fallbackValue.length > 0) {
    return fallbackValue;
  }

  if (Array.isArray(primaryValue)) {
    return primaryValue;
  }

  if (Array.isArray(fallbackValue)) {
    return fallbackValue;
  }

  return [];
}

export function normalizeHomeSectionType(type = '') {
  return legacySectionTypeMap[type] || type || 'product_slider';
}

export function getSectionTypeMeta(type) {
  return sectionTypeOptions.find((option) => option.value === normalizeHomeSectionType(type)) || sectionTypeOptions[0];
}

export function buildDefaultSettings(type) {
  return { ...(defaultSettingsByType[normalizeHomeSectionType(type)] || {}) };
}

function normalizeItem(item = {}) {
  return {
    title: item.title || '',
    subtitle: item.subtitle || '',
    description: item.description || '',
    image: item.image || '',
    link: item.link || '',
    icon: item.icon || '',
    color: item.color || '',
    badge: item.badge || ''
  };
}

export function normalizeSection(section = {}) {
  const type = normalizeHomeSectionType(section.type);
  const banners = resolveRelationArray(section.banners, section.bannerIds);
  const products = resolveRelationArray(section.products, section.productIds);
  const settings = {
    ...buildDefaultSettings(type),
    ...(section.settings || {}),
    ...(section.displayMode ? { variant: section.displayMode } : {})
  };

  return {
    ...section,
    type,
    title: section.title || '',
    subtitle: section.subtitle || '',
    description: section.description || '',
    buttonLabel: section.buttonLabel || '',
    buttonLink: section.buttonLink || '',
    order: Number(section.order) || 0,
    isActive: section.isActive !== false,
    banners,
    products,
    items: Array.isArray(section.items) ? section.items.map(normalizeItem) : [],
    settings
  };
}

export function clampColumns(columns, fallback = 4) {
  const value = Number(columns);
  return Number.isFinite(value) && value > 0 ? Math.min(Math.max(value, 1), 4) : fallback;
}

export function sliceSectionProducts(section) {
  const normalizedSection = normalizeSection(section);
  const limit = Number(normalizedSection.settings.limit) || normalizedSection.products.length;
  return normalizedSection.products.slice(0, limit);
}
