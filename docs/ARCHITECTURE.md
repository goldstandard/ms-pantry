# Architektura — MS Pantry

> Stav k verzi **0.1.2-dev** (2026-06-20). Tento dokument popisuje, **jak je aplikace
> postavená**. Pro aktuální stav vývoje viz [STATUS.md](STATUS.md), pro původní
> záměr [PLAN.md](PLAN.md).

## Obsah

1. [Přehled](#1-přehled)
2. [Technologický stack](#2-technologický-stack)
3. [Struktura projektu](#3-struktura-projektu)
4. [Datový model](#4-datový-model)
5. [Bezpečnost (RLS, auth, secrets)](#5-bezpečnost)
6. [Správa stavu a datová vrstva](#6-správa-stavu-a-datová-vrstva)
7. [Klíčové toky](#7-klíčové-toky)
8. [Lokalizace a překlad](#8-lokalizace-a-překlad)
9. [PWA a offline](#9-pwa-a-offline)
10. [Externí závislosti](#10-externí-závislosti)
11. [Build a nasazení](#11-build-a-nasazení)
12. [Návrhová rozhodnutí a kompromisy](#12-návrhová-rozhodnutí-a-kompromisy)

---

## 1. Přehled

MS Pantry je **single-page PWA** bez vlastního aplikačního serveru. Veškerá logika
běží v prohlížeči (na notebooku i mobilu); data a autentizaci zajišťuje **Supabase**
(hostovaný Postgres + Auth + Row Level Security). Dvě externí služby se volají přímo:
**Open Food Facts** (dohledání produktu podle čárového kódu) a **DeepL** (překlad názvů,
zprostředkovaně přes Supabase Edge Function, aby klíč nebyl v prohlížeči).

```
┌───────────────────────────────────────────────┐
│                 Prohlížeč (PWA)                 │
│                                                 │
│  React + Vite SPA                               │
│  ├─ i18n (cs/en/zh)      ├─ react-query (cache) │
│  ├─ ZXing (skener)       └─ kontexty: Auth,     │
│  └─ Supabase JS klient        ActiveLocation    │
└───┬───────────────┬───────────────────┬─────────┘
    │ HTTPS         │ fetch             │ functions.invoke
    ▼               ▼                   ▼
┌─────────┐  ┌────────────────┐  ┌──────────────────────┐
│ Supabase│  │ Open Food Facts│  │ Supabase Edge Function│
│ Postgres│  │ (veřejné API)  │  │   `translate`         │
│ + Auth  │  └────────────────┘  │   └─► DeepL API       │
│ + RLS   │                      └──────────────────────┘
└─────────┘
```

**Klíčový princip:** klient mluví se Supabase přímo přes publishable key; data chrání
**Row Level Security** na úrovni databáze (každý uživatel vidí jen své řádky). Není
potřeba žádná serverová mezivrstva kromě jedné Edge Function pro skrytí DeepL klíče.

---

## 2. Technologický stack

| Vrstva | Volba | Proč |
|---|---|---|
| UI framework | **React 18 + TypeScript** | typová bezpečnost, komponentový model |
| Build | **Vite 5** | rychlý dev server i build |
| PWA | **vite-plugin-pwa** (Workbox) | service worker, manifest, instalovatelnost |
| Styl | **Tailwind CSS** + `lucide-react` | mobile-first, rychlé UI bez vlastního CSS |
| Routing | **react-router-dom 6** | klientské routy |
| Server state | **@tanstack/react-query 5** | cache, invalidace, mutace nad Supabase |
| Skener | **@zxing/browser** | čtení čárových kódů z kamery, lazy-loaded |
| Produktová data | **Open Food Facts API** | zdarma, bez klíče, obsahuje CZ produkty |
| Backend | **Supabase** (Postgres + Auth + RLS + Edge Functions) | cloud sync, auth, zabezpečení |
| i18n | **react-i18next** (+ language-detector) | překlad UI, přepínání za běhu |
| Překlad názvů | **DeepL** přes Edge Function | kvalitní cs/en/zh, klíč server-side |
| Datum | **date-fns** | výpočty dnů do expirace |
| Hosting | **Vercel** | statický build, HTTPS, env proměnné |

---

## 3. Struktura projektu

```
Martin_MS-Pantry/
├─ index.html                 vstupní HTML, registrace PWA
├─ vite.config.ts             Vite + PWA manifest + runtime cache pravidla
├─ tailwind.config.js         brand barvy
├─ tsconfig.json              jeden config (src + vite.config.ts), noEmit
├─ .env.example               vzor env proměnných
├─ start.bat                  Windows spouštěč (npm run dev + otevření prohlížeče)
│
├─ public/
│  └─ pwa-icon.svg            ikona aplikace (manifest + favicon)
│
├─ src/
│  ├─ main.tsx                vstupní bod — providery (QueryClient, Router, Auth, ActiveLocation)
│  ├─ App.tsx                 routy + brány (Setup / Login / ActiveLocationGate)
│  │
│  ├─ lib/                    čistá logika bez Reactu
│  │  ├─ types.ts             doménové typy (Lang, I18nText, Item, Location, Category, …)
│  │  ├─ supabase.ts          klient + isSupabaseConfigured + requireSupabase()
│  │  ├─ i18n.ts              inicializace react-i18next
│  │  ├─ displayName.ts       výběr jazyka názvu, mergeNames, missingLangs
│  │  ├─ expiry.ts            výpočet stavu expirace + barevné styly + řazení
│  │  ├─ categories.ts        výchozí kategorie + mapování Open Food Facts → slug
│  │  ├─ openfoodfacts.ts     lookup produktu podle čárového kódu
│  │  └─ translate.ts         volání Edge Function translate, doplnění chybějících jazyků
│  │
│  ├─ locales/                cs / en / zh — překlady celého UI (translation.json)
│  │
│  ├─ hooks/                  React/data vrstva
│  │  ├─ useAuth.tsx          AuthProvider + useAuth (session, signOut)
│  │  ├─ useActiveLocation.tsx  aktivní sklad v localStorage
│  │  ├─ useLocations.ts      query + mutace skladů
│  │  ├─ useCategories.ts     query + mutace kategorií
│  │  └─ useItems.ts          query + mutace položek + product_profiles (učení)
│  │
│  ├─ components/
│  │  ├─ Nav.tsx              Layout (header + spodní navigace + <Outlet/>)
│  │  ├─ LanguageSwitcher.tsx přepínač jazyka
│  │  ├─ LocationSwitcher.tsx přepínač skladu
│  │  ├─ ItemForm.tsx         formulář položky (název ve 3 jazycích, porce, ruční kód…)
│  │  ├─ ItemCard.tsx         karta položky v seznamu
│  │  ├─ ExpiryBadge.tsx      barevný štítek stavu expirace
│  │  ├─ CategoryFilter.tsx   vodorovné pilulky kategorií
│  │  └─ BarcodeScanner.tsx   celoobrazovkový skener (ZXing) — lazy
│  │
│  └─ pages/
│     ├─ Login.tsx            magic-link přihlášení
│     ├─ Dashboard.tsx        seznam potravin (seskupení / agregace / hledání)
│     ├─ AddItem.tsx          přidání: scan/ruční kód → OFF → profil → překlad → uložení
│     ├─ EditItem.tsx         úprava / přesun / spotřebování / smazání
│     ├─ Categories.tsx       správa kategorií
│     └─ Locations.tsx        správa skladů a jejich prahů
│
├─ supabase/
│  ├─ schema.sql              tabulky + RLS + seed + trigger pro nového uživatele
│  └─ functions/translate/    Edge Function (Deno) — DeepL proxy
│
└─ docs/                      tato dokumentace
```

**Konvence:** `lib/` = čistá logika (testovatelná, bez Reactu) · `hooks/` = napojení na
React Query a Supabase · `components/` = znovupoužitelné UI · `pages/` = obrazovky.

---

## 4. Datový model

Čtyři tabulky v Postgresu (schéma [`supabase/schema.sql`](../supabase/schema.sql)).
Vícejazyčné texty jsou v `jsonb` jako `{ "cs": "...", "en": "...", "zh": "..." }`.

### `locations` — sklady
| Sloupec | Typ | Pozn. |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | default `auth.uid()`, FK → auth.users |
| `name_i18n` | jsonb | název ve 3 jazycích |
| `critical_days` | int | práh „kritické" (např. 14) |
| `soon_days` | int | práh „brzy" (např. 60) |
| `is_default` | bool | výchozí sklad pro nového uživatele |
| `sort_order` | int | pořadí |

### `categories` — kategorie
| Sloupec | Typ | Pozn. |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | default `auth.uid()` |
| `name_i18n` | jsonb | název ve 3 jazycích |
| `slug` | text | stabilní klíč u výchozích (mapování z OFF), null u vlastních |
| `is_default` | bool | |
| `sort_order` | int | |

### `items` — potraviny
| Sloupec | Typ | Pozn. |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | default `auth.uid()` |
| `location_id` | uuid | FK → locations (cascade) |
| `name_i18n` | jsonb | název ve 3 jazycích |
| `original_lang` | text | jazyk pořízení názvu (zdroj překladu) |
| `brand` | text | značka |
| `barcode` | text | čárový kód |
| `category_id` | uuid | FK → categories (set null) |
| `quantity` | int | počet **balení** |
| `servings_per_unit` | numeric | porcí na jedno balení (nullable) |
| `unit` | text | ks / g / ml |
| `expiration_date` | date | |
| `image_url` | text | obrázek z OFF |
| `note` | text | |
| `is_opened` | bool | balení je načaté / otevřené → prioritní konzumace |
| `created_at` / `updated_at` | timestamptz | |

### `product_profiles` — paměť pro učení
| Sloupec | Typ | Pozn. |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | default `auth.uid()` |
| `barcode` | text | **klíč učení** — identifikuje typ balení |
| `name_i18n` | jsonb | naučený název |
| `brand` | text | |
| `default_category_id` | uuid | FK → categories |
| `default_servings` | numeric | naučený počet porcí |
| `default_unit` | text | |
| `times_seen` | int | kolikrát zadáno |
| **unique** | `(user_id, barcode)` | jeden profil na produkt a uživatele |

### Vztahy

```
auth.users 1──* locations 1──* items *──1 categories
                                  └ product_profiles (přes barcode, napříč sklady)
```

`product_profiles` je úmyslně **mimo** hierarchii skladů — učení o produktu platí
globálně pro uživatele (pomáhá Chatě i Domácnosti).

---

## 5. Bezpečnost

- **Row Level Security** je zapnutá na všech čtyřech tabulkách. Politika je u všech
  stejná: `user_id = auth.uid()` pro `using` i `with check`. Klient fyzicky
  nemůže číst ani měnit cizí řádky, i kdyby obešel UI.
- **`user_id`** se nikdy neposílá z klienta — má v DB `default auth.uid()`. To zároveň
  zjednodušuje upserty (`product_profiles`) a brání podvržení cizího `user_id`.
- **Publishable key** (`sb_publishable_...`) v prohlížeči je v pořádku — je určený
  pro klienta; veškerou ochranu dělá RLS. Starší formát byl JWT (`eyJ...`), nový
  formát je opaque, ale funguje stejně přes Supabase API gateway.
- **Magic-link auth**: bez hesla, session v `localStorage`, auto-refresh tokenu.
- **DeepL klíč** žije jen jako secret Edge Function (`DEEPL_API_KEY`), do bundle se
  nikdy nedostane.
- **Seed funkce** (`seed_defaults_for_user`) běží jako `security definer` s pevným
  `search_path = public`.

---

## 6. Správa stavu a datová vrstva

**Server state** řeší **React Query**. Klíče dotazů:

| Klíč | Obsah | Enabled |
|---|---|---|
| `['locations']` | sklady uživatele | po přihlášení |
| `['categories']` | kategorie uživatele | po přihlášení |
| `['items', activeLocationId]` | položky aktivního skladu | když je vybraný sklad |
| `['item', id]` | jedna položka (detail) | na stránce úpravy |

Mutace (create/update/remove) po úspěchu invalidují příslušné klíče → UI se samo
přečte. `product_profiles` se nečte přes React Query, ale přímými funkcemi
`fetchProductProfile()` / `upsertProductProfile()` (volané ve flow přidání).

**Klientský stav** drží dva React kontexty:
- **`AuthProvider`** (`useAuth`) — session ze Supabase, `signOut`, příznak `configured`.
- **`ActiveLocationProvider`** (`useActiveLocation`) — id aktivního skladu v `localStorage`.

`App.tsx` obsahuje **brány**: bez env → `Setup`; bez session → `Login`; jinak
`ActiveLocationGate` zajistí platný aktivní sklad a vykreslí `Layout` s routami.

---

## 7. Klíčové toky

### 7.1 Přihlášení
`Login` → `supabase.auth.signInWithOtp({ email, emailRedirectTo: window.location.origin })`
→ e-mail s odkazem → po kliknutí `detectSessionInUrl` nastaví session →
`onAuthStateChange` aktualizuje `AuthProvider`.
Při úplně první registraci DB trigger `handle_new_user` naseeduje sklady a kategorie.

> **Pozn. k portům:** Vite defaultně bere 5173; je-li obsazený, vezme 5174.
> `emailRedirectTo` se posílá dynamicky jako `window.location.origin`, takže magic-link
> vždy přesměruje zpátky na port, ze kterého byl odeslán. Supabase musí mít daný port
> v **Redirect URLs** (Auth → URL Configuration).

### 7.2 Přidání položky (`AddItem`)
```
Sken kamerou (ZXing) nebo ruční zadání kódu do textového pole
   │
   ├─ 1) fetchProductProfile(barcode)   ← naučené hodnoty (porce, kategorie, název)
   ├─ 2) lookupBarcode(barcode)         ← Open Food Facts (název, značka, obrázek, kategorie)
   │        mapOffCategory(tags) → slug → category_id
   ├─ 3) translateMissing(name_i18n)    ← doplní chybějící jazyky (DeepL)
   │
   ▼
Uživatel doplní expiraci, potvrdí kategorii a porce → Uložit
   ├─ items.insert(...)
   └─ upsertProductProfile(...)          ← učení: zapamatuj porce/kategorii/název
```
Profil i OFF se **slučují** (`mergeNames`) — existující hodnoty se nepřepisují.

### 7.3 Výpočet expirace (`lib/expiry.ts`)
`daysUntil(date)` → porovná s prahy **aktivního skladu**:
`< 0` prošlé · `< critical_days` kritické · `< soon_days` brzy · jinak v pořádku.
Každý stav má barvu (`STATUS_STYLES`). Dvě sort funkce:
- `compareByExpiry` — nejbližší nahoru, bez data nakonec.
- `compareByOpenedThenExpiry` — otevřená balení (`is_opened = true`) nahoře, uvnitř
  skupiny znovu podle expirace. Tato funkce se používá v obou pohledech dashboardu.

### 7.4 Dashboard
Filtr (kategorie + fulltext přes všechny jazyky názvu) → dva pohledy:
- **podle kategorií** (výchozí): sekce s nadpisem, v hlavičce agregace (Σ balení, Σ porcí),
  uvnitř řazeno: otevřená balení první, pak podle expirace;
- **podle expirace** (plochý seznam napříč kategoriemi): otevřená balení opět první,
  pak zbývající od nejbližší expirace.
Souhrn nahoře počítá prošlé a brzy/kritické přes celý sklad.

### 7.5 Sklady
`LocationSwitcher` mění `activeLocationId` → mění se klíč `['items', id]` → dashboard
ukazuje jiná data a `expiry` používá jiné prahy. Přesun položky mezi sklady je úprava
`location_id` v `EditItem`.

---

## 8. Lokalizace a překlad

Dvě roviny:

1. **UI texty** — `react-i18next`, soubory `src/locales/{cs,en,zh}/translation.json`.
   Jazyk se detekuje (localStorage → navigator) a ukládá pod klíč `ms-pantry-lang`.
   Přepínač mění jazyk za běhu.

2. **Doménové názvy** (položky, kategorie, sklady) — uložené jako `name_i18n`.
   `displayName(name, lang)` vybere zvolený jazyk s fallbackem (zvolený → cs → en → zh
   → cokoli). Chybějící jazyky doplní `translateMissing()` přes Edge Function:

```
translateMissing(name_i18n, source)
   └─► supabase.functions.invoke('translate', { text, source, targets })
          └─► DeepL (api-free / api dle typu klíče)
   ◄── { translations: { en, zh } }   → mergeNames → uloží do name_i18n (cache)
```

Když překlad selže nebo klíč chybí, vrací se původní název — appka funguje dál.

---

## 9. PWA a offline

`vite-plugin-pwa` (`registerType: autoUpdate`) generuje service worker a manifest.
Cachuje se **app shell** (HTML/JS/CSS) → aplikace se načte i offline. Odpovědi
Open Food Facts mají runtime cache (NetworkFirst, 30 dní). **Data ze Supabase a překlad
vyžadují síť** — plně offline-first režim je v roadmapě, ne v MVP. Skener vyžaduje
**HTTPS** (nebo `localhost`).

---

## 10. Externí závislosti

| Služba | Účel | Klíč | Selhání |
|---|---|---|---|
| **Supabase** | DB, auth, RLS, edge functions | publishable key (klient) | appka nefunkční bez env → Setup obrazovka |
| **Open Food Facts** | dohledání produktu | žádný | tichý fallback na ruční vyplnění |
| **DeepL** | překlad názvů | server-side secret | tichý fallback — názvy bez překladu |
| **Vercel** | hosting | — | jen pro produkční nasazení |

### Poznámka k Supabase API Keys v2

Nové projekty Supabase (od 2025) používají klíče formátu `sb_publishable_...` místo
dřívějšího JWT (`eyJ...`). Tyto klíče fungují stejně jako anon key, ale **vyžadují,
aby tabulky byly explicitně vystaveny v Data API** (Integrations → Data API → Settings
→ Exposed tables). Bez tohoto nastavení REST API vrací 403 i pro přihlášeného uživatele.

---

## 11. Build a nasazení

- **Dev:** `npm run dev` nebo `start.bat` (Windows). Vite bere port 5173, je-li obsazený,
  sáhne po 5174. `host: true` → dostupné i z mobilu na LAN.
- **Build:** `npm run build` = `tsc --noEmit` (typecheck) + `vite build` → `dist/`.
- **Code-splitting:** `BarcodeScanner` (ZXing) je `lazy()` → samostatný chunk
  (~400 kB) se stáhne až při prvním skenování; hlavní bundle ~530 kB.
- **Env proměnné:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (build-time, prefix
  `VITE_` je vystavený klientovi — proto tam patří jen veřejné hodnoty).
- **Edge Function:** `npx supabase functions deploy translate` + secret `DEEPL_API_KEY`.
- **Hosting:** statický výstup `dist/` na Vercel; do Supabase Auth přidat produkční URL
  jako Redirect URL.

---

## 12. Návrhová rozhodnutí a kompromisy

- **Bez vlastního backendu.** Supabase + RLS pokrývá auth i autorizaci; jediná serverová
  věc je Edge Function kvůli skrytí DeepL klíče. Méně kódu, méně provozu.
- **`name_i18n` jako jsonb** místo samostatné překladové tabulky — jednodušší dotazy,
  data drží pohromadě s entitou; cenou je fulltext přes všechny jazyky v paměti klienta
  (u osobní spíže zanedbatelné).
- **Učení na úrovni `barcode`**, ne názvu — barcode je nejstabilnější identifikátor
  balení. Profil je sdílený napříč sklady.
- **Magic-link** místo hesla — méně tření, žádné heslo k úniku.
- **Hrubší prahy expirace per-sklad** — chata se nenavštěvuje často (14/60), domácnost
  ano (3/14); proto je práh konfigurace skladu, ne globální konstanta.
- **Ruční zadání kódu vedle kamerového skeneru** — kamera notebooku nemusí mít dostatečné
  rozlišení nebo ostření pro čárové kódy; textové pole umožní lookup bez nutnosti kamery.
- **`is_opened` na položce místo samostatné entity** — označení otevřeného balení je
  jednoduchý boolean příznak; nevzniká žádná nová tabulka. Otevřená balení se automaticky
  řadí na první pozici v obou pohledech dashboardu, aby připomínala prioritní konzumaci.
  Přidáno jako migrační sloupec (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`), ne v původním
  `schema.sql`, aby stávající instance nevyžadovaly reset DB.
- **Velikost bundle** — i18next + supabase-js + react-query tvoří většinu; skener je
  odštěpený. Dál by šlo lazy-loadovat jednotlivé routy (roadmapa).
