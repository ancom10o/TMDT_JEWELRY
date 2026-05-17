/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCarousel from '../components/ProductCarousel.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { getHomeSections, getPublicAssetUrl } from '../services/api.js';

function BannerSliderSection({ section }) {
  const banners = Array.isArray(section.bannerIds) ? section.bannerIds.filter((banner) => banner?.isActive !== false) : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) {
      return undefined;
    }

    const timer = globalThis.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => {
      globalThis.clearInterval(timer);
    };
  }, [banners.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [section._id]);

  if (!banners.length) {
    return null;
  }

  return (
    <section className="px-3 pt-4 sm:px-4 sm:pt-5 lg:px-6 lg:pt-6">
      <div className="overflow-hidden rounded-[28px] border border-[#dfe7f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}>
          {banners.map((banner) => (
            <article key={banner._id} className="w-full flex-none">
              <div className="relative h-[240px] overflow-hidden sm:h-[320px] lg:h-[420px]">
                <picture>
                  {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={getPublicAssetUrl(banner.mobileImageUrl)} /> : null}
                  <img src={getPublicAssetUrl(banner.imageUrl)} alt={banner.name} className="h-full w-full object-cover" />
                </picture>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.56)_0%,rgba(15,23,42,0.22)_40%,rgba(15,23,42,0.06)_100%)]" />
                <div className="absolute inset-y-0 left-0 flex max-w-[560px] items-center p-6 sm:p-8 lg:p-12">
                  <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur-md sm:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f3d77b]">JewelAura</p>
                    <h2 className="mt-4 font-display text-[2rem] leading-none text-white sm:text-[2.8rem] lg:text-[3.3rem]">
                      {banner.title || section.title}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-slate-100 sm:text-[15px]">{banner.subtitle || section.subtitle}</p>
                    {banner.buttonLabel ? (
                      <div className="mt-6">
                        <Link to={banner.buttonLink || '/products'} className="btn-secondary px-6 py-3">
                          {banner.buttonLabel}
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

function CategoryGridSection({ section }) {
  const items = Array.isArray(section.items) ? section.items : [];

  if (!items.length) {
    return null;
  }

  return (
    <section className="container-page section-shell">
      <SectionHeader
        eyebrow="Danh muc noi bat"
        title={section.title}
        description={section.subtitle}
        actionLabel={section.buttonLabel}
        actionTo={section.buttonLink}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.link || item.title}
            to={item.link || '/products'}
            className="group overflow-hidden rounded-[30px] border border-[#ebe4d8] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.1)]"
          >
            <div className={`aspect-[4/3] rounded-[24px] bg-gradient-to-br ${item.image || 'from-[#f8f4ea] via-white to-[#efe7d3]'} transition duration-300 group-hover:scale-[1.02]`} />
            <h3 className="mt-5 font-display text-[2rem] leading-none text-navy">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.subtitle}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy transition group-hover:text-gold">
              Xem san pham
              <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductCarouselSection({ section }) {
  const products = Array.isArray(section.productIds) ? section.productIds : [];

  if (!products.length) {
    return null;
  }

  return (
    <section className="container-page section-shell">
      <SectionHeader
        eyebrow={section.key === 'new-arrivals' ? 'Bo suu tap moi' : 'San pham noi bat'}
        title={section.title}
        description={section.subtitle}
        actionLabel={section.buttonLabel}
        actionTo={section.buttonLink}
      />

      <div className="mt-8">
        <ProductCarousel products={products} mode={section.displayMode === 'compact' ? 'compact' : 'listing'} />
      </div>
    </section>
  );
}

function EditorialGridSection({ section }) {
  const items = Array.isArray(section.items) ? section.items : [];

  if (!items.length) {
    return null;
  }

  return (
    <section className="container-page section-shell">
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[34px] bg-navy p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:p-8">
          <p className="eyebrow">Jewelry Editorial</p>
          <h2 className="mt-4 font-display text-[2.5rem] leading-none text-white sm:text-[2.8rem]">{section.title}</h2>
          <p className="mt-5 max-w-xl text-sm leading-8 text-slate-200">{section.subtitle}</p>
          {section.buttonLabel ? (
            <Link to={section.buttonLink || '/products'} className="btn-primary mt-8">
              {section.buttonLabel}
            </Link>
          ) : null}
        </article>

        <div className="grid gap-5 sm:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-[30px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${
                index === 1 ? 'border-[#ead8aa] bg-[#fffaf0]' : 'border-[#ebe4d8] bg-white'
              }`}
            >
              <div className="aspect-[4/5] rounded-[24px] bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.24),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f5ecda_55%,_#ece7df_100%)]" />
              <p className="mt-5 eyebrow">{item.badge}</p>
              <h3 className="mt-3 font-display text-[2rem] leading-none text-navy">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.subtitle}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceGridSection({ section }) {
  const items = Array.isArray(section.items) ? section.items : [];

  if (!items.length) {
    return null;
  }

  return (
    <section className="container-page section-shell">
      <div className="rounded-[34px] border border-[#ebe4d8] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-8">
        <SectionHeader eyebrow="Dich vu" title={section.title} description={section.subtitle} align="start" />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => (
            <article key={item.title} className="rounded-[26px] bg-[#fcfaf5] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-gold">
                {index + 1}
              </div>
              <h3 className="mt-5 font-display text-[1.9rem] leading-none text-navy">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.subtitle}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function renderSection(section) {
  switch (section.type) {
    case 'banner_slider':
      return <BannerSliderSection key={section._id} section={section} />;
    case 'category_grid':
      return <CategoryGridSection key={section._id} section={section} />;
    case 'product_carousel':
      return <ProductCarouselSection key={section._id} section={section} />;
    case 'editorial_grid':
      return <EditorialGridSection key={section._id} section={section} />;
    case 'service_grid':
      return <ServiceGridSection key={section._id} section={section} />;
    default:
      return null;
  }
}

function HomePage() {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHomeSections() {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const response = await getHomeSections();

        if (!isMounted) {
          return;
        }

        setSections(response.sections || []);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage('Khong the tai du lieu homepage luc nay. Hay kiem tra ket noi API.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHomeSections();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="pb-10">
      {errorMessage ? (
        <div className="container-page pt-8">
          <div className="state-error">{errorMessage}</div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-6 px-3 pt-4 sm:px-4 lg:px-6">
          <div className="skeleton-block h-[260px] rounded-[28px] sm:h-[340px] lg:h-[420px]" />
          <div className="container-page grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton-block h-[280px] rounded-[28px]" />
            ))}
          </div>
        </div>
      ) : sections.length > 0 ? (
        sections.map(renderSection)
      ) : (
        <section className="container-page py-12 sm:py-16">
          <div className="rounded-[34px] border border-[#ebe4d8] bg-[linear-gradient(135deg,_#fffdf8_0%,_#f8f2e3_52%,_#f4efe8_100%)] p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Homepage CMS</p>
            <h2 className="mt-4 font-display text-[2.4rem] leading-none text-navy sm:text-[3rem]">
              Homepage dang cho duoc cau hinh
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Hien chua co section nao dang bat. Ban co the vao trang quan tri homepage de tao banner, chon san pham va sap xep section hien thi.
            </p>
            <div className="mt-7">
              <Link to="/products" className="btn-secondary px-6 py-3">
                Xem danh sach san pham
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
