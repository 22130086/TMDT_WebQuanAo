import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { productService } from "../services/productService";
import { addToCart } from "../services/cartService";

import "../styles/product-detail.css";

const FALLBACK_IMAGE =
  "https://placehold.co/600x600?text=No+Image";

interface Review {
  id: number;
  author: string;
  avatar: string;
  rating: number;
  content: string;
  date: string;
}

interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  sold: string;
  image: string;
}

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

  reviews?: Review[];

  relatedProducts?: RelatedProduct[];
}

export default function ProductDetail() {

  const { id } = useParams();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [selectedImage, setSelectedImage] =
    useState(FALLBACK_IMAGE);

  const [quantity, setQuantity] =
    useState(1);

  const [addingToCart, setAddingToCart] =
    useState(false);

  useEffect(() => {

    async function fetchProduct() {

      try {

        setLoading(true);

        if (!id) return;

        const response =
          await productService.getProductById(Number(id));

        if (response.success) {

          const data = response.data;

          setProduct({
            ...data,

            rating: 4.9,
            reviewCount: 128,
            soldCount: "1.2k",

            factoryName:
              data.factoryName || "Azure Industrial",

            onlineStatus:
              "Online 2 giờ trước",

            reviews: [
              {
                id: 1,
                author: "Nguyễn Văn A",
                avatar: "https://i.pravatar.cc/50?img=1",
                rating: 5,
                content:
                  "Chất lượng rất tốt, đường may đẹp.",
                date: "12/05/2024",
              },
            ],

            relatedProducts: [],
          });

          if (
            data.imageUrls &&
            data.imageUrls.length > 0
          ) {
            setSelectedImage(data.imageUrls[0]);
          }

        }

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }
    }

    fetchProduct();

  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity);
      
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error: any) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
      alert(
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi thêm sản phẩm vào giỏ hàng!"
      );
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <h2 className="loading-text">
        Đang tải sản phẩm...
      </h2>
    );
  }

  if (!product) {
    return (
      <h2 className="error-text">
        Không tìm thấy sản phẩm
      </h2>
    );
  }

  return (
    <>
      <Header />

      <div className="product-detail-page">

        {/* DETAIL */}

        <div className="detail-wrapper">

          {/* LEFT */}

          <div className="detail-left">

            <img
              src={selectedImage}
              alt={product.name}
              className="main-image"
            />

            <div className="thumbnail-list">

              {product.imageUrls?.map((img, idx) => (

                <img
                  key={idx}
                  src={img}
                  alt="thumb"
                  className={`thumb ${
                    selectedImage === img
                      ? "active-thumb"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedImage(img)
                  }
                />

              ))}

            </div>

          </div>

          {/* RIGHT */}

          <div className="detail-right">

            <h1 className="product-title">
              {product.name}
            </h1>

            <div className="rating-row">

              <span className="rating-score">
                {product.rating}
              </span>

              <span className="review-count">
                {product.reviewCount} đánh giá
              </span>

              <span className="sold-count">
                {product.soldCount} đã bán
              </span>

            </div>

            <div className="price-box">
              {Number(product.price)
                .toLocaleString("vi-VN")}đ
            </div>

            <div className="shipping-box">
              <div>🚚 Miễn phí vận chuyển</div>
            </div>

            <div className="quantity-box">

              <span>Số lượng:</span>

              <button
                onClick={() =>
                  setQuantity(
                    quantity > 1
                      ? quantity - 1
                      : 1
                  )
                }
              >
                -
              </button>

              <span>{quantity}</span>

              <button
                onClick={() =>
                  setQuantity(quantity + 1)
                }
              >
                +
              </button>

            </div>

            <div className="action-buttons">

              <button
                className="add-cart-btn"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </button>

              <button
                className="buy-btn"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                Mua ngay
              </button>

            </div>

          </div>

        </div>

        {/* FACTORY */}

        <section className="factory-section">

          <div className="factory-left">

            <img
              src="https://i.pravatar.cc/100?img=7"
              alt="factory"
            />

            <div>

              <h3>
                {product.factoryName}
              </h3>

              <p>
                {product.onlineStatus}
              </p>

            </div>

          </div>

        </section>

        {/* DESCRIPTION */}

        <section className="description-section">

          <h2>
            CHI TIẾT SẢN PHẨM
          </h2>

          <p>
            {product.description}
          </p>

        </section>

        {/* REVIEWS */}

        <section className="review-section">

          <h2>
            ĐÁNH GIÁ
          </h2>

          {product.reviews?.map((review) => (

            <div
              className="review-item"
              key={review.id}
            >

              <img
                src={review.avatar}
                alt={review.author}
              />

              <div>

                <h4>
                  {review.author}
                </h4>

                <p>
                  {"⭐".repeat(review.rating)}
                </p>

                <p>
                  {review.content}
                </p>

                <small>
                  {review.date}
                </small>

              </div>

            </div>

          ))}

        </section>

      </div>

      <Footer />
    </>
  );
}