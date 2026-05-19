/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { getCategoryBannerConfig } from '../utils/categoryBanners.js';
import { getPublicAssetUrl } from '../services/api.js';

function CategoryHeroBanner({ categorySlug = '', categoryName = '', categoryImage = '' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const bannerConfig = useMemo(() => getCategoryBannerConfig(categorySlug, categoryName), [categoryName, categorySlug]);
  const hasCategoryBanner = Boolean(categoryImage);
  const shouldShowDefaultOverlay = !hasCategoryBanner && Boolean(categorySlug);
  const bannerImage = getPublicAssetUrl(hasCategoryBanner ? categoryImage : bannerConfig.image);

  useEffect(() => {
    setImageFailed(false);
  }, [bannerImage]);

  return (
    <section className="mb-8 overflow-hidden rounded-[30px] border border-[#dfe7f0] bg-white shadow-[0_22px_70px_rgba(15,23,42,0.07)]">
      <div className="relative aspect-[8/3] overflow-hidden bg-[#f8fafc]">
        {!imageFailed ? (
          <img
            src={bannerImage}
            alt={bannerConfig.title}
            className="h-full w-full object-cover object-center"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(120deg,_#edf3f8_0%,_#ffffff_35%,_#e5edf6_100%)]" />
        )}

        {shouldShowDefaultOverlay ? (
          <>
            <div className={`absolute inset-0 bg-gradient-to-r ${bannerConfig.overlay}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,_rgba(255,255,255,0.58),_transparent_18%),radial-gradient(circle_at_78%_28%,_rgba(255,255,255,0.22),_transparent_15%)]" />

            <div className="absolute inset-x-5 bottom-5 top-5 flex max-w-[560px] flex-col justify-end rounded-[24px] border border-white/55 bg-white/36 p-5 backdrop-blur-[2px] sm:inset-x-6 sm:bottom-6 sm:top-6 sm:p-6 lg:left-8 lg:right-auto lg:w-[540px] lg:p-8">
              <p className="eyebrow">Bộ sưu tập</p>
              <h1 className="mt-3 font-display text-[2rem] leading-[0.95] text-navy sm:text-[2.5rem] lg:text-[3rem]">
                {bannerConfig.title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-[15px]">{bannerConfig.description}</p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default CategoryHeroBanner;
