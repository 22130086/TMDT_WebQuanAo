import { useState, useEffect } from "react";
import "../styles/delete-quote-modal.css";

interface Quotation {
    id: number;
    postId: number;
    productName: string;
    pricePerUnit: number;
    createdAt: string;
    status: string;
}

interface Props {
    isOpen: boolean;
    quotationId: number | string | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function DeleteQuoteModal({
                                             isOpen,
                                             quotationId,
                                             onClose,
                                             onSuccess,
                                         }: Props) {
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [fetching, setFetching]   = useState(false);
    const [fetchErr, setFetchErr]   = useState<string | null>(null);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !quotationId) return;

        setQuotation(null);
        setFetchErr(null);
        setError(null);
        setFetching(true);

        const token = localStorage.getItem("token");
        fetch(`/api/factory/quotations/${quotationId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => {
                if (!r.ok) throw new Error(`Lỗi ${r.status}`);
                return r.json();
            })
            .then((json) => {
                const d = json.data ?? json;
                setQuotation({
                    id:           d.id,
                    postId:       d.postId,
                    productName:  d.postTitle ?? d.productName ?? `#${d.postId}`,
                    pricePerUnit: d.pricePerUnit ?? d.price ?? d.unitPrice ?? d.priceUnit ?? d.totalPrice ?? 0,
                    createdAt:    d.createdAt ?? d.sentAt ?? "",
                    status:       d.status,
                });
            })
            .catch((e) => setFetchErr(e.message ?? "Không thể tải báo giá."))
            .finally(() => setFetching(false));
    }, [isOpen, quotationId]);

    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("vi-VN");
    };

    const formatPrice = (price: number) =>
        price ? `${price.toLocaleString("vi-VN")}đ` : "—";

    const handleConfirm = async () => {
        if (!quotationId) return;
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/factory/quotations/${quotationId}/withdraw`, {
                method: "PATCH",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.message ?? `Lỗi ${res.status}`);
            }

            onSuccess?.();
            onClose();
        } catch (e: any) {
            setError(e.message ?? "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dqm-overlay" onClick={onClose}>
            <div className="dqm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dqm-icon-wrap">
                    <span className="material-symbols-outlined">delete_forever</span>
                </div>

                <h3>Rút báo giá</h3>
                <p>
                    Bạn có chắc chắn muốn rút báo giá này không? Hành động này không thể
                    hoàn tác và báo giá sẽ chuyển sang trạng thái <strong>Đã rút</strong>.
                </p>

                <div className="dqm-info-box">
                    {fetching ? (
                        <div className="dqm-info-row">
                            <span className="material-symbols-outlined dqm-spin">autorenew</span>
                            <span>Đang tải thông tin...</span>
                        </div>
                    ) : fetchErr ? (
                        <div className="dqm-error">
                            <span className="material-symbols-outlined">error</span>
                            {fetchErr}
                        </div>
                    ) : quotation ? (
                        <>
                            <div className="dqm-info-row">
                                <label>Tên sản phẩm</label>
                                <span>{quotation.productName}</span>
                            </div>
                            <div className="dqm-info-row">
                                <label>Giá đã báo</label>
                                <span className="dqm-price">{formatPrice(quotation.pricePerUnit)}</span>
                            </div>
                            <div className="dqm-info-row">
                                <label>Ngày gửi báo giá</label>
                                <span>{formatDate(quotation.createdAt)}</span>
                            </div>
                        </>
                    ) : null}
                </div>

                {error && (
                    <div className="dqm-error">
                        <span className="material-symbols-outlined">error</span>
                        {error}
                    </div>
                )}

                <div className="dqm-btn-row">
                    <button className="btn-dqm-cancel" onClick={onClose} disabled={loading}>
                        Hủy
                    </button>
                    <button
                        className="btn-dqm-confirm"
                        onClick={handleConfirm}
                        disabled={loading || fetching || !!fetchErr}
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined dqm-spin">autorenew</span>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">delete</span>
                                Xác nhận rút
                            </>
                        )}
                    </button>
                </div>

                <div className="dqm-footer">
                    <span>AZURE INDUSTRIAL V2.5</span>
                    {quotationId && <span>SGL: QT-{quotationId}</span>}
                </div>
            </div>
        </div>
    );
}