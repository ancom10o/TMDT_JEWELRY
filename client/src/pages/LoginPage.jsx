import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, authError, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  function validateForm() {
    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Email không đúng định dạng.';
    }

    if (!formData.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.';
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
      await login({
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
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-soft p-7 sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">Tài Khoản</p>
            <h1 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">Đăng nhập</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Đăng nhập để theo dõi đơn hàng, quản lý giỏ hàng và thanh toán nhanh hơn.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5">
                <p className="text-lg font-semibold text-navy">Theo dõi đơn hàng</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Xem tiến độ xử lý và chi tiết thanh toán.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 p-5">
                <p className="text-lg font-semibold text-navy">Mua sắm nhanh</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Lưu thông tin để thanh toán gọn hơn trên mobile.</p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-navy">Đăng nhập</h2>
            <p className="mt-2 text-sm text-slate-500">Nhập email và mật khẩu để tiếp tục.</p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
              {authError ? <div className="state-error">{authError}</div> : null}

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
                  placeholder="Nhập mật khẩu"
                />
                {errors.password ? <span className="helper-error">{errors.password}</span> : null}
              </label>

              <button className="btn-primary w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-navy transition hover:text-gold">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
