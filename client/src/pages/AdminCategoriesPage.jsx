import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../components/admin/AdminModal.jsx';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import ConfirmDialog from '../components/admin/ConfirmDialog.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import FilterBar from '../components/admin/FilterBar.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../services/api.js';

const initialFormState = {
  name: '',
  slug: '',
  description: '',
  parent: '',
  status: 'active'
};

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFormState(category) {
  return {
    name: category.name || '',
    slug: category.slug || '',
    description: category.description || '',
    parent: category.parent?._id || '',
    status: category.status || 'active'
  };
}

function AdminCategoriesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword = keyword ? [category.name, category.slug].filter(Boolean).some((value) => value.toLowerCase().includes(keyword)) : true;
      const matchesStatus = statusFilter ? category.status === statusFilter : true;
      return matchesKeyword && matchesStatus;
    });
  }, [categories, searchKeyword, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        setLoading(true);
        const response = await getCategories();
        if (isMounted) setCategories(response.categories || []);
      } catch (error) {
        if (isMounted) setErrorMessage(error.response?.data?.message || 'Không thể tải danh mục.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  function openCreateModal() {
    setEditingCategory(null);
    setFormState(initialFormState);
    setIsFormOpen(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);
    setFormState(buildFormState(category));
    setIsFormOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((current) => {
      const next = { ...current, [name]: value };
      if (name === 'name' && !editingCategory) next.slug = normalizeSlug(value);
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!formState.name.trim() || !formState.slug.trim()) {
      setErrorMessage('Tên danh mục và slug là bắt buộc.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const payload = {
        name: formState.name.trim(),
        slug: normalizeSlug(formState.slug || formState.name),
        description: formState.description.trim(),
        parent: formState.parent || null,
        status: formState.status
      };

      if (editingCategory) {
        const response = await updateCategory(editingCategory._id, payload, token);
        setCategories((current) => current.map((item) => (item._id === editingCategory._id ? response.category : item)));
        showToast({ title: 'Đã cập nhật danh mục', type: 'success' });
      } else {
        const response = await createCategory(payload, token);
        setCategories((current) => [response.category, ...current]);
        showToast({ title: 'Đã thêm danh mục', type: 'success' });
      }

      setIsFormOpen(false);
      setFormState(initialFormState);
      setEditingCategory(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể lưu danh mục.');
      showToast({ title: 'Lưu danh mục thất bại', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);
      await deleteCategory(categoryToDelete._id, token);
      setCategories((current) => current.filter((item) => item._id !== categoryToDelete._id));
      setCategoryToDelete(null);
      showToast({ title: 'Đã xóa danh mục', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể xóa danh mục.');
      showToast({ title: 'Xóa danh mục thất bại', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Danh mục"
        title="Quản lý danh mục"
        description="Quản lý cấu trúc danh mục để bộ lọc sản phẩm và điều hướng frontend hoạt động rõ ràng."
        meta={loading ? 'Đang tải danh mục...' : `${filteredCategories.length} danh mục`}
        actions={
          <button type="button" onClick={openCreateModal} className="btn-secondary">
            Thêm danh mục
          </button>
        }
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <FilterBar>
        <input value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="Tìm tên danh mục..." className="input-field sm:max-w-xs" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm ẩn</option>
        </select>
      </FilterBar>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-block h-20" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="state-empty">Chưa có danh mục phù hợp để hiển thị.</div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Danh mục' },
            { key: 'parent', label: 'Danh mục cha' },
            { key: 'products', label: 'Số sản phẩm' },
            { key: 'status', label: 'Trạng thái' },
            { key: 'actions', label: 'Hành động', align: 'right' }
          ]}
        >
          {filteredCategories.map((category) => (
            <tr key={category._id} className="border-t border-slate-100">
              <td className="px-5 py-4">
                <p className="font-semibold text-navy">{category.name}</p>
                <p className="mt-1 text-slate-500">{category.slug}</p>
              </td>
              <td className="px-5 py-4 text-slate-600">{category.parent?.name || '--'}</td>
              <td className="px-5 py-4 text-slate-600">{category.productCount ?? 0}</td>
              <td className="px-5 py-4">
                <StatusBadge label={category.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'} tone={category.status === 'active' ? 'success' : 'neutral'} />
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => openEditModal(category)} className="btn-outline !px-4 !py-2">
                    Sửa
                  </button>
                  <button type="button" onClick={() => setCategoryToDelete(category)} className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <AdminModal
        open={isFormOpen}
        title={editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        description="Form được mở riêng để giữ khu vực bảng danh sách gọn gàng."
        onClose={() => setIsFormOpen(false)}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="field-label">Tên danh mục *</span>
              <input name="name" value={formState.name} onChange={handleChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Slug *</span>
              <input name="slug" value={formState.slug} onChange={handleChange} className="input-field" />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Mô tả</span>
              <textarea name="description" value={formState.description} onChange={handleChange} rows="4" className="textarea-field" />
            </label>
            <label>
              <span className="field-label">Danh mục cha</span>
              <select name="parent" value={formState.parent} onChange={handleChange} className="select-field">
                <option value="">Không có</option>
                {categories
                  .filter((item) => item._id !== editingCategory?._id)
                  .map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span className="field-label">Trạng thái</span>
              <select name="status" value={formState.status} onChange={handleChange} className="select-field">
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm ẩn</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-outline">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-secondary">
              {submitting ? 'Đang lưu...' : 'Lưu danh mục'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Xác nhận xóa danh mục"
        description={
          categoryToDelete
            ? `Danh mục "${categoryToDelete.name}" sẽ bị xóa. Nếu danh mục đang có sản phẩm, hệ thống sẽ chặn và hiển thị cảnh báo rõ ràng.`
            : ''
        }
        confirmLabel="Xóa danh mục"
        onConfirm={confirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
        loading={deleting}
      />
    </section>
  );
}

export default AdminCategoriesPage;
