import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CategoryHeroBanner from '../components/CategoryHeroBanner.jsx';
import ProductFilterSidebar from '../components/ProductFilterSidebar.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductSortBar from '../components/ProductSortBar.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { getCategoryBannerConfig } from '../utils/categoryBanners.js';
import { priceRangeOptions } from '../utils/productFilters.js';
import { useCart } from '../hooks/useCart.js';
import { getCategories, getProducts } from '../services/api.js';

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 12 });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { addToCart, isSyncing } = useCart();

  const currentPage = Number(searchParams.get('page') || 1);
  const selectedCategory = searchParams.get('category') || '';
  const selectedSort = searchParams.get('sort') || 'newest';
  const query = searchParams.get('q') || '';
  const selectedPriceRange = searchParams.get('priceRange') || '';
  const selectedMaterials = useMemo(
    () =>
      (searchParams.get('material') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [searchParams]
  );

  const activePriceRange = useMemo(
    () => priceRangeOptions.find((option) => option.id === selectedPriceRange) || null,
    [selectedPriceRange]
  );

  const minPrice = activePriceRange?.min || '';
  const maxPrice = activePriceRange?.max || '';

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await getCategories();
        if (isMounted) {
          setCategories(response.categories || []);
        }
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setErrorMessage('');

        const response = await getProducts({
          page: currentPage,
          limit: 12,
          sort: selectedSort,
          q: query || undefined,
          category: selectedCategory || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          material: selectedMaterials.length > 0 ? selectedMaterials.join(',') : undefined
        });

        if (!isMounted) {
          return;
        }

        setProducts(response.products || []);
        setPagination(response.pagination || { page: 1, totalPages: 1, total: 0, limit: 12 });
      } catch {
        if (!isMounted) {
          return;
        }

        setProducts([]);
        setPagination({ page: 1, totalPages: 1, total: 0, limit: 12 });
        setErrorMessage('Không thể tải danh sách sản phẩm. Hãy kiểm tra backend hoặc kết nối API.');
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [currentPage, maxPrice, minPrice, query, selectedCategory, selectedMaterials, selectedSort]);

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timeout = globalThis.setTimeout(() => setFeedbackMessage(''), 2200);
    return () => globalThis.clearTimeout(timeout);
  }, [feedbackMessage]);

  const selectedCategoryInfo = useMemo(
    () => categories.find((item) => item.slug === selectedCategory) || null,
    [categories, selectedCategory]
  );

  const categoryPresentation = useMemo(
    () => getCategoryBannerConfig(selectedCategory, selectedCategoryInfo?.name || ''),
    [selectedCategory, selectedCategoryInfo]
  );

  function updateParams(nextValues) {
    updateParamsWithOptions(nextValues);
  }

  function updateParamsWithOptions(nextValues, navigateOptions = {}) {
    const nextParams = new globalThis.URLSearchParams(searchParams);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams, navigateOptions);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateParams({
      q: searchInput.trim() || null,
      page: 1
    });
  }

  function handleSortChange(value) {
    updateParams({
      sort: value || 'newest',
      page: 1
    });
  }

  function handleSelectPriceRange(rangeId) {
    updateParamsWithOptions({
      priceRange: rangeId || null,
      page: 1
    }, { replace: true, state: { preserveScroll: true } });
  }

  function handleToggleMaterial(material) {
    const nextMaterials = selectedMaterials.includes(material)
      ? selectedMaterials.filter((item) => item !== material)
      : [...selectedMaterials, material];

    updateParamsWithOptions({
      material: nextMaterials.length > 0 ? nextMaterials.join(',') : null,
      page: 1
    }, { replace: true, state: { preserveScroll: true } });
  }

  function handleResetFilters() {
    setSearchInput('');
    setSearchParams(
      new globalThis.URLSearchParams({
        sort: 'newest',
        ...(selectedCategory ? { category: selectedCategory } : {})
      }),
      { replace: true, state: { preserveScroll: true } }
    );
  }

  async function handleAddToCart(product) {
    try {
      await addToCart(product, 1);
      setFeedbackMessage(`Đã thêm "${product.name}" vào giỏ hàng.`);
    } catch (error) {
      setFeedbackMessage(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
    }
  }

  return (
    <section className="container-page py-8 sm:py-10 lg:py-12">
      <CategoryHeroBanner categorySlug={selectedCategory} categoryName={selectedCategoryInfo?.name || ''} />

      <div className="surface-soft overflow-hidden p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
        <SectionHeader
          eyebrow={selectedCategoryInfo?.name ? 'Danh mục' : 'Bộ sưu tập'}
          title={categoryPresentation.title}
          description={categoryPresentation.description}
          align="start"
        />
      </div>

      {feedbackMessage ? (
        <div className={`mt-6 ${feedbackMessage.startsWith('Đã thêm') ? 'state-success' : 'state-error'}`}>
          {feedbackMessage}
        </div>
      ) : null}

      <div className="mt-8">
        <ProductSortBar
          total={loadingProducts ? 0 : pagination.total || 0}
          selectedSort={selectedSort}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onSortChange={handleSortChange}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          onResetFilters={handleResetFilters}
        />
      </div>

      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="surface-card sticky top-24 p-6">
            <ProductFilterSidebar
              selectedMaterials={selectedMaterials}
              selectedPriceRange={selectedPriceRange}
              onToggleMaterial={handleToggleMaterial}
              onSelectPriceRange={handleSelectPriceRange}
              onResetFilters={handleResetFilters}
            />
          </div>
        </aside>

        <div className="min-w-0">
          {mobileFiltersOpen ? (
            <div className="fixed inset-0 z-50 xl:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-navy/45 backdrop-blur-[1px]"
                aria-label="Đóng bộ lọc"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_-20px_60px_rgba(15,23,42,0.18)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-[2rem] leading-none text-navy">Bộ lọc sản phẩm</h3>
                  <button type="button" className="btn-ghost" onClick={() => setMobileFiltersOpen(false)}>
                    Đóng
                  </button>
                </div>
                <ProductFilterSidebar
                  selectedMaterials={selectedMaterials}
                  selectedPriceRange={selectedPriceRange}
                  onToggleMaterial={handleToggleMaterial}
                  onSelectPriceRange={handleSelectPriceRange}
                  onResetFilters={handleResetFilters}
                />
              </div>
            </div>
          ) : null}

          {!loadingProducts && errorMessage ? <div className="state-error">{errorMessage}</div> : null}

          {loadingProducts ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="surface-card overflow-hidden">
                  <div className="h-[320px] animate-pulse bg-slate-100" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                    <div className="h-12 w-full animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!loadingProducts && !errorMessage && products.length === 0 ? (
            <div className="state-empty">
              <h3 className="font-display text-[2.4rem] leading-none text-navy">Không tìm thấy sản phẩm phù hợp</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Hãy thử thay đổi từ khóa, chất liệu hoặc khoảng giá để mở rộng kết quả.
              </p>
            </div>
          ) : null}

          {!loadingProducts && !errorMessage && products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product._id || product.slug}
                    product={product}
                    onAddToCart={handleAddToCart}
                    isSyncing={isSyncing}
                  />
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 rounded-[28px] border border-[#ebe4d8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Trang <span className="font-semibold text-navy">{pagination.page}</span> trên{' '}
                  <span className="font-semibold text-navy">{pagination.totalPages}</span>
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => updateParams({ page: Math.max(1, pagination.page - 1) })}
                    className="btn-outline px-4 py-2.5 disabled:opacity-40"
                  >
                    Trang trước
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
                    .slice(Math.max(0, pagination.page - 3), Math.max(0, pagination.page - 3) + 5)
                    .map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => updateParams({ page: pageNumber })}
                        className={`h-11 min-w-11 rounded-full px-3 text-sm font-semibold transition ${
                          pageNumber === pagination.page
                            ? 'bg-navy text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                            : 'border border-[#ddd4c5] text-navy hover:border-gold hover:bg-[#fff8eb]'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => updateParams({ page: Math.min(pagination.totalPages, pagination.page + 1) })}
                    className="btn-outline px-4 py-2.5 disabled:opacity-40"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default ProductsPage;
