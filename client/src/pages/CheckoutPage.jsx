/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AddressAutocompleteField from '../components/AddressAutocompleteField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { createOrder, getPublicAssetUrl } from '../services/api.js';
import { getDistrictsByProvince, getProvinces, getWardsByDistrict } from '../services/vietnamAddress.js';
import { formatCurrency } from '../utils/format.js';

const PAYMENT_OPTIONS = [
  {
    value: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán tiền mặt khi đơn hàng được giao.'
  },
  {
    value: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng',
    description: 'Đặt hàng trước, nhận thông tin chuyển khoản sau khi tạo đơn.'
  }
];

function stripVietnamese(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function normalizeVietnamPhone(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function isValidVietnamPhone(value) {
  const normalized = normalizeVietnamPhone(value);
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(normalized);
}

function filterOptions(options, keyword) {
  const normalizedKeyword = stripVietnamese(keyword);

  if (!normalizedKeyword) {
    return options;
  }

  return options.filter((option) => stripVietnamese(option.name).includes(normalizedKeyword));
}

function createInitialForm() {
  return {
    fullName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    streetAddress: '',
    note: '',
    paymentMethod: 'cod'
  };
}

function validateCheckoutForm(values) {
  const nextErrors = {};

  if (!values.fullName.trim()) {
    nextErrors.fullName = 'Vui lòng nhập họ tên người nhận.';
  } else if (values.fullName.trim().length < 2) {
    nextErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự.';
  }

  if (!values.phone.trim()) {
    nextErrors.phone = 'Vui lòng nhập số điện thoại.';
  } else if (!isValidVietnamPhone(values.phone)) {
    nextErrors.phone = 'Số điện thoại Việt Nam không hợp lệ.';
  }

  if (!values.province.trim()) {
    nextErrors.province = 'Vui lòng chọn tỉnh / thành phố.';
  }

  if (!values.district.trim()) {
    nextErrors.district = 'Vui lòng chọn quận / huyện.';
  }

  if (!values.ward.trim()) {
    nextErrors.ward = 'Vui lòng chọn phường / xã.';
  }

  if (!values.streetAddress.trim()) {
    nextErrors.streetAddress = 'Vui lòng nhập địa chỉ cụ thể.';
  }

  if (!PAYMENT_OPTIONS.some((option) => option.value === values.paymentMethod)) {
    nextErrors.paymentMethod = 'Phương thức thanh toán không hợp lệ.';
  }

  return nextErrors;
}

function CheckoutItem({ item }) {
  const imageUrl = getPublicAssetUrl(item.image);

  return (
    <article className="rounded-[22px] border border-slate-200 bg-[#fffdfa] p-3">
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
        <div className="overflow-hidden rounded-[16px] bg-white">
          {imageUrl ? (
            <img src={imageUrl} alt={item.name} className="h-[72px] w-[72px] object-cover" />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center text-[10px] font-semibold uppercase tracking-[0.18em] text-navy">
              JewelAura
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-navy">{item.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span>SL: {item.quantity}</span>
            {item.selectedSize ? <span>Size: {item.selectedSize}</span> : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-navy">{formatCurrency(item.price * item.quantity)}</p>
        </div>
      </div>
    </article>
  );
}

function CheckoutPage() {
  const { token, isAuthenticated } = useAuth();
  const {
    cartItems,
    totalQuantity,
    totalPrice,
    discountAmount,
    finalTotal,
    appliedCoupon,
    couponStatus,
    isCouponLoading,
    applyCouponCode,
    removeCoupon,
    clearCouponStatus,
    isInitialized,
    clearCart
  } = useCart();

  const [formValues, setFormValues] = useState(createInitialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  const [isProvinceLoading, setIsProvinceLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [addressLoadError, setAddressLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProvinces() {
      setIsProvinceLoading(true);
      setAddressLoadError('');

      try {
        const items = await getProvinces();
        if (isMounted) {
          setProvinces(items);
        }
      } catch {
        if (isMounted) {
          setAddressLoadError('Không thể tải danh sách tỉnh / thành phố.');
        }
      } finally {
        if (isMounted) {
          setIsProvinceLoading(false);
        }
      }
    }

    loadProvinces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (appliedCoupon?.code) {
      setCouponCode(appliedCoupon.code);
      return;
    }

    setCouponCode('');
  }, [appliedCoupon]);

  useEffect(() => {
    return () => {
      clearCouponStatus();
    };
  }, [clearCouponStatus]);

  const provinceOptions = useMemo(
    () => filterOptions(provinces, formValues.province),
    [provinces, formValues.province]
  );

  const districtOptions = useMemo(
    () => filterOptions(districts, formValues.district),
    [districts, formValues.district]
  );

  const wardOptions = useMemo(
    () => filterOptions(wards, formValues.ward),
    [wards, formValues.ward]
  );

  function updateField(name, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [name]: ''
    }));
    setSubmitError('');
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    updateField(name, value);
  }

  async function handleProvinceSelect(option) {
    setSelectedProvinceCode(String(option.code));
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);
    setFormValues((currentValues) => ({
      ...currentValues,
      province: option.name,
      district: '',
      ward: ''
    }));
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      province: '',
      district: '',
      ward: ''
    }));
    setSubmitError('');
    setIsDistrictLoading(true);
    setAddressLoadError('');

    try {
      const nextDistricts = await getDistrictsByProvince(option.code);
      setDistricts(nextDistricts);
    } catch {
      setAddressLoadError('Không thể tải danh sách quận / huyện.');
    } finally {
      setIsDistrictLoading(false);
    }
  }

  async function handleDistrictSelect(option) {
    setSelectedDistrictCode(String(option.code));
    setSelectedWardCode('');
    setWards([]);
    setFormValues((currentValues) => ({
      ...currentValues,
      district: option.name,
      ward: ''
    }));
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      district: '',
      ward: ''
    }));
    setSubmitError('');
    setIsWardLoading(true);
    setAddressLoadError('');

    try {
      const nextWards = await getWardsByDistrict(option.code);
      setWards(nextWards);
    } catch {
      setAddressLoadError('Không thể tải danh sách phường / xã.');
    } finally {
      setIsWardLoading(false);
    }
  }

  function handleWardSelect(option) {
    setSelectedWardCode(String(option.code));
    updateField('ward', option.name);
  }

  function handleProvinceInputChange(value) {
    setSelectedProvinceCode('');
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);
    setFormValues((currentValues) => ({
      ...currentValues,
      province: value,
      district: '',
      ward: ''
    }));
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      province: '',
      district: '',
      ward: ''
    }));
    setSubmitError('');
  }

  function handleDistrictInputChange(value) {
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setWards([]);
    setFormValues((currentValues) => ({
      ...currentValues,
      district: value,
      ward: ''
    }));
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      district: '',
      ward: ''
    }));
    setSubmitError('');
  }

  function handleWardInputChange(value) {
    setSelectedWardCode('');
    updateField('ward', value);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateCheckoutForm(formValues);
    if (!selectedProvinceCode) {
      nextErrors.province = 'Vui lòng chọn tỉnh / thành phố từ danh sách.';
    }
    if (!selectedDistrictCode) {
      nextErrors.district = 'Vui lòng chọn quận / huyện từ danh sách.';
    }
    if (!selectedWardCode) {
      nextErrors.ward = 'Vui lòng chọn phường / xã từ danh sách.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    if (cartItems.length === 0) {
      setSubmitError('Giỏ hàng đang trống, không thể tạo đơn hàng.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await createOrder(
        {
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize || ''
          })),
          shippingAddress: {
            fullName: formValues.fullName,
            phone: normalizeVietnamPhone(formValues.phone),
            city: formValues.province,
            district: formValues.district,
            ward: formValues.ward,
            addressLine: formValues.streetAddress,
            note: formValues.note
          },
          paymentMethod: formValues.paymentMethod,
          couponCode: appliedCoupon?.code || ''
        },
        token
      );

      setCreatedOrder(response.order);
      await clearCart();
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Không thể tạo đơn hàng lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isInitialized) {
    return (
      <section className="container-page py-10 sm:py-12">
        <div className="state-loading">Đang tải thông tin thanh toán...</div>
      </section>
    );
  }

  if (createdOrder) {
    return (
      <section className="container-page py-10 sm:py-12">
        <div className="surface-card mx-auto max-w-3xl p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Đặt Hàng Thành Công</p>
          <h1 className="mt-3 text-3xl font-bold text-navy">Đơn hàng đã được tạo</h1>
          {!isAuthenticated ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bạn vừa đặt hàng với tư cách khách vãng lai. Hãy lưu lại mã đơn để tiện theo dõi khi cần hỗ trợ.
            </p>
          ) : null}
          <p className="mt-4 text-slate-600">
            Mã đơn hàng: <span className="font-semibold text-navy">{createdOrder._id}</span>
          </p>
          <p className="mt-2 text-slate-600">
            Tạm tính: <span className="font-semibold text-navy">{formatCurrency(createdOrder.totalBeforeDiscount)}</span>
          </p>
          <p className="mt-2 text-slate-600">
            Giảm giá: <span className="font-semibold text-emerald-700">-{formatCurrency(createdOrder.discountAmount)}</span>
          </p>
          <p className="mt-2 text-slate-600">
            Mã giảm giá: <span className="font-semibold text-navy">{createdOrder.couponCode || 'Không có'}</span>
          </p>
          <p className="mt-2 text-slate-600">
            Tổng thanh toán: <span className="font-semibold text-navy">{formatCurrency(createdOrder.totalPrice)}</span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/products" className="btn-secondary">
              Tiếp tục mua sắm
            </Link>
            <Link to="/cart" className="btn-outline">
              Quay lại giỏ hàng
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (cartItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Thanh Toán</p>
        <h1 className="mt-3 text-3xl font-bold text-navy">Thông tin thanh toán</h1>
      </div>

      {!isAuthenticated ? (
        <div className="mb-6 rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
          Đăng nhập để quản lý đơn hàng dễ dàng hơn, theo dõi lịch sử mua sắm và nhận ưu đãi độc quyền từ JewelAura.
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
        <form onSubmit={handleSubmit} className="surface-card p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Họ tên người nhận *</span>
              <input name="fullName" value={formValues.fullName} onChange={handleFieldChange} className="input-field" placeholder="Nguyễn Văn A" />
              {formErrors.fullName ? <span className="helper-error">{formErrors.fullName}</span> : null}
            </label>

            <label className="block">
              <span className="field-label">Số điện thoại *</span>
              <input name="phone" value={formValues.phone} onChange={handleFieldChange} className="input-field" placeholder="09xxxxxxxx" />
              {formErrors.phone ? <span className="helper-error">{formErrors.phone}</span> : null}
            </label>

            <div className="sm:col-span-2">
              <AddressAutocompleteField
                label="Tỉnh / Thành phố *"
                name="province"
                value={formValues.province}
                placeholder="Gõ để tìm tỉnh / thành phố"
                error={formErrors.province}
                options={provinceOptions}
                onInputChange={handleProvinceInputChange}
                onSelect={handleProvinceSelect}
                loadingText={isProvinceLoading ? 'Đang tải danh sách tỉnh / thành phố...' : ''}
                helperText={addressLoadError || 'Chọn tỉnh / thành phố để mở tiếp quận / huyện.'}
                emptyText="Không tìm thấy tỉnh / thành phố phù hợp."
              />
            </div>

            <AddressAutocompleteField
              label="Quận / Huyện *"
              name="district"
              value={formValues.district}
              placeholder={selectedProvinceCode ? 'Gõ để tìm quận / huyện' : 'Chọn tỉnh / thành phố trước'}
              error={formErrors.district}
              options={districtOptions}
              onInputChange={handleDistrictInputChange}
              onSelect={handleDistrictSelect}
              disabled={!selectedProvinceCode}
              loadingText={isDistrictLoading ? 'Đang tải danh sách quận / huyện...' : ''}
              helperText={selectedProvinceCode ? 'Chọn quận / huyện để mở tiếp phường / xã.' : 'Hãy chọn tỉnh / thành phố trước.'}
              emptyText="Không tìm thấy quận / huyện phù hợp."
            />

            <AddressAutocompleteField
              label="Phường / Xã *"
              name="ward"
              value={formValues.ward}
              placeholder={selectedDistrictCode ? 'Gõ để tìm phường / xã' : 'Chọn quận / huyện trước'}
              error={formErrors.ward}
              options={wardOptions}
              onInputChange={handleWardInputChange}
              onSelect={handleWardSelect}
              disabled={!selectedDistrictCode}
              loadingText={isWardLoading ? 'Đang tải danh sách phường / xã...' : ''}
              helperText={selectedDistrictCode ? 'Chọn phường / xã đúng để hoàn thiện địa chỉ.' : 'Hãy chọn quận / huyện trước.'}
              emptyText="Không tìm thấy phường / xã phù hợp."
            />

            <label className="block sm:col-span-2">
              <span className="field-label">Địa chỉ cụ thể *</span>
              <input
                name="streetAddress"
                value={formValues.streetAddress}
                onChange={handleFieldChange}
                className="input-field"
                placeholder="Số nhà, tên đường, tòa nhà..."
              />
              {formErrors.streetAddress ? <span className="helper-error">{formErrors.streetAddress}</span> : null}
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Ghi chú</span>
              <textarea name="note" value={formValues.note} onChange={handleFieldChange} rows="4" className="textarea-field" placeholder="Yêu cầu giao hàng, giờ nhận hàng..." />
            </label>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-navy">Phương thức thanh toán</h2>
            <div className="mt-4 space-y-3">
              {PAYMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-[24px] border p-4 transition ${
                    formValues.paymentMethod === option.value
                      ? 'border-gold bg-[#fff9ec]'
                      : 'border-slate-200 bg-white hover:border-gold/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={formValues.paymentMethod === option.value}
                    onChange={handleFieldChange}
                    className="mt-1 h-4 w-4 accent-[#d4af37]"
                  />
                  <span>
                    <span className="block font-semibold text-navy">{option.label}</span>
                    <span className="mt-1 block text-sm text-slate-500">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
            {formErrors.paymentMethod ? <span className="helper-error">{formErrors.paymentMethod}</span> : null}
          </div>

          {submitError ? <div className="state-error mt-6">{submitError}</div> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/cart" className="btn-outline">
              Quay lại giỏ hàng
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn-secondary">
              {isSubmitting ? 'Đang tạo đơn hàng...' : 'Đặt hàng ngay'}
            </button>
          </div>
        </form>

        <aside className="surface-card h-fit p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Đơn Hàng</p>
              <h2 className="mt-2 text-2xl font-bold text-navy">Sản phẩm trong giỏ</h2>
            </div>
            <span className="rounded-full bg-[#fff4d6] px-3 py-1 text-sm font-semibold text-navy">{totalQuantity} sp</span>
          </div>

          <div className="mt-6 space-y-3">
            {cartItems.map((item) => (
              <CheckoutItem key={item.serverItemId || item.id || item.productId} item={item} />
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-[#e8dcc0] bg-[linear-gradient(135deg,_rgba(255,249,236,0.96),_rgba(255,255,255,0.98))] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Mã Giảm Giá</p>
              {appliedCoupon?.code ? <span className="text-xs font-semibold text-emerald-700">{appliedCoupon.code}</span> : null}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                placeholder="Nhập mã giảm giá"
                className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-[0.08em] text-navy outline-none transition focus:border-gold"
              />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <button
                  type="button"
                  onClick={() => applyCouponCode(couponCode)}
                  disabled={isCouponLoading}
                  className="rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCouponLoading ? 'Đang kiểm tra...' : 'Áp dụng mã'}
                </button>
                {appliedCoupon ? (
                  <button type="button" onClick={() => removeCoupon()} className="rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-navy transition hover:bg-white">
                    Hủy mã
                  </button>
                ) : null}
              </div>
            </div>

            {couponStatus.message ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  couponStatus.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : couponStatus.type === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : couponStatus.type === 'info'
                        ? 'border-slate-200 bg-slate-50 text-slate-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {couponStatus.message}
              </div>
            ) : null}
          </div>


          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Tạm tính</span>
              <span className="font-semibold text-navy">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Mã giảm giá</span>
              <span className="font-semibold text-navy">{appliedCoupon?.code || 'Chưa áp dụng'}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Giảm giá</span>
              <span className="font-semibold text-emerald-700">-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Phí vận chuyển</span>
              <span className="font-semibold text-slate-500">Tính ở bước GHN sau</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-base font-semibold text-navy">Tổng thanh toán</span>
              <span className="text-2xl font-bold text-navy">{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CheckoutPage;
