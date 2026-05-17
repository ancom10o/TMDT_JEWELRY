/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import { getPublicAssetUrl } from '../../services/api.js';
import { normalizeSection } from '../../utils/homeSections.js';
import { IMAGE_ASPECT_CLASSES } from '../../utils/media.js';

function PromoBannerSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const banner = normalizedSection.banners.find(Boolean);

  if (!banner && !normalizedSection.title) {
    return null;
  }

  return (
    <section className="container-page section-shell">
      <article className={`relative overflow-hidden rounded-[34px] border border-[#ead8aa] bg-navy shadow-[0_24px_70px_rgba(15,23,42,0.14)] ${IMAGE_ASPECT_CLASSES.heroMobile} ${IMAGE_ASPECT_CLASSES.heroDesktop}`}>
        {banner?.imageUrl ? (
          <>
            <picture className="absolute inset-0">
              {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={getPublicAssetUrl(banner.mobileImageUrl)} /> : null}
              <img src={getPublicAssetUrl(banner.imageUrl)} alt={banner.name} className="h-full w-full object-cover object-center" />
            </picture>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.76)_0%,rgba(15,23,42,0.34)_45%,rgba(15,23,42,0.4)_100%)]" />
          </>
        ) : null}
        <div className="relative flex h-full items-center p-8 sm:p-10 lg:p-12">
          <div className="flex min-h-[240px] max-w-2xl flex-col">
            <p className="eyebrow text-[#f3d77b]">Uu dai</p>
            <h2 className="mt-4 min-h-[96px] max-w-2xl font-display text-[2.5rem] leading-none text-white sm:min-h-[120px] sm:text-[3rem]">
              {normalizedSection.title || banner?.title}
            </h2>
            <p className="mt-5 min-h-[96px] max-w-2xl text-sm leading-8 text-slate-100">
              {normalizedSection.subtitle || banner?.subtitle}
            </p>
            {(normalizedSection.buttonLabel || banner?.buttonLabel) ? (
              <div className="mt-auto pt-8">
                <Link to={normalizedSection.buttonLink || banner?.buttonLink || '/products'} className="btn-secondary">
                  {normalizedSection.buttonLabel || banner?.buttonLabel}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </section>
  );
}

export default PromoBannerSection;
