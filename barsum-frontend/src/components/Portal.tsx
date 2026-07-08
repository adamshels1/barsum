"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Рендерит содержимое поверх всего в document.body, минуя stacking-context
// родителя (обёртка контента в layout имеет zIndex:1, из-за чего модалка иначе
// оказывается под нижним меню).
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
