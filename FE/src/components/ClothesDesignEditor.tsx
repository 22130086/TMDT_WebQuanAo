import { useEffect, useMemo, useRef, useState } from "react";
import * as fabric from "fabric";

import shirtWhite from "../assets/shirt_white.png";
import shirtBlack from "../assets/shirt_black.png";

import "../styles/custom-order.css";



type CanvasJSON = any;

type Side = "front" | "back";



function base64FromString(s: string) {
  // Works for ASCII/UTF-8 when we use encodeURIComponent
  const utf8 = encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8);
}

export default function ClothesDesignEditor(props: {
  onCreateDesign?: (productName: string) => Promise<number> | number;
  customProductId?: number | null;
  setCustomProductId?: (id: number) => void;
  onDesignUploaded?: (designFileUrl: string) => void;
  initialDesign?: { front?: CanvasJSON; back?: CanvasJSON } | null;
  // constraint: limit objects inside print area
  printArea?: { x: number; y: number; w: number; h: number };
  availableShirtColors?: { value: string; label: string }[];
}) {

  const {
    customProductId,
    setCustomProductId,
    onCreateDesign,
    initialDesign,
  } = props as any;


  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [side, setSide] = useState<Side>("front");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading] = useState(false);


  const [shirtColor] = useState<string>("#ffffff");


  const printArea = useMemo(
    () => props.printArea || { x: 120, y: 40, w: 420, h: 520 },
    [props.printArea]
  );


  const fabricFrontRef = useRef<fabric.Canvas | null>(null);
  const fabricBackRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    const frontEl = frontCanvasRef.current;
    const backEl = backCanvasRef.current;
    if (!frontEl || !backEl) return;

    const front = new fabric.Canvas(frontEl, {
      preserveObjectStacking: true,
      selection: true,
    });
    const back = new fabric.Canvas(backEl, {
      preserveObjectStacking: true,
      selection: true,
    });

    fabricFrontRef.current = front;
    fabricBackRef.current = back;

    // background placeholders (non-interactive)
    const initBackground = (canvas: fabric.Canvas) => {
      canvas.backgroundColor = "#cbd5e0";
      canvas.requestRenderAll();

      // Remove previous base shirt image(s) and silhouette shapes
      canvas.getObjects().forEach((o) => {
        const anyObj: any = o as any;
        if (
          anyObj?.metadata?.role === "shirt-base" ||
          anyObj?.metadata?.role === "shirt-silhouette"
        ) {
          canvas.remove(o);
        }
      });

      const urlByColor: Record<string, string> = {
        "#ffffff": shirtWhite,
        "#111111": shirtBlack,
      };

      const url =
        urlByColor[shirtColor] ||
        (props.availableShirtColors || []).find((c: any) => c.value === shirtColor)?.value ||
        shirtWhite;

      (fabric.Image as any).fromURL(url, (img: any) => {
        if (!img) return;

        const maxW = canvas.getWidth();
        const maxH = canvas.getHeight();
        const scale = Math.min(
          maxW / (img.width || 1),
          maxH / (img.height || 1)
        );

        (canvas as any).setBackgroundImage(
          img,
          canvas.renderAll.bind(canvas),
          {
            left: 0,
            top: 0,
            originX: "left",
            originY: "top",
            scaleX: scale,
            scaleY: scale,
            width: img.width * scale,
            height: img.height * scale,
          }
        );
      });

      const area = new fabric.Rect({
        left: printArea.x,
        top: printArea.y,
        width: printArea.w,
        height: printArea.h,
        fill: "rgba(255,255,255,0.0)",
        stroke: "rgba(15,23,42,0.2)",
        strokeDashArray: [6, 6],
        selectable: false,
        evented: false,
        metadata: { role: "print-area" },
      });
      canvas.add(area);

      canvas.requestRenderAll();

      canvas.on("object:added", (e) => {
        const obj = e.target as fabric.Object | undefined;
        if (!obj) return;
      });
    };


    initBackground(front);
    initBackground(back);

    const clampObjectToPrintArea = (obj: fabric.Object) => {
      const { x, y, w, h } = printArea;

      // Use bounding box in canvas coordinates
      obj.setCoords();
      const bounds = obj.getBoundingRect();

      let dx = 0;
      let dy = 0;

      if (bounds.left < x) dx = x - bounds.left;
      if (bounds.top < y) dy = y - bounds.top;
      if (bounds.left + bounds.width > x + w)
        dx = x + w - (bounds.left + bounds.width);
      if (bounds.top + bounds.height > y + h)
        dy = y + h - (bounds.top + bounds.height);

      if (dx !== 0 || dy !== 0) {
        obj.set({ left: (obj.left ?? 0) + dx, top: (obj.top ?? 0) + dy });
        obj.setCoords();
      }
    };

    const onMoving = (e: any) => {
      const obj = (e.target as fabric.Object | undefined) || null;
      if (!obj) return;
      clampObjectToPrintArea(obj);
      (e.target as any)?.canvas?.requestRenderAll?.();
    };




    front.on("object:moving", onMoving);
    back.on("object:moving", onMoving);

    // Load initial design if provided
    const loadJSON = () => {
      try {
        if (initialDesign?.front) {
          front.loadFromJSON(initialDesign.front, () => {
            front.requestRenderAll();
          });
        }
        if (initialDesign?.back) {
          back.loadFromJSON(initialDesign.back, () => {
            back.requestRenderAll();
          });
        }
      } catch {
        // ignore
      }
    };

    void loadJSON();

    return () => {
      front.dispose();
      back.dispose();
      fabricFrontRef.current = null;
      fabricBackRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When switching side, ensure both can continue editing.
    // (No additional action for now.)
  }, [side]);

  const activeCanvas = () =>
    side === "front" ? fabricFrontRef.current : fabricBackRef.current;

  const addText = () => {
    const c = activeCanvas();
    if (!c) return;

    const text = new fabric.IText("Text", {
      left: printArea.x + 40,
      top: printArea.y + 60,
      fontSize: 28,
      fill: "#111",
      selectable: true,
      hasControls: true,
      hasRotatingPoint: true,
      objectCaching: false,
    });

    c.add(text);
    c.setActiveObject(text);
    c.requestRenderAll();
  };

  const addNumberOrWord = (value: string) => {
    const c = activeCanvas();
    if (!c) return;

    const text = new fabric.IText(value || "", {
      left: printArea.x + 60,
      top: printArea.y + 100,
      fontSize: 34,
      fill: "#111",
      objectCaching: false,
    });

    c.add(text);
    c.setActiveObject(text);
    c.requestRenderAll();
  };

  const handleUploadLogo = async (file: File) => {
    const c = activeCanvas();
    if (!c) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      (fabric.Image as any).fromURL(dataUrl, (img: any) => {

        // scale down to fit
        img.set({
          left: printArea.x + 30,
          top: printArea.y + 30,
          originX: "left",
          originY: "top",
          selectable: true,
          hasControls: true,
        });

        const maxW = printArea.w - 60;
        const maxH = printArea.h - 60;
        const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1));
        img.scale(scale);

        c.add(img);
        c.setActiveObject(img);
        c.requestRenderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const exportDesignJSON = () => {
    const front = fabricFrontRef.current;
    const back = fabricBackRef.current;
    if (!front || !back) return null;

    const filterExportJson = (json: any) => {
      if (!json || !Array.isArray(json.objects)) return json;
      return {
        ...json,
        objects: json.objects.filter(
          (obj: any) => obj?.metadata?.role !== "print-area"
        ),
      };
    };

    const frontJson = filterExportJson(
      front.toDatalessJSON(["selectable", "evented", "stroke", "strokeDashArray"])
    );
    const backJson = filterExportJson(
      back.toDatalessJSON(["selectable", "evented", "stroke", "strokeDashArray"])
    );

    return {
      version: 1,
      front: frontJson,
      back: backJson,
    };
  };

  const [textValue, setTextValue] = useState<string>("123");

  const handleSave = async () => {
    const payload = exportDesignJSON();
    if (!payload) return;

    // create design record if missing
    let id = customProductId ?? null;
    if (!id) {
      if (!onCreateDesign || !setCustomProductId) return;
      const createdId = await onCreateDesign("Thiết kế của tôi");
      id = createdId;
      setCustomProductId(createdId);
    }

    if (!id) return;

    const cJson = JSON.stringify(payload);
    const base64 = base64FromString(cJson);

    // Caller decides how to upload; we pass the JSON base64 via a custom event.
    // We’ll dispatch a custom DOM event to keep the editor generic.
    const event = new CustomEvent("custom-design-save", {
      detail: {
        customProductId: id,
        jsonBase64: base64,
        fileName: `custom_design_${id}.json`,
      },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="designer-wrapper">
      <div className="designer-toolbar">

        <div className="designer-tabs">
          <button
            className={side === "front" ? "tab active" : "tab"}
            onClick={() => setSide("front")}
          >
            Front
          </button>
          <button
            className={side === "back" ? "tab active" : "tab"}
            onClick={() => setSide("back")}
          >
            Back
          </button>
        </div>

        <div className="designer-actions">
          <button onClick={addText}>Thêm Text</button>

          <input
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Số/Từ"
          />
          <button onClick={() => addNumberOrWord(textValue)}>Thêm Số/Từ</button>

          <label className="upload-btn">
            Upload Logo
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUploadLogo(f);
              }}
            />
          </label>

          <button onClick={handleSave} disabled={loading}>
            Lưu Draft
          </button>
        </div>
      </div>

      <div className="designer-canvas-grid">
        <div className={side === "front" ? "canvas-card active" : "canvas-card"}>
          <div className="canvas-title">Mặt trước</div>
          <canvas
            ref={frontCanvasRef}
            width={560}
            height={600}
            style={{ border: "1px solid #94a3b8", background: "transparent" }}
          />
        </div>

        <div className={side === "back" ? "canvas-card active" : "canvas-card"}>
          <div className="canvas-title">Mặt sau</div>
          <canvas
            ref={backCanvasRef}
            width={560}
            height={600}
            style={{ border: "1px solid #94a3b8", background: "transparent" }}
          />
        </div>
      </div>
    </div>
  );
}

