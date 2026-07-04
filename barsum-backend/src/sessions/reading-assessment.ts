// Оценка чтения вслух: сравниваем эталонный текст части с транскриптом того,
// что произнёс ребёнок. Метрики считаются детерминированно (не «на глаз» AI):
//   accuracy      — % верно прочитанных слов в пределах того, что ребёнок дочитал
//   completeness  — % эталона, которого он дошёл
//   speedWpm      — слов в минуту (нужна длительность записи)
//   errorWords    — слова, где споткнулся (пропустил/исказил)
//   score         — итог 0–10

export interface ReadingAssessment {
  accuracy: number;
  completeness: number;
  speedWpm: number | null;
  errorWords: string[];
  score: number;
}

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// LCS с восстановлением: индексы токенов эталона, совпавших по порядку с речью.
function lcsMatchedRefIndices(ref: string[], hyp: string[]): number[] {
  const n = ref.length;
  const m = hyp.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = ref[i - 1] === hyp[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const idx: number[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (ref[i - 1] === hyp[j - 1]) { idx.push(i - 1); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return idx.reverse();
}

export function assessReading(
  referenceText: string,
  spokenText: string,
  durationSec?: number | null,
): ReadingAssessment {
  const ref = tokenize(referenceText);
  const hyp = tokenize(spokenText);
  const speedWpm = durationSec && durationSec > 0 ? Math.round(hyp.length / (durationSec / 60)) : null;

  if (ref.length === 0 || hyp.length === 0) {
    return { accuracy: 0, completeness: 0, speedWpm, errorWords: [], score: 0 };
  }

  const matched = lcsMatchedRefIndices(ref, hyp);
  const correct = matched.length;
  const lastRefIdx = correct > 0 ? matched[matched.length - 1] : -1;
  const attempted = lastRefIdx + 1; // до какого места эталона дошёл

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const completeness = Math.round((attempted / ref.length) * 100);

  const matchedSet = new Set(matched);
  const errorWords: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < attempted; i++) {
    if (matchedSet.has(i)) continue;
    const w = ref[i];
    if (w.length >= 4 && !seen.has(w)) { seen.add(w); errorWords.push(w); }
    if (errorWords.length >= 5) break;
  }

  const score = Math.max(0, Math.min(10, Math.round((accuracy * 0.8 + completeness * 0.2) / 10)));
  return { accuracy, completeness, speedWpm, errorWords, score };
}

// Короткая подсказка родителю, собранная из метрик (без обращения к AI).
export function readingAdvice(a: ReadingAssessment): string {
  if (a.score >= 8) return 'Отличное чтение — чётко и почти без ошибок!';
  if (a.accuracy < 70) return 'Много ошибок в словах — стоит потренировать чтение вслух.';
  if (a.completeness < 40) return 'Прочитана только часть — в следующий раз дочитай до конца.';
  if (a.speedWpm != null && a.speedWpm < 60) return 'Читает медленно — с практикой будет быстрее.';
  return 'Хорошо читает, но есть над чем поработать.';
}
