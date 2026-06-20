# Stav vývoje — MS Pantry

> Verze **0.1.2-dev** · aktualizováno **2026-06-20**
> Souhrn toho, co je hotové, ověřené a co zbývá. Historie změn je v
> [CHANGELOG.md](../CHANGELOG.md).

## Shrnutí

MVP je **kompletně nasazený a end-to-end ověřený**. Appka běží v produkci na Vercelu,
databáze i překlad jsou živé. Lokální vývoj přes `start.bat`.

- **Produkce:** https://ms-pantry-oyrt7fqn7-goldstandard.vercel.app
- **GitHub:** https://github.com/goldstandard/ms-pantry
- **Databáze:** Supabase projekt `nyyyjsgmtxhlivslkmel`

## Stav funkcí

| Funkce | Stav | Pozn. |
|---|---|---|
| PWA skeleton (Vite, Tailwind, service worker, manifest) | ✅ ověřeno | instalovatelné na mobil |
| Trojjazyčné UI (cs / en / zh) + přepínač | ✅ ověřeno | |
| Magic-link přihlášení (Supabase Auth) | ✅ ověřeno | |
| Datový model + RLS + seed (schema.sql) | ✅ ověřeno | |
| Oddělené sklady + přepínač + per-sklad prahy | ✅ ověřeno | |
| CRUD potravin | ✅ ověřeno | |
| Dashboard: seskupení podle kategorií + agregace | ✅ ověřeno | |
| Dashboard: plochý pohled podle expirace | ✅ ověřeno | |
| Hledání + filtr kategorií | ✅ ověřeno | hledá přes všechny jazyky |
| Barevné hlídání expirace (prahy ze skladu) | ✅ ověřeno | |
| Porce na balení | ✅ ověřeno | |
| Učení podle čárového kódu (product_profiles) | ✅ ověřeno | |
| Skenování čárových kódů kamerou (ZXing, lazy) | ✅ hotovo | ověřit na mobilu v produkci |
| Ruční zadání čárového kódu | ✅ ověřeno | pole pod tlačítkem Skenovat |
| Open Food Facts lookup + mapování kategorií | ✅ ověřeno | |
| Překlad názvů (Edge Function + DeepL) | ✅ ověřeno | nasazeno, funkční |
| Správa kategorií | ✅ ověřeno | |
| Správa skladů a prahů | ✅ ověřeno | |
| Produkční nasazení (Vercel) | ✅ nasazeno | |
| `start.bat` spouštěč (Windows) | ✅ hotovo | |
| Fallback chain: OFF → UPCitemdb → Go-UPC | ✅ hotovo | Go-UPC volitelné (VITE_GO_UPC_KEY) |
| Indikátor otevřeného balení (`is_opened`) | ✅ hotovo | vyžaduje SQL migraci — viz níže |
| Dokumentace | ✅ hotovo | průběžně aktualizováno |

## Co je ověřené

**Ověřeno end-to-end:**
- Build prochází (`tsc --noEmit` + `vite build`), žádné typové chyby.
- Přihlášení magic-linkem, vznik a obnovení session.
- CRUD položek, kategorií, skladů.
- Lookup přes Open Food Facts (barcode → předvyplnění názvu, značky, kategorie).
- Ruční zadání čárového kódu — spouští stejný lookup jako kamera.
- Učení porcí: druhé zadání stejného kódu předvyplní dříve potvrzené hodnoty.
- Oddělené sklady — položky se nemíchají.
- Různé prahy expirace per-sklad, správné barevné stavy.
- Doplnění překladů přes DeepL (funkce nasazena, ověřeno).
- Přepínání jazyků cs ↔ en ↔ zh, volba přežije reload.
- Seskupení + agregace, filtr, hledání přes všechny jazyky.
- PWA instalovatelná z prohlížeče na produkci.

**Zatím neověřeno v ostrém provozu:**
- Kamerové skenování na mobilu (rate limit magic-linků bránil dokončení testu;
  kód je správný, otestovat při běžném používání).
- Synchronizace dat simultánně na dvou zařízeních.

**Vyžaduje ruční krok v Supabase:**
- Indikátor otevřeného balení — ke stávající DB je potřeba spustit v SQL Editoru:
  ```sql
  ALTER TABLE public.items
    ADD COLUMN IF NOT EXISTS is_opened boolean NOT NULL DEFAULT false;
  ```

## Kroky na uživateli — stav

Všechny povinné i volitelné kroky jsou dokončeny:

1. ✅ **Supabase**: projekt vytvořen, `schema.sql` spuštěn, tabulky vystaveny v Data API,
   `.env.local` vyplněn.
2. ✅ **DeepL**: API klíč nastaven jako secret, Edge Function `translate` nasazena.
3. ✅ **Vercel**: nasazení hotové, env proměnné nastaveny, redirect URL přidána.

## Známá omezení / technický dluh

- **Offline jen pro app shell** — zápis dat a překlad vyžadují síť (offline-first v roadmapě).
- **PWA ikona je jen SVG** — moderní prohlížeče ji přijmou; PNG 192/512 by zvýšilo kompatibilitu.
- **Bundle ~530 kB** (gzip ~150 kB bez skeneru) — únosné; lazy-loading po routách v roadmapě.
- **Bez automatických testů** — typová kontrola ano; unit testy logiky v `lib/` v roadmapě.
- **Bez push upozornění** — hlídání expirace je vizuální, dle zadání.
- **Nový formát Supabase API klíčů** (`sb_publishable_`) vyžaduje explicitní vystavení
  tabulek v Data API — zdokumentováno v README, sekce Řešení problémů.

## Roadmapa (mimo MVP)

- Plně offline-first režim (lokální cache + fronta změn při výpadku sítě).
- Push / e-mail upozornění na blížící se expiraci.
- Sdílená „domácnost" pro více uživatelů.
- Statistiky plýtvání + nákupní seznam z docházejících zásob.
- Jednotkové testy logiky v `lib/`.
- Generování PNG ikon, lazy-loading po routách.
