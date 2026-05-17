import Banner from '../models/Banner.js';
import Category from '../models/Category.js';
import HomeSection from '../models/HomeSection.js';
import Product from '../models/Product.js';

async function validateSectionPayload(payload) {
  if (Array.isArray(payload.productIds) && payload.productIds.length > 0) {
    const existingProducts = await Product.countDocuments({ _id: { $in: payload.productIds } });

    if (existingProducts !== payload.productIds.length) {
      return 'Danh sach san pham co phan tu khong ton tai.';
    }
  }

  if (Array.isArray(payload.bannerIds) && payload.bannerIds.length > 0) {
    const existingBanners = await Banner.countDocuments({ _id: { $in: payload.bannerIds } });

    if (existingBanners !== payload.bannerIds.length) {
      return 'Danh sach banner co phan tu khong ton tai.';
    }
  }

  return '';
}

function buildSectionQuery(activeOnly = false) {
  return HomeSection.find(activeOnly ? { isActive: true } : {})
    .populate('bannerIds')
    .populate({
      path: 'productIds',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    })
    .sort({ order: 1, createdAt: 1 });
}

function getSectionById(sectionId) {
  return HomeSection.findById(sectionId)
    .populate('bannerIds')
    .populate({
      path: 'productIds',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    });
}

export async function getPublicHomeSections(req, res, next) {
  try {
    const [sections, categories] = await Promise.all([
      buildSectionQuery(true),
      Category.find({ status: 'active' }).sort({ createdAt: 1 })
    ]);

    const normalizedSections = sections.map((section) => {
      const plainSection = section.toObject();

      return {
        ...plainSection,
        bannerIds: Array.isArray(plainSection.bannerIds)
          ? plainSection.bannerIds.filter((banner) => banner?.isActive)
          : [],
        productIds: Array.isArray(plainSection.productIds)
          ? plainSection.productIds.filter((product) => product?.status === 'active')
          : []
      };
    });

    res.json({ sections: normalizedSections, categories });
  } catch (error) {
    next(error);
  }
}

export async function getAdminHomeSections(req, res, next) {
  try {
    const [sections, banners, products, categories] = await Promise.all([
      buildSectionQuery(false),
      Banner.find().sort({ createdAt: -1 }),
      Product.find({ status: 'active' })
        .select('name slug images price oldPrice status isFeatured category')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(120),
      Category.find({ status: 'active' }).sort({ createdAt: 1 })
    ]);

    res.json({
      sections,
      banners,
      products,
      categories
    });
  } catch (error) {
    next(error);
  }
}

export async function createHomeSection(req, res, next) {
  try {
    const validationMessage = await validateSectionPayload(req.body);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const section = await HomeSection.create(req.body);
    const populatedSection = await getSectionById(section._id);

    res.status(201).json({ section: populatedSection });
  } catch (error) {
    next(error);
  }
}

export async function updateHomeSection(req, res, next) {
  try {
    const validationMessage = await validateSectionPayload(req.body);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const section = await HomeSection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!section) {
      return res.status(404).json({ message: 'Khong tim thay section homepage.' });
    }

    const populatedSection = await getSectionById(section._id);
    res.json({ section: populatedSection });
  } catch (error) {
    next(error);
  }
}

export async function deleteHomeSection(req, res, next) {
  try {
    const section = await HomeSection.findByIdAndDelete(req.params.id);

    if (!section) {
      return res.status(404).json({ message: 'Khong tim thay section homepage.' });
    }

    res.json({ message: 'Da xoa section homepage.' });
  } catch (error) {
    next(error);
  }
}

export async function reorderHomeSections(req, res, next) {
  try {
    const { sectionIds = [] } = req.body;

    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return res.status(400).json({ message: 'Danh sach section sap xep khong hop le.' });
    }

    await Promise.all(
      sectionIds.map((sectionId, index) =>
        HomeSection.findByIdAndUpdate(sectionId, { order: index + 1 }, { runValidators: true })
      )
    );

    const sections = await buildSectionQuery(false);
    res.json({ sections });
  } catch (error) {
    next(error);
  }
}
