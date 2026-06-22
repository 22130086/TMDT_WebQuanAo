import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { productService } from "../services/productService";
import { addToCart } from "../services/cartService";
import { getImageUrl } from "../services/http";
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
  factoryName?: string;
  onlineStatus?: string;
}

// ========================
// HELPER
// ========================

const getUserRole = (): string | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || payload.roles?.[0] || null;
  } catch {
    return null;
  }
};

const getUserId = (): number | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.id || null;
  } catch {
    return null;
  }
};

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

  const userRole = getUserRole();
  const currentUserId = getUserId();

  // ---- Product state ----
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // ---- Review state ----
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewPage, setReviewPage] = useState(0);
  const [totalReviewPages, setTotalReviewPages] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Edit review
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  // ========================
  // FETCH PRODUCT
  // ========================

  useEffect(() => {
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
            factoryName: data.factoryName || "Azure Industrial",
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
    fetchProduct();
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

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity);
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
    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity);
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
  // REVIEW HANDLERS
  // ========================

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      setSubmittingReview(true);
      const res = await reviewService.addProductReview({
        productId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      if (res.success) {
        setReviewComment("");
        setReviewRating(5);
        setShowReviewForm(false);
        // Refresh reviews + product (to update avg rating)
        await fetchReviews(0);
        const productRes = await productService.getProductById(productId);
        if (productRes.success) {
          setProduct(prev => prev ? { ...prev, rating: productRes.data.rating, reviewCount: productRes.data.reviewCount } : prev);
        }
      } else {
        alert(res.message || "Lỗi khi gửi đánh giá");
      }
    } catch (err: any) {
      console.error("Lỗi gửi đánh giá:", err);
      alert(err.response?.data?.message || "Vui lòng đăng nhập với vai trò khách hàng để đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review: ReviewData) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewId || !editComment.trim()) return;
    try {
      setSubmittingReview(true);
      const res = await reviewService.updateProductReview(editingReviewId, {
        rating: editRating,
        comment: editComment.trim(),
      });
      if (res.success) {
        setEditingReviewId(null);
        await fetchReviews(reviewPage);
        const productRes = await productService.getProductById(productId);
        if (productRes.success) {
          setProduct(prev => prev ? { ...prev, rating: productRes.data.rating, reviewCount: productRes.data.reviewCount } : prev);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi cập nhật đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      const res = await reviewService.deleteProductReview(reviewId);
      if (res.success) {
        await fetchReviews(reviewPage);
        const productRes = await productService.getProductById(productId);
        if (productRes.success) {
          setProduct(prev => prev ? { ...prev, rating: productRes.data.rating, reviewCount: productRes.data.reviewCount } : prev);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi xóa đánh giá");
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
        </section>

        {/* ============ DESCRIPTION ============ */}

        <section className="description-section">
          <h2>CHI TIẾT SẢN PHẨM</h2>
          <p>{product.description}</p>
        </section>

        {/* ============ REVIEWS ============ */}

        <section className="review-section">
          <h2>ĐÁNH GIÁ ({product.reviewCount ?? reviews.length})</h2>

          {/* --- Add Review Button (CUSTOMER only) --- */}
          {userRole === "CUSTOMER" && !showReviewForm && (
            <button
              className="write-review-btn"
              onClick={() => setShowReviewForm(true)}
            >
              ✏️ Viết đánh giá
            </button>
          )}

          {/* --- Review Form --- */}
          {showReviewForm && userRole === "CUSTOMER" && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <h3>Viết đánh giá của bạn</h3>

              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= reviewRating ? "active" : ""}`}
                    onClick={() => setReviewRating(star)}
                  >
                    {star <= reviewRating ? "⭐" : "☆"}
                  </span>
                ))}
              </div>

              <textarea
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                required
              />

              <div className="review-form-actions">
                <button type="submit" disabled={submittingReview || !reviewComment.trim()}>
                  {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => { setShowReviewForm(false); setReviewComment(""); setReviewRating(5); }}>
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* --- Not logged in --- */}
          {!userRole && (
            <p className="review-login-hint">
              <a href="/">Đăng nhập</a> với vai trò khách hàng để viết đánh giá.
            </p>
          )}

          {/* --- Reviews List --- */}
          {reviewsLoading ? (
            <p className="review-loading">Đang tải đánh giá...</p>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
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

                      {/* Edit mode */}
                      {editingReviewId === review.id ? (
                        <form className="review-edit-form" onSubmit={handleUpdateReview}>
                          <div className="star-picker small">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`star ${star <= editRating ? "active" : ""}`}
                                onClick={() => setEditRating(star)}
                              >
                                {star <= editRating ? "⭐" : "☆"}
                              </span>
                            ))}
                          </div>
                          <textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            rows={3}
                            required
                          />
                          <div className="review-edit-actions">
                            <button type="submit" disabled={submittingReview}>
                              {submittingReview ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button type="button" className="cancel-btn" onClick={() => setEditingReviewId(null)}>
                              Hủy
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="review-comment">{review.comment}</p>

                          {/* Factory reply */}
                          {review.reply && (
                            <div className="review-reply">
                              <strong>Phản hồi từ xưởng:</strong>
                              <p>{review.reply}</p>
                              {review.repliedAt && <small>{formatDate(review.repliedAt)}</small>}
                            </div>
                          )}

                          {/* Owner actions */}
                          {currentUserId === review.customerId && (
                            <div className="review-owner-actions">
                              <button onClick={() => handleEditReview(review)}>✏️ Sửa</button>
                              <button onClick={() => handleDeleteReview(review.id)}>🗑️ Xóa</button>
                            </div>
                          )}
                        </>
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
