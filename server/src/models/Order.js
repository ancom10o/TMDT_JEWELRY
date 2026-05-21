import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    productName: {
      type: String,
      trim: true,
      default: ''
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    selectedSize: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    _id: false
  }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    addressLine: {
      type: String,
      required: true,
      trim: true
    },
    ward: {
      type: String,
      trim: true,
      default: ''
    },
    district: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    note: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    _id: false
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'Order must include at least one item.'
      }
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    orderCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bank_transfer', 'credit_card', 'momo'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed'],
      default: 'unpaid'
    },
    bankTransferContent: {
      type: String,
      trim: true,
      default: ''
    },
    bankTransferBankCode: {
      type: String,
      trim: true,
      default: ''
    },
    bankTransferBankName: {
      type: String,
      trim: true,
      default: ''
    },
    bankTransferAccountNumber: {
      type: String,
      trim: true,
      default: ''
    },
    bankTransferAccountName: {
      type: String,
      trim: true,
      default: ''
    },
    bankTransferQrUrl: {
      type: String,
      trim: true,
      default: ''
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalBeforeDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'],
      default: 'pending'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
