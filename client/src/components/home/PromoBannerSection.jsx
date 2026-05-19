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
        <div className="relative flex h-full items-center p-6 sm:p-8 lg:p-12">
          <div className="max-w-[620px] rounded-[28px] border border-white/12 bg-navy/32 p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-[3px] sm:p-6 lg:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#f3d77b]">Ưu đãi</p>
            <h2 className="mt-3 max-w-[15ch] font-display text-[2.25rem] leading-[0.95] text-white sm:text-[2.75rem] lg:text-[3.25rem]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-100 sm:text-[15px]">
                {subtitle}
              </p>
            ) : null}
            {buttonLabel ? (
              <div className="mt-6">
                <Link to={buttonLink} className="btn-secondary px-6 py-3">
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
