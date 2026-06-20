# Changelog

Všechny podstatné změny v projektu MS Pantry jsou zaznamenané v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.1.0/)
a projekt používá [sémantické verzování](https://semver.org/lang/cs/).

Typy změn: **Added** (přidáno) · **Changed** (změněno) · **Deprecated** (zastaralé) ·
**Removed** (odebráno) · **Fixed** (opraveno) · **Security** (bezpečnost).

## [Unreleased]

> Sem piš změny, které čekají na vydání. Při vydání je přesuň do nové verze níže.

### Added

### Changed

### Fixed

---

## [0.1.0] — 2026-06-20

První funkční verze (MVP). Kompletní implementace, build prochází, UI a přepínání
jazyků ověřeno na dev serveru. Plné end-to-end ověření vyžaduje připojený Supabase
projekt (viz [README](README.md)).

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

[Unreleased]: https://example.com/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/releases/tag/v0.1.0
