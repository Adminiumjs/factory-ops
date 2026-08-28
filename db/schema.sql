-- Factory Ops — PostgreSQL schema (manifest §requiredSchema contract).
--
-- This is the real database behind the full self-host stack: the works desk
-- reads it (through Adminium's records API) and the auto-generated Adminium
-- dashboard is the office that runs it. Applied automatically on first boot of
-- the `works-db` container via /docker-entrypoint-initdb.d/01-schema.sql, then
-- seeded by 02-seed.sql. The seed mirrors src/data/demo.ts one for one — the
-- same twenty components, the same fourteen finished pieces, the same Tuesday
-- morning — so the desk and the dashboard show the same works.
--
-- Twenty tables, and three rules that hold across all of them.
--
-- 1. NOTHING DERIVED IS STORED. There is no column for a run's yield, an item's
--    available quantity, an invoice's status or its outstanding amount, or any
--    figure on the money screen. Every one of those is computed — in
--    src/lib/production.ts and src/lib/ledger.ts in the app, and in a view or a
--    query on the dashboard side. A stored derivation is a second source of
--    truth, and the second one is always the one that is wrong.
--
--    The single deliberate exception is `items.allocated`. Stock promised to an
--    order that has not shipped is a decision somebody made, not an arithmetic
--    consequence of the order book, so it is a real column.
--
-- 2. MONEY IS numeric(12, 2) — never a float, because a balance that drifts by
--    a hundredth is a balance nobody trusts. Quantities are numeric(12, 3): a
--    works measures clay in kilos to the gram and plates in whole units, and one
--    column has to hold both.
--
-- 3. THE MONEY SCREEN IS A VIEW, NOT A LEDGER (21 D15). There is no journal
--    table below, no chart of accounts, no posting period and no closing entry,
--    and none should be added. Revenue, cost of goods, margin, receivables and
--    payables are all derivable from sales_orders, invoices, payments,
--    purchase_orders and the item costs. That is the whole of the promise this
--    app makes about money, and the schema is where it would be easiest to
--    quietly break it.
--
-- Calendar days are `date` — an order is wanted ON the thirtieth, not at an
-- instant on it. Times of day inside the shift (a firing's start, a second's
-- timestamp) are stored as minutes since midnight, because the whole app treats
-- the shift as a grid rather than as a timeline, and a `timestamptz` would
-- invite somebody to subtract two of them and get an answer that is wrong twice
-- a year.

DROP TABLE IF EXISTS count_lines CASCADE;
DROP TABLE IF EXISTS count_sheets CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS sales_order_lines CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS purchase_order_lines CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS defects CASCADE;
DROP TABLE IF EXISTS firing_contents CASCADE;
DROP TABLE IF EXISTS firings CASCADE;
DROP TABLE IF EXISTS runs CASCADE;
DROP TABLE IF EXISTS bom_lines CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS glazes CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS works CASCADE;

-- Reference ------------------------------------------------------------------

-- WHERE THE WORKS ITSELF IS. One row, and the CHECK is what says so.
--
-- It is a table and not a constant in the app for the same reason every other
-- fact here is a table: the auto-generated dashboard IS the office, and an
-- address the office cannot correct is an address that is wrong for ever the
-- day the works moves a unit. `id = 'works'` is a single-row constraint spelt
-- the only way this schema can spell one — a works has one gate that goods
-- leave by, and a second row here would be a second answer to a question that
-- has one.
--
-- The columns match `sales_orders`' delivery columns deliberately: the same
-- five parts a label needs, in the same order, under the same names minus the
-- `deliver_to_` prefix. One address shape in this schema and not two, so
-- reading a route out of it is symmetrical at both ends.
--
-- All NOT NULL, which is the difference between this and a delivery address:
-- there a NULL means the customer collects, and here there is no answer that
-- means anything. Every works has a door.
CREATE TABLE works (
  id           text PRIMARY KEY CHECK (id = 'works'),
  name         text NOT NULL,
  line1        text NOT NULL,
  line2        text,
  city         text NOT NULL,
  postcode     text NOT NULL,
  -- ISO 3166-1 alpha-2, for `sales_orders.deliver_to_country`'s reason: it is
  -- the one field here a machine reads.
  country      text NOT NULL
);

-- A glaze is a colour on a shelf and a tint on a tile, so the two live in one
-- row. `tint_from`/`tint_to` are the gradient stops every piece in that glaze is
-- drawn with, everywhere it appears.
CREATE TABLE glazes (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  tint_from    text NOT NULL,
  tint_to      text NOT NULL
);

CREATE TABLE stations (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  icon         text NOT NULL,
  -- Who is on it this shift. One name, because it is a 22-person works and a
  -- rota table would be a bigger product than this one.
  operator     text NOT NULL
);

CREATE TABLE suppliers (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  contact      text NOT NULL,
  -- Days from order to delivery, and the share of orders that arrived by the
  -- date agreed. Both are facts about past behaviour, not forecasts.
  lead_days    integer NOT NULL CHECK (lead_days >= 0),
  on_time      numeric(4, 3) NOT NULL CHECK (on_time BETWEEN 0 AND 1),
  last_receipt date
);

CREATE TABLE customers (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  city         text NOT NULL,
  kind         text NOT NULL CHECK (kind IN ('restaurant', 'shop', 'deli'))
);

-- Stock ----------------------------------------------------------------------

-- Components and finished goods share this table because they share the
-- ledger: both are received or made, allocated, issued and counted, and the
-- movement history does not care which it is looking at.
--
-- `available` is NOT a column. It is `on_hand - allocated`, it is the number
-- people misread, and computing it in one place is the only way it stays the
-- same number on every screen.
CREATE TABLE items (
  sku          text PRIMARY KEY,
  kind         text NOT NULL CHECK (kind IN ('component', 'product')),
  name         text NOT NULL,
  unit         text NOT NULL,
  on_hand      numeric(12, 3) NOT NULL DEFAULT 0,
  -- Promised to an order that has not shipped. May legitimately exceed on_hand:
  -- over-promising is a state a works can be in, and clamping it here is how a
  -- floor stops being told why a run cannot start.
  allocated    numeric(12, 3) NOT NULL DEFAULT 0,
  reorder      numeric(12, 3) NOT NULL DEFAULT 0,
  -- What one unit costs to BUY. Components only; a finished piece's cost is
  -- built from its bill plus labour and overhead.
  cost         numeric(12, 2) NOT NULL DEFAULT 0,
  icon         text NOT NULL DEFAULT 'circle',
  glaze_id     text REFERENCES glazes (id),
  -- Finished goods only, per unit.
  labour       numeric(12, 2),
  overhead     numeric(12, 2),
  price        numeric(12, 2),
  CHECK (kind = 'component' OR price IS NOT NULL)
);

CREATE INDEX items_kind_idx ON items (kind);

-- One row per component in a finished piece's recipe. `qty_per_unit` is per
-- FINISHED unit; a run explodes it by multiplying through the run quantity.
CREATE TABLE bom_lines (
  id            serial PRIMARY KEY,
  product_sku   text NOT NULL REFERENCES items (sku) ON DELETE CASCADE,
  component_sku text NOT NULL REFERENCES items (sku),
  qty_per_unit  numeric(12, 4) NOT NULL CHECK (qty_per_unit > 0),
  position      integer NOT NULL DEFAULT 0,
  UNIQUE (product_sku, component_sku)
);

-- The floor ------------------------------------------------------------------

-- `good` and `scrap` accumulate as output is recorded; yield is derived from
-- them and never stored. `started_minutes` is elapsed time on the floor, not a
-- wall-clock stamp — the board shows "1h 36m", never "started at".
CREATE TABLE runs (
  code            text PRIMARY KEY,
  sku             text NOT NULL REFERENCES items (sku),
  qty             numeric(12, 3) NOT NULL CHECK (qty > 0),
  good            numeric(12, 3) NOT NULL DEFAULT 0,
  scrap           numeric(12, 3) NOT NULL DEFAULT 0,
  stage           text NOT NULL CHECK (stage IN
                    ('queued', 'released', 'forming', 'firing', 'finishing', 'complete')),
  station_id      text REFERENCES stations (id),
  started_minutes integer,
  lot             text,
  -- Who signed each stage off. Three nullable columns rather than a table:
  -- there are exactly three, they never grow, and a join for three names is a
  -- join nobody thanks you for.
  signed_forming   text,
  signed_firing    text,
  signed_finishing text,
  for_order       text,
  -- Raised in-app against a short order line. Such a run carries its own
  -- allocation and is never itself reported as blocked by that shortage.
  made_in_session boolean NOT NULL DEFAULT false,
  -- A run cannot record more good units than it was raised for.
  CHECK (good <= qty)
);

CREATE INDEX runs_stage_idx ON runs (stage);
CREATE INDEX runs_station_idx ON runs (station_id);

CREATE TABLE firings (
  code            text PRIMARY KEY,
  station_id      text NOT NULL REFERENCES stations (id),
  programme       text NOT NULL,
  status          text NOT NULL CHECK (status IN ('loading', 'firing', 'cooling', 'unloaded')),
  -- Degrees Celsius.
  current_temp    integer NOT NULL,
  target_temp     integer NOT NULL,
  -- Minutes since midnight.
  loaded_minutes  integer NOT NULL,
  started_minutes integer,
  due_minutes     integer NOT NULL,
  elapsed_minutes integer,
  shelves         integer NOT NULL CHECK (shelves >= 0),
  capacity        integer NOT NULL CHECK (capacity > 0),
  kwh             numeric(10, 2),
  CHECK (shelves <= capacity)
);

CREATE TABLE firing_contents (
  id          serial PRIMARY KEY,
  firing_code text NOT NULL REFERENCES firings (code) ON DELETE CASCADE,
  run_code    text NOT NULL REFERENCES runs (code),
  sku         text NOT NULL REFERENCES items (sku),
  qty         numeric(12, 3) NOT NULL CHECK (qty > 0)
);

-- Every piece set aside this shift, and why. The quantities here add up to the
-- runs' own `scrap`; a seconds log that disagrees with the board is a log
-- nobody reads twice.
CREATE TABLE defects (
  id          serial PRIMARY KEY,
  at_minutes  integer NOT NULL,
  run_code    text NOT NULL REFERENCES runs (code),
  sku         text NOT NULL REFERENCES items (sku),
  station_id  text NOT NULL REFERENCES stations (id),
  reason      text NOT NULL CHECK (reason IN
                ('warp', 'crack', 'crawl', 'pinhole', 'chip', 'handling')),
  qty         numeric(12, 3) NOT NULL CHECK (qty > 0),
  logged_by   text NOT NULL
);

-- The stock ledger. Signed: positive in, negative out. A history window rather
-- than the whole of time — the app derives an opening balance by subtracting
-- these rows from what is on hand, so a partial history still adds up.
CREATE TABLE movements (
  id          serial PRIMARY KEY,
  sku         text NOT NULL REFERENCES items (sku),
  moved_on    date NOT NULL,
  kind        text NOT NULL CHECK (kind IN
                ('receipt', 'issue', 'production', 'shipment', 'adjustment')),
  -- The run, order or count sheet that caused it. Deliberately not a foreign
  -- key: a movement outlives the document that produced it.
  ref         text NOT NULL,
  qty         numeric(12, 3) NOT NULL,
  lot         text
);

CREATE INDEX movements_sku_idx ON movements (sku, moved_on);

-- The office -----------------------------------------------------------------

CREATE TABLE purchase_orders (
  code        text PRIMARY KEY,
  supplier_id text NOT NULL REFERENCES suppliers (id),
  status      text NOT NULL CHECK (status IN ('draft', 'sent', 'part_received', 'received')),
  raised_on   date NOT NULL,
  due_on      date NOT NULL
);

-- A partial receipt is the normal case: `received` climbs toward `qty` and the
-- line stays open at the difference. Only when every line closes does the order
-- become 'received'.
CREATE TABLE purchase_order_lines (
  id        serial PRIMARY KEY,
  po_code   text NOT NULL REFERENCES purchase_orders (code) ON DELETE CASCADE,
  sku       text NOT NULL REFERENCES items (sku),
  qty       numeric(12, 3) NOT NULL CHECK (qty > 0),
  received  numeric(12, 3) NOT NULL DEFAULT 0 CHECK (received >= 0),
  cost      numeric(12, 2) NOT NULL,
  CHECK (received <= qty)
);

-- Where the goods go is on the ORDER, not on the customer, for two reasons a
-- works meets in its first month. One customer can have more than one door — a
-- second site, a warehouse behind the shop — and an order is a COPY taken when
-- it was placed, so a customer moving does not rewrite the label on a pallet
-- that has already gone out.
--
-- All six columns are nullable and they are not independently so: a NULL
-- address MEANS THE CUSTOMER COLLECTS, and the check below is what keeps that
-- meaning from decaying into "somebody stopped halfway through the form".
-- Either the five parts a label needs are all there or none of them are.
-- `deliver_to_line2` is outside the count because a one-line address is
-- ordinary, but it cannot appear without a first line above it.
--
-- Two lines and not an array, because the manifest's column vocabulary has no
-- list type that a generated dashboard would render as anything but JSON, and
-- nothing in this fiction — or in the seam this shape is borrowed from — has
-- ever needed a third.
CREATE TABLE sales_orders (
  code                text PRIMARY KEY,
  customer_id         text NOT NULL REFERENCES customers (id),
  status              text NOT NULL CHECK (status IN
                        ('draft', 'confirmed', 'picking', 'shipped', 'invoiced')),
  placed_on           date NOT NULL,
  required_by         date NOT NULL,
  deliver_to_name     text,
  deliver_to_line1    text,
  deliver_to_line2    text,
  deliver_to_city     text,
  deliver_to_postcode text,
  -- ISO 3166-1 alpha-2. A code and not a country's name, because it is the one
  -- field here a machine reads: a carrier checks a postcode against a country.
  deliver_to_country  text,
  CHECK (num_nonnulls(deliver_to_name, deliver_to_line1, deliver_to_city,
                      deliver_to_postcode, deliver_to_country) IN (0, 5)),
  CHECK (deliver_to_line2 IS NULL OR deliver_to_line1 IS NOT NULL)
);

CREATE TABLE sales_order_lines (
  id         serial PRIMARY KEY,
  so_code    text NOT NULL REFERENCES sales_orders (code) ON DELETE CASCADE,
  sku        text NOT NULL REFERENCES items (sku),
  qty        numeric(12, 3) NOT NULL CHECK (qty > 0),
  -- Units of `qty` that stock can already cover. The shortfall is qty - alloc,
  -- and it is what the "Make it" button raises a run for.
  alloc      numeric(12, 3) NOT NULL DEFAULT 0 CHECK (alloc >= 0),
  price      numeric(12, 2) NOT NULL,
  run_code   text REFERENCES runs (code)
);

-- An invoice stores only what was agreed and when. The amount, the tax, the
-- total, the status and the age are all DERIVED from the order it was raised
-- from, which is what makes it impossible for an order line and its invoice to
-- quietly disagree.
CREATE TABLE invoices (
  number      text PRIMARY KEY,
  so_code     text NOT NULL REFERENCES sales_orders (code),
  customer_id text NOT NULL REFERENCES customers (id),
  issued_on   date NOT NULL,
  due_on      date NOT NULL
);

CREATE TABLE payments (
  id          serial PRIMARY KEY,
  invoice_no  text NOT NULL REFERENCES invoices (number) ON DELETE CASCADE,
  paid_on     date NOT NULL,
  method      text NOT NULL CHECK (method IN ('transfer', 'card', 'cheque')),
  -- Partials are welcome. Overpayment is refused in the app, not here: the
  -- constraint would need to know the order total, and a CHECK that has to
  -- join is a CHECK that will be dropped the first time somebody migrates.
  amount      numeric(12, 2) NOT NULL CHECK (amount > 0)
);

CREATE INDEX payments_invoice_idx ON payments (invoice_no);

CREATE TABLE count_sheets (
  code      text PRIMARY KEY,
  zone      text NOT NULL,
  walked_by text NOT NULL,
  opened_on date NOT NULL,
  status    text NOT NULL CHECK (status IN ('open', 'posted'))
);

-- `counted` is null until somebody walks the shelf. The variance against
-- items.on_hand is derived, and posting the sheet writes it as an adjustment
-- movement rather than silently editing the balance.
CREATE TABLE count_lines (
  id         serial PRIMARY KEY,
  sheet_code text NOT NULL REFERENCES count_sheets (code) ON DELETE CASCADE,
  sku        text NOT NULL REFERENCES items (sku),
  counted    numeric(12, 3)
);
