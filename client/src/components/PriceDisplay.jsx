/* eslint-disable react/prop-types */
import { formatCurrency } from '../utils/format.js';

function PriceDisplay({ price, originalPrice, oldPrice, size = 'md', align = 'start' }) {
  const comparePrice = originalPrice ?? oldPrice;
  const currentClassMap = {
    sm: 'text-sm sm:text-base lg:text-lg',
    md: 'text-base sm:text-lg lg:text-xl',
    lg: 'text-2xl lg:text-3xl'
  };

  const oldClassMap = {
    sm: 'text-[10px] sm:text-xs',
    md: 'text-xs lg:text-sm',
    lg: 'text-base lg:text-lg'
  };

  return (
    <div className={`flex flex-wrap items-end gap-x-2 gap-y-1 lg:gap-x-3 ${align === 'center' ? 'justify-center' : ''}`}>
      <p className={`${currentClassMap[size] || currentClassMap.md} font-bold text-navy`}>
        {formatCurrency(price)}
      </p>
      {comparePrice > price ? (
        <p className={`${oldClassMap[size] || oldClassMap.md} text-slate-400 line-through`}>
          {formatCurrency(comparePrice)}
        </p>
      ) : null}
    </div>
  );
}

export default PriceDisplay;
