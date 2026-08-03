"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { MascotWave } from "@/components/MascotWave";
import { useAuthStore } from "@/stores/auth-store";
import { useT, type Dict } from "@/i18n/useT";

const dict: Dict = {
  ru: {
    entering: "Заходим...",
    hi: "Привет!",
    failedTitle: "Ссылка не подошла",
    failedHint: "Возможно, она устарела. Попроси родителя прислать новую — или войди по логину.",
    toLogin: "Войти по логину",
  },
  kk: {
    entering: "Кіріп жатырмыз...",
    hi: "Сәлем!",
    failedTitle: "Сілтеме жарамады",
    failedHint: "Мүмкін, оның мерзімі өтіп кеткен. Ата-анаңнан жаңасын сұра — немесе логинмен кір.",
    toLogin: "Логинмен кіру",
  },
};

const BG = "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)";

/**
 * Вход ребёнка по ссылке от родителя: /join/<token>.
 * Ручной ввод логина и пароля — главная точка потери детей на входе,
 * поэтому основной путь теперь один тап из мессенджера.
 */
export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const t = useT(dict);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [failed, setFailed] = useState(false);
  // В dev React монтирует эффекты дважды — второй вызов не нужен.
  const started = useRef(false);

  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    authApi
      .childLinkLogin(token)
      .then((res) => {
        if (!res?.access_token) throw new Error("no token");
        setAuth(res.access_token, "child", res.child);
        router.replace(res.child?.onboardedAt ? "/child/home" : "/child/onboarding");
      })
      .catch(() => setFailed(true));
  }, [token, setAuth, router]);

  return (
    <main style={{ minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
        <MascotWave size={160} animate={!failed} />
        {failed ? (
          <>
            <h1 style={{ margin: "8px 0 8px", fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{t("failedTitle")}</h1>
            <p style={{ margin: "0 0 24px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              {t("failedHint")}
            </p>
            <button onClick={() => router.replace("/auth/child")} className="btn-white" style={{ color: "#4776e6" }}>
              {t("toLogin")}
            </button>
          </>
        ) : (
          <>
            <h1 style={{ margin: "8px 0 6px", fontSize: 26, fontWeight: 900, color: "#ffffff" }}>{t("hi")}</h1>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{t("entering")}</p>
          </>
        )}
      </div>
    </main>
  );
}
