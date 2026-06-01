import { useState, useEffect, useCallback } from 'react';
import AdminUserService from '../../services/adminUserService';
import type { UserInfo } from '../../services/adminUserService';

const roleLabels: Record<string, string> = { CUSTOMER: 'Khách hàng', FACTORY: 'Xưởng may', ADMIN: 'Admin' };
const statusLabels: Record<string, string> = { ACTIVE: 'Hoạt động', LOCKED: 'Bị khóa', PENDING: 'Chờ duyệt' };

export default function UserManagement() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try { const d = await AdminUserService.getUsers(p, 10); if (d?.content) { setUsers(d.content); setTotalPages(d.totalPages || 1); } }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const toggleLock = async (u: UserInfo) => {
    if (u.role === 'ADMIN') return;
    if (u.status === 'LOCKED') await AdminUserService.unlockUser(u.id);
    else await AdminUserService.lockUser(u.id);
    fetch(page);
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      {loading && <div style={{ textAlign: 'center', color: '#3b82f6', padding: '0.5rem', background: '#eff6ff', borderRadius: '0.5rem', marginBottom: '1rem' }}>Đang tải...</div>}
      <div style={{ background: '#fff', borderRadius: '0.75rem', boxShadow: '0 20px 40px rgba(0,55,176,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}><h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Danh sách người dùng</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ID</th><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Email</th><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Họ tên</th><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vai trò</th><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trạng thái</th><th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Hành động</th></tr></thead>
            <tbody>
              {users.length === 0 && !loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Không có người dùng nào</td></tr>}
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#0037b0' }}>#{u.id}</td>
                  <td style={{ padding: '1rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>{u.fullName || '-'}</td>
                  <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: u.role === 'ADMIN' ? '#fef3c7' : u.role === 'FACTORY' ? '#dbeafe' : '#f3f4f6', color: u.role === 'ADMIN' ? '#a16207' : u.role === 'FACTORY' ? '#1d4ed8' : '#475569' }}>{roleLabels[u.role] || u.role}</span></td>
                  <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: u.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>{statusLabels[u.status] || u.status}</span></td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {u.role !== 'ADMIN' && (
                      <button onClick={() => toggleLock(u)} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', background: u.status === 'LOCKED' ? '#dcfce7' : '#fee2e2', color: u.status === 'LOCKED' ? '#16a34a' : '#dc2626' }}>
                        {u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Trang {page + 1} / {totalPages}</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}>←</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
