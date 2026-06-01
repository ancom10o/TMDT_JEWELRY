/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../SectionHeader.jsx';
import { getPublicAssetUrl } from '../../services/api.js';
import { IMAGE_ASPECT_CLASSES } from '../../utils/media.js';
import { clampColumns, normalizeSection } from '../../utils/homeSections.js';

const AUTOPLAY_DELAY_MS = 3500;

function getVisibleCount() {
  const browserWindow = globalThis.window;

  if (!browserWindow) {
    return 3;
  }

  if (browserWindow.innerWidth >= 1024) {
    return 3;
  }

  if (browserWindow.innerWidth >= 640) {
    return 2;
  }

  return 1;
}

function CollectionCardsSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const items = normalizedSection.items;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);

  const columns = Math.min(clampColumns(normalizedSection.settings.columns, 3), 3);
  const slidesPerView = Math.min(columns, visibleCount);
  const cardAspectClass = normalizedSection.settings.variant === 'editorial' ? IMAGE_ASPECT_CLASSES.editorialCard : IMAGE_ASPECT_CLASSES.square;
  const shouldSlide = items.length > 3;
  const maxIndex = shouldSlide ? items.length : 0;
  const displayItems = shouldSlide ? Array.from({ length: items.length + slidesPerView }, (_, index) => items[index % items.length]) : items;
  const translateX = activeIndex * (100 / slidesPerView);
  const slideBasis = `${100 / slidesPerView}%`;

  useEffect(() => {
    const browserWindow = globalThis.window;

    if (!browserWindow) {
      return undefined;
    }

    function handleResize() {
      setVisibleCount(getVisibleCount());
    }

    handleResize();
    browserWindow.addEventListener('resize', handleResize);

    return () => {
      browserWindow.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    setActiveIndex((currentIndex) => Math.min(currentIndex, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (!shouldSlide) {
      return undefined;
    }

    const timer = globalThis.setInterval(() => {
      setIsTransitionEnabled(true);
      setActiveIndex((currentIndex) => (currentIndex >= maxIndex ? 1 : currentIndex + 1));
    }, AUTOPLAY_DELAY_MS);

    return () => {
      globalThis.clearInterval(timer);
    };
  }, [maxIndex, shouldSlide]);

  function handleTransitionEnd() {
    if (!shouldSlide || activeIndex !== maxIndex) {
      return;
    }

    const browserWindow = globalThis.window;
    setIsTransitionEnabled(false);
    setActiveIndex(0);

    browserWindow?.requestAnimationFrame(() => {
      browserWindow.requestAnimationFrame(() => {
        setIsTransitionEnabled(true);
      });
    });
  }

  function renderCollectionCard(item, index) {
    const cardContent = (
      <>
        {item.image && (item.image.startsWith('/') || item.image.startsWith('http')) ? (
          <div className={`${cardAspectClass} overflow-hidden`}>
            <img src={getPublicAssetUrl(item.image)} alt={item.title} className="h-full w-full object-cover object-center transition duration-500 hover:scale-[1.03]" />
          </div>
        ) : (
          <div className={`${cardAspectClass} bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.24),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f5ecda_55%,_#ece7df_100%)]`} />
        )}
        <div className="p-3.5 sm:p-4 lg:p-5">
          {item.badge || item.subtitle ? <p className="eyebrow">{item.badge || item.subtitle}</p> : null}
          <h3 className="mt-2 line-clamp-2 font-display text-[1.35rem] leading-tight text-navy sm:text-[1.55rem] lg:mt-2.5 lg:text-[1.75rem] lg:leading-[0.98]">{item.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
          {item.link ? (
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy transition group-hover:text-gold">
              Khám phá ngay
              <span aria-hidden="true">&rarr;</span>
            </span>
          ) : null}
        </div>
      </>
    );
    const cardClassName = 'group h-full overflow-hidden rounded-[22px] border border-[#ebe4d8] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.045)] lg:rounded-[28px]';

    return item.link ? (
      <Link
        key={`${item.title}-${index}`}
        to={item.link}
        className={`${cardClassName} block transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)]`}
      >
        {cardContent}
      </Link>
    ) : (
      <article key={`${item.title}-${index}`} className={cardClassName}>
        {cardContent}
      </article>
    );
  }

  if (!items.length) {
    return null;
  }

  return (
    <section className="container-page section-shell">
      <SectionHeader
        eyebrow="Bộ sưu tập"
        title={normalizedSection.title}
        description={normalizedSection.subtitle}
        actionLabel={normalizedSection.buttonLabel}
        actionTo={normalizedSection.buttonLink}
      />

      {!shouldSlide ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:mt-6 lg:grid-cols-3 lg:gap-5">
          {items.map((item, index) => renderCollectionCard(item, index))}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden lg:mt-6">
          <div
            className={`flex ${isTransitionEnabled ? 'transition-transform duration-700 ease-out' : ''}`}
            style={{ transform: `translate3d(-${translateX}%, 0, 0)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {displayItems.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="shrink-0 px-2"
                style={{ flexBasis: slideBasis, minWidth: slideBasis }}
              >
                {renderCollectionCard(item, index)}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default CollectionCardsSection;
