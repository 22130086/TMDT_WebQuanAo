import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { productService } from "../services/productService";
import "../styles/products.css";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryName?: string;
  imageUrls?: string[];
}

export default function Products() {

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts(searchKeyword = "") {
    try {

      setLoading(true);

      const response = await productService.getProducts(
        0,
        20,
        searchKeyword
      );

      if (response.success) {
        setProducts(response.data.content || []);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchProducts(keyword);
  }

  return (
    <>
      <Header />

      <div className="products-page">

        {/* HERO */}
        <section className="products-hero">
          <div className="hero-overlay">
            <h1>SẢN PHẨM MAY MẶC</h1>
            <p>
              Kết nối trực tiếp với các xưởng may uy tín toàn quốc
            </p>

            <form
              className="product-search-box"
              onSubmit={handleSearch}
            >
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />

              <button type="submit">
                Tìm kiếm
              </button>
            </form>
          </div>
        </section>

        {/* PRODUCT GRID */}
        <section className="products-section">

          <div className="section-header">
            <h2>TẤT CẢ SẢN PHẨM</h2>
            <span>{products.length} sản phẩm</span>
          </div>

          {loading ? (
            <div className="loading-box">
              Đang tải sản phẩm...
            </div>
          ) : (

            <div className="products-grid">

              {products.map((product) => (

                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className="product-card"
                >

                  <div className="product-image-wrapper">

                    <img
                      src={
                        product.imageUrls &&
                        product.imageUrls.length > 0
                          ? product.imageUrls[0]
                          : "https://placehold.co/600x600?text=No+Image"
                      }
                      alt={product.name}
                      className="product-image"
                    />

                  </div>

                  <div className="product-info">

                    <span className="product-category">
                      {product.categoryName || "Thời trang"}
                    </span>

                    <h3 className="product-name">
                      {product.name}
                    </h3>

                    <p className="product-description">
                      {product.description}
                    </p>

                    <div className="product-bottom">

                      <div className="product-price">
                        {Number(product.price).toLocaleString("vi-VN")}đ
                      </div>

                      <button className="view-btn">
                        Xem ngay
                      </button>

                    </div>

                  </div>

                </Link>

              ))}

            </div>

          )}

        </section>

      </div>

      <Footer />
    </>
  );
}