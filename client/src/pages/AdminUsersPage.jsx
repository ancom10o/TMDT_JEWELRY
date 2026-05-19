import { useEffect, useMemo, useState } from 'react';
import AdminModal from '../components/admin/AdminModal.jsx';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import FilterBar from '../components/admin/FilterBar.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getUserOrders, getUsers, updateUser } from '../services/api.js';
import { formatCurrency } from '../utils/format.js';

function formatDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
}

function getOrderTone(status) {
  const map = {
    pending: 'warning',
    confirmed: 'info',
    shipping: 'accent',
    completed: 'success',
    cancelled: 'danger'
  };

  return map[status] || 'neutral';
}

function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword = keyword
        ? [user.fullName, user.email].filter(Boolean).some((value) => value.toLowerCase().includes(keyword))
        : true;
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      return matchesKeyword && matchesRole;
    });
  }, [roleFilter, searchKeyword, users]);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setLoading(true);
        const response = await getUsers(token);
        if (isMounted) setUsers(response.users || []);
      } catch (error) {
        if (isMounted) setErrorMessage(error.response?.data?.message || 'Không thể tải danh sách người dùng.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleRoleChange(userId, role) {
    try {
      setUpdatingId(userId);
      const response = await updateUser(userId, { role }, token);
      setUsers((current) => current.map((item) => (item._id === userId ? response.user : item)));
      showToast({ title: 'Đã cập nhật quyền người dùng', type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể cập nhật quyền.');
      showToast({ title: 'Cập nhật quyền thất bại', type: 'error' });
    } finally {
      setUpdatingId('');
    }
  }

  async function handleToggleBlock(targetUser) {
    try {
      setUpdatingId(targetUser._id);
      const response = await updateUser(targetUser._id, { isBlocked: !targetUser.isBlocked }, token);
      setUsers((current) => current.map((item) => (item._id === targetUser._id ? response.user : item)));
      showToast({ title: `Đã ${response.user.isBlocked ? 'khóa' : 'mở khóa'} tài khoản`, type: 'success' });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể đổi trạng thái tài khoản.');
      showToast({ title: 'Cập nhật tài khoản thất bại', type: 'error' });
    } finally {
      setUpdatingId('');
    }
  }

  async function openUserOrders(targetUser) {
    try {
      setSelectedUser(targetUser);
      setSelectedUserOrders([]);
      setSelectedOrder(null);
      setOrdersModalOpen(true);
      setLoadingOrders(true);
      const response = await getUserOrders(targetUser._id, token);
      setSelectedUser(response.user || targetUser);
      setSelectedUserOrders(response.orders || []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Không thể tải đơn hàng của người dùng.');
      showToast({ title: 'Tải đơn hàng thất bại', type: 'error' });
    } finally {
      setLoadingOrders(false);
    }
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Người dùng"
        title="Quản lý người dùng"
        description="Tìm kiếm, lọc theo phân quyền, cấp quyền user-admin và xem nhanh đơn hàng của từng khách."
        meta={loading ? 'Đang tải người dùng...' : `${filteredUsers.length} tài khoản`}
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <FilterBar>
        <input value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="Tìm theo tên hoặc email..." className="input-field sm:max-w-sm" />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="select-field sm:max-w-xs">
          <option value="">Tất cả phân quyền</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </FilterBar>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-block h-20" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="state-empty">Không tìm thấy tài khoản phù hợp.</div>
      ) : (
        <DataTable
          columns={[
            { key: 'user', label: 'Người dùng' },
            { key: 'phone', label: 'Điện thoại' },
            { key: 'role', label: 'Phân quyền' },
            { key: 'status', label: 'Trạng thái' },
            { key: 'created', label: 'Ngày tạo' },
            { key: 'actions', label: 'Hành động', align: 'right' }
          ]}
        >
          {filteredUsers.map((user) => (
            <tr key={user._id} className="border-t border-slate-100">
              <td className="px-5 py-4">
                <p className="font-semibold text-navy">{user.fullName}</p>
                <p className="mt-1 text-slate-500">{user.email}</p>
              </td>
              <td className="px-5 py-4 text-slate-600">{user.phone || '--'}</td>
              <td className="px-5 py-4">
                <select value={user.role} onChange={(event) => handleRoleChange(user._id, event.target.value)} disabled={updatingId === user._id} className="select-field min-w-[130px]">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="px-5 py-4">
                <StatusBadge label={user.isBlocked ? 'Đã khóa' : 'Đang hoạt động'} tone={user.isBlocked ? 'danger' : 'success'} />
              </td>
              <td className="px-5 py-4 text-slate-500">{formatDate(user.createdAt)}</td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => openUserOrders(user)} className="btn-outline !px-4 !py-2">
                    Đơn hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleBlock(user)}
                    disabled={updatingId === user._id || user._id === currentUser?.id}
                    className="btn-outline !px-4 !py-2"
                  >
                    {user.isBlocked ? 'Mở khóa' : 'Khóa'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <AdminModal
        open={ordersModalOpen}
        title="Đơn hàng của khách"
        description={selectedUser ? `${selectedUser.fullName || '--'} · ${selectedUser.email || '--'}` : ''}
        onClose={() => setOrdersModalOpen(false)}
        width="max-w-5xl"
      >
        {loadingOrders ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton-block h-20" />
            ))}
          </div>
        ) : selectedUserOrders.length === 0 ? (
          <div className="state-empty">Người dùng này chưa có đơn hàng.</div>
        ) : (
          <DataTable
            columns={[
              { key: 'code', label: 'Mã đơn' },
              { key: 'date', label: 'Ngày đặt' },
              { key: 'items', label: 'Sản phẩm' },
              { key: 'total', label: 'Tổng tiền' },
              { key: 'status', label: 'Trạng thái' },
              { key: 'payment', label: 'Thanh toán' },
              { key: 'actions', label: 'Chi tiết', align: 'right' }
            ]}
          >
            {selectedUserOrders.map((order) => (
              <tr key={order._id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-semibold text-navy">#{order._id.slice(-8).toUpperCase()}</td>
                <td className="px-5 py-4 text-slate-500">{formatDate(order.createdAt)}</td>
                <td className="px-5 py-4 text-slate-600">
                  <p className="font-medium text-slate-700">{order.items?.length || 0} sản phẩm</p>
                  <p className="mt-1 line-clamp-1 text-slate-500">
                    {(order.items || []).map((item) => item.productName || item.name).join(', ')}
                  </p>
                </td>
                <td className="px-5 py-4 font-semibold text-slate-700">{formatCurrency(order.totalPrice)}</td>
                <td className="px-5 py-4">
                  <StatusBadge label={order.status} tone={getOrderTone(order.status)} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge label={order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'} tone={order.isPaid ? 'success' : 'warning'} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setSelectedOrder(order)} className="btn-outline !px-4 !py-2">
                      Xem
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(selectedOrder)}
        title={selectedOrder ? `Chi tiết đơn #${selectedOrder._id.slice(-8).toUpperCase()}` : 'Chi tiết đơn'}
        description={selectedOrder ? `Ngày đặt: ${formatDate(selectedOrder.createdAt)}` : ''}
        onClose={() => setSelectedOrder(null)}
        width="max-w-4xl"
      >
        {selectedOrder ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={selectedOrder.status} tone={getOrderTone(selectedOrder.status)} />
              <StatusBadge label={selectedOrder.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'} tone={selectedOrder.isPaid ? 'success' : 'warning'} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p><span className="font-semibold text-navy">Người nhận:</span> {selectedOrder.shippingAddress?.fullName || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">SĐT:</span> {selectedOrder.shippingAddress?.phone || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Địa chỉ:</span> {[selectedOrder.shippingAddress?.addressLine, selectedOrder.shippingAddress?.ward, selectedOrder.shippingAddress?.district, selectedOrder.shippingAddress?.city].filter(Boolean).join(', ') || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Thanh toán:</span> {selectedOrder.paymentMethod || '--'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p><span className="font-semibold text-navy">Tạm tính:</span> {formatCurrency(selectedOrder.totalBeforeDiscount || 0)}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Mã giảm giá:</span> {selectedOrder.couponCode || '--'}</p>
                <p className="mt-2"><span className="font-semibold text-navy">Giảm:</span> -{formatCurrency(selectedOrder.discountAmount || 0)}</p>
                <p className="mt-2 text-base font-bold text-navy">Tổng tiền: {formatCurrency(selectedOrder.totalPrice || 0)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {(selectedOrder.items || []).map((item, index) => (
                <div key={`${item.sku || item.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-navy">{item.productName || item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">SKU: {item.sku || '--'} {item.selectedSize ? `· Size: ${item.selectedSize}` : ''}</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {item.quantity} x {formatCurrency(item.price)} = {formatCurrency((item.quantity || 0) * (item.price || 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </AdminModal>
    </section>
  );
}

export default AdminUsersPage;
