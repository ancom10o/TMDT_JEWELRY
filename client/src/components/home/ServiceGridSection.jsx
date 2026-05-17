/* eslint-disable react/prop-types */
import SectionHeader from '../SectionHeader.jsx';
import { clampColumns, normalizeSection } from '../../utils/homeSections.js';

const columnClassMap = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4'
};

function ServiceGridSection({ section }) {
  const normalizedSection = normalizeSection(section);
  const items = normalizedSection.items;

  if (!items.length) {
    return null;
  }

  const columns = clampColumns(normalizedSection.settings.columns, 4);

  return (
    <section className="container-page section-shell">
      <div className="rounded-[34px] border border-[#ebe4d8] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-8">
        <SectionHeader eyebrow="Dich vu" title={normalizedSection.title} description={normalizedSection.subtitle} align="start" />
        <div className={`mt-8 grid gap-5 sm:grid-cols-2 ${columnClassMap[columns]}`}>
          {items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-[26px] bg-[#fcfaf5] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-sm font-bold uppercase text-gold">
                {item.icon || index + 1}
              </div>
              <h3 className="mt-5 font-display text-[1.9rem] leading-none text-navy">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description || item.subtitle}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServiceGridSection;
