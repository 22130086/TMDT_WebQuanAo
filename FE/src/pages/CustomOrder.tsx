import { useEffect, useRef, useState, type PointerEvent } from "react";
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

  const handleCreateDesign = async (productName = "Thiết kế áo của tôi"): Promise<number | null> => {
    setLoading(true);
    try {
      const response = await createCustomProduct({
        name: productName,
        description: "Thiết kế áo custom tại FE",
      });
      const id = response.data.id;
      setCustomProductId(id);
      localStorage.setItem("customProductDraftId", String(id));
      setMessage("Tạo thiết kế mới thành công. Bạn có thể bắt đầu thiết kế.");
      return id;
    } catch (error) {
      setMessage(`Tạo thiết kế mới thất bại. ${(error as Error)?.message || ""}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async () => {
    let id = customProductId;
    if (!id) {
      id = await handleCreateDesign();
      if (!id) return;
    }

    const payload: DesignPayload = {
      front: frontDesign,
      back: backDesign,
    };

    const json = JSON.stringify(payload);
    const base64 = base64FromString(json);

    setLoading(true);
    try {
      await uploadDesignJson(id, {
        jsonBase64: base64,
        fileName: `custom_design_${id}.json`,
      });
      setCustomProductId(id);
      localStorage.setItem("customProductDraftId", String(id));
      setMessage("Thiết kế đã được lưu thành công.");
    } catch (error) {
      setMessage(
        `Lưu thiết kế thất bại. Vui lòng thử lại. ${(error as Error)?.message || ""}`
      );
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

  return (
    <>
      <Header />

      <div className="custom-order-page">
        <section className="custom-hero">
          <div className="hero-left">
            <span className="hero-badge">THIẾT KẾ CUSTOM</span>
            <h1>Thiết kế trực tuyến</h1>
            <p>
              Thiết kế giao diện giống ShirtCustomizer: chọn màu áo, thêm text,
              chọn logo, và xem trước mặt trước / mặt sau ngay lập tức.
            </p>
            <div className="hero-rating">
              ✅ Front / Back • Chọn màu • Chọn logo • Lưu thiết kế
            </div>
          </div>
          <div className="hero-right">
            <img
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200"
              alt="custom shirt"
            />
          </div>
        </section>

        <section className="custom-card shirt-customizer-page">
          <div className="workspace-header">
            <span className="text-label-sm font-label uppercase tracking-widest text-secondary">
              Mẫu thiết kế
            </span>

            <h2 className="text-headline-sm font-headline font-bold text-on-surface uppercase">
              Thiết kế áo của bạn
            </h2>
          </div>
          <div className="design-notice customizer-notice">
            {loading ? "Đang xử lý..." : message}
          </div>

          <div className="customizer-layout">
            <section className="workspace">
              <div className="view-toggle">
                <button
                  className={side === "front" ? "active" : ""}
                  onClick={() => setSide("front")}
                >
                  Mặt trước
                </button>
                <button
                  className={side === "back" ? "active" : ""}
                  onClick={() => setSide("back")}
                >
                  Mặt sau
                </button>
              </div>

              <div className="apply-both-row">
                <label>
                  <input
                    type="checkbox"
                    checked={applyToBoth}
                    onChange={(e) => setApplyToBoth(e.target.checked)}
                  />
                  Áp dụng lên cả hai mặt
                </label>
              </div>

              <div className="shirt-preview-grid">
                <div className={`shirt-preview ${side === "front" ? "active-preview" : "inactive-preview"}`}>
                  <div
                    className="shirt-card"
                    onPointerMove={side === "front" ? handlePointerMove : undefined}
                    onPointerUp={side === "front" ? endDrag : undefined}
                    onPointerLeave={side === "front" ? endDrag : undefined}
                  >
                    <div className="shirt-base">
                      <img
                        className="shirt-image"
                        src={getShirtImage(frontDesign.color)}
                        alt="áo trước"
                      />
                      <div
                        className="shirt-color-overlay"
                        style={{ backgroundColor: frontDesign.color }}
                      />
                    </div>
                    {renderDesignItems(frontDesign, side === "front")}
                  </div>
                  <div className="shirt-footer">
                    <span>Mặt trước</span>
                  </div>
                </div>

                <div className={`shirt-preview ${side === "back" ? "active-preview" : "inactive-preview"}`}>
                  <div
                    className="shirt-card"
                    onPointerMove={side === "back" ? handlePointerMove : undefined}
                    onPointerUp={side === "back" ? endDrag : undefined}
                    onPointerLeave={side === "back" ? endDrag : undefined}
                  >
                    <div className="shirt-base">
                      <img
                        className="shirt-image"
                        src={getShirtImage(backDesign.color)}
                        alt="áo sau"
                      />
                      <div
                        className="shirt-color-overlay"
                        style={{ backgroundColor: backDesign.color }}
                      />
                    </div>
                    {renderDesignItems(backDesign, side === "back")}
                  </div>
                  <div className="shirt-footer">
                    <span>Mặt sau</span>
                  </div>
                </div>
              </div>
            </section>

            <aside className="design-sidebar">
              <div className="sidebar-header">
                <h3>Công cụ thiết kế</h3>
                <p>Tùy chỉnh sản phẩm của bạn</p>
              </div>

              <div className="sidebar-content">
                <div className="sidebar-section">
                  <h4>Chọn màu áo</h4>
                  <div className="color-grid">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={`color-swatch ${activeDesign.color === color ? "active-swatch" : ""}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="sidebar-section">
                  <h4>Thư viện Logo</h4>
                  <div className="logo-grid">
                    {logos.map((logo) => (
                      <button
                        key={logo}
                        className={`logo-item ${getItem("logo", activeDesign)?.content === logo ? "active-logo" : ""}`}
                        onClick={() => setLogo(logo)}
                      >
                        {logo}
                      </button>
                    ))}
                    <button
                      className="logo-item clear-logo"
                      onClick={() => setLogo(null)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="sidebar-section">
                  <h4>Chọn màu logo</h4>
                  <div className="logo-color-grid">
                    {logoColors.map((color) => (
                      <button
                        key={color}
                        className={`logo-color-swatch ${logoColor === color ? "active-swatch" : ""}`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateLogoColor(color)}
                        aria-label={`Chọn màu logo ${color}`}
                      />
                    ))}
                  </div>
                  <div className="logo-color-picker-row">
                    <input
                      type="color"
                      value={logoColor}
                      onChange={(e) => updateLogoColor(e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={logoColor}
                      onChange={(e) => updateLogoColor(e.target.value)}
                      className="hex-input"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="sidebar-section">
                  <h4>Nội dung tùy chỉnh</h4>
                  <input
                    type="text"
                    placeholder="Nhập nội dung"
                    value={getItem("text", activeDesign)?.content ?? ""}
                    onChange={(e) => setText(e.target.value)}
                    className="text-input"
                  />
                  <div className="info-box">
                    Nội dung sẽ được in bằng công nghệ in lụa cao cấp,
                    đảm bảo độ bền và sắc nét.
                  </div>
                </div>
              </div>

              <div className="sidebar-footer">
                <button className="save-btn" onClick={handleSaveDesign} disabled={loading}>
                  {loading ? "Đang lưu..." : "Lưu thiết kế"}
                </button>
                <button className="clear-btn" onClick={handleClearDraft} disabled={loading}>
                  Xóa thiết kế
                </button>
                {customProductId ? (
                  <div className="draft-id">Draft ID: {customProductId}</div>
                ) : null}
              </div>
            </aside>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
