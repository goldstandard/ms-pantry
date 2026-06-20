# Stav vývoje — MS Pantry

> Verze **0.1.0** · aktualizováno **2026-06-20**
> Souhrn toho, co je hotové, ověřené a co zbývá. Historie změn je v
> [CHANGELOG.md](../CHANGELOG.md).

## Shrnutí

První funkční verze (MVP) je **kompletně naprogramovaná**. `npm run build` prochází
bez chyb (typecheck + bundle). UI a přepínání jazyků jsou ověřené na dev serveru.
**Plné end-to-end ověření vyžaduje připojený Supabase projekt** — viz
[kroky na uživateli](#kroky-na-uživateli).

## Stav funkcí

| Funkce | Stav | Pozn. |
|---|---|---|
| PWA skeleton (Vite, Tailwind, service worker, manifest) | ✅ hotovo | instalovatelné |
| Trojjazyčné UI (cs / en / zh) + přepínač | ✅ hotovo a ověřeno | |
| Magic-link přihlášení (Supabase Auth) | ✅ hotovo | runtime test čeká na DB |
| Datový model + RLS + seed (schema.sql) | ✅ hotovo | spustit v Supabase |
| Oddělené sklady + přepínač + per-sklad prahy | ✅ hotovo | runtime test čeká na DB |
| CRUD potravin | ✅ hotovo | runtime test čeká na DB |
| Dashboard: seskupení podle kategorií + agregace | ✅ hotovo | |
| Dashboard: plochý pohled podle expirace | ✅ hotovo | |
| Hledání + filtr kategorií | ✅ hotovo | hledá přes všechny jazyky |
| Barevné hlídání expirace (prahy ze skladu) | ✅ hotovo | |
| Porce na balení | ✅ hotovo | |
| Učení podle čárového kódu (product_profiles) | ✅ hotovo | runtime test čeká na DB |
| Skenování čárových kódů (ZXing, lazy) | ✅ hotovo | vyžaduje HTTPS/localhost + kameru |
| Open Food Facts lookup + mapování kategorií | ✅ hotovo | |
| Překlad názvů (Edge Function + DeepL) | ✅ hotovo | vyžaduje deploy funkce + klíč |
| Správa kategorií | ✅ hotovo | |
| Správa skladů a prahů | ✅ hotovo | |
| Dokumentace (README, architektura, plán, changelog) | ✅ hotovo | |

## Co je ověřené vs. neověřené

**Ověřeno (dev server):**
- Build prochází (`tsc --noEmit` + `vite build`), žádné typové chyby.
- Aplikace se načte a vyrenderuje.
- Bez env proměnných korektně ukáže Setup obrazovku.
- Přepínání jazyků cs ↔ en ↔ zh reálně mění texty UI.
- Code-splitting skeneru funguje (samostatný chunk).

**Zatím neověřeno (vyžaduje živý Supabase):**
- Přihlášení magic-linkem a vznik session.
- Vytvoření/čtení/úprava/mazání položek, kategorií, skladů.
- Skenování reálného čárového kódu → OFF lookup → předvyplnění.
- Učení porcí při druhém naskenování stejného kódu.
- Rozdílné chování prahů mezi sklady na stejném datu.
- Doplnění překladů názvů přes DeepL.
- Synchronizace mezi dvěma zařízeními.

## Kroky na uživateli

Tyto kroky nejde udělat za uživatele (vyžadují jeho účty). Detailní postup v
[README.md](../README.md).

1. **Supabase** (povinné): projekt → spustit `supabase/schema.sql` → vyplnit `.env.local`.
2. **DeepL** (volitelné): API klíč → secret + deploy Edge Function `translate`.
3. **Vercel** (pro mobil/produkci): nasazení + env proměnné + redirect URL v Supabase.

## Známá omezení / technický dluh

- **Offline jen pro app shell** — zápis dat a překlad vyžadují síť (plně offline-first
  je v roadmapě).
- **PWA ikona je jen SVG** — moderní prohlížeče zvládnou, ale pro maximální kompatibilitu
  by se hodily i PNG 192/512.
- **Bundle ~530 kB** (gzip ~150 kB bez skeneru) — únosné, šlo by dál dělit po routách.
- **Bez automatických testů** — zatím jen typová kontrola; logika v `lib/` (expiry,
  displayName, categories) je čistá a snadno testovatelná, testy nejsou napsané.
- **Bez upozornění na pozadí** — hlídání expirace je jen vizuální (dle zadání).
- **Magic-link odkazy** v changelogu/README jsou placeholdery (`example.com`) do doby
  než vznikne git repozitář / produkční URL.

## Roadmapa (mimo MVP)

- Plně offline-first režim (lokální cache + fronta změn při výpadku sítě).
- Push / e-mail upozornění na blížící se expiraci (vyžaduje běžící službu/cron).
- Sdílená „domácnost" pro více uživatelů.
- Statistiky plýtvání + nákupní seznam z docházejících zásob.
- Jednotkové testy logiky v `lib/`.
- Generování PNG ikon a lazy-loading po routách.
