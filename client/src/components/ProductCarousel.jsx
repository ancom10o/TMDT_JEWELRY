/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard.jsx';

const AUTOPLAY_DELAY = 4500;
const DRAG_THRESHOLD = 50;

function getSlidesPerView(width) {
  if (width >= 1280) {
    return 4;
  }

  if (width >= 768) {
    return 2;
  }

  return 1;
}

function ProductCarousel({ products = [], mode = 'listing' }) {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);
  const [slidesPerView, setSlidesPerView] = useState(() => {
    if (!browserWindow) {
      return 1;
    }

    return getSlidesPerView(browserWindow.innerWidth);
  });

  useEffect(() => {
    if (!browserWindow) {
      return undefined;
    }

    function handleResize() {
      setSlidesPerView(getSlidesPerView(browserWindow.innerWidth));
    }

    handleResize();
    browserWindow.addEventListener('resize', handleResize);

    return () => {
      browserWindow.removeEventListener('resize', handleResize);
    };
  }, [browserWindow]);

  const totalPages = useMemo(() => Math.max(1, products.length - slidesPerView + 1), [products.length, slidesPerView]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    if (!browserWindow || isHovered || products.length <= slidesPerView) {
      return undefined;
    }

    const timer = browserWindow.setInterval(() => {
      setActiveIndex((current) => (current + 1) % totalPages);
    }, AUTOPLAY_DELAY);

    return () => {
      browserWindow.clearInterval(timer);
    };
  }, [browserWindow, isHovered, products.length, slidesPerView, totalPages]);

  function handlePrev() {
    setActiveIndex((current) => (current - 1 + totalPages) % totalPages);
  }

  function handleNext() {
    setActiveIndex((current) => (current + 1) % totalPages);
  }

  function handlePointerDown(event) {
    setDragStartX(event.clientX);
  }

  function handlePointerUp(event) {
    if (dragStartX === null) {
      return;
    }

    const deltaX = event.clientX - dragStartX;
    setDragStartX(null);

    if (Math.abs(deltaX) < DRAG_THRESHOLD) {
      return;
    }

    if (deltaX < 0) {
      handleNext();
      return;
    }

    handlePrev();
  }

  function handlePointerLeave() {
    setDragStartX(null);
  }

  if (!products.length) {
    return null;
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handlePointerLeave();
      }}
    >
      <div className="overflow-hidden">
        <div
          className="flex cursor-grab active:cursor-grabbing transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(-${(100 / slidesPerView) * activeIndex}%, 0, 0)` }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerLeave}
          onPointerLeave={handlePointerLeave}
        >
          {products.map((product) => (
            <div key={product._id || product.slug} className="flex-none px-2.5" style={{ width: `${100 / slidesPerView}%` }}>
              <ProductCard product={product} mode={mode} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${isActive ? 'w-6 bg-navy' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                aria-label={`Đến nhóm sản phẩm ${index + 1}`}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={handlePrev} className="icon-button h-9 w-9 rounded-full px-0" aria-label="Sản phẩm trước">
            <span aria-hidden="true">&larr;</span>
          </button>
          <button type="button" onClick={handleNext} className="icon-button h-9 w-9 rounded-full px-0" aria-label="Sản phẩm tiếp theo">
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCarousel;
