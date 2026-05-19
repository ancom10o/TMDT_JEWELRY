import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicImagesDirectory = path.resolve(__dirname, '../../public/images');
const defaultCategoryImage = '/images/category_default_.png';

function isLocalImageAvailable(imagePath) {
  if (!imagePath || /^https?:\/\//i.test(imagePath)) {
    return Boolean(imagePath);
  }

  if (!imagePath.startsWith('/images/')) {
    return true;
  }

  const relativeImagePath = imagePath.replace(/^\/images\/?/, '');
  return fs.existsSync(path.join(publicImagesDirectory, relativeImagePath));
}

function resolveCategoryImage(categoryObject) {
  const configuredImage = categoryObject.image?.trim();

  if (isLocalImageAvailable(configuredImage)) {
    return configuredImage;
  }

  return defaultCategoryImage;
}

async function decorateCategory(category) {
  const productCount = await Product.countDocuments({ category: category._id });
  const categoryObject = category.toObject();

  return {
    ...categoryObject,
    image: resolveCategoryImage(categoryObject),
    productCount
  };
}

export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find().populate('parent', 'name slug').sort({ createdAt: -1 });
    const decoratedCategories = await Promise.all(categories.map((category) => decorateCategory(category)));
    res.json({ categories: decoratedCategories });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryById(req, res, next) {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({ message: 'Khong tim thay danh muc.' });
    }

    res.json({ category: await decorateCategory(category) });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);

      if (!parentCategory) {
        return res.status(400).json({ message: 'Danh muc cha khong ton tai.' });
      }
    }

    const category = await Category.create(req.body);
    const populatedCategory = await category.populate('parent', 'name slug');

    res.status(201).json({ category: await decorateCategory(populatedCategory) });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    if (req.body.parent) {
      if (req.body.parent === req.params.id) {
        return res.status(400).json({ message: 'Danh muc khong the tu chon chinh no lam danh muc cha.' });
      }

      const parentCategory = await Category.findById(req.body.parent);

      if (!parentCategory) {
        return res.status(400).json({ message: 'Danh muc cha khong ton tai.' });
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({ message: 'Khong tim thay danh muc.' });
    }

    res.json({ category: await decorateCategory(category) });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const linkedProducts = await Product.countDocuments({ category: req.params.id });

    if (linkedProducts > 0) {
      return res.status(400).json({
        message: `Khong the xoa danh muc nay vi dang co ${linkedProducts} san pham lien quan.`
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Khong tim thay danh muc.' });
    }

    res.json({ message: 'Da xoa danh muc.' });
  } catch (error) {
    next(error);
  }
}
