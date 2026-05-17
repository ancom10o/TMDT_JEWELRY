import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const AUTOPLAY_DELAY = 5000;
const DRAG_THRESHOLD = 50;

const promoBanners = [
  {
    id: 'promo-1',
    title: 'Banner chiến dịch 01',
    subtitle: 'Khu vực này giữ kích thước cố định để thay ảnh từ admin sau này.',
    ctaLabel: 'Xem chi tiết',
    ctaTo: '/products',
    imageUrl: ''
  },
  {
    id: 'promo-2',
    title: 'Banner chiến dịch 02',
    subtitle: 'Phù hợp để hiển thị ảnh ưu đãi, bộ sưu tập hoặc sự kiện theo mùa.',
    ctaLabel: 'Khám phá ngay',
    ctaTo: '/products?featured=true',
    imageUrl: ''
  },
  {
    id: 'promo-3',
    title: 'Banner chiến dịch 03',
    subtitle: 'Có thể thay bằng ảnh ngang lớn với bố cục tương tự mẫu tham chiếu.',
    ctaLabel: 'Xem bộ sưu tập',
    ctaTo: '/products?sort=newest',
    imageUrl: ''
  }
];

function TopPromoBanner() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);

  useEffect(() => {
    if (!browserWindow || isHovered) {
      return undefined;
    }

    const timer = browserWindow.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promoBanners.length);
    }, AUTOPLAY_DELAY);

    return () => {
      browserWindow.clearInterval(timer);
    };
  }, [browserWindow, isHovered]);

  function handlePrev() {
    setActiveIndex((current) => (current - 1 + promoBanners.length) % promoBanners.length);
  }

  function handleNext() {
    setActiveIndex((current) => (current + 1) % promoBanners.length);
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

  return (
    <section className="px-3 pt-4 sm:px-4 sm:pt-5 lg:px-6 lg:pt-6">
      <div
        className="overflow-hidden rounded-[28px] border border-[#dfe7f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handlePointerLeave();
        }}
      >
        <div
          className="flex cursor-grab active:cursor-grabbing transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerLeave}
          onPointerLeave={handlePointerLeave}
        >
          {promoBanners.map((banner) => (
            <article key={banner.id} className="w-full flex-none">
              <div className="relative h-[220px] overflow-hidden sm:h-[300px] lg:h-[380px] xl:h-[430px]">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(115deg,_#edf3f8_0%,_#ffffff_35%,_#e4ecf5_100%)]" />
                )}

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,_rgba(255,255,255,0.55),_transparent_18%),radial-gradient(circle_at_78%_22%,_rgba(255,255,255,0.25),_transparent_14%),linear-gradient(90deg,rgba(255,250,240,0.2)_0%,rgba(255,255,255,0.02)_45%,rgba(15,23,42,0.08)_100%)]" />

                {!banner.imageUrl ? (
                  <div className="absolute bottom-5 left-5 max-w-[420px] rounded-[22px] border border-white/60 bg-white/48 p-4 backdrop-blur-[2px] sm:bottom-6 sm:left-6 sm:p-5 lg:bottom-8 lg:left-8 lg:p-6">
                    <p className="eyebrow">Banner ảnh lớn</p>
                    <h2 className="mt-3 font-display text-[1.8rem] leading-[0.96] text-navy sm:text-[2.2rem] lg:text-[2.6rem]">
                      {banner.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{banner.subtitle}</p>
                    <div className="mt-5">
                      <Link to={banner.ctaTo} className="btn-secondary px-5 py-2.5">
                        {banner.ctaLabel}
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 lg:pl-5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="pointer-events-auto icon-button h-10 w-10 rounded-full border-white/70 bg-white/78 px-0 backdrop-blur"
                    aria-label="Banner ảnh trước"
                  >
                    <span aria-hidden="true">&larr;</span>
                  </button>
                </div>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 lg:pr-5">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="pointer-events-auto icon-button h-10 w-10 rounded-full border-white/70 bg-white/78 px-0 backdrop-blur"
                    aria-label="Banner ảnh tiếp theo"
                  >
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopPromoBanner;
