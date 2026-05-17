import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const AUTOPLAY_DELAY = 4000;

const banners = [
  {
    id: 'featured',
    eyebrow: 'Bộ sưu tập nổi bật',
    title: 'Thiết kế thanh lịch cho mọi khoảnh khắc',
    description: 'Khám phá những lựa chọn được yêu thích với cảm hứng tối giản và sang trọng.',
    ctaLabel: 'Khám phá ngay',
    ctaTo: '/products?featured=true',
    accent: 'from-[#fff7e7] via-[#fffdf8] to-[#ecd7a0]'
  },
  {
    id: 'wedding',
    eyebrow: 'Trang sức cưới tinh tế',
    title: 'Dấu ấn bền lâu cho ngày trọng đại',
    description: 'Nhẫn cưới và trang sức cưới được chọn lọc cho vẻ đẹp thanh nhã, hiện đại.',
    ctaLabel: 'Xem trang sức cưới',
    ctaTo: '/products?category=trang-suc-cuoi',
    accent: 'from-[#f5f2ff] via-[#ffffff] to-[#e5daf7]'
  },
  {
    id: 'holiday',
    eyebrow: 'Ưu đãi mùa lễ hội',
    title: 'Mua sắm dễ dàng với lựa chọn nổi bật',
    description: 'Gợi ý những thiết kế phù hợp để tự thưởng hoặc dành tặng người thân.',
    ctaLabel: 'Xem ưu đãi',
    ctaTo: '/products?featured=true',
    accent: 'from-[#fff3eb] via-[#ffffff] to-[#f0d0b9]'
  },
  {
    id: 'gift',
    eyebrow: 'Quà tặng sang trọng',
    title: 'Tinh tế trong từng món quà',
    description: 'Chọn trang sức phù hợp cho sinh nhật, kỷ niệm và những dịp đáng nhớ.',
    ctaLabel: 'Xem quà tặng',
    ctaTo: '/products',
    accent: 'from-[#fff1f5] via-[#ffffff] to-[#f3d8e1]'
  },
  {
    id: 'gold',
    eyebrow: 'Sắc vàng thanh lịch',
    title: 'Điểm nhấn ấm áp cho phong cách hiện đại',
    description: 'Những thiết kế vàng được hoàn thiện để dễ phối và nổi bật vừa đủ.',
    ctaLabel: 'Xem trang sức vàng',
    ctaTo: '/products?category=nhan',
    accent: 'from-[#fff7e8] via-[#fffdf8] to-[#e8cc83]'
  }
];

function HomeHeroBanner() {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!browserWindow || isHovered) {
      return undefined;
    }

    const timer = browserWindow.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, AUTOPLAY_DELAY);

    return () => {
      browserWindow.clearInterval(timer);
    };
  }, [browserWindow, isHovered]);

  function handlePrev() {
    setActiveIndex((current) => (current - 1 + banners.length) % banners.length);
  }

  function handleNext() {
    setActiveIndex((current) => (current + 1) % banners.length);
  }

  return (
    <section className="container-page pt-5 sm:pt-6 lg:pt-8">
      <div
        className="overflow-hidden rounded-[30px] border border-[#e9deca] bg-[linear-gradient(135deg,_#fffdf8_0%,_#f7f0e5_50%,_#eef2f7_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
        >
          {banners.map((banner) => (
            <article key={banner.id} className="w-full flex-none">
              <div className="grid min-h-[380px] gap-6 p-6 sm:min-h-[410px] sm:p-8 lg:min-h-[440px] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:p-10">
                <div className="flex max-w-[540px] flex-col justify-center">
                  <p className="eyebrow">{banner.eyebrow}</p>
                  <h1 className="mt-3 font-display text-[2.3rem] leading-[0.95] text-navy sm:text-[3rem] lg:text-[3.5rem]">
                    {banner.title}
                  </h1>
                  <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">{banner.description}</p>

                  <div className="mt-7">
                    <Link to={banner.ctaTo} className="btn-secondary px-6 py-3">
                      {banner.ctaLabel}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div
                    className={`relative h-[240px] w-full overflow-hidden rounded-[28px] bg-gradient-to-br ${banner.accent} sm:h-[280px] lg:h-[320px]`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_28%,_rgba(255,255,255,0.92),_transparent_18%),radial-gradient(circle_at_68%_32%,_rgba(255,255,255,0.58),_transparent_16%),radial-gradient(circle_at_48%_74%,_rgba(212,175,55,0.42),_transparent_26%)]" />
                    <div className="absolute inset-x-8 bottom-8 top-8 rounded-[24px] border border-white/60 bg-[linear-gradient(160deg,_rgba(255,255,255,0.55)_0%,_rgba(255,255,255,0.12)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" />
                    <div className="absolute left-1/2 top-1/2 h-[148px] w-[148px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-[radial-gradient(circle,_rgba(255,255,255,0.98)_0%,_rgba(246,234,198,0.86)_42%,_rgba(212,175,55,0.24)_100%)] shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:h-[172px] sm:w-[172px]" />
                    <div className="absolute left-1/2 top-1/2 h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-[#f8f1dd] shadow-[0_0_0_10px_rgba(255,255,255,0.65)] sm:h-[102px] sm:w-[102px]" />
                    <div className="absolute bottom-6 left-6 rounded-full border border-white/75 bg-white/75 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-navy">
                      JewelAura
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/40 px-5 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {banners.map((banner, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${isActive ? 'w-7 bg-navy' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                  aria-label={`Đến banner ${index + 1}`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrev} className="icon-button h-9 w-9 rounded-full px-0" aria-label="Banner trước">
              <span aria-hidden="true">&larr;</span>
            </button>
            <button type="button" onClick={handleNext} className="icon-button h-9 w-9 rounded-full px-0" aria-label="Banner tiếp theo">
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHeroBanner;
