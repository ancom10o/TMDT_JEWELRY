/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import ProductCarousel from '../ProductCarousel.jsx';
import SectionHeader from '../SectionHeader.jsx';
import { getProducts } from '../../services/api.js';
import { normalizeSection, sliceSectionProducts } from '../../utils/homeSections.js';

function buildProductQueryParams(productQuery = '', limit = 8) {
  const trimmedQuery = productQuery.trim();
  const url = trimmedQuery
    ? new globalThis.URL(trimmedQuery.includes('?') ? trimmedQuery : `/products?${trimmedQuery}`, globalThis.location?.origin || 'http://localhost')
    : new globalThis.URL('/products', globalThis.location?.origin || 'http://localhost');
  const params = Object.fromEntries(url.searchParams.entries());

  return {
    ...params,
    page: 1,
    limit
  };
}

function ProductSliderSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const isQuerySource = normalizedSection.settings.sourceMode === 'query';
  const limit = Number(normalizedSection.settings.limit) || 8;
  const [queryProducts, setQueryProducts] = useState([]);
  const [isLoadingQueryProducts, setIsLoadingQueryProducts] = useState(false);
  const products = isQuerySource ? queryProducts : sliceSectionProducts(normalizedSection);

  useEffect(() => {
    if (!isQuerySource) {
      setQueryProducts([]);
      return undefined;
    }

    let isMounted = true;

    async function loadQueryProducts() {
      try {
        setIsLoadingQueryProducts(true);
        const response = await getProducts(buildProductQueryParams(normalizedSection.settings.productQuery, limit));

        if (isMounted) {
          setQueryProducts(response.products || []);
        }
      } catch {
        if (isMounted) {
          setQueryProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingQueryProducts(false);
        }
      }
    }

    loadQueryProducts();

    return () => {
      isMounted = false;
    };
  }, [isQuerySource, limit, normalizedSection.settings.productQuery]);

  if (!products.length && !isLoadingQueryProducts) {
    return null;
  }

  const visibleSlides = {
    desktop: Math.min(4, products.length),
    tablet: Math.min(2, products.length),
    mobile: 1
  };

  return (
    <section className="container-page section-shell">
      <SectionHeader
        eyebrow="San pham noi bat"
        title={normalizedSection.title}
        actionLabel={normalizedSection.buttonLabel}
        actionTo={normalizedSection.buttonLink}
      />

      {products.length ? (
        <div className="mt-6">
          <ProductCarousel
            products={products}
            mode={normalizedSection.settings.variant === 'compact' ? 'compact' : 'listing'}
            visibleSlides={visibleSlides}
            ariaLabel="san pham"
          />
        </div>
      ) : null}
    </section>
  );
}

export default ProductSliderSection;
