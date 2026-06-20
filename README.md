# MS Pantry 🥫

> Evidence potravin na chatě i doma. Naskenuješ čárový kód, appka dohledá produkt,
> ty doplníš datum expirace — a ona hlídá, co se blíží ke konci.

PWA (běží v prohlížeči na notebooku i mobilu, jde nainstalovat na plochu telefonu).
Skenování kamerou, automatické dohledání přes [Open Food Facts](https://openfoodfacts.org),
hlídání expirace, oddělené sklady a trojjazyčné rozhraní (🇨🇿 / 🇬🇧 / 🇨🇳).

Tohle je **vstupní soubor**. Hlubší dokumentace je v sekci [Dokumentace](#dokumentace).

---

## Co to umí

- 📷 **Sken čárového kódu** → název, značka, obrázek a návrh kategorie z Open Food Facts
- 📅 **Hlídání expirace** barevně, s prahy **zvlášť pro každý sklad**
- 🏠 **Oddělené sklady** (Chata, Domácnost…) — evidence se nemíchají
- 🍽️ **Porce na balení** + **učení**: appka si podle kódu pamatuje porce a kategorii
- 📊 **Agregace** na dashboardu — součet balení a porcí v každé kategorii
- 🌍 **Tři jazyky** včetně překladu názvů položek (DeepL)
- ☁️ **Cloud sync** (Supabase) — naskenuješ na notebooku, vidíš na mobilu

---

## Spuštění za 3 kroky

### 1) Závislosti
```bash
npm install
```

### 2) Supabase (cloud databáze, zdarma)
1. Založ projekt na [supabase.com](https://supabase.com) → **New project**.
2. V **SQL Editor** spusť celý [`supabase/schema.sql`](supabase/schema.sql)
   (vytvoří tabulky, zabezpečení a naseeduje výchozí sklady + kategorie ve 3 jazycích).
3. V **Project Settings → API** zkopíruj **Project URL** a **anon public key**.
4. Vytvoř `.env.local` (vzor v [`.env.example`](.env.example)):
   ```
   VITE_SUPABASE_URL=https://tvuj-projekt.supabase.co
   VITE_SUPABASE_ANON_KEY=tvuj-anon-key
   ```
5. V **Auth → URL Configuration** dej do *Site URL* `http://localhost:5173`.

### 3) Spuštění
```bash
npm run dev
```
Otevři `http://localhost:5173`, přihlas se e-mailem (přijde **magic-link**, klikneš).
Při prvním přihlášení se ti vytvoří sklady i kategorie a appka je plně funkční.

> 📷 Kamera funguje jen přes **HTTPS** nebo na `localhost`. Na mobil v rámci domácí
> Wi-Fi se dostaneš na `Network:` adrese z výpisu `npm run dev`.

---

## Volitelné: překlad názvů (DeepL)

Názvy z Open Food Facts přijdou většinou jen česky. Aby se dopřekládaly do angličtiny
a čínštiny, nasaď malou Edge Function:

```bash
# klíč zdarma na https://www.deepl.com/pro-api (cs/en/zh, 500k znaků/měsíc)
supabase login
supabase link --project-ref TVUJ_PROJECT_REF
supabase secrets set DEEPL_API_KEY=tvuj-deepl-klic
supabase functions deploy translate
```

Bez tohoto kroku appka funguje normálně — jen se nedoplní automatický překlad.

---

## Nasazení na mobil

1. Nahraj na GitHub, importuj v [vercel.com](https://vercel.com) (detekuje se Vite).
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

---

## Dokumentace

| Dokument | O čem je |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | jak je appka postavená — stack, datový model, toky, bezpečnost |
| [docs/STATUS.md](docs/STATUS.md) | aktuální stav vývoje, co je ověřené, známá omezení, roadmapa |
| [docs/PLAN.md](docs/PLAN.md) | původní schválený plán (historie záměru) |
| [CHANGELOG.md](CHANGELOG.md) | historie změn po verzích |

Stručná struktura projektu je v [ARCHITECTURE.md → Struktura projektu](docs/ARCHITECTURE.md#3-struktura-projektu).
