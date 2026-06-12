import { useState, useEffect, useCallback } from 'react';
import AdminUserService from '../../services/adminUserService';
import type { UserInfo } from '../../services/adminUserService';
import http from '../../services/http';
import '../../styles/admin-table.css';

const roleLabels: Record<string, string> = { CUSTOMER: 'Khách hàng', FACTORY: 'Xưởng may', ADMIN: 'Admin' };
const roleBadge: Record<string, string> = { CUSTOMER: 'neutral', FACTORY: 'info', ADMIN: 'warning' };
const statusLabels: Record<string, string> = { ACTIVE: 'Hoạt động', LOCKED: 'Bị khóa', PENDING: 'Chờ duyệt' };
const statusBadge: Record<string, string> = { ACTIVE: 'success', LOCKED: 'danger', PENDING: 'warning' };

interface UserStats { userId: number; fullName?: string; email: string; phone?: string; role: string; status: string; createdAt: string; orderCount: number; totalSpent: number; }

export default function UserManagement() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserStats | null>(null);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = await AdminUserService.getUsers(p, 10);
      if (d?.content) { setUsers(d.content); setTotalPages(d.totalPages || 1); setTotal(d.totalElements || 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.fullName?.toLowerCase().includes(search.toLowerCase()) || String(u.id).includes(search);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    const matchDate = (!fromDate || (u.createdAt && u.createdAt >= fromDate)) && (!toDate || (u.createdAt && u.createdAt <= toDate + 'T23:59:59'));
    return matchSearch && matchRole && matchStatus && matchDate;
  });

  const toggleLock = async (u: UserInfo) => {
    if (u.role === 'ADMIN') return;
    if (u.status === 'LOCKED') await AdminUserService.unlockUser(u.id);
    else await AdminUserService.lockUser(u.id);
    fetch(page);
  };

  const formatMoney = (n: number) => n?.toLocaleString('vi-VN') + ' ₫';

  const handleRowClick = async (user: UserInfo) => {
    try {
      const res = await http.get<{ data: UserStats }>(`/admin/users/${user.id}/stats`);
      if (res.data?.data) setSelected(res.data.data);
    } catch { setSelected(null); }
  };

  const clearDate = () => { setFromDate(''); setToDate(''); };

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className={`at-main ${selected ? 'has-detail' : ''}`}>
        <div className="at-section">
          <div className="at-header">
            <div>
              <h3>Danh sách người dùng</h3>
              <p className="subtitle">{total} tài khoản trong hệ thống</p>
            </div>
            <div className="at-toolbar">
              <div className="at-search">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Tìm email, tên..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="at-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">Tất cả vai trò</option>
                <option value="CUSTOMER">Khách hàng</option>
                <option value="FACTORY">Xưởng may</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="LOCKED">Bị khóa</option>
                <option value="PENDING">Chờ duyệt</option>
              </select>
              <div className="at-date-filter">
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Từ ngày" />
                <span className="sep">→</span>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Đến ngày" />
                {(fromDate || toDate) && <button className="at-date-clear" onClick={clearDate}><span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>close</span></button>}
              </div>
            </div>
          </div>

          <div className="at-table-wrap">
            <table className="at-table">
              <thead><tr>
                <th>ID</th><th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Ngày tạo</th><th>Trạng thái</th><th className="center">Hành động</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && !loading && <tr><td colSpan={7} className="at-empty">Không có người dùng nào</td></tr>}
                {filtered.map(u => (
                  <tr key={u.id} onClick={() => handleRowClick(u)} className="clickable">
                    <td><span className="at-id">#{u.id}</span></td>
                    <td>{u.email}</td>
                    <td><span className="at-name">{u.fullName || '-'}</span></td>
                    <td><span className={`at-badge ${roleBadge[u.role] || 'neutral'}`}>{roleLabels[u.role] || u.role}</span></td>
                    <td className="at-date">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td><span className={`at-badge ${statusBadge[u.status] || 'neutral'}`}>{statusLabels[u.status] || u.status}</span></td>
                    <td className="center">
                      {u.role !== 'ADMIN' && (
                        <button className={`at-btn ${u.status === 'LOCKED' ? 'success' : 'danger'}`} onClick={e => { e.stopPropagation(); toggleLock(u); }}>
                          {u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="at-pagination">
            <span className="info">Hiển thị {filtered.length} / {total} người dùng</span>
            <div className="ctrls">
              <button className="at-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><span className="material-symbols-outlined">chevron_left</span></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button key={i} className={`at-page-num ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button className="at-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <aside className="at-detail">
            <div className="at-detail-header">
              <div>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase' }}>Chi tiết người dùng</span>
                <h4>{selected.fullName || selected.email}</h4>
              </div>
              <span className={`at-badge ${roleBadge[selected.role] || 'neutral'}`}>{roleLabels[selected.role] || selected.role}</span>
            </div>
            <div className="at-detail-row"><span>ID</span><strong>#{selected.userId}</strong></div>
            <div className="at-detail-row"><span>Email</span><strong>{selected.email}</strong></div>
            {selected.phone && <div className="at-detail-row"><span>SĐT</span><strong>{selected.phone}</strong></div>}
            <div className="at-detail-row">
              <span>Trạng thái</span>
              <span className={`at-badge ${statusBadge[selected.status] || 'neutral'}`}>{statusLabels[selected.status] || selected.status}</span>
            </div>
            <div className="at-detail-row"><span>Ngày tạo</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</strong></div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />

            <div className="at-detail-row"><span>Tổng đơn hàng</span><strong style={{ fontSize: '1.25rem', color: '#0037b0' }}>{selected.orderCount} đơn</strong></div>
            <div className="at-detail-row"><span>Tổng chi tiêu</span><strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>{formatMoney(selected.totalSpent)}</strong></div>

            <div className="at-detail-actions">
              {selected.role !== 'ADMIN' && (
                <button
                  className={`at-btn ${selected.status === 'LOCKED' ? 'success' : 'danger'}`}
                  onClick={() => {
                    toggleLock({ id: selected.userId, role: selected.role, status: selected.status } as UserInfo);
                    setSelected(prev => prev ? { ...prev, status: prev.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED' } : null);
                  }}
                >
                  {selected.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
