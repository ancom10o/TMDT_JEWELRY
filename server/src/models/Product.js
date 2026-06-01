import mongoose from 'mongoose';
import { buildProductSearchText } from '../utils/search.js';

function normalizeGender(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  const genderMap = {
    nam: 'male',
    male: 'male',
    nu: 'female',
    'nữ': 'female',
    female: 'female',
    unisex: 'unisex'
  };

  return genderMap[normalizedValue] || 'female';
}

function normalizeMaterialGroup(value, detail = '') {
  const normalizedValue = String(value || '').trim().toLowerCase();
  const normalizedDetail = String(detail || '').trim().toLowerCase();
  const source = normalizedValue || normalizedDetail;

  if (['gold', 'silver', 'platinum', 'other'].includes(normalizedValue)) {
    return normalizedValue;
  }

  if (source.includes('vang') || source.includes('vàng')) return 'gold';
  if (source.includes('bac') || source.includes('bạc')) return 'silver';
  if (source.includes('platinum') || source.includes('bach kim') || source.includes('bạch kim')) return 'platinum';
  return 'other';
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    originalPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    oldPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'Product must include at least one image.'
      }
    },
    material: {
      type: String,
      trim: true,
      default: ''
    },
    materialGroup: {
      type: String,
      enum: ['gold', 'silver', 'platinum', 'other'],
      default: 'gold',
      set: (value) => normalizeMaterialGroup(value)
    },
    materialDetail: {
      type: String,
      trim: true,
      default: ''
    },
    stone: {
      type: String,
      trim: true,
      default: ''
    },
    weight: {
      type: Number,
      min: 0,
      default: 0
    },
    size: {
      type: [String],
      default: []
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex'],
      default: 'female',
      set: normalizeGender
    },
    stock: {
      type: Number,
      min: 0,
      default: 0
    },
    sold: {
      type: Number,
      min: 0,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isNew: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive'],
      default: 'active'
    },
    searchText: {
      type: String,
      index: true,
      default: ''
    }
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.virtual('discountPercent').get(function getDiscountPercent() {
  const comparePrice = this.originalPrice || this.oldPrice || 0;

  if (!comparePrice || comparePrice <= this.price) {
    return 0;
  }

  return Math.round(((comparePrice - this.price) / comparePrice) * 100);
});

async function generateSku() {
  const latestProduct = await mongoose
    .model('Product')
    .findOne({ sku: /^JA-\d{6}$/ })
    .sort({ sku: -1 })
    .select('sku')
    .lean();

  const latestNumber = latestProduct?.sku ? Number(latestProduct.sku.replace('JA-', '')) : 0;
  return `JA-${String(latestNumber + 1).padStart(6, '0')}`;
}

function normalizeSlugWithSku(slug, sku) {
  const normalizedSlug = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
  const normalizedSku = String(sku || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalizedSlug || !normalizedSku || normalizedSlug === normalizedSku || normalizedSlug.endsWith(`-${normalizedSku}`)) {
    return normalizedSlug;
  }

  return `${normalizedSlug}-${normalizedSku}`;
}

productSchema.pre('validate', async function normalizeLegacyProductFields(next) {
  if (!this.sku) {
    this.sku = await generateSku();
  }

  let slugWasNormalized = false;
  if (this.slug && this.sku && (this.isNew || this.isModified('slug') || this.isModified('sku'))) {
    const currentSlug = this.slug;
    this.slug = normalizeSlugWithSku(this.slug, this.sku);
    slugWasNormalized = currentSlug !== this.slug;
  }

  if (!this.originalPrice) {
    this.originalPrice = this.oldPrice || this.price;
  }

  if (!this.materialDetail && this.material) {
    this.materialDetail = this.material;
  }

  if (!this.materialGroup || this.isModified('material') || this.isModified('materialDetail') || this.isModified('materialGroup')) {
    const explicitGroup = this.isModified('materialGroup') ? this.materialGroup : '';
    this.materialGroup = normalizeMaterialGroup(explicitGroup, this.materialDetail || this.material);
  }

  if (
    slugWasNormalized ||
    !this.searchText ||
    (!this.isModified('searchText') &&
      (this.isModified('name') ||
        this.isModified('slug') ||
        this.isModified('description') ||
        this.isModified('gender') ||
        this.isModified('material') ||
        this.isModified('materialDetail') ||
        this.isModified('materialGroup') ||
        this.isModified('stone')))
  ) {
    this.searchText = buildProductSearchText(this);
  }

  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
