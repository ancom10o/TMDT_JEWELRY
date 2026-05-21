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
    <section className="mb-5 overflow-hidden rounded-[24px] border border-[#dfe7f0] bg-white shadow-[0_22px_70px_rgba(15,23,42,0.07)] sm:mb-7 lg:mb-8 lg:rounded-[30px]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f8fafc] sm:aspect-[8/3]">
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

            <div className="absolute inset-x-4 bottom-4 top-auto flex max-w-[560px] flex-col justify-end rounded-[20px] border border-white/55 bg-white/36 p-4 backdrop-blur-[2px] sm:inset-x-6 sm:bottom-6 sm:top-6 sm:p-6 lg:left-8 lg:right-auto lg:w-[540px] lg:rounded-[24px] lg:p-8">
              <p className="eyebrow">Bộ sưu tập</p>
              <h1 className="mt-2 font-display text-[1.55rem] leading-tight text-navy sm:text-[2.1rem] lg:mt-3 lg:text-[3rem] lg:leading-[0.95]">
                {bannerConfig.title}
              </h1>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700 sm:mt-3 sm:text-[15px] sm:leading-7 lg:line-clamp-none">{bannerConfig.description}</p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default CategoryHeroBanner;
