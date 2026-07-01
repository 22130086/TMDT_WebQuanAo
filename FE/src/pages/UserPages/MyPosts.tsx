import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../services/http";
import { getImageUrl } from "../../services/http";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../styles/custom-order.css";

interface PostItem {
  id: number;
  title: string;
  description?: string;
  quantity: number;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: string;
  status: string;
  designFileUrl?: string;
  designFileUrlBack?: string;
  createdAt: string;
}



export default function MyPosts() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editQty, setEditQty] = useState(1);
  const [editBudgetMin, setEditBudgetMin] = useState("");
  const [editBudgetMax, setEditBudgetMax] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const navigate = useNavigate();

  const fetchPosts = () => {
    setLoading(true);
    http.get("/posts/my?size=50")
      .then(res => {
        const data = res.data?.data;
        setPosts(data?.content ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      PENDING:     "⏳ Chờ duyệt",
      OPEN:        "✅ Đã duyệt",
      IN_PROGRESS: "🔧 Đang làm",
      CLOSED:      "🔒 Đã đóng",
      CANCELLED:   "❌ Đã hủy",
    };
    return map[s] || s;
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa bài đăng này?")) return;
    try {
      await http.delete(`/posts/${id}`);
      fetchPosts();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể xóa bài đăng");
    }
  };

  const openEdit = (p: PostItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEdit(p.id);
    setEditTitle(p.title);
    setEditDesc(p.description || "");
    setEditQty(p.quantity);
    setEditBudgetMin(p.budgetMin?.toString() || "");
    setEditBudgetMax(p.budgetMax?.toString() || "");
    setEditDeadline(p.deadline || "");
  };

  const handleUpdate = async (id: number) => {
    try {
      await http.put(`/posts/${id}`, {
        title: editTitle,
        description: editDesc,
        quantity: editQty,
        budgetMin: editBudgetMin ? Number(editBudgetMin) : null,
        budgetMax: editBudgetMax ? Number(editBudgetMax) : null,
        deadline: editDeadline || null,
      });
      setShowEdit(null);
      fetchPosts();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể cập nhật bài đăng");
    }
  };

  const canEdit = (status: string) => status === "PENDING";

  if (loading) return <><Header /><div className="custom-order-page" style={{ textAlign: "center", padding: 80 }}>Đang tải...</div><Footer /></>;

  return (
    <>
      <Header />
      <div className="custom-order-page">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>📋 Bài đăng của tôi</h1>

        {posts.length === 0 && (
          <div className="custom-card" style={{ textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 18, color: "#6b7280" }}>Bạn chưa có bài đăng nào.</p>
            <button className="save-btn" style={{ width: "auto", marginTop: 16, padding: "12px 32px" }}
              onClick={() => navigate("/custom-order")}>
              Tạo bài đăng mới
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {posts.map(p => (
            <div key={p.id} className="custom-card"
              style={{ cursor: "pointer", display: "flex", gap: 20, alignItems: "center", padding: 20, flexWrap: "wrap" }}
              onClick={() => navigate(`/my-posts/${p.id}`)}>
              {(p.designFileUrl || p.designFileUrlBack) && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {p.designFileUrl && <img src={getImageUrl(p.designFileUrl)} alt="front"
                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "1px solid #e5e7eb" }} />}
                  {p.designFileUrlBack && <img src={getImageUrl(p.designFileUrlBack)} alt="back"
                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "1px solid #e5e7eb" }} />}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{p.title}</h3>
                <p style={{ margin: "4px 0", color: "#6b7280", fontSize: 14 }}>
                  SL: {p.quantity} | {p.budgetMin ? `${p.budgetMin.toLocaleString()}đ` : "?"} - {p.budgetMax ? `${p.budgetMax.toLocaleString()}đ` : "?"}
                  {p.deadline && ` | Hạn: ${new Date(p.deadline).toLocaleDateString("vi-VN")}`}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {canEdit(p.status) && (
                  <>
                    <button className="save-btn" style={{ width: "auto", padding: "6px 14px", fontSize: 12, background: "#3b82f6" }}
                      onClick={(e) => openEdit(p, e)}>✏️ Sửa</button>
                    <button className="save-btn" style={{ width: "auto", padding: "6px 14px", fontSize: 12, background: "#ef4444" }}
                      onClick={(e) => handleDelete(p.id, e)}>🗑️ Xóa</button>
                  </>
                )}
                <span style={{
                    padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                    background:
                      p.status === "PENDING"     ? "#fef9c3" :
                      p.status === "OPEN"        ? "#dcfce7" :
                      p.status === "IN_PROGRESS" ? "#dbeafe" :
                      p.status === "CLOSED"      ? "#f3f4f6" :
                      p.status === "CANCELLED"   ? "#fee2e2" : "#f3f4f6",
                    color:
                      p.status === "PENDING"     ? "#92400e" :
                      p.status === "OPEN"        ? "#166534" :
                      p.status === "IN_PROGRESS" ? "#1d4ed8" :
                      p.status === "CLOSED"      ? "#374151" :
                      p.status === "CANCELLED"   ? "#991b1b" : "#374151",
                  }}>
                  {statusLabel(p.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />

      {/* Edit Modal */}
      {showEdit !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowEdit(null)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 500, width: "90%", maxHeight: "90vh", overflow: "auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px" }}>✏️ Sửa bài đăng</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontWeight: 700, fontSize: 13 }}>Tiêu đề *</label>
                <input className="text-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontWeight: 700, fontSize: 13 }}>Mô tả</label>
                <textarea className="text-input" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              </div>
              <div>
                <label style={{ fontWeight: 700, fontSize: 13 }}>Số lượng *</label>
                <input className="text-input" type="number" min={1} value={editQty} onChange={e => setEditQty(Number(e.target.value))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontWeight: 700, fontSize: 13 }}>NS tối thiểu</label>
                  <input className="text-input" type="number" value={editBudgetMin} onChange={e => setEditBudgetMin(e.target.value)} /></div>
                <div><label style={{ fontWeight: 700, fontSize: 13 }}>NS tối đa</label>
                  <input className="text-input" type="number" value={editBudgetMax} onChange={e => setEditBudgetMax(e.target.value)} /></div>
              </div>
              <div>
                <label style={{ fontWeight: 700, fontSize: 13 }}>Hạn chót</label>
                <input className="text-input" type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="save-btn" style={{ width: "auto", padding: "10px 24px", background: "#9ca3af" }}
                onClick={() => setShowEdit(null)}>Hủy</button>
              <button className="save-btn" style={{ width: "auto", padding: "10px 24px" }}
                onClick={() => handleUpdate(showEdit!)}>Cập nhật</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
