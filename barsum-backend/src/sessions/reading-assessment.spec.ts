import { assessReading, readingAdvice } from './reading-assessment';

describe('assessReading', () => {
  const ref = 'Некрасивый серый утёнок не отставал от других уток на птичьем дворе';

  it('идеальное чтение → высокая точность и полнота', () => {
    const r = assessReading(ref, ref, 6);
    expect(r.accuracy).toBe(100);
    expect(r.completeness).toBe(100);
    expect(r.errorWords).toHaveLength(0);
    expect(r.score).toBe(10);
    expect(r.speedWpm).toBeGreaterThan(0);
  });

  it('ё/е и пунктуация не влияют на совпадение', () => {
    const r = assessReading('утёнок, гулял!', 'утенок гулял', 6);
    expect(r.accuracy).toBe(100);
  });

  it('прочитана половина → полнота ~50%, точность высокая', () => {
    const r = assessReading(ref, 'Некрасивый серый утёнок не отставал', 4);
    expect(r.completeness).toBeLessThan(70);
    expect(r.completeness).toBeGreaterThan(30);
    expect(r.accuracy).toBe(100);
  });

  it('ошибки в словах попадают в errorWords', () => {
    const r = assessReading('серый утёнок гулял по двору', 'красный кот гулял по двору', 5);
    expect(r.errorWords.length).toBeGreaterThan(0);
    expect(r.accuracy).toBeLessThan(100);
  });

  it('пустая речь → нулевые метрики', () => {
    const r = assessReading(ref, '', 5);
    expect(r.score).toBe(0);
    expect(r.accuracy).toBe(0);
  });

  it('без длительности скорость null', () => {
    const r = assessReading(ref, ref);
    expect(r.speedWpm).toBeNull();
  });
});

describe('readingAdvice', () => {
  it('высокий балл → похвала', () => {
    expect(readingAdvice({ accuracy: 95, completeness: 95, speedWpm: 100, errorWords: [], score: 9 }))
      .toMatch(/Отличное/);
  });
  it('низкая точность → совет тренировать', () => {
    expect(readingAdvice({ accuracy: 50, completeness: 80, speedWpm: 90, errorWords: ['a'], score: 4 }))
      .toMatch(/ошибок/);
  });
});
