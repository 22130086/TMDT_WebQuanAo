import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/factory-profile.css";

interface StatItem {
  label: string;
  value: string | number;
  suffix?: string;
  icon: string;
}

interface StrengthItem {
  icon: string;
  title: string;
  description: string;
}

interface Certificate {
  name: string;
  issuer: string;
  icon: string;
}

interface Project {
  name: string;
  description: string;
  image: string;
}

const FactoryProfile: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "overview" | "capacity" | "certificates" | "projects"
  >("overview");

  const stats: StatItem[] = [
    {
      label: "Máy móc JUKI",
      value: "450+",
      icon: "precision_manufacturing",
    },
    {
      label: "Năng suất",
      value: "50k",
      suffix: "sp/tháng",
      icon: "speed",
    },
    {
      label: "Đánh giá",
      value: "4.9",
      suffix: "★",
      icon: "star",
    },
    {
      label: "Kinh nghiệm",
      value: "15+",
      suffix: "năm",
      icon: "history_edu",
    },
  ];

  const strengths: StrengthItem[] = [
    {
      icon: "apparel",
      title: "Áo thun in logo",
      description:
        "Chất lượng vải cao cấp, in ấn sắc nét, bền màu.",
    },
    {
      icon: "checkroom",
      title: "Hoodie Oversize",
      description:
        "Form unisex, vải cotton 380gsm, phong cách trẻ trung.",
    },
    {
      icon: "business_center",
      title: "Đồng phục doanh nghiệp",
      description:
        "May đo chuyên nghiệp, phù hợp với văn hóa công ty.",
    },
  ];

  const certificates: Certificate[] = [
    {
      name: "ISO 9001:2015",
      issuer: "Quản lý chất lượng toàn cầu",
      icon: "verified",
    },
    {
      name: "WRAP Gold",
      issuer: "Trách nhiệm xã hội & môi trường",
      icon: "eco",
    },
    {
      name: "OEKO-TEX®",
      issuer: "An toàn sợi vải",
      icon: "health_and_safety",
    },
  ];

  const projects: Project[] = [
    {
      name: "Viettel Telecom",
      description: "5.000 áo thun kỹ thuật cao",
      image: "https://picsum.photos/id/20/500/350",
    },
    {
      name: "VinGroup Retail",
      description: "Đồng phục siêu thị cao cấp",
      image: "https://picsum.photos/id/30/500/350",
    },
    {
      name: "FPT Software",
      description: "Áo hoodie team building",
      image: "https://picsum.photos/id/40/500/350",
    },
  ];

  return (
    <div className="factory-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div>

          <div className="brand">

            <div className="brand-logo">
              <span className="material-symbols-outlined">
                factory
              </span>
            </div>

            <div>
              <h2>AZURE
INDUSTRIAL</h2>
              <p>Quản lý may đo</p>
            </div>

          </div>

          <div className="sidebar-menu">

            <div
                className="menu-item"
                onClick={() => navigate("/home")}
              >
                <span className="material-symbols-outlined">
                  dashboard
                </span>

                <span>Tổng quan</span>
              </div>

            <div className="menu-item active">
              <span className="material-symbols-outlined">
                factory
              </span>
              <span>Xưởng may</span>
            </div>

            <div className="menu-item">
              <span className="material-symbols-outlined">
                request_quote
              </span>
              <span>Báo giá & bài đăng yêu cầu</span>
            </div>

            <div className="menu-item">
              <span className="material-symbols-outlined">
                shopping_bag
              </span>
              <span>Đơn hàng</span>
            </div>

            

          </div>

        </div>

        <div className="sidebar-bottom">

          <div className="menu-item">
            <span className="material-symbols-outlined">
              help
            </span>
            <span>Hỗ trợ</span>
          </div>

          <div className="menu-item">
            <span className="material-symbols-outlined">
              settings
            </span>
            <span>Cài đặt</span>
          </div>

        </div>

      </aside>

      {/* MAIN */}
      <main className="main-content">

        {/* HEADER */}
        <header className="top-header">

          <div className="search-box">

            <span className="material-symbols-outlined">
              search
            </span>

            <input
              type="text"
              placeholder="Tìm kiếm xưởng may, mẫu vải..."
            />

          </div>

          <div className="header-right">

            <button className="header-icon">
              <span className="material-symbols-outlined">
                notifications
              </span>
            </button>

            <button className="header-icon">
              <span className="material-symbols-outlined">
                chat
              </span>
            </button>

            <div className="user-box">

              <div>
                <h4>Minh Trần</h4>
                <p>Khách hàng Premium</p>
              </div>

              <img
                src="https://i.pravatar.cc/100"
                alt="avatar"
              />

            </div>

          </div>

        </header>

        {/* CONTENT */}
        <div className="factory-profile">

          {/* HERO */}
          <div className="hero-grid">

            <div className="info-card">

              <div className="logo-wrapper">
                <span className="material-symbols-outlined">
                  factory
                </span>
              </div>

              <div className="info-content">

                <h1>Xưởng may Elite Garment</h1>

                <div className="location">

                  <span className="material-symbols-outlined">
                    location_on
                  </span>

                  <span>KCN VSIP, Thuận An, Bình Dương</span>

                </div>

                <p className="description">
                  Elite Garment là xưởng may chuyên về đồng phục doanh nghiệp,
                  áo thun in logo và hoodie oversize.
                </p>

                <div className="tag-group">
                  <span className="tag">Đồng phục</span>
                  <span className="tag">Streetwear</span>
                  <span className="tag">May số lượng lớn</span>
                </div>

              </div>

              <div className="status-badge">
                Đang hoạt động
              </div>

            </div>

            <div className="cta-card">

              <div className="cta-icon">
                <span className="material-symbols-outlined">
                  request_quote
                </span>
              </div>

              <h3>Bắt đầu dự án của bạn</h3>

              <p>Nhận báo giá chỉ sau 24 giờ làm việc</p>

              <button className="cta-button">
                Yêu cầu báo giá ngay
              </button>

            </div>

          </div>

          {/* STATS */}
          <div className="stats-row">

            {stats.map((stat, idx) => (
              <div className="stat-card" key={idx}>

                <span className="material-symbols-outlined stat-icon">
                  {stat.icon}
                </span>

                <div className="stat-value">
                  {stat.value}

                  {stat.suffix && (
                    <span className="stat-unit">
                      {stat.suffix}
                    </span>
                  )}
                </div>

                <div className="stat-label">
                  {stat.label}
                </div>

              </div>
            ))}

          </div>

          {/* TABS */}
          <div className="tabs-container">

            <button
              className={`tab-btn ${
                activeTab === "overview" ? "active" : ""
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Tổng quan
            </button>

            <button
              className={`tab-btn ${
                activeTab === "capacity" ? "active" : ""
              }`}
              onClick={() => setActiveTab("capacity")}
            >
              Năng lực sản xuất
            </button>

            <button
              className={`tab-btn ${
                activeTab === "certificates" ? "active" : ""
              }`}
              onClick={() => setActiveTab("certificates")}
            >
              Chứng chỉ
            </button>

            <button
              className={`tab-btn ${
                activeTab === "projects" ? "active" : ""
              }`}
              onClick={() => setActiveTab("projects")}
            >
              Dự án
            </button>

          </div>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="panel-grid">

              <div>

                <div className="gallery-grid">

                  <div className="gallery-main">
                    <img
                      src="https://picsum.photos/id/10/900/500"
                      alt=""
                    />
                  </div>

                  <div className="gallery-thumb">
                    <img
                      src="https://picsum.photos/id/24/400/300"
                      alt=""
                    />
                  </div>

                  <div className="gallery-thumb">
                    <img
                      src="https://picsum.photos/id/29/400/300"
                      alt=""
                    />
                  </div>

                </div>

                <div className="strengths-section">

                  <h3>Thế mạnh sản phẩm</h3>

                  <div className="strength-grid">

                    {strengths.map((item, idx) => (
                      <div className="strength-card" key={idx}>

                        <span className="material-symbols-outlined">
                          {item.icon}
                        </span>

                        <h4>{item.title}</h4>

                        <p>{item.description}</p>

                      </div>
                    ))}

                  </div>

                </div>

              </div>

              <div className="panel-right">

                <div className="sidebar-card">

                  <h4>Thông tin liên hệ</h4>

                  <div className="contact-item">
                    <span className="material-symbols-outlined">
                      call
                    </span>

                    <div>
                      <p className="label">Hotline</p>
                      <p className="value">0274 388 99XX</p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <span className="material-symbols-outlined">
                      mail
                    </span>

                    <div>
                      <p className="label">Email</p>
                      <p className="value">
                        sales@elitegarment.vn
                      </p>
                    </div>
                  </div>

                </div>

                <div className="sidebar-card">

                  <h4>Chứng chỉ</h4>

                  {certificates.map((cert, idx) => (
                    <div className="cert-item" key={idx}>

                      <span className="material-symbols-outlined">
                        {cert.icon}
                      </span>

                      <div>
                        <h5>{cert.name}</h5>
                        <p>{cert.issuer}</p>
                      </div>

                    </div>
                  ))}

                </div>

              </div>

            </div>
          )}

          {/* PROJECTS */}
          {activeTab === "projects" && (
            <div className="projects-grid">

              {projects.map((project, idx) => (
                <div className="project-card" key={idx}>

                  <img src={project.image} alt="" />

                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <p>{project.description}</p>
                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </main>
    </div>
  );
};

export default FactoryProfile;