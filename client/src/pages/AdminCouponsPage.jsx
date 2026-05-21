import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../components/admin/AdminModal.jsx';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import ConfirmDialog from '../components/admin/ConfirmDialog.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import FilterBar from '../components/admin/FilterBar.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { createCoupon, deleteCoupon, getCoupons, toggleCouponActive, updateCoupon } from '../services/api.js';
import { formatCurrency, formatCurrencyInput } from '../utils/format.js';

const initialFormState = {
  code: '',
  type: 'percentage',
  value: '',
  minOrder: '',
  maxDiscount: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
  isActive: true
};

function formatDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
}

function getCouponStatus(coupon) {
  const now = Date.now();
  if (!coupon.isActive) return { label: 'Tạm ẩn', tone: 'neutral' };
  if (new Date(coupon.endDate).getTime() < now) return { label: 'Hết hạn', tone: 'danger' };
  return { label: 'Đang hoạt động', tone: 'success' };
}

function buildFormState(coupon) {
  return {
    code: coupon.code || '',
    type: coupon.discountType || 'percentage',
    value: String(coupon.discountValue ?? ''),
    minOrder: String(coupon.minOrderValue ?? ''),
    maxDiscount: String(coupon.maxDiscountAmount ?? ''),
    usageLimit: String(coupon.usageLimit ?? ''),
    startDate: formatDateInput(coupon.startDate),
    endDate: formatDateInput(coupon.endDate),
    isActive: Boolean(coupon.isActive)
  };
}

function validateForm(formState) {
  const value = Number(formState.value);
  const minOrder = Number(formState.minOrder || 0);
  const maxDiscount = Number(formState.maxDiscount || 0);
  const usageLimit = Number(formState.usageLimit || 0);

  if (!formState.code.trim()) return 'Mã giảm giá không được để trống.';
  if (!Number.isFinite(value) || value <= 0) return 'Giá trị giảm phải lớn hơn 0.';
  if (formState.type === 'percentage' && value > 100) return 'Giảm theo % không được vượt quá 100.';
  if (!Number.isFinite(minOrder) || minOrder < 0) return 'Đơn tối thiểu không hợp lệ.';
  if (!Number.isFinite(maxDiscount) || maxDiscount < 0) return 'Giảm tối đa không hợp lệ.';
  if (!Number.isInteger(usageLimit) || usageLimit < 0) return 'Số lần sử dụng phải lớn hơn hoặc bằng 0.';
  if (!formState.startDate || !formState.endDate) return 'Vui lòng chọn ngày bắt đầu và kết thúc.';
  if (new Date(formState.endDate) <= new Date(formState.startDate)) return 'Ngày kết thúc phải sau ngày bắt đầu.';
  return '';
}

function AdminCouponsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState('');

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword = keyword ? coupon.code.toLowerCase().includes(keyword) : true;
      const currentStatus = getCouponStatus(coupon).label;
      const matchesStatus =
        statusFilter === ''
          ? true
          : statusFilter === 'active'
            ? currentStatus === 'Đang hoạt động'
            : statusFilter === 'expired'
              ? currentStatus === 'Hết hạn'
              : currentStatus === 'Tạm ẩn';
      return matchesKeyword && matchesStatus;
    });
  }, [coupons, searchKeyword, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    async function loadCoupons() {
      try {
        setLoading(true);
        const response = await getCoupons(token);
        if (isMounted) setCoupons(response.coupons || []);
      } catch (error) {
        if (isMounted) setErrorMessage(error.response?.data?.message || 'Không thể tải mã giảm giá.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCoupons();
    return () => {
      isMounted = false;
    };
  }, [token]);

  function openCreateModal() {
    setEditingCoupon(null);
    setFormState(initialFormState);
    setIsFormOpen(true);
  }

  function openEditModal(coupon) {
    setEditingCoupon(coupon);
    setFormState(buildFormState(coupon));
    setIsFormOpen(true);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : name === 'code' ? value.toUpperCase() : value
    }));
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
      const payload = {
        code: formState.code.trim().toUpperCase(),
        name: formState.code.trim().toUpperCase(),
        description: '',
        discountType: formState.type,
        discountValue: Number(formState.value || 0),
        minOrderValue: Number(formState.minOrder || 0),
        maxDiscountAmount: formState.type === 'percentage' ? Number(formState.maxDiscount || 0) : 0,
        usageLimit: Number(formState.usageLimit || 0),
        startDate: formState.startDate,
        endDate: formState.endDate,
        isActive: formState.isActive
      };

      if (editingCoupon) {
        const response = await updateCoupon(editingCoupon._id, payload, token);
        setCoupons((current) => current.map((item) => (item._id === editingCoupon._id ? response.coupon : item)));
        showToast({ title: 'Đã cập nhật mã giảm giá', type: 'success' });
      } else {
        const response = await createCoupon(payload, token);
        setCoupons((current) => [response.coupon, ...current]);
        showToast({ title: 'Đã thêm mã giảm giá', type: 'success' });
      }

      setIsFormOpen(false);
      setEditingCoupon(null);
      setFormState(initialFormState);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể lưu mã giảm giá.');
      showToast({ title: 'Lưu mã giảm giá thất bại', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(coupon) {
    try {
      setTogglingId(coupon._id);
      const response = await toggleCouponActive(coupon._id, token);
      setCoupons((current) => current.map((item) => (item._id === coupon._id ? response.coupon : item)));
      showToast({ title: `Đã ${response.coupon.isActive ? 'bật' : 'tắt'} mã ${response.coupon.code}`, type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể đổi trạng thái mã giảm giá.');
      showToast({ title: 'Cập nhật mã giảm giá thất bại', type: 'error' });
    } finally {
      setTogglingId('');
    }
  }

  async function confirmDeleteCoupon() {
    if (!couponToDelete) return;

    try {
      setDeleting(true);
      await deleteCoupon(couponToDelete._id, token);
      setCoupons((current) => current.filter((item) => item._id !== couponToDelete._id));
      setCouponToDelete(null);
      showToast({ title: 'Đã xóa mã giảm giá', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể xóa mã giảm giá.');
      showToast({ title: 'Xóa mã giảm giá thất bại', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Mã giảm giá"
        title="Quản lý mã giảm giá"
        description="Quản lý mã giảm giá theo % hoặc số tiền cố định, có kiểm tra hạn sử dụng và bật tắt nhanh."
        meta={loading ? 'Đang tải mã giảm giá...' : `${filteredCoupons.length} mã`}
        actions={
          <button type="button" onClick={openCreateModal} className="btn-secondary">
            Thêm mã giảm giá
          </button>
        }
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <FilterBar>
        <input value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="Tìm mã..." className="input-field sm:max-w-xs" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="expired">Hết hạn</option>
          <option value="hidden">Tạm ẩn</option>
        </select>
      </FilterBar>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-block h-20" />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="state-empty">Chưa có mã giảm giá phù hợp.</div>
      ) : (
        <DataTable
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'type', label: 'Loại' },
            { key: 'value', label: 'Giá trị' },
            { key: 'min', label: 'Đơn tối thiểu' },
            { key: 'max', label: 'Giảm tối đa' },
            { key: 'usage', label: 'Sử dụng' },
            { key: 'date', label: 'Thời gian' },
            { key: 'status', label: 'Trạng thái' },
            { key: 'actions', label: 'Hành động', align: 'right' }
          ]}
        >
          {filteredCoupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <tr key={coupon._id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-semibold text-navy">{coupon.code}</td>
                <td className="px-5 py-4 text-slate-600">{coupon.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}</td>
                <td className="px-5 py-4 text-slate-600">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}</td>
                <td className="px-5 py-4 text-slate-600">{formatCurrency(coupon.minOrderValue)}</td>
                <td className="px-5 py-4 text-slate-600">
                  {coupon.discountType === 'percentage' && coupon.maxDiscountAmount > 0 ? formatCurrency(coupon.maxDiscountAmount) : 'Không giới hạn'}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {coupon.usedCount}/{coupon.usageLimit > 0 ? coupon.usageLimit : 'Không giới hạn'}
                </td>
                <td className="px-5 py-4 text-slate-500">
                  <p>{new Date(coupon.startDate).toLocaleDateString('vi-VN')}</p>
                  <p className="mt-1">{new Date(coupon.endDate).toLocaleDateString('vi-VN')}</p>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge label={status.label} tone={status.tone} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEditModal(coupon)} className="btn-outline !px-4 !py-2">
                      Sửa
                    </button>
                    <button type="button" onClick={() => handleToggle(coupon)} disabled={togglingId === coupon._id} className="btn-outline !px-4 !py-2">
                      {togglingId === coupon._id ? 'Đang đổi...' : coupon.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button type="button" onClick={() => setCouponToDelete(coupon)} className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}

      <AdminModal open={isFormOpen} title={editingCoupon ? 'Cập nhật mã giảm giá' : 'Thêm mã giảm giá'} description="Form mã giảm giá được mở trong modal riêng." onClose={() => setIsFormOpen(false)} width="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="field-label">Code *</span>
              <input name="code" value={formState.code} onChange={handleChange} className="input-field uppercase" />
            </label>
            <label>
              <span className="field-label">Loại giảm *</span>
              <select name="type" value={formState.type} onChange={handleChange} className="select-field">
                <option value="percentage">Phần trăm</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </label>
            <label>
              <span className="field-label">Giá trị giảm *</span>
              <input type="number" name="value" value={formState.value} onChange={handleChange} className="input-field" />
              {formState.value ? <span className="mt-2 block text-xs text-slate-500">Hiển thị: {formState.type === 'percentage' ? `${formState.value}%` : `${formatCurrencyInput(formState.value)}₫`}</span> : null}
            </label>
            <label>
              <span className="field-label">Đơn tối thiểu</span>
              <input type="number" name="minOrder" value={formState.minOrder} onChange={handleChange} className="input-field" />
              {formState.minOrder ? <span className="mt-2 block text-xs text-slate-500">Hiển thị: {formatCurrencyInput(formState.minOrder)}₫</span> : null}
            </label>
            <label>
              <span className="field-label">Giảm tối đa</span>
              <input
                type="number"
                name="maxDiscount"
                value={formState.maxDiscount}
                onChange={handleChange}
                className="input-field"
                disabled={formState.type !== 'percentage'}
                placeholder="0 = không giới hạn"
              />
              <span className="mt-2 block text-xs text-slate-500">
                {formState.type === 'percentage'
                  ? formState.maxDiscount && Number(formState.maxDiscount) > 0
                    ? `Hiển thị: ${formatCurrencyInput(formState.maxDiscount)}₫`
                    : 'Để trống hoặc nhập 0 nếu không muốn giới hạn số tiền giảm.'
                  : 'Chỉ áp dụng cho mã giảm theo phần trăm.'}
              </span>
            </label>
            <label>
              <span className="field-label">Số lần sử dụng</span>
              <input type="number" name="usageLimit" value={formState.usageLimit} onChange={handleChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Trạng thái</span>
              <select name="isActive" value={String(formState.isActive)} onChange={(event) => setFormState((current) => ({ ...current, isActive: event.target.value === 'true' }))} className="select-field">
                <option value="true">Đang hiển thị</option>
                <option value="false">Tạm ẩn</option>
              </select>
            </label>
            <label>
              <span className="field-label">Ngày bắt đầu *</span>
              <input type="datetime-local" name="startDate" value={formState.startDate} onChange={handleChange} className="input-field" />
            </label>
            <label>
              <span className="field-label">Ngày kết thúc *</span>
              <input type="datetime-local" name="endDate" value={formState.endDate} onChange={handleChange} className="input-field" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-outline">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-secondary">
              {submitting ? 'Đang lưu...' : 'Lưu mã giảm giá'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        open={Boolean(couponToDelete)}
        title="Xác nhận xóa mã giảm giá"
        description={couponToDelete ? `Bạn đang xóa mã "${couponToDelete.code}". Hành động này không thể hoàn tác.` : ''}
        confirmLabel="Xóa mã"
        onConfirm={confirmDeleteCoupon}
        onClose={() => setCouponToDelete(null)}
        loading={deleting}
      />
    </section>
  );
}

export default AdminCouponsPage;
