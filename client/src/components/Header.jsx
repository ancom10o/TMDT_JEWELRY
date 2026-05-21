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
  { label: 'Lắc chân', path: '/products?category=lac-chan' },
  { label: 'Trang sức cưới', path: '/products?category=trang-suc-cuoi' },
  { label: 'Đồng hồ', path: '/products?category=dong-ho' },
  { label: 'Tất cả sản phẩm', path: '/products' }
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="m21 21-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
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
      <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none">
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
    <header className="sticky top-0 z-50 border-b border-[#ece4d7] bg-white/88 shadow-[0_12px_32px_rgba(15,23,42,0.055)] backdrop-blur-xl">
      <div className="border-b border-slate-100 bg-navy text-[11px] text-white/85">
        <div className="container-page flex min-h-8 items-center justify-center gap-2 py-0.5 text-center sm:justify-between sm:text-left">
          <p className="font-medium">Hotline: 1900 6868</p>
          <p className="hidden md:block">Miễn phí giao hàng cho đơn từ 1.000.000d</p>
          <p className="hidden lg:block">Đổi size trong 7 ngày với sản phẩm đủ điều kiện</p>
        </div>
      </div>

      <div className="container-page">
        <div className="flex min-h-[56px] items-center gap-2 py-2 lg:min-h-[60px] lg:gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 lg:gap-2.5" onClick={closeMenu}>
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gold/70 bg-navy text-[12px] font-bold tracking-[0.14em] text-gold lg:h-8 lg:w-8 lg:text-[13px]">
              JA
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold tracking-[0.1em] text-navy sm:text-[14px] lg:text-[15px] lg:tracking-[0.14em]">JewelAura</span>
              <span className="hidden text-[9px] uppercase tracking-[0.22em] text-gold/90 lg:block">Tỏa sáng theo cách của bạn</span>
            </span>
          </Link>

          <form className="hidden min-w-0 flex-1 justify-center px-1 md:flex lg:px-4" onSubmit={handleSearchSubmit}>
            <label className="sr-only" htmlFor="site-search">
              Tìm kiếm sản phẩm
            </label>
            <div className="flex h-10 w-full max-w-[300px] overflow-hidden rounded-full border border-[#d9e2ec] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.045)] transition focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/10 lg:h-11 lg:max-w-[420px] xl:max-w-[500px]">
              <span className="flex items-center pl-3 text-slate-400">
                <SearchIcon />
              </span>
              <input
                id="site-search"
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm nhẫn, bông tai, dây chuyền..."
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-navy outline-none placeholder:text-slate-400 lg:px-3"
              />
              <button type="submit" className="my-1 mr-1 inline-flex items-center rounded-full bg-navy px-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:px-4" aria-label="Tim kiem">
                Tìm
              </button>
            </div>
          </form>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            {isAuthenticated ? (
              <div className="relative hidden md:block" ref={accountMenuRef}>
                <button
                  type="button"
                  className="icon-button h-10 max-w-[44px] gap-2 px-3 whitespace-nowrap lg:max-w-[180px]"
                  aria-haspopup="menu"
                  aria-expanded={isAccountOpen}
                  onClick={() => setIsAccountOpen((current) => !current)}
                >
                  <UserIcon />
                  <span className="hidden min-w-0 max-w-[160px] truncate text-sm font-semibold lg:inline">{user?.fullName || 'Tai khoan'}</span>
                  <span className="hidden lg:inline-flex">
                    <ChevronIcon open={isAccountOpen} />
                  </span>
                </button>

                {isAccountOpen ? (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-[24px] border border-[#ece4d7] bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="text-sm font-semibold text-navy">{user?.fullName || 'Tai khoan'}</p>
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
                      <button type="button" className="rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50" onClick={handleLogout}>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hidden items-center gap-1.5 md:flex">
                <Link to="/login" className="btn-ghost h-10 px-3 py-2" onClick={closeMenu}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-outline h-10 px-4 py-2" onClick={closeMenu}>
                  Đăng ký
                </Link>
              </div>
            )}

            <Link to="/cart" className="icon-button relative h-10 gap-2 px-3 whitespace-nowrap sm:px-3.5" aria-label="Gio hang" onClick={closeMenu}>
              <CartIcon />
              <span className="hidden whitespace-nowrap text-sm font-semibold lg:inline">Giỏ hàng</span>
              <span className="pointer-events-none absolute right-0 top-0 flex h-5 min-w-5 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold leading-none text-navy">
                {totalQuantity}
              </span>
            </Link>

            <button type="button" className="icon-button h-10 w-10 px-0 md:hidden" aria-label={isMenuOpen ? 'Dong menu' : 'Mo menu'} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((current) => !current)}>
              <HamburgerIcon open={isMenuOpen} />
            </button>
          </div>
        </div>

        <div className="pb-2 md:hidden">
          <form onSubmit={handleSearchSubmit}>
            <label className="sr-only" htmlFor="mobile-search">
              Tìm kiếm sản phẩm
            </label>
            <div className="flex h-11 overflow-hidden rounded-full border border-[#d9e2ec] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.045)]">
              <span className="flex items-center pl-3 text-slate-400">
                <SearchIcon />
              </span>
              <input
                id="mobile-search"
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm sản phẩm..."
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="my-1 mr-1 inline-flex items-center rounded-full bg-navy px-4 text-sm font-semibold text-white" aria-label="Tim kiem">
                Tìm
              </button>
            </div>
          </form>
        </div>
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} border-t border-slate-100 pb-2.5 pt-2 md:block md:pb-2`} aria-label="Danh muc san pham">
          {isAuthenticated ? (
            <div className="mb-3 rounded-[24px] border border-slate-200 bg-[#fffaf0] p-4 md:hidden">
              <p className="text-sm font-semibold text-navy">{user?.fullName || 'Tai khoan'}</p>
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

          <div className="premium-scrollbar flex flex-col gap-1 md:-mx-1 md:flex-row md:flex-nowrap md:items-center md:gap-1.5 md:overflow-x-auto md:px-1 md:pb-1">
            {categoryItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={() =>
                  `shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
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
