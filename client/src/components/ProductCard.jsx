/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicAssetUrl } from '../services/api.js';
import { getGenderLabel, getProductMaterialLabel } from '../utils/productFilters.js';
import PriceDisplay from './PriceDisplay.jsx';

function ProductCard({ product, mode = 'listing', onAddToCart, isSyncing = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getPublicAssetUrl(product.images?.[0]);
  const badgeLabel = product.discount > 0 ? `-${product.discount}%` : product.isNew ? 'Moi' : product.sold > 30 ? 'Ban chay' : '';
  const compact = mode === 'compact';
  const materialLabel = getProductMaterialLabel(product);
  const genderLabel = getGenderLabel(product.gender);

  return (
    <article className="group flex h-full min-h-[100%] flex-col overflow-hidden rounded-[24px] border border-[#e4ebf3] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.07)]">
      <Link
        to={`/products/${product.slug}`}
        className={`relative block overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(203,213,225,0.28),_transparent_38%),linear-gradient(180deg,_#ffffff_0%,_#f3f7fb_100%)] ${
          compact ? 'p-3' : 'p-3.5'
        }`}
      >
        {badgeLabel ? (
          <span className="absolute left-3.5 top-3.5 z-10 rounded-full border border-white/60 bg-[#fffaf0]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy shadow-sm">
            {badgeLabel}
          </span>
        ) : null}

        <div className="aspect-square max-h-[250px] overflow-hidden rounded-[20px] border border-white/70 bg-white/85">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover object-center transition duration-500 ease-out group-hover:scale-[1.045]"
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

      <div className={`flex h-full flex-1 flex-col ${compact ? 'p-3.5' : 'p-4'}`}>
        <div className="min-h-[16px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {product.category?.name || 'Trang suc'}
          </p>
        </div>

        <div className="mt-2 min-h-[46px]">
          <h3 className={`line-clamp-2 font-display leading-[1.02] text-navy ${compact ? 'text-[1.36rem]' : 'text-[1.5rem]'}`}>
            {product.name}
          </h3>
        </div>

        <div className="mt-3 flex min-h-[46px] items-end justify-between gap-3">
          <div className="min-h-[40px]">
            <PriceDisplay price={product.price} oldPrice={product.oldPrice} size={compact ? 'sm' : 'md'} />
          </div>
          {!compact ? (
            <span className="pb-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              {product.stock > 0 ? 'Con hang' : 'Het hang'}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex min-h-[22px] items-center justify-between gap-2">
          {!compact ? (
            <>
              <span className="truncate text-[11px] uppercase tracking-[0.16em] text-slate-400">{materialLabel || '\u00A0'}</span>
              {genderLabel ? (
                <span className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {genderLabel}
                </span>
              ) : null}
            </>
          ) : (
            <span className="block h-[16px]" aria-hidden="true" />
          )}
        </div>

        <div className="mt-auto grid gap-2 pt-3 sm:grid-cols-2">
          <Link to={`/products/${product.slug}`} className="btn-outline w-full px-3.5 py-2.5 text-center text-sm">
            Xem chi tiet
          </Link>
          {onAddToCart ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0 || isSyncing}
              className="btn-secondary w-full px-3.5 py-2.5 text-sm"
            >
              {product.stock <= 0 ? 'Het hang' : 'Them vao gio'}
            </button>
          ) : (
            <Link to={`/products/${product.slug}`} className="btn-secondary w-full px-3.5 py-2.5 text-center text-sm">
              Kham pha
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
