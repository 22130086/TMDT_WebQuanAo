import { useEffect, useState } from "react";
import http from "../../services/http";
import "../../styles/admin-table.css";

interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: string;
  reply: string | null;
  repliedAt: string | null;
  isReported?: boolean;
}

export default function FactoryReviewManagement() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await http.get(`/factory/reviews/products?page=${p}&size=20`);
      if (res.data?.data) {
        setReviews(res.data.data.content || []);
        setTotalPages(res.data.data.totalPages || 1);
      } else {
        setReviews([]);
      }
    } catch (err: any) {
      console.error("Lỗi tải đánh giá:", err);
      setError(err.response?.data?.message || "Không thể tải đánh giá. Kiểm tra quyền truy cập.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(page); }, [page]);

  const handleReply = async (reviewId: number) => {
    if (!replyText.trim()) return;
    try {
      await http.patch(`/factory/reviews/${reviewId}/reply?reply=${encodeURIComponent(replyText.trim())}`);
      alert("Phản hồi thành công!");
      setReplyingId(null);
      setReplyText("");
      fetchReviews(page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi phản hồi");
    }
  };

  const handleReport = async (reviewId: number) => {
    if (!window.confirm("Báo cáo đánh giá này? Admin sẽ xem xét.")) return;
    try {
      await http.patch(`/factory/reviews/${reviewId}/report`);
      alert("Đã báo cáo! Admin sẽ xem xét đánh giá này.");
      fetchReviews(page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi báo cáo");
    }
  };

  const formatDate = (s: string) => s ? new Date(s).toLocaleDateString("vi-VN") : "";

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Quản lý đánh giá sản phẩm</h2>

      {loading ? (
        <p style={{ textAlign: "center", padding: 40, color: "#888" }}>Đang tải...</p>
      ) : error ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>
          <button onClick={() => fetchReviews(page)} style={{ padding: "8px 20px", background: "#0037b0", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>Thử lại</button>
        </div>
      ) : reviews.length === 0 ? (
        <p style={{ textAlign: "center", padding: 40, color: "#888" }}>Chưa có đánh giá nào.</p>
      ) : (
        <div className="at-table-wrap">
          <table className="at-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Đánh giá</th>
                <th>Nội dung</th>
                <th>Phản hồi</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} style={r.isReported ? { background: '#fef2f2' } : undefined}>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{"⭐".repeat(r.rating)}</td>
                  <td style={{ maxWidth: 250, fontSize: "0.85rem" }}>{r.comment}</td>
                  <td style={{ fontSize: "0.8rem" }}>
                    {r.reply ? (
                      <div>
                        <span style={{ color: "#059669" }}>{r.reply}</span>
                        {r.repliedAt && <div style={{ fontSize: "0.7rem", color: "#999" }}>{formatDate(r.repliedAt)}</div>}
                      </div>
                    ) : replyingId === r.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Nhập phản hồi..."
                          style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13, width: 150 }}
                        />
                        <button onClick={() => handleReply(r.id)} style={{ padding: "4px 10px", background: "#16a34a", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Gửi</button>
                        <button onClick={() => setReplyingId(null)} style={{ padding: "4px 8px", background: "#eee", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Hủy</button>
                      </div>
                    ) : (
                      <button onClick={() => { setReplyingId(r.id); setReplyText(""); }} style={{ padding: "4px 12px", background: "#0037b0", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                        Phản hồi
                      </button>
                    )}
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "#888" }}>{formatDate(r.createdAt)}</td>
                  <td>
                    {r.isReported ? (
                      <span style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 500, background: '#fef2f2', padding: '3px 8px', borderRadius: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>flag</span> Đã báo cáo
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>-</span>
                    )}
                  </td>
                  <td>
                    {!r.reply && !r.isReported && (
                      <button onClick={() => handleReport(r.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>flag</span> Báo cáo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}>←</button>
          <span style={{ padding: "6px 0" }}>Trang {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}>→</button>
        </div>
      )}

    </div>
  );
}
