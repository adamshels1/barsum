export interface RewardTemplate {
  image: string;
  name: string;
  cost: number;
  type: "snack" | "time" | "experience";
}

// Картинки — уже существующие ассеты /public/rewards, использованные в реальных
// наградах parent@test.kz (see rewards/page.tsx). Даём тот же визуал по умолчанию.
export const REWARD_TEMPLATES: RewardTemplate[] = [
  { image: "/rewards/morozhenoe.png", name: "Мороженое", cost: 200, type: "snack" },
  { image: "/rewards/pizza.png", name: "Пицца", cost: 1500, type: "snack" },
  { image: "/rewards/burger.png", name: "Бургер", cost: 600, type: "snack" },
  { image: "/rewards/ponchik.png", name: "Пончик", cost: 250, type: "snack" },
  { image: "/rewards/boba-tea.png", name: "Милк ти", cost: 400, type: "snack" },
  { image: "/rewards/game-time.png", name: "Игровая приставка (1 час)", cost: 500, type: "time" },
  { image: "/rewards/phone-time.png", name: "+30 минут телефона", cost: 350, type: "time" },
  { image: "/rewards/sleep-later.png", name: "Поспать подольше", cost: 300, type: "time" },
  { image: "/rewards/stay-up-later.png", name: "Лечь спать позже", cost: 500, type: "time" },
  { image: "/rewards/kino.png", name: "Кино", cost: 3000, type: "experience" },
  { image: "/rewards/park-attractions.png", name: "Парк аттракционов", cost: 3000, type: "experience" },
  { image: "/rewards/aquapark.png", name: "Аквапарк", cost: 3500, type: "experience" },
  { image: "/rewards/igrushka.png", name: "Мягкая игрушка", cost: 2500, type: "experience" },
  { image: "/rewards/konstruktor.png", name: "Конструктор", cost: 3500, type: "experience" },
  { image: "/rewards/naushniki.png", name: "Наушники", cost: 4000, type: "experience" },
  { image: "/rewards/skateboard.png", name: "Скейтборд", cost: 5000, type: "experience" },
];
