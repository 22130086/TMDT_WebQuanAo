import { useState, useEffect } from "react";
import "../styles/production-post-detail.css";
import { useSearchParams } from "react-router-dom";

const BASE_IMG = "http://localhost:8080";

interface Post {
    id: number;
    title: string;
    description: string;
    quantity: number;
    budgetMin: number;
    budgetMax: number;
    deadline: string;
    createdAt: string;
    status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "CANCELLED";
    categoryName: string;
    customerId: number;
    customerName: string;
    designFileUrl?: string;
    designFileUrlBack?: string;
}

const STATUS_CONFIG = {
    OPEN:        { text: "Đang mở báo giá",  className: "ppd-badge ppd-badge--open" },
    IN_PROGRESS: { text: "Đang tiến hành",   className: "ppd-badge ppd-badge--progress" },
    CLOSED:      { text: "Đã đóng",          className: "ppd-badge ppd-badge--closed" },
    CANCELLED:   { text: "Đã huỷ",           className: "ppd-badge ppd-badge--cancelled" },
};

interface Props {
    onNavigate: (target: string) => void;
}

export default function ProductionPostDetail({ onNavigate }: Props) {
    const [post, setPost]       = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const postId = searchParams.get("id") ?? "";
    const [myQuotationId, setMyQuotationId] = useState<number | null>(null);

    useEffect(() => {
        if (!postId) return;
        const token = localStorage.getItem("token");
        fetch(`/api/factory/quotations?page=0&size=100`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => r.json())
            .then((json) => {
                const found = (json.data?.content ?? []).find(
                    (q: any) => q.postId === Number(postId) && q.status === "PENDING"
                );
                setMyQuotationId(found ? found.id : null);
            })
            .catch(() => {});
    }, [postId]);
    useEffect(() => {
        if (!postId) {
            setError("Không tìm thấy ID bài đăng.");
            setLoading(false);
            return;
        }
        fetchPost(postId);
    }, [postId]);

    const fetchPost = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/posts/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`Lỗi ${res.status}: ${res.statusText}`);
            const json = await res.json();
            if (!json.data) throw new Error("Dữ liệu không hợp lệ từ server.");
            setPost(json.data);
        } catch (e: any) {
            setError(e.message ?? "Không thể tải bài đăng.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("vi-VN");
    };

    const formatBudget = (min: number, max: number) =>
        `${min.toLocaleString("vi-VN")}đ – ${max.toLocaleString("vi-VN")}đ`;

    const getInitials = (name: string) =>
        name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();

    if (loading) {
        return (
            <div className="ppd-state">
                <span className="material-symbols-outlined ppd-spin">autorenew</span>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="ppd-state ppd-state--error">
                <span className="material-symbols-outlined">error</span>
                <p>{error ?? "Không tìm thấy bài đăng."}</p>
                <button onClick={() => onNavigate("list")}>Quay lại danh sách</button>
            </div>
        );
    }

    const status = STATUS_CONFIG[post.status];

    return (
        <div className="ppd-page">
            {/* Breadcrumb */}
            <div className="ppd-breadcrumb">
                <span onClick={() => onNavigate("list")}>Bài đăng đặt may</span>
                <span className="material-symbols-outlined">chevron_right</span>
                <span>Chi tiết yêu cầu</span>
            </div>

            {/* Header */}
            <div className="ppd-header">
                <div className="ppd-header-left">
                    <h2>{post.title}</h2>
                    <div className="ppd-header-meta">
                        <span className={status.className}>{status.text}</span>
                        <span className="ppd-ref">Mã: #REQ-{String(post.id).padStart(4, "0")}-AZ</span>
                    </div>
                </div>
                <div className="ppd-header-actions">
                    <button className="btn-back" onClick={() => onNavigate("list")}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Quay lại
                    </button>
                    {post.status === "OPEN" && (
                        myQuotationId ? (
                            <>
                                <button
                                    className="btn-edit-quote"
                                    onClick={() => onNavigate(`edit-quote?id=${myQuotationId}`)}
                                >
                                    <span className="material-symbols-outlined">edit</span>
                                    Sửa báo giá
                                </button>
                                <button
                                    className="btn-delete-quote"
                                    onClick={() => onNavigate(
                                        `delete-quote?id=${myQuotationId}` +
                                        `&name=${encodeURIComponent(post.title)}` +
                                        `&price=&date=&ref=${post.id}`
                                    )}
                                >
                                    <span className="material-symbols-outlined">cancel</span>
                                    Rút báo giá
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn-send-quote"
                                onClick={() => onNavigate(`send-quote?id=${post.id}`)}
                            >
                                <span className="material-symbols-outlined">send</span>
                                Gửi báo giá
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="ppd-grid">
                {/* Left */}
                <div>
                    <div className="ppd-card">
                        <div className="ppd-card-title">
                            <div className="ppd-card-icon">
                                <span className="material-symbols-outlined">checkroom</span>
                            </div>
                            Thông tin sản phẩm
                        </div>
                        <div className="ppd-info-grid">
                            <div className="ppd-info-item">
                                <label>Tên sản phẩm</label>
                                <div className="ppd-val">{post.title}</div>
                            </div>
                            <div className="ppd-info-item">
                                <label>Loại sản phẩm</label>
                                <div className="ppd-val">{post.categoryName || "—"}</div>
                            </div>
                            <div className="ppd-info-item">
                                <label>Số lượng cần sản xuất</label>
                                <div className="ppd-val ppd-val--blue">
                                    {post.quantity.toLocaleString("vi-VN")} chiếc
                                </div>
                            </div>
                            <div className="ppd-info-item">
                                <label>Ngân sách</label>
                                <div className="ppd-val ppd-val--green">
                                    {formatBudget(post.budgetMin, post.budgetMax)}
                                </div>
                            </div>
                            <div className="ppd-info-item">
                                <label>Thời hạn</label>
                                <div className="ppd-val">{formatDate(post.deadline)}</div>
                            </div>
                            <div className="ppd-info-item">
                                <label>Ngày đăng</label>
                                <div className="ppd-val">{formatDate(post.createdAt)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="ppd-card">
                        <div className="ppd-card-title">
                            <div className="ppd-card-icon">
                                <span className="material-symbols-outlined">description</span>
                            </div>
                            Mô tả chi tiết
                        </div>
                        <p className="ppd-desc">{post.description || "Không có mô tả."}</p>
                    </div>

                    {(post.designFileUrl || post.designFileUrlBack) && (
                        <div className="ppd-card">
                            <div className="ppd-card-title">
                                <div className="ppd-card-icon">
                                    <span className="material-symbols-outlined">image</span>
                                </div>
                                Hình ảnh thiết kế
                            </div>
                            <div className="ppd-design-images">
                                {post.designFileUrl && (
                                    <div className="ppd-design-img-wrapper">
                                        <img
                                            src={BASE_IMG + post.designFileUrl}
                                            alt="Thiết kế mặt trước"
                                            className="ppd-design-img"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.querySelector('.ppd-img-fallback')!.classList.remove('ppd-hidden');
                                            }}
                                        />
                                        <div className="ppd-img-fallback ppd-hidden">
                                            <span className="material-symbols-outlined">broken_image</span>
                                            <span>Không tải được ảnh</span>
                                        </div>
                                        <span className="ppd-design-label">Mặt trước</span>
                                    </div>
                                )}
                                {post.designFileUrlBack && (
                                    <div className="ppd-design-img-wrapper">
                                        <img
                                            src={BASE_IMG + post.designFileUrlBack}
                                            alt="Thiết kế mặt sau"
                                            className="ppd-design-img"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.querySelector('.ppd-img-fallback')!.classList.remove('ppd-hidden');
                                            }}
                                        />
                                        <div className="ppd-img-fallback ppd-hidden">
                                            <span className="material-symbols-outlined">broken_image</span>
                                            <span>Không tải được ảnh</span>
                                        </div>
                                        <span className="ppd-design-label">Mặt sau</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div>
                    <div className="ppd-sidebar-card">
                        <div className="ppd-sidebar-label">Thông tin khách hàng</div>
                        <div className="ppd-client-header">
                            <div className="ppd-client-avatar">
                                {getInitials(post.customerName)}
                            </div>
                            <div>
                                <h4>{post.customerName}</h4>
                                <p>Khách hàng</p>
                            </div>
                        </div>
                        <div className="ppd-client-row">
                            <label>Ngày đăng bài</label>
                            <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <div className="ppd-client-row">
                            <label>Trạng thái</label>
                            <span className={status.className}>{status.text}</span>
                        </div>
                    </div>

                    {post.status === "OPEN" && !myQuotationId && (
                        <div className="ppd-cta-box">
                            <h4>Sẵn sàng hợp tác?</h4>
                            <p>
                                Hãy báo giá cạnh tranh để có cơ hội trở thành nhà cung cấp chính thức.
                            </p>
                            <button
                                className="btn-cta-quote"
                                onClick={() => onNavigate(`send-quote?id=${post.id}`)}
                            >
                                GỬI BÁO GIÁ NGAY
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}