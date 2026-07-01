import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { customerService, type UserProfile } from "../../services/customerService";
import "../../styles/customer-profile.css";

// ========================
// HELPERS
// ========================

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ========================
// COMPONENT
// ========================

export default function CustomerProfile() {
  const navigate = useNavigate();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // States cho form chỉnh sửa
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState(""); // 🌟 Thêm state lưu địa chỉ sửa đổi
  
  const [savingProfile, setSavingProfile] = useState(false);

  // ========================
  // LOAD PROFILE
  // ========================

  useEffect(() => {
    (async () => {
      try {
        setProfileLoading(true);
        const res = await customerService.getProfile();
        if (res.success) {
          setProfile(res.data);
          setEditName(res.data.fullName || "");
          setEditPhone(res.data.phone || "");
          setEditAddress(res.data.address || ""); // 🌟 Gán giá trị địa chỉ khi tải dữ liệu
        }
      } catch (err) {
        console.error("Lỗi tải hồ sơ:", err);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  // ========================
  // HANDLERS
  // ========================

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await customerService.updateProfile({
        fullName: editName,
        phone: editPhone,
        address: editAddress, // 🌟 Gửi kèm address lên API cập nhật
      });
      if (res.success) {
        setProfile(res.data);
        setEditing(false);
        alert("Cập nhật hồ sơ thành công!");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setSavingProfile(false);
    }
  };

  // ========================
  // RENDER
  // ========================

  if (profileLoading) {
    return (
      <>
        <Header />
        <div className="cp-loading">Đang tải hồ sơ...</div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="customer-profile-page">
        <h1 className="cp-title">Hồ sơ của tôi</h1>

        {/* ============ TABS ============ */}
        <div className="cp-tabs">
          <button className="cp-tab active">
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 4 }}>person</span> Thông tin cá nhân
          </button>
          <button className="cp-tab" onClick={() => navigate("/order-history")}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 4 }}>inventory_2</span> Đơn hàng của tôi
          </button>
          <button className="cp-tab" onClick={() => navigate("/my-disputes")}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 4 }}>gavel</span> Tranh chấp
          </button>
          <button className="cp-tab" onClick={() => navigate("/my-complaints")}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 4 }}>report_problem</span> Khiếu nại
          </button>
          <button className="cp-tab" onClick={() => navigate("/my-reviews")}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 4 }}>reviews</span> Đánh giá của tôi
          </button>
        </div>

        {/* ============ PROFILE CARD ============ */}
        {profile && (
          <div className="cp-section">
            <div className="cp-profile-card">
              <div className="cp-avatar-section">
                <img
                  src={profile.avatarUrl || "https://i.pravatar.cc/120?img=12"}
                  alt="avatar"
                  className="cp-avatar"
                />
                <h2>{profile.fullName || "Chưa cập nhật tên"}</h2>
                <span className="cp-role-badge">{profile.role}</span>
              </div>

              <div className="cp-info-section">
                {editing ? (
                  // ---------------- CHẾ ĐỘ CHỈNH SỬA (FORM) ----------------
                  <div className="cp-edit-form">
                    <div className="cp-field">
                      <label>Email</label>
                      <input type="email" value={profile.email} disabled />
                      <small>Email không thể thay đổi</small>
                    </div>
                    
                    <div className="cp-field">
                      <label>Họ và tên</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nhập họ tên"
                      />
                    </div>
                    
                    <div className="cp-field">
                      <label>Số điện thoại</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    {/* 🌟 THÊM Ô NHẬP ĐỊA CHỈ TRONG FORM SỬA */}
                    <div className="cp-field">
                      <label>Địa chỉ</label>
                      <textarea
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Nhập địa chỉ của bạn..."
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          minHeight: "80px",
                          fontFamily: "inherit"
                        }}
                      />
                    </div>

                    <div className="cp-field">
                      <label>Ngày tham gia</label>
                      <input type="text" value={formatDate(profile.createdAt)} disabled />
                    </div>

                    <div className="cp-edit-actions">
                      <button className="cp-save-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                        {savingProfile ? "Đang lưu..." : "💾 Lưu thay đổi"}
                      </button>
                      <button 
                        type="button"
                        className="cp-cancel-btn" 
                        onClick={() => { 
                          setEditing(false); 
                          setEditName(profile.fullName || ""); 
                          setEditPhone(profile.phone || ""); 
                          setEditAddress(profile.address || ""); // 🌟 Reset lại địa chỉ cũ khi Hủy
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  // ---------------- CHẾ ĐỘ XEM THÔNG TIN ----------------
                  <div className="cp-info-view">
                    <div className="cp-info-row">
                      <span className="cp-label">Email</span>
                      <span className="cp-value">{profile.email}</span>
                    </div>
                    
                    <div className="cp-info-row">
                      <span className="cp-label">Họ và tên</span>
                      <span className="cp-value">{profile.fullName || "Chưa cập nhật"}</span>
                    </div>
                    
                    <div className="cp-info-row">
                      <span className="cp-label">Số điện thoại</span>
                      <span className="cp-value">{profile.phone || "Chưa cập nhật"}</span>
                    </div>

                    {/* 🌟 HIỂN THỊ ĐỊA CHỈ TRÊN VIEW */}
                    <div className="cp-info-row">
                      <span className="cp-label">Địa chỉ</span>
                      <span className="cp-value" style={{ lineHeight: "1.5" }}>
                        {profile.address || "Chưa cập nhật"}
                      </span>
                    </div>

                    <div className="cp-info-row">
                      <span className="cp-label">Ngày tham gia</span>
                      <span className="cp-value">{formatDate(profile.createdAt)}</span>
                    </div>

                    <button className="cp-edit-btn" onClick={() => setEditing(true)}>
                      ✏️ Chỉnh sửa hồ sơ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}