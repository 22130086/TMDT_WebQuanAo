import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import {
  fetchFactories,
  fetchProducts,
} from "../../services/catalogService";
import type { FactoryCard, ProductCard } from "../../services/catalogService";
import "../../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [factories, setFactories] = useState<FactoryCard[]>([]);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State quản lý xưởng đang được đưa lên banner chính
  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError("");

      try {
        const [factoryPage, productPage] = await Promise.all([
          fetchFactories(0, 5),
          fetchProducts(0, 10),
        ]);

        setFactories(
          factoryPage.content.slice(0, 5).map((factory) => ({
            id: factory.id,
            factoryName: factory.factoryName,
            description: factory.description,
            address: factory.address,
            ratingAvg: factory.ratingAvg,
            imageUrls: factory.imageUrls || [],
          }))
        );

        setProducts(
          productPage.content.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrls: product.imageUrls || [],
            factoryName: product.factoryName,
          }))
        );
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Scroll to hash when page loads
  useEffect(() => {
    if (window.location.hash === "#factories") {
      setTimeout(() => {
        document.getElementById("factories")?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, []);

  // TỰ ĐỘNG CHUYỂN SLIDE SAU 5 GIÂY
  useEffect(() => {
    if (factories.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % factories.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [factories.length]);

  // HÀM XỬ LÝ NÚT CHUYỂN BANNER BẰNG TAY
  function showNextFeatured() {
    if (!factories || factories.length === 0) return;
    setFeaturedIndex((prev) => (prev + 1) % factories.length);
  }

  function showPrevFeatured() {
    if (!factories || factories.length === 0) return;
    setFeaturedIndex((prev) => (prev - 1 + factories.length) % factories.length);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    navigate("/");
  }

  // Khai báo biến chứa thông tin Xưởng đang nổi bật
  const featuredFactory = factories[featuredIndex];

  return (
    <main className="home-page">
      <Header onLogout={handleLogout} />

      <div className="page-container">
        {error && <div className="list-error">{error}</div>}

        {/* ======================================================== */}
        {/* SECTION: XƯỞNG MAY NỔI BẬT (BANNER DẠNG CAROUSEL)         */}
        {/* ======================================================== */}
        <section className="content-section" id="factories">
          <div className="section-header">
            <div>
              <p className="section-label">ĐỐI TÁC CAO CẤP</p>
              <h2>XƯỞNG MAY NỔI BẬT</h2>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Đang tải xưởng may...</div>
          ) : factories.length === 0 ? (
            <div className="empty-state">Chưa có xưởng nào để hiển thị.</div>
          ) : (
            <div className="factory-banner-container">

              {/* 1. CARD TO NỔI BẬT Ở TRÊN */}
              {featuredFactory && (
                <div className="factory-hero-banner">
                  {/* Nút lùi */}
                  <button className="banner-nav-btn prev" onClick={showPrevFeatured}>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>

                  <div className="hero-content">
                    <img
                      src={featuredFactory.imageUrls?.[0] || "https://via.placeholder.com/800x400"}
                      alt={featuredFactory.factoryName}
                      className="hero-image"
                    />
                    <div className="hero-info">
                      <div className="hero-badge">TOP 1 THÁNG</div>
                      <h3>{featuredFactory.factoryName}</h3>
                      <div className="factory-card-rating">
                        <span className="material-symbols-outlined">star</span>
                        <span>{featuredFactory.ratingAvg ?? 4.8} / 5.0</span>
                      </div>
                      <p className="hero-desc">{featuredFactory.description || "Xưởng may chất lượng cao uy tín hàng đầu."}</p>

                      <Link to={`/factory-profile/${featuredFactory.id}`} className="btn-view-details">
                        Xem chi tiết xưởng
                      </Link>
                    </div>
                  </div>

                  {/* Nút tiến */}
                  <button className="banner-nav-btn next" onClick={showNextFeatured}>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}

              {/* 2. DANH SÁCH CARD NHỎ NGANG Ở DƯỚI (THUMBNAILS) */}
              <div className="factory-thumbnails-row">
                {factories.map((factory, index) => (
                  <div
                    key={factory.id}
                    className={`thumb-card ${index === featuredIndex ? 'active' : ''}`}
                    onClick={() => setFeaturedIndex(index)}
                  >
                    <img
                      src={factory.imageUrls?.[0] || "https://via.placeholder.com/150"}
                      alt={factory.factoryName}
                    />
                    <div className="thumb-info">
                      <h4>{factory.factoryName}</h4>
                      <span className="thumb-rating">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>star</span>{" "}
                        {factory.ratingAvg ?? 4.8}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* SECTION: GỢI Ý SẢN PHẨM HÔM NAY                           */}
        {/* ======================================================== */}
        <section className="content-section" id="products">
          <div className="section-header">
            <h2>GỢI Ý HÔM NAY</h2>
          </div>

          {loading ? (
            <div className="loading-state">Đang tải sản phẩm...</div>
          ) : (
            <div className="product-grid">
              {products.length > 0 ? (
                products.map((product) => (
                  <div
                    className="product-card"
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="sale-badge">-15%</div>
                    <img
                      src={
                        product.imageUrls?.[0] ||
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop"
                      }
                      alt={product.name}
                    />
                    <div className="product-info">
                      <p className="product-category">
                        {product.factoryName || "Áo thun thời trang"}
                      </p>
                      <h3>{product.name}</h3>
                      <div className="rating">
                        <span className="material-symbols-outlined">star</span>
                        <span>4.8</span>
                      </div>
                      <div className="product-bottom">
                        <span className="price">
                          {product.price.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Chưa có sản phẩm nào.</div>
              )}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
