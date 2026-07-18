"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, AlertTriangle, Check, Lock, Unlock, Flag } from "lucide-react";
import { collabApi, contributionAudioUrl, type CollabBook, type Contribution } from "@/lib/api/collab";
import { BackButton } from "@/components/BackButton";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", width: 70, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div style={{ width: `${value * 10}%`, height: "100%", background: value >= 7 ? "#6ee7a0" : value >= 4 ? "#ffd27d" : "#ff9a9a" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", width: 22, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function ExpertCollabPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editedText, setEditedText] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: book } = useQuery<CollabBook>({ queryKey: ["expert-collab-book", id], queryFn: () => collabApi.getBook(id) });
  const { data: contribs } = useQuery<Contribution[]>({
    queryKey: ["expert-collab-round", id],
    queryFn: () => collabApi.round(id),
    refetchInterval: (q) => (q.state.data?.some((c) => c.aiScore == null && !c.transcription) ? 4000 : false),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["expert-collab-book", id] });
    qc.invalidateQueries({ queryKey: ["expert-collab-round", id] });
  };

  // Автоподстановка: как только эксперт меняет набор выбранных продолжений,
  // в поле правки собирается склеенный текст выбранных (в порядке по скору),
  // чтобы эксперт мог его отредактировать перед тем, как сделать главой.
  const selectedKey = [...selected].sort().join(",");
  useEffect(() => {
    if (selected.size === 0) {
      setEditedText("");
      return;
    }
    const chosen = (contribs ?? []).filter((c) => selected.has(c.id));
    const text = chosen
      .map((c) => (c.expertEditedText || c.transcription || "").trim())
      .filter(Boolean)
      .join("\n\n");
    setEditedText(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const toggle = (cid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cid) ? next.delete(cid) : next.add(cid);
      return next;
    });
  };

  const doSelect = async () => {
    if (!selected.size) { toast.error("Выберите хотя бы одно продолжение"); return; }
    setBusy(true);
    try {
      await collabApi.select(id, { round: book?.currentRound, contributionIds: [...selected], editedText: editedText.trim() || undefined });
      toast.success("Глава добавлена! Победителям начислены монеты 🎉");
      setSelected(new Set());
      setEditedText("");
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Не удалось выбрать");
    } finally { setBusy(false); }
  };

  const toggleRound = async () => {
    if (!book) return;
    setBusy(true);
    try { await collabApi.setRound(id, !book.collabOpen); refresh(); } finally { setBusy(false); }
  };

  const complete = async () => {
    if (!confirm("Завершить книгу? Она станет доступна в магазине как читаемая.")) return;
    setBusy(true);
    try { await collabApi.complete(id); toast.success("Книга завершена и опубликована 📚"); refresh(); } finally { setBusy(false); }
  };

  if (!book) return <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>…</main>;

  const chapters = book.partTexts ?? [];
  const visible = (contribs ?? []).filter((c) => !c.safetyFlag);
  const flagged = (contribs ?? []).filter((c) => c.safetyFlag);

  return (
    <main style={{ minHeight: "100dvh", padding: "52px 20px 40px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton href="/expert/home" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        {book.coverImage && (
          <div style={{ width: 56, height: 56, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={book.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>{book.bookTitle}</h1>
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 16px" }}>
        Глава на выбор: <b style={{ color: "#ffd27d" }}>#{book.currentRound}</b> · всего глав: {chapters.length}
      </p>

      {/* Управление раундом / завершение */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={toggleRound} disabled={busy || book.collabCompleted} className="glass-chip" style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: "#fff", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {book.collabOpen ? <><Lock size={14} /> Закрыть приём</> : <><Unlock size={14} /> Открыть приём</>}
        </button>
        {!book.collabCompleted && chapters.length > 1 && (
          <button onClick={complete} disabled={busy} className="glass-chip" style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: "#8effc0", border: "1px solid rgba(140,255,190,0.35)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Check size={14} /> Завершить книгу
          </button>
        )}
        {book.collabCompleted && <span style={{ fontSize: 13, fontWeight: 800, color: "#8effc0", alignSelf: "center" }}>✓ Книга завершена</span>}
      </div>

      {/* Последняя глава — контекст */}
      {chapters.length > 0 && (
        <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Предыдущая глава ({chapters.length})</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.6, fontFamily: "Georgia, serif" }}>{chapters[chapters.length - 1]}</p>
        </div>
      )}

      <h2 style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: "0 0 12px" }}>Продолжения ({visible.length})</h2>

      {!visible.length && !flagged.length && (
        <div className="glass" style={{ padding: 24, borderRadius: 16, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>Пока нет продолжений для этой главы</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map((c) => {
          const isSel = selected.has(c.id);
          const score = c.aiScore != null ? Math.round(Number(c.aiScore)) : null;
          return (
            <div key={c.id} className="glass" style={{ padding: 16, borderRadius: 18, border: isSel ? "2px solid #6ee7a0" : "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 9999,
                      flexShrink: 0,
                      background: c.authorType === "parent" ? "rgba(255,180,80,0.22)" : "rgba(120,170,255,0.22)",
                      color: c.authorType === "parent" ? "#ffcf8a" : "#a9c9ff",
                      border: `1px solid ${c.authorType === "parent" ? "rgba(255,180,80,0.4)" : "rgba(120,170,255,0.4)"}`,
                    }}
                  >
                    {c.authorType === "parent" ? "👤 Родитель" : "🧒 Ребёнок"}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.authorName || "—"}
                  </span>
                </div>
                {score != null && (
                  <span style={{ fontSize: 13, fontWeight: 900, color: score >= 7 ? "#8effc0" : score >= 4 ? "#ffd27d" : "#ff9a9a", flexShrink: 0 }}>ИИ: {score}/10</span>
                )}
              </div>

              {c.audioUrl && (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio controls preload="none" src={contributionAudioUrl(c.id)} style={{ width: "100%", height: 36, marginBottom: 10 }} />
              )}

              {c.transcription ? (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: "0 0 10px", lineHeight: 1.55, fontStyle: "italic" }}>«{c.transcription}»</p>
              ) : (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>⏳ ИИ обрабатывает запись…</p>
              )}

              {c.aiScoreBreakdown && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                  <ScoreBar label="Связь" value={c.aiScoreBreakdown.relevance} />
                  <ScoreBar label="Креатив" value={c.aiScoreBreakdown.creativity} />
                  <ScoreBar label="Связность" value={c.aiScoreBreakdown.coherence} />
                  <ScoreBar label="Язык" value={c.aiScoreBreakdown.language} />
                </div>
              )}
              {c.aiFeedback && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 10px", lineHeight: 1.5 }}>🤖 {c.aiFeedback}</p>
              )}

              <button
                onClick={() => toggle(c.id)}
                disabled={book.collabCompleted}
                style={{ width: "100%", padding: "10px 0", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 14, background: isSel ? "#6ee7a0" : "rgba(255,255,255,0.9)", color: isSel ? "#0a3d24" : "#4776e6", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {isSel ? <><Check size={16} strokeWidth={3} /> Выбрано победителем</> : <><Trophy size={16} /> Сделать этой главой</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Заблокированные ИИ-фильтром */}
      {!!flagged.length && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#ff9a9a", margin: "0 0 8px", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Flag size={14} /> Скрыто ИИ-фильтром ({flagged.length})
          </p>
          {flagged.map((c) => (
            <div key={c.id} className="glass" style={{ padding: 12, borderRadius: 14, marginBottom: 8, background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,120,120,0.3)" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{c.authorType === "parent" ? "👤 Родитель" : "🧒 Ребёнок"} · {c.authorName}</p>
              {c.audioUrl && <audio controls preload="none" src={contributionAudioUrl(c.id)} style={{ width: "100%", height: 32 }} />}
              {c.transcription && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "6px 0 0", fontStyle: "italic" }}>«{c.transcription}»</p>}
              <button onClick={() => toggle(c.id)} className="glass-chip" style={{ marginTop: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#fff", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer" }}>
                {selected.has(c.id) ? "✓ Выбрано" : "Всё равно выбрать"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Панель выбора: правка текста + подтверждение */}
      {!book.collabCompleted && selected.size > 0 && (
        <div className="glass" style={{ position: "sticky", bottom: 16, marginTop: 20, padding: 16, borderRadius: 18, background: "rgba(30,40,80,0.9)", border: "1px solid rgba(140,255,190,0.35)", backdropFilter: "blur(12px)" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
            Выбрано: {selected.size}. Текст главы из выбранных — отредактируйте при необходимости:
          </p>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="Текст главы (можно править, объединять и дополнять)"
            rows={6}
            style={{ width: "100%", padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontFamily: "inherit", fontSize: 14, lineHeight: 1.5, resize: "vertical", marginBottom: 10 }}
          />
          <button onClick={doSelect} disabled={busy} style={{ width: "100%", padding: "12px 0", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 900, fontSize: 15, background: "#6ee7a0", color: "#0a3d24", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Check size={18} strokeWidth={3} /> {busy ? "Сохраняем…" : `Сделать главой #${book.currentRound}`}
          </button>
        </div>
      )}
    </main>
  );
}
