import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { useWishlist } from '../hooks/useWishlist.js';

function WishlistPage() {
  const { wishlistItems, isLoading, error, toggleWishlist } = useWishlist();

  async function handleRemove(product) {
    try {
      await toggleWishlist(product);
    } catch {
      // Error state is already exposed by context.
    }
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Tài Khoản</p>
        <h1 className="mt-3 text-3xl font-bold text-navy">Sản phẩm yêu thích</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Lưu lại những mẫu trang sức bạn muốn xem lại nhanh hơn trước khi quyết định mua.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="surface-card overflow-hidden">
              <div className="h-72 animate-pulse bg-slate-100" />
              <div className="space-y-3 p-6">
                <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && error ? <div className="state-error">{error}</div> : null}

      {!isLoading && !error && wishlistItems.length === 0 ? (
        <div className="state-empty">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3f8] text-xl font-bold text-navy">
            JA
          </div>
          <h2 className="mt-4 text-xl font-semibold text-navy">Bạn chưa có sản phẩm yêu thích</h2>
          <p className="mt-2">Hãy thêm những mẫu bạn quan tâm từ trang chi tiết sản phẩm để lưu lại tại đây.</p>
          <Link to="/products" className="btn-secondary mt-6">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && wishlistItems.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {wishlistItems.map((product) => (
            <div key={product._id || product.slug} className="relative">
              <button
                type="button"
                onClick={() => handleRemove(product)}
                className="absolute right-4 top-4 z-10 rounded-full border border-white/80 bg-white/92 px-3 py-1.5 text-xs font-semibold text-navy shadow-[0_10px_24px_rgba(15,23,42,0.1)] transition hover:border-gold hover:text-gold"
              >
                Bỏ yêu thích
              </button>
              <ProductCard product={product} mode="compact" />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default WishlistPage;
