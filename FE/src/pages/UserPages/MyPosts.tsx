import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../services/http";
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

const BASE_IMG = "http://localhost:8080";

export default function MyPosts() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    http.get("/posts/my?size=50")
      .then(res => {
        const data = res.data?.data;
        setPosts(data?.content ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      PENDING: "⏳ Chờ duyệt", OPEN: "✅ Đã duyệt",
      IN_PROGRESS: "🔧 Đang làm", CLOSED: "🔒 Đã đóng", CANCELLED: "❌ Đã hủy"
    };
    return map[s] || s;
  };

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
              style={{ cursor: "pointer", display: "flex", gap: 20, alignItems: "center", padding: 20 }}
              onClick={() => navigate(`/my-posts/${p.id}`)}>
              {(p.designFileUrl || p.designFileUrlBack) && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {p.designFileUrl && <img src={BASE_IMG + p.designFileUrl} alt="front"
                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "1px solid #e5e7eb" }} />}
                  {p.designFileUrlBack && <img src={BASE_IMG + p.designFileUrlBack} alt="back"
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
              <div>
                <span className={`at-badge ${p.status === "PENDING" ? "warning" : p.status === "OPEN" ? "success" : "secondary"}`}
                  style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                  {statusLabel(p.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
