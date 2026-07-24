"use client";

import { useState } from "react";

type Lang = "ru" | "kk" | "en";
type Section = { h: string; p: string[] };
type Doc = {
  title: string;
  updated: string;
  intro: string[];
  sections: Section[];
  backHome: string;
};

// Контактная почта и оператор. Замените при необходимости.
const CONTACT_EMAIL = "support@barsum.app";
const SITE = "barsum.app";

const DOCS: Record<Lang, Doc> = {
  ru: {
    title: "Политика конфиденциальности",
    updated: "Дата вступления в силу: 24 июля 2026 г.",
    backHome: "← На главную",
    intro: [
      `Настоящая Политика конфиденциальности описывает, как приложение и сервис Barsum, оператором которого является ТОО «Project Barsum» («Barsum», «мы»), собирает, использует и защищает персональные данные пользователей приложения и сайта ${SITE}.`,
      `Barsum — образовательная платформа для детей: дети читают книги вслух, выполняют задания и участвуют в совместном сочинении книг, а родители и эксперты сопровождают этот процесс. Пользуясь Barsum, вы соглашаетесь с настоящей Политикой.`,
      `По всем вопросам о данных пишите на ${CONTACT_EMAIL}.`,
    ],
    sections: [
      {
        h: "1. Какие данные мы собираем",
        p: [
          "Данные родителя и эксперта: имя, адрес электронной почты и/или номер телефона, пароль (хранится в зашифрованном виде).",
          "Данные ребёнка: логин, имя или псевдоним, возраст либо возрастная группа. Аккаунт ребёнка создаётся и управляется родителем или законным представителем.",
          "Активность и прогресс: прочитанные книги, выполненные задания, начисленные монеты, достижения, «мечты» и запросы.",
          "Голосовые записи: аудиозаписи чтения вслух и продолжений для совместных книг, а также их текстовые расшифровки и оценки.",
          "Платёжные данные: сведения о покупках. Реквизиты карты обрабатываются нашим платёжным провайдером; мы не храним и не видим полные данные карты.",
          "Технические данные: тип устройства и браузера, идентификаторы для push-уведомлений, данные об использовании, а также cookies и локальное хранилище (язык интерфейса, сессия входа).",
        ],
      },
      {
        h: "2. Данные детей",
        p: [
          "Barsum предназначен для использования детьми под контролем родителей. Аккаунт ребёнка создаёт родитель или законный представитель, который даёт согласие на обработку данных ребёнка.",
          "Мы не собираем осознанно данные детей напрямую без участия родителя. Родитель может просматривать, изменять и удалять данные ребёнка, а также удалить его аккаунт в любой момент.",
          "Голосовые записи ребёнка используются исключительно для работы сервиса (проверка чтения, оценка, соавторство) и не применяются для рекламы.",
        ],
      },
      {
        h: "3. Как мы используем данные",
        p: [
          "Предоставление и работа сервиса: доступ к книгам и заданиям, ведение прогресса, монеты и вознаграждения.",
          "Проверка чтения и пересказа: голосовые записи расшифровываются и оцениваются с помощью технологий искусственного интеллекта, чтобы дать обратную связь.",
          "Совместные книги: обработка присланных продолжений и их оценка для выбора экспертом.",
          "Уведомления: push-сообщения о важных событиях (например, запрос ребёнка или новая глава).",
          "Оплаты и поддержка: обработка покупок, ответы на обращения, обеспечение безопасности сервиса.",
        ],
      },
      {
        h: "4. Голосовые записи и искусственный интеллект",
        p: [
          "Для проверки чтения вслух, пересказа и продолжений записи преобразуются в текст и оцениваются автоматически. Для этого мы можем использовать сторонних поставщиков ИИ-обработки речи.",
          "Записи хранятся для работы сервиса и могут быть удалены по запросу родителя или пользователя.",
        ],
      },
      {
        h: "5. Передача данных третьим лицам",
        p: [
          "Мы не продаём персональные данные. Мы передаём данные только поставщикам, помогающим работе сервиса, и только в необходимом объёме:",
          "— платёжный провайдер (обработка покупок);",
          "— поставщики ИИ (расшифровка и оценка речи);",
          "— сервис доставки push-уведомлений;",
          "— система аналитики Яндекс.Метрика;",
          "— провайдеры хостинга и инфраструктуры.",
          "Мы также можем раскрывать данные, если это требуется по закону.",
        ],
      },
      {
        h: "6. Аналитика, cookies и хранилище",
        p: [
          "Мы используем Яндекс.Метрику для понимания того, как используется сервис, и его улучшения.",
          "Мы используем cookies и локальное хранилище браузера для сохранения языка интерфейса и сессии входа. Отключение может ограничить работу приложения.",
        ],
      },
      {
        h: "7. Хранение данных",
        p: [
          "Мы храним данные, пока активен аккаунт и пока это необходимо для целей, описанных в Политике, либо в течение срока, установленного законом.",
          "После удаления аккаунта связанные данные удаляются или обезличиваются, за исключением того, что требуется хранить по закону.",
        ],
      },
      {
        h: "8. Безопасность",
        p: [
          "Передача данных защищена шифрованием (HTTPS), пароли хранятся в виде хэшей, доступ ограничен. Тем не менее ни один способ передачи или хранения не является абсолютно безопасным.",
        ],
      },
      {
        h: "9. Ваши права",
        p: [
          "Вы можете запросить доступ к своим данным, их исправление или удаление, а также отозвать согласие на обработку. Родитель может управлять данными ребёнка и удалить его аккаунт.",
          `Для реализации прав напишите на ${CONTACT_EMAIL}.`,
        ],
      },
      {
        h: "10. Международная передача",
        p: [
          "Данные могут обрабатываться на серверах и у поставщиков услуг, расположенных в том числе за пределами вашей страны. Мы принимаем меры для их защиты.",
        ],
      },
      {
        h: "11. Изменения политики",
        p: [
          "Мы можем обновлять эту Политику. Актуальная дата указана вверху страницы. О существенных изменениях мы уведомим в приложении.",
        ],
      },
      {
        h: "12. Контакты",
        p: [
          `Оператор: ТОО «Project Barsum» (сервис Barsum). Сайт: ${SITE}.`,
          `Электронная почта: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },

  kk: {
    title: "Құпиялылық саясаты",
    updated: "Күшіне ену күні: 2026 жылғы 24 шілде",
    backHome: "← Басты бетке",
    intro: [
      `Осы Құпиялылық саясаты операторы «Project Barsum» ЖШС болып табылатын Barsum қосымшасы мен сервисі («Barsum», «біз») ${SITE} сайтының және қосымшаның пайдаланушыларының дербес деректерін қалай жинайтынын, пайдаланатынын және қорғайтынын сипаттайды.`,
      `Barsum — балаларға арналған білім беру платформасы: балалар кітаптарды дауыстап оқиды, тапсырмалар орындайды және кітапты бірге жазуға қатысады, ал ата-аналар мен сарапшылар осы үдерісті сүйемелдейді. Barsum-ды пайдалану арқылы сіз осы Саясатқа келісесіз.`,
      `Деректерге қатысты барлық сұрақ бойынша ${CONTACT_EMAIL} мекенжайына жазыңыз.`,
    ],
    sections: [
      {
        h: "1. Біз қандай деректерді жинаймыз",
        p: [
          "Ата-ана мен сарапшы деректері: аты, электрондық пошта және/немесе телефон нөмірі, құпиясөз (шифрланған түрде сақталады).",
          "Бала деректері: логин, аты немесе бүркеншік аты, жасы не жас тобы. Бала аккаунтын ата-ана немесе заңды өкіл құрады және басқарады.",
          "Белсенділік пен ілгерілеу: оқылған кітаптар, орындалған тапсырмалар, монеталар, жетістіктер, «армандар» мен сұраныстар.",
          "Дауыстық жазбалар: дауыстап оқу мен бірлескен кітапқа жалғас жазбалары, олардың мәтіндік транскрипциясы мен бағалары.",
          "Төлем деректері: сатып алулар туралы мәлімет. Карта деректерін төлем провайдеріміз өңдейді; біз толық карта деректерін сақтамаймыз әрі көрмейміз.",
          "Техникалық деректер: құрылғы мен браузер түрі, push-хабарламалар үшін идентификаторлар, пайдалану деректері, cookies және жергілікті жад (тіл, кіру сеансы).",
        ],
      },
      {
        h: "2. Балалардың деректері",
        p: [
          "Barsum балаларға ата-ана бақылауымен пайдалануға арналған. Бала аккаунтын ата-ана немесе заңды өкіл құрады және бала деректерін өңдеуге келісім береді.",
          "Біз ата-ананың қатысуынсыз балалардың деректерін әдейі тікелей жинамаймыз. Ата-ана бала деректерін көре, өзгерте әрі жоя алады, аккаунтты кез келген уақытта жоя алады.",
          "Баланың дауыстық жазбалары тек сервис жұмысы үшін (оқуды тексеру, бағалау, авторлық) пайдаланылады және жарнамада қолданылмайды.",
        ],
      },
      {
        h: "3. Деректерді қалай пайдаланамыз",
        p: [
          "Сервисті ұсыну: кітаптар мен тапсырмаларға қолжетімділік, ілгерілеуді сақтау, монеталар мен сыйақылар.",
          "Оқу мен мазмұндаманы тексеру: дауыстық жазбалар мәтінге түрлендіріліп, кері байланыс беру үшін жасанды интеллект көмегімен бағаланады.",
          "Бірлескен кітаптар: жіберілген жалғастарды өңдеу және сарапшы таңдауы үшін бағалау.",
          "Хабарламалар: маңызды оқиғалар туралы push-хабарлар (мысалы, баланың сұранысы немесе жаңа тарау).",
          "Төлемдер мен қолдау: сатып алуларды өңдеу, өтініштерге жауап беру, сервис қауіпсіздігін қамтамасыз ету.",
        ],
      },
      {
        h: "4. Дауыстық жазбалар және жасанды интеллект",
        p: [
          "Дауыстап оқуды, мазмұндаманы және жалғастарды тексеру үшін жазбалар мәтінге түрлендіріліп, автоматты бағаланады. Бұл үшін біз үшінші тарап ИИ қызметтерін пайдалана аламыз.",
          "Жазбалар сервис жұмысы үшін сақталады және ата-ананың не пайдаланушының сұрауымен жойылуы мүмкін.",
        ],
      },
      {
        h: "5. Деректерді үшінші тұлғаларға беру",
        p: [
          "Біз дербес деректерді сатпаймыз. Деректерді тек сервис жұмысына көмектесетін жеткізушілерге және қажетті көлемде береміз:",
          "— төлем провайдері (сатып алуларды өңдеу);",
          "— ИИ жеткізушілері (сөзді транскрипциялау және бағалау);",
          "— push-хабарламаларды жеткізу қызметі;",
          "— Яндекс.Метрика аналитикасы;",
          "— хостинг және инфрақұрылым жеткізушілері.",
          "Сондай-ақ заң талап еткен жағдайда деректерді аша аламыз.",
        ],
      },
      {
        h: "6. Аналитика, cookies және жад",
        p: [
          "Сервистің қалай пайдаланылатынын түсініп, жақсарту үшін Яндекс.Метриканы қолданамыз.",
          "Интерфейс тілі мен кіру сеансын сақтау үшін cookies және браузердің жергілікті жадын пайдаланамыз. Оларды өшіру қосымша жұмысын шектеуі мүмкін.",
        ],
      },
      {
        h: "7. Деректерді сақтау",
        p: [
          "Деректерді аккаунт белсенді болғанша және Саясатта сипатталған мақсаттар үшін қажет болғанша немесе заңда белгіленген мерзімде сақтаймыз.",
          "Аккаунт жойылғаннан кейін байланысты деректер жойылады немесе иесіздендіріледі, заң бойынша сақтау талап етілетіндерден басқасы.",
        ],
      },
      {
        h: "8. Қауіпсіздік",
        p: [
          "Деректер шифрлаумен (HTTPS) беріледі, құпиясөздер хэш түрінде сақталады, қолжетімділік шектелген. Дегенмен беру мен сақтаудың ешбір әдісі толық қауіпсіз емес.",
        ],
      },
      {
        h: "9. Сіздің құқықтарыңыз",
        p: [
          "Деректеріңізге қолжетімділік сұрай аласыз, оларды түзете не жоя аласыз, өңдеуге келісімді кері қайтара аласыз. Ата-ана бала деректерін басқарып, аккаунтын жоя алады.",
          `Құқықтарды жүзеге асыру үшін ${CONTACT_EMAIL} мекенжайына жазыңыз.`,
        ],
      },
      {
        h: "10. Халықаралық беру",
        p: [
          "Деректер еліңізден тыс жерде орналасқан серверлер мен қызмет жеткізушілерде де өңделуі мүмкін. Біз оларды қорғау шараларын қолданамыз.",
        ],
      },
      {
        h: "11. Саясаттың өзгеруі",
        p: [
          "Біз осы Саясатты жаңарта аламыз. Ағымдағы күн беттің жоғарғы жағында көрсетілген. Елеулі өзгерістер туралы қосымшада хабарлаймыз.",
        ],
      },
      {
        h: "12. Байланыс",
        p: [
          `Оператор: «Project Barsum» ЖШС (Barsum сервисі). Сайт: ${SITE}.`,
          `Электрондық пошта: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },

  en: {
    title: "Privacy Policy",
    updated: "Effective date: July 24, 2026",
    backHome: "← Back to home",
    intro: [
      `This Privacy Policy explains how the Barsum application and service, operated by Project Barsum LLP (“Barsum”, “we”), collects, uses and protects the personal data of users of the app and the ${SITE} website.`,
      `Barsum is an educational platform for children: children read books aloud, complete tasks and take part in co-writing books, while parents and experts guide the process. By using Barsum, you agree to this Policy.`,
      `For any data-related questions, contact us at ${CONTACT_EMAIL}.`,
    ],
    sections: [
      {
        h: "1. Data we collect",
        p: [
          "Parent and expert data: name, email address and/or phone number, password (stored in encrypted form).",
          "Child data: login, name or nickname, age or age group. A child account is created and managed by a parent or legal guardian.",
          "Activity and progress: books read, tasks completed, coins earned, achievements, “dreams” and requests.",
          "Voice recordings: audio of reading aloud and of continuations for collaborative books, together with their text transcriptions and scores.",
          "Payment data: information about purchases. Card details are processed by our payment provider; we do not store or see full card details.",
          "Technical data: device and browser type, push-notification identifiers, usage data, cookies and local storage (interface language, login session).",
        ],
      },
      {
        h: "2. Children’s data",
        p: [
          "Barsum is intended to be used by children under parental supervision. A child account is created by a parent or legal guardian who consents to the processing of the child’s data.",
          "We do not knowingly collect data directly from children without parental involvement. A parent can review, edit and delete the child’s data and delete the account at any time.",
          "A child’s voice recordings are used solely to operate the service (checking reading, scoring, co-authorship) and are not used for advertising.",
        ],
      },
      {
        h: "3. How we use data",
        p: [
          "Providing and operating the service: access to books and tasks, tracking progress, coins and rewards.",
          "Checking reading and retelling: voice recordings are transcribed and scored using artificial-intelligence technologies to provide feedback.",
          "Collaborative books: processing submitted continuations and scoring them for the expert to choose from.",
          "Notifications: push messages about important events (for example, a child’s request or a new chapter).",
          "Payments and support: processing purchases, responding to requests, keeping the service secure.",
        ],
      },
      {
        h: "4. Voice recordings and artificial intelligence",
        p: [
          "To check reading aloud, retelling and continuations, recordings are converted to text and scored automatically. For this we may use third-party AI speech-processing providers.",
          "Recordings are stored to operate the service and can be deleted at the request of a parent or user.",
        ],
      },
      {
        h: "5. Sharing data with third parties",
        p: [
          "We do not sell personal data. We share data only with providers that help operate the service, and only to the extent necessary:",
          "— payment provider (processing purchases);",
          "— AI providers (speech transcription and scoring);",
          "— push-notification delivery service;",
          "— Yandex Metrica analytics;",
          "— hosting and infrastructure providers.",
          "We may also disclose data where required by law.",
        ],
      },
      {
        h: "6. Analytics, cookies and storage",
        p: [
          "We use Yandex Metrica to understand how the service is used and to improve it.",
          "We use cookies and browser local storage to remember the interface language and login session. Disabling them may limit the app.",
        ],
      },
      {
        h: "7. Data retention",
        p: [
          "We keep data while an account is active and for as long as necessary for the purposes described in this Policy, or for the period required by law.",
          "After an account is deleted, related data is deleted or anonymised, except where retention is required by law.",
        ],
      },
      {
        h: "8. Security",
        p: [
          "Data is transmitted using encryption (HTTPS), passwords are stored as hashes, and access is restricted. However, no method of transmission or storage is completely secure.",
        ],
      },
      {
        h: "9. Your rights",
        p: [
          "You may request access to your data, its correction or deletion, and withdraw consent to processing. A parent can manage a child’s data and delete the account.",
          `To exercise your rights, contact us at ${CONTACT_EMAIL}.`,
        ],
      },
      {
        h: "10. International transfers",
        p: [
          "Data may be processed on servers and by service providers located outside your country. We take measures to protect it.",
        ],
      },
      {
        h: "11. Changes to this policy",
        p: [
          "We may update this Policy. The current date is shown at the top of the page. We will notify you of material changes in the app.",
        ],
      },
      {
        h: "12. Contact",
        p: [
          `Operator: Project Barsum LLP (the Barsum service). Website: ${SITE}.`,
          `Email: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
};

const LANGS: { code: Lang; label: string }[] = [
  { code: "ru", label: "Русский" },
  { code: "kk", label: "Қазақша" },
  { code: "en", label: "English" },
];

export function PrivacyPolicy() {
  const [lang, setLang] = useState<Lang>("ru");
  const doc = DOCS[lang];

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #1b1740 0%, #0f0c29 55%, #0b0920 100%)",
        padding: "40px 20px 64px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: "linear-gradient(135deg, #4776e6, #8e54e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            🐆
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>BARSUM</p>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>{doc.title}</h1>
          </div>
        </div>

        {/* Language switch */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 9999,
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  border: active ? "1px solid rgba(150,180,255,0.6)" : "1px solid rgba(255,255,255,0.18)",
                  background: active ? "rgba(120,150,255,0.28)" : "rgba(255,255,255,0.06)",
                  color: active ? "#fff" : "rgba(255,255,255,0.7)",
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 22px" }}>{doc.updated}</p>

        {/* Intro */}
        <div
          className="glass"
          style={{ padding: 20, borderRadius: 18, marginBottom: 20, border: "1px solid rgba(255,255,255,0.12)" }}
        >
          {doc.intro.map((t, i) => (
            <p
              key={i}
              style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", margin: i === 0 ? "0 0 12px" : "0 0 12px" }}
            >
              {t}
            </p>
          ))}
        </div>

        {/* Sections */}
        {doc.sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#ffd27d", margin: "0 0 10px" }}>{s.h}</h2>
            {s.p.map((t, j) => (
              <p key={j} style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.82)", margin: "0 0 10px" }}>
                {t}
              </p>
            ))}
          </section>
        ))}

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 18, marginTop: 8 }}>
          <a href="/" style={{ fontSize: 14, fontWeight: 800, color: "#a9c9ff", textDecoration: "none" }}>
            {doc.backHome}
          </a>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "12px 0 0" }}>© {new Date().getFullYear()} Barsum</p>
        </div>
      </div>
    </main>
  );
}
