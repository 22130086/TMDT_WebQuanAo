import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminProductService from '../../services/adminProductService';
import type { ProductItem } from '../../services/adminProductService';

const statusLabels: Record<string, string> = { PENDING: 'Chờ duyệt', ACTIVE: 'Hoạt động', HIDDEN: 'Đã ẩn', REJECTED: 'Từ chối', DRAFT: 'Nháp' };

export default function ProductManagement() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = tab === 'pending'
        ? await AdminProductService.getPending(p, 10)
        : await AdminProductService.getAll(keyword || undefined, p, 10);
      if (d?.content) { setProducts(d.content); setTotalPages(d.totalPages || 1); setTotal(d.totalElements || 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab, keyword]);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handleApprove = async (id: number) => { await AdminProductService.approve(id); fetch(page); };
  const handleReject = async (id: number) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    await AdminProductService.reject(id, reason);
    fetch(page);
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      {loading && <div style={{ textAlign: 'center', color: '#3b82f6', padding: '0.5rem', background: '#eff6ff', borderRadius: '0.5rem', marginBottom: '1rem' }}>Đang tải...</div>}
      <div style={{ background: '#fff', borderRadius: '0.75rem', boxShadow: '0 20px 40px rgba(0,55,176,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setTab('all'); setPage(0); }} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', background: tab === 'all' ? '#0037b0' : '#f1f5f9', color: tab === 'all' ? '#fff' : '#475569' }}>Tất cả</button>
            <button onClick={() => { setTab('pending'); setPage(0); }} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', background: tab === 'pending' ? '#f97316' : '#f1f5f9', color: tab === 'pending' ? '#fff' : '#475569' }}>Chờ duyệt</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input placeholder="Tìm kiếm..." value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(0), fetch(0))} style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tên sản phẩm</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Giá</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Xưởng</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ngày tạo</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trạng thái</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Hành động</th>
            </tr></thead>
            <tbody>
              {products.length === 0 && !loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Không có sản phẩm nào</td></tr>}
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.imageUrls?.[0] && <img src={p.imageUrls[0]} alt="" style={{ width: 40, height: 40, borderRadius: '0.5rem', objectFit: 'cover' }} />}
                      <div>
                        <p style={{ fontWeight: 700 }}>{p.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>{p.price?.toLocaleString('vi-VN')} ₫</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{p.factoryName || `Xưởng #${p.factoryId}`}</td>
                  <td style={{ padding: '1rem', fontSize: '0.75rem', color: '#64748b' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: p.status === 'ACTIVE' ? '#dcfce7' : p.status === 'PENDING' ? '#fef9c3' : p.status === 'REJECTED' ? '#fee2e2' : '#f3f4f6', color: p.status === 'ACTIVE' ? '#16a34a' : p.status === 'PENDING' ? '#a16207' : p.status === 'REJECTED' ? '#dc2626' : '#64748b' }}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {p.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button onClick={() => handleApprove(p.id)} style={{ padding: '0.3rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, background: '#0037b0', color: '#fff' }}>Duyệt</button>
                        <button onClick={() => handleReject(p.id)} style={{ padding: '0.3rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>Từ chối</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{total} sản phẩm · Trang {page + 1}/{totalPages || 1}</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}>←</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{ width: '2rem', height: '2rem', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', background: i === page ? '#0037b0' : 'transparent', color: i === page ? '#fff' : '#475569', fontWeight: 700, fontSize: '0.75rem' }}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
