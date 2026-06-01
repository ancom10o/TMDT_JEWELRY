import SiteSetting, { DEFAULT_SITE_SETTING, SITE_SETTING_KEY } from '../models/SiteSetting.js';

const EDITABLE_FIELDS = [
  'storeName',
  'logoUrl',
  'hotline',
  'email',
  'address',
  'facebookUrl',
  'zaloUrl',
  'instagramUrl',
  'tiktokUrl',
  'messengerUrl',
  'googleMapUrl',
  'bankCode',
  'bankName',
  'bankAccountNumber',
  'bankAccountName',
  'freeShippingThreshold',
  'topbarMessages',
  'warrantyPolicy',
  'careGuide'
];

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeTopbarMessages(value) {
  if (!Array.isArray(value)) {
    return DEFAULT_SITE_SETTING.topbarMessages;
  }

  const messages = value.map((item) => normalizeString(item)).filter(Boolean).slice(0, 3);
  return messages.length > 0 ? messages : DEFAULT_SITE_SETTING.topbarMessages;
}

function normalizePayload(payload = {}) {
  const normalized = {};

  for (const field of EDITABLE_FIELDS) {
    if (typeof payload[field] === 'undefined') {
      continue;
    }

    if (field === 'freeShippingThreshold') {
      normalized[field] = Math.max(Number(payload[field]) || 0, 0);
    } else if (field === 'topbarMessages') {
      normalized[field] = normalizeTopbarMessages(payload[field]);
    } else {
      normalized[field] = normalizeString(payload[field]);
    }
  }

  if (normalized.bankCode) {
    normalized.bankCode = normalized.bankCode.toUpperCase();
  }

  return normalized;
}

export async function getSiteSettingsDocument() {
  const setting = await SiteSetting.findOneAndUpdate(
    { settingKey: SITE_SETTING_KEY },
    { $setOnInsert: DEFAULT_SITE_SETTING },
    { new: true, upsert: true, runValidators: true }
  );

  return setting;
}

export async function getPublicSiteSettings(req, res, next) {
  try {
    const setting = await getSiteSettingsDocument();
    res.json({ settings: setting });
  } catch (error) {
    next(error);
  }
}

export async function getAdminSiteSettings(req, res, next) {
  try {
    const setting = await getSiteSettingsDocument();
    res.json({ settings: setting });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminSiteSettings(req, res, next) {
  try {
    const payload = normalizePayload(req.body);

    await getSiteSettingsDocument();
    const setting = await SiteSetting.findOneAndUpdate(
      { settingKey: SITE_SETTING_KEY },
      { $set: payload },
      { new: true, runValidators: true }
    );

    res.json({ settings: setting });
  } catch (error) {
    next(error);
  }
}
