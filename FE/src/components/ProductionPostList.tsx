import { useState, useEffect } from "react";
import "../styles/production-post-list.css";

interface Post {
    id: number;
    title: string;
    categoryName: string;
    quantity: number;
    budgetMin: number;
    budgetMax: number;
    createdAt: string;
    deadline: string;
    status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "CANCELLED";
    imageUrl?: string;
}

interface PageMeta {
    page: number;
    totalPages: number;
    totalItems: number;
    size: number;
}

const STATUS_CONFIG: Record<Post["status"], { text: string; className: string }> = {
    OPEN:        { text: "Đang mở",        className: "badge-open" },
    IN_PROGRESS: { text: "Đang tiến hành", className: "badge-in-progress" },
    CLOSED:      { text: "Đã đóng",        className: "badge-closed" },
    CANCELLED:   { text: "Đã huỷ",         className: "badge-cancelled" },
};

const TAB_LIST = [
    { key: "all",         label: "Tất cả" },
    { key: "OPEN",        label: "Đang mở" },
    { key: "IN_PROGRESS", label: "Đang tiến hành" },
    { key: "CLOSED",      label: "Đã đóng" },
] as const;

type TabKey = typeof TAB_LIST[number]["key"];

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop";

const PAGE_SIZE = 10;

interface Props {
    onNavigate: (target: string) => void;
    refreshSignal?: number;
}

export default function ProductionPostList({ onNavigate, refreshSignal }: Props) {
    const [activeTab, setActiveTab]           = useState<TabKey>("all");
    const [searchQuery, setSearchQuery]       = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showFilter, setShowFilter]         = useState(false);
    const [posts, setPosts]                   = useState<Post[]>([]);
    const [loading, setLoading]               = useState(false);
    const [error, setError]                   = useState<string | null>(null);
    const [pageMeta, setPageMeta]             = useState<PageMeta>({
        page: 1, totalPages: 1, totalItems: 0, size: PAGE_SIZE,
    });
    const [categories, setCategories] = useState<{id: number; name: string}[]>([]);
    const [myQuotations, setMyQuotations] = useState<Record<number, number>>({});

    // Fetch quotations — gọi lại khi refreshSignal thay đổi
    const fetchMyQuotations = () => {
        const token = localStorage.getItem("token");
        fetch("/api/factory/quotations?page=0&size=100", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => r.json())
            .then((json) => {
                const map: Record<number, number> = {};
                (json.data?.content ?? []).forEach((q: any) => {
                    if (q.status === "PENDING") {
                        map[q.postId] = q.id;
                    }
                });
                setMyQuotations(map);
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchMyQuotations();
    }, [refreshSignal]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("/api/categories", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => r.json())
            .then((json) => setCategories(json.data ?? []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchPosts(pageMeta.page);
    }, [pageMeta.page]);

    const fetchPosts = async (
        page: number,
        tab: TabKey = activeTab,
        search: string = searchQuery,
        category: string = categoryFilter,
    ) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: String(page - 1),
                size: String(PAGE_SIZE),
            });
            if (tab !== "all") params.append("status", tab);
            if (search.trim()) params.append("keyword", search.trim());
            if (category !== "all") params.append("categoryId", category);

            const res = await fetch(`/api/posts?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`Lỗi ${res.status}`);

            const json = await res.json();
            const data = json.data;
            setPosts(data.content ?? []);
            setPageMeta({
                page: (data.number ?? 0) + 1,
                totalPages: data.totalPages ?? 1,
                totalItems: data.totalElements ?? 0,
                size: PAGE_SIZE,
            });
        } catch (e: any) {
            setError(e.message ?? "Không thể tải danh sách bài đăng.");
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        setPageMeta((prev) => ({ ...prev, page: 1 }));
        fetchPosts(1, tab, searchQuery, categoryFilter);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPageMeta((prev) => ({ ...prev, page: 1 }));
        fetchPosts(1, activeTab, searchQuery, categoryFilter);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > pageMeta.totalPages) return;
        setPageMeta((prev) => ({ ...prev, page }));
    };

    const handleResetFilter = () => {
        setSearchQuery("");
        setCategoryFilter("all");
        setActiveTab("all");
        setPageMeta((prev) => ({ ...prev, page: 1 }));
        fetchPosts(1, "all", "", "all");
    };

    const renderPagination = () => {
        const { page, totalPages } = pageMeta;
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push("...");
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
            if (page < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages.map((p, idx) =>
            p === "..." ? (
                <span key={`e-${idx}`} className="pp-ellipsis">…</span>
            ) : (
                <button
                    key={p}
                    className={`pp-page-btn ${p === page ? "active" : ""}`}
                    onClick={() => handlePageChange(p as number)}
                >
                    {p}
                </button>
            )
        );
    };

    const from = pageMeta.totalItems === 0 ? 0 : (pageMeta.page - 1) * PAGE_SIZE + 1;
    const to   = Math.min(pageMeta.page * PAGE_SIZE, pageMeta.totalItems);
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("vi-VN");
    };

    return (
        <div className="pp-list-page">
            {/* Header */}
            <div className="pp-page-header">
                <div>
                    <h2>Bài đăng đặt may</h2>
                    <p>Quản lý và phản hồi các yêu cầu gia công từ đối tác.</p>
                </div>
                <button
                    className={`btn-filter-adv ${showFilter ? "active" : ""}`}
                    onClick={() => setShowFilter((v) => !v)}
                >
                    <span className="material-symbols-outlined">tune</span>
                    Bộ lọc nâng cao
                </button>
            </div>

            {/* Search */}
            <form className="pp-search-bar" onSubmit={handleSearch}>
                <span className="material-symbols-outlined pp-search-icon">search</span>
                <input
                    type="text"
                    placeholder="Tìm theo tên sản phẩm, loại hình..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn-search">Tìm</button>
            </form>

            {/* Filter panel */}
            {showFilter && (
                <div className="pp-filter-panel">
                    <div className="pp-filter-fields">
                        <div className="pp-filter-field">
                            <label>Loại sản phẩm</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={String(cat.id)}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="pp-filter-actions">
                        <button className="btn-reset-filter" onClick={handleResetFilter}>
                            <span className="material-symbols-outlined">restart_alt</span>
                            Đặt lại
                        </button>
                        <button
                            className="btn-apply-filter"
                            onClick={() => {
                                setShowFilter(false);
                                fetchPosts(1, activeTab, searchQuery, categoryFilter);
                            }}
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="pp-tabs">
                {TAB_LIST.map((tab) => (
                    <button
                        key={tab.key}
                        className={`pp-tab ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => handleTabChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="pp-table-wrap">
                {loading ? (
                    <div className="pp-loading">
                        <span className="material-symbols-outlined pp-spin">autorenew</span>
                        Đang tải...
                    </div>
                ) : error ? (
                    <div className="pp-error">
                        <span className="material-symbols-outlined">error</span>
                        {error}
                        <button onClick={() => fetchPosts(1, activeTab, searchQuery, categoryFilter)}>
                            Thử lại
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="pp-empty">
                        <span className="material-symbols-outlined">inbox</span>
                        <p>Không có bài đăng nào phù hợp.</p>
                    </div>
                ) : (
                    <table className="pp-table">
                        <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Loại</th>
                            <th>Số lượng</th>
                            <th>Ngân sách (đ/cái)</th>
                            <th>Ngày đăng</th>
                            <th>Thời hạn</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {posts.map((post) => (
                            <tr key={post.id}>
                                <td>
                                    <div className="pp-product-cell">
                                        <img
                                            src={post.imageUrl || FALLBACK_IMAGE}
                                            alt={post.title}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                                            }}
                                        />
                                        <span>{post.title}</span>
                                    </div>
                                </td>
                                <td>{post.categoryName}</td>
                                <td>
                                    <span className="qty-highlight">
                                        {post.quantity.toLocaleString("vi-VN")}
                                    </span>{" "}
                                    <span className="qty-unit">cái</span>
                                </td>
                                <td className="pp-budget">
                                    {post.budgetMin.toLocaleString("vi-VN")} –{" "}
                                    {post.budgetMax.toLocaleString("vi-VN")}
                                </td>
                                <td>{formatDate(post.createdAt)}</td>
                                <td>{formatDate(post.deadline)}</td>
                                <td>
                                    <span className={STATUS_CONFIG[post.status].className}>
                                        {STATUS_CONFIG[post.status].text}
                                    </span>
                                </td>
                                <td>
                                    <div className="pp-action-group">
                                        <button
                                            className="btn-detail"
                                            onClick={() => onNavigate(`post-detail?id=${post.id}`)}
                                        >
                                            Chi tiết
                                        </button>
                                        {post.status === "OPEN" && (
                                            myQuotations[post.id] ? (
                                                <>
                                                    <button
                                                        className="btn-edit-quote"
                                                        onClick={() => onNavigate(`edit-quote?id=${myQuotations[post.id]}`)}
                                                    >
                                                        Sửa báo giá
                                                    </button>
                                                    <button
                                                        className="btn-delete-quote"
                                                        onClick={() => onNavigate(`delete-quote?id=${myQuotations[post.id]}`)}
                                                    >
                                                        Rút báo giá
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className="btn-quote"
                                                    onClick={() => onNavigate(`send-quote?id=${post.id}`)}
                                                >
                                                    Báo giá
                                                </button>
                                            )
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                {!loading && posts.length > 0 && (
                    <div className="pp-pagination">
                        <span>
                            Hiển thị {from} – {to} trong số {pageMeta.totalItems} kết quả
                        </span>
                        <div className="pp-pages">
                            <button
                                className="pp-page-btn pp-page-nav"
                                onClick={() => handlePageChange(pageMeta.page - 1)}
                                disabled={pageMeta.page === 1}
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            {renderPagination()}
                            <button
                                className="pp-page-btn pp-page-nav"
                                onClick={() => handlePageChange(pageMeta.page + 1)}
                                disabled={pageMeta.page === pageMeta.totalPages}
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="pp-stats-row">
                <div className="pp-stat pp-stat--blue">
                    <div className="pp-stat-icon">📈</div>
                    <h3>85%</h3>
                    <p>Tỉ lệ phản hồi báo giá</p>
                </div>
                <div className="pp-stat pp-stat--light">
                    <div className="pp-stat-icon">⏱</div>
                    <h3>2.4 Giờ</h3>
                    <p>Thời gian phản hồi trung bình</p>
                </div>
                <div className="pp-stat pp-stat--light">
                    <div className="pp-stat-icon">✨</div>
                    <h3>VIP Factory</h3>
                    <p>Danh hiệu xưởng xuất sắc</p>
                </div>
            </div>
        </div>
    );
}