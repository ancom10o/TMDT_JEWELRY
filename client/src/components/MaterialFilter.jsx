/* eslint-disable react/prop-types */
import { materialGroupOptions } from '../utils/productFilters.js';

function MaterialFilter({ selectedMaterialGroup = '', onSelectMaterialGroup }) {
  return (
    <section className="space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Nhóm chất liệu</h4>
      <div className="flex flex-wrap gap-2">
        {materialGroupOptions.map((option) => {
          const isActive = selectedMaterialGroup === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectMaterialGroup(isActive ? '' : option.value)}
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
  );
}

export default MaterialFilter;
