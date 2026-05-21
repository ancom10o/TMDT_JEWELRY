/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PriceDisplay from '../components/PriceDisplay.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, formatNumber } from '../utils/format.js';
import { getGenderLabel, getMaterialGroupLabel, getProductMaterialLabel } from '../utils/productFilters.js';
import { getProductDetail, getProducts, getPublicAssetUrl } from '../services/api.js';

const DETAIL_TABS = [
  { id: 'description', label: 'Mô tả sản phẩm' },
  { id: 'specs', label: 'Thông số' },
  { id: 'warranty', label: 'Chính sách bảo hành' },
  { id: 'care', label: 'Hướng dẫn bảo quản' }
];
function HeartIcon({ filled = false }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M12 20.5s-6.5-4.3-8.8-8C1 9.3 2 5.7 5.5 4.6 8 3.8 10 5.2 12 7.3c2-2.1 4-3.5 6.5-2.7 3.5 1.1 4.5 4.7 2.3 7.9-2.3 3.7-8.8 8-8.8 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductGallery({ product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const images = product.images?.length ? product.images : [''];

  useEffect(() => {
    setActiveImage(0);
    setFailedImages({});
  }, [product._id]);

  function markImageFailed(index) {
    setFailedImages((current) => ({
      ...current,
      [index]: true
    }));
  }

  function renderPlaceholder(label) {
    return (
      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(203,213,225,0.26),_transparent_34%),linear-gradient(135deg,_#ffffff_0%,_#eef3f8_58%,_#dfe7f1_100%)]">
        <div className="text-center">
          <span className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-navy">
            JewelAura
          </span>
          <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
        </div>
      </div>
    );
  }

  const activeImageUrl = getPublicAssetUrl(images[activeImage]);

  return (
    <div className="rounded-[28px] border border-[#e4ebf3] bg-[linear-gradient(135deg,_#ffffff_0%,_#f3f7fb_100%)] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="grid gap-4 md:grid-cols-[86px_minmax(0,1fr)] md:items-start">
        <div className="premium-scrollbar order-2 grid grid-flow-col auto-cols-[76px] gap-3 overflow-x-auto pb-1 md:order-1 md:max-h-[620px] md:grid-flow-row md:auto-cols-auto md:overflow-x-visible md:overflow-y-auto md:pb-0">
          {images.map((image, index) => {
            const thumbnailUrl = getPublicAssetUrl(image);
            const isActive = index === activeImage;

            return (
              <button
                key={`${product._id}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`overflow-hidden rounded-[18px] border p-1 transition ${
                  isActive ? 'border-gold bg-[#fff8eb] shadow-[0_10px_22px_rgba(212,175,55,0.14)]' : 'border-[#e6dfd2] bg-white hover:border-gold/60'
                }`}
              >
                <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[14px] bg-white md:h-[80px] md:w-[80px]">
                  {thumbnailUrl && !failedImages[index] ? (
                    <img
                      src={thumbnailUrl}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-contain object-center"
                      onError={() => markImageFailed(index)}
                    />
                  ) : (
                    renderPlaceholder(`Ảnh ${index + 1}`)
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="order-1 md:order-2">
          <div className="group flex aspect-square min-h-[320px] max-h-[620px] items-center justify-center overflow-hidden rounded-[24px] border border-white/70 bg-white/90 sm:min-h-[420px] lg:min-h-[520px]">
            {activeImageUrl && !failedImages[activeImage] ? (
              <img
                src={activeImageUrl}
                alt={product.name}
                className="h-full w-full object-contain object-center p-4 transition duration-500 ease-out group-hover:scale-[1.025] sm:p-6"
                onError={() => markImageFailed(activeImage)}
              />
            ) : (
              renderPlaceholder(product.name)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuantitySelector({ value, max, onChange }) {
  return (
    <div className="flex w-fit items-center overflow-hidden rounded-full border border-[#ddd4c5] bg-white shadow-sm">
      <button type="button" onClick={() => onChange(value - 1)} className="px-4 py-3 text-lg text-navy transition hover:bg-cream">
        -
      </button>
      <input
        type="number"
        min="1"
        max={Math.max(max || 1, 1)}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 1)}
        className="w-16 border-x border-[#ddd4c5] py-3 text-center text-sm font-semibold outline-none"
      />
      <button type="button" onClick={() => onChange(value + 1)} className="px-4 py-3 text-lg text-navy transition hover:bg-cream">
        +
      </button>
    </div>
  );
}

function ProductDetailTabs({ product, availableSizes, detailItems }) {
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    setActiveTab('description');
  }, [product._id]);

  const tabContentMap = {
    description: (
      <div className="space-y-4 text-sm leading-8 text-slate-600 sm:text-[15px]">
        <p>{product.description || 'Thông tin mô tả đang được cập nhật.'}</p>
      </div>
    ),
    specs: (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {detailItems.length > 0 ? (
          detailItems.map((item) => (
            <div key={item.label} className="rounded-[22px] border border-[#ece4d8] bg-[#fffdf9] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-3 text-sm font-semibold text-navy sm:text-[15px]">{item.value}</p>
            </div>
          ))
        ) : (
          <div className="state-empty sm:col-span-2 lg:col-span-3">Thông số đang được cập nhật.</div>
        )}
      </div>
    ),
    warranty: (
      <div className="space-y-4 text-sm leading-8 text-slate-600 sm:text-[15px]">
        <p>Bảo hành chính hãng theo chính sách áp dụng của JewelAura đối với từng dòng sản phẩm.</p>
        <p>Hỗ trợ kiểm tra, vệ sinh và tư vấn đổi size trong thời gian phù hợp với điều kiện sản phẩm.</p>
      </div>
    ),
    care: (
      <div className="space-y-4 text-sm leading-8 text-slate-600 sm:text-[15px]">
        <p>Tránh để trang sức tiếp xúc trực tiếp với hóa chất mạnh, nước hoa và môi trường ẩm kéo dài.</p>
        <p>Bảo quản trong hộp riêng, lau nhẹ bằng khăn mềm sau khi sử dụng để giữ độ sáng và bề mặt hoàn thiện.</p>
        {availableSizes.length > 0 ? <p>Khi cần điều chỉnh size, hãy liên hệ tư vấn để được hướng dẫn phù hợp.</p> : null}
      </div>
    )
  };

  return (
    <div className="rounded-[30px] border border-[#ece4d8] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6 lg:p-8">
      <div className="flex flex-wrap gap-2">
        {DETAIL_TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-navy text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)]' : 'bg-[#f7f3ea] text-slate-600 hover:bg-[#efe7d7] hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">{tabContentMap[activeTab]}</div>
    </div>
  );
}

function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, cartItems, isSyncing, selectOnlyCartItemByProduct, updateQuantity } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedError, setRelatedError] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');

  useEffect(() => {
    if (!wishlistMessage) {
      return undefined;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setWishlistMessage('');
    }, 2600);

    return () => globalThis.clearTimeout(timeoutId);
  }, [wishlistMessage]);

  useEffect(() => {
    let isMounted = true;

    async function loadProductDetail() {
      try {
        setIsLoading(true);
        setErrorMessage('');
        setRelatedProducts([]);
        setRelatedLoading(true);
        setRelatedError('');
        setPurchaseMessage('');
        setWishlistMessage('');

        const detailResponse = await getProductDetail(slug);
        if (!isMounted) {
          return;
        }

        const currentProduct = detailResponse.product || null;
        setProduct(currentProduct);
        setQuantity(1);
        setSelectedSize(Array.isArray(currentProduct?.size) && currentProduct.size.length > 0 ? currentProduct.size[0] : '');

        if (!currentProduct) {
          setErrorMessage('Không tìm thấy sản phẩm.');
          setRelatedLoading(false);
          return;
        }

        try {
          const relatedResponse = await getProducts({
            category: currentProduct.category?.slug,
            limit: 8,
            sort: 'newest'
          });

          if (!isMounted) {
            return;
          }

          setRelatedProducts((relatedResponse.products || []).filter((item) => item._id !== currentProduct._id).slice(0, 4));
        } catch {
          if (isMounted) {
            setRelatedError('Không thể tải sản phẩm liên quan.');
          }
        } finally {
          if (isMounted) {
            setRelatedLoading(false);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Không thể tải chi tiết sản phẩm.');
          setRelatedLoading(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProductDetail();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  function handleQuantityChange(nextQuantity) {
    if (!product) {
      return;
    }

    const safeQuantity = Math.min(Math.max(nextQuantity, 1), Math.max(product.stock || 1, 1));
    setQuantity(safeQuantity);
  }

  async function handleAddToCart() {
    if (!product || product.stock <= 0) {
      return false;
    }

    try {
      await addToCart(
        {
          ...product,
          selectedSize
        },
        quantity
      );
      setPurchaseMessage(`Đã thêm ${quantity} sản phẩm vào giỏ hàng.`);
      showToast({
        title: 'Đã thêm vào giỏ hàng',
        description: product.name,
        type: 'success'
      });
      return true;
    } catch (error) {
      showToast({
        title: 'Không thể thêm vào giỏ hàng',
        description: error.response?.data?.message || 'Vui lòng thử lại sau.',
        type: 'error'
      });
      setPurchaseMessage('Không thể thêm sản phẩm vào giỏ hàng lúc này.');
      return false;
    }
  }

  async function handleBuyNow() {
    if (!product || product.stock <= 0) {
      return;
    }

    try {
      const existingItem = cartItems.find(
        (item) => item.productId === product._id && (item.selectedSize || '') === (selectedSize || '')
      );
      const nextItems = existingItem
        ? await updateQuantity(existingItem.serverItemId || existingItem.id || existingItem.productId, quantity)
        : await addToCart(
            {
              ...product,
              selectedSize
            },
            quantity
          );

      const selectedKey = selectOnlyCartItemByProduct(product._id, selectedSize, nextItems);

      if (!selectedKey) {
        throw new Error('Không thể chọn sản phẩm để thanh toán.');
      }

      navigate('/checkout');
    } catch (error) {
      showToast({
        title: 'Không thể mua ngay',
        description: error.response?.data?.message || error.message || 'Vui lòng thử lại sau.',
        type: 'error'
      });
    }
  }

  async function handleToggleWishlist() {
    if (!product) {
      return;
    }

    if (!isAuthenticated) {
      setWishlistMessage('Vui lòng đăng nhập để thêm sản phẩm yêu thích.');
      return;
    }

    try {
      const result = await toggleWishlist(product);
      setWishlistMessage(result.action === 'added' ? 'Đã thêm vào danh sách yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.');
    } catch (error) {
      setWishlistMessage(error.message || 'Không thể cập nhật danh sách yêu thích lúc này.');
    }
  }

  if (isLoading) {
    return (
      <section className="container-page py-12">
        <div className="state-loading">Đang tải chi tiết sản phẩm...</div>
      </section>
    );
  }

  if (errorMessage || !product) {
    return (
      <section className="container-page py-12">
        <div className="state-error">{errorMessage || 'Không tìm thấy sản phẩm.'}</div>
      </section>
    );
  }

  const comparePrice = product.originalPrice || product.oldPrice || 0;
  const discountValue = product.discountPercent || (comparePrice > product.price ? Math.round(((comparePrice - product.price) / comparePrice) * 100) : 0);
  const discountPercent = discountValue > 0 ? `-${discountValue}%` : null;
  const availableSizes = Array.isArray(product.size) ? product.size.filter(Boolean) : [];
  const genderLabel = getGenderLabel(product.gender);
  const materialGroupLabel = getMaterialGroupLabel(product.materialGroup);
  const materialDetailLabel = getProductMaterialLabel(product);
  const detailItems = [
    product.sku ? { label: 'SKU', value: product.sku } : null,
    product.category?.name ? { label: 'Danh mục', value: product.category.name } : null,
    genderLabel ? { label: 'Giới tính', value: genderLabel } : null,
    materialGroupLabel ? { label: 'Nhóm chất liệu', value: materialGroupLabel } : null,
    materialDetailLabel ? { label: 'Chi tiết chất liệu', value: materialDetailLabel } : null,
    product.stone ? { label: 'Đá / điểm nhấn', value: product.stone } : null,
    availableSizes.length > 0 ? { label: 'Kích thước', value: availableSizes.join(', ') } : null,
    Number(product.weight) > 0 ? { label: 'Trọng lượng', value: `${formatNumber(product.weight)} g` } : null,
    typeof product.stock === 'number' ? { label: 'Tồn kho', value: `${formatNumber(product.stock)} sản phẩm` } : null,
  ].filter(Boolean);

  const stockStatus =
    product.stock <= 0 ? 'Hết hàng' : product.stock <= 3 ? 'Sắp hết hàng' : 'Còn hàng';

  const stockStatusClass =
    product.stock <= 0
      ? 'border-red-200 bg-red-50 text-red-700'
      : product.stock <= 3
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  const trustItems = [
    'Miễn phí giao hàng từ 1.000.000₫',
    'Đổi size trong 7 ngày',
    'Bảo hành chính hãng',
    'Tư vấn chọn size miễn phí'
  ];
  const favoriteActive = isFavorite(product._id);

  return (
    <section className="container-page py-6 sm:py-8 lg:py-12">
      <div className="grid items-start gap-5 sm:gap-6 lg:gap-8 xl:grid-cols-[0.55fr_0.45fr]">
        <ProductGallery product={product} />

        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[28px] border border-[#e4ebf3] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="text-xs text-slate-500">
              <Link to="/" className="hover:text-navy">
                Trang chủ
              </Link>
              {' / '}
              <Link to={`/products?category=${product.category?.slug || ''}`} className="hover:text-navy">
                {product.category?.name || 'Danh mục'}
              </Link>
              {' / '}
              <span className="text-slate-600">{product.name}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {product.category?.name ? (
                <span className="rounded-full border border-[#ead8aa] bg-[#fff8eb] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy">
                  {product.category.name}
                </span>
              ) : null}
              {materialDetailLabel ? (
                <span className="rounded-full border border-slate-200 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {materialDetailLabel}
                </span>
              ) : null}
              {genderLabel ? (
                <span className="rounded-full border border-slate-200 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {genderLabel}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 font-sans text-[1.65rem] font-semibold leading-tight tracking-normal text-navy sm:text-[1.95rem] lg:text-[2.15rem]">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PriceDisplay price={product.price} originalPrice={comparePrice} oldPrice={product.oldPrice} size="md" />
              {discountPercent ? (
                <span className="rounded-full border border-[#ead8aa] bg-[#fff8eb] px-3 py-1 text-xs font-semibold text-navy">
                  {discountPercent}
                </span>
              ) : null}
            </div>

            <div className="mt-5 rounded-[24px] border border-[#e3eaf2] bg-[linear-gradient(135deg,_#ffffff_0%,_#f5f8fc_100%)] p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="font-semibold text-navy">SKU:</span>
                <span>{product.sku || '--'}</span>
                {comparePrice > product.price ? (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>Giá gốc: {formatCurrency(comparePrice)}</span>
                  </>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${stockStatusClass}`}>
                    {stockStatus}
                  </span>
                </div>
                <div className="relative">
                  {wishlistMessage ? (
                    <div
                      className={`pointer-events-none absolute bottom-[calc(100%+10px)] right-0 z-20 w-56 rounded-2xl border px-3 py-2 text-xs font-medium shadow-[0_18px_32px_rgba(15,23,42,0.12)] transition ${
                        isAuthenticated ? 'border-emerald-200 bg-white text-emerald-700' : 'border-amber-200 bg-white text-amber-700'
                      }`}
                    >
                      {wishlistMessage}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    className={`icon-button h-10 w-10 rounded-full px-0 ${favoriteActive ? 'border-gold bg-[#fff4d8] text-gold hover:bg-[#ffefc4]' : ''}`}
                    aria-label="Yêu thích"
                  >
                    <HeartIcon filled={favoriteActive} />
                  </button>
                </div>
              </div>

              {availableSizes.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-navy">Chọn kích cỡ</p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {availableSizes.map((size) => {
                      const isActive = selectedSize === size;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[58px] rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                            isActive
                              ? 'border-gold bg-[#fff6df] text-navy shadow-[0_10px_24px_rgba(212,175,55,0.18)]'
                              : 'border-[#ddd4c5] bg-white text-slate-600 hover:border-gold hover:text-navy'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-navy">Số lượng</span>
                  <QuantitySelector value={quantity} max={product.stock} onChange={handleQuantityChange} />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0 || isSyncing}
                    className="btn-secondary w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {product.stock <= 0 ? 'Hết hàng' : isSyncing ? 'Đang cập nhật...' : 'Thêm vào giỏ hàng'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0 || isSyncing}
                    className="btn-outline w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mua ngay
                  </button>
                </div>
              </div>

              {purchaseMessage ? <div className="state-success mt-4">{purchaseMessage}</div> : null}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-gold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 lg:mt-10">
        <ProductDetailTabs product={product} availableSizes={availableSizes} detailItems={detailItems} />
      </div>

      <div className="section-shell">
        <SectionHeader
          eyebrow="Gợi ý thêm"
          title="Có thể bạn cũng thích"
          description="Một vài lựa chọn cùng tinh thần thiết kế để tiếp tục hành trình khám phá."
          actionLabel="Xem cùng danh mục"
          actionTo={`/products?category=${product.category?.slug || ''}`}
        />

        {relatedLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:mt-8 lg:grid-cols-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="surface-card overflow-hidden">
                <div className="h-44 animate-pulse bg-slate-100 sm:h-56 lg:h-72" />
                <div className="space-y-2 p-3 sm:p-4 lg:space-y-3 lg:p-6">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!relatedLoading && relatedError ? <div className="state-error mt-8">{relatedError}</div> : null}

        {!relatedLoading && !relatedError && relatedProducts.length === 0 ? (
          <div className="state-empty mt-8">Chưa có thêm sản phẩm liên quan trong cùng danh mục.</div>
        ) : null}

        {!relatedLoading && !relatedError && relatedProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:mt-8 lg:grid-cols-4 lg:gap-5">
            {relatedProducts.map((item) => (
              <ProductCard key={item._id || item.slug} product={item} mode="compact" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ProductDetailPage;
