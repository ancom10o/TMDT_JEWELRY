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
  onResetFilters
}) {
  return (
    <div className="rounded-[26px] border border-[#ebe4d8] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-navy">{total}</span> sản phẩm
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form onSubmit={onSearchSubmit} className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#ddd4c5] bg-[#fcfaf5] px-4 py-2.5 lg:min-w-[300px]">
            <span className="text-slate-400">⌕</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Tìm kiếm nhanh trong danh mục..."
              className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            />
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedSort}
              onChange={(event) => onSortChange(event.target.value)}
              className="select-field min-w-[190px] bg-white py-2.5"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button type="button" className="btn-outline xl:hidden" onClick={onOpenFilters}>
                Bộ lọc
              </button>
              <button type="button" className="btn-ghost" onClick={onResetFilters}>
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
