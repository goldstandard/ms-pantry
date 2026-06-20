# Původní plán (schválený) — MS Pantry

> **Historický dokument.** Toto je plán tak, jak byl odsouhlasen před začátkem
> implementace (2026-06-20). Slouží k doložení původního záměru a rozhodnutí.
> **Aktuální stav** popisuje [ARCHITECTURE.md](ARCHITECTURE.md) a [STATUS.md](STATUS.md) —
> ty mají při rozporu přednost.

---

## Context

Martin chce aplikaci pro evidenci potravin skladovaných na chatě. Potřebuje:
- evidovat nakoupené potraviny s **datem expirace** a vizuálně hlídat, jak se expirace blíží,
- třídit potraviny do **kategorií** (konzervy, těstoviny apod.),
- používat appku **na notebooku i mobilu**,
- **skenovat čárový kód kamerou** a nechat aplikaci automaticky dohledat, o jaký produkt jde; expiraci a kategorii pak doplní/potvrdí ručně.

**Rozhodnutí potvrzená uživatelem:**
1. Data **sdílená přes cloud** (naskenuji na notebooku → hned vidím na mobilu).
2. Nasazení na **veřejnou URL** (zdarma, instalovatelné na mobil).
3. Hlídání expirace **vizuálně v aplikaci** (barvy, řazení, souhrn) — bez push/e-mailů.
4. **Trojjazyčné UX** — čeština / angličtina / mandarinština; přepínatelné kdykoli, včetně ovládání i **překladu názvů položek a kategorií**.
5. **Více oddělených skladů** — např. *Chata* a *Domácnost* — kompletně oddělené evidence pod jedním účtem, **každá s vlastními prahy expirace** (chata hrubší, domácnost jemnější).

## Cíl

Funkční **PWA** (Progressive Web App) — web, který běží v prohlížeči na notebooku i mobilu, jde „nainstalovat" na plochu telefonu, má přístup ke kameře a data synchronizuje napříč zařízeními.

## Technologický stack (plánovaný)

- Frontend: React 18 + TypeScript + Vite
- PWA: vite-plugin-pwa
- Styl: Tailwind CSS + lucide-react
- Routing: react-router-dom
- Skenování: @zxing/browser (ZXing), volitelně nativní BarcodeDetector
- Produktová data: Open Food Facts API (zdarma, bez klíče)
- Backend + DB + Auth: Supabase (Postgres + Auth + RLS), magic-link
- Data fetching: @tanstack/react-query
- Datum: date-fns
- Lokalizace UI: react-i18next
- Překlad názvů: DeepL přes Supabase Edge Function (alternativa LibreTranslate)
- Nasazení: Vercel

## Datový model (plánovaný)

- **locations** — oddělené sklady, každý `name_i18n`, `critical_days`, `soon_days`,
  `is_default`, `sort_order`. Seed: Chata (14/60), Domácnost (3/14).
- **items** — `location_id`, `name_i18n`, `original_lang`, `brand`, `barcode`,
  `category_id`, `quantity`, `servings_per_unit`, `unit`, `expiration_date`,
  `image_url`, `note`.
- **categories** — `name_i18n`, `slug`, `is_default`, `sort_order`. Seed 12 kategorií
  ve 3 jazycích.
- **product_profiles** — paměť učení podle `barcode` (`name_i18n`, `brand`,
  `default_category_id`, `default_servings`, `default_unit`, `times_seen`), společné
  napříč sklady.
- RLS: `user_id = auth.uid()`. Edge Function `translate` skrývá DeepL klíč.

## Funkce a obrazovky (plánované)

- **Jazyk** — přepínač cs/en/zh; `displayName()` s fallbackem.
- **Sklad** — přepínač skladu filtruje vše.
- **Login** — magic-link.
- **Dashboard** — výchozí seskupení podle kategorií, v hlavičce agregace (balení + porce),
  volitelný plochý pohled podle expirace, souhrn, filtr, hledání přes `name_i18n`.
- **Přidat položku** — sken → product_profiles → Open Food Facts → doplnění překladů →
  ruční dovyplnění → uložení do aktivního skladu + update naučeného profilu.
- **Detail / úprava** — editace názvů po jazycích, přesun do jiného skladu, spotřebováno, smazání.
- **Kategorie** — správa vlastních (překlad zadaného názvu).
- **Sklady** — správa skladů a jejich prahů.
- **Logika expirace** — prahy podle aktivního skladu: prošlé `<0`, kritické `<critical_days`,
  brzy `<soon_days`, jinak v pořádku.

## Postup implementace (plánovaný)

1. Scaffold · 2. Tailwind + PWA · 3. i18n · 4. Supabase + Auth · 5. Datový model ·
6. Sklady · 7. CRUD potravin · 8. Expirace · 9. Skenování · 10. OFF + učení ·
11. Překlad názvů · 12. Kategorie · 13. Doladění UI · 14. Nasazení.

## Co musí udělat uživatel (externí účty — zdarma)

- **Supabase**: projekt → `schema.sql` → `.env.local` → nasadit Edge Function.
- **DeepL**: API klíč → secret Edge Function. Alternativa: LibreTranslate.
- **Vercel**: nasazení + env proměnné.
- Pozn.: kamera vyžaduje **HTTPS** (funguje i na `localhost`).

## Ověření (plánované end-to-end testy)

Přidání ruční i přes sken, učení porcí, oddělení skladů, různé prahy mezi sklady,
seskupení + agregace, filtr/hledání, přepínání jazyků, překlad názvů, synchronizace
mezi zařízeními, PWA instalace a build.

## Budoucí vylepšení (mimo MVP)

Plně offline-first režim · push/e-mail upozornění · sdílená „domácnost" pro více
uživatelů · statistiky plýtvání + nákupní seznam.
