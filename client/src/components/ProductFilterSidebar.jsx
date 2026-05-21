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
  onSelectPriceRange
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Bộ lọc</p>
          <h3 className="mt-2 font-display text-[1.1rem] leading-snug text-navy lg:text-[1.45rem]">
  Chọn theo nhu cầu
</h3>
        </div>

        {/* <button
          type="button"
          onClick={onResetFilters}
          className="btn-ghost"
        >
          Làm mới
        </button> */}
      </div>

      <div className="space-y-6 border-t border-[#efe8dc] pt-5">
        {/* DANH MỤC */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Danh mục
          </h4>

          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="w-full rounded-[18px] border border-[#ddd4c5] bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
          >
            <option value="">Tất cả danh mục</option>

            {categories.map((category) => (
              <option
                key={category._id || category.slug}
                value={category.slug}
              >
                {category.name}
              </option>
            ))}
          </select>
        </section>

        {/* GIỚI TÍNH */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Giới tính
          </h4>

          <div className="flex flex-wrap gap-2">
            {genderOptions.map((option) => {
              const isActive = selectedGender === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onSelectGender(isActive ? '' : option.value)
                  }
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

        {/* CHẤT LIỆU */}
        <MaterialFilter
          selectedMaterialGroup={selectedMaterialGroup}
          onSelectMaterialGroup={onSelectMaterialGroup}
        />

        {/* GIÁ */}
        <PriceRangeOptions
          selectedRange={selectedPriceRange}
          onSelectRange={onSelectPriceRange}
        />
      </div>
    </div>
  );
}

export default ProductFilterSidebar;
