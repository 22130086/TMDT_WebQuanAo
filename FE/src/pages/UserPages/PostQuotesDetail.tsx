import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../../services/http";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../styles/custom-order.css";

interface QuotationItem {
  id: number;
  postId: number;
  postTitle: string;
  factoryId: number;
  factoryName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  note?: string;
  deliveryDays?: number;
  status: string;
  createdAt: string;
}

const BASE_IMG = "http://localhost:8080";

export default function PostQuotesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  // Form info state
  const [showForm, setShowForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuotationItem | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");

  // Edit post state
  const [showEditPost, setShowEditPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editQty, setEditQty] = useState(1);
  const [editBudgetMin, setEditBudgetMin] = useState("");
  const [editBudgetMax, setEditBudgetMax] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      http.get(`/posts/${id}`),
      http.get(`/quotations/post/${id}`),
    ]).then(([postRes, quoteRes]) => {
      setPost(postRes.data?.data);
      setQuotations(quoteRes.data?.data?.content ?? []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAccept = (quote: QuotationItem) => {
    setSelectedQuote(quote);
    setReceiverName(post?.customerName || "");
    setReceiverPhone("");
    setShippingAddress("");
    setOrderNote("");
    setShowForm(true);
  };

  const handleSubmitForm = async () => {
    if (!selectedQuote) return;
    setActionLoading(selectedQuote.id);
    try {
      const res = await http.patch(`/quotations/${selectedQuote.id}/accept`, {
        receiverName, receiverPhone, shippingAddress, note: orderNote
      });
      const paymentUrl = res.data?.data?.note;
      if (paymentUrl && paymentUrl.startsWith("http")) {
        window.location.href = paymentUrl;
        return;
      }
      setMsg("✅ Đã tạo đơn hàng.");
      setShowForm(false);
      const qRes = await http.get(`/quotations/post/${id}`);
      setQuotations(qRes.data?.data?.content ?? []);
    } catch (e: any) {
      setMsg("❌ " + (e.response?.data?.message || "Lỗi"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa bài đăng này?")) return;
    try {
      await http.delete(`/posts/${id}`);
      navigate("/my-posts");
    } catch (err: any) {
      setMsg("❌ " + (err?.response?.data?.message || "Không thể xóa"));
    }
  };

  const openEditPost = () => {
    if (!post) return;
    setEditTitle(post.title || "");
    setEditDesc(post.description || "");
    setEditQty(post.quantity || 1);
    setEditBudgetMin(post.budgetMin?.toString() || "");
    setEditBudgetMax(post.budgetMax?.toString() || "");
    setEditDeadline(post.deadline || "");
    setShowEditPost(true);
  };

  const handleUpdatePost = async () => {
    try {
      await http.put(`/posts/${id}`, {
        title: editTitle,
        description: editDesc,
        quantity: editQty,
        budgetMin: editBudgetMin ? Number(editBudgetMin) : null,
        budgetMax: editBudgetMax ? Number(editBudgetMax) : null,
        deadline: editDeadline || null,
      });
      setShowEditPost(false);
      fetchData();
    } catch (err: any) {
      setMsg("❌ " + (err?.response?.data?.message || "Không thể cập nhật"));
    }
  };

  const canEdit = post?.status === "PENDING";

  const statusBadge = (s: string) => {
    const map: Record<string, { text: string; cls: string }> = {
      PENDING: { text: "Chờ", cls: "warning" },
      ACCEPTED: { text: "Đã chọn", cls: "success" },
      REJECTED: { text: "Từ chối", cls: "danger" },
      WITHDRAWN: { text: "Đã rút", cls: "secondary" },
      CANCELLED: { text: "Đã hủy", cls: "secondary" },
    };
    const m = map[s] || { text: s, cls: "info" };
    return <span className={`at-badge ${m.cls}`} style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{m.text}</span>;
  };

  if (loading) return <><Header /><div className="custom-order-page" style={{ textAlign: "center", padding: 80 }}>Đang tải...</div><Footer /></>;

  return (
    <>
      <Header />
      <div className="custom-order-page">
        <button onClick={() => navigate("/my-posts")} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          ← Quay lại danh sách
        </button>

        {/* Post Info */}
        {post && (
          <div className="custom-card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ margin: "0 0 8px" }}>{post.title}</h2>
              {canEdit && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="save-btn" style={{ width: "auto", padding: "6px 14px", fontSize: 12, background: "#3b82f6" }}
                    onClick={openEditPost}>✏️ Sửa</button>
                  <button className="save-btn" style={{ width: "auto", padding: "6px 14px", fontSize: 12, background: "#ef4444" }}
                    onClick={handleDeletePost}>🗑️ Xóa</button>
                </div>
              )}
            </div>
            <p style={{ color: "#6b7280", whiteSpace: "pre-wrap", margin: "0 0 12px" }}>{post.description}</p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14 }}>
              <span>🔢 SL: <strong>{post.quantity}</strong></span>
              <span>💰 NS: <strong>{post.budgetMin?.toLocaleString() || "?"}đ - {post.budgetMax?.toLocaleString() || "?"}đ</strong></span>
              {post.deadline && <span>📅 Hạn: <strong>{new Date(post.deadline).toLocaleDateString("vi-VN")}</strong></span>}
            </div>
            {(post.designFileUrl || post.designFileUrlBack) && (
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {post.designFileUrl && <img src={BASE_IMG + post.designFileUrl} alt="Mặt trước"
                  style={{ maxWidth: 150, maxHeight: 150, borderRadius: 12, border: "1px solid #e5e7eb", objectFit: "contain" }} />}
                {post.designFileUrlBack && <img src={BASE_IMG + post.designFileUrlBack} alt="Mặt sau"
                  style={{ maxWidth: 150, maxHeight: 150, borderRadius: 12, border: "1px solid #e5e7eb", objectFit: "contain" }} />}
              </div>
            )}
          </div>
        )}

        {msg && (
          <div className="design-notice customizer-notice" style={{ marginBottom: 16, background: msg.startsWith("✅") ? "#f0fdf4" : "#fef2f2" }}>
            {msg}
          </div>
        )}

        {/* Quotations */}
        <h3 style={{ marginBottom: 16 }}>📨 Báo giá nhận được ({quotations.length})</h3>
        {quotations.length === 0 && (
          <div className="custom-card" style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
            Chưa có xưởng nào gửi báo giá cho bài đăng này.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {quotations.map(q => (
            <div key={q.id} className="custom-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 4px" }}>🏭 {q.factoryName}</h4>
                  <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
                    Đơn giá: <strong>{q.unitPrice?.toLocaleString()}đ</strong> × {q.quantity} = <strong style={{ color: "#2563eb", fontSize: 18 }}>{q.totalPrice?.toLocaleString()}đ</strong>
                  </p>
                  {q.note && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>📝 {q.note}</p>}
                  {q.deliveryDays && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>🚚 Giao trong {q.deliveryDays} ngày</p>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  {statusBadge(q.status)}
                  {q.status === "PENDING" && post?.status === "OPEN" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="save-btn" style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
                        onClick={() => handleAccept(q)}
                        disabled={actionLoading === q.id}>
                        {actionLoading === q.id ? "..." : "✅ Chọn xưởng này"}
                      </button>
                    </div>
                  )}
                  {q.status === "ACCEPTED" && (
                    <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>✓ Đã chọn & thanh toán</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />

      {/* Form nhập thông tin giao hàng */}
      {showForm && selectedQuote && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: 32, maxWidth: 480, width: "90%", maxHeight: "90vh", overflow: "auto"
          }}>
            <h3 style={{ margin: "0 0 4px" }}>📋 Thông tin giao hàng</h3>
            <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 14 }}>
              Xưởng: <strong>{selectedQuote.factoryName}</strong> | Tổng: <strong>{selectedQuote.totalPrice?.toLocaleString()}đ</strong> | Cọc 30%: <strong>{Math.round(selectedQuote.totalPrice * 0.3).toLocaleString()}đ</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontWeight: 700, fontSize: 13 }}>Tên người nhận</label>
                <input className="text-input" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Họ tên" />
              </div>
              <div>
                <label style={{ fontWeight: 700, fontSize: 13 }}>Số điện thoại</label>
                <input className="text-input" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} placeholder="SĐT" />
              </div>
              <div>
                <label style={{ fontWeight: 700, fontSize: 13 }}>Địa chỉ giao hàng</label>
                <textarea className="text-input post-textarea" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="Địa chỉ nhận hàng" rows={2} />
              </div>
              <div>
                <label style={{ fontWeight: 700, fontSize: 13 }}>Ghi chú</label>
                <textarea className="text-input post-textarea" value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="Ghi chú thêm..." rows={2} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button className="clear-btn" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Hủy</button>
              <button className="save-btn" onClick={handleSubmitForm} disabled={actionLoading === selectedQuote.id} style={{ flex: 1 }}>
                {actionLoading === selectedQuote.id ? "..." : "🚀 Thanh toán cọc " + Math.round(selectedQuote.totalPrice * 0.3).toLocaleString() + "đ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditPost && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowEditPost(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 500, width: "90%", maxHeight: "90vh", overflow: "auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px" }}>✏️ Sửa bài đăng</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label style={{ fontWeight: 700, fontSize: 13 }}>Tiêu đề *</label>
                <input className="text-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
              <div><label style={{ fontWeight: 700, fontSize: 13 }}>Mô tả</label>
                <textarea className="text-input" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
              <div><label style={{ fontWeight: 700, fontSize: 13 }}>Số lượng *</label>
                <input className="text-input" type="number" min={1} value={editQty} onChange={e => setEditQty(Number(e.target.value))} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontWeight: 700, fontSize: 13 }}>NS tối thiểu</label>
                  <input className="text-input" type="number" value={editBudgetMin} onChange={e => setEditBudgetMin(e.target.value)} /></div>
                <div><label style={{ fontWeight: 700, fontSize: 13 }}>NS tối đa</label>
                  <input className="text-input" type="number" value={editBudgetMax} onChange={e => setEditBudgetMax(e.target.value)} /></div>
              </div>
              <div><label style={{ fontWeight: 700, fontSize: 13 }}>Hạn chót</label>
                <input className="text-input" type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="save-btn" style={{ width: "auto", padding: "10px 24px", background: "#9ca3af" }}
                onClick={() => setShowEditPost(false)}>Hủy</button>
              <button className="save-btn" style={{ width: "auto", padding: "10px 24px" }}
                onClick={handleUpdatePost}>Cập nhật</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
