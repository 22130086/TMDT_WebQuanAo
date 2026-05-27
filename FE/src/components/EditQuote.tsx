import { useState, useEffect } from "react";
import "../styles/edit-quote.css";
import { useSearchParams } from "react-router-dom";

interface Quotation {
    id: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    note: string;
    deliveryDays: number;
    status: string;
    postId: string;
    postTitle: string;
    factoryName: string;
    createdAt: string;
}

interface Props {
    onNavigate: (target: string) => void;
}

export default function EditQuote({ onNavigate }: Props) {
    const [quotation, setQuotation]   = useState<Quotation | null>(null);
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]       = useState(false);
    const [error, setError]           = useState<string | null>(null);

    const [unitPrice, setUnitPrice]   = useState("");
    const [delivDays, setDelivDays]   = useState("7");
    const [notes, setNotes]           = useState("");

    const [searchParams] = useSearchParams();
    const quotationId = searchParams.get("id") ?? "1";

    const total = unitPrice && quotation
        ? (parseFloat(unitPrice) * quotation.quantity).toLocaleString("vi-VN") + "đ"
        : "—";

    const completionDate = delivDays
        ? new Date(Date.now() + parseInt(delivDays) * 86400000).toLocaleDateString("vi-VN")
        : "—";

    // ── Fetch quotation ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchQuotation(quotationId);
    }, [quotationId]);

    const fetchQuotation = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/factory/quotations/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`Lỗi ${res.status}`);
            const json = await res.json();
            if (!json.data) throw new Error("Dữ liệu không hợp lệ.");
            const q: Quotation = json.data;
            setQuotation(q);
            setUnitPrice(String(q.unitPrice));
            setDelivDays(String(q.deliveryDays));
            setNotes(q.note ?? "");
        } catch (e: any) {
            setError(e.message ?? "Không thể tải báo giá.");
        } finally {
            setLoading(false);
        }
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!unitPrice || parseFloat(unitPrice) <= 0) {
            setError("Vui lòng nhập đơn giá hợp lệ.");
            return;
        }
        if (!quotation) return;

        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/factory/quotations/${quotationId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    postId:       parseInt(quotation.postId),
                    unitPrice:    parseFloat(unitPrice),
                    quantity:     quotation.quantity,
                    note:         notes,
                    deliveryDays: parseInt(delivDays),
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.message ?? "Cập nhật thất bại");
            }

            setSuccess(true);
            setTimeout(() => onNavigate("list"), 1800);
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
            <div className="eq-state">
                <span className="material-symbols-outlined eq-spin">autorenew</span>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="eq-state eq-state--warn">
                <span className="material-symbols-outlined">error</span>
                <p>{error}</p>
                <button onClick={() => onNavigate("list")}>Quay lại danh sách</button>
            </div>
        );
    }

    // ── Không phải PENDING → không cho sửa ──────────────────────────────────
    if (quotation && quotation.status !== "PENDING") {
        return (
            <div className="eq-state eq-state--warn">
                <span className="material-symbols-outlined">info</span>
                <p>Báo giá này không thể chỉnh sửa (trạng thái: {quotation.status}).</p>
                <button onClick={() => onNavigate("list")}>Quay lại danh sách</button>
            </div>
        );
    }

    return (
        <div className="eq-page">
            {/* Breadcrumb */}
            <div className="eq-breadcrumb">
                <span onClick={() => onNavigate("list")}>Báo giá</span>
                <span className="material-symbols-outlined">chevron_right</span>
                <span>Chỉnh sửa báo giá</span>
            </div>

            {/* Header */}
            <div className="eq-header">
                <h2>Chỉnh sửa báo giá</h2>
                <p>Chỉ có thể chỉnh sửa báo giá đang ở trạng thái chờ phản hồi.</p>
            </div>

            <div className="eq-grid">
                {/* Left — thông tin hiện tại */}
                <div className="eq-left">
                    <div className="eq-order-card">
                        <h4>{quotation?.postTitle}</h4>

                        <div className="eq-order-row">
                            <label>Số lượng</label>
                            <span>{quotation?.quantity.toLocaleString("vi-VN")} cái</span>
                        </div>
                        <div className="eq-order-row">
                            <label>Đơn giá hiện tại</label>
                            <span>{quotation?.unitPrice.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className="eq-order-row">
                            <label>Giao hàng hiện tại</label>
                            <span>{quotation?.deliveryDays} ngày</span>
                        </div>

                        <div className="eq-total-box">
                            <label>Tổng giá trị hiện tại</label>
                            <div className="eq-total-val">
                                {quotation?.totalPrice.toLocaleString("vi-VN")}đ
                            </div>
                        </div>

                        <div className="eq-info-row">
                            <span className="material-symbols-outlined">calendar_today</span>
                            Ngày gửi: {formatDate(quotation?.createdAt ?? "")}
                        </div>
                    </div>

                    <div className="eq-status-card">
                        <div className="eq-status-label">Trạng thái báo giá</div>
                        <h4>Đang chờ phản hồi</h4>
                        <p>Khách hàng chưa phản hồi báo giá này.</p>
                    </div>
                </div>

                {/* Right — form chỉnh sửa */}
                <div className="eq-right-card">
                    <h3>Thông số báo giá mới</h3>

                    <div className="eq-form-grid">
                        <div className="eq-form-group">
                            <label>Đơn giá mới (VNĐ)</label>
                            <div className="eq-input-wrap">
                                <input
                                    type="number"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(e.target.value)}
                                />
                                <span className="eq-suffix">đ</span>
                            </div>
                        </div>

                        <div className="eq-form-group">
                            <label>Tổng giá (Tự động tính)</label>
                            <div className="eq-input-wrap">
                                <input
                                    type="text"
                                    value={total}
                                    readOnly
                                    className="eq-input-readonly"
                                />
                                <span className="eq-suffix">đ</span>
                            </div>
                        </div>
                    </div>

                    <div className="eq-form-group eq-form-group--full">
                        <label>Thời gian giao hàng (ngày)</label>
                        <div className="eq-input-wrap">
                            <input
                                type="number"
                                value={delivDays}
                                onChange={(e) => setDelivDays(e.target.value)}
                            />
                            <span className="eq-suffix eq-suffix--icon">
                                <span className="material-symbols-outlined">local_shipping</span>
                            </span>
                        </div>
                        <div className="eq-completion">
                            <span>Dự kiến giao:</span>
                            <strong>{completionDate}</strong>
                        </div>
                    </div>

                    <div className="eq-form-group eq-form-group--full">
                        <label>Ghi chú cho khách hàng</label>
                        <textarea
                            className="eq-textarea"
                            placeholder="Nhập lưu ý đặc biệt về chất liệu, kỹ thuật in hoặc điều kiện thanh toán..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="eq-error">
                            <span className="material-symbols-outlined">error</span>
                            {error}
                        </div>
                    )}

                    <div className="eq-btn-row">
                        <button
                            className="btn-eq-cancel"
                            onClick={() => onNavigate("list")}
                            disabled={submitting}
                        >
                            Hủy chỉnh sửa
                        </button>
                        <button
                            className="btn-eq-save"
                            onClick={handleSave}
                            disabled={submitting || success}
                        >
                            {submitting ? (
                                <>
                                    <span className="material-symbols-outlined eq-spin">autorenew</span>
                                    Đang lưu...
                                </>
                            ) : success ? (
                                <>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Đã cập nhật!
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">save</span>
                                    Cập nhật báo giá
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {success && (
                <div className="eq-toast">
                    <span className="material-symbols-outlined">check_circle</span>
                    Cập nhật báo giá thành công! Đang chuyển về danh sách...
                </div>
            )}
        </div>
    );
}