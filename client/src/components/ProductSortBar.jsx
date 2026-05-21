/* eslint-disable react/prop-types */
const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'best_selling', label: 'Bán chạy' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'price_asc', label: 'Giá tăng dần' }
];

function ProductSortBar({
  total = 0,
  selectedSort = 'newest',
  searchInput = '',
  onSearchInputChange,
  onSearchSubmit,
  onSortChange,
  onOpenFilters,
  onToggleDesktopFilters,
  desktopFiltersOpen = true,
  onResetFilters
}) {
  return (
    <div className="rounded-[22px] border border-[#ebe4d8] bg-white p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:rounded-[26px] sm:p-5 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
        <div className="flex min-w-[220px] flex-col gap-3 xl:min-w-[300px]">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-navy">{total}</span> sản phẩm
          </p>
          <button
            type="button"
            className="btn-outline hidden w-fit whitespace-nowrap px-4 py-2.5 text-sm xl:inline-flex"
            onClick={onToggleDesktopFilters}
          >
            {desktopFiltersOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
          <form onSubmit={onSearchSubmit} className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#ddd4c5] bg-[#fcfaf5] px-3 py-2 lg:max-w-[430px] lg:px-4 lg:py-2.5 xl:max-w-[460px]">
            <span className="text-slate-400">⌕</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Tìm kiếm sản phẩm trong danh mục..."
              className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            />
          </form>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:shrink-0">
            <select
              value={selectedSort}
              onChange={(event) => onSortChange(event.target.value)}
              className="select-field min-w-0 bg-white py-2.5 sm:min-w-[190px] lg:min-w-[220px]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <button type="button" className="btn-outline px-4 py-2.5 xl:hidden" onClick={onOpenFilters}>
                Bộ lọc
              </button>
              <button type="button" className="btn-ghost px-4 py-2.5" onClick={onResetFilters}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductSortBar;
