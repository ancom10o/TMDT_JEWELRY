import Banner from '../models/Banner.js';

function normalizeBannerPayload(payload = {}) {
  return {
    name: payload.name?.trim?.() || '',
    bannerType: payload.bannerType?.trim?.() || 'hero',
    imageUrl: payload.imageUrl?.trim?.() || '',
    mobileImageUrl: payload.mobileImageUrl?.trim?.() || '',
    title: payload.title?.trim?.() || '',
    subtitle: payload.subtitle?.trim?.() || '',
    buttonLabel: payload.buttonLabel?.trim?.() || '',
    buttonLink: payload.buttonLink?.trim?.() || '/products',
    isActive: typeof payload.isActive === 'boolean' ? payload.isActive : true
  };
}

export async function getBanners(req, res, next) {
  try {
    const filter = {};

    if (req.query.active === 'true') {
      filter.isActive = true;
    }

    const banners = await Banner.find(filter).sort({ createdAt: -1 });
    res.json({ banners });
  } catch (error) {
    next(error);
  }
}

export async function createBanner(req, res, next) {
  try {
    const banner = await Banner.create(normalizeBannerPayload(req.body));
    res.status(201).json({ banner });
  } catch (error) {
    next(error);
  }
}

export async function updateBanner(req, res, next) {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, normalizeBannerPayload(req.body), {
      new: true,
      runValidators: true
    });

    if (!banner) {
      return res.status(404).json({ message: 'Khong tim thay banner.' });
    }

    res.json({ banner });
  } catch (error) {
    next(error);
  }
}

export async function deleteBanner(req, res, next) {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: 'Khong tim thay banner.' });
    }

    res.json({ message: 'Da xoa banner.' });
  } catch (error) {
    next(error);
  }
}
