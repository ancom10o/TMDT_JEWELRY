import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';
import { getPublicAssetUrl } from '../../services/api.js';

const zaloIcon = getPublicAssetUrl('/images/Icons/Logo-Zalo.webp');
const hotlineIcon = getPublicAssetUrl('/images/Icons/t%C6%B0-v%E1%BA%A5n.png');

function normalizePhoneForTel(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function FloatingContactButtons() {
  const { settings } = useSiteSettings();
  const phone = normalizePhoneForTel(settings.hotline);

  return (
    <div className="fixed bottom-16 right-3 z-40 flex flex-col items-end gap-2.5 sm:bottom-20 sm:right-4 lg:bottom-8 lg:right-6 lg:gap-3">
      {settings.zaloUrl ? (
        <a
          href={settings.zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Liên hệ qua Zalo"
          className="zalo-floating-button flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_16px_36px_rgba(0,104,255,0.24)] ring-1 ring-[#0068ff]/15 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#0068ff]/20 sm:h-11 sm:w-11 lg:h-14 lg:w-14"
        >
          <img src={zaloIcon} alt="" className="h-full w-full object-cover object-center" />
        </a>
      ) : null}

      {phone ? <a
        href={`tel:${phone}`}
        aria-label="Gọi hotline"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/55 bg-navy p-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_16px_38px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:scale-105 hover:border-gold hover:text-gold focus:outline-none focus:ring-4 focus:ring-gold/25 sm:h-11 sm:w-11 lg:h-14 lg:w-auto lg:justify-start lg:gap-2 lg:py-2 lg:pl-2 lg:pr-5 lg:text-xs"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white p-1 sm:h-8 sm:w-8 lg:h-9 lg:w-9">
          <img src={hotlineIcon} alt="" className="h-full w-full object-contain" />
        </span>
        <span className="hidden leading-tight lg:block">
          Hotline
          <span className="block text-[11px] tracking-normal text-gold">{settings.hotline}</span>
        </span>
      </a> : null}
    </div>
  );
}

export default FloatingContactButtons;
