import React, { useState, useEffect, useCallback } from 'react';
import AdminPostService, { type OutsourcingPostData } from '../../services/adminPostService';
import '../../styles/admin-table.css';

const BACKEND_HOST = import.meta.env.VITE_API_BASE_URL
  ? new URL(import.meta.env.VITE_API_BASE_URL).origin
  : 'http://localhost:8080';

const imgUrl = (path: string | undefined) => path ? `${BACKEND_HOST}${path}` : '';

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ duyệt', OPEN: 'Đang mở', IN_PROGRESS: 'Đang thực hiện', CLOSED: 'Đã đóng', CANCELLED: 'Đã hủy'
};

const statusColors: Record<string, string> = {
  PENDING: 'warning', OPEN: 'success', IN_PROGRESS: 'info', CLOSED: 'secondary', CANCELLED: 'danger'
};

const PostManagement: React.FC = () => {
  const [data, setData] = useState<OutsourcingPostData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<OutsourcingPostData | null>(null);
  const [loading, setLoading] = useState(false);

  const pageSize = 10;

  const fetchData = useCallback(async (p: number, f: string) => {
    setLoading(true);
    try {
      const d = await AdminPostService.getAll(f || undefined, p, pageSize);
      if (d?.content) {
        setData(d.content);
        setTotalPages(d.totalPages || 1);
        setTotalElements(d.totalElements || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(page, filter); }, [page, filter, fetchData]);

  const formatMoney = (n?: number) => n ? n.toLocaleString('vi-VN') + ' ₫' : '-';

  const filteredData = search
    ? data.filter(d =>
        (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
        String(d.id).includes(search) ||
        (d.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const handleClose = async (id: number) => {
    const reason = prompt('Lý do đóng bài đăng:');
    if (reason === null) return;
    await AdminPostService.close(id, reason || undefined);
    fetchData(page, filter);
  };

  const handleApprove = async (id: number) => {
    await AdminPostService.approve(id);
    fetchData(page, filter);
    setSelected(null);
  };

  const handleDelete = async (id: number) => {
    const reason = prompt('Lý do xóa bài đăng:');
    if (reason === null) return;
    await AdminPostService.delete(id, reason || undefined);
    setSelected(null);
    fetchData(page, filter);
  };

  const handleRowClick = async (item: OutsourcingPostData) => {
    try {
      const detail = await AdminPostService.getById(item.id);
      if (detail) setSelected(detail);
    } catch { setSelected(item); }
  };

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className={`at-main ${selected ? 'has-detail' : ''}`}>
        {/* Table */}
        <section className="at-section">
          <div className="at-header">
            <h3>Danh sách Bài đăng tìm xưởng</h3>
            <div className="at-toolbar">
              <div className="at-search">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="at-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="OPEN">Đang mở</option>
                <option value="IN_PROGRESS">Đang thực hiện</option>
                <option value="CLOSED">Đã đóng</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
          <div className="at-table-wrap">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Mã bài</th>
                  <th>Tiêu đề</th>
                  <th>Khách hàng</th>
                  <th className="right">SL</th>
                  <th>Ngân sách</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 && !loading && (
                  <tr><td colSpan={8} className="at-empty">Không có bài đăng nào</td></tr>
                )}
                {filteredData.map(d => (
                  <tr key={d.id} onClick={() => handleRowClick(d)} className="clickable">
                    <td><span className="at-id">#BD-{d.id}</span></td>
                    <td>
                      <span className="at-name" style={{ maxWidth: '180px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.title}
                      </span>
                    </td>
                    <td><span className="at-name">{d.customerName || 'N/A'}</span></td>
                    <td className="right">{d.quantity}</td>
                    <td>
                      <span className="at-sub">
                        {d.budgetMin ? formatMoney(d.budgetMin) : '?'} - {d.budgetMax ? formatMoney(d.budgetMax) : '?'}
                      </span>
                    </td>
                    <td>
                      <span className={`at-badge ${statusColors[d.status] || 'info'}`}>
                        {statusLabels[d.status] || d.status}
                      </span>
                    </td>
                    <td className="at-date">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>
                      <div className="at-actions">
                        {d.status === 'PENDING' && (
                          <button className="at-btn success icon-only" title="Duyệt bài" onClick={e => { e.stopPropagation(); handleApprove(d.id); }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check</span>
                          </button>
                        )}
                        {d.status === 'OPEN' && (
                          <button
                            className="at-btn warning icon-only"
                            title="Đóng bài đăng"
                            onClick={e => { e.stopPropagation(); handleClose(d.id); }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>lock</span>
                          </button>
                        )}
                        <button
                          className="at-btn danger icon-only"
                          title="Xóa bài đăng"
                          onClick={e => { e.stopPropagation(); handleDelete(d.id); }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="at-pagination">
            <span className="info">Hiển thị {data.length} / {totalElements}</span>
            <div className="ctrls">
              <button className="at-page-btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button key={i} className={`at-page-num ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              ))}
              <button className="at-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* Detail Panel */}
        {selected && (
          <aside className="at-detail">
            <div className="at-detail-header">
              <div>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0037b0', textTransform: 'uppercase' }}>Chi tiết bài đăng</span>
                <h4>{selected.title}</h4>
              </div>
              <span className="material-symbols-outlined" style={{ color: '#0037b0', fontSize: '2rem' }}>post_add</span>
            </div>
            <div className="at-detail-row"><span>Mã bài</span><strong>#BD-{selected.id}</strong></div>
            <div className="at-detail-row"><span>Khách hàng</span><strong>{selected.customerName || 'N/A'}</strong></div>
            <div className="at-detail-row"><span>Mã KH</span><strong>#{selected.customerId || 'N/A'}</strong></div>
            <div className="at-detail-row"><span>Số lượng</span><strong>{selected.quantity}</strong></div>
            <div className="at-detail-row"><span>Ngân sách</span><strong>{formatMoney(selected.budgetMin)} - {formatMoney(selected.budgetMax)}</strong></div>
            {selected.deadline && <div className="at-detail-row"><span>Hạn chót</span><strong>{new Date(selected.deadline).toLocaleDateString('vi-VN')}</strong></div>}
            {selected.categoryName && <div className="at-detail-row"><span>Danh mục</span><strong>{selected.categoryName}</strong></div>}
            <div className="at-detail-row">
              <span>Trạng thái</span>
              <span className={`at-badge ${statusColors[selected.status] || 'info'}`}>{statusLabels[selected.status] || selected.status}</span>
            </div>
            <div className="at-detail-row"><span>Ngày tạo</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</strong></div>
            {selected.description && (
              <div className="at-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span>Mô tả</span>
                <strong style={{ fontSize: '0.8rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{selected.description}</strong>
              </div>
            )}

            {/* Ảnh thiết kế */}
            {(selected.designFileUrl || selected.designFileUrlBack) && (
              <div className="at-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <span>Ảnh thiết kế</span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {selected.designFileUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: 4 }}>Mặt trước</div>
                      <img src={imgUrl(selected.designFileUrl)} alt="Mặt trước" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, border: '1px solid #e2e8f0', objectFit: 'contain' }} />
                    </div>
                  )}
                  {selected.designFileUrlBack && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: 4 }}>Mặt sau</div>
                      <img src={imgUrl(selected.designFileUrlBack)} alt="Mặt sau" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, border: '1px solid #e2e8f0', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="at-detail-actions">
              {selected.status === 'PENDING' && (
                <button className="at-btn success" onClick={() => handleApprove(selected.id)}>
                  <span className="material-symbols-outlined">check</span> Duyệt bài
                </button>
              )}
              {selected.status === 'OPEN' && (
                <button className="at-btn warning" onClick={() => handleClose(selected.id)}>
                  <span className="material-symbols-outlined">lock</span> Đóng bài đăng
                </button>
              )}
              <button className="at-btn danger" onClick={() => handleDelete(selected.id)}>
                <span className="material-symbols-outlined">delete</span> Xóa bài đăng
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default PostManagement;
