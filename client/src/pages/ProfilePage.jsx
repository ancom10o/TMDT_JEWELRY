import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AddressAutocompleteField from '../components/AddressAutocompleteField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getDistrictsByProvince, getProvinces, getWardsByDistrict } from '../services/vietnamAddress.js';

const initialFormState = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  district: '',
  ward: '',
  addressLine: ''
};

function normalizeVietnamPhone(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function isValidVietnamPhone(value) {
  const normalized = normalizeVietnamPhone(value);
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(normalized);
}

function stripVietnamese(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function filterOptions(options, keyword) {
  const normalizedKeyword = stripVietnamese(keyword);

  if (!normalizedKeyword) {
    return options;
  }

  return options.filter((option) => stripVietnamese(option.name).includes(normalizedKeyword));
}

function buildFormState(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    district: user?.district || '',
    ward: user?.ward || '',
    addressLine: user?.addressLine || user?.address || ''
  };
}

function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [, setSelectedWardCode] = useState('');
  const [isProvinceLoading, setIsProvinceLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProvinces() {
      setIsProvinceLoading(true);

      try {
        const items = await getProvinces();
        if (isMounted) {
          setProvinces(items);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Không thể tải danh sách tỉnh / thành phố.');
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
    let isMounted = true;

    async function hydrateProfileAddress() {
      const nextState = buildFormState(user);
      setFormState(nextState);
      setSelectedProvinceCode('');
      setSelectedDistrictCode('');
      setSelectedWardCode('');
      setDistricts([]);
      setWards([]);

      if (!nextState.city || provinces.length === 0) {
        return;
      }

      const province = provinces.find((item) => stripVietnamese(item.name) === stripVietnamese(nextState.city));

      if (!province) {
        return;
      }

      setSelectedProvinceCode(String(province.code));

      try {
        const nextDistricts = await getDistrictsByProvince(province.code);

        if (!isMounted) {
          return;
        }

        setDistricts(nextDistricts);
        const district = nextDistricts.find((item) => stripVietnamese(item.name) === stripVietnamese(nextState.district));

        if (!district) {
          return;
        }

        setSelectedDistrictCode(String(district.code));
        const nextWards = await getWardsByDistrict(district.code);

        if (!isMounted) {
          return;
        }

        setWards(nextWards);
        const ward = nextWards.find((item) => stripVietnamese(item.name) === stripVietnamese(nextState.ward));

        if (ward) {
          setSelectedWardCode(String(ward.code));
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Không thể tải dữ liệu địa chỉ đã lưu.');
        }
      }
    }

    hydrateProfileAddress();

    return () => {
      isMounted = false;
    };
  }, [provinces, user]);

  const provinceOptions = useMemo(
    () => filterOptions(provinces, formState.city),
    [formState.city, provinces]
  );

  const districtOptions = useMemo(
    () => filterOptions(districts, formState.district),
    [districts, formState.district]
  );

  const wardOptions = useMemo(
    () => filterOptions(wards, formState.ward),
    [formState.ward, wards]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleProvinceSelect(option) {
    setSelectedProvinceCode(String(option.code));
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);
    setFormState((current) => ({
      ...current,
      city: option.name,
      district: '',
      ward: ''
    }));
    setErrorMessage('');
    setIsDistrictLoading(true);

    try {
      setDistricts(await getDistrictsByProvince(option.code));
    } catch {
      setErrorMessage('Không thể tải danh sách quận / huyện.');
    } finally {
      setIsDistrictLoading(false);
    }
  }

  async function handleDistrictSelect(option) {
    setSelectedDistrictCode(String(option.code));
    setSelectedWardCode('');
    setWards([]);
    setFormState((current) => ({
      ...current,
      district: option.name,
      ward: ''
    }));
    setErrorMessage('');
    setIsWardLoading(true);

    try {
      setWards(await getWardsByDistrict(option.code));
    } catch {
      setErrorMessage('Không thể tải danh sách phường / xã.');
    } finally {
      setIsWardLoading(false);
    }
  }

  function handleWardSelect(option) {
    setSelectedWardCode(String(option.code));
    setFormState((current) => ({
      ...current,
      ward: option.name
    }));
    setErrorMessage('');
  }

  function handleProvinceInputChange(value) {
    setSelectedProvinceCode('');
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);
    setFormState((current) => ({
      ...current,
      city: value,
      district: '',
      ward: ''
    }));
  }

  function handleDistrictInputChange(value) {
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setWards([]);
    setFormState((current) => ({
      ...current,
      district: value,
      ward: ''
    }));
  }

  function handleWardInputChange(value) {
    setSelectedWardCode('');
    setFormState((current) => ({
      ...current,
      ward: value
    }));
  }

  function handlePhoneBlur() {
    if (formState.phone && !isValidVietnamPhone(formState.phone)) {
      setErrorMessage('Số điện thoại Việt Nam không hợp lệ.');
      return;
    }

    if (errorMessage === 'Số điện thoại Việt Nam không hợp lệ.') {
      setErrorMessage('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (formState.phone && !isValidVietnamPhone(formState.phone)) {
        setErrorMessage('Số điện thoại Việt Nam không hợp lệ.');
        setIsSubmitting(false);
        return;
      }

      await updateProfile({
        ...formState,
        phone: normalizeVietnamPhone(formState.phone),
        address: [formState.addressLine, formState.ward, formState.district, formState.city].filter(Boolean).join(', ')
      });
      setMessage('Đã cập nhật thông tin cá nhân.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Không thể cập nhật hồ sơ lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Tài khoản</p>
          <h1 className="mt-3 text-3xl font-bold text-navy">Thông tin cá nhân</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Cập nhật thông tin liên hệ để đặt hàng và nhận hỗ trợ chính xác hơn.
          </p>
        </div>

        <form className="surface-card p-6 sm:p-8" onSubmit={handleSubmit}>
          {message ? <div className="state-success mb-6">{message}</div> : null}
          {errorMessage ? <div className="state-error mb-6">{errorMessage}</div> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Họ tên</span>
              <input
                name="fullName"
                value={formState.fullName}
                onChange={handleChange}
                className="input-field"
                placeholder="Nhập họ tên"
                required
                minLength={2}
              />
            </label>

            <label className="block">
              <span className="field-label">Email</span>
              <input
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
                className="input-field"
                placeholder="email@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="field-label">Số điện thoại</span>
              <input
                name="phone"
                value={formState.phone}
                onChange={handleChange}
                onBlur={handlePhoneBlur}
                className="input-field"
                placeholder="Nhập số điện thoại"
              />
            </label>

            <div>
              <p className="field-label">Vai trò</p>
              <div className="input-field bg-slate-50 capitalize text-slate-600">{user?.role || 'user'}</div>
            </div>

            <AddressAutocompleteField
              label="Tỉnh / Thành phố"
              name="city"
              value={formState.city}
              onInputChange={handleProvinceInputChange}
              onSelect={handleProvinceSelect}
              options={provinceOptions}
              placeholder="Gõ để tìm tỉnh / thành phố"
              loadingText={isProvinceLoading ? 'Đang tải tỉnh / thành phố...' : ''}
              emptyText="Không tìm thấy tỉnh / thành phố phù hợp."
            />

            <AddressAutocompleteField
              label="Quận / Huyện"
              name="district"
              value={formState.district}
              onInputChange={handleDistrictInputChange}
              onSelect={handleDistrictSelect}
              options={districtOptions}
              placeholder={selectedProvinceCode ? 'Gõ để tìm quận / huyện' : 'Chọn tỉnh / thành phố trước'}
              disabled={!selectedProvinceCode}
              loadingText={isDistrictLoading ? 'Đang tải quận / huyện...' : ''}
              helperText={selectedProvinceCode ? 'Chọn quận / huyện để mở tiếp phường / xã.' : 'Hãy chọn tỉnh / thành phố trước.'}
              emptyText="Không tìm thấy quận / huyện phù hợp."
            />

            <AddressAutocompleteField
              label="Phường / Xã"
              name="ward"
              value={formState.ward}
              onInputChange={handleWardInputChange}
              onSelect={handleWardSelect}
              options={wardOptions}
              placeholder={selectedDistrictCode ? 'Gõ để tìm phường / xã' : 'Chọn quận / huyện trước'}
              disabled={!selectedDistrictCode}
              loadingText={isWardLoading ? 'Đang tải phường / xã...' : ''}
              helperText={selectedDistrictCode ? 'Chọn phường / xã gần đúng với địa chỉ nhận hàng.' : 'Hãy chọn quận / huyện trước.'}
              emptyText="Không tìm thấy phường / xã phù hợp."
            />

            <label className="block">
              <span className="field-label">Địa chỉ chi tiết</span>
              <input
                name="addressLine"
                value={formState.addressLine}
                onChange={handleChange}
                className="input-field"
                placeholder="Số nhà, tên đường, tòa nhà..."
              />
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={isSubmitting} className="btn-secondary">
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <Link to="/my-orders" className="btn-outline">
              Xem đơn hàng của tôi
            </Link>
            {user?.role === 'admin' ? (
              <Link to="/admin" className="btn-outline">
                Mở khu vực admin
              </Link>
            ) : null}
            <button type="button" onClick={logout} className="btn-outline">
              Đăng xuất
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default ProfilePage;
