/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicAssetUrl } from '../services/api.js';
import PriceDisplay from './PriceDisplay.jsx';

function ProductCard({ product, mode = 'listing', onAddToCart, isSyncing = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getPublicAssetUrl(product.images?.[0]);
  const badgeLabel = product.discount > 0 ? `-${product.discount}%` : product.isNew ? 'Moi' : product.sold > 30 ? 'Ban chay' : '';
  const compact = mode === 'compact';

  return (
    <article className="group flex h-full min-h-[100%] flex-col overflow-hidden rounded-[26px] border border-[#e4ebf3] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(15,23,42,0.08)]">
      <Link
        to={`/products/${product.slug}`}
        className={`relative block overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(203,213,225,0.28),_transparent_38%),linear-gradient(180deg,_#ffffff_0%,_#f3f7fb_100%)] ${
          compact ? 'p-3.5' : 'p-4'
        }`}
      >
        {badgeLabel ? (
          <span className="absolute left-4 top-4 z-10 rounded-full border border-white/60 bg-[#fffaf0]/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy shadow-sm">
            {badgeLabel}
          </span>
        ) : null}

        <div className={`overflow-hidden rounded-[22px] border border-white/70 bg-white/85 ${compact ? 'h-[230px] sm:h-[250px]' : 'h-[250px] sm:h-[280px]'}`}>
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.045]"
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

      <div className={`flex h-full flex-1 flex-col ${compact ? 'p-4' : 'p-5'}`}>
        <div className="min-h-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {product.category?.name || 'Trang suc'}
          </p>
        </div>

        <div className="mt-2.5 min-h-[52px]">
          <h3 className={`line-clamp-2 font-display leading-[0.98] text-navy ${compact ? 'text-[1.5rem]' : 'text-[1.7rem]'}`}>
            {product.name}
          </h3>
        </div>

        {!compact ? (
          <div className="mt-3 min-h-[44px]">
            <p className="line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>
          </div>
        ) : null}

        <div className="mt-4 flex min-h-[52px] items-end justify-between gap-4">
          <div className="min-h-[44px]">
            <PriceDisplay price={product.price} oldPrice={product.oldPrice} size={compact ? 'sm' : 'md'} />
          </div>
          {!compact ? (
            <span className="pb-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              {product.stock > 0 ? 'Con hang' : 'Het hang'}
            </span>
          ) : null}
        </div>

        <div className="mt-3 min-h-[18px]">
          {!compact ? (
            <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{product.material || '\u00A0'}</span>
          ) : (
            <span className="block h-[18px]" aria-hidden="true" />
          )}
        </div>

        <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
          <Link to={`/products/${product.slug}`} className="btn-outline w-full px-4 py-2.5 text-center">
            Xem chi tiet
          </Link>
          {onAddToCart ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0 || isSyncing}
              className="btn-secondary w-full px-4 py-2.5"
            >
              {product.stock <= 0 ? 'Het hang' : 'Them vao gio'}
            </button>
          ) : (
            <Link to={`/products/${product.slug}`} className="btn-secondary w-full px-4 py-2.5 text-center">
              Kham pha
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
