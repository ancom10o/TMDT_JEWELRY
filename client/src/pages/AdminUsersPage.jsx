import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '../components/admin/AdminPageHeader.jsx';
import DataTable from '../components/admin/DataTable.jsx';
import FilterBar from '../components/admin/FilterBar.jsx';
import StatusBadge from '../components/admin/StatusBadge.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getUsers, updateUser } from '../services/api.js';

function formatDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));
}

function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = searchKeyword.trim().toLowerCase();
      return keyword
        ? [user.fullName, user.email].filter(Boolean).some((value) => value.toLowerCase().includes(keyword))
        : true;
    });
  }, [users, searchKeyword]);

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

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Người dùng"
        title="Quản lý người dùng"
        description="Tìm kiếm theo tên hoặc email, cấp quyền user-admin và khóa hoặc mở tài khoản nếu backend hỗ trợ."
        meta={loading ? 'Đang tải người dùng...' : `${filteredUsers.length} tài khoản`}
      />

      {errorMessage ? <div className="state-error">{errorMessage}</div> : null}

      <FilterBar>
        <input value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} placeholder="Tìm theo tên hoặc email..." className="input-field sm:max-w-sm" />
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
    </section>
  );
}

export default AdminUsersPage;
