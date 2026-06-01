/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSiteSettings } from '../services/api.js';

export const DEFAULT_SITE_SETTINGS = {
  storeName: 'JewelAura',
  logoUrl: '',
  hotline: '1900 6868',
  email: 'support@jewelaura.vn',
  address: 'Học viện Công nghệ Bưu chính Viễn thông',
  facebookUrl: '',
  zaloUrl: 'https://zalo.me/0349865887',
  instagramUrl: '',
  tiktokUrl: '',
  messengerUrl: '',
  googleMapUrl: '',
  bankCode: 'TCB',
  bankName: 'Techcombank',
  bankAccountNumber: '0349865887',
  bankAccountName: 'NGUYEN DUC HA',
  freeShippingThreshold: 1000000,
  topbarMessages: [
    'Hotline: 1900 6868',
    'Miễn phí giao hàng cho đơn từ 1.000.000đ',
    'Đổi size trong 7 ngày với sản phẩm đủ điều kiện'
  ],
  warrantyPolicy: [
    'Bảo hành chính hãng theo chính sách áp dụng của JewelAura đối với từng dòng sản phẩm.',
    'Hỗ trợ kiểm tra, vệ sinh và tư vấn đổi size trong thời gian phù hợp với điều kiện sản phẩm.'
  ].join('\n'),
  careGuide: [
    'Tránh để trang sức tiếp xúc trực tiếp với hóa chất mạnh, nước hoa và môi trường ẩm kéo dài.',
    'Bảo quản trong hộp riêng, lau nhẹ bằng khăn mềm sau khi sử dụng để giữ độ sáng và bề mặt hoàn thiện.'
  ].join('\n')
};

const SiteSettingsContext = createContext(null);

function mergeSettings(settings) {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...(settings || {}),
    topbarMessages: Array.isArray(settings?.topbarMessages) && settings.topbarMessages.length > 0
      ? settings.topbarMessages
      : DEFAULT_SITE_SETTINGS.topbarMessages
  };
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await getSiteSettings();
      setSettings(mergeSettings(response.settings));
    } catch {
      setSettings(DEFAULT_SITE_SETTINGS);
      setErrorMessage('Không thể tải cài đặt website.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateLocalSettings = useCallback((nextSettings) => {
    setSettings(mergeSettings(nextSettings));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      errorMessage,
      refreshSettings,
      updateLocalSettings
    }),
    [errorMessage, loading, refreshSettings, settings, updateLocalSettings]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }

  return context;
}
