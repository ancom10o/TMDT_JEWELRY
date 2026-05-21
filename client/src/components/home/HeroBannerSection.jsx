/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicAssetUrl } from '../../services/api.js';
import { normalizeSection } from '../../utils/homeSections.js';
import { IMAGE_ASPECT_CLASSES } from '../../utils/media.js';

function HeroBannerSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const banners = normalizedSection.banners.filter((banner) => banner?.isActive !== false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!normalizedSection.settings.autoplay || banners.length <= 1) {
      return undefined;
    }

    const timer = globalThis.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => globalThis.clearInterval(timer);
  }, [banners.length, normalizedSection.settings.autoplay]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedSection._id]);

  if (!banners.length) {
    return null;
  }

  return (
    <section className="px-2.5 pt-2 sm:px-4 sm:pt-3 lg:px-5 xl:px-6">
      <div className="overflow-hidden rounded-[22px] border border-[#dfe7f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:rounded-[26px] lg:rounded-[28px]">
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}>
          {banners.map((banner) => (
            <article key={banner._id || banner.imageUrl} className="w-full flex-none">
              <div className={`relative overflow-hidden ${IMAGE_ASPECT_CLASSES.heroMobile} ${IMAGE_ASPECT_CLASSES.heroDesktop}`}>
                <picture>
                  {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={getPublicAssetUrl(banner.mobileImageUrl)} /> : null}
                  <img src={getPublicAssetUrl(banner.imageUrl)} alt={banner.name} className="h-full w-full object-cover object-center" />
                </picture>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.34)_0%,rgba(15,23,42,0.16)_42%,rgba(15,23,42,0.04)_100%)] lg:bg-[linear-gradient(90deg,rgba(15,23,42,0.4)_0%,rgba(15,23,42,0.18)_34%,rgba(15,23,42,0.05)_62%,rgba(15,23,42,0.02)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 flex items-end px-3 pb-3 sm:px-5 sm:pb-5 md:inset-y-0 md:left-6 md:right-auto md:w-full md:max-w-[460px] md:items-center md:px-0 md:pb-0 lg:left-10 lg:max-w-[560px]">
                  <div className="w-full max-w-[300px] rounded-[18px] border border-white/14 bg-[rgba(255,255,255,0.08)] p-3 text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)] backdrop-blur-[4px] sm:max-w-[360px] sm:p-4 md:max-w-[390px] lg:max-w-[460px] lg:rounded-[22px] lg:p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f3d77b] sm:text-[11px] sm:tracking-[0.24em]">JewelAura</p>
                    <h2 className="mt-2 max-w-[13ch] font-display text-[1.55rem] leading-tight text-white sm:text-[2rem] md:text-[2.25rem] lg:mt-2.5 lg:max-w-[12ch] lg:text-5xl">
                      {banner.title || normalizedSection.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 max-w-[34ch] text-xs leading-5 text-slate-100/95 sm:text-sm sm:leading-6 lg:mt-2.5 lg:max-w-[40ch] lg:text-[15px]">
                      {banner.subtitle || normalizedSection.subtitle}
                    </p>
                    {(banner.buttonLabel || normalizedSection.buttonLabel) ? (
                      <div className="mt-3 sm:mt-4">
                        <Link to={banner.buttonLink || normalizedSection.buttonLink || '/products'} className="btn-secondary h-9 px-4 text-xs shadow-[0_10px_22px_rgba(15,23,42,0.14)] sm:h-10 sm:text-sm lg:h-11 lg:px-6">
                          {banner.buttonLabel || normalizedSection.buttonLabel}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroBannerSection;
