import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const initialFormState = {
  fullName: '',
  email: '',
  phone: '',
  address: ''
};

function buildFormState(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  };
}

function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormState(buildFormState(user));
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await updateProfile(formState);
      setMessage('Da cap nhat thong tin ca nhan.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Khong the cap nhat ho so luc nay.');
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
                className="input-field"
                placeholder="Nhập số điện thoại"
              />
            </label>

            <div>
              <p className="field-label">Vai trò</p>
              <div className="input-field bg-slate-50 capitalize text-slate-600">{user?.role || 'user'}</div>
            </div>

            <label className="block sm:col-span-2">
              <span className="field-label">Địa chỉ</span>
              <textarea
                name="address"
                value={formState.address}
                onChange={handleChange}
                className="textarea-field"
                placeholder="Nhập địa chỉ nhận hàng"
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
