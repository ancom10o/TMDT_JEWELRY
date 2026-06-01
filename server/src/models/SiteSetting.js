import mongoose from 'mongoose';

export const SITE_SETTING_KEY = 'default';

export const DEFAULT_SITE_SETTING = {
  settingKey: SITE_SETTING_KEY,
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

const siteSettingSchema = new mongoose.Schema(
  {
    settingKey: {
      type: String,
      unique: true,
      default: SITE_SETTING_KEY
    },
    storeName: { type: String, trim: true, default: DEFAULT_SITE_SETTING.storeName },
    logoUrl: { type: String, trim: true, default: '' },
    hotline: { type: String, trim: true, default: DEFAULT_SITE_SETTING.hotline },
    email: { type: String, trim: true, default: DEFAULT_SITE_SETTING.email },
    address: { type: String, trim: true, default: DEFAULT_SITE_SETTING.address },
    facebookUrl: { type: String, trim: true, default: '' },
    zaloUrl: { type: String, trim: true, default: DEFAULT_SITE_SETTING.zaloUrl },
    instagramUrl: { type: String, trim: true, default: '' },
    tiktokUrl: { type: String, trim: true, default: '' },
    messengerUrl: { type: String, trim: true, default: '' },
    googleMapUrl: { type: String, trim: true, default: '' },
    bankCode: { type: String, trim: true, uppercase: true, default: DEFAULT_SITE_SETTING.bankCode },
    bankName: { type: String, trim: true, default: DEFAULT_SITE_SETTING.bankName },
    bankAccountNumber: { type: String, trim: true, default: DEFAULT_SITE_SETTING.bankAccountNumber },
    bankAccountName: { type: String, trim: true, default: DEFAULT_SITE_SETTING.bankAccountName },
    freeShippingThreshold: { type: Number, min: 0, default: DEFAULT_SITE_SETTING.freeShippingThreshold },
    topbarMessages: { type: [String], default: DEFAULT_SITE_SETTING.topbarMessages },
    warrantyPolicy: { type: String, trim: true, default: DEFAULT_SITE_SETTING.warrantyPolicy },
    careGuide: { type: String, trim: true, default: DEFAULT_SITE_SETTING.careGuide }
  },
  {
    timestamps: true
  }
);

const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);

export default SiteSetting;
