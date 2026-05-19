/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import { getPublicAssetUrl } from '../../services/api.js';
import { normalizeSection } from '../../utils/homeSections.js';
import { IMAGE_ASPECT_CLASSES } from '../../utils/media.js';

function ImageTextBlockSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const mediaItem = normalizedSection.items[0];

  if (!normalizedSection.title && !normalizedSection.description && !mediaItem?.image) {
    return null;
  }

  const imageFirst = normalizedSection.settings.layout !== 'imageRight';

  return (
    <section className="container-page section-shell">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div className={imageFirst ? 'lg:order-1' : 'lg:order-2'}>
          <div className="overflow-hidden rounded-[34px] border border-[#ebe4d8] bg-[#f8f4ea] shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            {mediaItem?.image && (mediaItem.image.startsWith('/') || mediaItem.image.startsWith('http')) ? (
              <img src={getPublicAssetUrl(mediaItem.image)} alt={mediaItem.title || normalizedSection.title} className={`${IMAGE_ASPECT_CLASSES.square} h-full w-full object-cover object-center`} />
            ) : (
              <div className={`${IMAGE_ASPECT_CLASSES.square} bg-[linear-gradient(135deg,_#fffdf8_0%,_#f5ecda_55%,_#ece7df_100%)]`} />
            )}
          </div>
        </div>

        <article className={imageFirst ? 'lg:order-2' : 'lg:order-1'}>
          <p className="eyebrow">Bộ sưu tập</p>
          <h2 className="mt-4 font-display text-[2.5rem] leading-none text-navy sm:text-[2.9rem]">{normalizedSection.title}</h2>
          {normalizedSection.subtitle ? <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-gold">{normalizedSection.subtitle}</p> : null}
          <p className="mt-5 max-w-xl text-sm leading-8 text-slate-600">{normalizedSection.description || mediaItem?.description}</p>
          {normalizedSection.buttonLabel ? (
            <div className="mt-8">
              <Link to={normalizedSection.buttonLink || mediaItem?.link || '/products'} className="btn-secondary">
                {normalizedSection.buttonLabel}
              </Link>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export default ImageTextBlockSection;
