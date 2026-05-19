import { getPublicAssetUrl } from '../../services/api.js';

const zaloLink = 'https://zalo.me/0349865887';
const zaloIcon = getPublicAssetUrl('/images/Icons/Logo-Zalo.webp');
const hotlineIcon = getPublicAssetUrl('/images/Icons/t%C6%B0-v%E1%BA%A5n.png');

function FloatingContactButtons() {
  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-6">
      <a
        href={zaloLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Liên hệ qua Zalo"
        className="zalo-floating-button flex h-12 w-12 items-center justify-center rounded-full bg-white p-2 shadow-[0_16px_36px_rgba(0,104,255,0.24)] ring-1 ring-[#0068ff]/15 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#0068ff]/20 sm:h-14 sm:w-14"
      >
        <img src={zaloIcon} alt="" className="h-full w-full object-contain" />
      </a>

      <a
        href="tel:19006868"
        aria-label="Gọi hotline"
        className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-gold/55 bg-navy py-2 pl-2 pr-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_16px_38px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:scale-105 hover:border-gold hover:text-gold focus:outline-none focus:ring-4 focus:ring-gold/25 sm:min-h-14 sm:pr-5 sm:text-xs"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white p-1 sm:h-9 sm:w-9">
          <img src={hotlineIcon} alt="" className="h-full w-full object-contain" />
        </span>
        <span className="leading-tight">
          Hotline
          <span className="block text-[10px] tracking-normal text-gold sm:text-[11px]">1900 6868</span>
        </span>
      </a>
    </div>
  );
}

export default FloatingContactButtons;
