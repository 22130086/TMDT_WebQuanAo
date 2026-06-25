import { useState, useEffect, useCallback } from 'react';
import DisputeService from '../../services/disputeService';
import type { Dispute } from '../../services/disputeService';
import '../../styles/admin-table.css';

const statusLabels: Record<string, string> = {
  OPEN: 'Chờ xử lý', ADDITIONAL_INFO_REQUESTED: 'Cần bổ sung', VERDICT_GIVEN: 'Đã phán quyết', CLOSED: 'Đã đóng'
};

const FactoryDisputes = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [showRespond, setShowRespond] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 4000); };

  const fetchDisputes = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = await DisputeService.getFactoryDisputes(p, 10);
      if (d?.content) { setDisputes(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDisputes(page); }, [page, fetchDisputes]);

  const openRespond = (d: Dispute) => { setSelected(d); setResponseText(''); setShowRespond(true); };

  const handleRespond = async () => {
    if (!selected || !responseText.trim()) return; setResponding(true);
    try {
      await DisputeService.factoryRespond(selected.id, responseText.trim());
      showMsg('success', 'Đã gửi phản hồi!'); setShowRespond(false); fetchDisputes(0);
    } catch (e: any) { showMsg('error', e?.response?.data?.message || 'Thất bại'); }
    finally { setResponding(false); }
  };

  const formatMoney = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + ' ₫';

  return (
    <div className="at-container">
      {message && <div className={`wallet-toast ${message.type}`}>{message.text}</div>}
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-header"><h3>Tranh chấp đơn hàng</h3></div>

      <div className={`at-main ${selected && !showRespond ? 'has-detail' : ''}`}>
        <section className="at-section">
          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <thead><tr><th>#</th><th>ĐH</th><th>Người tạo</th><th>Mô tả</th><th>Trạng thái</th><th>Phán quyết</th><th>Ngày</th><th></th></tr></thead>
              <tbody>
                {disputes.length === 0 ? <tr><td colSpan={8} className="wallet-empty">Không có tranh chấp</td></tr> : (
                  disputes.map((d, idx) => (
                    <tr key={d.id}>
                      <td>{idx + 1}</td><td>#{d.orderId}</td>
                      <td>{d.initiatedByName || `#${d.initiatedById}`}</td>
                      <td className="tx-note">{d.description?.slice(0, 60)}{(d.description?.length ?? 0) > 60 ? '...' : ''}</td>
                      <td><span className={`wd-status wd-${d.status === 'OPEN' ? 'pending' : d.status === 'VERDICT_GIVEN' ? 'approved' : 'transferred'}`}>{statusLabels[d.status]}</span></td>
                      <td className="tx-note">{d.verdict || '-'}</td>
                      <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                      <td>
                        <div className="wallet-action-btns">
                          <button className="wallet-btn-sm primary" onClick={() => setSelected(d)}><span className="material-symbols-outlined">visibility</span></button>
                          {(d.status === 'OPEN' || d.status === 'ADDITIONAL_INFO_REQUESTED') && (
                            <button className="wallet-btn-sm" onClick={() => openRespond(d)} style={{ background: '#ecfdf5', color: '#065f46' }} title="Phản hồi"><span className="material-symbols-outlined">reply</span></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="wallet-pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}><span className="material-symbols-outlined">chevron_left</span></button>
              <span>Trang {page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          )}
        </section>

        {selected && !showRespond && (
          <aside className="wallet-detail-panel">
            <div className="wallet-detail-header"><h4>Tranh chấp #{selected.id}</h4>
              <button className="wallet-close-btn" onClick={() => setSelected(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="wallet-detail-info">
              <div className="wallet-detail-row"><span>Đơn hàng:</span> #{selected.orderId}</div>
              <div className="wallet-detail-row"><span>Người tạo:</span> {selected.initiatedByName || `#${selected.initiatedById}`}</div>
              <div className="wallet-detail-row"><span>Trạng thái:</span> {statusLabels[selected.status]}</div>
              <div className="wallet-detail-row"><span>Mô tả:</span> {selected.description}</div>
              {selected.verdict && <div className="wallet-detail-row"><span>Phán quyết:</span> {selected.verdict}</div>}
              {selected.refundToCustomer ? <div className="wallet-detail-row"><span>Hoàn KH:</span> <strong className="tx-positive">{formatMoney(selected.refundToCustomer)}</strong></div> : null}
              {selected.transferToFactory ? <div className="wallet-detail-row"><span>Trả xưởng:</span> <strong className="tx-positive">{formatMoney(selected.transferToFactory)}</strong></div> : null}
              {selected.adminNote && <div className="wallet-detail-row"><span>Ghi chú:</span> {selected.adminNote}</div>}
              <div className="wallet-detail-row"><span>Ngày tạo:</span> {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : '-'}</div>
            </div>
            {(selected.status === 'OPEN' || selected.status === 'ADDITIONAL_INFO_REQUESTED') && (
              <button className="wallet-btn-submit" onClick={() => openRespond(selected)} style={{ width: '100%', marginTop: 12 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>reply</span> Phản hồi</button>
            )}
          </aside>
        )}
      </div>

      {showRespond && selected && (
        <div className="wallet-modal-overlay" onClick={() => setShowRespond(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <h3>Phản hồi tranh chấp #{selected.id}</h3>
            <p className="wallet-modal-sub">Đơn hàng #{selected.orderId}</p>
            <div className="wallet-form-group"><label>Nội dung phản hồi / Bằng chứng</label>
              <textarea rows={5} value={responseText} onChange={e => setResponseText(e.target.value)}
                placeholder="Nhập phản hồi, giải thích hoặc link bằng chứng..."
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical' }} />
            </div>
            <div className="wallet-modal-actions">
              <button className="wallet-btn-cancel" onClick={() => setShowRespond(false)}>Hủy</button>
              <button className="wallet-btn-submit" onClick={handleRespond} disabled={responding}>{responding ? 'Đang gửi...' : 'Gửi phản hồi'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryDisputes;
