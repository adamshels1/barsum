"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

declare global {
  interface Window {
    ym?: (
      id: number,
      action: string,
      ...args: unknown[]
    ) => void;
  }
}

function RouteTracker({ id }: { id: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.ym !== "function") return;
    const query = searchParams.toString();
    const url = pathname + (query ? `?${query}` : "");
    window.ym(id, "hit", url);
  }, [id, pathname, searchParams]);

  return null;
}

export function YandexMetrica() {
  if (!YM_ID) return null;

  const id = Number(YM_ID);
  if (!Number.isFinite(id)) return null;

  return (
    <>
      <Script id="yandex-metrica" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${id}", "ym");
          ym(${id}, "init", {
            ssr:true,
            webvisor:true,
            clickmap:true,
            ecommerce:"dataLayer",
            accurateTrackBounce:true,
            trackLinks:true,
            defer:true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
      <Suspense fallback={null}>
        <RouteTracker id={id} />
      </Suspense>
    </>
  );
}
