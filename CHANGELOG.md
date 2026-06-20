# Changelog

Všechny podstatné změny v projektu MS Pantry jsou zaznamenané v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.1.0/)
a projekt používá [sémantické verzování](https://semver.org/lang/cs/).

Typy změn: **Added** (přidáno) · **Changed** (změněno) · **Deprecated** (zastaralé) ·
**Removed** (odebráno) · **Fixed** (opraveno) · **Security** (bezpečnost).

## [Unreleased]

> Sem piš změny, které čekají na vydání. Při vydání je přesuň do nové verze níže.

### Added

- **Indikátor otevřeného balení** (`is_opened`): položka jde označit jako „Otevřeno"
  — tlačítko přepínač v `EditItem` (oranžové = otevřeno, bílé = neotevřeno). Na kartě
  v seznamu se zobrazí oranžová ikona a text „Otevřeno". Otevřená balení se řadí
  automaticky na první místo v rámci kategorie i v pohledu podle expirace.
  Vyžaduje SQL migraci: `ALTER TABLE public.items ADD COLUMN IF NOT EXISTS is_opened boolean NOT NULL DEFAULT false;`

### Changed

### Fixed

---

## [0.1.1] — 2026-06-20

Nasazení do produkce, řešení problémů s novým Supabase API Keys v2 a přidání
ručního zadávání čárových kódů jako alternativy ke kamerové čtečce.

### Added

- **Ruční zadání čárového kódu**: textové pole pod tlačítkem „Skenovat" v `ItemForm`
  umožňuje zadat kód přes klávesnici; po potvrzení (Enter nebo tlačítko Hledat) se
  spustí stejný lookup jako při kamerovém skenování (Open Food Facts + product_profiles
  + překlad). Přeloženo do cs/en/zh.
- **`start.bat`**: Windows spouštěč — spustí `npm run dev` a rovnou otevře prohlížeč.
- **Produkční nasazení** na Vercel:
  `https://ms-pantry-oyrt7fqn7-goldstandard.vercel.app`
- **DeepL Edge Function** nasazena a ověřena v produkci; klíč uložen jako Supabase
  secret `DEEPL_API_KEY`.

### Fixed

- **Supabase Data API — 403 Forbidden**: nové projekty s API Keys v2 (`sb_publishable_`)
  vyžadují explicitní vystavení tabulek v Integrations → Data API → Settings →
  Exposed tables. Bez tohoto nastavení REST API odmítá všechny requesty s 403 i pro
  přihlášeného uživatele. Zdokumentováno v README (sekce Řešení problémů).
- **Seed výchozích dat**: trigger `on_auth_user_created` neproběhne, pokud se
  `schema.sql` spustilo před prvním přihlášením. Přidána záchranná instrukce do README —
  ruční volání `SELECT public.seed_defaults_for_user('uuid')` v SQL Editoru.
- **Port magic-linku**: `emailRedirectTo: window.location.origin` zajišťuje, že
  magic-link vždy přesměruje na port, ze kterého byl odeslán (5173 nebo 5174).

---

## [0.1.0] — 2026-06-20

První funkční verze (MVP). Kompletní implementace, build prochází, UI a přepínání
jazyků ověřeno na dev serveru.

### Added

- **Skeleton PWA**: React + TypeScript + Vite, Tailwind, `vite-plugin-pwa`
  (manifest, service worker, instalovatelnost, offline app shell).
- **Trojjazyčné UX** (cs / en / zh) přes `react-i18next` s přepínačem jazyka a
  detekcí/uložením volby; pomocný `displayName()` pro výběr jazyka názvu s fallbackem.
- **Autentizace** přes Supabase magic-link (přihlášení e-mailem bez hesla).
- **Datový model** v Postgresu: `locations`, `categories`, `items`, `product_profiles`
  + Row Level Security (každý vidí jen svoje data) a seed výchozích dat přes trigger.
- **Více oddělených skladů** (Chata, Domácnost) s vlastními prahy expirace; přepínač
  skladu filtruje celou aplikaci.
- **CRUD potravin** + dashboard: výchozí seskupení podle kategorií s agregací
  (počet balení + porcí), volitelný plochý pohled podle expirace, hledání a filtr.
- **Hlídání expirace** s barevnými stavy (prošlé / kritické / brzy / v pořádku),
  prahy se berou z aktivního skladu.
- **Počet porcí na balení** + **postupné učení** podle čárového kódu
  (`product_profiles` — předvyplnění a upsert naučených hodnot).
- **Skenování čárových kódů** kamerou (ZXing, lazy-loaded) + dohledání produktu přes
  **Open Food Facts** (název, značka, obrázek, návrh kategorie).
- **Strojový překlad názvů** přes Supabase Edge Function `translate` (DeepL),
  s cache do `name_i18n`; bez klíče appka funguje, jen bez doplněných překladů.
- **Správa kategorií a skladů** ve vlastních obrazovkách.
- **Dokumentace**: README (onboarding), architektura, stav vývoje, původní plán.

### Security

- Row Level Security na všech tabulkách (`user_id = auth.uid()`).
- DeepL API klíč drží Edge Function jako server-side secret, nikdy není v prohlížeči.

[Unreleased]: https://github.com/goldstandard/ms-pantry/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/goldstandard/ms-pantry/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/goldstandard/ms-pantry/releases/tag/v0.1.0
