function AdminSettingsPage() {
  const settings = [
    {
      title: 'Danh mục ưu tiên',
      description: 'Kiểm tra cấu hình slug, trạng thái và ảnh đại diện để bộ lọc frontend hoạt động ổn định.'
    },
    {
      title: 'Khuyến mãi',
      description: 'Rà soát mã giảm giá sắp hết hạn và tắt những mã không còn sử dụng.'
    },
    {
      title: 'Tài khoản admin',
      description: 'Chỉ cấp quyền admin cho tài khoản cần thiết, tránh cấp quyền rộng.'
    }
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">Cài đặt</p>
        <h2 className="mt-2 text-3xl font-bold text-navy">Cài đặt quản trị</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Trang này tổng hợp các ghi chú vận hành để admin quản lý hệ thống gọn gàng hơn.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {settings.map((item) => (
          <article key={item.title} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-navy">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminSettingsPage;
