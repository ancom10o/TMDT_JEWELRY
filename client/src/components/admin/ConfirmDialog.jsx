/* eslint-disable react/prop-types */
import AdminModal from './AdminModal.jsx';

function ConfirmDialog({ open, title, description, confirmLabel = 'Xóa', cancelLabel = 'Hủy', tone = 'danger', onConfirm, onClose, loading = false }) {
  return (
    <AdminModal open={open} title={title} description={description} onClose={onClose} width="max-w-lg">
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-outline" disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={tone === 'danger' ? 'inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60' : 'btn-secondary'}
        >
          {loading ? 'Đang xử lý...' : confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}

export default ConfirmDialog;
