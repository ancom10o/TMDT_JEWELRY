/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from './ProductCard.jsx';

const AUTOPLAY_DELAY = 4500;
const DRAG_THRESHOLD = 6;
const RECENT_DRAG_RESET_DELAY = 40;

function getSlidesPerView(width, visibleSlides = {}) {
  if (width >= 1024) {
    return visibleSlides.desktop || 4;
  }

  if (width >= 640) {
    return visibleSlides.tablet || 2;
  }

  return visibleSlides.mobile || 1;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isInteractiveElement(target) {
  return Boolean(target?.closest?.('a, button, input, select, textarea'));
}

function ProductCarousel({
  products = [],
  mode = 'listing',
  items,
  renderItem,
  getItemKey,
  visibleSlides = { desktop: 4, tablet: 2, mobile: 1 },
  ariaLabel = 'carousel'
}) {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;
  const resolvedItems = Array.isArray(items) ? items : products;
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const recentDragTimeoutRef = useRef(null);
  const startXRef = useRef(0);
  const startTranslateRef = useRef(0);
  const currentTranslateRef = useRef(0);
  const isDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerIdRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(() => {
    if (!browserWindow) {
      return visibleSlides.mobile || 1;
    }

    return getSlidesPerView(browserWindow.innerWidth, visibleSlides);
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(resolvedItems.length - slidesPerView + 1)), [resolvedItems.length, slidesPerView]);

  const syncTranslate = useCallback((nextActiveIndex = activeIndex, nextSlidesPerView = slidesPerView) => {
    const sliderWidth = rootRef.current?.offsetWidth || 0;
    const nextTranslate = sliderWidth > 0 ? -(sliderWidth / nextSlidesPerView) * nextActiveIndex : 0;
    currentTranslateRef.current = nextTranslate;
    setTranslateX(nextTranslate);
  }, [activeIndex, slidesPerView]);

  useEffect(() => {
    if (!browserWindow) {
      return undefined;
    }

    function handleResize() {
      const nextSlidesPerView = getSlidesPerView(browserWindow.innerWidth, visibleSlides);

      setSlidesPerView((current) => {
        if (current !== nextSlidesPerView) {
          setActiveIndex(0);
          currentTranslateRef.current = 0;
          setTranslateX(0);
        }

        return nextSlidesPerView;
      });
    }

    handleResize();
    browserWindow.addEventListener('resize', handleResize);

    return () => {
      browserWindow.removeEventListener('resize', handleResize);
    };
  }, [browserWindow, visibleSlides]);

  useEffect(() => {
    if (!browserWindow || !rootRef.current || typeof browserWindow.ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new browserWindow.ResizeObserver(() => {
      if (!isPointerDown) {
        syncTranslate();
      }
    });

    resizeObserver.observe(rootRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [browserWindow, isPointerDown, syncTranslate]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    if (!rootRef.current || isPointerDown) {
      return;
    }

    syncTranslate();
  }, [activeIndex, isPointerDown, slidesPerView, syncTranslate]);

  useEffect(() => {
    if (!browserWindow || isHovered || isPointerDown || resolvedItems.length <= slidesPerView) {
      return undefined;
    }

    const timer = browserWindow.setInterval(() => {
      setActiveIndex((current) => (current + 1) % totalPages);
    }, AUTOPLAY_DELAY);

    return () => {
      browserWindow.clearInterval(timer);
    };
  }, [browserWindow, isHovered, isPointerDown, resolvedItems.length, slidesPerView, totalPages]);

  useEffect(() => {
    return () => {
      if (recentDragTimeoutRef.current) {
        globalThis.clearTimeout(recentDragTimeoutRef.current);
      }
    };
  }, []);

  function resetRecentDragFlag() {
    if (recentDragTimeoutRef.current) {
      globalThis.clearTimeout(recentDragTimeoutRef.current);
    }

    recentDragTimeoutRef.current = globalThis.setTimeout(() => {
      suppressClickRef.current = false;
    }, RECENT_DRAG_RESET_DELAY);
  }

  function getMetrics() {
    const sliderWidth = rootRef.current?.offsetWidth || 0;
    const itemWidth = sliderWidth > 0 ? sliderWidth / slidesPerView : 1;
    const maxTranslate = 0;
    const minTranslate = -Math.max(0, resolvedItems.length - slidesPerView) * itemWidth;

    return { itemWidth, minTranslate, maxTranslate };
  }

  function handlePrev() {
    setActiveIndex((current) => (current - 1 + totalPages) % totalPages);
  }

  function handleNext() {
    setActiveIndex((current) => (current + 1) % totalPages);
  }

  function handlePointerDown(event) {
    suppressClickRef.current = false;

    if (isInteractiveElement(event.target)) {
      return;
    }

    if (resolvedItems.length <= 1) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startXRef.current = event.clientX;
    startTranslateRef.current = currentTranslateRef.current;
    isDraggingRef.current = false;
    setIsPointerDown(true);
    setIsDragging(false);
  }

  function handlePointerMove(event) {
    if (!isPointerDown || pointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - startXRef.current;

    if (!isDraggingRef.current && Math.abs(deltaX) > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
      setIsDragging(true);
      suppressClickRef.current = true;
    }

    if (!isDraggingRef.current) {
      return;
    }

    const { minTranslate, maxTranslate } = getMetrics();
    const nextTranslate = clamp(startTranslateRef.current + deltaX, minTranslate, maxTranslate);
    currentTranslateRef.current = nextTranslate;
    setTranslateX(nextTranslate);
  }

  function handlePointerEnd(event) {
    if (!isPointerDown || pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const deltaX = event.clientX - startXRef.current;
    const { itemWidth } = getMetrics();
    const dragDistance = startTranslateRef.current - currentTranslateRef.current;
    let nextIndex = activeIndex;

    if (isDraggingRef.current) {
      const movedSlides = Math.round(dragDistance / itemWidth);
      nextIndex = clamp(activeIndex + movedSlides, 0, totalPages - 1);
      suppressClickRef.current = true;
      resetRecentDragFlag();
    }

    pointerIdRef.current = null;
    setIsPointerDown(false);
    setIsDragging(false);
    isDraggingRef.current = false;

    if (Math.abs(deltaX) <= DRAG_THRESHOLD) {
      currentTranslateRef.current = -(itemWidth * activeIndex);
      setTranslateX(currentTranslateRef.current);
      return;
    }

    setActiveIndex(nextIndex);
  }

  function handlePointerCancel() {
    const { itemWidth } = getMetrics();
    currentTranslateRef.current = -(itemWidth * activeIndex);
    setTranslateX(currentTranslateRef.current);
    pointerIdRef.current = null;
    setIsPointerDown(false);
    setIsDragging(false);
    isDraggingRef.current = false;
    suppressClickRef.current = false;
  }

  function handleClickCapture(event) {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  if (!resolvedItems.length) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClickCapture={handleClickCapture}
    >
      <div className="-mt-3 overflow-hidden pt-3">
        <div
          ref={trackRef}
          className={`flex select-none touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            transform: `translate3d(${translateX}px, 0, 0)`,
            transition: isPointerDown ? 'none' : 'transform 700ms ease'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerCancel}
        >
          {resolvedItems.map((item, index) => (
            <div
              key={getItemKey ? getItemKey(item, index) : item._id || item.slug || index}
              className="flex-none px-1.5 sm:px-2"
              style={{ width: `${100 / slidesPerView}%` }}
            >
              {renderItem ? renderItem(item, index) : <ProductCard product={item} mode={mode} />}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${isActive ? 'w-6 bg-navy' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                aria-label={`Den ${ariaLabel} ${index + 1}`}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={handlePrev} className="icon-button h-9 w-9 rounded-full px-0" aria-label={`${ariaLabel} truoc`}>
            <span aria-hidden="true">&larr;</span>
          </button>
          <button type="button" onClick={handleNext} className="icon-button h-9 w-9 rounded-full px-0" aria-label={`${ariaLabel} tiep theo`}>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCarousel;
