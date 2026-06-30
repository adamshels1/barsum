"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { challengesApi } from "@/lib/api/challenges";
import { apiClient } from "@/lib/api/client";

/* ─── Book catalog ───────────────────────────────────── */
interface BookOption {
  title: string;
  author: string;
  pages: number;
  ageMin: number;
  ageMax: number;
}

const BOOK_CATALOG: BookOption[] = [
  { title: "Маленький принц", author: "Антуан де Сент-Экзюпери", pages: 96, ageMin: 7, ageMax: 12 },
  { title: "Алиса в Стране чудес", author: "Льюис Кэрролл", pages: 176, ageMin: 7, ageMax: 12 },
  { title: "Приключения Тома Сойера", author: "Марк Твен", pages: 288, ageMin: 10, ageMax: 14 },
  { title: "Гарри Поттер и философский камень", author: "Дж. К. Роулинг", pages: 432, ageMin: 9, ageMax: 14 },
  { title: "Волшебник Изумрудного города", author: "Александр Волков", pages: 208, ageMin: 6, ageMax: 10 },
  { title: "Мумий-тролль и другие", author: "Туве Янссон", pages: 256, ageMin: 6, ageMax: 10 },
  { title: "Карлсон, который живёт на крыше", author: "Астрид Линдгрен", pages: 192, ageMin: 6, ageMax: 10 },
  { title: "Пиноккио", author: "Карло Коллоди", pages: 224, ageMin: 6, ageMax: 10 },
  { title: "20 000 лье под водой", author: "Жюль Верн", pages: 480, ageMin: 10, ageMax: 14 },
  { title: "Остров сокровищ", author: "Роберт Льюис Стивенсон", pages: 288, ageMin: 10, ageMax: 14 },
  { title: "Хоббит", author: "Дж. Р. Р. Толкин", pages: 320, ageMin: 10, ageMax: 14 },
  { title: "Дети капитана Гранта", author: "Жюль Верн", pages: 512, ageMin: 10, ageMax: 14 },
  { title: "Три мушкетёра", author: "Александр Дюма", pages: 576, ageMin: 12, ageMax: 16 },
  { title: "Робинзон Крузо", author: "Даниэль Дефо", pages: 320, ageMin: 10, ageMax: 14 },
  { title: "Приключения Буратино", author: "Алексей Толстой", pages: 192, ageMin: 6, ageMax: 10 },
  { title: "Медной горы хозяйка", author: "Павел Бажов", pages: 240, ageMin: 8, ageMax: 12 },
  { title: "Белый пудель", author: "Александр Куприн", pages: 64, ageMin: 8, ageMax: 12 },
  { title: "Чебурашка", author: "Эдуард Успенский", pages: 128, ageMin: 6, ageMax: 10 },
  { title: "Денискины рассказы", author: "Виктор Драгунский", pages: 256, ageMin: 7, ageMax: 11 },
  { title: "Тимур и его команда", author: "Аркадий Гайдар", pages: 128, ageMin: 10, ageMax: 14 },
];

/* ─── Types ─────────────────────────────────────────── */
interface FormData {
  title: string;
  category: string;
  ageMin: number;
  ageMax: number;
  bookTitle: string;
  bookAuthor: string;
  description: string;
  totalParts: number;
  pagesTotal: number;
  pagesPerPart: number;
  coinsReward: number;
  price: number;
}

const DEFAULT: FormData = {
  title: "",
  category: "reading",
  ageMin: 8,
  ageMax: 12,
  bookTitle: "",
  bookAuthor: "",
  description: "",
  totalParts: 30,
  pagesTotal: 300,
  pagesPerPart: 10,
  coinsReward: 500,
  price: 2990,
};

const INACTIVE_CATEGORIES = ["🎵 Музыка", "🎨 Рисование", "🔢 Математика"];

const STEPS = ["Книга", "Параметры", "Цена", "Публикация"];

/* ─── Step components ──────────────────────────────── */

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                transition: "all 0.2s",
                background: i <= step ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
                color: i <= step ? "#4776e6" : "rgba(255,255,255,0.5)",
                boxShadow: i === step ? "0 0 0 3px rgba(255,255,255,0.25)" : "none",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: i === step ? "#ffffff" : "rgba(255,255,255,0.5)",
              }}
              className="hidden sm:block"
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.2)", marginTop: 4 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            borderRadius: 9999,
            transition: "width 0.3s",
            width: `${(step / (STEPS.length - 1)) * 100}%`,
            background: "rgba(255,255,255,0.85)",
          }}
        />
      </div>
      <p style={{ textAlign: "center", fontSize: 12, marginTop: 8, color: "rgba(255,255,255,0.6)" }}>
        Шаг {step + 1} из {STEPS.length} — {STEPS[step]}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  min,
  max,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label} {required && <span style={{ color: "rgba(255,255,255,0.9)" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="glass-input"
      />
    </div>
  );
}

function NumberStepper({
  label,
  sublabel,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
        {label}
        {sublabel && <span style={{ fontWeight: 400, marginLeft: 4 }}>{sublabel}</span>}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="glass-chip"
          style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0, border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
          className="glass-input"
          style={{ flex: 1, textAlign: "center", fontWeight: 700 }}
        />
        <button
          type="button"
          onClick={() => onChange(value + step)}
          style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0, background: "rgba(255,255,255,0.9)", color: "#4776e6", borderRadius: 9999, border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ─── Step 1: Книга ────────────────────────────────── */
function Step1({
  data,
  update,
  onNext,
}: {
  data: FormData;
  update: (d: Partial<FormData>) => void;
  onNext: () => void;
}) {
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);

  const filtered = BOOK_CATALOG.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  const selectedBook = BOOK_CATALOG.find((b) => b.title === data.bookTitle);

  const selectBook = (book: BookOption) => {
    update({
      bookTitle: book.title,
      bookAuthor: book.author,
      pagesTotal: book.pages,
      ageMin: book.ageMin,
      ageMax: book.ageMax,
      pagesPerPart: Math.ceil(book.pages / data.totalParts),
    });
    setSearch(book.title);
    setShowList(false);
  };

  const valid = data.title.trim() && data.bookTitle.trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <InputField
        label="Название задания"
        value={data.title}
        onChange={(v) => update({ title: v })}
        placeholder="Например: Летнее чтение"
        required
      />

      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Категория
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              padding: "10px 16px",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.9)",
              color: "#4776e6",
              fontWeight: 800,
              fontSize: 14,
              border: "none",
              cursor: "default",
              fontFamily: "inherit",
            }}
          >
            📖 Чтение
          </button>
          {INACTIVE_CATEGORIES.map((label) => (
            <button
              key={label}
              type="button"
              disabled
              className="glass-chip"
              style={{
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                opacity: 0.5,
                cursor: "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "inherit",
              }}
            >
              {label}
              <span style={{ background: "rgba(255,180,0,0.25)", color: "#ffd200", borderRadius: 9999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                скоро
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Book picker */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Выберите книгу <span style={{ color: "rgba(255,255,255,0.9)" }}>*</span>
        </label>

        {selectedBook && !showList ? (
          <div className="glass-sm" style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 16 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#ffffff", margin: 0 }}>
                {selectedBook.title}
              </p>
              <p style={{ fontSize: 12, marginTop: 2, color: "rgba(255,255,255,0.65)", margin: "2px 0 0" }}>
                {selectedBook.author} · {selectedBook.pages} стр · {selectedBook.ageMin}–{selectedBook.ageMax} лет
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSearch(""); setShowList(true); update({ bookTitle: "", bookAuthor: "" }); }}
              className="glass-chip"
              style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", color: "#ffffff", flexShrink: 0, fontFamily: "inherit" }}
            >
              Изменить
            </button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowList(true); }}
              onFocus={() => setShowList(true)}
              placeholder="Поиск по названию или автору..."
              className="glass-input"
            />
            {showList && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  borderRadius: 16,
                  overflow: "hidden",
                  marginTop: 4,
                  maxHeight: 240,
                  overflowY: "auto",
                  background: "rgba(20,10,60,0.97)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {filtered.length === 0 ? (
                  <p style={{ padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                    Ничего не найдено
                  </p>
                ) : (
                  filtered.map((book) => (
                    <button
                      key={book.title}
                      type="button"
                      onClick={() => selectBook(book)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#ffffff", margin: 0 }}>
                        {book.title}
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>
                        {book.author} · {book.pages} стр · {book.ageMin}–{book.ageMax} лет
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Описание <span style={{ fontWeight: 400 }}>(необязательно)</span>
        </label>
        <div style={{ position: "relative" }}>
          <textarea
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Расскажи, о чём это задание..."
            rows={3}
            maxLength={500}
            className="glass-input"
            style={{ resize: "none" }}
          />
          <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            {data.description.length}/500
          </span>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        className="btn-white"
        style={{ color: "#4776e6", marginTop: 4, opacity: valid ? 1 : 0.4 }}
      >
        Далее →
      </button>
    </div>
  );
}

/* ─── Step 2: Параметры ────────────────────────────── */
function Step2({
  data,
  update,
  onNext,
  onBack,
}: {
  data: FormData;
  update: (d: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const autoPPP = data.totalParts > 0 ? Math.ceil(data.pagesTotal / data.totalParts) : 0;

  const handleParts = (v: number) => {
    const d = Math.max(1, Math.min(365, v));
    update({ totalParts: d, pagesPerPart: Math.ceil(data.pagesTotal / d) });
  };

  const handlePages = (v: number) => {
    const p = Math.max(50, Math.min(2000, v));
    update({ pagesTotal: p, pagesPerPart: Math.ceil(p / data.totalParts) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <NumberStepper
        label="Количество частей"
        value={data.totalParts}
        onChange={handleParts}
        step={1}
        min={1}
      />

      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Всего страниц в книге
        </label>
        <input
          type="number"
          value={data.pagesTotal}
          min={50}
          max={2000}
          onChange={(e) => handlePages(Number(e.target.value))}
          className="glass-input"
        />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Страниц в одной части
          </label>
          <span className="glass-chip" style={{ padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
            авто
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="glass-sm" style={{ flex: 1, padding: "14px 16px", borderRadius: 14, textAlign: "center", fontWeight: 700, color: "#ffffff" }}>
            ≈ {autoPPP} стр/часть
          </div>
          <input
            type="number"
            value={data.pagesPerPart}
            onChange={(e) => update({ pagesPerPart: Math.max(1, Number(e.target.value)) })}
            className="glass-input"
            style={{ width: 96, textAlign: "center", fontWeight: 700 }}
            placeholder="Своё"
          />
        </div>
        <p style={{ fontSize: 12, marginTop: 6, color: "rgba(255,255,255,0.55)" }}>
          Авто = {data.pagesTotal} ÷ {data.totalParts} = {autoPPP}. Можно задать своё значение справа.
        </p>
      </div>

      <div className="glass-sm" style={{ padding: 16, borderRadius: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          👀 Предпросмотр
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", margin: 0 }}>
          Книга разбита на{" "}
          <span style={{ fontWeight: 700, color: "#ffffff" }}>{data.totalParts} частей</span>,
          по <span style={{ fontWeight: 700, color: "#ffffff" }}>{data.pagesPerPart} страниц</span> в каждой
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
        <button onClick={onBack} className="btn-glass" style={{ flex: 1 }}>
          ← Назад
        </button>
        <button onClick={onNext} className="btn-white" style={{ flex: 1, color: "#4776e6" }}>
          Далее →
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: Цена ─────────────────────────────────── */
function Step3({
  data,
  update,
  onNext,
  onBack,
}: {
  data: FormData;
  update: (d: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const earning = Math.round(data.price * 0.15);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <NumberStepper
        label="Стоимость задания для родителя"
        sublabel="(₸)"
        value={data.price}
        onChange={(v) => update({ price: Math.max(0, v) })}
        step={500}
        min={0}
      />

      <div style={{ background: "rgba(0,200,100,0.15)", border: "1px solid rgba(100,255,150,0.2)", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", margin: 0 }}>
            Ваш заработок
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>
            15% от стоимости
          </p>
        </div>
        <p style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", margin: 0 }}>
          {earning.toLocaleString("ru-RU")} ₸
        </p>
      </div>

      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Предпросмотр карточки
        </p>
        <ChallengeCard data={data} />
      </div>

      <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
        <button onClick={onBack} className="btn-glass" style={{ flex: 1 }}>
          ← Назад
        </button>
        <button onClick={onNext} className="btn-white" style={{ flex: 1, color: "#4776e6" }}>
          Далее →
        </button>
      </div>
    </div>
  );
}

/* ─── Preview card ─────────────────────────────────── */
function ChallengeCard({ data }: { data: FormData }) {
  const colors = ["#7B61FF", "#1FA463", "#EA8C2D", "#E879A0", "#38BDF8"];
  const colorIdx = data.title ? data.title.charCodeAt(0) % colors.length : 0;
  const bg = colors[colorIdx];

  return (
    <div className="glass-sm" style={{ borderRadius: 20, overflow: "hidden" }}>
      <div
        style={{ height: 96, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 16px", background: bg }}
      >
        <p style={{ color: "#ffffff", fontWeight: 800, textAlign: "center", fontSize: 14, lineHeight: 1.3, margin: 0, WebkitLineClamp: 2, overflow: "hidden", textOverflow: "ellipsis", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          {data.bookTitle || "Название книги"}
        </p>
        {data.bookAuthor && (
          <p style={{ color: "#ffffff", fontSize: 12, marginTop: 4, opacity: 0.8, textAlign: "center", margin: "4px 0 0" }}>
            {data.bookAuthor}
          </p>
        )}
      </div>
      <div style={{ padding: 14 }}>
        <p style={{ fontWeight: 700, color: "#ffffff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.title || "Название задания"}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <span className="glass-chip" style={{ padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#ffffff" }}>
            📚 {data.totalParts} частей
          </span>
          <span style={{ background: "rgba(255,255,255,0.88)", color: "#4776e6", borderRadius: 9999, padding: "3px 8px", fontSize: 12, fontWeight: 800 }}>
            {data.price.toLocaleString("ru-RU")} ₸
          </span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          Возраст {data.ageMin}–{data.ageMax} лет · {data.pagesPerPart} стр/часть
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Публикация ────────────────────────────── */
function Step4({
  data,
  onBack,
  onPublish,
  isLoading,
  isSuccess,
  onGoToBooks,
}: {
  data: FormData;
  onBack: () => void;
  onPublish: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  onGoToBooks: () => void;
}) {
  if (isSuccess) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "24px 0", gap: 20 }}>
        <div className="glass" style={{ width: 80, height: 80, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle2 size={40} color="#aaffcc" strokeWidth={2} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#ffffff", margin: 0 }}>
            Задание отправлено!
          </h2>
          <p style={{ fontSize: 14, marginTop: 8, color: "rgba(255,255,255,0.7)", maxWidth: 280, margin: "8px auto 0", lineHeight: 1.5 }}>
            Задание отправлено на модерацию! Вы получите уведомление после проверки.
          </p>
        </div>
        <button onClick={onGoToBooks} type="button" className="btn-white" style={{ color: "#4776e6", width: "100%" }}>
          К моим заданиям 📋
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Финальный предпросмотр
        </p>
        <ChallengeCard data={data} />
      </div>

      <div className="glass-sm" style={{ padding: 16, borderRadius: 16 }}>
        {[
          ["Категория", data.category === "reading" ? "📖 Чтение" : data.category],
          ["Книга", `${data.bookTitle}${data.bookAuthor ? ` (${data.bookAuthor})` : ""}`],
          ["Возраст", `${data.ageMin}–${data.ageMax} лет`],
          ["Частей в книге", `${data.totalParts}`],
          ["Всего страниц", `${data.pagesTotal}`],
          ["Страниц в части", `${data.pagesPerPart}`],
          ["Цена", `${data.price.toLocaleString("ru-RU")} ₸`],
          ["Ваш заработок (15%)", `${Math.round(data.price * 0.15).toLocaleString("ru-RU")} ₸`],
        ].map(([key, val]) => (
          <div
            key={key}
            style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{key}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", textAlign: "right" }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,160,0,0.15)", border: "1px solid rgba(255,200,0,0.25)", borderRadius: 12, padding: 12, color: "rgba(255,200,100,0.9)", fontSize: 12 }}>
        После отправки задание попадёт на модерацию. Обычно это занимает 1–2 дня.
      </div>

      <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
        <button onClick={onBack} disabled={isLoading} type="button" className="btn-glass" style={{ flex: 1, opacity: isLoading ? 0.4 : 1 }}>
          ← Назад
        </button>
        <button
          onClick={onPublish}
          disabled={isLoading}
          type="button"
          className="btn-white"
          style={{ flex: 1, color: "#4776e6", opacity: isLoading ? 0.6 : 1 }}
        >
          {isLoading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 16, height: 16, border: "2px solid rgba(71,118,230,0.3)", borderTop: "2px solid #4776e6", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              Отправка...
            </span>
          ) : (
            "Опубликовать задание 🚀"
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────── */
function ExpertCreateInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [success, setSuccess] = useState(false);

  useQuery({
    queryKey: ["challenge-edit", editId],
    queryFn: () => apiClient.get(`/challenges/${editId}`).then((r) => r.data),
    enabled: !!editId,
    staleTime: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (data: any) => {
      setForm({
        title: data.title ?? "",
        category: data.category ?? "reading",
        ageMin: data.ageMin ?? 6,
        ageMax: data.ageMax ?? 12,
        bookTitle: data.bookTitle ?? "",
        bookAuthor: data.bookAuthor ?? "",
        description: data.description ?? "",
        totalParts: data.totalParts ?? 14,
        pagesTotal: data.pagesTotal ?? 140,
        pagesPerPart: data.pagesPerPart ?? 10,
        coinsReward: data.coinsReward ?? 5,
        price: data.price ?? 2500,
      });
      return data;
    },
  });

  const update = (patch: Partial<FormData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const publishMutation = useMutation({
    mutationFn: async () => {
      let challengeId = editId;
      if (editId) {
        await challengesApi.update(editId, form);
      } else {
        const created = await challengesApi.create(form);
        challengeId = created.id;
      }
      if (challengeId) {
        await challengesApi.submit(challengeId);
      }
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push("/expert/books"), 2000);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Ошибка публикации");
    },
  });

  return (
    <main style={{ minHeight: "100dvh", padding: "0 0 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "52px 20px 20px" }}>
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
          className="glass-chip"
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          <ChevronLeft size={20} color="#ffffff" strokeWidth={2.5} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: 0 }}>
          {editId ? "Редактировать задание" : "Создать задание"}
        </h1>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Progress */}
        <ProgressBar step={step} />

        {/* Card wrapper */}
        <div className="glass" style={{ padding: 24, borderRadius: 24 }}>
          {step === 0 && (
            <Step1 data={form} update={update} onNext={() => setStep(1)} />
          )}
          {step === 1 && (
            <Step2
              data={form}
              update={update}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <Step3
              data={form}
              update={update}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step4
              data={form}
              onBack={() => setStep(2)}
              onPublish={() => publishMutation.mutate()}
              isLoading={publishMutation.isPending}
              isSuccess={success}
              onGoToBooks={() => router.push("/expert/books")}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function ExpertCreatePage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>Загрузка...</p>
        </main>
      }
    >
      <ExpertCreateInner />
    </Suspense>
  );
}
