/* eslint-disable react/prop-types */
import { formatCurrency } from '../utils/format.js';

function PriceDisplay({ price, originalPrice, oldPrice, size = 'md', align = 'start' }) {
  const comparePrice = originalPrice ?? oldPrice;
  const currentClassMap = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  const oldClassMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-wrap items-end gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
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
