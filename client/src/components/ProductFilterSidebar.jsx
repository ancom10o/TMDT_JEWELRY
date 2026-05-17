/* eslint-disable react/prop-types */
import MaterialFilter from './MaterialFilter.jsx';
import PriceRangeOptions from './PriceRangeOptions.jsx';

function ProductFilterSidebar({
  selectedMaterials = [],
  selectedPriceRange = '',
  onToggleMaterial,
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
        <MaterialFilter selectedMaterials={selectedMaterials} onToggleMaterial={onToggleMaterial} />
        <PriceRangeOptions selectedRange={selectedPriceRange} onSelectRange={onSelectPriceRange} />
      </div>
    </div>
  );
}

export default ProductFilterSidebar;
