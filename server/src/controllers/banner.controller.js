import Banner from '../models/Banner.js';

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
    const banner = await Banner.create(req.body);
    res.status(201).json({ banner });
  } catch (error) {
    next(error);
  }
}

export async function updateBanner(req, res, next) {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
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
