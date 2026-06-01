import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';

const policyLinks = [
  'Chính sách bảo hành',
  'Đổi size trong 7 ngày',
  'Hướng dẫn mua hàng',
  'Bảo mật thông tin'
];

function Footer() {
  const { settings } = useSiteSettings();
  const socialLinks = [
    { label: 'Facebook', url: settings.facebookUrl },
    { label: 'Instagram', url: settings.instagramUrl },
    { label: 'TikTok', url: settings.tiktokUrl },
    { label: 'Zalo', url: settings.zaloUrl },
    { label: 'Messenger', url: settings.messengerUrl }
  ].filter((item) => item.url);

  return (
    <footer className="mt-10 border-t border-slate-200 bg-navy text-white lg:mt-16">
      <div className="container-page grid gap-7 py-9 md:grid-cols-2 lg:gap-10 lg:py-14 xl:grid-cols-[1.3fr_0.9fr_0.9fr_0.8fr]">
        <section>
          <h2 className="text-2xl font-bold tracking-[0.16em] text-gold">{settings.storeName}</h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-200">
            Thương hiệu trang sức theo phong cách tối giản, hiện đại và thanh lịch cho quà tặng, sự kiện và nhu cầu sử dụng hằng ngày.
          </p>
          <p className="mt-5 text-sm text-slate-200">Cửa hàng: {settings.address || '--'}</p>
          {settings.googleMapUrl ? (
            <a href={settings.googleMapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-gold hover:text-white">
              Xem Google Map
            </a>
          ) : null}
        </section>

        <section>
          <h3 className="footer-title">Chính Sách</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {policyLinks.map((item) => (
              <li key={item}>
                <Link to="/products" className="transition hover:text-gold">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="footer-title">Liên Hệ</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li>Hotline: {settings.hotline || '--'}</li>
            <li>Email: {settings.email || '--'}</li>
            <li>Giờ mở cửa: 8:30 - 21:00</li>
          </ul>
        </section>

        <section>
          <h3 className="footer-title">Mạng Xã Hội</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {socialLinks.length > 0 ? socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:border-gold hover:bg-white/10 hover:text-gold"
              >
                {item.label}
              </a>
            )) : <p className="text-sm text-slate-300">Đang cập nhật</p>}
          </div>
        </section>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {settings.storeName}. Thương hiệu trang sức minh họa cho dự án học tập.</p>
          <p>Đây chỉ là trang web phục vụ cho học tập nên không mua thật.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
