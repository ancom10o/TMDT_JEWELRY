import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const AUTOPLAY_DELAY = 4000;

const slides = [
  {
    id: 'new-collection',
    eyebrow: 'Bộ sưu tập mới',
    title: 'Khám phá trang sức mới',
    description: 'Những thiết kế mới được chọn lọc cho phong cách thanh lịch mỗi ngày.',
    ctaLabel: 'Xem sản phẩm mới',
    ctaTo: '/products?sort=newest',
    accent: 'from-[#fff7e6] via-[#fffdf8] to-[#f0dfb2]',
    stat: 'Mới ra mắt'
  },
  {
    id: 'wedding-rings',
    eyebrow: 'Nhẫn cưới',
    title: 'Khoảnh khắc đánh dấu',
    description: 'Những mẫu nhẫn cưới tối giản, sang trọng và dễ mặc trong nhiều năm.',
    ctaLabel: 'Xem nhẫn cưới',
    ctaTo: '/products?category=trang-suc-cuoi',
    accent: 'from-[#f7f2ff] via-white to-[#e6dcf8]',
    stat: 'Wedding edit'
  },
  {
    id: 'diamond',
    eyebrow: 'Kim cuong',
    title: 'Diem sang noi bat',
    description: 'Lua chon thiet ke ton da chu cho nhung dip dac biet va phong cach sang trong.',
    ctaLabel: 'Xem kim cuong',
    ctaTo: '/products?category=kim-cuong',
    accent: 'from-[#eef6ff] via-white to-[#dce9fb]',
    stat: 'Da chu chon loc'
  },
  {
    id: 'gift',
    eyebrow: 'Qua tang',
    title: 'Qua tang tinh te',
    description: 'Goi y san pham de tang trong sinh nhat, ky niem va nhung dip can mot dau an dep.',
    ctaLabel: 'Xem qua tang',
    ctaTo: '/products',
    accent: 'from-[#fff1f4] via-white to-[#f6dde3]',
    stat: 'San sang dong goi'
  },
  {
    id: 'promotion',
    eyebrow: 'Khuyến mãi',
    title: 'Ưu đãi theo mùa',
    description: 'Cập nhật các lựa chọn được quan tâm nhiều với mức giá để mua sắm tốt hơn.',
    ctaLabel: 'Xem ưu đãi',
    ctaTo: '/products?featured=true',
    accent: 'from-[#fff8ea] via-white to-[#f2dfb6]',
    stat: 'Giá tốt hôm nay'
  },
  {
    id: 'watches',
    eyebrow: 'Đồng hồ',
    title: 'Phong cách thanh lịch',
    description: 'Đồng hồ thời trang có tổng mẫu cao cấp, phù hợp cho công sở và sự kiện.',
    ctaLabel: 'Xem đồng hồ',
    ctaTo: '/products?category=dong-ho',
    accent: 'from-[#edf2f6] via-white to-[#dde5ed]',
    stat: 'Phong cách hiện đại'
  },
  {
    id: 'gold-jewelry',
    eyebrow: 'Trang suc vàng',
    title: 'Sắc vang am',
    description: 'Nhung thiet ke vang mang cam giac am ap, de ket hop trong nhieu set do.',
    ctaLabel: 'Xem trang suc vang',
    ctaTo: '/products?category=nhan',
    accent: 'from-[#fff8e8] via-[#fffdfa] to-[#ead59a]',
    stat: 'Thanh lich de deo'
  },
  {
    id: 'silver-jewelry',
    eyebrow: 'Trang suc bac',
    title: 'Tinh gon moi ngay',
    description: 'Trang suc bac nhe, sach va toi gian cho nhu cau deo hang ngay.',
    ctaLabel: 'Xem trang suc bac',
    ctaTo: '/products?category=bong-tai',
    accent: 'from-[#f3f6fa] via-white to-[#dce4ec]',
    stat: 'De phoi do'
  }
];

function getSlidesPerView(width) {
  if (width >= 1280) {
    return 4;
  }

  if (width >= 1024) {
    return 3;
  }

  if (width >= 640) {
    return 2;
  }

  return 1.12;
}

function HomeHeroCarousel() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(slides.length - slidesPerView + 1)), [slidesPerView]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    if (isHovered || !browserWindow) {
      return undefined;
    }

    const timer = browserWindow.setInterval(() => {
      setActiveIndex((current) => (current + 1) % totalPages);
    }, AUTOPLAY_DELAY);

    return () => {
      browserWindow.clearInterval(timer);
    };
  }, [browserWindow, isHovered, totalPages]);

  const translateX = `${(100 / slidesPerView) * activeIndex}%`;

  function handlePrev() {
    setActiveIndex((current) => (current - 1 + totalPages) % totalPages);
  }

  function handleNext() {
    setActiveIndex((current) => (current + 1) % totalPages);
  }

  return (
    <section className="container-page pt-4 sm:pt-5 lg:pt-8">
      <div className="rounded-[22px] border border-[#e9deca] bg-[linear-gradient(135deg,_#fffdf8_0%,_#f8f1e6_48%,_#eef2f7_100%)] p-3.5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[26px] sm:p-5 lg:rounded-[28px] lg:p-6">
        <div className="mb-4 flex items-end justify-between gap-4 lg:mb-5">
          <div className="max-w-2xl">
            <p className="eyebrow">Nổi bật hôm nay</p>
            <h1 className="mt-2 font-display text-[1.6rem] leading-tight text-navy sm:text-[2.1rem] lg:text-[3rem] lg:leading-none">
              Bộ sưu tập nổi bật
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-[15px]">
              Lựa chọn nhanh những nhóm trang sức được quan tâm nhiều nhất.
            </p>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <button type="button" onClick={handlePrev} className="icon-button h-9 w-9 rounded-full px-0" aria-label="Slide trước">
              <span aria-hidden="true">&larr;</span>
            </button>
            <button type="button" onClick={handleNext} className="icon-button h-9 w-9 rounded-full px-0" aria-label="Slide tiếp theo">
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>

        <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translate3d(-${translateX}, 0, 0)` }}>
              {slides.map((slide) => (
                <article key={slide.id} className="flex-none px-1.5 sm:px-2" style={{ width: `${100 / slidesPerView}%` }}>
                  <div className="flex h-[280px] flex-col overflow-hidden rounded-[20px] border border-white/70 bg-white/88 p-3 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:h-[300px] sm:p-4 lg:h-[320px] lg:rounded-[24px]">
                    <div className={`rounded-[18px] bg-gradient-to-br ${slide.accent} p-4 lg:rounded-[20px] lg:p-5`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="eyebrow">{slide.eyebrow}</p>
                        <span className="rounded-full border border-white/75 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                          {slide.stat}
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-[1.35rem] leading-tight text-navy sm:text-[1.55rem] lg:mt-3 lg:text-[1.95rem] lg:leading-none">{slide.title}</h2>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{slide.description}</p>
                    </div>

                    <div className="mt-4 flex flex-1 flex-col justify-between">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[18px] bg-[#fcfaf5] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Bộ sưu tập</p>
                          <p className="mt-2 font-display text-[1.55rem] leading-none text-navy">{slide.eyebrow}</p>
                        </div>
                        <div className="rounded-[18px] border border-[#eee5d8] bg-white p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Lựa chọn</p>
                          <p className="mt-2 font-display text-[1.55rem] leading-none text-navy">Nổi bật</p>
                        </div>
                      </div>

                      <Link to={slide.ctaTo} className="btn-secondary mt-3 w-full px-3 py-2 text-xs sm:text-sm lg:mt-4 lg:px-4 lg:py-2.5">
                        {slide.ctaLabel}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'w-6 bg-navy' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Đi đến nhóm slide ${index + 1}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button type="button" onClick={handlePrev} className="icon-button h-9 w-9 rounded-full px-0" aria-label="Slide trước">
                <span aria-hidden="true">&larr;</span>
              </button>
              <button type="button" onClick={handleNext} className="icon-button h-9 w-9 rounded-full px-0" aria-label="Slide tiếp theo">
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
