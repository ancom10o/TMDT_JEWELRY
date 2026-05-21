import { useToast } from '../context/ToastContext.jsx';

function getToastClass(type) {
  const map = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    order: 'border-emerald-300 bg-emerald-100 text-emerald-900 shadow-[0_18px_44px_rgba(16,185,129,0.22)]',
    info: 'border-slate-200 bg-white text-slate-800'
  };

  return map[type] || map.info;
}

function ToastViewport() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-3xl border px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)] ${getToastClass(
            toast.type
          )}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-sm">{toast.description}</p> : null}
            </div>
            <button type="button" onClick={() => removeToast(toast.id)} className="btn-ghost !px-2 !py-1 text-xs">
              Đóng
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastViewport;
