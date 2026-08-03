"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { childrenApi } from "@/lib/api/children";
import { dreamsApi } from "@/lib/api/dreams";
import { MascotWave } from "@/components/MascotWave";
import { CoinIcon } from "@/components/CoinIcon";
import { useAuthStore } from "@/stores/auth-store";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    hello: "Привет, {name}!",
    helloSub: "Это Barsum. Тут ты читаешь книги, получаешь монеты и копишь на свою мечту.",
    start: "Погнали! 🚀",
    dreamTitle: "О чём ты мечтаешь?",
    dreamSub: "Напиши своими словами — родители помогут это осуществить",
    photo: "Сфотографируй свою мечту",
    photoHint: "или выбери из галереи",
    changePhoto: "Изменить фото",
    label: "Моя мечта",
    placeholder: "Напиши, о чём мечтаешь",
    parentWillApprove: "Родитель установит стоимость и одобрит мечту 🌟",
    send: "✨ Отправить родителю",
    sending: "Отправляем...",
    skip: "Пропустить",
    error: "Не получилось отправить мечту",
    howTitle: "Как получить монеты",
    step1: "Читай книги вслух",
    step1sub: "Эксперт проверит запись",
    step2: "Получай монеты",
    step2sub: "За каждую прочитанную часть",
    step3: "Копи на мечту",
    step3sub: "Монеты складываются в твою цель",
    dreamSent: "Мечта «{name}» отправлена родителю 💌",
    chooseBook: "Выбрать книгу 📚",
    toHome: "На главную",
  },
  kk: {
    hello: "Сәлем, {name}!",
    helloSub: "Бұл — Barsum. Мұнда кітап оқисың, монета жинайсың және арманыңа жетесің.",
    start: "Кеттік! 🚀",
    dreamTitle: "Сен не туралы армандайсың?",
    dreamSub: "Өз сөзіңмен жаз — ата-анаң оны орындауға көмектеседі",
    photo: "Арманыңды суретке түсір",
    photoHint: "немесе галереядан таңда",
    changePhoto: "Фотоны ауыстыру",
    label: "Менің арманым",
    placeholder: "Не туралы армандайтыныңды жаз",
    parentWillApprove: "Ата-анаң құнын белгілеп, арманды мақұлдайды 🌟",
    send: "✨ Ата-анаға жіберу",
    sending: "Жіберілуде...",
    skip: "Өткізіп жіберу",
    error: "Арманды жіберу мүмкін болмады",
    howTitle: "Монетаны қалай аласың",
    step1: "Кітапты дауыстап оқы",
    step1sub: "Сарапшы жазбаңды тексереді",
    step2: "Монета ал",
    step2sub: "Оқыған әр бөлім үшін",
    step3: "Арманыңа жина",
    step3sub: "Монеталар мақсатыңа жиналады",
    dreamSent: "«{name}» арманы ата-анаға жіберілді 💌",
    chooseBook: "Кітап таңдау 📚",
    toHome: "Басты бетке",
  },
};

/** Одна карточка-объяснение на последнем шаге. */
function HowStep({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="glass" style={{ padding: 14, display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          flexShrink: 0,
          background: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: "#ffffff" }}>{title}</p>
        <p style={{ margin: "3px 0 0", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{subtitle}</p>
      </div>
    </div>
  );
}

export default function ChildOnboardingPage() {
  const t = useT(dict);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Флаг ставим на сервере (не в localStorage): иначе на другом устройстве
  // или в переустановленной PWA онбординг начнётся заново.
  const finish = async (next: () => void) => {
    try {
      const child = await childrenApi.markOnboarded();
      if (child) setUser(child);
    } catch {
      // Не критично: даже если флаг не записался, не держим ребёнка на экране.
    }
    next();
  };

  const createDream = useMutation({
    mutationFn: async () => {
      const created = await dreamsApi.create({ name: name.trim() });
      if (photoFile && created?.id) {
        // Фото необязательно — если не загрузилось, мечта всё равно создана.
        await dreamsApi.uploadPhoto(created.id, photoFile).catch(() => undefined);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dream-my-all"] });
      queryClient.invalidateQueries({ queryKey: ["dream-my"] });
      toast.success(t("dreamSent", { name: name.trim() }));
      setStep(2);
    },
    onError: () => toast.error(t("error")),
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Индикатор шагов */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 9999,
                background: i <= step ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                transition: "all 0.25s",
              }}
            />
          ))}
        </div>

        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            <MascotWave size={180} />
            <h1 style={{ margin: "8px 0 8px", fontSize: 28, fontWeight: 900, color: "#ffffff" }}>
              {t("hello", { name: user?.name?.split(" ")[0] ?? "" })}
            </h1>
            <p style={{ margin: "0 0 28px", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              {t("helloSub")}
            </p>
            <button onClick={() => setStep(1)} className="btn-white" style={{ color: "#4776e6" }}>
              {t("start")}
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 6 }}>💫</div>
              <h1 style={{ margin: "0 0 6px", fontSize: 25, fontWeight: 900, color: "#ffffff" }}>{t("dreamTitle")}</h1>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{t("dreamSub")}</p>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="glass-sm"
              style={{
                borderRadius: 20,
                overflow: "hidden",
                height: 160,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                border: "none",
                position: "relative",
                marginBottom: 16,
              }}
            >
              {photoPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                    <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 14, background: "rgba(0,0,0,0.4)", padding: "6px 14px", borderRadius: 9999 }}>
                      {t("changePhoto")}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Camera size={36} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#ffffff" }}>{t("photo")}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t("photoHint")}</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("label")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("placeholder")}
              className="glass-input"
              maxLength={60}
              autoFocus
            />

            <p style={{ margin: "12px 0", fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.55)" }}>
              {t("parentWillApprove")}
            </p>

            <button
              onClick={() => createDream.mutate()}
              disabled={!name.trim() || createDream.isPending}
              className="btn-white"
              style={{ color: "#4776e6" }}
            >
              {createDream.isPending ? t("sending") : t("send")}
            </button>

            <button
              onClick={() => setStep(2)}
              style={{ marginTop: 12, width: "100%", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)" }}
            >
              {t("skip")}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                <Sparkles size={40} color="#ffd200" strokeWidth={2} />
              </div>
              <h1 style={{ margin: "0 0 6px", fontSize: 25, fontWeight: 900, color: "#ffffff" }}>{t("howTitle")}</h1>
            </div>

            <HowStep icon="📖" title={t("step1")} subtitle={t("step1sub")} />
            <HowStep icon={<CoinIcon size={22} />} title={t("step2")} subtitle={t("step2sub")} />
            <HowStep icon="💫" title={t("step3")} subtitle={t("step3sub")} />

            <button
              onClick={() => finish(() => router.replace("/child/books"))}
              className="btn-white"
              style={{ marginTop: 20, color: "#4776e6" }}
            >
              {t("chooseBook")}
            </button>
            <button
              onClick={() => finish(() => router.replace("/child/home"))}
              style={{ marginTop: 12, width: "100%", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.6)" }}
            >
              {t("toHome")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
