# Factory Ops

A complete, production-shaped works desk — built with Vite + React +
TypeScript, no CSS framework, no backend required. It's an example app that
ships with [Adminium](https://adminium.dev): advance a production run on the
floor, then switch to the office and run the order book — receive a part
delivery, make up a short line, pick and ship it, take a payment against the
invoice.

The demo is dressed as **Kilnworks**, a fictional 22-person ceramics works
making tableware for restaurants and independent shops, so a bill of materials
is clay, a glaze, a sheet of tissue and a backstamp rather than lorem ipsum.
Kiln firings are the production batches; a warped rim is a second.

**Live demo → [adminium.dev/demo/factory-ops](https://adminium.dev/demo/factory-ops)**

## What it does

- **Two personas in one build.** The demo dock switches between the Floor and
  the Office, and the loop closes across it: an order line the office cannot
  fill gets a **Make it** button, which raises a run for exactly the shortfall
  and drops it into Queued on the floor board.

- **Two real engines.**
  [`src/lib/production.ts`](src/lib/production.ts) is the floor: bill-of-
  materials explosion, `available = on hand − allocated`, reorder flags, the
  six-stage run machine with a short-component block, output recording (good +
  seconds → yield, components issued, finished stock raised, a lot code minted)
  and a refusal to overproduce.
  [`src/lib/ledger.ts`](src/lib/ledger.ts) is the office: allocation states,
  purchase-order receipts including partials, invoice line maths, the payments
  ledger with a running balance and aging buckets, and the period roll-up. Both
  are pure modules with no hooks and no store in them. **132 assertions** across
  [`production.test.ts`](src/lib/production.test.ts) and
  [`ledger.test.ts`](src/lib/ledger.test.ts) run against the shipped seed.

- **A block you can act on.** RUN-2317 cannot start, and the card says why: a
  `--warn` chip naming *Speckled stoneware clay* and the exact shortfall — 12 kg
  — with the advance button disabled and the reason written out beside it. Never
  just greyed, because a greyed button on a shop floor is a question somebody
  has to walk across the building to ask. Receive the 120 kg still open on
  PO-8813 and the block clears.

- **One subtraction, made obvious.** Available is on hand minus allocated, that
  is the number people misread, and the stock table says so in its own subtitle,
  rules the available column above its total, and colours it amber at the
  reorder point and red at zero.

- **A movement history that adds up.** Every receipt, issue, production yield,
  shipment and adjustment with a running balance down the right. The opening
  balance is derived rather than stored — and it re-bases when you filter, so
  the column keeps adding up the moment you click a chip.

- **Money that refuses to lie.** The record-payment popover takes partial
  amounts and **refuses** an overpayment rather than clamping it, naming the
  excess. A part-received purchase order leaves its line open at the outstanding
  quantity and raises stock immediately, with a movement row to prove it.

- **The books are a view, not an accounting product.** Revenue, cost of goods
  from the run costings, gross margin, receivables and payables with aging, and
  per-product margin sorted worst-first. No double entry, no chart of accounts,
  no journals, no period close. It ships with one honest line under it:
  *the full ledger lives in your Adminium dashboard — this is the shop-floor
  view of the money.*

- **Eight languages, including a right-to-left one.** English, German, French,
  Czech, Danish, Simplified and Traditional Chinese, and Egyptian Arabic.
  Plurals go through `Intl.PluralRules` in each locale's own CLDR order — Czech
  gets its three forms, Arabic its six. Item names, glazes, stations and kiln
  programmes are stored as translation keys, so they move with the chrome rather
  than leaving an English island inside a translated screen.

- **RTL by construction.** Every positional rule in the stylesheets is a CSS
  logical property, so stamping `dir="rtl"` on `<html>` mirrors the sidebar, the
  board, the ledger gutter and the demo dock with no second stylesheet. This app
  is dense with numbers and every one of them is isolated, so the bidi algorithm
  cannot reorder a measurement — "190 kg" never becomes "kg 190".

- **Light / dark themes** via CSS custom properties. The app follows your
  operating system on first load; the sun/moon toggle latches it.

- **A pinned clock, and no chip to move it.** Nothing user-visible reads
  `Date.now()`. "Now" is Tuesday 28 July 2026, 10:15, mid-way through a
  07:00–15:30 shift, so every machine opens on the same board. Unlike the other
  example apps there is deliberately **no clock control**: on a works desk the
  Floor advances the board, not the hour.

- **No bitmaps, no external requests.** A finished piece is a two-stop gradient
  of the glaze it is finished in, with an oversized icon and a small mono SKU
  chip; a component gets a flatter, unglazed tile so the two read apart at a
  glance. Fonts are self-hosted woff2. The app works offline and behind a
  firewall.

## Local development

```bash
npm install
```

```bash
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

### Driving the demo

The dock in the corner is the demo. Everything else is the product.

| Control | What it does |
| --- | --- |
| **Floor / Office** | Switches persona. The loop closes across it — this is the thing to show. |
| **Language** | Eight locales, including Arabic, which flips the whole layout to RTL. |
| **Theme** | Latches light or dark over the OS preference. |
| **Reset** | Puts the seeded shift back the way it started. |

A ninety-second tour: **Floor board** → RUN-2317 is blocked, short by 12 kg of
speckled stoneware clay → switch to **Office** → **Purchasing** → *Receive* on
PO-8813, take the outstanding 120 kg → back to **Floor board**, the block has
cleared → advance it → open a run and record output; the yield recomputes as you
type and the form refuses to take more than the run calls for → **Orders** →
SO-5108 is short 36 bowls, press **Make it** → the new run is on the board →
**Dispatch** → tick the lines and record the shipment → **Invoices** → open the
44-day-old one and try to overpay it.

## Deploy

- **Vercel** — import the repo. Build command `npm run build`, output `dist`.
- **DigitalOcean App Platform** — import the repo; it builds with the same
  command.
- **Host anywhere** — `npm run build` produces a fully static `dist/` you can
  drop on any static host (Netlify, Cloudflare Pages, S3, GitHub Pages…). Or
  build the container:

  ```bash
  docker build -t factory-ops .
  ```

### Build scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check + build to `dist/` at base `/` (root deploys). |
| `npm run build:demo` | Build to `dist/` at base `/demo/factory-ops/` (Adminium demo). |
| `npm run preview` | Preview a production build locally. |
| `npm test` | Run both engine suites. |

## Full implementation (self-host)

There are two ways to run this works.

**One click — the frontend on its own.** The deploy routes above put the works
desk up by itself, running on the bundled demo shift. No database, no dashboard
— a fully static preview.

**One command — the whole stack.**
[`docker-compose.yml`](docker-compose.yml) stands up Postgres (seeded by default
with the *same* items, runs, orders, invoices and movements), an auto-generated
Adminium dashboard that runs that real database, and the desk:

```bash
cp .env.example .env      # then set ADMINIUM_SECRET — e.g. openssl rand -hex 32
```

```bash
docker compose up
```

- **Works desk** → http://localhost:8080
- **Adminium dashboard** → http://localhost:4600

On first boot, `works-db` applies [`db/schema.sql`](db/schema.sql), installs the
demo bookkeeping, and then loads [`db/seed.sql`](db/seed.sql) unless you set
`DEMO_DATA=0` — see [Demo data](#demo-data) below. Adminium imports the works
database (`kilnworks`) as its first source connection, introspects the schema,
and generates the office. Finish the ~1-minute first-run wizard at `:4600` —
it's pre-pointed at the DB. The install spec Adminium reads to configure itself
is [`manifest.json`](manifest.json).

The seed is the app's own shift, not a second fiction: the same Tuesday pinned
to 28 July 2026, the same 34 items, the same six runs, the same 12 kg shortfall,
the same seven invoices with two overdue at eleven and forty-four days. Open the
dashboard and RUN-2317 is the row you were just looking at on the board.

`db/seed.sql` is **generated** from `src/data/demo.ts` so the two can never
drift. To regenerate it after changing the fiction:

```bash
npx esbuild src/data/demo.ts --bundle --format=esm --outfile=/tmp/demo.mjs
```

…then run the small emitter documented at the top of `db/seed.sql`.

### Demo data

The works comes up loaded: `docker compose up` puts the Kilnworks shift into
`kilnworks`, and the desk and the dashboard both open on it. For an empty
database instead — the same schema, no rows — set `DEMO_DATA=0` in `.env` before
the first `docker compose up`. Neither choice is permanent.

| Command | What it does |
| --- | --- |
| `npm run demo:status` | What is loaded right now, table by table. |
| `npm run demo:import` | Load `db/seed.sql`. |
| `npm run demo:wipe` | Remove the demo rows — the schema and your own rows stay. |
| `npm run demo:reset` | Wipe, then import a fresh copy. |

A wipe takes out only the rows the seed put there: your schema stays, and a demo
row your data now depends on is kept rather than deleted out from under you and
reported under `kept`. Your own rows stay with one exception — `ON DELETE
CASCADE` still applies, so a demo invoice takes its payments with it and a demo
order takes its lines, including ones you recorded yourself; those are counted
separately as `cascaded` rather than folded into the total. `wipe` and `reset`
ask first — `npm run demo:wipe -- --yes` skips the question, which is what you
need in a script, where there is nobody to ask. [`db/README.md`](db/README.md)
covers the rest, including how the wipe knows what is demo data and how to
point the commands at a Postgres outside the compose stack.

## The split: the floor and the office

The app you deploy is **the floor and the order book**. The dashboard Adminium
generates from your schema is **the ledger and the history**. That is the
product story, not a limitation:

| In this app | In the generated dashboard |
| --- | --- |
| Advancing today's runs and recording output | Every table as records, with full CRUD |
| What is on the shelf, and what is promised | The whole movement history, across years |
| Receiving, picking, shipping, invoicing | Imports, exports and bulk edits |
| A glanceable view of the money | The full ledger, reporting and period accounts |

The manifest scaffolds 20 tables into your connected database. The scope
boundary holds on both sides of the split: there is no journal table anywhere in
[`db/schema.sql`](db/schema.sql), no chart of accounts and no posting period,
and nothing in the manifest that would show one.

## Connecting to Adminium

All data access goes through a thin `DataSource` interface
([`src/data/source.ts`](src/data/source.ts)) with a single `demoSource`
implementation backed by the bundled seed. **Today the deployed demo is demo
data only — nothing is persisted and no payment is taken.** Once Adminium's
browser-safe publishable key (`adm_pub_…`) ships, the frontend will read and
write live data through the Adminium records API via a second `DataSource`
implementation, without touching any of the screens or the store. The seam is
already in place; the key is the only missing piece.

### Add-ons

The Dispatch screen and the Works screen each carry one **add-on slot**. With
nothing connected they draw exactly what they always drew: the Dispatch card
ends in its Ship button, and the Works screen says in words that nothing is
connected and that orders leave the way they always have. That is the point of
the seam rather than a caveat about it — an add-on is optional, and the desk is
finished without one.

Connect one from **Works** and the Dispatch card grows a *Book a collection*
action under the Ship button, for orders that are being sent. An order the
customer collects — `sales_orders.deliver_to_*` all null — is not offered a
carrier at all, because collecting is an answer rather than a blank.

The seam itself is installed rather than hand-written, and two scripts keep it
honest. Both ship here so a cloner and CI can run them:

```sh
npm run host-kit:status   # the installed seam matches packages/host-kit
npm run add-ons:status    # the vendored add-ons match the add-ons monorepo
```

`npm test` runs the seam's guards over this repo: the company-name grep, the
affiliation-line sweep, the vocabulary ban, the payload-cast ban, the vendored
copy checks and the stylesheet rule pair. Four more need a rendered DOM and are
not running here — they are printed by name, with what each one leaves open, on
every test run.

### What is deliberately out of scope

- **Accounting.** The money screen is a view over data this app already holds.
  No double entry, no chart of accounts, no journals, no tax filing, no period
  close, and no claim anywhere that it replaces accounting software.
- **Routing steps with per-operation sign-off.** The run panel records output
  and carries three stage sign-offs; a full routing sheet is a bigger product.
- **Multi-site stock.** One works, one building, one stock ledger by design.
- **Supplier lead-time forecasting.** Lead time and on-time percentage are
  recorded facts, not predictions.

## Project structure

```
src/
  app/         App shell + the exhaustive 16-view switch
  state/       Zustand store (persona, the pinned shift, items, runs,
               movements, orders, invoices, counts, drafts, toasts)
  data/        demo.ts (the seeded works), types.ts, source.ts (DataSource seam)
  i18n/        8-locale runtime, locale registry, ambient bridge,
               strings/ (chrome, screens, seeded nouns)
  lib/         production.ts + ledger.ts (the engines) + tests,
               format.ts (locale-aware output)
  screens/     Floor.tsx  (board, stations, firings, seconds, handover)
               Office.tsx (stock, counts, purchasing, suppliers, orders,
                           dispatch, invoices, recipes, the books)
               Works.tsx  (the works' own address + what is connected to it)
               NotFound.tsx
  add-ons/     the add-on seam: slots.ts (the two this app hosts),
               registry.ts (the only shipped file that names an add-on),
               hostRecords.ts (this works' records → the neutral payloads),
               kit/ + host-kit.config.ts (installed seam, see below),
               vendor/ (synced copies — never hand-edited)
  components/  shell, demo dock, four drawers, primitives
  styles/      tokens.css (canonical design tokens), base.css, components.css,
               screens.css
db/            schema.sql, generated seed.sql, demo-data toolkit + README
public/fonts/  self-hosted Manrope + JetBrains Mono (woff2)
manifest.json  the Adminium install spec (20 tables)
```

## License

[AGPL-3.0](LICENSE) © 2026 Factory Ops. A demo shipped with Adminium.
