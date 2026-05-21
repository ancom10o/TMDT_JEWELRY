/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import { getPublicAssetUrl } from '../../services/api.js';
import { normalizeSection } from '../../utils/homeSections.js';
import { IMAGE_ASPECT_CLASSES } from '../../utils/media.js';

function PromoBannerSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const banner = normalizedSection.banners.find(Boolean);
  const title = banner?.title || normalizedSection.title;
  const subtitle = banner?.subtitle || normalizedSection.subtitle;
  const buttonLabel = banner?.buttonLabel || normalizedSection.buttonLabel;
  const buttonLink = banner?.buttonLink || normalizedSection.buttonLink || '/products';

  if (!banner && !title) {
    return null;
  }

  return (
    <section className="container-page section-shell">
      <article className={`relative overflow-hidden rounded-[24px] border border-[#ead8aa] bg-navy shadow-[0_24px_70px_rgba(15,23,42,0.14)] lg:rounded-[34px] ${IMAGE_ASPECT_CLASSES.heroMobile} ${IMAGE_ASPECT_CLASSES.heroDesktop}`}>
        {banner?.imageUrl ? (
          <>
            <picture className="absolute inset-0">
              {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={getPublicAssetUrl(banner.mobileImageUrl)} /> : null}
              <img src={getPublicAssetUrl(banner.imageUrl)} alt={banner.name} className="h-full w-full object-cover object-center" />
            </picture>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.68)_0%,rgba(15,23,42,0.32)_52%,rgba(15,23,42,0.34)_100%)] lg:bg-[linear-gradient(90deg,rgba(15,23,42,0.76)_0%,rgba(15,23,42,0.34)_45%,rgba(15,23,42,0.4)_100%)]" />
          </>
        ) : null}
        <div className="relative flex h-full items-center p-4 sm:p-6 lg:p-12">
          <div className="max-w-[620px] rounded-[22px] border border-white/12 bg-navy/32 p-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-[3px] sm:p-5 lg:rounded-[28px] lg:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#f3d77b]">Ưu đãi</p>
            <h2 className="mt-2 max-w-[15ch] font-display text-[1.65rem] leading-tight text-white sm:text-[2.2rem] lg:mt-3 lg:text-[3.25rem] lg:leading-[0.95]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-3 line-clamp-3 max-w-xl text-sm font-medium leading-6 text-slate-100 sm:text-[15px] lg:mt-4 lg:line-clamp-none lg:leading-7">
                {subtitle}
              </p>
            ) : null}
            {buttonLabel ? (
              <div className="mt-4 lg:mt-6">
                <Link to={buttonLink} className="btn-secondary px-4 py-2.5 text-sm lg:px-6 lg:py-3">
                  {buttonLabel}
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
