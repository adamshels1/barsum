--
-- PostgreSQL database dump
--

\restrict qa0HxoEy7HUXOp1SZJL8EsaVWjg1a6SpqfZNEiWbIhd61jPZKX2heRXJYe3dFAf

-- Dumped from database version 16.13
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: challenge_enrollments_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.challenge_enrollments_status_enum AS ENUM (
    'active',
    'completed',
    'cancelled'
);


--
-- Name: challenges_category_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.challenges_category_enum AS ENUM (
    'reading'
);


--
-- Name: challenges_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.challenges_status_enum AS ENUM (
    'draft',
    'moderation',
    'published',
    'rejected'
);


--
-- Name: coin_transactions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.coin_transactions_status_enum AS ENUM (
    'pending',
    'confirmed',
    'returned'
);


--
-- Name: coin_transactions_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.coin_transactions_type_enum AS ENUM (
    'purchase',
    'reserve',
    'earn',
    'reward_request',
    'reward_confirm',
    'reward_return',
    'dream'
);


--
-- Name: dreams_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dreams_status_enum AS ENUM (
    'pending_approval',
    'active',
    'completed',
    'rejected'
);


--
-- Name: experts_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.experts_status_enum AS ENUM (
    'new',
    'review',
    'approved'
);


--
-- Name: payments_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payments_status_enum AS ENUM (
    'pending',
    'confirmed',
    'rejected'
);


--
-- Name: reward_requests_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_requests_status_enum AS ENUM (
    'pending',
    'delivered',
    'rejected'
);


--
-- Name: rewards_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rewards_type_enum AS ENUM (
    'snack',
    'time',
    'experience'
);


--
-- Name: sessions_phase_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sessions_phase_enum AS ENUM (
    'read',
    'recording',
    'transcribing',
    'analyzing',
    'done'
);


--
-- Name: sessions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sessions_status_enum AS ENUM (
    'pending',
    'completed',
    'failed'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'parent',
    'expert',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: challenge_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "childId" uuid NOT NULL,
    "challengeId" uuid NOT NULL,
    "parentId" uuid NOT NULL,
    status public.challenge_enrollments_status_enum DEFAULT 'active'::public.challenge_enrollments_status_enum NOT NULL,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "coinsPerPart" integer DEFAULT 0 NOT NULL
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    "bookTitle" character varying NOT NULL,
    "bookAuthor" character varying NOT NULL,
    "pagesTotal" integer DEFAULT 0 NOT NULL,
    description text,
    "authorId" uuid NOT NULL,
    category public.challenges_category_enum DEFAULT 'reading'::public.challenges_category_enum NOT NULL,
    "ageMin" integer DEFAULT 0 NOT NULL,
    "ageMax" integer DEFAULT 99 NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    "coinsReward" integer DEFAULT 0 NOT NULL,
    status public.challenges_status_enum DEFAULT 'draft'::public.challenges_status_enum NOT NULL,
    "rejectedReason" character varying,
    "membersCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "pagesPerPart" integer DEFAULT 0 NOT NULL,
    "partTexts" json,
    "totalParts" integer DEFAULT 30 NOT NULL
);


--
-- Name: children; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.children (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    login character varying NOT NULL,
    password character varying NOT NULL,
    name character varying NOT NULL,
    age integer NOT NULL,
    "parentId" uuid NOT NULL,
    streak integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: coin_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coin_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "fromType" character varying NOT NULL,
    "fromId" character varying,
    "toType" character varying NOT NULL,
    "toId" character varying,
    amount integer NOT NULL,
    type public.coin_transactions_type_enum NOT NULL,
    status public.coin_transactions_status_enum DEFAULT 'confirmed'::public.coin_transactions_status_enum NOT NULL,
    "referenceId" character varying,
    "referenceType" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: dreams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dreams (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "childId" uuid NOT NULL,
    name character varying NOT NULL,
    "targetCoins" integer DEFAULT 0 NOT NULL,
    "savedCoins" integer DEFAULT 0 NOT NULL,
    status public.dreams_status_enum DEFAULT 'pending_approval'::public.dreams_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "parentId" character varying,
    "photoUrl" text,
    "rejectedReason" text
);


--
-- Name: experts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    status public.experts_status_enum DEFAULT 'new'::public.experts_status_enum NOT NULL,
    specialization character varying,
    bio text,
    "rejectedReason" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "parentId" uuid NOT NULL,
    "childId" uuid NOT NULL,
    "challengeId" uuid NOT NULL,
    "challengePrice" integer DEFAULT 0 NOT NULL,
    "coinsAmount" integer DEFAULT 0 NOT NULL,
    "coinsTg" integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    "receiptUrl" character varying,
    status public.payments_status_enum DEFAULT 'pending'::public.payments_status_enum NOT NULL,
    "adminNote" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "resolvedAt" timestamp without time zone
);


--
-- Name: review_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_queue (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "sessionId" uuid NOT NULL,
    "expertId" uuid NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    "resolvedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reward_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "childId" uuid NOT NULL,
    "parentId" uuid NOT NULL,
    "rewardId" uuid NOT NULL,
    "coinsAmount" integer NOT NULL,
    status public.reward_requests_status_enum DEFAULT 'pending'::public.reward_requests_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "resolvedAt" timestamp without time zone
);


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "parentId" uuid NOT NULL,
    name character varying NOT NULL,
    cost integer NOT NULL,
    type public.rewards_type_enum DEFAULT 'snack'::public.rewards_type_enum NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "enrollmentId" uuid NOT NULL,
    "childId" uuid NOT NULL,
    "partNumber" integer DEFAULT 1 NOT NULL,
    phase public.sessions_phase_enum DEFAULT 'read'::public.sessions_phase_enum NOT NULL,
    "audioUrl" character varying,
    transcription text,
    "aiScore" numeric(5,2),
    "aiQuestions" jsonb,
    "aiAnswers" jsonb,
    status public.sessions_status_enum DEFAULT 'pending'::public.sessions_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    name character varying NOT NULL,
    phone character varying,
    role public.users_role_enum DEFAULT 'parent'::public.users_role_enum NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: challenge_enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.challenge_enrollments (id, "childId", "challengeId", "parentId", status, "startedAt", "completedAt", "createdAt", "updatedAt", "coinsPerPart") FROM stdin;
4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	50e807f3-ec0b-4ddc-8144-0c8ad36412fe	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	active	2026-06-25 10:39:10.893	\N	2026-06-25 05:39:10.892216	2026-06-25 05:39:10.892216	0
0215f564-54f6-40c9-bf4a-06acd420a56c	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	4b0091e2-4734-4231-b6e7-aa4d37fd7270	41bd0ebd-3809-48c2-bda9-caec8382dbb0	active	2026-06-26 10:22:25.094	\N	2026-06-26 05:22:25.093772	2026-06-26 05:22:25.093772	0
b077364e-b72d-4527-8443-9607e0fb5399	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	eadb8762-0cc0-41bc-b361-66858875bb4a	41bd0ebd-3809-48c2-bda9-caec8382dbb0	active	2026-06-26 11:42:48.626	\N	2026-06-26 06:42:48.626723	2026-06-26 06:42:48.626723	0
db3734c5-11ac-49b1-a08b-6834e3a689fc	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	4b0091e2-4734-4231-b6e7-aa4d37fd7270	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	active	2026-06-30 12:08:12.92	\N	2026-06-30 07:08:12.917381	2026-06-30 07:08:12.917381	0
6a342e45-0bf6-4c66-8c88-0edad4526007	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	9dea0216-b4c1-458f-9056-255e12afb67a	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	active	2026-06-30 12:26:58.505	\N	2026-06-30 07:26:58.504614	2026-06-30 07:26:58.504614	0
38827f12-a93c-47f1-9366-244d11a5dba7	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	eadb8762-0cc0-41bc-b361-66858875bb4a	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	active	2026-06-30 18:38:20.386	\N	2026-06-30 13:38:20.385546	2026-06-30 13:38:20.385546	10
\.


--
-- Data for Name: challenges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.challenges (id, title, "bookTitle", "bookAuthor", "pagesTotal", description, "authorId", category, "ageMin", "ageMax", price, "coinsReward", status, "rejectedReason", "membersCount", "createdAt", "updatedAt", "pagesPerPart", "partTexts", "totalParts") FROM stdin;
4b0091e2-4734-4231-b6e7-aa4d37fd7270	Гарри Поттер и философский камень	Гарри Поттер и философский камень	Дж. К. Роулинг	320	Первая книга о юном волшебнике Гарри Поттере. Захватывающее приключение в волшебном мире.	b16f27c8-d7c1-4632-84eb-5aeddad2edcd	reading	10	14	3490	500	published	\N	0	2026-06-25 05:39:10.872889	2026-06-25 05:39:10.872889	0	\N	30
eadb8762-0cc0-41bc-b361-66858875bb4a	Маленький принц	Маленький принц	Антуан де Сент-Экзюпери	180	Философская сказка о маленьком принце, путешествующем по планетам. Учит доброте и ответственности.	b16f27c8-d7c1-4632-84eb-5aeddad2edcd	reading	9	14	2490	500	published	\N	0	2026-06-25 05:39:10.869262	2026-06-25 05:39:10.869262	0	\N	30
50e807f3-ec0b-4ddc-8144-0c8ad36412fe	Алиса в Стране чудес	Алиса в Стране чудес	Льюис Кэрролл	200	Классическая история о девочке Алисе, попавшей в волшебный мир. Развивает фантазию и любовь к чтению.	b16f27c8-d7c1-4632-84eb-5aeddad2edcd	reading	8	12	2990	500	published	\N	0	2026-06-25 05:39:10.856379	2026-06-25 05:39:10.856379	0	\N	30
7a04fa92-3c3e-495a-926e-8df7d528a0c1	Чтение тестовой книги	Тестовая книга	Тестовый автор	50	Тестовое описание	b16f27c8-d7c1-4632-84eb-5aeddad2edcd	reading	8	12	1000	500	moderation	\N	0	2026-06-26 12:32:24.938313	2026-06-26 12:32:24.95716	0	\N	30
8acdaf47-1a54-482b-855a-0e000bb765ca	Летнее чтение	Хоббит	Дж. Р. Р. Толкин	60		b16f27c8-d7c1-4632-84eb-5aeddad2edcd	reading	10	14	2990	500	moderation	\N	0	2026-06-29 12:00:05.150942	2026-06-29 12:00:05.17406	0	\N	30
ca330aab-736a-48d4-8dd3-10638d09668d	Прочитай книгу	Книга Абай	Абай	300	Нужно прочитать книгу	b16f27c8-d7c1-4632-84eb-5aeddad2edcd	reading	8	12	2990	500	published	\N	0	2026-06-26 09:24:13.10863	2026-06-29 12:09:59.840481	0	\N	30
9dea0216-b4c1-458f-9056-255e12afb67a	Репка	Репка	Русская народная сказка	5	Короткая народная сказка о том, как вся семья вместе вытянула большую репку. Учит дружбе и взаимопомощи.	b16f27c8-d7c1-4632-84eb-5aeddad2edcd	reading	5	8	990	100	published	\N	0	2026-06-30 07:26:37.320426	2026-06-30 07:26:49.990568	1	["Посадил дед репку. Репка выросла большая-пребольшая! Пришёл дед репку из земли тащить. Тянет-потянет — вытянуть не может. Позвал дед бабку на помощь.","Бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут. Позвала бабка внучку. Прибежала внучка, взялась за бабку.","Внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут. Позвала внучка Жучку. Прибежала собачка Жучка, ухватилась за внучку.","Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут. Позвала Жучка кошку. Прибежала кошка, ухватилась за Жучку.","Кошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут... и вытянули репку! Вот так, дружно работая вместе, они справились. Молодцы!"]	5
\.


--
-- Data for Name: children; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.children (id, login, password, name, age, "parentId", streak, "createdAt", "updatedAt") FROM stdin;
73e62315-da98-49d5-ad58-0bbbadb8efed	adam	$2b$10$jDH1Pmms5UGy4hnLclZB3uRlZbzMaFOml13DsQxAxxES/OvAMdq1.	Адам	9	55245bc9-3e54-45f7-8fe9-fcc880e27c34	0	2026-06-25 06:53:43.438658	2026-06-25 06:53:43.438658
f4d44af7-8d2a-49af-af0c-25d93e922e1a	adam123	$2b$10$zIzx5ojdsrNxtXUUNyjjXe2Wrh98ppifhIJNCjSoP0WtFrWUc7kN6	Adam	9	95c663e5-01b3-4dd4-86e8-63aef735c6c7	0	2026-06-25 17:15:30.22277	2026-06-25 17:15:30.22277
af6ccf0f-a3f5-4e7f-874f-6603dd333fdc	test_child_new	$2b$10$6jLHsQCXepNCCMds322TN.d/hstkHjFXWjvgLHQd/jcD5F5replGK	Тест	8	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	0	2026-06-26 05:11:51.016836	2026-06-26 05:11:51.016836
e409a102-587c-4ac6-8aa2-d25cbcbacc9f	adam3	$2b$10$pXouHGr7iG9woGY9eMvqL.rQzvVdTkTJpoZu5ZCIhMiBmZeMKGaE2	Adam3	9	41bd0ebd-3809-48c2-bda9-caec8382dbb0	3	2026-06-26 05:14:16.778795	2026-06-26 09:18:31.660263
868d75f2-e73a-4225-84dc-db83d2396354	test3	$2b$10$5ctkeBfQWk5L17G7KUciPuE5YybBastDuSRFLaVFeGKYAMwkUPJXq	Тест2	10	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	0	2026-06-26 12:57:03.819283	2026-06-26 12:57:03.819283
b40d040f-d8b7-48a3-adf1-65e574a9d9cb	ayla_2024	$2b$10$aCji/LrtVTeFF9fTEmQu.OZ7.8N8CU7VOWvGPs1ZpMSSVi4lSxV3e	Айла	10	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	16	2026-06-25 05:31:22.915918	2026-06-30 14:11:55.266334
\.


--
-- Data for Name: coin_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coin_transactions (id, "fromType", "fromId", "toType", "toId", amount, type, status, "referenceId", "referenceType", "createdAt") FROM stdin;
e0c8bd03-8a7a-4325-b071-9945f92cd94c	system	system	parent	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	1000	purchase	confirmed	payment-coins-2ddd7d7c-48fb-4bf1-974e-a94da08f068f	\N	2026-06-26 04:59:52.22447
a9bea229-dc0a-4c94-9b53-f0376bbef9ee	system	system	child	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	500	earn	confirmed	session-earn-e1537a9d-4fd8-495b-b4d5-c42d248df6c2	\N	2026-06-26 07:18:18.194816
2bfc3f75-2f7e-4f38-850c-968472acbf6f	system	system	child	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	500	earn	confirmed	session-earn-252a1dfb-c2ac-4b36-a683-064adb27dea2	\N	2026-06-26 07:25:02.849244
557b5ab7-1526-4b94-91b9-bc27ab2e2634	system	system	child	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	500	earn	confirmed	session-earn-203e88f3-143d-42e5-9d09-a35bb46f6f1c	\N	2026-06-26 09:18:31.65601
58efd617-1975-4268-a682-8b2870d960ec	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-686723fe-9091-4f36-b838-5759a2e11519	\N	2026-06-26 13:09:36.0973
57a248ed-9d7f-4d05-b2a7-88006972f082	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	system	system	500	reward_request	confirmed	reward-request-eb12c338-1b71-4c41-b1c9-80d0f5a63f0e-b40d040f-d8b7-48a3-adf1-65e574a9d9cb-1782497573922	\N	2026-06-26 18:12:53.925979
99a68203-5134-4735-8dd6-5621f9db7121	system	system	parent	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	500	reward_confirm	confirmed	reward-deliver-7eedb6b5-2112-4baf-928f-731c0249052a	\N	2026-06-26 18:28:45.468288
c0cd7e73-994d-4b12-9c99-a58836172655	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-7bcc389e-6424-4c18-92da-b8341331b1b3	\N	2026-06-29 10:50:41.08281
9bb95d3b-27a3-42cb-affd-60d8f7a50ba2	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-97224b8b-a849-4119-b993-dd36bfab73ef	\N	2026-06-29 14:13:48.082292
2e9bb7fa-cf87-4d22-a136-0724cc1124d1	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-c141bcff-6b2d-426f-afe2-1346927e230e	\N	2026-06-29 14:14:23.590218
cf2ea5fa-fa9b-4c15-ba84-348f6c928e15	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-036cd5af-a0d7-4d6d-8088-4b5756b7baa5	\N	2026-06-29 14:37:26.59981
69be9387-71d8-46c5-bdd4-8908df3fa622	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-04d4d0dd-f80a-4a8a-90af-c135332eacaf	\N	2026-06-29 14:38:01.773123
7ae15344-13fb-49a7-bace-bc00389054fa	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-b7b1f9d3-6cd9-4a03-bd80-4e750f7324c1	\N	2026-06-29 14:42:21.798976
f8750082-1328-4085-a727-146d73aaa882	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-4612adb1-be30-4a44-a259-4b7f4b16ca18	\N	2026-06-29 16:07:05.716627
a7e99b13-fe15-4e9b-bf44-d835b7069672	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	system	system	200	reward_request	confirmed	reward-request-5d60aeb7-6924-4769-b59c-136f6a671023-b40d040f-d8b7-48a3-adf1-65e574a9d9cb-1782756370482	\N	2026-06-29 18:06:10.490261
89750022-9cc6-4e51-94e0-35241a3f44c6	system	system	parent	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	200	reward_confirm	confirmed	reward-deliver-7ce33e44-81a8-4e46-8721-381586dfbe90	\N	2026-06-29 18:07:12.307013
3de8f978-7dcb-4e28-b151-890625004540	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-fd42ea22-95bb-4b75-a672-c12e61b9f690	\N	2026-06-30 04:42:22.238417
1811a34c-ba0e-4190-8c06-f70e719d9624	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-aa8e7c60-198e-4cbe-b905-162108cb8000	\N	2026-06-30 04:49:39.177029
3d52aee1-4a65-475e-8be2-13c86a41d3b7	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-c9130ce2-658e-442c-8337-99450b71f047	\N	2026-06-30 04:50:05.62762
ea7d110a-d002-4a09-b075-3de073fd0ca5	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	500	earn	confirmed	session-earn-cd3894e0-03d4-4636-acb4-75ac2539f89d	\N	2026-06-30 04:50:32.644714
02d9d788-3c59-4f6c-9dd8-cac1fdc400b7	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	100	earn	confirmed	session-earn-8ee8599f-2cb6-4dbe-9e5f-76dd2e3694c4	\N	2026-06-30 07:48:07.488443
b7f487da-7b46-4bdf-9ed1-9d58d8c3dc4b	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	100	earn	confirmed	session-earn-488f0038-3cf1-4a40-8f35-22f9cf1d07b8	\N	2026-06-30 07:48:41.254597
5bc3e48a-12c9-4d6f-9d27-f9c2c57666cf	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	100	earn	confirmed	session-earn-d11f7611-ef09-417b-b5a4-e314de54f96d	\N	2026-06-30 07:54:34.815445
062a73aa-ada4-43d4-a881-5ee4278c1fda	system	system	child	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	10	earn	confirmed	session-earn-d9be3bac-abb6-4906-b416-7cf32a0fbfa1	\N	2026-06-30 14:11:55.260569
\.


--
-- Data for Name: dreams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dreams (id, "childId", name, "targetCoins", "savedCoins", status, "createdAt", "updatedAt", "parentId", "photoUrl", "rejectedReason") FROM stdin;
8fb946c0-3fac-4af1-942f-caff1d44ac31	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	Велик	1000	230	active	2026-06-26 13:06:14.479252	2026-06-30 14:12:18.093172	\N	\N	\N
\.


--
-- Data for Name: experts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.experts (id, "userId", status, specialization, bio, "rejectedReason", "createdAt", "updatedAt") FROM stdin;
e0894e14-2470-46bd-bc10-46703406faff	b16f27c8-d7c1-4632-84eb-5aeddad2edcd	approved	\N	\N	\N	2026-06-25 05:31:23.01106	2026-06-25 05:31:23.015451
16653c4a-eb81-4337-a357-1ab20af7d46a	1fe4d454-c4f0-4604-b2fc-499f470167f9	new	\N	\N	\N	2026-06-25 06:48:49.52754	2026-06-25 06:48:49.52754
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, "parentId", "childId", "challengeId", "challengePrice", "coinsAmount", "coinsTg", total, "receiptUrl", status, "adminNote", "createdAt", "resolvedAt") FROM stdin;
8b10c252-461f-4053-911d-81dca175bddb	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	50e807f3-ec0b-4ddc-8144-0c8ad36412fe	2990	0	0	2990	\N	pending	\N	2026-06-25 17:22:56.934669	\N
c262c43e-c05d-4a4c-adfe-968d21beeb5e	95c663e5-01b3-4dd4-86e8-63aef735c6c7	f4d44af7-8d2a-49af-af0c-25d93e922e1a	50e807f3-ec0b-4ddc-8144-0c8ad36412fe	2990	0	0	2990	http://localhost:9100/barsum-receipts/c262c43e-c05d-4a4c-adfe-968d21beeb5e/1782408209431-11f6bdcf-7040-45b6-9653-0896a02b5f42.jpeg	pending	\N	2026-06-25 17:23:16.781103	\N
2ddd7d7c-48fb-4bf1-974e-a94da08f068f	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	50e807f3-ec0b-4ddc-8144-0c8ad36412fe	2990	1000	100	3090	\N	confirmed	\N	2026-06-26 04:59:52.188742	2026-06-26 09:59:52.218
f716d857-6237-4259-82de-f922b84b239f	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	eadb8762-0cc0-41bc-b361-66858875bb4a	2490	0	0	2490	\N	pending	\N	2026-06-26 05:06:14.473265	\N
00db2be8-fd34-4fc2-80dd-60f24a7a9039	41bd0ebd-3809-48c2-bda9-caec8382dbb0	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	4b0091e2-4734-4231-b6e7-aa4d37fd7270	3490	0	0	3490	http://localhost:9100/barsum-receipts/00db2be8-fd34-4fc2-80dd-60f24a7a9039/1782451121004-Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð°Â â 2026-06-25 Ð²Â 22.01.23.png	confirmed	\N	2026-06-26 05:18:27.136065	2026-06-26 10:22:25.084
89743ec0-774f-452e-91c7-b7a4d53c25c8	41bd0ebd-3809-48c2-bda9-caec8382dbb0	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	eadb8762-0cc0-41bc-b361-66858875bb4a	2490	0	0	2490	http://localhost:9100/barsum-receipts/89743ec0-774f-452e-91c7-b7a4d53c25c8/1782456098292-Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð°Â â 2026-06-25 Ð²Â 22.01.23.png	confirmed	\N	2026-06-26 06:40:58.322382	2026-06-26 11:42:48.616
31963ae5-a99b-4ac6-af8a-c015f88e3950	41bd0ebd-3809-48c2-bda9-caec8382dbb0	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	4b0091e2-4734-4231-b6e7-aa4d37fd7270	3490	0	0	3490	http://localhost:9100/barsum-receipts/31963ae5-a99b-4ac6-af8a-c015f88e3950/1782458213740-Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð°Â â 2026-06-25 Ð²Â 16.28.10.png	confirmed	\N	2026-06-26 07:16:47.736604	2026-06-26 12:17:32.345
834806d1-6e1d-4c56-a2dc-d0b9398ea885	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	4b0091e2-4734-4231-b6e7-aa4d37fd7270	3490	1000	100	3590	\N	pending	\N	2026-06-26 12:36:11.004243	\N
bc972d32-b649-402c-9374-81b708de1683	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	4b0091e2-4734-4231-b6e7-aa4d37fd7270	3490	0	0	3490	\N	pending	\N	2026-06-26 12:44:23.50143	\N
8ef7444a-36af-4d4b-ac77-bb657adace19	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	4b0091e2-4734-4231-b6e7-aa4d37fd7270	3490	0	0	3490	http://localhost:9100/barsum-receipts/8ef7444a-36af-4d4b-ac77-bb657adace19/1782477890649-Ð¡Ð½Ð¸Ð¼Ð¾Ðº ÑÐºÑÐ°Ð½Ð°Â â 2026-06-25 Ð²Â 22.01.23.png	pending	\N	2026-06-26 12:44:42.850542	\N
a8ac93f6-bd66-4a81-a626-11ce52c535e8	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	af6ccf0f-a3f5-4e7f-874f-6603dd333fdc	50e807f3-ec0b-4ddc-8144-0c8ad36412fe	2990	31000	3100	6090	\N	pending	\N	2026-06-26 19:23:28.693772	\N
07e2de84-24b1-4dcf-9a3a-8fd2f5d0c228	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	50e807f3-ec0b-4ddc-8144-0c8ad36412fe	2990	22000	2200	5190	\N	pending	\N	2026-06-26 19:27:28.045835	\N
48832cc9-e524-44f1-a952-3f46db8d3954	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	868d75f2-e73a-4225-84dc-db83d2396354	4b0091e2-4734-4231-b6e7-aa4d37fd7270	3490	30000	3000	6490	\N	pending	\N	2026-06-29 07:23:43.058975	\N
5b67d6c6-83c4-4c9b-8677-b801b44fef38	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	eadb8762-0cc0-41bc-b361-66858875bb4a	2490	10000	1000	3490	\N	pending	\N	2026-06-29 10:48:17.828912	\N
f2840307-d55e-4baa-b0f2-c4a4d02c150d	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	4b0091e2-4734-4231-b6e7-aa4d37fd7270	3490	10000	1000	4490	\N	pending	\N	2026-06-29 13:16:39.273166	\N
01af90af-4c34-4799-b11a-b5e931213976	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	4b0091e2-4734-4231-b6e7-aa4d37fd7270	3490	0	0	3490	\N	confirmed	\N	2026-06-30 07:07:37.514617	2026-06-30 12:08:12.909
905ecb29-26ec-4354-a21c-3fa097bed4fe	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	9dea0216-b4c1-458f-9056-255e12afb67a	990	0	0	990	\N	confirmed	\N	2026-06-30 07:26:58.363562	2026-06-30 12:26:58.498
86778dee-a53c-4125-8d67-285ccf50ede0	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	eadb8762-0cc0-41bc-b361-66858875bb4a	2490	300	30	2520	\N	confirmed	\N	2026-06-30 13:38:20.343133	2026-06-30 18:38:20.375
\.


--
-- Data for Name: review_queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review_queue (id, "sessionId", "expertId", resolved, "resolvedAt", "createdAt") FROM stdin;
ca6c0230-c853-4c75-b8fe-5564a34cc9a6	adfbeb9b-7e06-4fd9-9ea4-bd8f2fb97796	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	f	\N	2026-06-25 07:30:01.932987
1673c2ed-6d00-4293-9d37-464d4c7a059b	b3d2fa36-d09a-47ee-8c16-ff1db49523c3	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	f	\N	2026-06-25 08:36:51.844387
f5312c17-6efc-4272-a172-0424c5002f1f	ce8d71d7-99f1-4a13-a4c0-ac2ebe330009	41bd0ebd-3809-48c2-bda9-caec8382dbb0	f	\N	2026-06-26 05:25:21.91505
8c87e612-0cd3-4348-bd79-971ca0c9fa60	679b3982-3e65-4778-b3c3-02e5a33e790a	41bd0ebd-3809-48c2-bda9-caec8382dbb0	f	\N	2026-06-26 06:43:40.639102
\.


--
-- Data for Name: reward_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reward_requests (id, "childId", "parentId", "rewardId", "coinsAmount", status, "createdAt", "resolvedAt") FROM stdin;
7eedb6b5-2112-4baf-928f-731c0249052a	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	eb12c338-1b71-4c41-b1c9-80d0f5a63f0e	500	delivered	2026-06-26 18:12:53.929758	2026-06-26 23:28:45.487
7ce33e44-81a8-4e46-8721-381586dfbe90	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	5d60aeb7-6924-4769-b59c-136f6a671023	200	delivered	2026-06-29 18:06:10.498329	2026-06-29 23:07:12.315
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rewards (id, "parentId", name, cost, type, "isActive", "createdAt", "updatedAt") FROM stdin;
5d60aeb7-6924-4769-b59c-136f6a671023	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	Мороженое	200	snack	t	2026-06-25 05:39:10.877234	2026-06-25 05:39:10.877234
8c2896dc-cf2c-40e8-aab0-34c0cad04a0e	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	Прогулка в парке	300	time	t	2026-06-25 05:39:10.880912	2026-06-25 05:39:10.880912
eb12c338-1b71-4c41-b1c9-80d0f5a63f0e	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	Игровая приставка (1 час)	500	time	t	2026-06-25 05:39:10.883501	2026-06-25 05:39:10.883501
1a6b7282-ade7-4815-990d-2a4e2efd9f70	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	Пицца	1500	snack	t	2026-06-25 05:39:10.886057	2026-06-25 05:39:10.886057
dec6812d-9c71-406e-90d5-5499a85a3ce1	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	Кино	3000	experience	t	2026-06-25 05:39:10.888315	2026-06-25 05:39:10.888315
12b760fd-81e7-4106-9929-b9a74f865c2b	55245bc9-3e54-45f7-8fe9-fcc880e27c34	велик	20000	experience	f	2026-06-25 06:54:34.736949	2026-06-25 06:54:39.982487
064e9c09-5907-486b-8641-44e9fff611c2	55245bc9-3e54-45f7-8fe9-fcc880e27c34	Велик	2000	experience	t	2026-06-25 06:55:04.350884	2026-06-25 06:55:04.350884
c1a2d5d6-cdfd-41a9-9f4e-d9b781883509	e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	часы	500	experience	t	2026-06-29 10:49:42.149337	2026-06-29 10:49:42.149337
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, "enrollmentId", "childId", "partNumber", phase, "audioUrl", transcription, "aiScore", "aiQuestions", "aiAnswers", status, "createdAt") FROM stdin;
97224b8b-a849-4119-b993-dd36bfab73ef	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	9	done	http://localhost:9100/barsum-audio/97224b8b-a849-4119-b993-dd36bfab73ef/1782742424640-recording.webm	Книга про льва, который сначала был маленьким, и его никто не видел, потому что он был маленький, и его кто-то, кто-то его, ну, спрятал. Потом он вырос и потом он... потом он вырос и потом он нашёл свой дом. И всё.	\N	\N	\N	completed	2026-06-29 14:13:15.456917
adfbeb9b-7e06-4fd9-9ea4-bd8f2fb97796	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	1	done	http://localhost:9100/barsum-audio/adfbeb9b-7e06-4fd9-9ea4-bd8f2fb97796/1782371513158-recording.webm	Один, два, три, четыре. Да. Всё, я закончил пересказ.	0.00	["Кто является главной героиней книги \\"Алиса в Стране чудес\\"?", "Какое животное, спешащее куда-то, Алиса увидела в самом начале истории, что и послужило причиной ее приключений?", "Назови хотя бы одного необычного персонажа, кроме главной героини, которого Алиса встретила в Стране чудес."]	\N	pending	2026-06-25 06:36:53.229108
2cae41cd-ddb0-4825-9280-62fee3afa86d	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	5	done	http://localhost:9100/barsum-audio/2cae41cd-ddb0-4825-9280-62fee3afa86d/1782503094739-recording.webm		\N	\N	\N	pending	2026-06-26 19:20:30.186147
679b3982-3e65-4778-b3c3-02e5a33e790a	b077364e-b72d-4527-8443-9607e0fb5399	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	1	done	http://localhost:9100/barsum-audio/679b3982-3e65-4778-b3c3-02e5a33e790a/1782456213054-recording.webm	Я сейчас читаю книжку Маленький принц. Она довольно интересная, очень классная.	0.00	["Кто главный герой этой книги, и откуда он прилетел?", "Какой необычный цветок Маленький принц оставил на своей планете?", "С какими необычными взрослыми Маленький принц встречался на разных планетах во время своего путешествия?"]	\N	pending	2026-06-26 06:43:13.221216
e1537a9d-4fd8-495b-b4d5-c42d248df6c2	0215f564-54f6-40c9-bf4a-06acd420a56c	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	2	done	http://localhost:9100/barsum-audio/e1537a9d-4fd8-495b-b4d5-c42d248df6c2/1782458295263-recording.webm	Один, два, три, четыре, пять, шесть, семь, восемь, девять, десять.	\N	\N	\N	completed	2026-06-26 05:25:31.048326
5551fc61-5178-4ad6-8f5f-d3d4607116d5	b077364e-b72d-4527-8443-9607e0fb5399	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	2	read	\N	\N	\N	\N	\N	pending	2026-06-26 07:24:37.917349
b3d2fa36-d09a-47ee-8c16-ff1db49523c3	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	2	done	http://localhost:9100/barsum-audio/b3d2fa36-d09a-47ee-8c16-ff1db49523c3/1782376334352-recording.webm	Шла Саша Паша сэй сас и читала книжку ты.	0.00	["Кто главная героиня книги «Алиса в Стране чудес»?", "Что произошло с Алисой, когда она увидела Белого Кролика с часами?", "Назови хотя бы одного необычного персонажа, которого Алиса встретила в Стране чудес."]	\N	pending	2026-06-25 07:54:20.354493
f598044c-4c90-4447-876a-fbe9973961e9	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	6	done	http://localhost:9100/barsum-audio/f598044c-4c90-4447-876a-fbe9973961e9/1782719935799-recording.webm		\N	\N	\N	pending	2026-06-29 07:58:05.745499
252a1dfb-c2ac-4b36-a683-064adb27dea2	0215f564-54f6-40c9-bf4a-06acd420a56c	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	3	done	http://localhost:9100/barsum-audio/252a1dfb-c2ac-4b36-a683-064adb27dea2/1782458698173-recording.webm	Я сейчас читаю книжку Гарри Поттер. Она очень интересная. Я бы читал её каждый день.	\N	\N	\N	completed	2026-06-26 07:19:08.96894
ce8d71d7-99f1-4a13-a4c0-ac2ebe330009	0215f564-54f6-40c9-bf4a-06acd420a56c	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	1	done	http://localhost:9100/barsum-audio/ce8d71d7-99f1-4a13-a4c0-ac2ebe330009/1782451513194-recording.webm	Гарри Поттер. Я сейчас читаю книжку Гарри Поттера. 1 2 3.	5.00	["Расскажи, пожалуйста, кто такой Гарри Поттер и почему он оказался в школе Хогвартс?", "Какие волшебные предметы или заклинания из книги тебе запомнились больше всего?", "Кто из персонажей книги тебе понравился и почему?"]	\N	pending	2026-06-26 05:24:47.725846
203e88f3-143d-42e5-9d09-a35bb46f6f1c	0215f564-54f6-40c9-bf4a-06acd420a56c	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	4	done	http://localhost:9100/barsum-audio/203e88f3-143d-42e5-9d09-a35bb46f6f1c/1782465508908-recording.webm	На Гарри Поттера часто оглядывались на улице. Правда, не потому что он был необычным мальчиком, вовсе нет, хотя это было правдой. На улице было холодно.	\N	\N	\N	completed	2026-06-26 07:25:12.18183
8f778fad-7ee9-4944-855a-709d1755cc21	0215f564-54f6-40c9-bf4a-06acd420a56c	e409a102-587c-4ac6-8aa2-d25cbcbacc9f	5	read	\N	\N	\N	\N	\N	pending	2026-06-26 09:18:37.17138
7bcc389e-6424-4c18-92da-b8341331b1b3	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	7	done	http://localhost:9100/barsum-audio/7bcc389e-6424-4c18-92da-b8341331b1b3/1782730238267-recording.webm	Дом герцогиня у Харка добавляла помидоры.	\N	\N	\N	completed	2026-06-29 10:50:26.683934
686723fe-9091-4f36-b838-5759a2e11519	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	3	done	http://localhost:9100/barsum-audio/686723fe-9091-4f36-b838-5759a2e11519/1782479372969-recording.webm	Зал со стеклянным столиком Алиса оказалась в зале	\N	\N	\N	completed	2026-06-26 05:07:30.137608
57e4aa65-eba3-4fb1-a308-d4fd65f4fa71	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	4	done	http://localhost:9100/barsum-audio/57e4aa65-eba3-4fb1-a308-d4fd65f4fa71/1782497527745-recording.webm		\N	\N	\N	pending	2026-06-26 18:09:03.789186
c141bcff-6b2d-426f-afe2-1346927e230e	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	10	done	http://localhost:9100/barsum-audio/c141bcff-6b2d-426f-afe2-1346927e230e/1782742461127-recording.webm	Зайца звали Боб. У него были длинные уши. И он жил в норе под дубом. И у него были мягкие, э-э, лапки. И он любил морковку.	\N	\N	\N	completed	2026-06-29 14:14:03.297852
cf9513ad-b2a4-4985-9c0e-0a285f65f9a1	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	8	done	http://localhost:9100/barsum-audio/cf9513ad-b2a4-4985-9c0e-0a285f65f9a1/1782742374454-recording.webm		\N	\N	\N	pending	2026-06-29 13:52:47.242262
036cd5af-a0d7-4d6d-8088-4b5756b7baa5	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	11	done	http://localhost:9100/barsum-audio/036cd5af-a0d7-4d6d-8088-4b5756b7baa5/1782743836531-recording.webm	Физике тоже убью? Да. Может я тоже убью.	\N	\N	\N	completed	2026-06-29 14:37:07.270526
04d4d0dd-f80a-4a8a-90af-c135332eacaf	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	12	done	http://localhost:9100/barsum-audio/04d4d0dd-f80a-4a8a-90af-c135332eacaf/1782743873325-recording.webm	Да, по ним, да, по ним. То тексты они входят в эту красную глыбу. Но, когда это вот какая-то рожь, они это не воспринимают серьёзные вещи, потому что...	\N	\N	\N	completed	2026-06-29 14:37:34.376729
b7b1f9d3-6cd9-4a03-bd80-4e750f7324c1	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	13	done	http://localhost:9100/barsum-audio/b7b1f9d3-6cd9-4a03-bd80-4e750f7324c1/1782743908853-recording.webm	получил доступ к соцсети ФОК. Угу. Давай. Я дам.\nЗЫ: Э.\nМ.\nЯ тебе дам.\nЗЫ: Э.\nА, да.\nЗЫ: Э, а, да, да.\nВ: М, да.\nЯ дам.\nЗЫ: Да.\nВ: Да.\nЗЫ: Э, а.\nМ, да.\nЭ.\nА.\nА.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nДа.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЗЫ: Э.\nМ, да.\nЭ.\nДа.\nЭ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nДа.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nДа.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.Э. Э.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.Э. Э.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.Э. Э.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.Э. Э.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.Э. Э.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.Э. Э.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.Э. Э.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.Э. Э.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.Э. Э.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.Э. Э.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.Э. Э.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.Э. Э.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.Э. Э.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.М, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ.\nЭ.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nМ, да.\nМ, да.\nЭ.\nЭ.\nЭ.\nМ, да.\nМ, да.\nЭ.\nМ, да.\nЭ.\nЭ.\nЭ.\nЭ	\N	\N	\N	completed	2026-06-29 14:38:10.795425
4612adb1-be30-4a44-a259-4b7f4b16ca18	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	14	done	http://localhost:9100/barsum-audio/4612adb1-be30-4a44-a259-4b7f4b16ca18/1782749223410-recording.webm	А когда ты будешь пересказывать?	\N	\N	\N	completed	2026-06-29 16:06:55.370614
fd42ea22-95bb-4b75-a672-c12e61b9f690	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	15	done	http://localhost:9100/barsum-audio/fd42ea22-95bb-4b75-a672-c12e61b9f690/1782794539344-recording.webm	(никакого текста в аудио нет)	\N	\N	\N	completed	2026-06-29 16:07:23.311305
aa8e7c60-198e-4cbe-b905-162108cb8000	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	10	done	http://localhost:9100/barsum-audio/aa8e7c60-198e-4cbe-b905-162108cb8000/1782794976590-recording.webm	Ой, как будто бы я просто просыпаюсь, а тут уже солнышко. Приду на кухню, там уже завтрак готов. И потом я иду чистить зубки, умываться. А потом мы я иду играть. А потом мы идём гулять. А потом я иду уже обедать, спать. А потом я просыпаюсь, я уже играю. А потом мы идём ужинать. И потом я иду уже спать. Вот. И так каждый день.	\N	\N	\N	completed	2026-06-30 04:49:29.737531
c9130ce2-658e-442c-8337-99450b71f047	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	11	done	http://localhost:9100/barsum-audio/c9130ce2-658e-442c-8337-99450b71f047/1782795003098-recording.webm	У книжек авторское право.	\N	\N	\N	completed	2026-06-30 04:49:55.248359
cd3894e0-03d4-4636-acb4-75ac2539f89d	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	12	done	http://localhost:9100/barsum-audio/cd3894e0-03d4-4636-acb4-75ac2539f89d/1782795026525-recording.webm	С ними договариваться, их не книжки закидывать.	\N	\N	\N	completed	2026-06-30 04:50:12.132712
310124ff-bf2f-44e1-b1d7-3b72be77cc12	4d99f2aa-7964-4955-b51a-3498cbe248aa	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	13	read	\N	\N	\N	\N	\N	pending	2026-06-30 06:37:15.141922
1aa37f50-7465-4e9a-b1df-a71775e988f7	db3734c5-11ac-49b1-a08b-6834e3a689fc	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	1	read	\N	\N	\N	\N	\N	pending	2026-06-30 07:25:30.600067
8ee8599f-2cb6-4dbe-9e5f-76dd2e3694c4	6a342e45-0bf6-4c66-8c88-0edad4526007	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	1	done	http://localhost:9100/barsum-audio/8ee8599f-2cb6-4dbe-9e5f-76dd2e3694c4/1782805683901-recording.webm	ходит вдаль. Иногда погода преподносит сюрпризы.	\N	\N	\N	completed	2026-06-30 07:27:05.68751
488f0038-3cf1-4a40-8f35-22f9cf1d07b8	6a342e45-0bf6-4c66-8c88-0edad4526007	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	2	done	http://localhost:9100/barsum-audio/488f0038-3cf1-4a40-8f35-22f9cf1d07b8/1782805717167-recording.webm	Как только вновь появляется солнце, они продолжают путешествие. И через несколько дней достигают места назначения – Швеции. В начале июля скандинавское лето.	\N	\N	\N	completed	2026-06-30 07:48:19.067394
d11f7611-ef09-417b-b5a4-e314de54f96d	6a342e45-0bf6-4c66-8c88-0edad4526007	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	3	done	http://localhost:9100/barsum-audio/d11f7611-ef09-417b-b5a4-e314de54f96d/1782806066870-recording.webm	на микрофоне, провоцирует соперника, смешит народ и при этом не отказывается от трудных поединков. Как раз этого парня и поставили напротив Хамзата на 320.	\N	\N	\N	completed	2026-06-30 07:54:14.772709
d9be3bac-abb6-4906-b416-7cf32a0fbfa1	38827f12-a93c-47f1-9366-244d11a5dba7	b40d040f-d8b7-48a3-adf1-65e574a9d9cb	1	done	http://localhost:9100/barsum-audio/d9be3bac-abb6-4906-b416-7cf32a0fbfa1/1782828708683-recording.webm	Эта книга очень интересная про м-м-м про про про про Артёма. И-и-и, есть.	\N	\N	\N	completed	2026-06-30 13:38:30.850638
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, phone, role, "isActive", "createdAt", "updatedAt") FROM stdin;
fefa8257-022a-467c-86ea-e030da4d5b20	test@barsum.kz	$2b$10$3xP/KPJkkTJdAYoUCV1afeQHfkNB8tUmOqHoVj2qfiMl2iZ/oB/wi	Тест	\N	parent	t	2026-06-25 05:31:13.212582	2026-06-25 05:31:13.212582
55245bc9-3e54-45f7-8fe9-fcc880e27c34	admin@barsum.kz	$2b$10$YzSbTWKXwfGpmX/Vq23UCe2LqPKuPK32BE0if51PL0Cdu0to5/eqa	Администратор	\N	admin	t	2026-06-25 05:31:22.734892	2026-06-25 05:31:22.734892
1fe4d454-c4f0-4604-b2fc-499f470167f9	newexpert@test.kz	$2b$10$ZQA3mAsdElhCumQT1vS4Vehw/5gdNTKcmNtys7Lligx1rtaL.M./K	Новый эксперт	\N	expert	t	2026-06-25 06:48:49.51903	2026-06-25 06:48:49.51903
e4a05ec2-9ef5-418d-9bd5-fad362e34e2d	parent@test.kz	$2b$10$aCji/LrtVTeFF9fTEmQu.OZ7.8N8CU7VOWvGPs1ZpMSSVi4lSxV3e	Тестовый родитель	\N	parent	t	2026-06-25 05:31:22.82487	2026-06-25 05:31:22.82487
b16f27c8-d7c1-4632-84eb-5aeddad2edcd	expert@test.kz	$2b$10$aCji/LrtVTeFF9fTEmQu.OZ7.8N8CU7VOWvGPs1ZpMSSVi4lSxV3e	Тестовый эксперт	\N	expert	t	2026-06-25 05:31:23.007459	2026-06-25 05:31:23.007459
95c663e5-01b3-4dd4-86e8-63aef735c6c7	ismailov112@gmail.com	$2b$10$iQTV/lJtu5kQEV.9jugWteUblqg0QKd5WibsMNDw4e2G.l7n8J0di	Ali	\N	parent	t	2026-06-25 17:15:08.849516	2026-06-25 17:15:08.849516
41bd0ebd-3809-48c2-bda9-caec8382dbb0	ismailov113@gmail.com	$2b$10$Npwx/msyw0A14pO7deqnledWqGIbgX1V/Ss3YI3cdzmdLbzqsi3oi	Ali	\N	parent	t	2026-06-26 05:13:50.709168	2026-06-26 05:13:50.709168
\.


--
-- Name: payments PK_197ab7af18c93fbb0c9b28b4a59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY (id);


--
-- Name: challenges PK_1e664e93171e20fe4d6125466af; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT "PK_1e664e93171e20fe4d6125466af" PRIMARY KEY (id);


--
-- Name: sessions PK_3238ef96f18b355b671619111bc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY (id);


--
-- Name: rewards PK_3d947441a48debeb9b7366f8b8c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY (id);


--
-- Name: reward_requests PK_628db6a6125a5061fe18397c334; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_requests
    ADD CONSTRAINT "PK_628db6a6125a5061fe18397c334" PRIMARY KEY (id);


--
-- Name: coin_transactions PK_7dad7cc20e8e6f4700b04928e12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT "PK_7dad7cc20e8e6f4700b04928e12" PRIMARY KEY (id);


--
-- Name: children PK_8c5a7cbebf2c702830ef38d22b0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT "PK_8c5a7cbebf2c702830ef38d22b0" PRIMARY KEY (id);


--
-- Name: experts PK_8ecb9ec7e8b977b177fde797e6a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT "PK_8ecb9ec7e8b977b177fde797e6a" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: dreams PK_b4f37d6173d7b9d9db610860082; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dreams
    ADD CONSTRAINT "PK_b4f37d6173d7b9d9db610860082" PRIMARY KEY (id);


--
-- Name: challenge_enrollments PK_b57b8147104c995ff044bb317db; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_enrollments
    ADD CONSTRAINT "PK_b57b8147104c995ff044bb317db" PRIMARY KEY (id);


--
-- Name: review_queue PK_cd52d93cd97342f37527cfdd802; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_queue
    ADD CONSTRAINT "PK_cd52d93cd97342f37527cfdd802" PRIMARY KEY (id);


--
-- Name: experts REL_2728a584942d4f966841383195; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT "REL_2728a584942d4f966841383195" UNIQUE ("userId");


--
-- Name: children UQ_9761c3c22f4b435a3106a069b88; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT "UQ_9761c3c22f4b435a3106a069b88" UNIQUE (login);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: challenges FK_055e0b18ca304da3ed5070299d9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT "FK_055e0b18ca304da3ed5070299d9" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reward_requests FK_1994e2089ebd8481f4fade5712d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_requests
    ADD CONSTRAINT "FK_1994e2089ebd8481f4fade5712d" FOREIGN KEY ("childId") REFERENCES public.children(id) ON DELETE CASCADE;


--
-- Name: experts FK_2728a584942d4f9668413831953; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experts
    ADD CONSTRAINT "FK_2728a584942d4f9668413831953" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dreams FK_2b2cf119080885c61e8dc0e6e91; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dreams
    ADD CONSTRAINT "FK_2b2cf119080885c61e8dc0e6e91" FOREIGN KEY ("childId") REFERENCES public.children(id) ON DELETE CASCADE;


--
-- Name: review_queue FK_2ddca2364718e8f95b6f7b660c0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_queue
    ADD CONSTRAINT "FK_2ddca2364718e8f95b6f7b660c0" FOREIGN KEY ("expertId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: challenge_enrollments FK_657926e2f412f6bbe725b677111; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_enrollments
    ADD CONSTRAINT "FK_657926e2f412f6bbe725b677111" FOREIGN KEY ("parentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reward_requests FK_6d18e7516ef253c5771847cd57a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_requests
    ADD CONSTRAINT "FK_6d18e7516ef253c5771847cd57a" FOREIGN KEY ("parentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rewards FK_7b2f21a621eab7d88515b0ecdd5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT "FK_7b2f21a621eab7d88515b0ecdd5" FOREIGN KEY ("parentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments FK_7db85350c23441a789eee0a5986; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_7db85350c23441a789eee0a5986" FOREIGN KEY ("parentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: children FK_b65f0ac2a8c620dc69f8d75a4f0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT "FK_b65f0ac2a8c620dc69f8d75a4f0" FOREIGN KEY ("parentId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions FK_b6d4667a0df16f4d8f67593f215; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "FK_b6d4667a0df16f4d8f67593f215" FOREIGN KEY ("childId") REFERENCES public.children(id) ON DELETE CASCADE;


--
-- Name: reward_requests FK_b7cb56cba83666836a66a0dd6a9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_requests
    ADD CONSTRAINT "FK_b7cb56cba83666836a66a0dd6a9" FOREIGN KEY ("rewardId") REFERENCES public.rewards(id) ON DELETE CASCADE;


--
-- Name: challenge_enrollments FK_d0398d2040e2c813d21749fc05f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_enrollments
    ADD CONSTRAINT "FK_d0398d2040e2c813d21749fc05f" FOREIGN KEY ("challengeId") REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- Name: payments FK_d7ac26b879cfdd12f728edc9651; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_d7ac26b879cfdd12f728edc9651" FOREIGN KEY ("childId") REFERENCES public.children(id) ON DELETE CASCADE;


--
-- Name: sessions FK_dc4a1fc7a77188845bbd1151877; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "FK_dc4a1fc7a77188845bbd1151877" FOREIGN KEY ("enrollmentId") REFERENCES public.challenge_enrollments(id) ON DELETE CASCADE;


--
-- Name: payments FK_dfc18a20cbc36965d3d059b5a3f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_dfc18a20cbc36965d3d059b5a3f" FOREIGN KEY ("challengeId") REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- Name: challenge_enrollments FK_ea65c5abb6f37d7044dc3bc2178; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_enrollments
    ADD CONSTRAINT "FK_ea65c5abb6f37d7044dc3bc2178" FOREIGN KEY ("childId") REFERENCES public.children(id) ON DELETE CASCADE;


--
-- Name: review_queue FK_f394175334ac0da88d99a586e2c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_queue
    ADD CONSTRAINT "FK_f394175334ac0da88d99a586e2c" FOREIGN KEY ("sessionId") REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict qa0HxoEy7HUXOp1SZJL8EsaVWjg1a6SpqfZNEiWbIhd61jPZKX2heRXJYe3dFAf

