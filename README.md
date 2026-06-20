# MS Pantry 🥫

> Evidence potravin na chatě i doma. Naskenuješ čárový kód, appka dohledá produkt,
> ty doplníš datum expirace — a ona hlídá, co se blíží ke konci.

PWA (běží v prohlížeči na notebooku i mobilu, jde nainstalovat na plochu telefonu).
Skenování kamerou nebo ručním zadáním kódu, automatické dohledání přes [Open Food Facts](https://openfoodfacts.org),
hlídání expirace, oddělené sklady a trojjazyčné rozhraní (🇨🇿 / 🇬🇧 / 🇨🇳).

Tohle je **vstupní soubor**. Hlubší dokumentace je v sekci [Dokumentace](#dokumentace).

---

## Co to umí

- 📷 **Sken čárového kódu** (kamerou nebo ručním zadáním čísla) → název, značka, obrázek a návrh kategorie; vyhledává postupně v Open Food Facts → UPCitemdb → Go-UPC
- 📅 **Hlídání expirace** barevně, s prahy **zvlášť pro každý sklad**
- 🏠 **Oddělené sklady** (Chata, Domácnost…) — evidence se nemíchají
- 🍽️ **Porce na balení** + **učení**: appka si podle kódu pamatuje porce a kategorii
- 📦 **Otevřené balení**: označíš, které balení je načaté — v seznamu se zobrazí oranžově a řadí se na první místo
- 📊 **Agregace** na dashboardu — součet balení a porcí v každé kategorii
- 🌍 **Tři jazyky** včetně překladu názvů položek (DeepL)
- ☁️ **Cloud sync** (Supabase) — naskenuješ na notebooku, vidíš na mobilu

---

## Produkční nasazení

Appka běží na Vercelu:
**https://ms-pantry-oyrt7fqn7-goldstandard.vercel.app**

GitHub repozitář: **https://github.com/goldstandard/ms-pantry**

---

## Spuštění lokálně

### Rychlý start (Windows)

Dvojklikem na **`start.bat`** ve složce projektu — spustí dev server a otevře prohlížeč.

### Ruční postup

#### 1) Závislosti
```bash
npm install
```

#### 2) Supabase (cloud databáze, zdarma)
1. Založ projekt na [supabase.com](https://supabase.com) → **New project**.
2. V **SQL Editor** spusť celý [`supabase/schema.sql`](supabase/schema.sql)
   (vytvoří tabulky, RLS a naseeduje výchozí sklady + kategorie ve 3 jazycích).
3. V **Integrations → Data API → Settings** nastav **Exposed tables** — zaškrtni
   všechny 4 tabulky: `locations`, `categories`, `items`, `product_profiles`.
   > ⚠️ Bez tohoto kroku REST API vrací 403 a data se vůbec nenačtou.
4. V **Project Settings → API Keys** zkopíruj **Project URL** a **Publishable key**
   (nový formát Supabase, začíná `sb_publishable_...`).
5. Vytvoř `.env.local` (vzor v [`.env.example`](.env.example)):
   ```
   VITE_SUPABASE_URL=https://tvuj-projekt.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```
6. V **Auth → URL Configuration** nastav **Site URL** na adresu, kterou zobrazí
   `npm run dev` (obvykle `http://localhost:5173`, případně `5174` je-li obsazený)
   a stejnou URL přidej do **Redirect URLs**.

#### 3) Spuštění
```bash
npm run dev
```
Otevři adresu z výpisu (`http://localhost:5173` nebo `5174`).
Zadej e-mail → přijde **magic-link** → klikneš → jsi přihlášen.
Při prvním přihlášení se automaticky vytvoří sklady i kategorie.

> 📷 Kamera funguje jen přes **HTTPS** nebo na `localhost`. Na mobil v rámci domácí
> Wi-Fi se dostaneš na `Network:` adrese z výpisu `npm run dev`.

---

## Řešení problémů při prvním spuštění

### API vrací 403 / sklady a kategorie se nenačtou

Příčina: tabulky nejsou vystavené v Data API (nové projekty Supabase to nevystavují automaticky).

Jdi do Supabase → **Integrations → Data API → Settings → Exposed tables**
a zaškrtni: `locations`, `categories`, `items`, `product_profiles`.

### Sklady/kategorie jsou prázdné i po přihlášení

Seed trigger mohl proběhnout ještě před přihlášením. Spusť v Supabase SQL Editoru:
```sql
-- zjisti své UUID
SELECT id, email FROM auth.users;

-- spusť seed přímo s tvým UUID
SELECT public.seed_defaults_for_user('zde-vloz-uuid');
```

### Magic-link přesměruje na špatný port nebo selže

Zkontroluj, že **Site URL** v Supabase Auth odpovídá skutečnému portu dev serveru.
Vite zkusí 5173, pokud je obsazený, vezme 5174 — oba musí být v **Redirect URLs**.

### Indikátor otevřeného balení nefunguje / chyba při ukládání

Sloupec `is_opened` není součástí původního `schema.sql` — byl přidán jako migrace.
Spusť v Supabase SQL Editoru:
```sql
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS is_opened boolean NOT NULL DEFAULT false;
```

---

## Volitelné: Go-UPC (třetí fallback pro čárové kódy)

Pokud Open Food Facts ani UPCitemdb produkt nenajdou, appka může zkusit ještě Go-UPC.
Bezplatný účet dá 100 vyhledání měsíčně.

1. Zaregistruj se na [go-upc.com](https://go-upc.com) → Dashboard → zkopíruj API Key.
2. Přidej do `.env.local`:
   ```
   VITE_GO_UPC_KEY=tvuj-klic
   ```
3. Pro produkci (Vercel) přidej stejnou proměnnou v nastavení projektu → Environment Variables.

Bez tohoto klíče appka funguje normálně — Go-UPC fallback se tiše přeskočí.

---

## Volitelné: překlad názvů (DeepL)

Bez tohoto kroku appka funguje normálně — jen se automaticky nedoplní překlad názvů
položek do angličtiny a čínštiny.

```bash
# Bezplatný klíč na https://www.deepl.com/pro-api (1 M znaků celoživotně)
npx supabase login
npx supabase link --project-ref TVUJ_PROJECT_REF
npx supabase secrets set DEEPL_API_KEY=tvuj-deepl-klic
npx supabase functions deploy translate
```

---

## Nasazení na Vercel (produkce / mobil)

1. Nahraj na GitHub, importuj v [vercel.com](https://vercel.com) (detekuje Vite automaticky).
2. Nastav env proměnné `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`.
3. Produkční URL přidej v Supabase do **Auth → Redirect URLs**.
4. Na telefonu otevři URL → menu prohlížeče → **Přidat na plochu**.

---

## Skripty

| Příkaz | Co dělá |
|---|---|
| `npm run dev` | vývojový server |
| `npm run build` | typecheck + produkční build |
| `npm run preview` | náhled produkčního buildu |
| `npm run lint` | jen typová kontrola |

`start.bat` (Windows) spustí `npm run dev` a rovnou otevře prohlížeč.

---

## Dokumentace

| Dokument | O čem je |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | jak je appka postavená — stack, datový model, toky, bezpečnost |
| [docs/STATUS.md](docs/STATUS.md) | aktuální stav vývoje, co je ověřené, známá omezení, roadmapa |
| [docs/PLAN.md](docs/PLAN.md) | původní schválený plán (historie záměru) |
| [CHANGELOG.md](CHANGELOG.md) | historie změn po verzích |

Stručná struktura projektu je v [ARCHITECTURE.md → Struktura projektu](docs/ARCHITECTURE.md#3-struktura-projektu).
