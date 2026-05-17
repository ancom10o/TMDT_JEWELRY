/* eslint-disable react/prop-types */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { addWishlistItem, getWishlist, removeWishlistItem } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWishlist = useCallback(async () => {
    if (!token) {
      setWishlistItems([]);
      return [];
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await getWishlist(token);
      const items = response.wishlist || [];
      setWishlistItems(items);
      return items;
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không thể tải danh sách yêu thích.');
      setWishlistItems([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setWishlistItems([]);
      setError('');
      return;
    }

    loadWishlist();
  }, [isAuthenticated, loadWishlist, token]);

  const wishlistIds = useMemo(
    () => wishlistItems.map((item) => item._id).filter(Boolean),
    [wishlistItems]
  );

  const isFavorite = useCallback(
    (productId) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      if (!token || !product?._id) {
        throw new Error('Bạn cần đăng nhập để dùng tính năng yêu thích.');
      }

      const favorite = wishlistIds.includes(product._id);
      setError('');

      if (favorite) {
        await removeWishlistItem(product._id, token);
        setWishlistItems((current) => current.filter((item) => item._id !== product._id));
        return { action: 'removed' };
      }

      await addWishlistItem(product._id, token);
      setWishlistItems((current) => {
        if (current.some((item) => item._id === product._id)) {
          return current;
        }

        return [product, ...current];
      });
      return { action: 'added' };
    },
    [token, wishlistIds]
  );

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistIds,
      wishlistCount: wishlistItems.length,
      isLoading,
      error,
      loadWishlist,
      toggleWishlist,
      isFavorite
    }),
    [wishlistItems, isLoading, error, loadWishlist, toggleWishlist, isFavorite, wishlistIds]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export { WishlistContext };
