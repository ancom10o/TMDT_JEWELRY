import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, authError, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function validateForm() {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Vui lòng nhập họ tên.';
    } else if (formData.fullName.trim().length < 2) {
      nextErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự.';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Email không đúng định dạng.';
    }

    if (!formData.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    clearAuthError();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
    } catch {
      // Error is handled by auth context.
    }
  }

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="surface-card p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-navy">Tạo tài khoản mới</h1>
            <p className="mt-2 text-sm text-slate-500">Đăng ký để lưu đơn hàng và thanh toán nhanh hơn.</p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
              {authError ? <div className="state-error">{authError}</div> : null}

              <label className="block">
                <span className="field-label">Họ tên</span>
                <input
                  className={`input-field ${errors.fullName ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                />
                {errors.fullName ? <span className="helper-error">{errors.fullName}</span> : null}
              </label>

              <label className="block">
                <span className="field-label">Email</span>
                <input
                  className={`input-field ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ban@email.com"
                />
                {errors.email ? <span className="helper-error">{errors.email}</span> : null}
              </label>

              <label className="block">
                <span className="field-label">Mật khẩu</span>
                <input
                  className={`input-field ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ít nhất 6 ký tự"
                />
                {errors.password ? <span className="helper-error">{errors.password}</span> : null}
              </label>

              <label className="block">
                <span className="field-label">Xác nhận mật khẩu</span>
                <input
                  className={`input-field ${errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                />
                {errors.confirmPassword ? <span className="helper-error">{errors.confirmPassword}</span> : null}
              </label>

              <button className="btn-primary w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold text-navy transition hover:text-gold">
                Đăng nhập
              </Link>
            </p>
          </div>

          <div className="surface-soft p-7 sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">Thành viên</p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">Tài khoản giúp trải nghiệm mượt hơn</h2>
            <div className="mt-6 space-y-4">
              {[
                'Lưu lịch sử mua hàng và theo dõi trạng thái đơn.',
                'Đặt hàng nhanh hơn trên mobile, tablet và desktop.',
                'Sẵn sàng cho các tính năng ưu đãi và quản lý tài khoản về sau.'
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/70 bg-white/80 p-5 text-sm leading-6 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;
