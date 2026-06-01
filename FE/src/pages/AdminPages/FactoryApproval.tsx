import { useState, useEffect, useCallback } from 'react';
import AdminUserService from '../../services/adminUserService';
import type { FactoryInfo } from '../../services/adminUserService';

const statusLabels: Record<string, string> = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };

export default function FactoryApproval() {
  const [factories, setFactories] = useState<FactoryInfo[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try { const d = await AdminUserService.getPendingFactories(p, 10); if (d?.content) { setFactories(d.content); setTotalPages(d.totalPages || 1); } }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handleApprove = async (id: number) => { await AdminUserService.approveFactory(id); fetch(page); };

  return (
    <div style={{ padding: '1.5rem' }}>
      {loading && <div style={{ textAlign: 'center', color: '#3b82f6', padding: '0.5rem', background: '#eff6ff', borderRadius: '0.5rem', marginBottom: '1rem' }}>Đang tải...</div>}
      <div style={{ background: '#fff', borderRadius: '0.75rem', boxShadow: '0 20px 40px rgba(0,55,176,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Duyệt xưởng may</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>Phê duyệt hồ sơ xưởng may đăng ký</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ID</th><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tên xưởng</th><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Địa chỉ</th><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Đánh giá</th><th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trạng thái</th><th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Duyệt</th></tr></thead>
            <tbody>
              {factories.length === 0 && !loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Không có xưởng nào chờ duyệt</td></tr>}
              {factories.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#0037b0' }}>#{f.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>{f.factoryName || f.factoryUserName || f.factoryUserEmail || `User #${f.userId}`}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b' }}>{f.address || '-'}</td>
                  <td style={{ padding: '1rem' }}>{f.ratingAvg ? f.ratingAvg + ' ⭐' : '-'}</td>
                  <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: f.verifiedStatus === 'PENDING' ? '#fef9c3' : f.verifiedStatus === 'APPROVED' ? '#dcfce7' : '#fee2e2', color: f.verifiedStatus === 'PENDING' ? '#a16207' : f.verifiedStatus === 'APPROVED' ? '#16a34a' : '#dc2626' }}>{statusLabels[f.verifiedStatus] || f.verifiedStatus}</span></td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {f.verifiedStatus === 'PENDING' && (
                      <button onClick={() => handleApprove(f.id)} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', background: '#0037b0', color: '#fff' }}>Duyệt</button>
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
