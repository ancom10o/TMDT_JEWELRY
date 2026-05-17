export const HOME_SECTION_TYPES = [
  'hero_banner',
  'category_grid',
  'product_slider',
  'image_text_block',
  'promo_banner',
  'service_grid',
  'collection_cards'
];

export const LEGACY_HOME_SECTION_TYPE_MAP = {
  'banner-slider': 'hero_banner',
  banner_slider: 'hero_banner',
  'category-grid': 'category_grid',
  category_grid: 'category_grid',
  product_grid: 'product_slider',
  product_carousel: 'product_slider',
  editorial_grid: 'collection_cards',
  service_grid: 'service_grid'
};

const TYPE_FIELD_SUPPORT = {
  hero_banner: { banners: true, products: false, items: false },
  category_grid: { banners: false, products: false, items: true },
  product_slider: { banners: false, products: true, items: false },
  image_text_block: { banners: false, products: false, items: true },
  promo_banner: { banners: true, products: false, items: false },
  service_grid: { banners: false, products: false, items: true },
  collection_cards: { banners: false, products: false, items: true }
};

function normalizeBoolean(value, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function sanitizeItem(item = {}) {
  return {
    title: item.title?.trim?.() || '',
    subtitle: item.subtitle?.trim?.() || '',
    description: item.description?.trim?.() || '',
    image: item.image?.trim?.() || '',
    link: item.link?.trim?.() || '',
    icon: item.icon?.trim?.() || '',
    color: item.color?.trim?.() || '',
    badge: item.badge?.trim?.() || ''
  };
}

function sanitizeSettings(settings = {}, legacyDisplayMode = '') {
  const nextSettings = {
    columns: normalizeNumber(settings.columns, 0),
    variant: settings.variant?.trim?.() || legacyDisplayMode?.trim?.() || '',
    backgroundColor: settings.backgroundColor?.trim?.() || '',
    showButton: normalizeBoolean(settings.showButton, true),
    autoplay: normalizeBoolean(settings.autoplay, true),
    limit: normalizeNumber(settings.limit, 0),
    layout: settings.layout?.trim?.() || '',
    sourceMode: ['manual', 'query'].includes(settings.sourceMode) ? settings.sourceMode : '',
    productQuery: settings.productQuery?.trim?.() || ''
  };

  return Object.fromEntries(Object.entries(nextSettings).filter(([, value]) => value !== '' && value !== 0));
}

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
  const normalizedType = LEGACY_HOME_SECTION_TYPE_MAP[type] || type;
  return HOME_SECTION_TYPES.includes(normalizedType) ? normalizedType : 'product_slider';
}

export function normalizeHomeSectionPayload(payload = {}, options = {}) {
  const { partial = false } = options;
  const nextPayload = {};

  if (!partial || payload.key !== undefined) {
    nextPayload.key = payload.key?.trim?.() || '';
  }

  if (!partial || payload.type !== undefined) {
    nextPayload.type = normalizeHomeSectionType(payload.type);
  }

  if (!partial || payload.title !== undefined) {
    nextPayload.title = payload.title?.trim?.() || '';
  }

  if (!partial || payload.subtitle !== undefined) {
    nextPayload.subtitle = payload.subtitle?.trim?.() || '';
  }

  if (!partial || payload.description !== undefined) {
    nextPayload.description = payload.description?.trim?.() || '';
  }

  if (!partial || payload.buttonLabel !== undefined) {
    nextPayload.buttonLabel = payload.buttonLabel?.trim?.() || '';
  }

  if (!partial || payload.buttonLink !== undefined) {
    nextPayload.buttonLink = payload.buttonLink?.trim?.() || '';
  }

  if (!partial || payload.order !== undefined) {
    nextPayload.order = normalizeNumber(payload.order, 0);
  }

  if (!partial || payload.isActive !== undefined) {
    nextPayload.isActive = normalizeBoolean(payload.isActive, true);
  }

  if (!partial || payload.banners !== undefined || payload.bannerIds !== undefined) {
    const banners = Array.isArray(payload.banners) ? payload.banners : Array.isArray(payload.bannerIds) ? payload.bannerIds : [];
    nextPayload.banners = banners;
    nextPayload.bannerIds = banners;
  }

  if (!partial || payload.products !== undefined || payload.productIds !== undefined) {
    const products = Array.isArray(payload.products) ? payload.products : Array.isArray(payload.productIds) ? payload.productIds : [];
    nextPayload.products = products;
    nextPayload.productIds = products;
  }

  if (!partial || payload.items !== undefined) {
    nextPayload.items = Array.isArray(payload.items) ? payload.items.map(sanitizeItem) : [];
  }

  if (!partial || payload.settings !== undefined || payload.displayMode !== undefined) {
    const settings = sanitizeSettings(payload.settings, payload.displayMode);
    nextPayload.settings = settings;
    nextPayload.displayMode = settings.variant || '';
  }

  const resolvedType = nextPayload.type || normalizeHomeSectionType(payload.type);
  const typeSupport = TYPE_FIELD_SUPPORT[resolvedType] || TYPE_FIELD_SUPPORT.product_slider;

  if (!typeSupport.banners && (!partial || nextPayload.banners !== undefined || nextPayload.bannerIds !== undefined)) {
    nextPayload.banners = [];
    nextPayload.bannerIds = [];
  }

  if (!typeSupport.products && (!partial || nextPayload.products !== undefined || nextPayload.productIds !== undefined)) {
    nextPayload.products = [];
    nextPayload.productIds = [];
  }

  if (!typeSupport.items && (!partial || nextPayload.items !== undefined)) {
    nextPayload.items = [];
  }

  return nextPayload;
}

export function serializeHomeSection(section) {
  const plainSection = typeof section.toObject === 'function' ? section.toObject() : section;
  const type = normalizeHomeSectionType(plainSection.type);
  const banners = resolveRelationArray(plainSection.banners, plainSection.bannerIds);
  const products = resolveRelationArray(plainSection.products, plainSection.productIds);

  return {
    ...plainSection,
    type,
    banners,
    products,
    items: Array.isArray(plainSection.items) ? plainSection.items.map(sanitizeItem) : [],
    settings: sanitizeSettings(plainSection.settings, plainSection.displayMode),
    bannerIds: banners,
    productIds: products
  };
}
