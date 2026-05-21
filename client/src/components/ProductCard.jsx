/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicAssetUrl } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';
import { getGenderLabel, getProductMaterialLabel } from '../utils/productFilters.js';

function ProductCard({ product, mode = 'listing', onAddToCart, isSyncing = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getPublicAssetUrl(product.images?.[0]);
  const comparePrice = product.originalPrice || product.oldPrice || 0;
  const discountPercent = product.discountPercent || (comparePrice > product.price ? Math.round(((comparePrice - product.price) / comparePrice) * 100) : 0);
  const badgeLabel = discountPercent > 0 ? `-${discountPercent}%` : product.isNew ? 'Mới' : '';
  const compact = mode === 'compact';
  const materialLabel = getProductMaterialLabel(product);
  const genderLabel = getGenderLabel(product.gender);
  const metadata = [materialLabel, genderLabel].filter(Boolean).join(' · ');
  const lowStock = Number(product.stock) > 0 && Number(product.stock) <= 3;
  const ctaLabel = onAddToCart ? 'Xem chi tiết' : 'Khám phá ngay';

  return (
    <article className="group flex h-full min-h-[100%] flex-col overflow-hidden rounded-[18px] border border-[#e8eef5] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#e3d6b5] hover:shadow-[0_22px_55px_rgba(15,23,42,0.075)] sm:rounded-[22px] lg:rounded-[24px]">
      <Link
        to={`/products/${product.slug}`}
        className={`relative block overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_rgba(212,175,55,0.14),_transparent_34%),linear-gradient(180deg,_#ffffff_0%,_#f6f8fb_100%)] ${
          compact ? 'p-2.5 sm:p-3' : 'p-2.5 sm:p-3 lg:p-3.5'
        }`}
      >
        {badgeLabel ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full border border-gold/25 bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a761e] shadow-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px] lg:left-3.5 lg:top-3.5">
            {badgeLabel}
          </span>
        ) : null}

        {lowStock ? (
          <span className="absolute right-2.5 top-2.5 z-10 rounded-full border border-amber-200 bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-700 shadow-sm sm:right-3 sm:top-3 lg:right-3.5 lg:top-3.5">
            Sắp hết
          </span>
        ) : null}

        <div className="aspect-square max-h-[250px] overflow-hidden rounded-[16px] border border-white/80 bg-white/88 p-2.5 sm:p-3 lg:rounded-[20px] lg:p-4">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-contain object-center transition duration-500 ease-out group-hover:scale-[1.035]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(203,213,225,0.26),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#eef3f8_100%)]">
              <span className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-navy">
                JewelAura
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className={`flex h-full flex-1 flex-col ${compact ? 'p-3 sm:p-3.5' : 'p-3 sm:p-3.5 lg:p-4'}`}>
        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px] lg:text-[10px] lg:tracking-[0.16em]">
          {product.category?.name || 'Trang sức'}
        </p>

        <Link to={`/products/${product.slug}`} className="mt-1.5 block min-h-[42px] transition hover:text-gold lg:mt-2 lg:min-h-[50px]">
          <h3 className={`line-clamp-2 font-display font-semibold leading-snug tracking-normal text-navy transition ${compact ? 'text-[13px] sm:text-[14px]' : 'text-[13px] sm:text-[14px] lg:text-[16px]'}`}>
            {product.name}
          </h3>
        </Link>

        <Link to={`/products/${product.slug}`} className="mt-2 block min-h-[30px] lg:mt-2.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={`${compact ? 'text-sm sm:text-base lg:text-lg' : 'text-base sm:text-lg lg:text-xl'} font-bold text-navy`}>
              {formatCurrency(product.price)}
            </span>
            {comparePrice > product.price ? (
              <span className="text-[10px] text-slate-400 line-through sm:text-xs lg:text-sm">
                {formatCurrency(comparePrice)}
              </span>
            ) : null}
          </div>
        </Link>

        <Link to={`/products/${product.slug}`} className="mt-1.5 block min-h-[18px] lg:mt-2">
          <span className="block truncate text-[10px] leading-5 text-slate-400 sm:text-[11px]">
            {metadata || '\u00A0'}
          </span>
        </Link>

        <div className={`mt-auto flex items-center gap-2 pt-3 ${onAddToCart ? 'justify-between' : 'justify-center'} lg:pt-3.5`}>
          <Link to={`/products/${product.slug}`} className="inline-flex min-h-9 flex-1 items-center justify-center rounded-full bg-navy px-3 py-2 text-center text-xs font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_34px_rgba(15,23,42,0.18)] sm:text-sm lg:min-h-10 lg:px-5">
            {ctaLabel}
          </Link>

          {onAddToCart ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0 || isSyncing}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7e0ea] bg-white text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:bg-[#fff8eb] hover:text-[#9a761e] disabled:cursor-not-allowed disabled:opacity-45 lg:h-10 lg:w-10"
              aria-label="Thêm vào giỏ hàng"
            >
              <svg aria-hidden="true" className="h-4 w-4 lg:h-5 lg:w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6.5 8h13l-1.2 7.4a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.7L5.8 5.8H3M9 20h.01M17 20h.01M12 11v4M10 13h4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
