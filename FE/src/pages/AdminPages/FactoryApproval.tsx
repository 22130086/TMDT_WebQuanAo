import { useState, useEffect, useCallback } from 'react';
import AdminUserService from '../../services/adminUserService';
import type { FactoryInfo, CertificateItem } from '../../services/adminUserService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' };
const statusBadge: Record<string, string> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };

export default function FactoryApproval() {
  const [factories, setFactories] = useState<FactoryInfo[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FactoryInfo | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = await AdminUserService.getPendingFactories(p, 10);
      if (d?.content) { setFactories(d.content); setTotalPages(d.totalPages || 1); setTotal(d.totalElements || 0); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handleApprove = async (id: number) => {
    await AdminUserService.approveFactory(id);
    setSelected(prev => prev?.id === id ? { ...prev, verifiedStatus: 'APPROVED' } : prev);
    fetch(page);
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    await AdminUserService.rejectFactory(id, reason);
    setSelected(prev => prev?.id === id ? { ...prev, verifiedStatus: 'REJECTED', rejectedReason: reason } : prev);
    fetch(page);
  };

  const handleRowClick = async (f: FactoryInfo) => {
    try {
      const detail = await AdminUserService.getFactoryDetail(f.id);
      if (detail) setSelected(detail);
    } catch { setSelected(f); }
  };

  const filtered = factories.filter(f => {
    const matchSearch = !search || (f.factoryName || '').toLowerCase().includes(search.toLowerCase()) || (f.address || '').toLowerCase().includes(search.toLowerCase()) || String(f.id).includes(search);
    const matchStatus = !statusFilter || f.verifiedStatus === statusFilter;
    const matchDate = (!fromDate || (f.createdAt && f.createdAt >= fromDate)) && (!toDate || (f.createdAt && f.createdAt <= toDate + 'T23:59:59'));
    return matchSearch && matchStatus && matchDate;
  });

  const clearDate = () => { setFromDate(''); setToDate(''); };
  const API_BASE = 'http://localhost:8080';

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}
      {selectedImage && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }} onClick={() => setSelectedImage(null)}>
          <img src={API_BASE + selectedImage} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '0.5rem' }} />
        </div>
      )}

      <div className={`at-main ${selected ? 'has-detail' : ''}`}>
        <div className="at-section">
          <div className="at-header">
            <div>
              <h3>Duyệt xưởng may</h3>
              <p className="subtitle">Phê duyệt hồ sơ xưởng may đăng ký · {total} hồ sơ</p>
            </div>
            <div className="at-toolbar">
              <div className="at-search">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Tìm tên, địa chỉ..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="at-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
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
                <th>ID</th><th>Tên xưởng</th><th>Địa chỉ</th><th>Đánh giá</th><th>Ngày đăng ký</th><th>Trạng thái</th><th className="center">Hành động</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && !loading && <tr><td colSpan={7} className="at-empty">Không có xưởng nào</td></tr>}
                {filtered.map(f => (
                  <tr key={f.id} onClick={() => handleRowClick(f)} className="clickable">
                    <td><span className="at-id">#{f.id}</span></td>
                    <td><span className="at-name">{f.factoryName || f.factoryUserName || f.factoryUserEmail || `User #${f.userId}`}</span></td>
                    <td className="at-sub">{f.address || '-'}</td>
                    <td>{f.ratingAvg ? f.ratingAvg + ' ⭐' : '-'}</td>
                    <td className="at-date">{f.createdAt ? new Date(f.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td><span className={`at-badge ${statusBadge[f.verifiedStatus] || 'neutral'}`}>{statusLabels[f.verifiedStatus] || f.verifiedStatus}</span></td>
                    <td className="center" onClick={e => e.stopPropagation()}>
                      {f.verifiedStatus === 'PENDING' && (
                        <>
                          <button className="at-btn success" style={{ marginRight: '0.25rem' }} onClick={() => handleApprove(f.id)}>Duyệt</button>
                          <button className="at-btn danger" onClick={() => handleReject(f.id)}>Từ chối</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="at-pagination">
            <span className="info">Hiển thị {filtered.length} / {total} hồ sơ</span>
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
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase' }}>Chi tiết hồ sơ xưởng</span>
                <h4>{selected.factoryName || `Xưởng #${selected.id}`}</h4>
              </div>
              <span className={`at-badge ${statusBadge[selected.verifiedStatus] || 'neutral'}`}>{statusLabels[selected.verifiedStatus] || selected.verifiedStatus}</span>
            </div>
            <div className="at-detail-row"><span>ID</span><strong>#{selected.id}</strong></div>
            <div className="at-detail-row"><span>Chủ xưởng</span><strong>{selected.factoryUserName || 'N/A'}</strong></div>
            <div className="at-detail-row"><span>Email</span><strong>{selected.factoryUserEmail || 'N/A'}</strong></div>
            <div className="at-detail-row"><span>Địa chỉ</span><strong style={{ fontSize: '0.8rem' }}>{selected.address || '-'}</strong></div>
            {selected.description && <div className="at-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}><span>Mô tả</span><strong style={{ fontSize: '0.8rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{selected.description}</strong></div>}
            <div className="at-detail-row"><span>SL tối thiểu</span><strong>{selected.minQuantity || '-'}</strong></div>
            <div className="at-detail-row"><span>SL tối đa</span><strong>{selected.maxQuantity || '-'}</strong></div>
            <div className="at-detail-row"><span>Thời gian SX</span><strong>{selected.leadTimeDays ? `${selected.leadTimeDays} ngày` : '-'}</strong></div>
            <div className="at-detail-row"><span>Ngày đăng ký</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</strong></div>
            {selected.verifiedAt && <div className="at-detail-row"><span>Ngày duyệt</span><strong>{new Date(selected.verifiedAt).toLocaleString('vi-VN')}</strong></div>}
            {selected.rejectedReason && <div className="at-detail-row"><span>Lý do từ chối</span><strong style={{ color: '#dc2626', fontSize: '0.8rem' }}>{selected.rejectedReason}</strong></div>}
            {selected.factoryUserAvatar && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase', marginBottom: '0.5rem' }}>📜 Giấy phép kinh doanh</div>
                <img src={API_BASE + selected.factoryUserAvatar} alt="Giấy phép" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', cursor: 'pointer', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} onClick={() => setSelectedImage(selected.factoryUserAvatar!)} />
              </>
            )}

            {selected.imageUrls && selected.imageUrls.length > 0 && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Hình ảnh xưởng ({selected.imageUrls.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {selected.imageUrls.map((url, i) => (
                    <img key={i} src={API_BASE + url} alt={`Factory ${i + 1}`}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '0.375rem', cursor: 'pointer', border: '1px solid #e2e8f0' }}
                      onClick={() => setSelectedImage(url)} />
                  ))}
                </div>
              </>
            )}

            {selected.certificates && selected.certificates.length > 0 && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Chứng chỉ / Giấy phép ({selected.certificates.length})</div>
                {selected.certificates.map((cert: CertificateItem) => (
                  <div key={cert.id} style={{ marginBottom: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, background: '#f8fafc' }}>
                      {cert.name}
                      {cert.issuedDate && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '0.5rem' }}>{cert.issuedDate} {cert.expiredDate ? `→ ${cert.expiredDate}` : ''}</span>}
                    </div>
                    {cert.imageUrl && (
                      <img src={API_BASE + cert.imageUrl} alt={cert.name}
                        style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', cursor: 'pointer', background: '#f1f5f9' }}
                        onClick={() => setSelectedImage(cert.imageUrl)} />
                    )}
                  </div>
                ))}
              </>
            )}

            <div className="at-detail-actions">
              {selected.verifiedStatus === 'PENDING' && (
                <>
                  <button className="at-btn success" onClick={() => handleApprove(selected.id)}>
                    <span className="material-symbols-outlined">check_circle</span> Duyệt hồ sơ
                  </button>
                  <button className="at-btn danger" onClick={() => handleReject(selected.id)}>
                    <span className="material-symbols-outlined">cancel</span> Từ chối
                  </button>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
