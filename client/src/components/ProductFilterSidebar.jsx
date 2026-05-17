/* eslint-disable react/prop-types */
import MaterialFilter from './MaterialFilter.jsx';
import PriceRangeOptions from './PriceRangeOptions.jsx';
import { genderOptions } from '../utils/productFilters.js';

function ProductFilterSidebar({
  categories = [],
  selectedCategory = '',
  selectedGender = '',
  selectedMaterialGroup = '',
  selectedPriceRange = '',
  onSelectCategory,
  onSelectGender,
  onSelectMaterialGroup,
  onSelectPriceRange,
  onResetFilters
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Bộ lọc</p>
          <h3 className="mt-2 font-display text-[2rem] leading-none text-navy">Chọn theo nhu cầu</h3>
        </div>
        <button type="button" onClick={onResetFilters} className="btn-ghost">
          Làm mới
        </button>
      </div>

      <div className="space-y-6 border-t border-[#efe8dc] pt-5">
        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Danh mục</h4>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className={`rounded-[18px] border px-4 py-3 text-left text-sm font-medium transition ${
                !selectedCategory ? 'border-gold bg-[#fff8eb] text-navy' : 'border-[#ddd4c5] bg-white text-slate-600 hover:border-gold hover:text-navy'
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map((category) => {
              const isActive = selectedCategory === category.slug;

              return (
                <button
                  key={category._id || category.slug}
                  type="button"
                  onClick={() => onSelectCategory(isActive ? '' : category.slug)}
                  className={`rounded-[18px] border px-4 py-3 text-left text-sm font-medium transition ${
                    isActive ? 'border-gold bg-[#fff8eb] text-navy' : 'border-[#ddd4c5] bg-white text-slate-600 hover:border-gold hover:text-navy'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Giới tính</h4>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((option) => {
              const isActive = selectedGender === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelectGender(isActive ? '' : option.value)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'border-gold bg-[#fff8eb] text-navy shadow-[0_10px_22px_rgba(212,175,55,0.14)]'
                      : 'border-[#ddd4c5] bg-white text-slate-600 hover:border-gold hover:text-navy'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        <MaterialFilter selectedMaterialGroup={selectedMaterialGroup} onSelectMaterialGroup={onSelectMaterialGroup} />
        <PriceRangeOptions selectedRange={selectedPriceRange} onSelectRange={onSelectPriceRange} />
      </div>
    </div>
  );
}

export default ProductFilterSidebar;
