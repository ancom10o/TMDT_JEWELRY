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

productSchema.pre('validate', async function normalizeLegacyProductFields(next) {
  if (!this.sku) {
    this.sku = await generateSku();
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
