/* eslint-disable react/prop-types */
function AdminPageHeader({ eyebrow, title, description, actions, meta }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold text-navy">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {meta ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{meta}</div> : null}
        {actions}
      </div>
    </div>
  );
}

export default AdminPageHeader;
