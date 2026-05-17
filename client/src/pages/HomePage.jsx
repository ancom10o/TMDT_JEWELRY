import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CategoryGridSection from '../components/home/CategoryGridSection.jsx';
import CollectionCardsSection from '../components/home/CollectionCardsSection.jsx';
import HeroBannerSection from '../components/home/HeroBannerSection.jsx';
import ImageTextBlockSection from '../components/home/ImageTextBlockSection.jsx';
import ProductSliderSection from '../components/home/ProductSliderSection.jsx';
import PromoBannerSection from '../components/home/PromoBannerSection.jsx';
import ServiceGridSection from '../components/home/ServiceGridSection.jsx';
import { getHomeSections } from '../services/api.js';
import { normalizeSection } from '../utils/homeSections.js';

function renderSection(section) {
  switch (section.type) {
    case 'hero_banner':
      return <HeroBannerSection key={section._id} section={section} />;
    case 'category_grid':
      return <CategoryGridSection key={section._id} section={section} />;
    case 'product_slider':
      return <ProductSliderSection key={section._id} section={section} />;
    case 'image_text_block':
      return <ImageTextBlockSection key={section._id} section={section} />;
    case 'promo_banner':
      return <PromoBannerSection key={section._id} section={section} />;
    case 'service_grid':
      return <ServiceGridSection key={section._id} section={section} />;
    case 'collection_cards':
      return <CollectionCardsSection key={section._id} section={section} />;
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

        setSections(Array.isArray(response.sections) ? response.sections.map((section) => normalizeSection(section)) : []);
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
        <div className="space-y-5 px-3 pt-2 sm:px-4 sm:pt-3 lg:px-5 xl:px-6">
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
              Hien chua co section nao dang bat. Ban co the vao trang quan tri homepage de tao section dung type va sap xep thu tu hien thi.
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
