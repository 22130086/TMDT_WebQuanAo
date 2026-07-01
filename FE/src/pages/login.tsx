import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveAuthToken, saveUserRole, sendOtpForgotPassword, resetPassword } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    setLoading(true);

    try {
      const data = await login({ email, password });
      console.log("Dữ liệu đăng nhập nhận được:", data);

      if (data && data.token) {
        saveAuthToken(data.token);
        saveUserRole(data.role);
        setSuccess("Đăng nhập thành công!");

        setTimeout(() => {
          if (data.role === "ADMIN") {
            navigate("/admin");
          } else if (data.role === "FACTORY") {
            navigate("/factory");
          } else {
            navigate("/home");
          }
        }, 800);
      } else {
        setError("Không nhận được mã xác thực Token từ máy chủ.");
      }
    } catch (err: any) {
      console.error("Lỗi khi thực hiện đăng nhập:", err);
      const msg = err?.response?.data?.message || err?.message || "Đã xảy ra lỗi khi đăng nhập";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function openForgotModal() {
    setShowForgotModal(true);
    setForgotStep(1);
    setForgotError("");
    setForgotSuccess("");
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  async function handleSendForgotOtp(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotEmail) return setForgotError("Vui lòng nhập email");

    setForgotLoading(true);
    try {
      await sendOtpForgotPassword(forgotEmail);
      setForgotSuccess("Đã gửi mã OTP đến email của bạn.");
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || "Lỗi gửi mã OTP");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotOtp || !newPassword || !confirmNewPassword) return setForgotError("Vui lòng nhập đầy đủ thông tin");
    if (newPassword !== confirmNewPassword) return setForgotError("Mật khẩu không khớp");

    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail, forgotOtp, newPassword);
      setForgotSuccess("Đổi mật khẩu thành công! Chuyển hướng đăng nhập...");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
      }, 2000);
    } catch (err: any) {
      setForgotError(err.message || "Lỗi xác nhận");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="login-page">
      {/* LEFT */}
      <section className="login-left">
        <div className="overlay"></div>

        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl5HQC5Ai03oHcLKPGXT_ITZXhlXepgtOQtbmuRk04iUPQRMuVJHcP1OjMJuonWXqsEqiF0ALTdxXtp4StGXaFiP-2B_Qmro0exsEPPNSjBz1opksFIFcF-tOzrbqUy5EIklLp-lqiSlXrRevWkiAxV-M4NT5Z1_fgjI6enoazhFAL7W7rXSBghfbFIsPV_MiX7sO0G9brH7KzfBeTtsgY0xQV19SLTUvY63AJhCJqahYa5rqKkp5NQoiLonkuLjrweX--vRv9qbB4"
          alt="Factory"
        />

        <div className="left-content">
          <div className="brand">
            <span className="material-symbols-outlined filled">
              precision_manufacturing
            </span>
            <span className="brand-name">Azure</span>
          </div>

          <h1>Kết nối xưởng may với khách hàng</h1>

          <p className="subtitle">
            Thiết kế – sản xuất – giao hàng toàn quốc
          </p>

          <div className="users">
            <div className="avatars">
              <div>JD</div>
              <div>MS</div>
              <div>AK</div>
            </div>
            <span>Hơn 500+ xưởng may đã tham gia</span>
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <section className="login-right">
        <div className="login-card">
          <div className="card-header">
            <h2>Đăng nhập</h2>
            <p>Chào mừng bạn quay lại với hệ thống quản lý Blueprint.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="example@blueprint.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <span className="material-symbols-outlined icon">person</span>
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined icon">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={openForgotModal}
                className="forgot-btn"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <div className="divider">
            <span>Hoặc</span>
          </div>

          <div className="social-buttons">
            <button className="social-btn" type="button">
              Google
            </button>
            <button className="social-btn" type="button">
              Facebook
            </button>
          </div>

          <div className="register">
            <p>
              Chưa có tài khoản?
              <Link to="/register"> Đăng ký ngay</Link>
            </p>
          </div>
        </div>

        <footer className="footer">
          <p>© 2024 Azure. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Help Center</a>
          </div>
        </footer>
      </section>

      {/* Modal Quên mật khẩu */}
      {showForgotModal && (
        <div
          className="forgot-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForgotModal(false); setForgotStep(1); } }}
        >
          <div className="forgot-modal-box">
            {/* Nút đóng */}
            <button type="button" className="forgot-modal-close" onClick={() => { setShowForgotModal(false); setForgotStep(1); }}>×</button>

            {/* Bước 1: Nhập Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendForgotOtp}>
                <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                  <div className="forgot-modal-icon">🔐</div>
                  <h3 className="forgot-modal-title">Quên mật khẩu</h3>
                  <p className="forgot-modal-desc">Nhập email của bạn để nhận mã xác nhận</p>
                </div>

                {forgotError && <div className="forgot-modal-error" style={{ marginBottom: "0.75rem" }}>{forgotError}</div>}
                {forgotSuccess && <div className="forgot-modal-success" style={{ marginBottom: "0.75rem" }}>{forgotSuccess}</div>}

                <div style={{ marginBottom: "1rem" }}>
                  <label className="forgot-modal-label">Email</label>
                  <input
                    type="email"
                    placeholder="email@vi-du.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="forgot-modal-input"
                    required
                  />
                </div>

                <button type="submit" className="forgot-modal-btn" disabled={forgotLoading}>
                  {forgotLoading ? "Đang gửi..." : "Gửi mã OTP"}
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>send</span>
                </button>
              </form>
            )}

            {/* Bước 2: Nhập OTP + Mật khẩu mới */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword}>
                <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                  <div className="forgot-modal-icon">📩</div>
                  <h3 className="forgot-modal-title">Đặt lại mật khẩu</h3>
                  <p className="forgot-modal-desc">Mã OTP đã gửi đến <strong>{forgotEmail}</strong></p>
                </div>

                {forgotError && <div className="forgot-modal-error" style={{ marginBottom: "0.75rem" }}>{forgotError}</div>}
                {forgotSuccess && <div className="forgot-modal-success" style={{ marginBottom: "0.75rem" }}>{forgotSuccess}</div>}

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="forgot-modal-label">Mã OTP</label>
                  <input
                    type="text" maxLength={6} placeholder="••••••"
                    value={forgotOtp} onChange={e => setForgotOtp(e.target.value)}
                    className="forgot-modal-input forgot-modal-input-otp"
                    required
                  />
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="forgot-modal-label">Mật khẩu mới</label>
                  <input
                    type="password" placeholder="••••••••"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="forgot-modal-input" minLength={6} required
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label className="forgot-modal-label">Xác nhận mật khẩu mới</label>
                  <input
                    type="password" placeholder="••••••••"
                    value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                    className="forgot-modal-input" required
                  />
                </div>

                <button type="submit" className="forgot-modal-btn" disabled={forgotLoading} style={{ marginBottom: "0.5rem" }}>
                  {forgotLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>lock_reset</span>
                </button>

                <button type="button" onClick={() => { setForgotStep(1); setForgotError(""); setForgotSuccess(""); }} className="forgot-modal-btn-back">
                  ← Dùng email khác
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
