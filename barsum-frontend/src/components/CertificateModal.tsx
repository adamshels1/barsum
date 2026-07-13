"use client";

import { toBlob, toPng } from "html-to-image";
import { Download, Printer, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Portal } from "@/components/Portal";
import { ReadingCertificate } from "@/components/ReadingCertificate";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    download: "Скачать",
    print: "Печать",
    share: "Поделиться",
    close: "Закрыть",
    preparing: "Готовим…",
    downloaded: "Сертификат сохранён!",
    shareError: "Не удалось поделиться",
    genError: "Не удалось создать изображение",
    shareTitle: "Сертификат читателя Barsum",
  },
  kk: {
    download: "Жүктеу",
    print: "Басып шығару",
    share: "Бөлісу",
    close: "Жабу",
    preparing: "Дайындалуда…",
    downloaded: "Сертификат сақталды!",
    shareError: "Бөлісу мүмкін болмады",
    genError: "Суретті жасау мүмкін болмады",
    shareTitle: "Barsum оқырман сертификаты",
  },
};

function slugify(s: string) {
  return (s || "certificate").toLowerCase().replace(/[^a-z0-9а-яёіңғүұқөһ]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "certificate";
}

export function CertificateModal({
  childName,
  bookTitle,
  onClose,
}: {
  childName: string;
  bookTitle: string;
  onClose: () => void;
}) {
  const t = useT(dict);
  const certRef = useRef<HTMLDivElement>(null);
  // Callback-ref: Portal монтирует содержимое на тик позже, поэтому обычный ref в
  // useLayoutEffect ещё null. Через состояние с элементом эффект запускается,
  // когда узел реально появился в DOM.
  const [boxEl, setBoxEl] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.5);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!boxEl) return;
    const recompute = () => {
      const availW = boxEl.clientWidth;
      const availH = boxEl.clientHeight;
      if (availW <= 0 || availH <= 0) return;
      // Сертификат всегда прямо: вписываем по ширине и высоте видимой области.
      const s = Math.min(availW / 1500, availH / 1030);
      setScale(Math.min(s * 0.98, 0.9));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(boxEl);
    window.addEventListener("resize", recompute);
    window.addEventListener("orientationchange", recompute);
    return () => { ro.disconnect(); window.removeEventListener("resize", recompute); window.removeEventListener("orientationchange", recompute); };
  }, [boxEl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filename = `barsum-sertifikat-${slugify(bookTitle)}.png`;

  const genPng = async () => {
    const node = certRef.current;
    if (!node) return null;
    // Снимаем с натурального узла 1500×1030 (обёртка масштабирует визуально, но node — в полный размер)
    return toPng(node, { pixelRatio: 2, width: 1500, height: 1030, backgroundColor: "#ffffff" });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const url = await genPng();
      if (!url) throw new Error("no node");
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      toast.success(t("downloaded"));
    } catch {
      toast.error(t("genError"));
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const node = certRef.current;
      if (!node) throw new Error("no node");
      const blob = await toBlob(node, { pixelRatio: 2, width: 1500, height: 1030, backgroundColor: "#ffffff" });
      if (!blob) throw new Error("no blob");
      const file = new File([blob], filename, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: t("shareTitle") });
      } else {
        // Фолбэк: если шаринг файлов недоступен — просто скачиваем
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t("downloaded"));
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error(t("shareError"));
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    setBusy(true);
    try {
      const url = await genPng();
      if (!url) throw new Error("no node");
      // Печатаем только сам сертификат через скрытый iframe (без popup-блокировок).
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (!doc) throw new Error("no iframe");
      doc.open();
      doc.write(
        `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:landscape;margin:0}html,body{margin:0;padding:0}img{width:100%;height:auto;display:block}</style></head><body><img src="${url}"/></body></html>`,
      );
      doc.close();
      const win = iframe.contentWindow;
      if (win) win.onafterprint = () => setTimeout(() => iframe.remove(), 500);
      const img = doc.querySelector("img");
      if (img) {
        img.onload = () => { win?.focus(); win?.print(); };
      } else {
        win?.focus();
        win?.print();
      }
    } catch {
      toast.error(t("genError"));
    } finally {
      setBusy(false);
    }
  };

  const cw = 1500 * scale;
  const ch = 1030 * scale;

  return (
    <Portal>
      <div
        className="fixed inset-0"
        style={{ display: "flex", flexDirection: "column", background: "rgba(10,6,30,0.78)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 4000 }}
      >
        {/* Область просмотра — скроллится, если не влезает */}
        <div
          ref={setBoxEl}
          style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div style={{ width: cw, height: ch, position: "relative", flexShrink: 0, borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%,-50%) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <ReadingCertificate ref={certRef} childName={childName} bookTitle={bookTitle} />
            </div>
          </div>
        </div>

        {/* Нижняя панель кнопок — всегда доступна */}
        <div style={{ flexShrink: 0, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", padding: "14px 16px max(14px, env(safe-area-inset-bottom))", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <button
            onClick={handleDownload}
            disabled={busy}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 15, background: "#ffffff", color: "#4776e6", opacity: busy ? 0.6 : 1 }}
          >
            <Download size={17} strokeWidth={2.5} />
            {busy ? t("preparing") : t("download")}
          </button>
          <button
            onClick={handlePrint}
            disabled={busy}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 9999, border: "1px solid rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 15, background: "rgba(255,255,255,0.14)", color: "#ffffff", opacity: busy ? 0.6 : 1 }}
          >
            <Printer size={17} strokeWidth={2.5} />
            {t("print")}
          </button>
          <button
            onClick={handleShare}
            disabled={busy}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 9999, border: "1px solid rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 15, background: "rgba(255,255,255,0.14)", color: "#ffffff", opacity: busy ? 0.6 : 1 }}
          >
            <Share2 size={17} strokeWidth={2.5} />
            {t("share")}
          </button>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 9999, border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 15, background: "transparent", color: "rgba(255,255,255,0.85)" }}
          >
            <X size={17} strokeWidth={2.5} />
            {t("close")}
          </button>
        </div>
      </div>
    </Portal>
  );
}
