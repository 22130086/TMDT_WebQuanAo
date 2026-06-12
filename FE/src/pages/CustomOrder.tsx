import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import http from "../services/http";
import {
  createCustomProduct,
  getCustomProduct,
  uploadDesignJson,
} from "../services/customProductService";

import shirtWhite from "../assets/shirt_white.png";
import shirtBlack from "../assets/shirt_black.png";

import "../styles/custom-order.css";

type DesignSide = "front" | "back";

type DesignItem = {
  id: string;
  type: "text" | "logo" | "pattern";
  content: string;
  x: number;
  y: number;
  size: number;
  color?: string;
};

type ShirtDesign = {
  color: string;
  items: DesignItem[];
};

type DesignPayload = {
  front?: ShirtDesign;
  back?: ShirtDesign;
};

const colors = [
  "#ffffff",
  "#191c1e",
  "#ba1a1a",
  "#2563eb",
  "#888888",
  "#29ae22",
  "#f97316",
  "#fff30c",
];

const shirtImages: Record<string, string> = {
  "#ffffff": shirtWhite,
  "#111111": shirtBlack,
};

const getShirtImage = (color: string) => shirtImages[color] || shirtWhite;

const logos = ["★", "♥", "⬢", "△", "⚙", "◉", "QR"];
const logoColors = [
  "#111827",
  "#ffffff",
  "#d32f2f",
  "#0f766e",
  "#2563eb",
  "#f97316",
  "#a855f7",
];

const defaultDesign: ShirtDesign = {
  color: "#ffffff",
  items: [],
};

function convertOldDesign(raw: any): ShirtDesign {
  const design: ShirtDesign = {
    color: raw?.color ?? defaultDesign.color,
    items: [],
  };

  if (Array.isArray(raw?.items)) {
    design.items = raw.items.map((item: any, index: number) => ({
      id: item.id ?? `item-${index}`,
      type: item.type,
      content: String(item.content ?? ""),
      x: Number(item.x ?? 50),
      y: Number(item.y ?? 50),
      size: Number(item.size ?? 24),
      color: item.color ?? undefined,
    }));
    return design;
  }

  if (raw?.text) {
    design.items.push({
      id: "text-1",
      type: "text",
      content: String(raw.text),
      x: 50,
      y: 40,
      size: 24,
    });
  }

  if (raw?.logo) {
    design.items.push({
      id: "logo-1",
      type: "logo",
      content: String(raw.logo),
      x: 50,
      y: 62,
      size: 36,
    });
  }

  return design;
}

function base64FromString(value: string) {
  return window.btoa(unescape(encodeURIComponent(value)));
}

export default function CustomOrder() {
  const navigate = useNavigate();
  const [customProductId, setCustomProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Bạn có thể tạo thiết kế, chọn màu áo, thêm logo và văn bản, rồi lưu lại để chỉnh sửa sau."
  );
  const [side, setSide] = useState<DesignSide>("front");
  const [frontDesign, setFrontDesign] = useState<ShirtDesign>(defaultDesign);
  const [backDesign, setBackDesign] = useState<ShirtDesign>(defaultDesign);
  const [applyToBoth, setApplyToBoth] = useState(false);
  const [logoColor, setLogoColor] = useState("#111827");

  // ---- Upload mode states ----
  type PageMode = "design" | "upload";
  const [mode, setMode] = useState<PageMode>("design");
  const [uploadFrontFile, setUploadFrontFile] = useState<File | null>(null);
  const [uploadFrontPreviewUrl, setUploadFrontPreviewUrl] = useState<string | null>(null);
  const [uploadBackFile, setUploadBackFile] = useState<File | null>(null);
  const [uploadBackPreviewUrl, setUploadBackPreviewUrl] = useState<string | null>(null);

  // ---- Upload form fields ----
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postQuantity, setPostQuantity] = useState(50);
  const [postBudgetMin, setPostBudgetMin] = useState("");
  const [postBudgetMax, setPostBudgetMax] = useState("");
  const [postDeadline, setPostDeadline] = useState("");
  const [postSize, setPostSize] = useState("M");
  const [postMaterial, setPostMaterial] = useState("Cotton 100%");
  const [postNotes, setPostNotes] = useState("");

  const activeDesign = side === "front" ? frontDesign : backDesign;
  const dragState = useRef<{
    itemId: string;
    itemType: DesignItem["type"];
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const buildItems = (design: ShirtDesign, item: DesignItem | null, type: DesignItem["type"]) => {
    const nextItems = design.items.filter((existing) => existing.type !== type);
    if (item) {
      nextItems.push(item);
    }
    return { ...design, items: nextItems };
  };

  const setDesignForSide = (targetSide: DesignSide, design: ShirtDesign) => {
    if (targetSide === "front") {
      setFrontDesign(design);
    } else {
      setBackDesign(design);
    }
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const updateItemPosition = (type: DesignItem["type"], x: number, y: number) => {
    const updateDesign = (design: ShirtDesign) => {
      const item = design.items.find((existing) => existing.type === type);
      if (!item) return design;
      return buildItems(design, { ...item, x, y }, type);
    };

    if (applyToBoth) {
      setFrontDesign(updateDesign);
      setBackDesign(updateDesign);
      return;
    }

    setDesignForSide(side, updateDesign(activeDesign));
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>, item: DesignItem) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);

    dragState.current = {
      itemId: item.id,
      itemType: item.type,
      offsetX,
      offsetY,
    };
    element.setPointerCapture(event.pointerId);
  };

  const endDrag = () => {
    dragState.current = null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left - dragState.current.offsetX) / rect.width) * 100, 5, 95);
    const y = clamp(((event.clientY - rect.top - dragState.current.offsetY) / rect.height) * 100, 5, 95);

    updateItemPosition(dragState.current.itemType, x, y);
  };

  const getItem = (type: DesignItem["type"], design: ShirtDesign) =>
    design.items.find((item) => item.type === type) ?? null;

  const renderDesignItems = (design: ShirtDesign, isActive: boolean) =>
    design.items.map((item) => (
      <div
        key={item.id}
        className={`design-item design-item-${item.type}`}
        style={{
          left: `${item.x}%`,
          top: `${item.y}%`,
          fontSize: `${item.size}px`,
          color: item.color ?? "#111827",
        }}
        onPointerDown={isActive ? (event) => startDrag(event, item) : undefined}
      >
        {item.content}
      </div>
    ));

  const setDesignItem = (item: DesignItem | null, type: DesignItem["type"]) => {
    if (applyToBoth) {
      setFrontDesign((design) => buildItems(design, item, type));
      setBackDesign((design) => buildItems(design, item, type));
      return;
    }

    setDesignForSide(side, buildItems(activeDesign, item, type));
  };

  const setColor = (color: string) => {
    if (applyToBoth) {
      setFrontDesign((design) => ({ ...design, color }));
      setBackDesign((design) => ({ ...design, color }));
      return;
    }
    setDesignForSide(side, { ...activeDesign, color });
  };

  const setText = (text: string) => {
    setDesignItem(
      text
        ? {
            id: getItem("text", activeDesign)?.id ?? "text-1",
            type: "text",
            content: text,
            x: getItem("text", activeDesign)?.x ?? 50,
            y: getItem("text", activeDesign)?.y ?? 40,
            size: getItem("text", activeDesign)?.size ?? 24,
          }
        : null,
      "text"
    );
  };

  const setLogo = (logo: string | null) => {
    setDesignItem(
      logo
        ? {
            id: getItem("logo", activeDesign)?.id ?? "logo-1",
            type: "logo",
            content: logo,
            x: getItem("logo", activeDesign)?.x ?? 50,
            y: getItem("logo", activeDesign)?.y ?? 62,
            size: getItem("logo", activeDesign)?.size ?? 36,
            color: getItem("logo", activeDesign)?.color ?? logoColor,
          }
        : null,
      "logo"
    );
  };

  const updateLogoColor = (color: string) => {
    setLogoColor(color);
    const updateDesign = (design: ShirtDesign) => {
      const item = design.items.find((existing) => existing.type === "logo");
      if (!item) return design;
      return buildItems(design, { ...item, color }, "logo");
    };

    if (applyToBoth) {
      setFrontDesign(updateDesign);
      setBackDesign(updateDesign);
      return;
    }

    setDesignForSide(side, updateDesign(activeDesign));
  };

  useEffect(() => {
    const logoItem = getItem("logo", activeDesign);
    if (logoItem?.color) {
      setLogoColor(logoItem.color);
    }
  }, [side, activeDesign]);

  useEffect(() => {
    const draftId = localStorage.getItem("customProductDraftId");
    if (draftId) {
      void loadDraft(Number(draftId));
    }
  }, []);

  const loadDraft = async (id: number) => {
    setLoading(true);
    try {
      const response = await getCustomProduct(id);
      const product = response.data;
      setCustomProductId(id);
      localStorage.setItem("customProductDraftId", String(id));

      if (product.designFileUrl) {
        const json = await loadDesignFile(product.designFileUrl);
        if (json) {
          setFrontDesign(convertOldDesign(json.front));
          setBackDesign(convertOldDesign(json.back));
          setMessage("Đã tải lại thiết kế cũ. Bạn có thể chỉnh sửa tiếp.");
        } else {
          setMessage("Thiết kế cũ chưa có nội dung. Hãy tạo hoặc lưu thiết kế mới.");
        }
      } else {
        setMessage("Thiết kế cũ chưa có nội dung. Hãy tạo hoặc lưu thiết kế mới.");
      }
    } catch (error) {
      setMessage(
        `Không tải được thiết kế cũ. Vui lòng tạo thiết kế mới. ${(error as Error)?.message || ""}`
      );
      setFrontDesign(defaultDesign);
      setBackDesign(defaultDesign);
      setCustomProductId(null);
      localStorage.removeItem("customProductDraftId");
    } finally {
      setLoading(false);
    }
  };

  const loadDesignFile = async (url: string) => {
    if (!url) return null;
    try {
      const response = await http.get(url, {
        responseType: "json",
      });
      return response.data as DesignPayload;
    } catch {
      try {
        const raw = await fetch(url, { credentials: "include" });
        if (!raw.ok) return null;
        return (await raw.json()) as DesignPayload;
      } catch {
        return null;
      }
    }
  };

  // ===== HÀM ĐĂNG BÀI THỐNG NHẤT (dùng chung cho cả 2 mode) =====
  const handleSubmitPost = async () => {
    if (!postTitle.trim()) { setMessage("Vui lòng nhập tiêu đề bài đăng."); return; }
    if (!postQuantity || postQuantity < 1) { setMessage("Vui lòng nhập số lượng hợp lệ."); return; }

    setLoading(true);
    setMessage("Đang tạo bài đăng...");

    try {
      let cpId: number | null = null;

      if (mode === "design") {
        // ---- Tự thiết kế: lưu JSON design ----
        // Tạo custom product nếu chưa có
        if (!customProductId) {
          const cpRes = await createCustomProduct({
            name: postTitle.trim(),
            description: `Size: ${postSize} | Chất liệu: ${postMaterial}`,
          });
          cpId = cpRes.data.id;
          setCustomProductId(cpId);
        } else {
          cpId = customProductId;
        }

        // Lưu thiết kế JSON
        const payload: DesignPayload = { front: frontDesign, back: backDesign };
        const json = JSON.stringify(payload);
        const base64 = base64FromString(json);
        await uploadDesignJson(cpId, {
          jsonBase64: base64,
          fileName: `custom_design_${cpId}.json`,
        });

        // Mô tả đầy đủ
        const fullDesc = [
          postDescription,
          "",
          `🎨 Thiết kế: Màu áo trước ${frontDesign.color}, ${frontDesign.items.length} thành phần`,
          `📐 Size: ${postSize} | 🧵 Chất liệu: ${postMaterial}`,
          postNotes ? `📝 Ghi chú: ${postNotes}` : "",
        ].filter(Boolean).join("\n");

        const postPayload: any = {
          title: postTitle.trim(),
          description: fullDesc,
          quantity: postQuantity,
          customProductId: cpId,
        };
        if (postBudgetMin) postPayload.budgetMin = parseFloat(postBudgetMin);
        if (postBudgetMax) postPayload.budgetMax = parseFloat(postBudgetMax);
        if (postDeadline) postPayload.deadline = postDeadline;
        await http.post("/posts", postPayload);

      } else {
        // ---- Tải mẫu sẵn: upload ảnh ----
        if (!uploadFrontFile && !uploadBackFile) {
          setMessage("Vui lòng chọn ít nhất một ảnh thiết kế."); return;
        }

        let frontUrl = "", backUrl = "";
        if (uploadFrontFile) {
          const fd = new FormData(); fd.append("file", uploadFrontFile); fd.append("type", "products");
          const res = await http.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
          frontUrl = res.data?.data?.url || "";
        }
        if (uploadBackFile) {
          const fd = new FormData(); fd.append("file", uploadBackFile); fd.append("type", "products");
          const res = await http.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
          backUrl = res.data?.data?.url || "";
        }

        const cpRes = await createCustomProduct({
          name: postTitle.trim(),
          description: `Size: ${postSize} | Chất liệu: ${postMaterial} | Ghi chú: ${postNotes || "Không có"}`,
          designFileUrl: frontUrl || undefined,
          designFileUrlBack: backUrl || undefined,
        } as any);
        cpId = cpRes.data.id;
        setCustomProductId(cpId);

        const fullDesc = [
          postDescription,
          "",
          `📐 Size: ${postSize} | 🧵 Chất liệu: ${postMaterial}`,
          postNotes ? `📝 Ghi chú: ${postNotes}` : "",
          frontUrl ? `🖼️ Mặt trước: đã đính kèm` : "",
          backUrl ? `🖼️ Mặt sau: đã đính kèm` : "",
        ].filter(Boolean).join("\n");

        const postPayload: any = {
          title: postTitle.trim(),
          description: fullDesc,
          quantity: postQuantity,
          customProductId: cpId,
        };
        if (postBudgetMin) postPayload.budgetMin = parseFloat(postBudgetMin);
        if (postBudgetMax) postPayload.budgetMax = parseFloat(postBudgetMax);
        if (postDeadline) postPayload.deadline = postDeadline;
        await http.post("/posts", postPayload);
      }

      localStorage.setItem("customProductDraftId", String(cpId));
      setMessage("🎉 Đăng bài thành công! Bài đăng đang chờ Admin duyệt. Sau khi duyệt, xưởng sẽ gửi báo giá cho bạn.");

      // Reset form
      setPostTitle(""); setPostDescription(""); setPostQuantity(50);
      setPostBudgetMin(""); setPostBudgetMax(""); setPostDeadline("");
      setPostSize("M"); setPostMaterial("Cotton 100%"); setPostNotes("");
    } catch (error) {
      setMessage(`Lỗi: ${(error as Error)?.message || "Vui lòng thử lại."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearDraft = () => {
    setCustomProductId(null);
    setFrontDesign(defaultDesign);
    setBackDesign(defaultDesign);
    setMessage("Đã xóa thiết kế hiện tại. Hãy tạo thiết kế mới.");
    localStorage.removeItem("customProductDraftId");
  };

  // ---- Upload mode handlers ----
  const handleFrontFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn file ảnh (PNG, JPG, JPEG, WebP).");
      return;
    }
    setUploadFrontFile(file);
    const previewUrl = URL.createObjectURL(file);
    setUploadFrontPreviewUrl(previewUrl);
    setMessage("Đã tải ảnh mặt trước. Tiếp tục chọn ảnh mặt sau nếu cần.");
  };

  const handleBackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn file ảnh (PNG, JPG, JPEG, WebP).");
      return;
    }
    setUploadBackFile(file);
    const previewUrl = URL.createObjectURL(file);
    setUploadBackPreviewUrl(previewUrl);
    setMessage("Đã tải ảnh mặt sau. Nhấn Lưu thiết kế để hoàn tất.");
  };

  const handleClearUpload = () => {
    setUploadFrontFile(null);
    setUploadBackFile(null);
    if (uploadFrontPreviewUrl) URL.revokeObjectURL(uploadFrontPreviewUrl);
    if (uploadBackPreviewUrl) URL.revokeObjectURL(uploadBackPreviewUrl);
    setUploadFrontPreviewUrl(null);
    setUploadBackPreviewUrl(null);
    setPostTitle("");
    setPostDescription("");
    setPostQuantity(50);
    setPostBudgetMin("");
    setPostBudgetMax("");
    setPostDeadline("");
    setPostSize("M");
    setPostMaterial("Cotton 100%");
    setPostNotes("");
    setCustomProductId(null);
    setMessage("Đã xóa tất cả. Vui lòng tải lại file và điền thông tin.");
  };

  return (
    <>
      <Header />

      <div className="custom-order-page">
        {/* ---- TOP BAR ---- */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={() => navigate("/my-posts")}
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 14, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            📋 Bài đăng của tôi
          </button>
        </div>

        {/* ---- MODE SELECTOR ---- */}
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === "design" ? "mode-active" : ""}`}
            onClick={() => { setMode("design"); setMessage("Tự thiết kế áo của bạn, sau đó điền thông tin và đăng bài yêu cầu in."); }}
          >
            <span className="mode-icon">🎨</span>
            <span>Tự thiết kế</span>
          </button>
          <button
            className={`mode-btn ${mode === "upload" ? "mode-active" : ""}`}
            onClick={() => { setMode("upload"); setMessage("Tải ảnh mặt trước + mặt sau, điền thông tin và đăng bài."); }}
          >
            <span className="mode-icon">📤</span>
            <span>Tải mẫu sẵn</span>
          </button>
        </div>

        

        
        <section className="custom-card shirt-customizer-page">
          <div className="workspace-header">
            <span className="text-label-sm font-label uppercase tracking-widest text-secondary">
              {mode === "design" ? "Mẫu thiết kế" : "Xem trước thiết kế"}
            </span>
            <h2 className="text-headline-sm font-headline font-bold text-on-surface uppercase">
              {mode === "design" ? "Thiết kế & Đăng bài" : "Tải mẫu & Đăng bài"}
            </h2>
          </div>
          <div className="design-notice customizer-notice">
            {loading ? "Đang xử lý..." : message}
          </div>

          <div className="customizer-layout">
            {/* ===== WORKSPACE ===== */}
            <section className="workspace">
              {mode === "design" ? (
                <>
                  <div className="view-toggle">
                    <button className={side === "front" ? "active" : ""} onClick={() => setSide("front")}>Mặt trước</button>
                    <button className={side === "back" ? "active" : ""} onClick={() => setSide("back")}>Mặt sau</button>
                  </div>
                  <div className="apply-both-row">
                    <label><input type="checkbox" checked={applyToBoth} onChange={(e) => setApplyToBoth(e.target.checked)} /> Áp dụng lên cả hai mặt</label>
                  </div>
                </>
              ) : null}

              <div className="shirt-preview-grid">
                {/* Mặt trước */}
                <div className={`shirt-preview ${mode === "design" ? (side === "front" ? "active-preview" : "inactive-preview") : "active-preview"}`}>
                  <div className="shirt-card"
                    onPointerMove={mode === "design" && side === "front" ? handlePointerMove : undefined}
                    onPointerUp={mode === "design" && side === "front" ? endDrag : undefined}
                    onPointerLeave={mode === "design" && side === "front" ? endDrag : undefined}
                  >
                    <div className="shirt-base">
                      {mode === "upload" && uploadFrontPreviewUrl ? (
                        <img className="shirt-image" src={uploadFrontPreviewUrl} alt="thiết kế mặt trước" style={{ objectFit: "contain" }} />
                      ) : (
                        <>
                          <img className="shirt-image" src={mode === "design" ? getShirtImage(frontDesign.color) : shirtWhite} alt="áo trước" />
                          {mode === "design" && <div className="shirt-color-overlay" style={{ backgroundColor: frontDesign.color }} />}
                        </>
                      )}
                    </div>
                    {mode === "design" && renderDesignItems(frontDesign, side === "front")}
                  </div>
                  <div className="shirt-footer">
                    <span>Mặt trước</span>
                    {mode === "upload" && (
                      <label className="upload-inline-btn">
                        {uploadFrontFile ? "✓ Đã chọn" : "📷 Tải ảnh"}
                        <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFrontFileSelect} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Mặt sau */}
                <div className={`shirt-preview ${mode === "design" ? (side === "back" ? "active-preview" : "inactive-preview") : "active-preview"}`}>
                  <div className="shirt-card"
                    onPointerMove={mode === "design" && side === "back" ? handlePointerMove : undefined}
                    onPointerUp={mode === "design" && side === "back" ? endDrag : undefined}
                    onPointerLeave={mode === "design" && side === "back" ? endDrag : undefined}
                  >
                    <div className="shirt-base">
                      {mode === "upload" && uploadBackPreviewUrl ? (
                        <img className="shirt-image" src={uploadBackPreviewUrl} alt="thiết kế mặt sau" style={{ objectFit: "contain" }} />
                      ) : (
                        <>
                          <img className="shirt-image" src={mode === "design" ? getShirtImage(backDesign.color) : shirtWhite} alt="áo sau" />
                          {mode === "design" && <div className="shirt-color-overlay" style={{ backgroundColor: backDesign.color }} />}
                        </>
                      )}
                    </div>
                    {mode === "design" && renderDesignItems(backDesign, side === "back")}
                  </div>
                  <div className="shirt-footer">
                    <span>Mặt sau</span>
                    {mode === "upload" && (
                      <label className="upload-inline-btn">
                        {uploadBackFile ? "✓ Đã chọn" : "📷 Tải ảnh"}
                        <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleBackFileSelect} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ===== SIDEBAR ===== */}
            <aside className="design-sidebar">
              <div className="sidebar-header">
                <h3>{mode === "design" ? "Công cụ thiết kế" : "Tải mẫu thiết kế"}</h3>
                <p>{mode === "design" ? "Tùy chỉnh sản phẩm của bạn" : "Chọn ảnh mặt trước & mặt sau"}</p>
              </div>

              <div className="sidebar-content">
                {mode === "design" ? (
                  <>
                    <div className="sidebar-section"><h4>Chọn màu áo</h4>
                      <div className="color-grid">{colors.map(c => <button key={c} className={`color-swatch ${activeDesign.color === c ? "active-swatch" : ""}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />)}</div>
                    </div>
                    <div className="sidebar-section"><h4>Thư viện Logo</h4>
                      <div className="logo-grid">
                        {logos.map(l => <button key={l} className={`logo-item ${getItem("logo", activeDesign)?.content === l ? "active-logo" : ""}`} onClick={() => setLogo(l)}>{l}</button>)}
                        <button className="logo-item clear-logo" onClick={() => setLogo(null)}>Xóa</button>
                      </div>
                    </div>
                    <div className="sidebar-section"><h4>Chọn màu logo</h4>
                      <div className="logo-color-grid">{logoColors.map(c => <button key={c} className={`logo-color-swatch ${logoColor === c ? "active-swatch" : ""}`} style={{ backgroundColor: c }} onClick={() => updateLogoColor(c)} aria-label={`Màu ${c}`} />)}</div>
                      <div className="logo-color-picker-row">
                        <input type="color" value={logoColor} onChange={(e) => updateLogoColor(e.target.value)} className="color-input" />
                        <input type="text" value={logoColor} onChange={(e) => updateLogoColor(e.target.value)} className="hex-input" placeholder="#000000" />
                      </div>
                    </div>
                    <div className="sidebar-section"><h4>Nội dung tùy chỉnh</h4>
                      <input type="text" placeholder="Nhập nội dung" value={getItem("text", activeDesign)?.content ?? ""} onChange={(e) => setText(e.target.value)} className="text-input" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sidebar-section"><h4>File đã chọn</h4>
                      {(uploadFrontFile || uploadBackFile) ? (
                        <div className="upload-files-summary">
                          {uploadFrontFile && <div className="upload-file-row"><img src={uploadFrontPreviewUrl!} alt="front" className="upload-preview-thumb-small" /><div><span className="upload-file-label">Mặt trước:</span><span className="upload-file-name-sm">{uploadFrontFile.name}</span></div></div>}
                          {uploadBackFile && <div className="upload-file-row"><img src={uploadBackPreviewUrl!} alt="back" className="upload-preview-thumb-small" /><div><span className="upload-file-label">Mặt sau:</span><span className="upload-file-name-sm">{uploadBackFile.name}</span></div></div>}
                        </div>
                      ) : <div className="info-box">Chưa chọn file. Nhấn "📷 Tải ảnh" dưới mỗi mặt áo.</div>}
                    </div>
                  </>
                )}

                {/* ===== FORM ĐĂNG BÀI (chung) ===== */}
                <div className="sidebar-section"><h4>📝 Tiêu đề bài đăng *</h4><input type="text" placeholder="VD: Đặt in áo thun cổ tròn" value={postTitle} onChange={e => setPostTitle(e.target.value)} className="text-input" /></div>
                <div className="sidebar-section"><h4>📄 Mô tả yêu cầu</h4><textarea placeholder="Mô tả chi tiết yêu cầu in ấn..." value={postDescription} onChange={e => setPostDescription(e.target.value)} className="text-input post-textarea" rows={3} /></div>
                <div className="sidebar-section"><h4>🔢 Số lượng *</h4><input type="number" min={1} value={postQuantity} onChange={e => setPostQuantity(Number(e.target.value))} className="text-input" /></div>

                {mode === "design" && (
                <div className="sidebar-row-2">
                  <div className="sidebar-section"><h4>📐 Size</h4><select value={postSize} onChange={e => setPostSize(e.target.value)} className="text-input">{["XS","S","M","L","XL","XXL","3XL"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                  <div className="sidebar-section"><h4>🧵 Chất liệu</h4><select value={postMaterial} onChange={e => setPostMaterial(e.target.value)} className="text-input">{["Cotton 100%","Cotton 65/35","Polyester","Vải thun lạnh","Vải cá sấu","Khác"].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                </div>
                )}

                <div className="sidebar-row-2">
                  <div className="sidebar-section"><h4>💰 NS tối thiểu</h4><input type="number" placeholder="VNĐ" value={postBudgetMin} onChange={e => setPostBudgetMin(e.target.value)} className="text-input" /></div>
                  <div className="sidebar-section"><h4>💰 NS tối đa</h4><input type="number" placeholder="VNĐ" value={postBudgetMax} onChange={e => setPostBudgetMax(e.target.value)} className="text-input" /></div>
                </div>
                <div className="sidebar-section"><h4>📅 Hạn chót</h4><input type="date" value={postDeadline} onChange={e => setPostDeadline(e.target.value)} className="text-input" /></div>
                <div className="sidebar-section"><h4>📝 Ghi chú</h4><textarea
                  placeholder={mode === "upload" ? "VD: 20 áo size M, 20 áo size L, 10 áo size XL - Chất liệu: Cotton 100%. Yêu cầu in sắc nét, không phai màu." : "Yêu cầu đặc biệt..."}
                  value={postNotes}
                  onChange={e => setPostNotes(e.target.value)}
                  className="text-input post-textarea" rows={4}
                /></div>
              </div>

              <div className="sidebar-footer">
                <button className="save-btn" onClick={handleSubmitPost} disabled={loading}>
                  {loading ? "Đang đăng bài..." : "🚀 Đăng bài ngay"}
                </button>
                <button className="clear-btn" onClick={mode === "design" ? handleClearDraft : handleClearUpload} disabled={loading}>
                  Xóa tất cả
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
