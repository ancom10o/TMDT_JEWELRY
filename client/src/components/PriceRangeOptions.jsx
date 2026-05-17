/* eslint-disable react/prop-types */
import { priceRangeOptions } from '../utils/productFilters.js';

function PriceRangeOptions({ selectedRange = '', onSelectRange }) {
  return (
    <section className="space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Khoảng giá</h4>
      <div className="grid gap-2">
        {priceRangeOptions.map((option) => {
          const isActive = selectedRange === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectRange(isActive ? '' : option.id)}
              className={`rounded-[18px] border px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? 'border-gold bg-[#fff8eb] text-navy'
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

export default PriceRangeOptions;
