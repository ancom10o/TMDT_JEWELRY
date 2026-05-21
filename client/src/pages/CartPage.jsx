/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { getPublicAssetUrl } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

function CartItemCard({ item, isSelected, isSyncing, onToggleSelected, onUpdateQuantity, onRemove }) {
  const imageUrl = getPublicAssetUrl(item.image);
  const itemKey = item.serverItemId || item.id || item.productId;

  return (
    <article className="surface-card p-4 sm:grid sm:grid-cols-[156px_minmax(0,1fr)] sm:items-center sm:gap-6">
      <div className="mb-4 flex items-center gap-4 sm:mb-0">
        <label className="inline-flex shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelected(itemKey)}
            className="h-5 w-5 rounded border-slate-300 text-gold accent-[#d4af37]"
            aria-label={`Chọn ${item.name}`}
          />
        </label>

        <Link
          to={item.slug ? `/products/${item.slug}` : '/products'}
          className="block flex-1 overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.25),_transparent_35%),linear-gradient(135deg,_#fffdf8_0%,_#f5ecda_100%)] p-3"
        >
          <div className="aspect-square overflow-hidden rounded-[16px] border border-white/70 bg-white/80">
            {imageUrl ? (
              <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.22em] text-navy">
                JewelAura
              </div>
            )}
          </div>
        </Link>
      </div>

      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link to={item.slug ? `/products/${item.slug}` : '/products'} className="text-lg font-semibold text-navy transition hover:text-gold">
              {item.name}
            </Link>
            <p className="mt-2 text-sm text-slate-500">Đơn giá: {formatCurrency(item.price)}</p>
            {item.selectedSize ? <p className="mt-1 text-sm text-slate-500">Kích thước: {item.selectedSize}</p> : null}
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
                disabled={isSyncing || item.quantity <= 1}
                className="px-4 py-2 text-lg text-navy transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={item.stock || undefined}
                value={item.quantity}
                onChange={(event) => onUpdateQuantity(itemKey, Number(event.target.value) || 1)}
                disabled={isSyncing}
                className="w-16 border-x border-slate-200 py-2 text-center text-sm font-semibold outline-none"
              />
              <button
                type="button"
                onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
                disabled={isSyncing || (item.stock > 0 && item.quantity >= item.stock)}
                className="px-4 py-2 text-lg text-navy transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>

            <p className="text-base font-bold text-navy">{formatCurrency(item.price * item.quantity)}</p>

            <button
              type="button"
              onClick={() => onRemove(itemKey)}
              disabled={isSyncing}
              className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CartSummary({ selectedTotalQuantity, selectedTotalPrice, selectedTotalItems }) {
  const hasSelection = selectedTotalItems > 0;

  return (
    <aside className="surface-card h-fit p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Tóm Tắt Đơn Hàng</p>
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Sản phẩm đã chọn</span>
          <span className="font-semibold text-navy">{selectedTotalQuantity}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Tạm tính</span>
          <span className="font-semibold text-navy">{formatCurrency(selectedTotalPrice)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-base font-semibold text-navy">Tổng tạm tính</span>
          <span className="text-2xl font-bold text-navy">{formatCurrency(selectedTotalPrice)}</span>
        </div>
      </div>
      <Link to="/products" className="btn-outline mt-6 w-full">
        Tiếp tục mua sắm
      </Link>

      {hasSelection ? (
        <Link to="/checkout" className="btn-secondary mt-4 w-full">
          Thanh toán món đã chọn
        </Link>
      ) : (
        <button type="button" disabled className="btn-secondary mt-4 w-full opacity-50">
          Chọn sản phẩm để thanh toán
        </button>
      )}
    </aside>
  );
}

function EmptyCartState() {
  return (
    <div className="state-empty mt-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4d6] text-xl font-bold text-navy">
        JA
      </div>
      <h2 className="mt-4 text-xl font-semibold text-navy">Giỏ hàng đang trống</h2>
      <p className="mt-2">Hãy khám phá thêm sản phẩm để bắt đầu đơn hàng của bạn.</p>
      <Link to="/products" className="btn-secondary mt-6">
        Tiếp tục mua sắm
      </Link>
    </div>
  );
}

function CartPage() {
  const {
    cartItems,
    totalQuantity,
    selectedCartItemKeys,
    selectedTotalQuantity,
    selectedTotalPrice,
    selectedTotalItems,
    isInitialized,
    isSyncing,
    cartError,
    updateQuantity,
    removeFromCart,
    removeSelectedFromCart,
    clearCart,
    toggleCartItemSelection,
    selectAllCartItems,
    clearCartSelection
  } = useCart();

  const allItemsSelected = cartItems.length > 0 && selectedTotalItems === cartItems.length;

  if (!isInitialized) {
    return (
      <section className="container-page py-12">
        <div className="state-loading">Đang tải giỏ hàng...</div>
      </section>
    );
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Giỏ hàng</h1>
          <p className="mt-2 text-sm text-slate-500">Bạn đang có {totalQuantity} sản phẩm trong giỏ hàng.</p>
        </div>

        {cartItems.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={allItemsSelected ? clearCartSelection : selectAllCartItems} disabled={isSyncing} className="btn-outline">
              {allItemsSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
            <button type="button" onClick={() => removeSelectedFromCart()} disabled={isSyncing || selectedTotalItems === 0} className="btn-outline">
              Xóa món đã chọn
            </button>
            <button type="button" onClick={() => clearCart()} disabled={isSyncing} className="btn-outline">
              Xóa toàn bộ
            </button>
          </div>
        ) : null}
      </div>

      {cartError ? <div className="state-error mt-6">{cartError}</div> : null}

      {cartItems.length === 0 ? (
        <EmptyCartState />
      ) : (
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.serverItemId || item.id || item.productId}
                item={item}
                isSelected={selectedCartItemKeys.includes(item.serverItemId || item.id || item.productId)}
                isSyncing={isSyncing}
                onToggleSelected={toggleCartItemSelection}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <CartSummary
            selectedTotalQuantity={selectedTotalQuantity}
            selectedTotalPrice={selectedTotalPrice}
            selectedTotalItems={selectedTotalItems}
          />
        </div>
      )}
    </section>
  );
}

export default CartPage;
