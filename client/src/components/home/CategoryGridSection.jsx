/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import ProductCarousel from '../ProductCarousel.jsx';
import SectionHeader from '../SectionHeader.jsx';
import { getPublicAssetUrl } from '../../services/api.js';
import { IMAGE_ASPECT_CLASSES } from '../../utils/media.js';
import { normalizeSection } from '../../utils/homeSections.js';

function CategoryGridSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const items = normalizedSection.items.slice(0, 8);

  if (!items.length) {
    return null;
  }

  const visibleSlides = {
    desktop: Math.min(4, items.length),
    tablet: Math.min(2, items.length),
    mobile: 1
  };

  return (
    <section className="container-page section-shell">
      <SectionHeader
        eyebrow="Danh muc noi bat"
        title={normalizedSection.title}
        description={normalizedSection.subtitle}
        actionLabel={normalizedSection.buttonLabel}
        actionTo={normalizedSection.buttonLink}
      />

      <div className="mt-6">
        <ProductCarousel
          items={items}
          ariaLabel="danh muc"
          visibleSlides={visibleSlides}
          getItemKey={(item, index) => item.link || item.title || index}
          renderItem={(item) => (
          <Link
            to={item.link || '/products'}
            className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#ebe4d8] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
          >
            {item.image && (item.image.startsWith('/') || item.image.startsWith('http')) ? (
              <div className={`${IMAGE_ASPECT_CLASSES.square} max-h-[220px] overflow-hidden rounded-[22px]`}>
                <img src={getPublicAssetUrl(item.image)} alt={item.title} className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]" />
              </div>
            ) : (
              <div
                className={`${IMAGE_ASPECT_CLASSES.square} max-h-[220px] rounded-[22px] ${item.image && item.image.includes('from-') ? `bg-gradient-to-br ${item.image}` : ''}`}
                style={{ background: item.color || (!item.image || !item.image.includes('from-') ? 'linear-gradient(135deg, #f8f4ea 0%, #ffffff 50%, #efe7d3 100%)' : undefined) }}
              />
            )}
            <h3 className="mt-4 min-h-[52px] font-display text-[1.75rem] leading-[0.98] text-navy">{item.title}</h3>
            <p className="mt-2 line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-600">{item.description || item.subtitle}</p>
            <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-navy transition group-hover:text-gold">
              Xem san pham
              <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
          )}
        />
      </div>
    </section>
  );
}

export default CategoryGridSection;
