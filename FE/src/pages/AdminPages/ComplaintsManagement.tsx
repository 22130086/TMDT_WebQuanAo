import React, { useState, useEffect, useCallback } from 'react';
import ComplaintService from '../../services/complaintService';
import type { Complaint, ComplaintStats } from '../../services/complaintService';
import '../../styles/complaints-management.css';

const statusLabels: Record<string, string> = {
  OPEN: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
};

const ComplaintsManagement: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({
    totalComplaints: 0,
    openComplaints: 0,
    processingComplaints: 0,
    resolvedComplaints: 0,
    closedComplaints: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const fetchComplaints = useCallback(async (page: number, keyword: string) => {
    setLoading(true);
    try {
      const data = keyword
        ? await ComplaintService.searchComplaints(keyword, page, pageSize)
        : await ComplaintService.getAllComplaints(page, pageSize);
      if (data?.content) {
        setComplaints(data.content);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await ComplaintService.getComplaintStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(currentPage, searchTerm);
    fetchStats();
  }, [currentPage, fetchComplaints, fetchStats]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(0);
    fetchComplaints(0, searchTerm);
  };

  const handleViewDetail = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
  };

  const getStatusText = (status: string): string => {
    return statusLabels[status] || status;
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'OPEN': return 'pending';
      case 'PROCESSING': return 'pending';
      case 'RESOLVED': return 'accepted';
      case 'CLOSED': return 'rejected';
      default: return 'pending';
    }
  };

  const getComplaintType = (reason: string): { type: string; className: string } => {
    const r = reason.toLowerCase();
    if (r.includes('lỗi') || r.includes('defect') || r.includes('hỏng')) {
      return { type: 'Hàng lỗi', className: 'defect' };
    }
    if (r.includes('thiếu') || r.includes('số lượng') || r.includes('missing')) {
      return { type: 'Thiếu số lượng', className: 'quantity' };
    }
    if (r.includes('sai') || r.includes('mẫu') || r.includes('wrong')) {
      return { type: 'Sai mẫu', className: 'wrong-sample' };
    }
    return { type: 'Khác', className: 'defect' };
  };

  const resolvedPercent = stats.totalComplaints > 0
    ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
    : 0;

  return (
    <div className="complaints-container">
      {loading && <div className="loading-bar">Đang tải dữ liệu...</div>}

      {/* Quick Stats */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon total">
              <span className="material-symbols-outlined">all_inbox</span>
            </div>
            <span className="stat-badge">THÁNG NÀY</span>
          </div>
          <div className="stat-value">
            <p className="stat-label">Tổng số khiếu nại</p>
            <p className="stat-number">{stats.totalComplaints}</p>
          </div>
          <div className="stat-trend">
            <span className="material-symbols-outlined">trending_up</span>
            +{stats.openComplaints} đang chờ
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon pending">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="stat-badge" style={{ color: '#f97316' }}>KHẨN CẤP</span>
          </div>
          <div className="stat-value">
            <p className="stat-label">Đang chờ xử lý</p>
            <p className="stat-number">{stats.openComplaints}</p>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Cần phản hồi trong 24h
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon resolved">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <span className="stat-badge" style={{ color: '#22c55e' }}>HOÀN THÀNH</span>
          </div>
          <div className="stat-value">
            <p className="stat-label">Đã giải quyết</p>
            <p className="stat-number">{stats.resolvedComplaints}</p>
          </div>
          <div className="stat-trend success">
            <span className="material-symbols-outlined">check_circle</span>
            Tỉ lệ {resolvedPercent}% thành công
          </div>
        </div>

        <div className="context-image">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCSbc1uAoMZXVuLJ5BVETTrjRncimwHN1aPlCK"
            alt="Factory Process"
          />
          <div className="context-overlay">
            <p>Quy trình kiểm soát chất lượng chuẩn ISO 9001:2022</p>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="table-section">
        <div className="table-header">
          <h3 className="table-title">Danh sách Khiếu nại Gần đây</h3>
          <div className="table-actions">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <button onClick={handleSearchSubmit}>
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>
            <button className="action-btn">
              <span className="material-symbols-outlined">filter_list</span>
              Bộ lọc
            </button>
            <button className="action-btn">
              <span className="material-symbols-outlined">download</span>
              Xuất báo cáo
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mã Đơn / Khách hàng</th>
                <th>Loại Lỗi</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Ngày gửi</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>inbox</span>
                    Không có khiếu nại nào
                  </td>
                </tr>
              )}
              {complaints.map((complaint) => {
                const complaintType = getComplaintType(complaint.reason);
                return (
                  <tr key={complaint.id}>
                    <td>
                      <div className="order-cell">
                        <p className="order-id">#ORD-{complaint.orderId}</p>
                        <p className="customer-name">User #{complaint.raisedById}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`complaint-type ${complaintType.className}`}>
                        <span className="type-dot"></span>
                        {complaintType.type}
                      </span>
                    </td>
                    <td>
                      <p style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {complaint.reason}
                      </p>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(complaint.status)}`}>
                        {getStatusText(complaint.status)}
                      </span>
                    </td>
                    <td>
                      <p className="submit-date">
                        {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </p>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          title="Xem chi tiết"
                          onClick={() => handleViewDetail(complaint)}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button
                          className={`icon-btn ${complaint.status === 'RESOLVED' ? 'disabled success' : ''}`}
                          title={complaint.status === 'RESOLVED' ? 'Đã xử lý' : 'Phản hồi'}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontVariationSettings:
                                complaint.status === 'RESOLVED'
                                  ? "'FILL' 1"
                                  : "'FILL' 0"
                            }}
                          >
                            {complaint.status === 'RESOLVED' ? 'check_circle' : 'reply'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <p className="pagination-info">
            Hiển thị {complaints.length} của {stats.totalComplaints} khiếu nại
          </p>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button
                key={i}
                className={`pagination-page ${i === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(i)}
              >
                {i + 1}
              </button>
            ))}
            {totalPages > 5 && <span className="pagination-ellipsis">...</span>}
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Timeline & Stats */}
      <section className="timeline-section">
        <div className="timeline-container">
          <div className="timeline-header">
            <h4 className="timeline-title">Timeline Xử lý Điển hình</h4>
            <div className="timeline-divider"></div>
          </div>
          <div className="timeline-items">
            <div className="timeline-line"></div>

            <div className="timeline-item">
              <div className="timeline-dot">
                <span className="material-symbols-outlined">mark_as_unread</span>
              </div>
              <div className="timeline-content">
                <h5>Tiếp nhận khiếu nại</h5>
                <p>
                  Khách hàng gửi yêu cầu kèm hình ảnh minh họa qua cổng Portal. Hệ thống tự động phân loại
                  mức độ ưu tiên dựa trên quy mô đơn hàng.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot">
                <span className="material-symbols-outlined">search_check</span>
              </div>
              <div className="timeline-content">
                <h5>Kiểm tra QC nội bộ</h5>
                <p>
                  Đội ngũ QC đối soát mã lô hàng với dữ liệu sản xuất. Xác định nguyên nhân gốc rễ (Máy
                  móc, Nguyên liệu hay Con người).
                </p>
              </div>
            </div>

            <div className="timeline-item inactive">
              <div className="timeline-dot inactive">
                <span className="material-symbols-outlined">assignment_return</span>
              </div>
              <div className="timeline-content">
                <h5>Đề xuất phương án & Phản hồi</h5>
                <p>
                  Xác nhận đền bù, đổi trả hoặc chiết khấu. Gửi thông báo chính thức cho khách hàng trong
                  vòng 48h làm việc.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="stats-card">
            <div>
              <p className="stats-card-label">Chỉ số Hiệu quả</p>
              <p className="stats-card-value">42 Giờ</p>
              <p className="stats-card-desc">Thời gian giải quyết trung bình</p>
              <div className="stats-card-bar">
                <div className="stats-card-bar-fill"></div>
              </div>
              <p className="stats-card-note">Nhanh hơn 15% so với KPI thiết lập</p>
            </div>
            <div className="stats-card-icon">
              <span className="material-symbols-outlined">timer</span>
            </div>
          </div>

          <div className="analysis-card" style={{ marginTop: '1.5rem' }}>
            <h4>Phân tích trạng thái (%)</h4>
            <div className="analysis-items">
              <div className="analysis-item">
                <span className="analysis-label">Đang mở</span>
                <span className="analysis-value">{stats.totalComplaints > 0 ? Math.round((stats.openComplaints / stats.totalComplaints) * 100) : 0}%</span>
              </div>
              <div className="analysis-bar">
                <div className="analysis-bar-fill" style={{ width: `${stats.totalComplaints > 0 ? Math.round((stats.openComplaints / stats.totalComplaints) * 100) : 0}%` }}></div>
              </div>

              <div className="analysis-item">
                <span className="analysis-label">Đang xử lý</span>
                <span className="analysis-value">{stats.totalComplaints > 0 ? Math.round((stats.processingComplaints / stats.totalComplaints) * 100) : 0}%</span>
              </div>
              <div className="analysis-bar">
                <div className="analysis-bar-fill medium" style={{ width: `${stats.totalComplaints > 0 ? Math.round((stats.processingComplaints / stats.totalComplaints) * 100) : 0}%` }}></div>
              </div>

              <div className="analysis-item">
                <span className="analysis-label">Đã giải quyết</span>
                <span className="analysis-value">{resolvedPercent}%</span>
              </div>
              <div className="analysis-bar">
                <div className="analysis-bar-fill light" style={{ width: `${resolvedPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">Chi tiết khiếu nại</h3>
            <div className="modal-body">
              <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Mã đơn hàng
                </label>
                <p>#ORD-{selectedComplaint.orderId}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Người khiếu nại
                </label>
                <p>User #{selectedComplaint.raisedById}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Lý do
                </label>
                <p>{selectedComplaint.reason}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Trạng thái
                </label>
                <span className={`status-badge ${getStatusClass(selectedComplaint.status)}`}>
                  {getStatusText(selectedComplaint.status)}
                </span>
              </div>
              {selectedComplaint.resolution && (
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                    Kết quả giải quyết
                  </label>
                  <p>{selectedComplaint.resolution}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
              <button className="btn-primary">Phản hồi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsManagement;
