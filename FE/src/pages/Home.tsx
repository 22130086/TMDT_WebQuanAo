import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  fetchFactories,
  fetchProducts,
} from "../services/catalogService";
import type { FactoryCard, ProductCard } from "../services/catalogService";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [factories, setFactories] = useState<FactoryCard[]>([]);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  function handleLogout() {
    localStorage.removeItem("auth_token");
    navigate("/");
  }

  return (
    <main className="home-page">
      <Header onLogout={handleLogout} />

      <div className="page-container">
        {error && <div className="list-error">{error}</div>}

        <section className="content-section" id="factories">
          <div className="section-header">
            <div>
              <p className="section-label">ĐỐI TÁC CAO CẤP</p>
              <h2>XƯỞNG MAY NỔI BẬT</h2>
            </div>
            <a href="#products">Xem tất cả →</a>
          </div>

          {loading ? (
            <div className="loading-state">Đang tải xưởng may...</div>
          ) : (
            <div className="factory-grid">
              {factories.length > 0 ? (
                factories.map((factory) => (
                  <div className="factory-card" key={factory.id}>
                    <div className="card-badge">TOP</div>
                    <img
                      src={
                        factory.imageUrls?.[0] ||
                        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop"
                      }
                      alt={factory.factoryName}
                    />
                    <div className="factory-info">
                      <h3>{factory.factoryName}</h3>
                      <p>{factory.description || "Xưởng may chất lượng cao"}</p>
                      <div className="rating">
                        <span className="material-symbols-outlined">star</span>
                        <span>{factory.ratingAvg ?? 4.8}</span>
                      </div>
                      <div className="price">Từ 50.000đ</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Chưa có xưởng nào để hiển thị.</div>
              )}
            </div>
          )}
        </section>

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
                  <div className="product-card" key={product.id}>
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
                        <div>
                          <p className="price">{product.price}</p>
                          <span className="old-price">250.000đ</span>
                        </div>
                        <button className="cart-btn">
                          <span className="material-symbols-outlined">
                            shopping_bag
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Chưa có sản phẩm để hiển thị.</div>
              )}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
