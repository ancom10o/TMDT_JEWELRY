import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    mobileImageUrl: {
      type: String,
      trim: true,
      default: ''
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
      default: '/products'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
