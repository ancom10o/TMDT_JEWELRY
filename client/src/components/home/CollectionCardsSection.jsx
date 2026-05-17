/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import SectionHeader from '../SectionHeader.jsx';
import { getPublicAssetUrl } from '../../services/api.js';
import { IMAGE_ASPECT_CLASSES } from '../../utils/media.js';
import { clampColumns, normalizeSection } from '../../utils/homeSections.js';

const columnClassMap = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4'
};

function CollectionCardsSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const items = normalizedSection.items;

  if (!items.length) {
    return null;
  }

  const columns = clampColumns(normalizedSection.settings.columns, 3);
  const cardAspectClass = normalizedSection.settings.variant === 'editorial' ? IMAGE_ASPECT_CLASSES.editorialCard : IMAGE_ASPECT_CLASSES.square;

  return (
    <section className="container-page section-shell">
      <SectionHeader
        eyebrow="Bo suu tap"
        title={normalizedSection.title}
        description={normalizedSection.subtitle}
        actionLabel={normalizedSection.buttonLabel}
        actionTo={normalizedSection.buttonLink}
      />

      <div className={`mt-6 grid gap-5 sm:grid-cols-2 ${columnClassMap[columns]}`}>
        {items.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className="overflow-hidden rounded-[28px] border border-[#ebe4d8] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.045)]"
          >
            {item.image && (item.image.startsWith('/') || item.image.startsWith('http')) ? (
              <div className={`${cardAspectClass} overflow-hidden`}>
                <img src={getPublicAssetUrl(item.image)} alt={item.title} className="h-full w-full object-cover object-center transition duration-500 hover:scale-[1.03]" />
              </div>
            ) : (
              <div className={`${cardAspectClass} bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.24),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f5ecda_55%,_#ece7df_100%)]`} />
            )}
            <div className="p-4 sm:p-5">
              {item.badge || item.subtitle ? <p className="eyebrow">{item.badge || item.subtitle}</p> : null}
              <h3 className="mt-2.5 line-clamp-2 font-display text-[1.75rem] leading-[0.98] text-navy">{item.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
              {item.link ? (
                <Link to={item.link} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy transition hover:text-gold">
                  Kham pha
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CollectionCardsSection;
