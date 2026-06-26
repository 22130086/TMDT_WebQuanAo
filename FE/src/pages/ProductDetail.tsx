import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { productService } from "../services/productService";
import { addToCart } from "../services/cartService";
import http, { getImageUrl } from "../services/http";
import { reviewService, type ReviewData } from "../services/reviewService";

import "../styles/product-detail.css";

// ========================
// TYPES
// ========================

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  rating?: number;
  reviewCount?: number;
  soldCount?: string;
  factoryId?: number;
  factoryName?: string;
  onlineStatus?: string;
}

interface AttributeValue {
  id: number;
  value: string;
}

interface ProductAttribute {
  id: number;
  name: string;
  values: AttributeValue[];
}

// ========================
// HELPER
// ========================

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const renderStars = (rating: number): string => "⭐".repeat(rating);

// ========================
// COMPONENT
// ========================

export default function ProductDetail() {

  const { id } = useParams();
  const navigate = useNavigate();
  const productId = Number(id);

  // ---- Product state ----
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // ---- Attributes state ----
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // ---- Review state (read-only display) ----
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewPage, setReviewPage] = useState(0);
  const [totalReviewPages, setTotalReviewPages] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // ========================
  // FETCH PRODUCT
  // ========================

  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");
        if (!id) return;

        const response = await productService.getProductById(Number(id));

        if (response.success) {
          const data = response.data;
          setProduct({
            ...data,
            soldCount: "1.2k",
            factoryId: data.factoryId,
            factoryName: data.factoryName || "Chưa có thông tin",
            onlineStatus: "Online 2 giờ trước",
          });

          if (data.imageUrls && data.imageUrls.length > 0) {
            setSelectedImage(getImageUrl(data.imageUrls[0]));
          }
        } else {
          setError(response.message || "Không thể tải sản phẩm");
        }
      } catch (err: any) {
        console.error("Lỗi tải sản phẩm:", err);
        setError(
          err.response?.data?.message ||
          "Không thể kết nối đến máy chủ. Vui lòng thử lại sau."
        );
      } finally {
        setLoading(false);
      }
    }
    
    async function fetchAttributes() {
      try {
        const res = await http.get("/product-attributes");
        if (res.data?.data) {
          setAttributes(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi tải thuộc tính:", err);
      }
    }

    fetchProduct();
    fetchAttributes();
  }, [id]);

  // ========================
  // FETCH REVIEWS
  // ========================

  const fetchReviews = async (page = 0) => {
    if (!productId) return;
    try {
      setReviewsLoading(true);
      const res = await reviewService.getProductReviews(productId, page, 5);
      if (res.success) {
        setReviews(res.data.content);
        setReviewPage(res.data.number);
        setTotalReviewPages(res.data.totalPages);
      }
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews(0);
  }, [productId]);

  // ========================
  // CART HANDLERS
  // ========================

  const getSelectedAttributesString = () => {
    const parts = Object.entries(selectedAttributes)
      .map(([key, val]) => `${key}: ${val}`);
    return parts.length > 0 ? parts.join(", ") : undefined;
  };

  const validateAttributes = () => {
    if (attributes.length > 0) {
      const missing = attributes.filter(attr => !selectedAttributes[attr.name]);
      if (missing.length > 0) {
        alert(`Vui lòng chọn: ${missing.map(m => m.name).join(", ")}`);
        return false;
      }
    }
    return true;
  }

  const handleAddToCart = async () => {
    if (!product) return;
    if (!validateAttributes()) return;

    try {
      setAddingToCart(true);
      const attrsString = getSelectedAttributesString();
      await addToCart(product.id, quantity, attrsString);
      window.dispatchEvent(new Event("cart-updated"));
      alert("Đã thêm sản phẩm vào giỏ hàng!");
    } catch (err: any) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", err);
      alert(err.response?.data?.message || err.message || "Lỗi khi thêm sản phẩm vào giỏ hàng!");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!validateAttributes()) return;

    try {
      setAddingToCart(true);
      const attrsString = getSelectedAttributesString();
      await addToCart(product.id, quantity, attrsString);
      window.dispatchEvent(new Event("cart-updated"));
      navigate("/cart");
    } catch (err: any) {
      console.error("Lỗi khi mua ngay:", err);
      alert(err.response?.data?.message || err.message || "Lỗi khi thêm sản phẩm vào giỏ hàng!");
    } finally {
      setAddingToCart(false);
    }
  };

  // ========================
  // RENDER: Loading / Error
  // ========================

  if (loading) {
    return (
      <>
        <Header />
        <h2 className="loading-text">Đang tải sản phẩm...</h2>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <div className="error-text" style={{ textAlign: "center", padding: "48px" }}>
          <h2>{error || "Không tìm thấy sản phẩm"}</h2>
          <button
            onClick={() => navigate("/products")}
            style={{
              marginTop: "16px",
              padding: "10px 24px",
              background: "#ee4d2d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Quay lại danh sách sản phẩm
          </button>
        </div>
      </>
    );
  }

  // ========================
  // RENDER: Main
  // ========================

  return (
    <>
      <Header />

      <div className="product-detail-page">

        {/* ============ DETAIL WRAPPER ============ */}

        <div className="detail-wrapper">

          {/* LEFT - Gallery */}
          <div className="detail-left">
            <img
              src={selectedImage || getImageUrl(product.imageUrls?.[0])}
              alt={product.name}
              className="main-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/600x600?text=No+Image";
              }}
            />

            <div className="thumbnail-list">
              {product.imageUrls?.map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img)}
                  alt="thumb"
                  className={`thumb ${selectedImage === getImageUrl(img) ? "active-thumb" : ""}`}
                  onClick={() => setSelectedImage(getImageUrl(img))}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=No+Image";
                  }}
                />
              ))}
            </div>
          </div>

          {/* RIGHT - Info */}
          <div className="detail-right">
            <h1 className="product-title">{product.name}</h1>

            <div className="rating-row">
              <span className="rating-score">{product.rating ?? "Chưa có"}</span>
              <span className="stars">{product.rating ? renderStars(Math.round(product.rating)) : ""}</span>
              <span className="review-count">{product.reviewCount ?? 0} đánh giá</span>
              <span className="sold-count">{product.soldCount} đã bán</span>
            </div>

            <div className="price-box">
              {Number(product.price).toLocaleString("vi-VN")}đ
            </div>

            <div className="shipping-box">
              <div>🚚 Miễn phí vận chuyển</div>
            </div>

            <div className="quantity-box">
              <span>Số lượng:</span>
              <button onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>

            {/* Attributes (Size, Color, etc.) */}
            {attributes.length > 0 && (
              <div className="attributes-box" style={{ marginBottom: "24px" }}>
                {attributes.map((attr) => (
                  <div key={attr.id} className="attribute-row" style={{ marginBottom: "16px" }}>
                    <div style={{ marginBottom: "8px", fontWeight: 600, color: "#444" }}>
                      {attr.name}:
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {attr.values?.map((val) => {
                        const isSelected = selectedAttributes[attr.name] === val.value;
                        return (
                          <button
                            key={val.id}
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: val.value }))}
                            style={{
                              padding: "8px 16px",
                              background: isSelected ? "#ee4d2d" : "#fff",
                              color: isSelected ? "#fff" : "#333",
                              border: isSelected ? "1px solid #ee4d2d" : "1px solid #ccc",
                              borderRadius: "6px",
                              cursor: "pointer",
                              transition: "0.2s"
                            }}
                          >
                            {val.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="action-buttons">
              <button className="add-cart-btn" onClick={handleAddToCart} disabled={addingToCart}>
                {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>
              <button className="buy-btn" onClick={handleBuyNow} disabled={addingToCart}>
                Mua ngay
              </button>
            </div>
          </div>
        </div>

        {/* ============ FACTORY ============ */}

        <section className="factory-section">
          <div className="factory-left">
            <img src="https://i.pravatar.cc/100?img=7" alt="factory" />
            <div>
              <h3>{product.factoryName}</h3>
              <p>{product.onlineStatus}</p>
            </div>
          </div>
          {product.factoryId && (
            <button
              className="view-factory-btn"
              onClick={() => navigate(`/factory-profile/${product.factoryId}`)}
            >
              Xem Xưởng
            </button>
          )}
        </section>

        {/* ============ DESCRIPTION ============ */}

        <section className="description-section">
          <h2>CHI TIẾT SẢN PHẨM</h2>
          <p>{product.description}</p>
        </section>

        {/* ============ REVIEWS ============ */}

        <section className="review-section">
          <h2>ĐÁNH GIÁ ({product.reviewCount ?? reviews.length})</h2>

          {/* --- Reviews List --- */}
          {reviewsLoading ? (
            <p className="review-loading">Đang tải đánh giá...</p>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <>
              <div className="review-list">
                {reviews.map((review) => (
                  <div className="review-item" key={review.id}>
                    <img
                      src={review.customerAvatar || "https://i.pravatar.cc/50?img=3"}
                      alt={review.customerName}
                      className="review-avatar"
                    />

                    <div className="review-body">
                      <div className="review-header">
                        <h4>{review.customerName}</h4>
                        <span className="review-stars">{renderStars(review.rating)}</span>
                        <small>{formatDate(review.createdAt)}</small>
                      </div>

                      <p className="review-comment">{review.comment}</p>

                      {/* Factory reply */}
                      {review.reply && (
                        <div className="review-reply">
                          <strong>Phản hồi từ xưởng:</strong>
                          <p>{review.reply}</p>
                          {review.repliedAt && <small>{formatDate(review.repliedAt)}</small>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalReviewPages > 1 && (
                <div className="review-pagination">
                  <button
                    disabled={reviewPage === 0}
                    onClick={() => fetchReviews(reviewPage - 1)}
                  >
                    ← Trước
                  </button>
                  <span>
                    Trang {reviewPage + 1} / {totalReviewPages}
                  </span>
                  <button
                    disabled={reviewPage >= totalReviewPages - 1}
                    onClick={() => fetchReviews(reviewPage + 1)}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}
