import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

function parsePositiveNumber(value, fallback) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
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
      status,
      featured,
      gender,
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

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    if (gender) {
      filter.gender = gender;
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
        filter.material = {
          $in: materialFilters.map((item) => new RegExp(item, 'i'))
        };
      }
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
