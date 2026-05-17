import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

function parsePositiveNumber(value, fallback) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function normalizeGenderFilter(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  const genderMap = {
    nam: 'male',
    male: 'male',
    nu: 'female',
    'nữ': 'female',
    female: 'female',
    unisex: 'unisex'
  };

  return genderMap[normalizedValue] || '';
}

function buildGenderCompatibilityFilter(gender) {
  const legacyGenderMap = {
    male: ['Nam'],
    female: ['Nu', 'Nữ'],
    unisex: ['Unisex']
  };

  return [gender, ...(legacyGenderMap[gender] || [])];
}

function normalizeMaterialGroupFilter(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  return ['gold', 'silver', 'platinum', 'other'].includes(normalizedValue) ? normalizedValue : '';
}

function buildLegacyMaterialRegexes(materialGroup) {
  const legacyMap = {
    gold: ['vang', 'vàng'],
    silver: ['bac', 'bạc'],
    platinum: ['platinum', 'bach kim', 'bạch kim'],
    other: ['titanium', 'thep', 'thép', 'ngoc trai', 'ngọc trai']
  };

  return (legacyMap[materialGroup] || []).map((item) => new RegExp(item, 'i'));
}

async function resolveCategoryFilter(categoryValue) {
  if (!categoryValue) {
    return { hasCategoryFilter: false, categoryId: null, hasMatch: true };
  }

  if (mongoose.isValidObjectId(categoryValue)) {
    return { hasCategoryFilter: true, categoryId: categoryValue, hasMatch: true };
  }

  const category = await Category.findOne({ slug: categoryValue }).select('_id');
  return {
    hasCategoryFilter: true,
    categoryId: category?._id || null,
    hasMatch: Boolean(category)
  };
}

export async function getProducts(req, res, next) {
  try {
    const {
      category,
      material,
      materialGroup,
      status,
      featured,
      gender,
      stockStatus,
      name,
      keyword,
      q,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const filter = {};
    const currentPage = parsePositiveNumber(page, 1);
    const pageSize = Math.min(parsePositiveNumber(limit, 12), 50);
    const searchKeyword = (name || keyword || q || '').trim();
    const categoryFilter = await resolveCategoryFilter(category);

    if (categoryFilter.hasCategoryFilter && !categoryFilter.hasMatch) {
      return res.json({
        products: [],
        pagination: {
          page: currentPage,
          limit: pageSize,
          total: 0,
          totalPages: 1
        },
        filters: {
          category: category || '',
          keyword: searchKeyword,
          gender: normalizeGenderFilter(gender),
          materialGroup: normalizeMaterialGroupFilter(materialGroup),
          stockStatus: stockStatus || '',
          minPrice: minPrice ? Number(minPrice) : null,
          maxPrice: maxPrice ? Number(maxPrice) : null,
          sort
        }
      });
    }

    if (categoryFilter.categoryId) {
      filter.category = categoryFilter.categoryId;
    }

    if (status) {
      filter.status = status;
    }

    if (stockStatus === 'in_stock') {
      filter.stock = { $gt: 0 };
    }

    if (stockStatus === 'out_stock') {
      filter.stock = { $lte: 0 };
    }

    if (stockStatus === 'low_stock') {
      filter.stock = { $gt: 0, $lte: 10 };
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    const normalizedGender = normalizeGenderFilter(gender);
    if (normalizedGender) {
      filter.gender = { $in: buildGenderCompatibilityFilter(normalizedGender) };
    }

    if (searchKeyword) {
      filter.name = { $regex: searchKeyword, $options: 'i' };
    }

    if (material) {
      const materialFilters = String(material)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (materialFilters.length > 0) {
        const materialRegexes = materialFilters.map((item) => new RegExp(item, 'i'));
        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { material: { $in: materialRegexes } },
              { materialDetail: { $in: materialRegexes } }
            ]
          }
        ];
      }
    }

    const normalizedMaterialGroup = normalizeMaterialGroupFilter(materialGroup);
    if (normalizedMaterialGroup) {
      const legacyRegexes = buildLegacyMaterialRegexes(normalizedMaterialGroup);
      const materialGroupFilter = [{ materialGroup: normalizedMaterialGroup }];

      if (legacyRegexes.length > 0) {
        materialGroupFilter.push({
          $and: [
            {
              $or: [
                { materialGroup: { $exists: false } },
                { materialGroup: '' },
                { materialGroup: null }
              ]
            },
            {
              $or: [
                { material: { $in: legacyRegexes } },
                { materialDetail: { $in: legacyRegexes } }
              ]
            }
          ]
        });
      }

      filter.$or = materialGroupFilter;
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice && !Number.isNaN(Number(minPrice))) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice && !Number.isNaN(Number(maxPrice))) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      best_selling: { sold: -1 },
      sold: { sold: -1 }
    };

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortMap[sort] || sortMap.newest)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    res.json({
      products,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total: totalProducts,
        totalPages: Math.max(1, Math.ceil(totalProducts / pageSize))
      },
      filters: {
        category: category || '',
        keyword: searchKeyword,
        gender: normalizedGender,
        materialGroup: normalizedMaterialGroup,
        stockStatus: stockStatus || '',
        minPrice: minPrice ? Number(minPrice) : null,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        sort
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductDetail(req, res, next) {
  try {
    const { slugOrId } = req.params;
    const query = mongoose.isValidObjectId(slugOrId)
      ? { $or: [{ _id: slugOrId }, { slug: slugOrId }] }
      : { slug: slugOrId };

    const product = await Product.findOne(query).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Danh muc khong ton tai.' });
    }

    const product = await Product.create(req.body);
    const populatedProduct = await product.populate('category', 'name slug');

    res.status(201).json({ product: populatedProduct });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Danh muc khong ton tai.' });
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }

    res.json({ message: 'Da xoa san pham.' });
  } catch (error) {
    next(error);
  }
}
