import { useCallback, useEffect, useState } from 'react';
import AdminModal from '../components/admin/AdminModal.jsx';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import ConfirmDialog from '../components/admin/ConfirmDialog.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import FilterBar from '../components/admin/FilterBar.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { createProduct, deleteProduct, getCategories, getProducts, getPublicAssetUrl, updateProduct } from '../services/api.js';
import { formatCurrency, formatCurrencyInput } from '../utils/format.js';
import {
  genderOptions,
  getGenderLabel,
  getMaterialGroupLabel,
  getProductMaterialLabel,
  materialDetailOptionsByGroup,
  materialGroupOptions,
  normalizeMaterialDetail
} from '../utils/productFilters.js';

const initialFormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  salePrice: '',
  images: '',
  category: '',
  material: '',
  materialGroup: 'gold',
  materialDetail: 'Vàng 18K',
  gender: 'female',
  stock: '',
  sold: '',
  featured: false,
  isActive: true
};

const adminMaterialDetailOptions = [
  ...Object.values(materialDetailOptionsByGroup).flat().map((material) => ({
    label: material,
    value: material,
    type: 'detail'
  })),
  { label: 'Khác', value: 'other', type: 'group' }
];

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFormState(product) {
  const materialDetail = normalizeMaterialDetail(product.materialDetail || product.material || '');

  return {
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    price: String(product.oldPrice > product.price ? product.oldPrice : product.price || ''),
    salePrice: String(product.price || ''),
    images: Array.isArray(product.images) ? product.images.join('\n') : '',
    category: product.category?._id || '',
    material: product.material || '',
    materialGroup: product.materialGroup || 'gold',
    materialDetail,
    gender: product.gender || 'female',
    stock: String(product.stock ?? ''),
    sold: String(product.sold ?? 0),
    featured: Boolean(product.isFeatured),
    isActive: product.status === 'active'
  };
}

function validateForm(formState) {
  if (!formState.name.trim()) return 'Tên sản phẩm không được để trống.';
  if (!formState.slug.trim()) return 'Slug không được để trống.';
  if (!formState.description.trim()) return 'Mô tả không được để trống.';
  if (!formState.category) return 'Vui lòng chọn danh mục.';

  const price = Number(formState.price);
  const salePrice = Number(formState.salePrice);
  const stock = Number(formState.stock);
  const sold = Number(formState.sold || 0);

  if (!Number.isFinite(price) || price <= 0) return 'Giá gốc phải lớn hơn 0.';
  if (!Number.isFinite(salePrice) || salePrice <= 0) return 'Giá bán phải lớn hơn 0.';
  if (salePrice > price) return 'Giá bán không được lớn hơn giá gốc.';
  if (!Number.isInteger(stock) || stock < 0) return 'Tồn kho phải là số nguyên lớn hơn hoặc bằng 0.';
  if (!Number.isInteger(sold) || sold < 0) return 'Số lượng đã bán phải là số nguyên lớn hơn hoặc bằng 0.';

  const images = formState.images.split('\n').map((item) => item.trim()).filter(Boolean);
  if (!images.length) return 'Cần ít nhất 1 ảnh sản phẩm.';

  return '';
}

function buildPayload(formState) {
  const oldPrice = Number(formState.price || 0);
  const price = Number(formState.salePrice || 0);
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const materialDetail = formState.materialDetail.trim();

  return {
    name: formState.name.trim(),
    slug: normalizeSlug(formState.slug || formState.name),
    description: formState.description.trim(),
    price,
    oldPrice,
    discount,
    images: formState.images.split('\n').map((item) => item.trim()).filter(Boolean),
    category: formState.category,
    material: materialDetail,
    materialGroup: formState.materialGroup,
    materialDetail,
    gender: formState.gender,
    stock: Number(formState.stock || 0),
    sold: Number(formState.sold || 0),
    isFeatured: formState.featured,
    status: formState.isActive ? 'active' : 'inactive'
  };
}

function getStatusTone(product) {
  if (product.status !== 'active') return 'neutral';
  if (product.stock <= 0) return 'danger';
  if (product.stock <= 10) return 'warning';
  return 'success';
}

function getStatusLabel(product) {
  if (product.status !== 'active') return 'Tạm ẩn';
  if (product.stock <= 0) return 'Hết hàng';
  if (product.stock <= 10) return 'Sắp hết';
  return 'Đang bán';
}

function AdminProductsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formState, setFormState] = useState(initialFormState);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(
    async (page = currentPage) => {
      const params = {
        page,
        limit: pagination.limit,
        q: searchKeyword.trim(),
        category: categoryFilter,
        material: adminMaterialDetailOptions.find((option) => option.value === materialFilter)?.type === 'detail' ? materialFilter : '',
        materialGroup: materialFilter === 'other' ? 'other' : '',
        status: statusFilter,
        stockStatus: stockFilter,
        gender: genderFilter
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await getProducts(params);
      setProducts(response.products || []);
      setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 1 });
    },
    [categoryFilter, currentPage, genderFilter, materialFilter, pagination.limit, searchKeyword, statusFilter, stockFilter]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage('');
        const [productsResponse, categoriesResponse] = await Promise.all([
          getProducts({
            page: currentPage,
            limit: pagination.limit,
            q: searchKeyword.trim(),
            category: categoryFilter || undefined,
            material: adminMaterialDetailOptions.find((option) => option.value === materialFilter)?.type === 'detail' ? materialFilter : undefined,
            materialGroup: materialFilter === 'other' ? 'other' : undefined,
            status: statusFilter || undefined,
            stockStatus: stockFilter || undefined,
            gender: genderFilter || undefined
          }),
          getCategories()
        ]);

        if (!isMounted) return;

        setProducts(productsResponse.products || []);
        setPagination(productsResponse.pagination || { page: currentPage, limit: pagination.limit, total: 0, totalPages: 1 });
        setCategories(categoriesResponse.categories || []);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'Không thể tải dữ liệu sản phẩm.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [categoryFilter, currentPage, genderFilter, materialFilter, pagination.limit, searchKeyword, statusFilter, stockFilter]);

  function resetToFirstPage(setter) {
    return (value) => {
      setter(value);
      setCurrentPage(1);
    };
  }

  function openCreateModal() {
    setEditingProduct(null);
    setFormState(initialFormState);
    setIsFormOpen(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setFormState(buildFormState(product));
    setIsFormOpen(true);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormState((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' && !editingProduct) {
        next.slug = normalizeSlug(value);
      }
      if (name === 'materialGroup') {
        next.materialDetail = materialDetailOptionsByGroup[value]?.[0] || '';
      }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateForm(formState);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const payload = buildPayload(formState);

      if (editingProduct) {
        const response = await updateProduct(editingProduct._id, payload, token);
        setProducts((current) => current.map((item) => (item._id === editingProduct._id ? response.product : item)));
        showToast({ title: 'Đã cập nhật sản phẩm', type: 'success' });
      } else {
        const response = await createProduct(payload, token);
        setProducts((current) => [response.product, ...current]);
        setCurrentPage(1);
        showToast({ title: 'Đã thêm sản phẩm mới', type: 'success' });
      }

      setIsFormOpen(false);
      setEditingProduct(null);
      setFormState(initialFormState);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể lưu sản phẩm.');
      showToast({ title: 'Lưu sản phẩm thất bại', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await deleteProduct(productToDelete._id, token);
      await loadProducts(products.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage);
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      }
      setProductToDelete(null);
      showToast({ title: 'Đã xóa sản phẩm', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể xóa sản phẩm.');
      showToast({ title: 'Xóa sản phẩm thất bại', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  const previewImages = formState.images.split('\n').map((item) => item.trim()).filter(Boolean);

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Sản phẩm"
        title="Quản lý sản phẩm"
        description="Danh sách sản phẩm được tổ chức theo bảng, có tìm kiếm, lọc nhanh và form mở trong modal để tránh rời màn hình."
        meta={loading ? 'Đang tải sản phẩm...' : `${pagination.total} sản phẩm`}
        actions={
          <button type="button" onClick={openCreateModal} className="btn-secondary">
            Thêm sản phẩm
          </button>
        }
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <FilterBar>
        <input value={searchKeyword} onChange={(event) => resetToFirstPage(setSearchKeyword)(event.target.value)} placeholder="Tìm theo tên sản phẩm..." className="input-field sm:max-w-xs" />
        <select value={categoryFilter} onChange={(event) => resetToFirstPage(setCategoryFilter)(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        <select value={materialFilter} onChange={(event) => resetToFirstPage(setMaterialFilter)(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả chất liệu chi tiết</option>
          {adminMaterialDetailOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => resetToFirstPage(setStatusFilter)(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Tạm ẩn</option>
          <option value="draft">Bản nháp</option>
        </select>
        <select value={genderFilter} onChange={(event) => resetToFirstPage(setGenderFilter)(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả giới tính</option>
          {genderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={stockFilter} onChange={(event) => resetToFirstPage(setStockFilter)(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tồn kho bất kỳ</option>
          <option value="in_stock">Còn hàng</option>
          <option value="low_stock">Sắp hết hàng</option>
          <option value="out_stock">Hết hàng</option>
        </select>
      </FilterBar>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-block h-20" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="state-empty">Không có sản phẩm phù hợp với bộ lọc hiện tại.</div>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={[
              { key: 'product', label: 'Sản phẩm' },
              { key: 'category', label: 'Danh mục' },
              { key: 'material', label: 'Chất liệu' },
              { key: 'gender', label: 'Giới tính' },
              { key: 'price', label: 'Giá bán' },
              { key: 'stock', label: 'Kho / đã bán' },
              { key: 'status', label: 'Trạng thái' },
              { key: 'actions', label: 'Hành động', align: 'right' }
            ]}
          >
            {products.map((product) => (
              <tr key={product._id} className="border-t border-slate-100 align-top">
                <td className="px-5 py-4">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {product.images?.[0] ? <img src={getPublicAssetUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{product.name}</p>
                      <p className="mt-1 text-slate-500">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600">{product.category?.name || '--'}</td>
                <td className="px-5 py-4 text-slate-600">{getProductMaterialLabel(product) || '--'}</td>
                <td className="px-5 py-4 text-slate-600">{getGenderLabel(product.gender) || '--'}</td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-navy">{formatCurrency(product.price)}</p>
                  {product.oldPrice > product.price ? <p className="mt-1 text-slate-400 line-through">{formatCurrency(product.oldPrice)}</p> : null}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  <p>Tồn: {product.stock}</p>
                  <p className="mt-1 text-slate-500">Bán: {product.sold ?? 0}</p>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge label={getStatusLabel(product)} tone={getStatusTone(product)} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setViewingProduct(product)} className="btn-outline !px-4 !py-2">
                      Xem
                    </button>
                    <button type="button" onClick={() => openEditModal(product)} className="btn-outline !px-4 !py-2">
                      Sửa
                    </button>
                    <button type="button" onClick={() => setProductToDelete(product)} className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>

          {pagination.totalPages > 1 ? (
            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Trang <span className="font-semibold text-navy">{pagination.page}</span> / {pagination.totalPages}
                <span className="ml-2">({pagination.total} sản phẩm)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-outline !px-4 !py-2" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                  Trước
                </button>
                {Array.from({ length: pagination.totalPages }).slice(Math.max(0, currentPage - 3), Math.min(pagination.totalPages, currentPage + 2)).map((_, index) => {
                  const startPage = Math.max(1, currentPage - 2);
                  const pageNumber = startPage + index;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={pageNumber === currentPage ? 'btn-secondary !px-4 !py-2' : 'btn-outline !px-4 !py-2'}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button type="button" className="btn-outline !px-4 !py-2" disabled={currentPage >= pagination.totalPages} onClick={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}>
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <AdminModal
        open={isFormOpen}
        title={editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        description="Nhóm thông tin chính, không hiển thị trực tiếp trên trang danh sách."
        onClose={() => setIsFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="field-label">Tên sản phẩm *</span>
              <input name="name" value={formState.name} onChange={handleChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Slug *</span>
              <input name="slug" value={formState.slug} onChange={handleChange} className="input-field" />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Mô tả *</span>
              <textarea name="description" value={formState.description} onChange={handleChange} rows="4" className="textarea-field" />
            </label>
            <label>
              <span className="field-label">Giá gốc *</span>
              <input type="number" name="price" value={formState.price} onChange={handleChange} className="input-field" />
              {formState.price ? <span className="mt-2 block text-xs text-slate-500">Hiển thị: {formatCurrencyInput(formState.price)}₫</span> : null}
            </label>
            <label>
              <span className="field-label">Giá bán *</span>
              <input type="number" name="salePrice" value={formState.salePrice} onChange={handleChange} className="input-field" />
              {formState.salePrice ? <span className="mt-2 block text-xs text-slate-500">Hiển thị: {formatCurrencyInput(formState.salePrice)}₫</span> : null}
            </label>
            <label>
              <span className="field-label">Danh mục *</span>
              <select name="category" value={formState.category} onChange={handleChange} className="select-field">
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Giới tính</span>
              <select name="gender" value={formState.gender} onChange={handleChange} className="select-field">
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Nhóm chất liệu</span>
              <select name="materialGroup" value={formState.materialGroup} onChange={handleChange} className="select-field">
                {materialGroupOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Chi tiết chất liệu</span>
              {formState.materialGroup === 'other' ? (
                <input name="materialDetail" value={formState.materialDetail} onChange={handleChange} className="input-field" placeholder="Ví dụ: Thép không gỉ" />
              ) : (
                <select name="materialDetail" value={formState.materialDetail} onChange={handleChange} className="select-field">
                  {(materialDetailOptionsByGroup[formState.materialGroup] || []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label>
              <span className="field-label">Tồn kho *</span>
              <input type="number" name="stock" value={formState.stock} onChange={handleChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Số lượng đã bán</span>
              <input type="number" name="sold" value={formState.sold} onChange={handleChange} className="input-field" />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Danh sách ảnh *</span>
              <textarea name="images" value={formState.images} onChange={handleChange} rows="4" className="textarea-field" placeholder="Mỗi dòng là 1 URL ảnh" />
            </label>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="featured" checked={formState.featured} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold" />
              Sản phẩm nổi bật
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="isActive" checked={formState.isActive} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-gold" />
              Đang hiển thị
            </label>
          </div>

          {previewImages.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {previewImages.slice(0, 3).map((image) => (
                <div key={image} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={getPublicAssetUrl(image)} alt="Preview" className="h-32 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-outline">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-secondary">
              {submitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(viewingProduct)}
        title={viewingProduct?.name || 'Chi tiết sản phẩm'}
        description={viewingProduct?.category?.name || ''}
        onClose={() => setViewingProduct(null)}
        width="max-w-3xl"
      >
        {viewingProduct ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                {viewingProduct.images?.[0] ? <img src={getPublicAssetUrl(viewingProduct.images[0])} alt={viewingProduct.name} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <p><span className="font-semibold text-navy">Slug:</span> {viewingProduct.slug}</p>
                <p><span className="font-semibold text-navy">Giá bán:</span> {formatCurrency(viewingProduct.price)}</p>
                <p><span className="font-semibold text-navy">Giá gốc:</span> {formatCurrency(viewingProduct.oldPrice)}</p>
                <p><span className="font-semibold text-navy">Tồn kho:</span> {viewingProduct.stock}</p>
                <p><span className="font-semibold text-navy">Đã bán:</span> {viewingProduct.sold ?? 0}</p>
                <p><span className="font-semibold text-navy">Giới tính:</span> {getGenderLabel(viewingProduct.gender) || '--'}</p>
                <p><span className="font-semibold text-navy">Nhóm chất liệu:</span> {getMaterialGroupLabel(viewingProduct.materialGroup) || '--'}</p>
                <p><span className="font-semibold text-navy">Chi tiết chất liệu:</span> {getProductMaterialLabel(viewingProduct) || '--'}</p>
                <p><span className="font-semibold text-navy">Trạng thái:</span> {getStatusLabel(viewingProduct)}</p>
              </div>
            </div>
            <div>
              <p className="field-label">Mô tả</p>
              <p className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{viewingProduct.description}</p>
            </div>
          </div>
        ) : null}
      </AdminModal>

      <ConfirmDialog
        open={Boolean(productToDelete)}
        title="Xác nhận xóa sản phẩm"
        description={productToDelete ? `Bạn đang xóa "${productToDelete.name}". Hành động này không thể hoàn tác.` : ''}
        confirmLabel="Xóa sản phẩm"
        onConfirm={confirmDeleteProduct}
        onClose={() => setProductToDelete(null)}
        loading={deleting}
      />
    </section>
  );
}

export default AdminProductsPage;
