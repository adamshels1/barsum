// Генерация shareable-картинки «Я участвую в создании книги» на canvas
// (обложка книги + баннер + barsum.app) и запуск нативного шэринга в соцсети.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// object-fit: cover для картинки в квадрат размером S.
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, S: number) {
  const scale = Math.max(S / img.width, S / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Собирает квадратную карточку (1080×1080): обложка + затемнение + баннер с
// подписью участия + «barsum.app». Возвращает PNG-Blob.
export async function buildParticipationCard(coverUrl: string, caption: string): Promise<Blob> {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // Фон на случай, если обложка не загрузится.
  ctx.fillStyle = "#2b2166";
  ctx.fillRect(0, 0, S, S);

  try {
    const img = await loadImage(coverUrl);
    drawCover(ctx, img, S);
  } catch {
    /* оставляем однотонный фон */
  }

  try {
    await (document as any).fonts?.ready;
  } catch {
    /* игнорируем */
  }

  // Затемнение снизу для читабельности баннера.
  const grad = ctx.createLinearGradient(0, S * 0.4, 0, S);
  grad.addColorStop(0, "rgba(12,10,40,0)");
  grad.addColorStop(1, "rgba(12,10,40,0.9)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, S * 0.4, S, S * 0.6);

  // Баннер с подписью участия.
  const pad = 56;
  const bannerW = S - pad * 2;
  ctx.font = '900 56px Nunito, "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapText(ctx, caption, bannerW - 120);
  const lineH = 70;
  const linkH = 64;
  const innerPad = 44;
  const bannerH = lines.length * lineH + linkH + innerPad * 2;
  const bannerX = pad;
  const bannerY = S - pad - bannerH;

  const bg = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY + bannerH);
  bg.addColorStop(0, "#4776e6");
  bg.addColorStop(1, "#7c5cff");
  roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 40);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.stroke();

  // Подпись (белая, жирная).
  ctx.fillStyle = "#ffffff";
  ctx.font = '900 56px Nunito, "Segoe UI", system-ui, sans-serif';
  let ty = bannerY + innerPad + lineH / 2;
  for (const line of lines) {
    ctx.fillText(line, S / 2, ty);
    ty += lineH;
  }

  // barsum.app — золотым.
  ctx.font = '800 48px Nunito, "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = "#ffd200";
  ctx.fillText("🚀 barsum.app", S / 2, ty + linkH / 2 - 4);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png", 0.92),
  );
}

export interface ShareResult {
  method: "share" | "share-url" | "download";
}

// Шэринг карточки: нативный share-лист (Instagram/TikTok/Stories) с файлом-картинкой,
// иначе — без файла (только текст+ссылка), иначе — скачивание картинки.
export async function shareParticipation(opts: {
  coverUrl: string;
  caption: string;
  shareText: string;
}): Promise<ShareResult> {
  const blob = await buildParticipationCard(opts.coverUrl, opts.caption);
  const file = new File([blob], "barsum-book.png", { type: "image/png" });
  const url = "https://barsum.app";

  const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    await nav.share({ files: [file], text: opts.shareText, url });
    return { method: "share" };
  }
  if (navigator.share) {
    await navigator.share({ title: "Barsum", text: opts.shareText, url });
    return { method: "share-url" };
  }
  // Десктоп-фолбэк: скачиваем картинку.
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "barsum-book.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { method: "download" };
}
