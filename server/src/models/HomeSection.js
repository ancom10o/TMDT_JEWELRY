import mongoose from 'mongoose';
import { HOME_SECTION_TYPES } from '../utils/homeSections.js';

const homeSectionItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: ''
    },
    subtitle: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    link: {
      type: String,
      trim: true,
      default: ''
    },
    icon: {
      type: String,
      trim: true,
      default: ''
    },
    color: {
      type: String,
      trim: true,
      default: ''
    },
    badge: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    _id: false
  }
);

const homeSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    type: {
      type: String,
      required: true,
      enum: [...HOME_SECTION_TYPES, 'banner_slider', 'banner-slider', 'category-grid', 'product_carousel', 'editorial_grid']
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    subtitle: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    buttonLabel: {
      type: String,
      trim: true,
      default: ''
    },
    buttonLink: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    banners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Banner'
      }
    ],
    displayMode: {
      type: String,
      trim: true,
      default: 'default'
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    bannerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Banner'
      }
    ],
    items: {
      type: [homeSectionItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const HomeSection = mongoose.model('HomeSection', homeSectionSchema);

export default HomeSection;
