/* eslint-disable react/prop-types */
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addCartItem,
  clearServerCart,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
  validateCoupon
} from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';

const CART_STORAGE_KEY = 'jewelaura_cart';
const CART_SELECTION_STORAGE_KEY = 'jewelaura_cart_selection';
const AUTH_TOKEN_KEYS = ['jewelaura_token', 'token'];

const CartContext = createContext(null);

function readLocalCart() {
  if (typeof globalThis.localStorage === 'undefined') {
    return [];
  }

  try {
    const storedCart = globalThis.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items) {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }

  globalThis.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function readSelectedCartKeys() {
  if (typeof globalThis.localStorage === 'undefined') {
    return [];
  }

  try {
    const storedKeys = globalThis.localStorage.getItem(CART_SELECTION_STORAGE_KEY);
    const parsedKeys = storedKeys ? JSON.parse(storedKeys) : [];
    return Array.isArray(parsedKeys) ? parsedKeys.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveSelectedCartKeys(keys) {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }

  globalThis.localStorage.setItem(CART_SELECTION_STORAGE_KEY, JSON.stringify(keys));
}

function getStoredToken() {
  if (typeof globalThis.localStorage === 'undefined') {
    return '';
  }

  return AUTH_TOKEN_KEYS.map((key) => globalThis.localStorage.getItem(key)).find(Boolean) || '';
}

function normalizeLocalCartItem(item) {
  return {
    id: item.id || item.productId || item._id || '',
    productId: item.productId || item._id || '',
    serverItemId: item.serverItemId || '',
    slug: item.slug || '',
    name: item.name || '',
    image: item.image || item.images?.[0] || '',
    price: Number(item.price) || 0,
    stock: Number(item.stock) || 0,
    quantity: Math.max(Number(item.quantity) || 1, 1),
    selectedSize: item.selectedSize || ''
  };
}

function getCartItemKey(item) {
  return item.serverItemId || item.id || `${item.productId}:${item.selectedSize || ''}`;
}

function normalizeServerCart(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];

  return items.map((item) => {
    const product = item.product || {};

    return {
      id: item._id || '',
      productId: product._id || '',
      serverItemId: item._id || '',
      slug: product.slug || '',
      name: product.name || '',
      image: product.images?.[0] || '',
      price: Number(item.price ?? product.price) || 0,
      stock: Number(product.stock) || 0,
      quantity: Math.max(Number(item.quantity) || 1, 1),
      selectedSize: item.selectedSize || ''
    };
  });
}

function buildCartSignature(items) {
  return items
    .map((item) => `${item.productId}:${item.quantity}:${item.selectedSize || ''}`)
    .sort()
    .join('|');
}

function mergeLocalItems(currentItems, product, quantity) {
  const normalizedItems = currentItems.map(normalizeLocalCartItem);
  const selectedSize = product.selectedSize || '';
  const existingItem = normalizedItems.find(
    (item) => item.productId === product.productId && item.selectedSize === selectedSize
  );

  if (existingItem) {
    const maxQuantity = existingItem.stock > 0 ? existingItem.stock : existingItem.quantity + quantity;
    existingItem.quantity = Math.min(existingItem.quantity + quantity, maxQuantity);
    return normalizedItems;
  }

  normalizedItems.push(
    normalizeLocalCartItem({
      ...product,
      quantity
    })
  );

  return normalizedItems;
}

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cartError, setCartError] = useState('');
  const [selectedCartItemKeys, setSelectedCartItemKeys] = useState(readSelectedCartKeys);
  const [authToken, setAuthToken] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponStatus, setCouponStatus] = useState({ type: '', message: '' });
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const hasMountedAuthEffect = useRef(false);
  const appliedCouponCartSignatureRef = useRef('');

  useEffect(() => {
    if (!authToken) {
      saveLocalCart(cartItems);
    }
  }, [authToken, cartItems]);

  useEffect(() => {
    saveSelectedCartKeys(selectedCartItemKeys);
  }, [selectedCartItemKeys]);

  useEffect(() => {
    const availableKeys = new Set(cartItems.map(getCartItemKey));
    setSelectedCartItemKeys((currentKeys) => currentKeys.filter((key) => availableKeys.has(key)));
  }, [cartItems]);

  useEffect(() => {
    if (!appliedCoupon) {
      return;
    }

    const selectedKeySet = new Set(selectedCartItemKeys);
    const couponItems = selectedKeySet.size > 0
      ? cartItems.filter((item) => selectedKeySet.has(getCartItemKey(item)))
      : cartItems;
    const currentSignature = buildCartSignature(couponItems);

    if (!currentSignature || currentSignature !== appliedCouponCartSignatureRef.current) {
      setAppliedCoupon(null);
      appliedCouponCartSignatureRef.current = '';
      setCouponStatus({
        type: 'warning',
        message: 'Giỏ hàng đã thay đổi. Vui lòng áp dụng lại mã giảm giá.'
      });
    }
  }, [appliedCoupon, cartItems, selectedCartItemKeys]);

  const loadServerCart = useCallback(
    async (tokenValue = authToken) => {
      const response = await getCart(tokenValue);
      const normalizedItems = normalizeServerCart(response.cart);
      setCartItems(normalizedItems);
      return normalizedItems;
    },
    [authToken]
  );

  const syncCart = useCallback(
    async (tokenValue = getStoredToken()) => {
      if (!tokenValue) {
        setAuthToken('');
        const localItems = readLocalCart().map(normalizeLocalCartItem);
        setCartItems(localItems);
        setIsInitialized(true);
        return localItems;
      }

      setIsSyncing(true);
      setCartError('');
      setAuthToken(tokenValue);

      try {
        const localItems = readLocalCart().map(normalizeLocalCartItem);

        if (localItems.length > 0) {
          for (const item of localItems) {
            await addCartItem(
              {
                productId: item.productId,
                quantity: item.quantity,
                selectedSize: item.selectedSize
              },
              tokenValue
            );
          }

          saveLocalCart([]);
        }

        const syncedItems = await loadServerCart(tokenValue);
        setIsInitialized(true);
        return syncedItems;
      } catch (error) {
        setCartError(error.response?.data?.message || 'Không thể đồng bộ giỏ hàng.');
        const fallbackItems = readLocalCart().map(normalizeLocalCartItem);
        setCartItems(fallbackItems);
        setIsInitialized(true);
        return fallbackItems;
      } finally {
        setIsSyncing(false);
      }
    },
    [loadServerCart]
  );

  const disconnectCart = useCallback(() => {
    setAuthToken('');
    setCartError('');
    setCartItems(readLocalCart().map(normalizeLocalCartItem));
  }, []);

  useEffect(() => {
    async function initializeCart() {
      const storedToken = getStoredToken();
      setAuthToken(storedToken);

      if (!storedToken) {
        setCartItems(readLocalCart().map(normalizeLocalCartItem));
        setIsInitialized(true);
        return;
      }

      await syncCart(storedToken);
    }

    initializeCart();
  }, [syncCart]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!hasMountedAuthEffect.current) {
      hasMountedAuthEffect.current = true;
      return;
    }

    if (token) {
      syncCart(token);
      return;
    }

    disconnectCart();
  }, [token, isInitialized, syncCart, disconnectCart]);

  async function addToCart(product, quantity = 1) {
    const safeQuantity = Math.max(Number(quantity) || 1, 1);
    const normalizedProduct = normalizeLocalCartItem({
      productId: product._id || product.productId,
      slug: product.slug,
      name: product.name,
      image: product.image || product.images?.[0] || '',
      price: product.price,
      stock: product.stock,
      selectedSize: product.selectedSize || ''
    });

    setCartError('');

    if (!authToken) {
      const nextItems = mergeLocalItems(cartItems, normalizedProduct, safeQuantity);
      setCartItems(nextItems);
      return nextItems;
    }

    setIsSyncing(true);

    try {
      const response = await addCartItem(
        {
          productId: normalizedProduct.productId,
          quantity: safeQuantity,
          selectedSize: normalizedProduct.selectedSize
        },
        authToken
      );
      const normalizedItems = normalizeServerCart(response.cart);
      setCartItems(normalizedItems);
      return normalizedItems;
    } catch (error) {
      setCartError(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }

  async function removeFromCart(itemId) {
    setCartError('');
    setSelectedCartItemKeys((currentKeys) => currentKeys.filter((key) => key !== itemId));

    if (!authToken) {
      setCartItems((currentItems) =>
        currentItems.filter((item) => (item.id || item.productId) !== itemId)
      );
      return;
    }

    setIsSyncing(true);

    try {
      await removeCartItem(itemId, authToken);
      await loadServerCart(authToken);
    } catch (error) {
      setCartError(error.response?.data?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng.');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }

  async function updateQuantity(itemId, quantity) {
    const safeQuantity = Math.max(Number(quantity) || 1, 1);
    setCartError('');

    if (!authToken) {
      const nextItems = cartItems.map((item) => {
          if ((item.id || item.productId) !== itemId) {
            return item;
          }

          const maxQuantity = item.stock > 0 ? item.stock : safeQuantity;

          return {
            ...item,
            quantity: Math.min(safeQuantity, maxQuantity)
          };
        });
      setCartItems(nextItems);
      return nextItems;
    }

    setIsSyncing(true);

    try {
      const response = await updateCartItemQuantity(itemId, safeQuantity, authToken);
      const normalizedItems = normalizeServerCart(response.cart);
      setCartItems(normalizedItems);
      return normalizedItems;
    } catch (error) {
      setCartError(error.response?.data?.message || 'Không thể cập nhật số lượng.');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }

  async function clearCart() {
    setCartError('');
    setAppliedCoupon(null);
    appliedCouponCartSignatureRef.current = '';
    setSelectedCartItemKeys([]);

    if (!authToken) {
      setCartItems([]);
      return;
    }

    setIsSyncing(true);

    try {
      await clearServerCart(authToken);
      setCartItems([]);
    } catch (error) {
      setCartError(error.response?.data?.message || 'Không thể xóa giỏ hàng.');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }

  async function removeSelectedFromCart() {
    const selectedKeySet = new Set(selectedCartItemKeys);
    const selectedItems = cartItems.filter((item) => selectedKeySet.has(getCartItemKey(item)));

    if (selectedItems.length === 0) {
      return;
    }

    setCartError('');
    setAppliedCoupon(null);
    appliedCouponCartSignatureRef.current = '';

    if (!authToken) {
      setCartItems((currentItems) => currentItems.filter((item) => !selectedKeySet.has(getCartItemKey(item))));
      setSelectedCartItemKeys([]);
      return;
    }

    setIsSyncing(true);

    try {
      for (const item of selectedItems) {
        await removeCartItem(getCartItemKey(item), authToken);
      }

      await loadServerCart(authToken);
      setSelectedCartItemKeys([]);
    } catch (error) {
      setCartError(error.response?.data?.message || 'Không thể xóa sản phẩm đã chọn.');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }

  async function clearSelectedAfterCheckout() {
    const selectedKeySet = new Set(selectedCartItemKeys);
    setAppliedCoupon(null);
    appliedCouponCartSignatureRef.current = '';

    if (!authToken) {
      setCartItems((currentItems) => currentItems.filter((item) => !selectedKeySet.has(getCartItemKey(item))));
      setSelectedCartItemKeys([]);
      return;
    }

    setIsSyncing(true);

    try {
      await loadServerCart(authToken);
      setSelectedCartItemKeys([]);
    } finally {
      setIsSyncing(false);
    }
  }

  function toggleCartItemSelection(itemId) {
    setSelectedCartItemKeys((currentKeys) =>
      currentKeys.includes(itemId)
        ? currentKeys.filter((key) => key !== itemId)
        : [...currentKeys, itemId]
    );
  }

  function selectAllCartItems() {
    setSelectedCartItemKeys(cartItems.map(getCartItemKey));
  }

  function clearCartSelection() {
    setSelectedCartItemKeys([]);
  }

  function selectOnlyCartItemByProduct(productId, selectedSize = '', items = cartItems) {
    const matchedItem = items.find(
      (item) => item.productId === productId && (item.selectedSize || '') === (selectedSize || '')
    );

    if (!matchedItem) {
      setSelectedCartItemKeys([]);
      return '';
    }

    const itemKey = getCartItemKey(matchedItem);
    setSelectedCartItemKeys([itemKey]);
    return itemKey;
  }

  const summary = useMemo(() => {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = appliedCoupon?.discountAmount || 0;
    const finalTotal = Math.max(totalPrice - discountAmount, 0);

    return {
      totalItems: cartItems.length,
      totalQuantity,
      totalPrice,
      discountAmount,
      finalTotal
    };
  }, [appliedCoupon, cartItems]);

  const selectedSummary = useMemo(() => {
    const selectedKeySet = new Set(selectedCartItemKeys);
    const selectedCartItems = cartItems.filter((item) => selectedKeySet.has(getCartItemKey(item)));
    const selectedTotalQuantity = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const selectedTotalPrice = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      selectedCartItems,
      selectedTotalItems: selectedCartItems.length,
      selectedTotalQuantity,
      selectedTotalPrice
    };
  }, [cartItems, selectedCartItemKeys]);

  async function applyCouponCode(code) {
    const normalizedCode = String(code || '').trim().toUpperCase();

    if (!normalizedCode) {
      setCouponStatus({ type: 'error', message: 'Vui lòng nhập mã giảm giá.' });
      return false;
    }

    const couponItems = selectedSummary.selectedTotalItems > 0 ? selectedSummary.selectedCartItems : cartItems;
    const couponTotal = selectedSummary.selectedTotalItems > 0 ? selectedSummary.selectedTotalPrice : summary.totalPrice;

    if (couponItems.length === 0) {
      setCouponStatus({ type: 'error', message: 'Giỏ hàng đang trống, không thể áp dụng mã.' });
      return false;
    }

    setIsCouponLoading(true);
    setCouponStatus({ type: '', message: '' });

    try {
      const response = await validateCoupon({
        code: normalizedCode,
        orderTotal: couponTotal
      });

      setAppliedCoupon({
        ...response.coupon,
        discountAmount: response.discountAmount,
        finalTotal: response.finalTotal
      });
      appliedCouponCartSignatureRef.current = buildCartSignature(couponItems);
      setCouponStatus({
        type: 'success',
        message: `Đã áp dụng mã ${response.coupon.code} thành công.`
      });
      return true;
    } catch (error) {
      setAppliedCoupon(null);
      appliedCouponCartSignatureRef.current = '';
      setCouponStatus({
        type: 'error',
        message: error.response?.data?.message || 'Không thể áp dụng mã giảm giá.'
      });
      return false;
    } finally {
      setIsCouponLoading(false);
    }
  }

  function removeCoupon(message = 'Đã hủy mã giảm giá.') {
    setAppliedCoupon(null);
    appliedCouponCartSignatureRef.current = '';
    setCouponStatus(message ? { type: 'info', message } : { type: '', message: '' });
  }

  const clearCouponStatus = useCallback(() => {
    setCouponStatus({ type: '', message: '' });
  }, []);

  const value = {
    cartItems,
    isInitialized,
    isSyncing,
    cartError,
    appliedCoupon,
    couponStatus,
    isCouponLoading,
    isLoggedIn: Boolean(authToken),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    removeSelectedFromCart,
    clearSelectedAfterCheckout,
    selectedCartItemKeys,
    toggleCartItemSelection,
    selectAllCartItems,
    clearCartSelection,
    selectOnlyCartItemByProduct,
    applyCouponCode,
    removeCoupon,
    clearCouponStatus,
    syncCart,
    disconnectCart,
    ...summary,
    ...selectedSummary
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export { CartContext };
