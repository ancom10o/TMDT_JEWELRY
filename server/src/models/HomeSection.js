import mongoose from 'mongoose';

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
      enum: ['banner_slider', 'category_grid', 'product_carousel', 'editorial_grid', 'service_grid']
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
