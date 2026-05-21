import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL
});

function buildAuthConfig(token) {
  if (!token) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}

const publicAssetBaseUrl = baseURL.replace(/\/api\/?$/, '');
const defaultProductImage = '/images/category_default_.png';

export function getImageUrl(image) {
  if (!image) {
    return `${publicAssetBaseUrl}${defaultProductImage}`;
  }

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${publicAssetBaseUrl}${image.startsWith('/') ? image : `/${image}`}`;
}

export function getPublicAssetUrl(path) {
  return getImageUrl(path);
}

export async function getProducts(params = {}) {
  const response = await api.get('/products', { params });
  return response.data;
}

export async function createProduct(payload, token) {
  const response = await api.post('/products', payload, buildAuthConfig(token));
  return response.data;
}

export async function uploadProductImages(files, token) {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => {
    formData.append('images', file);
  });

  const response = await api.post('/products/upload-images', formData, {
    ...buildAuthConfig(token),
    headers: {
      ...buildAuthConfig(token).headers,
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
}

export async function updateProduct(productId, payload, token) {
  const response = await api.put(`/products/${productId}`, payload, buildAuthConfig(token));
  return response.data;
}

export async function deleteProduct(productId, token) {
  const response = await api.delete(`/products/${productId}`, buildAuthConfig(token));
  return response.data;
}

export async function getCategories() {
  const response = await api.get('/categories');
  return response.data;
}

export async function createCategory(payload, token) {
  const response = await api.post('/categories', payload, buildAuthConfig(token));
  return response.data;
}

export async function updateCategory(categoryId, payload, token) {
  const response = await api.put(`/categories/${categoryId}`, payload, buildAuthConfig(token));
  return response.data;
}

export async function deleteCategory(categoryId, token) {
  const response = await api.delete(`/categories/${categoryId}`, buildAuthConfig(token));
  return response.data;
}

export async function getProductDetail(slugOrId) {
  const response = await api.get(`/products/${slugOrId}`);
  return response.data;
}

export async function getCart(token) {
  const response = await api.get('/cart', buildAuthConfig(token));
  return response.data;
}

export async function addCartItem(payload, token) {
  const response = await api.post('/cart', payload, buildAuthConfig(token));
  return response.data;
}

export async function updateCartItemQuantity(itemId, quantity, token) {
  const response = await api.put(`/cart/${itemId}`, { quantity }, buildAuthConfig(token));
  return response.data;
}

export async function removeCartItem(itemId, token) {
  const response = await api.delete(`/cart/${itemId}`, buildAuthConfig(token));
  return response.data;
}

export async function clearServerCart(token) {
  const response = await api.delete('/cart', buildAuthConfig(token));
  return response.data;
}

export async function createOrder(payload, token) {
  const response = await api.post('/orders', payload, buildAuthConfig(token));
  return response.data;
}

export async function validateCoupon(payload) {
  const response = await api.post('/coupons/validate', payload);
  return response.data;
}

export async function getCoupons(token) {
  const response = await api.get('/coupons', buildAuthConfig(token));
  return response.data;
}

export async function getCouponDetail(couponId, token) {
  const response = await api.get(`/coupons/${couponId}`, buildAuthConfig(token));
  return response.data;
}

export async function createCoupon(payload, token) {
  const response = await api.post('/coupons', payload, buildAuthConfig(token));
  return response.data;
}

export async function updateCoupon(couponId, payload, token) {
  const response = await api.put(`/coupons/${couponId}`, payload, buildAuthConfig(token));
  return response.data;
}

export async function deleteCoupon(couponId, token) {
  const response = await api.delete(`/coupons/${couponId}`, buildAuthConfig(token));
  return response.data;
}

export async function toggleCouponActive(couponId, token) {
  const response = await api.patch(`/coupons/${couponId}/toggle-active`, {}, buildAuthConfig(token));
  return response.data;
}

export async function getOrders(token) {
  const response = await api.get('/orders', buildAuthConfig(token));
  return response.data;
}

export async function getMyOrders(token) {
  const response = await api.get('/orders/my-orders', buildAuthConfig(token));
  return response.data;
}

export async function getOrderDetail(orderId, token) {
  const response = await api.get(`/orders/${orderId}`, buildAuthConfig(token));
  return response.data;
}

export async function cancelMyOrder(orderId, token) {
  const response = await api.patch(`/orders/${orderId}/cancel`, {}, buildAuthConfig(token));
  return response.data;
}

export async function updateOrderStatus(orderId, payload, token) {
  const response = await api.put(`/orders/${orderId}/status`, payload, buildAuthConfig(token));
  return response.data;
}

export async function confirmOrderPayment(orderId, token) {
  const response = await api.patch(`/orders/${orderId}/confirm-payment`, {}, buildAuthConfig(token));
  return response.data;
}

export async function getUsers(token) {
  const response = await api.get('/users', buildAuthConfig(token));
  return response.data;
}

export async function getUserOrders(userId, token) {
  const response = await api.get(`/users/${userId}/orders`, buildAuthConfig(token));
  return response.data;
}

export async function getWishlist(token) {
  const response = await api.get('/users/wishlist', buildAuthConfig(token));
  return response.data;
}

export async function addWishlistItem(productId, token) {
  const response = await api.post(`/users/wishlist/${productId}`, {}, buildAuthConfig(token));
  return response.data;
}

export async function removeWishlistItem(productId, token) {
  const response = await api.delete(`/users/wishlist/${productId}`, buildAuthConfig(token));
  return response.data;
}

export async function updateMyProfile(payload, token) {
  const response = await api.put('/users/me', payload, buildAuthConfig(token));
  return response.data;
}

export async function updateUser(userId, payload, token) {
  const response = await api.put(`/users/${userId}`, payload, buildAuthConfig(token));
  return response.data;
}

export async function getAdminDashboard(token, params = {}) {
  const response = await api.get('/admin/dashboard', {
    ...buildAuthConfig(token),
    params
  });
  return response.data;
}

export async function getAdminProducts(params = {}, token) {
  const response = await api.get('/admin/products', {
    ...buildAuthConfig(token),
    params
  });
  return response.data;
}

export async function downloadAdminProductsExcel(token) {
  const response = await api.get('/admin/exports/products', {
    ...buildAuthConfig(token),
    responseType: 'blob'
  });
  return response.data;
}

export async function downloadMonthlyRevenueExcel({ year, month, fromDate, toDate }, token) {
  const response = await api.get('/admin/exports/revenue', {
    ...buildAuthConfig(token),
    params: { year, month, fromDate, toDate },
    responseType: 'blob'
  });
  return response.data;
}

export async function getHomeSections() {
  const response = await api.get('/home');
  return response.data;
}

export async function getAdminHomepage(token) {
  const response = await api.get('/admin/homepage', buildAuthConfig(token));
  return response.data;
}

export async function createHomeSection(payload, token) {
  const response = await api.post('/admin/homepage/sections', payload, buildAuthConfig(token));
  return response.data;
}

export async function updateHomeSection(sectionId, payload, token) {
  const response = await api.put(`/admin/homepage/sections/${sectionId}`, payload, buildAuthConfig(token));
  return response.data;
}

export async function deleteHomeSection(sectionId, token) {
  const response = await api.delete(`/admin/homepage/sections/${sectionId}`, buildAuthConfig(token));
  return response.data;
}

export async function reorderHomeSections(sectionIds, token) {
  const response = await api.patch('/admin/homepage/sections/reorder', { sectionIds }, buildAuthConfig(token));
  return response.data;
}

export async function getAdminBanners(token) {
  const response = await api.get('/admin/banners', buildAuthConfig(token));
  return response.data;
}

export async function createBanner(payload, token) {
  const response = await api.post('/admin/banners', payload, buildAuthConfig(token));
  return response.data;
}

export async function updateBanner(bannerId, payload, token) {
  const response = await api.put(`/admin/banners/${bannerId}`, payload, buildAuthConfig(token));
  return response.data;
}

export async function deleteBanner(bannerId, token) {
  const response = await api.delete(`/admin/banners/${bannerId}`, buildAuthConfig(token));
  return response.data;
}

export async function loginUser(payload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function getCurrentUser(token) {
  const response = await api.get('/auth/me', buildAuthConfig(token));
  return response.data;
}

export default api;
