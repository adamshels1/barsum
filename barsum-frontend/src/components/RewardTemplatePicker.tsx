"use client";

import { useState } from "react";
import { CoinIcon } from "@/components/CoinIcon";
import { REWARD_TEMPLATES, type RewardTemplate } from "@/lib/rewardTemplates";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    added: "✓ Добавлено",
    cancel: "Отмена",
    addBtn: "Добавить ✓",
  },
  kk: {
    added: "✓ Қосылды",
    cancel: "Бас тарту",
    addBtn: "Қосу ✓",
  },
};

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 18,
};

function ImageTile({ template, dim }: { template: RewardTemplate; dim?: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1",
        borderRadius: 14,
        background: "rgba(255,255,255,0.15)",
        overflow: "hidden",
        opacity: dim ? 0.5 : 1,
        marginBottom: 6,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={template.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}

function TemplateCard({
  template,
  isAdding,
  isAdded,
  onAdd,
}: {
  template: RewardTemplate;
  isAdding: boolean;
  isAdded: boolean;
  onAdd: (cost: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [cost, setCost] = useState(String(template.cost));
  const t = useT(dict);

  if (isAdded) {
    return (
      <div style={{ ...GLASS, padding: "10px 10px 12px", textAlign: "center", minWidth: 0 }}>
        <ImageTile template={template} dim />
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{t("added")}</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div style={{ ...GLASS, position: "relative", padding: "10px 10px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.4)", minWidth: 0 }}>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label={t("cancel")}
          style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, lineHeight: "22px", padding: 0, background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.8)" }}
        >
          ×
        </button>
        <ImageTile template={template} />
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</p>
        <input
          type="number"
          min={1}
          autoFocus
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="glass-input"
          style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 13, textAlign: "center", marginBottom: 8 }}
        />
        <button
          type="button"
          disabled={!cost || Number(cost) <= 0 || isAdding}
          onClick={() => onAdd(Number(cost))}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 4px",
            borderRadius: 9999,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: 12,
            background: "#ffffff",
            color: "#4776e6",
            opacity: !cost || Number(cost) <= 0 ? 0.6 : 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isAdding ? "..." : t("addBtn")}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      style={{ ...GLASS, padding: "10px 10px 12px", textAlign: "center", cursor: "pointer", fontFamily: "inherit", minWidth: 0, width: "100%" }}
    >
      <ImageTile template={template} />
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</p>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}><CoinIcon size={12} /> {template.cost}</p>
    </button>
  );
}

export function RewardTemplatePicker({
  onAdd,
  addedNames,
  pendingName,
}: {
  onAdd: (template: RewardTemplate) => void;
  addedNames: Set<string>;
  pendingName: string | null;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
      {REWARD_TEMPLATES.map((t) => (
        <TemplateCard
          key={t.name}
          template={t}
          isAdded={addedNames.has(t.name)}
          isAdding={pendingName === t.name}
          onAdd={(cost) => onAdd({ ...t, cost })}
        />
      ))}
    </div>
  );
}
