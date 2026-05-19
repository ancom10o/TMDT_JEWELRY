/* eslint-disable react/prop-types */
function AdminModal({ open, title, description, children, onClose, width = 'max-w-4xl' }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4">
      <div className={`max-h-[92vh] w-full ${width} overflow-hidden rounded-[32px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-semibold text-navy">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost">
            Đóng
          </button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export default AdminModal;
