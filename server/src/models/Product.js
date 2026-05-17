import mongoose from 'mongoose';

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
      uppercase: true,
      sparse: true
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
    oldPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
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
      enum: ['Nam', 'Nu', 'Unisex'],
      default: 'Unisex'
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
    }
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
