import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import http, { getImageUrl } from "../services/http";
import { reviewService } from "../services/reviewService";
import "../styles/factory.css";

interface FactoryData {
  id: number;
  factoryName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  ratingAvg: number;
  totalRatings: number;
  totalProducts: number;
  totalOrders: number;
  verifiedStatus: string;
  imageUrls: string[];
  images: { id: number; imageUrl: string }[];
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  customerName: string;
  customerAvatar: string | null;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export default function FactoryProfile() {
  const { id } = useParams<{ id: string }>();
  const [factory, setFactory] = useState<FactoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageIdx, setImageIdx] = useState(0);

  // Reviews
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewPage, setReviewPage] = useState(0);
  const [totalReviewPages, setTotalReviewPages] = useState(0);

  // Products
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      http.get(`/factories/${id}`),
      http.get(`/reviews/factories/${id}?page=0&size=5`),
      http.get(`/products?size=20&factoryId=${id}`)
    ]).then(([fRes, rRes, pRes]) => {
      if (fRes.data?.data) setFactory(fRes.data.data);
      if (rRes.data?.data) {
        setReviews(rRes.data.data.content || []);
        setTotalReviewPages(rRes.data.data.totalPages || 0);
      }
      if (pRes.data?.data) setProducts(pRes.data.data.content || []);
    }).catch(err => {
      setError("Không thể tải thông tin xưởng");
      console.error(err);
    }).finally(() => setLoading(false));
  }, [id]);

  const loadMoreReviews = async (p: number) => {
    const res = await http.get(`/reviews/factories/${id}?page=${p}&size=5`);
    if (res.data?.data) {
      setReviews(res.data.data.content || []);
      setReviewPage(p);
    }
  };

  const formatMoney = (n: number) => n?.toLocaleString("vi-VN") + " ₫";
  const renderStars = (n: number) => "⭐".repeat(n);

  if (loading) return <><Header /><div style={{ textAlign: "center", padding: 80 }}>Đang tải...</div></>;
  if (error || !factory) return <><Header /><div style={{ textAlign: "center", padding: 80, color: "red" }}>{error || "Không tìm thấy xưởng"}</div></>;

  const images = factory.imageUrls?.length > 0
    ? factory.imageUrls
    : factory.images?.map(i => i.imageUrl) || [];

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
        {/* Hero */}
        <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 360px", maxWidth: 360 }}>
            {images.length > 0 ? (
              <>
                <img src={getImageUrl(images[imageIdx])} alt={factory.factoryName}
                  style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 16 }} />
                {images.length > 1 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, overflow: "auto" }}>
                    {images.map((img, i) => (
                      <img key={i} src={getImageUrl(img)} alt=""
                        onClick={() => setImageIdx(i)}
                        style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: i === imageIdx ? "2px solid #2563eb" : "2px solid transparent" }} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ width: "100%", height: 280, background: "#f1f5f9", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 64, color: "#94a3b8" }}>factory</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{factory.factoryName}</h1>
              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                background: factory.verifiedStatus === "APPROVED" ? "#ecfdf5" : "#fef3c7",
                color: factory.verifiedStatus === "APPROVED" ? "#065f46" : "#92400e" }}>
                {factory.verifiedStatus === "APPROVED" ? "Đã xác minh" : "Chờ duyệt"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#64748b" }}>location_on</span>
              <span style={{ color: "#64748b" }}>{factory.address || "Chưa cập nhật địa chỉ"}</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
              {renderStars(Math.round(factory.ratingAvg || 0))}
              <span style={{ fontWeight: 600 }}>{(factory.ratingAvg || 0).toFixed(1)}</span>
              <span style={{ color: "#94a3b8" }}>({factory.totalRatings || 0} đánh giá)</span>
            </div>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>{factory.description || "Chưa có mô tả"}</p>

            <div style={{ display: "flex", gap: 32, marginTop: 16 }}>
              <div style={{ textAlign: "center" }}><strong style={{ fontSize: 20 }}>{factory.totalProducts || 0}</strong><p style={{ color: "#64748b", fontSize: 13 }}>Sản phẩm</p></div>
              <div style={{ textAlign: "center" }}><strong style={{ fontSize: 20 }}>{factory.totalOrders || 0}</strong><p style={{ color: "#64748b", fontSize: 13 }}>Đơn hàng</p></div>
              <div style={{ textAlign: "center" }}><strong style={{ fontSize: 20 }}>{factory.totalRatings || 0}</strong><p style={{ color: "#64748b", fontSize: 13 }}>Đánh giá</p></div>
            </div>
          </div>
        </div>

        {/* Products */}
        {products.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Sản phẩm của xưởng</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {products.map((p: any) => (
                <Link key={p.id} to={`/products/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    {p.imageUrls?.[0] ? (
                      <img src={getImageUrl(p.imageUrls[0])} alt={p.name} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: 180, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#94a3b8" }}>image</span>
                      </div>
                    )}
                    <div style={{ padding: 12 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>{p.name}</h4>
                      <span style={{ fontWeight: 700, color: "#dc2626" }}>{formatMoney(p.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Đánh giá ({factory.totalRatings || 0})</h2>
          {reviews.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>Chưa có đánh giá nào.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {reviews.map((r: ReviewItem) => (
                <div key={r.id} style={{ padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <img src={r.customerAvatar || "https://i.pravatar.cc/40"} alt="" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                    <div>
                      <strong style={{ fontSize: 14 }}>{r.customerName}</strong>
                      <div>{renderStars(r.rating)} <span style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span></div>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: "#334155" }}>{r.comment}</p>
                  {r.reply && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 13, color: "#065f46" }}>
                      <strong>Xưởng phản hồi:</strong> {r.reply}
                      {r.repliedAt && <span style={{ display: "block", fontSize: 11, color: "#64748b", marginTop: 2 }}>{new Date(r.repliedAt).toLocaleString("vi-VN")}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {totalReviewPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button disabled={reviewPage === 0} onClick={() => loadMoreReviews(reviewPage - 1)} style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 6 }}>←</button>
              <span style={{ padding: "6px 0" }}>{reviewPage + 1}/{totalReviewPages}</span>
              <button disabled={reviewPage >= totalReviewPages - 1} onClick={() => loadMoreReviews(reviewPage + 1)} style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: 6 }}>→</button>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}
