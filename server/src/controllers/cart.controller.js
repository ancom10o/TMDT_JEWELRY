import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

function normalizeQuantity(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) ? parsedValue : NaN;
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug images price stock status');

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate('items.product', 'name slug images price stock status');
  }

  return cart;
}

export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ cart });
  } catch (error) {
    next(error);
  }
}

export async function addToCart(req, res, next) {
  try {
    const { productId, selectedSize = '' } = req.body;
    const quantity = normalizeQuantity(req.body.quantity ?? 1);

    if (!productId) {
      return res.status(400).json({ message: 'productId la bat buoc.' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'So luong phai la so nguyen lon hon 0.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ message: 'San pham nay khong san sang de ban.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId && item.selectedSize === selectedSize
    );
    const nextQuantity = (existingItem?.quantity || 0) + quantity;

    if (product.stock < nextQuantity) {
      return res.status(400).json({ message: `San pham ${product.name} khong du ton kho.` });
    }

    if (existingItem) {
      existingItem.quantity = nextQuantity;
      existingItem.price = product.price;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        selectedSize,
        price: product.price
      });
    }

    await cart.save();
    const populatedCart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name slug images price stock status'
    );

    res.status(201).json({ cart: populatedCart });
  } catch (error) {
    next(error);
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const quantity = normalizeQuantity(req.body.quantity);
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Khong tim thay gio hang.' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Khong tim thay san pham trong gio hang.' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'So luong phai la so nguyen lon hon 0.' });
    }

    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ message: 'San pham nay khong san sang de ban.' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `San pham ${product.name} khong du ton kho.` });
    }

    item.quantity = quantity;
    item.price = product.price;
    await cart.save();

    const populatedCart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name slug images price stock status'
    );

    res.json({ cart: populatedCart });
  } catch (error) {
    next(error);
  }
}

export async function removeCartItem(req, res, next) {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Khong tim thay gio hang.' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
    await cart.save();

    const populatedCart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name slug images price stock status'
    );

    res.json({ cart: populatedCart });
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.json({ cart });
  } catch (error) {
    next(error);
  }
}
