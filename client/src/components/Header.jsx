/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';

const categoryItems = [
  { label: 'Nhẫn', path: '/products?category=nhan' },
  { label: 'Bông tai', path: '/products?category=bong-tai' },
  { label: 'Dây chuyền', path: '/products?category=day-chuyen' },
  { label: 'Lắc tay', path: '/products?category=lac-tay' },
  { label: 'Vòng cổ', path: '/products?category=vong-co' },
  { label: 'Trang sức cưới', path: '/products?category=trang-suc-cuoi' },
  { label: 'Đồng hồ', path: '/products?category=dong-ho' }
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="m21 21-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 8h13l-1.2 7.4a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.7L5.8 5.8H3M9 20h.01M17 20h.01M9.2 8a2.8 2.8 0 0 1 5.6 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HamburgerIcon({ open }) {
  if (open) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const { totalQuantity } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const accountMenuRef = useRef(null);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const currentParams = new globalThis.URLSearchParams(location.search);
    setSearchKeyword(currentParams.get('q') || '');
  }, [location.search]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setIsAccountOpen(false);
    closeMenu();
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const normalizedKeyword = searchKeyword.trim();
    const nextParams = new globalThis.URLSearchParams();

    if (normalizedKeyword) {
      nextParams.set('q', normalizedKeyword);
    }

    navigate({
      pathname: '/products',
      search: nextParams.toString() ? `?${nextParams.toString()}` : ''
    });
    closeMenu();
  }

  function isCategoryActive(path) {
    if (location.pathname !== '/products') {
      return false;
    }

    const currentParams = new globalThis.URLSearchParams(location.search);
    const targetUrl = new globalThis.URL(path, globalThis.location.origin);

    return currentParams.get('category') === targetUrl.searchParams.get('category');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#ece4d7] bg-white/88 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="border-b border-slate-100 bg-navy text-[11px] text-white/85">
        <div className="container-page flex min-h-10 items-center justify-center gap-3 py-1 text-center sm:justify-between sm:text-left">
          <p className="font-medium">Hotline: 1900 6868</p>
          <p className="hidden md:block">Miễn phí giao hàng cho đơn từ 1.000.000₫</p>
          <p className="hidden lg:block">Đổi size trong 7 ngày với sản phẩm đủ điều kiện</p>
        </div>
      </div>

      <div className="container-page">
        <div className="flex min-h-[66px] items-center gap-2.5 py-2">
          <Link to="/" className="flex min-w-0 items-center gap-3" onClick={closeMenu}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gold/70 bg-navy text-sm font-bold tracking-[0.16em] text-gold">
              JA
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold tracking-[0.16em] text-navy sm:text-base">
                JewelAura
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.28em] text-gold/90 lg:block">
                Tỏa sáng theo cách của bạn
              </span>
            </span>
          </Link>

          <form className="hidden min-w-0 flex-1 px-4 md:flex lg:px-6" onSubmit={handleSearchSubmit}>
            <label className="sr-only" htmlFor="site-search">
              Tìm kiếm sản phẩm
            </label>
            <div className="flex w-full overflow-hidden rounded-full border border-[#d9e2ec] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/10">
              <span className="flex items-center pl-4 text-slate-400">
                <SearchIcon />
              </span>
              <input
                id="site-search"
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm nhẫn, bông tai, dây chuyền, quà tặng..."
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-navy outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="m-1 rounded-full bg-navy px-5 text-sm font-semibold text-white transition hover:bg-slate-800" aria-label="Tìm kiếm">
                Tìm
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative hidden md:block" ref={accountMenuRef}>
                <button
                  type="button"
                  className="icon-button h-11 px-4"
                  aria-haspopup="menu"
                  aria-expanded={isAccountOpen}
                  onClick={() => setIsAccountOpen((current) => !current)}
                >
                  <UserIcon />
                  <span className="max-w-[140px] truncate text-sm font-semibold">
                    {user?.fullName || 'Tài khoản'}
                  </span>
                  <ChevronIcon open={isAccountOpen} />
                </button>

                {isAccountOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] w-64 overflow-hidden rounded-[26px] border border-[#ece4d7] bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="text-sm font-semibold text-navy">{user?.fullName || 'Tài khoản'}</p>
                      <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      <Link to="/profile" className="rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-cream hover:text-navy">
                        Hồ sơ của tôi
                      </Link>
                      <Link to="/wishlist" className="rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-cream hover:text-navy">
                        Sản phẩm yêu thích
                      </Link>
                      <Link to="/my-orders" className="rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-cream hover:text-navy">
                        Đơn hàng của tôi
                      </Link>
                      {user?.role === 'admin' ? (
                        <Link to="/admin" className="rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-cream hover:text-navy">
                          Khu vực quản trị
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="btn-ghost px-3" onClick={closeMenu}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-outline px-4 py-2.5" onClick={closeMenu}>
                  Đăng ký
                </Link>
              </div>
            )}

            <Link to="/cart" className="icon-button relative h-11 px-3 sm:px-4" aria-label="Giỏ hàng" onClick={closeMenu}>
              <CartIcon />
              <span className="hidden text-sm font-semibold lg:inline">Giỏ hàng</span>
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-navy">
                {totalQuantity}
              </span>
            </Link>

            <button
              type="button"
              className="icon-button h-11 px-3 md:hidden"
              aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <HamburgerIcon open={isMenuOpen} />
            </button>
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit}>
            <label className="sr-only" htmlFor="mobile-search">
              Tìm kiếm sản phẩm
            </label>
            <div className="flex overflow-hidden rounded-full border border-[#d9e2ec] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
              <span className="flex items-center pl-4 text-slate-400">
                <SearchIcon />
              </span>
              <input
                id="mobile-search"
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm sản phẩm..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="m-1 rounded-full bg-navy px-4 text-sm font-semibold text-white" aria-label="Tìm kiếm">
                Tìm
              </button>
            </div>
          </form>
        </div>

        <nav
          className={`${isMenuOpen ? 'block' : 'hidden'} border-t border-slate-100 pb-4 pt-3 md:block md:pb-3`}
          aria-label="Danh mục sản phẩm"
        >
          {isAuthenticated ? (
            <div className="mb-3 rounded-[24px] border border-slate-200 bg-[#fffaf0] p-4 md:hidden">
              <p className="text-sm font-semibold text-navy">{user?.fullName || 'Tài khoản'}</p>
              <p className="mt-1 text-xs text-slate-500">{user?.email}</p>
              <div className="mt-3 flex flex-col gap-1.5">
                <Link to="/profile" className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white" onClick={closeMenu}>
                  Hồ sơ của tôi
                </Link>
                <Link to="/wishlist" className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white" onClick={closeMenu}>
                  Sản phẩm yêu thích
                </Link>
                <Link to="/my-orders" className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white" onClick={closeMenu}>
                  Đơn hàng của tôi
                </Link>
                {user?.role === 'admin' ? (
                  <Link to="/admin" className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white" onClick={closeMenu}>
                    Khu vực quản trị
                  </Link>
                ) : null}
                <button type="button" className="rounded-2xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex gap-2 md:hidden">
              <Link to="/login" onClick={closeMenu} className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-navy">
                Đăng nhập
              </Link>
              <Link to="/register" onClick={closeMenu} className="flex-1 rounded-full bg-navy px-4 py-2.5 text-center text-sm font-semibold text-white">
                Đăng ký
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-1.5 md:flex-row md:flex-wrap md:items-center md:gap-2">
            {categoryItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={() =>
                  `rounded-full px-3.5 py-2 text-[13px] font-medium transition ${
                    isCategoryActive(item.path)
                      ? 'bg-navy text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                      : 'text-slate-700 hover:bg-[#f3f6fa] hover:text-navy'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
