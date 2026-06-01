import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { buildProductSearchText, escapeRegex, normalizeText } from '../utils/search.js';

const PUBLIC_PRODUCT_EXCLUDE_FIELDS = '-costPrice';

function parsePositiveNumber(value, fallback) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function parseMoney(value, fieldName) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    const error = new Error(`${fieldName} phai lon hon hoac bang 0.`);
    error.statusCode = 400;
    throw error;
  }

  return numberValue;
}

async function assertSkuIsUnique(sku, currentProductId = null) {
  const normalizedSku = String(sku || '').trim().toUpperCase();
  if (!normalizedSku) return;

  const existingProduct = await Product.findOne({ sku: normalizedSku }).select('_id').lean();
  if (existingProduct && existingProduct._id.toString() !== currentProductId?.toString()) {
    const error = new Error('SKU da ton tai. Vui long nhap ma san pham khac.');
    error.statusCode = 400;
    throw error;
  }
}

function buildProductPayload(body = {}) {
  const payload = {
    ...body,
    costPrice: parseMoney(body.costPrice, 'Gia nhap'),
    originalPrice: parseMoney(body.originalPrice ?? body.oldPrice ?? body.price, 'Gia goc'),
    price: parseMoney(body.price, 'Gia ban')
  };

  if (payload.costPrice > 0 && payload.price < payload.costPrice * 1.2) {
    const minimumPrice = Math.ceil(payload.costPrice * 1.2);
    const error = new Error(`Gia ban phai lon hon hoac bang 120% gia nhap. Gia toi thieu: ${minimumPrice}.`);
    error.statusCode = 400;
    throw error;
  }

  delete payload.oldPrice;
  delete payload.discount;
  delete payload.discountPercent;

  if (typeof body.sku === 'string') {
    payload.sku = body.sku.trim().toUpperCase();
  }

  if (!payload.sku) {
    delete payload.sku;
  }

  return payload;
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

function getSearchTokens(searchKeyword) {
  const normalizedKeyword = normalizeText(searchKeyword);
  if (!normalizedKeyword) {
    return [];
  }

  return [...new Set(normalizedKeyword.split(' ').filter(Boolean))];
}

function detectGenderIntent(searchTokens) {
  if (searchTokens.includes('unisex')) {
    return 'unisex';
  }

  if (searchTokens.includes('nam')) {
    return 'male';
  }

  if (searchTokens.includes('nu')) {
    return 'female';
  }

  return '';
}

function parseSearchIntent(searchKeyword) {
  const searchTokens = getSearchTokens(searchKeyword);
  const detectedGender = detectGenderIntent(searchTokens);
  const keywordTokens = detectedGender
    ? searchTokens.filter((token) => !['nam', 'nu', 'unisex'].includes(token))
    : searchTokens;

  return {
    detectedGender,
    keyword: keywordTokens.join(' '),
    tokens: keywordTokens
  };
}

async function resolveSearchCategoryIds(normalizedKeyword, searchTokens) {
  if (!normalizedKeyword && searchTokens.length === 0) {
    return [];
  }

  const categories = await Category.find({ status: 'active' }).select('_id name slug').lean();
  return categories
    .filter((categoryItem) => {
      const normalizedCategory = normalizeText(`${categoryItem.name} ${categoryItem.slug}`);
      return normalizedCategory.includes(normalizedKeyword) || searchTokens.some((token) => normalizedCategory.includes(token));
    })
    .map((categoryItem) => categoryItem._id);
}

function buildSearchFilter(searchTokens, searchCategoryIds = []) {
  return searchTokens.map((token) => {
    const tokenRegex = new RegExp(escapeRegex(token), 'i');
    const tokenConditions = [
      { name: tokenRegex },
      { slug: tokenRegex },
      { material: tokenRegex },
      { materialDetail: tokenRegex },
      { materialGroup: tokenRegex },
      { stone: tokenRegex },
      { sku: tokenRegex }
    ];

    if (searchCategoryIds.length > 0) {
      tokenConditions.push({ category: { $in: searchCategoryIds } });
    }

    return {
      $or: tokenConditions
    };
  });
}

function includesNormalizedText(source, keyword) {
  return normalizeText(source).includes(keyword);
}

function countTokenMatches(source, searchTokens) {
  const normalizedSource = normalizeText(source);
  return searchTokens.reduce((count, token) => (normalizedSource.includes(token) ? count + 1 : count), 0);
}

function calculateSearchScore(product, normalizedKeyword, searchTokens) {
  if (!normalizedKeyword || searchTokens.length === 0) {
    return 0;
  }

  const categoryName = product.category?.name || '';
  const categorySlug = product.category?.slug || '';
  const materialText = [product.material, product.materialDetail, product.materialGroup, product.stone, product.sku].filter(Boolean).join(' ');
  const searchableText = [
    product.name,
    product.slug,
    categoryName,
    categorySlug,
    product.gender,
    materialText
  ].join(' ');

  let score = 0;

  if (includesNormalizedText(product.name, normalizedKeyword)) {
    score += 1000;
  }

  const nameTokenMatches = countTokenMatches(product.name, searchTokens);
  score += nameTokenMatches * 160;

  if (nameTokenMatches === searchTokens.length) {
    score += 260;
  }

  const categoryTokenMatches = countTokenMatches(`${categoryName} ${categorySlug}`, searchTokens);
  score += categoryTokenMatches * 90;

  const genderLabels = product.gender === 'male'
    ? 'male nam gioi nam trang suc nam'
    : product.gender === 'female'
      ? 'female nu gioi nu trang suc nu'
      : 'unisex nam nu trang suc unisex';
  const genderTokenMatches = countTokenMatches(genderLabels, searchTokens);
  score += genderTokenMatches * 55;

  const materialTokenMatches = countTokenMatches(materialText, searchTokens);
  score += materialTokenMatches * 35;

  const searchableTokenMatches = countTokenMatches(searchableText, searchTokens);
  score += searchableTokenMatches * 8;

  if (product.isFeatured) score += 3;
  if (product.isBestSeller) score += 3;

  return score;
}

function compareBySort(sort) {
  const sortMap = {
    newest: (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
    price_asc: (left, right) => left.price - right.price,
    price_desc: (left, right) => right.price - left.price,
    best_selling: (left, right) => (right.sold || 0) - (left.sold || 0),
    sold: (left, right) => (right.sold || 0) - (left.sold || 0)
  };

  return sortMap[sort] || sortMap.newest;
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
    const searchIntent = parseSearchIntent(searchKeyword);
    const normalizedSearchKeyword = searchIntent.keyword;
    const searchTokens = searchIntent.tokens;
    const categoryFilter = await resolveCategoryFilter(category);
    const searchCategoryIds = await resolveSearchCategoryIds(normalizedSearchKeyword, searchTokens);

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

    if (req.includeAdminProductFields) {
      if (status) {
        filter.status = status;
      }
    } else {
      filter.status = 'active';
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

    const normalizedGender = searchIntent.detectedGender || normalizeGenderFilter(gender);
    if (normalizedGender) {
      filter.gender = { $in: buildGenderCompatibilityFilter(normalizedGender) };
    }

    const searchFilter = buildSearchFilter(searchTokens, searchCategoryIds);
    if (searchFilter.length > 0) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: searchFilter
        }
      ];
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

    let totalProducts = 0;
    let products = [];

    if (searchTokens.length > 0) {
      const searchCandidates = await Product.find(filter)
        .select(req.includeAdminProductFields ? '' : PUBLIC_PRODUCT_EXCLUDE_FIELDS)
        .populate('category', 'name slug')
        .sort(sortMap[sort] || sortMap.newest);

      const fallbackSort = compareBySort(sort);
      const rankedProducts = searchCandidates
        .map((product) => ({
          product,
          searchScore: calculateSearchScore(product, normalizedSearchKeyword, searchTokens)
        }))
        .filter((item) => item.searchScore > 0)
        .sort((left, right) => {
          if (right.searchScore !== left.searchScore) {
            return right.searchScore - left.searchScore;
          }

          return fallbackSort(left.product, right.product);
        });

      totalProducts = rankedProducts.length;
      products = rankedProducts
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
        .map((item) => item.product);
    } else {
      totalProducts = await Product.countDocuments(filter);
      products = await Product.find(filter)
        .select(req.includeAdminProductFields ? '' : PUBLIC_PRODUCT_EXCLUDE_FIELDS)
        .populate('category', 'name slug')
        .sort(sortMap[sort] || sortMap.newest)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize);
    }

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

    const product = await Product.findOne(query)
      .select(PUBLIC_PRODUCT_EXCLUDE_FIELDS)
      .populate('category', 'name slug');

    if (!product || product.status !== 'active') {
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const payload = buildProductPayload(req.body);
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Danh muc khong ton tai.' });
    }

    await assertSkuIsUnique(payload.sku);
    payload.searchText = buildProductSearchText(payload, categoryExists);

    const product = await Product.create(payload);
    const populatedProduct = await product.populate('category', 'name slug');

    res.status(201).json({ product: populatedProduct });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const payload = buildProductPayload(req.body);
    const currentProduct = await Product.findById(req.params.id);

    if (!currentProduct) {
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }

    let categoryForSearch = null;
    if (req.body.category) {
      categoryForSearch = await Category.findById(req.body.category);
      if (!categoryForSearch) {
        return res.status(400).json({ message: 'Danh muc khong ton tai.' });
      }
    } else {
      categoryForSearch = await Category.findById(currentProduct.category);
    }

    await assertSkuIsUnique(payload.sku, req.params.id);
    Object.assign(currentProduct, payload);
    currentProduct.searchText = buildProductSearchText(currentProduct, categoryForSearch);

    await currentProduct.save();
    const product = await currentProduct.populate('category', 'name slug');

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function getAdminProducts(req, res, next) {
  try {
    req.includeAdminProductFields = true;
    return getProducts(req, res, next);
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
