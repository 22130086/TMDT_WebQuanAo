import React, { useState, useEffect, useCallback } from 'react';
import DisputeService from '../../services/disputeService';
import type { Dispute, DisputeStats } from '../../services/disputeService';
import '../../styles/disputes-management.css';

const statusLabels: Record<string, string> = {
  OPEN: 'Đang tiếp nhận',
  ADDITIONAL_INFO_REQUESTED: 'Cần bổ sung',
  VERDICT_GIVEN: 'Đã phán quyết',
  CLOSED: 'Đã đóng',
};

const statusClasses: Record<string, string> = {
  OPEN: 'open',
  ADDITIONAL_INFO_REQUESTED: 'info-requested',
  VERDICT_GIVEN: 'verdict-given',
  CLOSED: 'closed',
};

const DisputesManagement: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats>({ total: 0, open: 0, infoRequested: 0, verdictGiven: 0, closed: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerdictModal, setShowVerdictModal] = useState(false);
  const [verdictDispute, setVerdictDispute] = useState<Dispute | null>(null);
  const [verdictText, setVerdictText] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [verdictNote, setVerdictNote] = useState('');
  const pageSize = 10;

  const fetchDisputes = useCallback(async (page: number, keyword: string) => {
    setLoading(true);
    try {
      const data = keyword
        ? await DisputeService.search(keyword, page, pageSize)
        : await DisputeService.getAll(page, pageSize);
      if (data?.content) {
        setDisputes(data.content);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await DisputeService.getStats();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to fetch dispute stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchDisputes(currentPage, searchTerm);
    fetchStats();
  }, [currentPage, fetchDisputes, fetchStats]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setCurrentPage(0);
      fetchDisputes(0, searchTerm);
    }
  };

  const getStatusText = (s: string) => statusLabels[s] || s;
  const getStatusClass = (s: string) => statusClasses[s] || 'open';

  const openVerdict = (d: Dispute) => {
    setVerdictDispute(d);
    setVerdictText('');
    setRefundAmount('');
    setTransferAmount('');
    setVerdictNote('');
    setShowVerdictModal(true);
  };

  const submitVerdict = async () => {
    if (!verdictDispute || !verdictText.trim()) return;
    await DisputeService.giveVerdict(verdictDispute.id, {
      verdict: verdictText,
      refundToCustomer: refundAmount ? Number(refundAmount) : 0,
      transferToFactory: transferAmount ? Number(transferAmount) : 0,
      adminNote: verdictNote
    });
    setShowVerdictModal(false);
    fetchDisputes(currentPage, searchTerm);
    fetchStats();
  };

  const handleRequestInfo = async (d: Dispute) => {
    const note = prompt('Yêu cầu bổ sung thông tin gì?');
    if (!note) return;
    await DisputeService.requestInfo(d.id, note);
    fetchDisputes(currentPage, searchTerm);
    fetchStats();
  };

  const openCount = stats.open;
  const total = stats.total;

  return (
    <div className="disputes-container">
      {loading && <div className="loading-bar">Đang tải dữ liệu...</div>}

      {/* Stats */}
      <section className="disputes-stats-grid">
        <div className="disputes-stat-card">
          <p className="disputes-stat-label">TỔNG HỒ SƠ</p>
          <h3 className="disputes-stat-number">{total}</h3>
          <div className="disputes-stat-sub green">
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>trending_up</span>
            +12% so với tháng trước
          </div>
        </div>
        <div className="disputes-stat-card">
          <p className="disputes-stat-label">ĐANG XỬ LÝ</p>
          <h3 className="disputes-stat-number" style={{ color: '#0058be' }}>{openCount}</h3>
          <div className="disputes-stat-sub gray">Yêu cầu xử lý trong 24h</div>
        </div>
        <div className="disputes-stat-card">
          <p className="disputes-stat-label">CẦN BỔ SUNG</p>
          <h3 className="disputes-stat-number" style={{ color: '#7f2500' }}>{stats.infoRequested}</h3>
          <div className="disputes-stat-sub orange">
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>priority_high</span>
            Chờ phản hồi đối tác
          </div>
        </div>
        <div className="disputes-stat-card">
          <p className="disputes-stat-label">ĐÃ GIẢI QUYẾT</p>
          <h3 className="disputes-stat-number" style={{ color: '#94a3b8' }}>{stats.verdictGiven + stats.closed}</h3>
          <div className="disputes-stat-sub green">98.2% Tỷ lệ hài lòng</div>
        </div>
      </section>

      {/* Main Content */}
      <div className="disputes-content-grid">
        {/* Table */}
        <section className="disputes-table-section">
          <div className="disputes-table-header">
            <div>
              <h3>Danh sách hồ sơ tranh chấp</h3>
              <p>Quản lý và đưa ra phán quyết cho các yêu cầu hiện hành</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="disputes-search">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm mã hồ sơ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              <button className="disputes-btn disputes-btn-secondary">
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>filter_list</span>
                Lọc
              </button>
              <button className="disputes-btn disputes-btn-primary">
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>download</span>
                Xuất báo cáo
              </button>
            </div>
          </div>

          <div className="disputes-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>HỒ SƠ &amp; NGÀY TẠO</th>
                  <th>CÁC BÊN LIÊN QUAN</th>
                  <th>NỘI DUNG</th>
                  <th>TRẠNG THÁI</th>
                  <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {disputes.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      Không có hồ sơ tranh chấp nào
                    </td>
                  </tr>
                )}
                {disputes.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="dispute-id">#DISP-{d.id}</div>
                      <div className="dispute-date">
                        {d.createdAt ? new Date(d.createdAt).toLocaleString('vi-VN') : '-'}
                      </div>
                    </td>
                    <td>
                      <div className="dispute-parties">
                        <div className="dispute-party">
                          <span className="dispute-party-dot customer"></span>
                          <span>Khách: {d.initiatedByName || `User #${d.initiatedById}`}</span>
                        </div>
                        <div className="dispute-party">
                          <span className="dispute-party-dot factory"></span>
                          <span>Đơn: #ORD-{d.orderId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="dispute-desc">{d.description}</p>
                    </td>
                    <td>
                      <span className={`dispute-status ${getStatusClass(d.status)}`}>
                        {getStatusText(d.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {d.status === 'VERDICT_GIVEN' || d.status === 'CLOSED' ? (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>Hoàn thành</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <button className="dispute-action-btn" onClick={() => openVerdict(d)}>Đưa ra phán quyết</button>
                          {d.status === 'OPEN' && (
                            <button className="dispute-action-btn" style={{ background: '#f97316' }} onClick={() => handleRequestInfo(d)}>Yêu cầu bổ sung</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="disputes-pagination">
            <p className="disputes-pagination-info">Hiển thị {disputes.length} của {total} hồ sơ</p>
            <div className="disputes-pagination-controls">
              <button className="pagination-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button key={i} className={`pagination-page ${i === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(i)}>
                  {i + 1}
                </button>
              ))}
              {totalPages > 5 && <span style={{ padding: '0 0.5rem', color: '#cbd5e1' }}>...</span>}
              <button className="pagination-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="disputes-sidebar">
          {/* Violation Reports */}
          <section className="violation-card">
            <div className="violation-card-header">
              <h4>Báo cáo vi phạm</h4>
              <span className="material-symbols-outlined" style={{ color: '#7f2500', fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="violation-item">
                <div className="violation-icon warning">
                  <span className="material-symbols-outlined">factory</span>
                </div>
                <div className="violation-info">
                  <div className="violation-name-row">
                    <span className="violation-name">Dệt Kim Thăng Long</span>
                    <span className="violation-badge danger">CẢNH BÁO</span>
                  </div>
                  <p className="violation-desc">8 vi phạm / 3 tháng qua</p>
                  <div className="violation-bar"><div className="violation-bar-fill danger" style={{ width: '85%' }}></div></div>
                </div>
              </div>
              <div className="violation-item">
                <div className="violation-icon info">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="violation-info">
                  <div className="violation-name-row">
                    <span className="violation-name">Nguyễn Văn Đại (Khách)</span>
                    <span className="violation-badge warn">THEO DÕI</span>
                  </div>
                  <p className="violation-desc">3 vi phạm / 1 tháng qua</p>
                  <div className="violation-bar"><div className="violation-bar-fill warn" style={{ width: '45%' }}></div></div>
                </div>
              </div>
              <div className="violation-item">
                <div className="violation-icon warning">
                  <span className="material-symbols-outlined">factory</span>
                </div>
                <div className="violation-info">
                  <div className="violation-name-row">
                    <span className="violation-name">Garment Pro 02</span>
                  </div>
                  <p className="violation-desc">2 vi phạm / 6 tháng qua</p>
                  <div className="violation-bar"><div className="violation-bar-fill low" style={{ width: '20%' }}></div></div>
                </div>
              </div>
            </div>
            <button className="violation-view-all">Xem tất cả báo cáo</button>
          </section>

          {/* Verdict Assistant */}
          <section className="verdict-card">
            <div className="verdict-card-glow"></div>
            <h4>Trình phán quyết nhanh</h4>
            <p className="verdict-card-desc">Xử lý khấu trừ hoặc chuyển tiền tự động dựa trên bằng chứng đã xác minh.</p>
            <div className="verdict-urgent">
              <div className="verdict-urgent-label">Hồ sơ chờ xử lý gấp</div>
              <div className="verdict-urgent-id">#DISP-240501</div>
            </div>
            <button className="verdict-start-btn">Bắt đầu thẩm định</button>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="disputes-footer">
        <p>© 2024 FactoryOS - Hệ thống quản lý sản xuất Blueprint Orchestrator</p>
        <div className="disputes-footer-links">
          <a href="#">Quyền riêng tư</a>
          <a href="#">Hướng dẫn</a>
          <a href="#">Hỗ trợ</a>
        </div>
      </footer>

      {/* Verdict Modal */}
      {showVerdictModal && verdictDispute && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowVerdictModal(false)}>
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>Phán quyết #{verdictDispute.id}</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>{verdictDispute.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.75rem' }}>Nội dung phán quyết *</label>
                <textarea rows={3} value={verdictText} onChange={e => setVerdictText(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem' }} placeholder="Nhập phán quyết..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.75rem' }}>Hoàn tiền khách (₫)</label>
                  <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.75rem' }}>Chuyển cho xưởng (₫)</label>
                  <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem' }} />
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.75rem' }}>Ghi chú admin</label>
                <input value={verdictNote} onChange={e => setVerdictNote(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowVerdictModal(false)} style={{ padding: '0.75rem 1.5rem', background: '#e2e8f0', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button onClick={submitVerdict} style={{ padding: '0.75rem 1.5rem', background: '#0037b0', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Xác nhận phán quyết</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesManagement;
