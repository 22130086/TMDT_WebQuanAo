import { useState, useEffect } from "react";
import "../styles/send-quote.css";
import { useSearchParams } from "react-router-dom";

interface Post {
    id: string;
    title: string;
    quantity: number;
    budgetMin: number;
    budgetMax: number;
    deadline: string;
    customerName: string;
}

const MOCK_POST: Post = {
    id: "1",
    title: "Áo thun Cotton 100% in logo",
    quantity: 500,
    budgetMin: 80000,
    budgetMax: 120000,
    deadline: "2024-11-20",
    customerName: "Minh Khang Group",
};

interface Props {
    onNavigate: (target: string) => void;
}

export default function SendQuote({ onNavigate }: Props) {
    const [post, setPost]           = useState<Post | null>(null);
    const [loading, setLoading]     = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]     = useState(false);
    const [error, setError]         = useState<string | null>(null);

    const [unitPrice, setUnitPrice] = useState("");
    const [prodDays, setProdDays]   = useState("15");
    const [delivDays, setDelivDays] = useState("3");
    const [notes, setNotes]         = useState("");

    const [searchParams] = useSearchParams();
    const postId = searchParams.get("id") ?? "1";

    const total = unitPrice
        ? (parseFloat(unitPrice) * (post?.quantity ?? 0)).toLocaleString("vi-VN") + "đ"
        : "—";

    const completionDate = prodDays
        ? new Date(Date.now() + parseInt(prodDays) * 86400000).toLocaleDateString("vi-VN")
        : "—";

    // ── Fetch post info ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/posts/${postId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error();
            const json = await res.json();
            setPost(json.data);
        } catch {
            setPost(MOCK_POST);
        } finally {
            setLoading(false);
        }
    };

    // ── Submit báo giá ───────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!unitPrice || parseFloat(unitPrice) <= 0) {
            setError("Vui lòng nhập đơn giá hợp lệ.");
            return;
        }
        if (!post) return;

        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/factory/quotations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    postId:       parseInt(postId),
                    unitPrice:    parseFloat(unitPrice),
                    quantity:     post.quantity,
                    note:         notes,
                    deliveryDays: parseInt(delivDays),
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.message ?? "Gửi báo giá thất bại");
            }

            setSuccess(true);
            setTimeout(() => {
                onNavigate("list");
            }, 1800);
        } catch (e: any) {
            setError(e.message ?? "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("vi-VN");
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="sq-state">
                <span className="material-symbols-outlined sq-spin">autorenew</span>
                <p>Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="sq-page">
            {/* Breadcrumb */}
            <div className="sq-breadcrumb">
                <span onClick={() => onNavigate("list")}>Yêu cầu gia công</span>
                <span className="material-symbols-outlined">chevron_right</span>
                <span>Gửi báo giá</span>
            </div>

            {/* Header */}
            <div className="sq-header">
                <h2>Gửi báo giá</h2>
                <p>Kiểm tra kỹ thông tin yêu cầu trước khi nhập đơn giá và điều kiện sản xuất.</p>
            </div>

            <div className="sq-grid">
                {/* Left — thông tin bài đăng */}
                <div className="sq-left-card">
                    <div className="sq-left-top">
                        <span>Thông tin yêu cầu</span>
                        <span className="material-symbols-outlined sq-check">check_circle</span>
                    </div>

                    <img
                        className="sq-product-img"
                        src="https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=200&fit=crop"
                        alt="product"
                    />

                    <div className="sq-product-info">
                        <h4>{post?.title}</h4>

                        <div className="sq-meta-row">
                            <div className="sq-meta-item">
                                <label>Số lượng</label>
                                <span>
                                    <span className="material-symbols-outlined">inventory_2</span>
                                    {post?.quantity.toLocaleString("vi-VN")} cái
                                </span>
                            </div>
                            <div className="sq-meta-item">
                                <label>Thời hạn</label>
                                <span>
                                    <span className="material-symbols-outlined">schedule</span>
                                    {formatDate(post?.deadline ?? "")}
                                </span>
                            </div>
                        </div>

                        <div className="sq-meta-row">
                            <div className="sq-meta-item">
                                <label>Ngân sách</label>
                                <span>
                                    {post?.budgetMin.toLocaleString("vi-VN")}đ
                                    {" – "}
                                    {post?.budgetMax.toLocaleString("vi-VN")}đ
                                </span>
                            </div>
                            <div className="sq-meta-item">
                                <label>Khách hàng</label>
                                <span>{post?.customerName}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right — form báo giá */}
                <div>
                    <div className="sq-right-card">
                        <h3>Biểu mẫu báo giá</h3>

                        <div className="sq-form-grid">
                            <div className="sq-form-group">
                                <label>Đơn giá mỗi sản phẩm (VNĐ)</label>
                                <div className="sq-input-wrap">
                                    <span className="sq-prefix">đ</span>
                                    <input
                                        type="number"
                                        placeholder="Nhập giá mỗi cái"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="sq-form-group">
                                <label>Tổng giá trị đơn hàng</label>
                                <div className="sq-input-wrap">
                                    <span className="sq-prefix">đ</span>
                                    <input type="text" value={total} readOnly className="sq-input-readonly" />
                                </div>
                            </div>

                            <div className="sq-form-group">
                                <label>Thời gian sản xuất (ngày)</label>
                                <div className="sq-input-wrap">
                                    <input
                                        type="number"
                                        value={prodDays}
                                        onChange={(e) => setProdDays(e.target.value)}
                                    />
                                    <span className="sq-suffix">ngày</span>
                                </div>
                                <div className="sq-completion">
                                    <span>Dự kiến hoàn thành:</span>
                                    <strong>{completionDate}</strong>
                                </div>
                            </div>

                            <div className="sq-form-group">
                                <label>Thời gian giao hàng (ngày)</label>
                                <div className="sq-input-wrap">
                                    <input
                                        type="number"
                                        value={delivDays}
                                        onChange={(e) => setDelivDays(e.target.value)}
                                    />
                                    <span className="sq-suffix">ngày</span>
                                </div>
                            </div>
                        </div>

                        <div className="sq-form-group sq-form-group--full">
                            <label>Ghi chú cho khách hàng</label>
                            <textarea
                                className="sq-textarea"
                                placeholder="Nhập cam kết chất lượng, quy trình in ấn hoặc ưu đãi kèm theo..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="sq-error">
                                <span className="material-symbols-outlined">error</span>
                                {error}
                            </div>
                        )}

                        <div className="sq-btn-row">
                            <button
                                className="btn-sq-submit"
                                onClick={handleSubmit}
                                disabled={submitting || success}
                            >
                                {submitting ? (
                                    <>
                                        <span className="material-symbols-outlined sq-spin">autorenew</span>
                                        Đang gửi...
                                    </>
                                ) : success ? (
                                    <>
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Đã gửi thành công!
                                    </>
                                ) : (
                                    "Gửi báo giá"
                                )}
                            </button>
                            <button
                                className="btn-sq-cancel"
                                onClick={() => onNavigate("list")}
                                disabled={submitting}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>

                    <div className="sq-support-box">
                        <div>
                            <h4>Bạn cần tư vấn kỹ thuật?</h4>
                            <p>Đội ngũ kỹ thuật Azure luôn sẵn sàng hỗ trợ tính toán chi phí tối ưu.</p>
                        </div>
                        <button className="btn-connect-tech">
                            <span className="material-symbols-outlined">support_agent</span>
                            Kết nối kỹ thuật viên
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast success */}
            {success && (
                <div className="sq-toast">
                    <span className="material-symbols-outlined">check_circle</span>
                    Gửi báo giá thành công! Đang chuyển về danh sách...
                </div>
            )}
        </div>
    );
}