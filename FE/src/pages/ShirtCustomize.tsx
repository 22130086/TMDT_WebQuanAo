import { useState } from "react";
import "./ShirtCustomizer.css";

const colors = [
  "#ffffff",
  "#191c1e",
  "#0037b0",
  "#ba1a1a",
  "#2e3132",
  "#edeef0",
  "#747686",
  "#0058be",
  "#dce1ff",
  "#ffdbcf",
];

export default function ShirtCustomizer() {
  const [shirtText, setShirtText] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);

  return (
    <div className="shirt-customizer">
      <main className="customizer-layout">
        {/* Workspace */}
        <section className="workspace blueprint-grid">
          <div className="workspace-header">
            <span className="workspace-label">Workstation 01</span>
            <h1>Tùy chỉnh trang phục</h1>
          </div>

          <div className="view-toggle">
            <button className="active">Front</button>
            <button>Back</button>
          </div>

          <div className="shirt-preview-grid">
            {/* Front */}
            <div className="shirt-preview">
              <div className="shirt-card">
                <svg
                  className="shirt-svg"
                  viewBox="0 0 100 100"
                >
                  <path d="M20,25 Q20,15 35,15 L65,15 Q80,15 80,25 L85,35 L75,45 L75,85 Q75,90 70,90 L30,90 Q25,90 25,85 L25,45 L15,35 Z"></path>
                  <path d="M40,15 Q50,22 60,15"></path>
                  <path
                    className="shirt-line"
                    d="M25,45 L75,45"
                  ></path>
                </svg>

                {shirtText && (
                  <div className="shirt-overlay">
                    {shirtText.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="shirt-footer">
                <span>Mặt trước</span>
              </div>
            </div>

            {/* Back */}
            <div className="shirt-preview">
              <div className="shirt-card">
                <svg
                  className="shirt-svg"
                  viewBox="0 0 100 100"
                >
                  <path d="M20,25 Q20,15 35,15 L65,15 Q80,15 80,25 L85,35 L75,45 L75,85 Q75,90 70,90 L30,90 Q25,90 25,85 L25,45 L15,35 Z"></path>
                  <path d="M35,15 Q50,18 65,15"></path>
                  <path
                    className="shirt-line"
                    d="M25,45 L75,45"
                  ></path>
                </svg>
              </div>

              <div className="shirt-footer">
                <span>Mặt sau</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="design-sidebar">
          <div className="sidebar-header">
            <h2>Bảng điều khiển</h2>
            <p>Cấu hình thiết kế chi tiết</p>
          </div>

          <div className="sidebar-content">
            {/* Colors */}
            <div>
              <h3>Chọn màu áo</h3>

              <div className="color-grid">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    className={`color-swatch ${
                      selectedColor === index ? "active-swatch" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(index)}
                  />
                ))}
              </div>
            </div>

            {/* Logo Library */}
            <div>
              <h3>Thư viện Pattern & Logo</h3>

              <div className="logo-grid">
                <div className="logo-item">★</div>
                <div className="logo-item">♥</div>
                <div className="logo-item">⬢</div>
                <div className="logo-item">△</div>
                <div className="logo-item">🏭</div>
                <div className="logo-item">⚙</div>
                <div className="logo-item">◉</div>
                <div className="logo-item">QR</div>
              </div>
            </div>

            {/* Text */}
            <div>
              <h3>Nội dung tùy chỉnh</h3>

              <input
                type="text"
                placeholder="Nhập nội dung"
                value={shirtText}
                onChange={(e) => setShirtText(e.target.value)}
                className="text-input"
              />

              <div className="info-box">
                Nội dung sẽ được in bằng công nghệ in lụa cao cấp,
                đảm bảo độ bền và sắc nét.
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="save-btn">
              Lưu thiết kế
            </button>
          </div>
        </aside>
      </main>

      <div className="floating-toolbar">
        <span className="online-indicator"></span>
        Factory Online
      </div>
    </div>
  );
}