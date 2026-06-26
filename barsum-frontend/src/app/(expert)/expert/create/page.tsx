"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
  days: number;
  pagesTotal: number;
  pagesPerDay: number;
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
  days: 30,
  pagesTotal: 300,
  pagesPerDay: 10,
  coinsReward: 500,
  price: 2990,
};

const INACTIVE_CATEGORIES = ["🎵 Музыка", "🎨 Рисование", "🔢 Математика"];

const STEPS = ["Книга", "Параметры", "Цена", "Публикация"];

/* ─── Step components ──────────────────────────────── */

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-all"
              style={{
                background:
                  i < step
                    ? "var(--purple)"
                    : i === step
                      ? "var(--purple)"
                      : "var(--line)",
                color: i <= step ? "#fff" : "var(--muted)",
                boxShadow:
                  i === step ? "0 0 0 3px var(--purple-light)" : "none",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className="text-xs font-semibold hidden sm:block"
              style={{ color: i === step ? "var(--purple)" : "var(--muted)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <div
        className="relative h-1.5 rounded-full mt-2"
        style={{ background: "var(--line)" }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${(step / (STEPS.length - 1)) * 100}%`,
            background: "var(--purple)",
          }}
        />
      </div>
      <p className="text-xs text-center mt-2" style={{ color: "var(--muted)" }}>
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
      <label
        className="block text-xs font-semibold mb-1.5"
        style={{ color: "var(--muted)" }}
      >
        {label} {required && <span style={{ color: "var(--purple)" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2 focus:ring-purple-300"
        style={{
          borderColor: "var(--line)",
          background: "var(--soft)",
          color: "var(--ink)",
        }}
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
      <label
        className="block text-xs font-semibold mb-1.5"
        style={{ color: "var(--muted)" }}
      >
        {label}
        {sublabel && <span className="ml-1 font-normal">{sublabel}</span>}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-11 h-11 rounded-xl text-xl font-bold transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: "var(--lav)", color: "var(--purple)" }}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
          className="flex-1 text-center px-4 py-3 rounded-xl border text-base font-bold outline-none focus:ring-2 focus:ring-purple-300"
          style={{
            borderColor: "var(--line)",
            background: "var(--soft)",
            color: "var(--ink)",
          }}
        />
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="w-11 h-11 rounded-xl text-xl font-bold transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: "var(--purple)", color: "#fff" }}
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
      pagesPerDay: Math.ceil(book.pages / data.days),
    });
    setSearch(book.title);
    setShowList(false);
  };

  const valid = data.title.trim() && data.bookTitle.trim();

  return (
    <div className="space-y-4">
      <InputField
        label="Название задания"
        value={data.title}
        onChange={(v) => update({ title: v })}
        placeholder="Например: Летнее чтение"
        required
      />

      <div>
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: "var(--muted)" }}
        >
          Категория
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              background: "var(--purple)",
              color: "#fff",
              boxShadow: "0 3px 0 var(--purple-deep)",
              cursor: "default",
            }}
          >
            📖 Чтение
          </button>
          {INACTIVE_CATEGORIES.map((label) => (
            <button
              key={label}
              type="button"
              disabled
              className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5"
              style={{
                background: "var(--line)",
                color: "var(--muted)",
                cursor: "not-allowed",
              }}
            >
              {label}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: "#fef3c7", color: "#92400e" }}
              >
                скоро
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Book picker */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: "var(--muted)" }}
        >
          Выберите книгу <span style={{ color: "var(--purple)" }}>*</span>
        </label>

        {selectedBook && !showList ? (
          <div
            className="rounded-xl p-4 flex items-center justify-between gap-3"
            style={{
              background: "var(--lav)",
              border: "1.5px solid var(--purple-light)",
            }}
          >
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--ink)" }}>
                {selectedBook.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {selectedBook.author} · {selectedBook.pages} стр · {selectedBook.ageMin}–{selectedBook.ageMax} лет
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSearch(""); setShowList(true); update({ bookTitle: "", bookAuthor: "" }); }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0"
              style={{ background: "var(--white)", color: "var(--purple)" }}
            >
              Изменить
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowList(true); }}
              onFocus={() => setShowList(true)}
              placeholder="Поиск по названию или автору..."
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2 focus:ring-purple-300"
              style={{
                borderColor: "var(--line)",
                background: "var(--soft)",
                color: "var(--ink)",
              }}
            />
            {showList && (
              <div
                className="absolute top-full left-0 right-0 z-20 rounded-xl overflow-y-auto mt-1 border"
                style={{
                  background: "var(--white)",
                  borderColor: "var(--line)",
                  maxHeight: 240,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
              >
                {filtered.length === 0 ? (
                  <p className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                    Ничего не найдено
                  </p>
                ) : (
                  filtered.map((book) => (
                    <button
                      key={book.title}
                      type="button"
                      onClick={() => selectBook(book)}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b last:border-0"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                        {book.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
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
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: "var(--muted)" }}
        >
          Описание <span className="font-normal">(необязательно)</span>
        </label>
        <div className="relative">
          <textarea
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Расскажи, о чём это задание..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            style={{
              borderColor: "var(--line)",
              background: "var(--soft)",
              color: "var(--ink)",
            }}
          />
          <span
            className="absolute bottom-2 right-3 text-xs"
            style={{ color: "var(--muted)" }}
          >
            {data.description.length}/500
          </span>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        className="w-full py-4 rounded-2xl font-bold text-white transition-opacity disabled:opacity-40"
        style={{
          background: "var(--purple)",
          boxShadow: "0 6px 0 var(--purple-deep)",
        }}
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
  const autoPPD = data.days > 0 ? Math.ceil(data.pagesTotal / data.days) : 0;

  const handleDays = (v: number) => {
    const d = Math.max(7, Math.min(365, v));
    update({ days: d, pagesPerDay: Math.ceil(data.pagesTotal / d) });
  };

  const handlePages = (v: number) => {
    const p = Math.max(50, Math.min(2000, v));
    update({ pagesTotal: p, pagesPerDay: Math.ceil(p / data.days) });
  };

  return (
    <div className="space-y-5">
      <NumberStepper
        label="Дней на задание"
        value={data.days}
        onChange={handleDays}
        step={1}
        min={7}
      />

      <div>
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: "var(--muted)" }}
        >
          Всего страниц в книге
        </label>
        <input
          type="number"
          value={data.pagesTotal}
          min={50}
          max={2000}
          onChange={(e) => handlePages(Number(e.target.value))}
          className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2 focus:ring-purple-300"
          style={{
            borderColor: "var(--line)",
            background: "var(--soft)",
            color: "var(--ink)",
          }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            className="text-xs font-semibold"
            style={{ color: "var(--muted)" }}
          >
            Страниц в день
          </label>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "var(--lav)", color: "var(--purple)" }}
          >
            авто
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 px-4 py-3 rounded-xl border text-base font-bold text-center"
            style={{
              borderColor: "var(--line)",
              background: "var(--lav)",
              color: "var(--purple)",
            }}
          >
            ≈ {autoPPD} страниц/день
          </div>
          <input
            type="number"
            value={data.pagesPerDay}
            onChange={(e) =>
              update({ pagesPerDay: Math.max(1, Number(e.target.value)) })
            }
            className="w-24 text-center px-3 py-3 rounded-xl border text-base font-bold outline-none"
            style={{
              borderColor: "var(--line)",
              background: "var(--soft)",
              color: "var(--ink)",
            }}
            placeholder="Своё"
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
          Авто = {data.pagesTotal} ÷ {data.days} = {autoPPD}. Можно задать своё
          значение справа.
        </p>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--lav)",
          border: "1.5px solid var(--purple-light)",
        }}
      >
        <p
          className="text-xs font-semibold mb-1"
          style={{ color: "var(--purple)" }}
        >
          👀 Предпросмотр
        </p>
        <p className="text-sm" style={{ color: "var(--ink)" }}>
          Ребёнок читает{" "}
          <span className="font-bold">{data.pagesPerDay} страниц</span> в день
          на протяжении <span className="font-bold">{data.days} дней</span>
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl font-bold transition-opacity hover:opacity-80"
          style={{ background: "var(--line)", color: "var(--ink)" }}
        >
          ← Назад
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-4 rounded-2xl font-bold text-white"
          style={{
            background: "var(--purple)",
            boxShadow: "0 6px 0 var(--purple-deep)",
          }}
        >
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
    <div className="space-y-5">
      <NumberStepper
        label="Стоимость задания для родителя"
        sublabel="(₸)"
        value={data.price}
        onChange={(v) => update({ price: Math.max(0, v) })}
        step={500}
        min={0}
      />

      {/* Earning info */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: "var(--green-light)",
          border: "1px solid var(--green-light)",
        }}
      >
        <div>
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--green-deep)" }}
          >
            Ваш заработок
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--green)" }}>
            15% от стоимости
          </p>
        </div>
        <p
          className="text-2xl font-extrabold"
          style={{ color: "var(--green-deep)" }}
        >
          {earning.toLocaleString("ru-RU")} ₸
        </p>
      </div>

      {/* Preview card */}
      <div>
        <p
          className="text-xs font-semibold mb-2"
          style={{ color: "var(--muted)" }}
        >
          Предпросмотр карточки
        </p>
        <ChallengeCard data={data} />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl font-bold transition-opacity hover:opacity-80"
          style={{ background: "var(--line)", color: "var(--ink)" }}
        >
          ← Назад
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-4 rounded-2xl font-bold text-white"
          style={{
            background: "var(--purple)",
            boxShadow: "0 6px 0 var(--purple-deep)",
          }}
        >
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--white)", boxShadow: "var(--shadow-md)" }}
    >
      <div
        className="h-24 flex flex-col items-center justify-center px-4 py-3"
        style={{ background: bg }}
      >
        <p
          className="text-white font-extrabold text-center text-sm leading-tight line-clamp-2"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
        >
          {data.bookTitle || "Название книги"}
        </p>
        {data.bookAuthor && (
          <p className="text-white text-xs mt-1 opacity-80 text-center line-clamp-1">
            {data.bookAuthor}
          </p>
        )}
      </div>
      <div className="p-4">
        <p className="font-bold truncate" style={{ color: "var(--ink)" }}>
          {data.title || "Название задания"}
        </p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: "var(--purple-light)", color: "var(--purple)" }}
          >
            📅 {data.days} дней
          </span>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: "var(--green-light)", color: "var(--green-deep)" }}
          >
            {data.price.toLocaleString("ru-RU")} ₸
          </span>
        </div>
        <div className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
          Возраст {data.ageMin}–{data.ageMax} лет · {data.pagesPerDay} стр/день
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
      <div className="flex flex-col items-center text-center py-6 space-y-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: "var(--green-light)",
            boxShadow: "0 4px 0 #bbf7d0",
          }}
        >
          ✅
        </div>
        <div>
          <h2
            className="text-xl font-extrabold"
            style={{ color: "var(--ink)" }}
          >
            Задание отправлено!
          </h2>
          <p
            className="text-sm mt-2 max-w-xs mx-auto leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            Задание отправлено на модерацию! Вы получите уведомление после
            проверки.
          </p>
        </div>
        <button
          onClick={onGoToBooks}
          type="button"
          className="w-full py-4 rounded-2xl font-bold text-white"
          style={{
            background: "var(--green)",
            boxShadow: "0 4px 0 var(--green-deep)",
          }}
        >
          К моим заданиям 📋
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p
          className="text-xs font-semibold mb-3"
          style={{ color: "var(--muted)" }}
        >
          Финальный предпросмотр
        </p>
        <ChallengeCard data={data} />
      </div>

      {/* Summary table */}
      <div
        className="rounded-2xl p-4 space-y-2.5"
        style={{ background: "var(--white)", boxShadow: "var(--shadow-sm)" }}
      >
        {[
          [
            "Категория",
            data.category === "reading" ? "📖 Чтение" : data.category,
          ],
          [
            "Книга",
            `${data.bookTitle}${data.bookAuthor ? ` (${data.bookAuthor})` : ""}`,
          ],
          ["Возраст", `${data.ageMin}–${data.ageMax} лет`],
          ["Продолжительность", `${data.days} дней`],
          ["Всего страниц", `${data.pagesTotal}`],
          ["Страниц в день", `${data.pagesPerDay}`],
          ["Цена", `${data.price.toLocaleString("ru-RU")} ₸`],
          [
            "Ваш заработок (15%)",
            `${Math.round(data.price * 0.15).toLocaleString("ru-RU")} ₸`,
          ],
        ].map(([key, val]) => (
          <div
            key={key}
            className="flex justify-between gap-2 py-0.5 border-b last:border-0"
            style={{ borderColor: "var(--line)" }}
          >
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {key}
            </span>
            <span
              className="text-xs font-semibold text-right"
              style={{ color: "var(--ink)" }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-3 text-xs"
        style={{
          background: "var(--orange-light)",
          color: "var(--orange-deep)",
        }}
      >
        После отправки задание попадёт на модерацию. Обычно это занимает 1–2
        дня.
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={isLoading}
          type="button"
          className="flex-1 py-4 rounded-2xl font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--line)", color: "var(--ink)" }}
        >
          ← Назад
        </button>
        <button
          onClick={onPublish}
          disabled={isLoading}
          type="button"
          className="flex-1 py-4 rounded-2xl font-bold text-white transition-opacity disabled:opacity-60"
          style={{
            background: "var(--purple)",
            boxShadow: "0 6px 0 var(--purple-deep)",
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
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
        days: data.days ?? 14,
        pagesTotal: data.pagesTotal ?? 140,
        pagesPerDay: data.pagesPerDay ?? 10,
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
    <main
      className="min-h-screen p-6 max-w-md mx-auto"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{
            background: "var(--white)",
            boxShadow: "var(--shadow-sm)",
            color: "var(--ink)",
          }}
        >
          ←
        </button>
        <h1 className="text-xl font-extrabold" style={{ color: "var(--ink)" }}>
          {editId ? "Редактировать задание" : "Создать задание"}
        </h1>
      </div>

      {/* Progress */}
      <ProgressBar step={step} />

      {/* Card wrapper */}
      <div
        className="rounded-3xl p-6"
        style={{ background: "var(--white)", boxShadow: "var(--shadow-lg)" }}
      >
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
    </main>
  );
}

export default function ExpertCreatePage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--background)" }}
        >
          <p style={{ color: "var(--muted)" }}>Загрузка...</p>
        </main>
      }
    >
      <ExpertCreateInner />
    </Suspense>
  );
}
