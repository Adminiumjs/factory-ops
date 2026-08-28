// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A `DataSource` backed by a real Adminium instance (28-public-surface.md §5.2,
 * 28-T28 wave 4).
 *
 * ── READS DO NOT BECOME ASYNC ──────────────────────────────────────────────
 * `loadSnapshot` fetches the whole read-set once, before React mounts, and
 * hands back the same SYNCHRONOUS shapes `demoSource` returns — so the store,
 * every selector and every screen are untouched.
 *
 * ── ELEVEN TEXT PRIMARY KEYS, AND WHY THAT MATTERS ─────────────────────────
 * `glazes.id`, `stations.id`, `suppliers.id`, `customers.id`, `items.sku`,
 * `runs.code`, `firings.code`, `purchase_orders.code`, `sales_orders.code`,
 * `invoices.number` and `count_sheets.code` all hold the app's own identifiers
 * verbatim. So every reference below is a straight pass-through and every i18n
 * key is DERIVED from one of them — `data.item.<sku>`, `data.station.<id>`,
 * `data.glaze.<id>`. Nothing is reconstructed from a column an operator can
 * rename, which is why this app needed no `slug` migration to connect.
 *
 * The eight child tables (`bom_lines`, `firing_contents`, `defects`,
 * `movements`, `*_lines`, `payments`) do carry `serial` ids, and it does not
 * matter: they are grouped by their parent's TEXT key and the app never
 * addresses a line on its own. That is the shape the fleet should copy — a
 * child row needs a stable PARENT, not a stable id of its own.
 *
 * ── TWO THINGS THE SCHEMA CANNOT SAY, MARKED NOT HIDDEN ────────────────────
 * 28-T33 counted "two missing tables" for this repo. They are:
 *
 *  1. **A firing programme is not a row.** `firings.programme` stores display
 *     text ("Glaze · 1240 °C"), and the ramp/soak/cool steps the kiln screen
 *     draws exist nowhere in `db/schema.sql`. So the programme is recognised by
 *     its text and its steps come from the catalogue below — operator-editable
 *     text used as identity, which is exactly the WS-I defect clinic-desk
 *     carries for visit types. It wants a `firing_programmes` table with a
 *     stable id and a `firing_programme_steps` child.
 *  2. **What a supplier supplies is not a column.** It is DERIVED here from the
 *     purchase-order lines actually raised against them, which is truer than a
 *     list somebody maintains — but it means a brand-new supplier appears to
 *     supply nothing until their first order.
 *
 * ── TIME COMES FROM THE SCOPE, NOT FROM THE BROWSER ────────────────────────
 * `toTenantDay`/`toTenantMinutes` against the timezone the scope publishes.
 * `new Date().getHours()` would read the VISITOR's clock and put the shift
 * clock hours out on the floor.
 */

import {
  createPublicClient,
  toTenantDay,
  toTenantMinutes,
  type PublicClient,
} from "@adminiumjs/public-client";

import type {
  CountLine,
  CountSheet,
  Customer,
  Defect,
  Firing,
  FiringStatus,
  FiringStep,
  Glaze,
  Invoice,
  Item,
  ItemKind,
  Movement,
  MovementKind,
  Now,
  PayMethod,
  Payment,
  PoLine,
  PoStatus,
  PurchaseOrder,
  Run,
  SalesOrder,
  SignoffStage,
  SoLine,
  SoStatus,
  Stage,
  Station,
  Supplier,
} from "./types.ts";
import type { DataSource } from "./source.ts";

/* --------------------------------------------------------------- the wire */

interface WireGlaze { id: string; name: string; tint_from: string; tint_to: string }
interface WireStation { id: string; name: string; icon: string; operator: string }
interface WireSupplier {
  id: string; name: string; contact: string;
  lead_days: number; on_time: string; last_receipt: string;
}
interface WireCustomer { id: string; name: string; city: string; kind: string }
interface WireItem {
  sku: string; kind: ItemKind; name: string; unit: string;
  on_hand: string; allocated: string; reorder: string; cost: string;
  icon: string; glaze_id: string | null;
  labour: string | null; overhead: string | null; price: string | null;
}
interface WireBomLine { product_sku: string; component_sku: string; qty_per_unit: string; position: number }
interface WireRun {
  code: string; sku: string; qty: string; good: string; scrap: string;
  stage: Stage; station_id: string | null; started_minutes: number | null;
  lot: string | null; signed_forming: string | null; signed_firing: string | null;
  signed_finishing: string | null; for_order: string | null; made_in_session: boolean;
}
interface WireFiring {
  code: string; station_id: string; programme: string; status: FiringStatus;
  current_temp: number; target_temp: number; loaded_minutes: number;
  started_minutes: number | null; due_minutes: number;
  elapsed_minutes: number | null; shelves: number; capacity: number; kwh: string | null;
}
interface WireFiringContent { firing_code: string; run_code: string; sku: string; qty: string }
interface WireDefect {
  at_minutes: number; run_code: string; sku: string; station_id: string;
  reason: string; qty: string; logged_by: string;
}
interface WireMovement {
  sku: string; moved_on: string; kind: MovementKind; ref: string;
  qty: string; lot: string | null;
}
interface WirePo { code: string; supplier_id: string; status: PoStatus; raised_on: string; due_on: string }
interface WirePoLine { po_code: string; sku: string; qty: string; received: string; cost: string }
interface WireSo { code: string; customer_id: string; status: SoStatus; placed_on: string; required_by: string }
interface WireSoLine { so_code: string; sku: string; qty: string; alloc: string; price: string; run_code: string | null }
interface WireInvoice { number: string; so_code: string; customer_id: string; issued_on: string; due_on: string }
interface WirePayment { invoice_no: string; paid_on: string; method: PayMethod; amount: string }
interface WireCountSheet { code: string; zone: string; walked_by: string; opened_on: string; status: CountSheet["status"] }
interface WireCountLine { sheet_code: string; sku: string; counted: string | null }

/*
 * WS-I GAP 1 — the firing programme catalogue, recognised by display text
 * because `firings.programme` is the only thing that names it. A renamed
 * programme falls through to no steps, which is visible on the kiln screen
 * rather than silent, and is itself the argument for the missing table.
 */
const PROGRAMMES: Record<string, { key: string; steps: FiringStep[] }> = {
  "Bisque · 1000 °C": {
    key: "bisque",
    steps: [
      { labelKey: "data.firestep.candle", label: "Candle", to: 200, hold: 120 },
      { labelKey: "data.firestep.ramp", label: "Ramp", to: 600, hold: 0 },
      { labelKey: "data.firestep.soak", label: "Soak", to: 1000, hold: 15 },
      { labelKey: "data.firestep.cool", label: "Cool", to: 700, hold: 60 },
    ],
  },
  "Glaze · 1240 °C": {
    key: "glaze",
    steps: [
      { labelKey: "data.firestep.ramp", label: "Ramp", to: 600, hold: 0 },
      { labelKey: "data.firestep.climb", label: "Climb", to: 1000, hold: 20 },
      { labelKey: "data.firestep.soak", label: "Soak", to: 1240, hold: 20 },
      { labelKey: "data.firestep.cool", label: "Cool", to: 900, hold: 90 },
    ],
  },
};

/* WS-I G4 — the shift, which `db/schema.sql` has nowhere to put. */
const SHIFT = { shiftStart: 7 * 60, shiftEnd: 15 * 60 + 30 } as const;

/** The columns the scope must expose, checked at boot. */
const REQUIRED = {
  glazes: ["id", "name", "tint_from", "tint_to"],
  stations: ["id", "name", "icon", "operator"],
  suppliers: ["id", "name", "contact", "lead_days", "on_time", "last_receipt"],
  customers: ["id", "name", "city", "kind"],
  items: ["sku", "kind", "name", "unit", "on_hand", "allocated", "reorder", "cost", "icon", "glaze_id", "labour", "overhead", "price"],
  bomLines: ["product_sku", "component_sku", "qty_per_unit", "position"],
  runs: ["code", "sku", "qty", "good", "scrap", "stage", "station_id", "started_minutes", "lot", "signed_forming", "signed_firing", "signed_finishing", "for_order", "made_in_session"],
  firings: ["code", "station_id", "programme", "status", "current_temp", "target_temp", "loaded_minutes", "started_minutes", "due_minutes", "elapsed_minutes", "shelves", "capacity", "kwh"],
  firingContents: ["firing_code", "run_code", "sku", "qty"],
  defects: ["at_minutes", "run_code", "sku", "station_id", "reason", "qty", "logged_by"],
  movements: ["sku", "moved_on", "kind", "ref", "qty", "lot"],
  purchaseOrders: ["code", "supplier_id", "status", "raised_on", "due_on"],
  purchaseOrderLines: ["po_code", "sku", "qty", "received", "cost"],
  salesOrders: ["code", "customer_id", "status", "placed_on", "required_by"],
  salesOrderLines: ["so_code", "sku", "qty", "alloc", "price", "run_code"],
  invoices: ["number", "so_code", "customer_id", "issued_on", "due_on"],
  payments: ["invoice_no", "paid_on", "method", "amount"],
  countSheets: ["code", "zone", "walked_by", "opened_on", "status"],
  countLines: ["sheet_code", "sku", "counted"],
};

export interface Snapshot {
  now: Now;
  glazes: Glaze[];
  items: Item[];
  stations: Station[];
  runs: Run[];
  firings: Firing[];
  defects: Defect[];
  movements: Movement[];
  suppliers: Supplier[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
  countSheets: CountSheet[];
}

/**
 * The client, or null when either build-time variable is absent.
 *
 * The emptiness check is `createPublicClient`'s, not repeated here.
 */
export function clientFromEnv(): PublicClient | null {
  return createPublicClient({
    baseUrl: import.meta.env["VITE_ADMINIUM_API_BASE_URL"] as string | undefined,
    publishableKey: import.meta.env["VITE_ADMINIUM_PUBLISHABLE_KEY"] as string | undefined,
  });
}

/** Group child rows by their parent's TEXT key. */
function groupBy<T, K extends string>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const row of rows) {
    const list = out.get(key(row)) ?? [];
    list.push(row);
    out.set(key(row), list);
  }
  return out;
}

const num = (value: string | null): number => Number(value ?? 0);

/**
 * Read a whole ref, a page at a time.
 *
 * The page size is the SCOPE's — `refs[ref].limit` is the operator's ceiling
 * and asking for more than it allows is refused. This file used to read each
 * ref in ONE request with a generous `limit`, which works only while the set is
 * small: past the operator's ceiling the server answers page one with a 200 and
 * nothing anywhere says so. `max` is this app's own guard against a runaway
 * read; hitting it is reported rather than silently dropping the tail.
 */
async function listAll<T>(
  client: PublicClient,
  ref: string,
  size: number,
  max: number,
): Promise<T[]> {
  const out: T[] = [];
  const page = Math.max(1, Math.min(size, 500));
  for (let offset = 0; offset < max; offset += page) {
    const res = await client.list<T>(ref, { limit: page, offset });
    out.push(...res.data);
    if (res.data.length < page) return out;
  }
  console.warn(`[adminium] ${ref}: stopped at ${String(max)} rows — the rest were not read.`);
  return out;
}

/**
 * Fetch the read-set and map it into the app's shapes.
 *
 * Returns `null` on ANY failure so the caller falls back to demo mode
 * structurally rather than in a catch — the marketplace demos are static clones
 * with no server and must keep working byte-identically.
 */
export async function loadSnapshot(client: PublicClient): Promise<Snapshot | null> {
  try {
    await client.assertRefs(REQUIRED);
    const config = await client.config();
    const timezone = config.timezone;
    /* The operator's per-ref page ceiling. `?? 100` is the server's own
     * conservative default for a ref the scope does not size. */
    const cap = (ref: string): number => config.refs[ref]?.limit ?? 100;

    const [
      glazes, stations, suppliers, customers, items, bomLines, runs, firings,
      firingContents, defects, movements, pos, poLines, sos, soLines, invoices,
      payments, countSheets, countLines,
    ] = await Promise.all([
      listAll<WireGlaze>(client, "glazes", cap("glazes"), 50_000),
      listAll<WireStation>(client, "stations", cap("stations"), 50_000),
      listAll<WireSupplier>(client, "suppliers", cap("suppliers"), 50_000),
      listAll<WireCustomer>(client, "customers", cap("customers"), 50_000),
      listAll<WireItem>(client, "items", cap("items"), 50_000),
      listAll<WireBomLine>(client, "bomLines", cap("bomLines"), 50_000),
      listAll<WireRun>(client, "runs", cap("runs"), 50_000),
      listAll<WireFiring>(client, "firings", cap("firings"), 50_000),
      listAll<WireFiringContent>(client, "firingContents", cap("firingContents"), 50_000),
      listAll<WireDefect>(client, "defects", cap("defects"), 50_000),
      listAll<WireMovement>(client, "movements", cap("movements"), 50_000),
      listAll<WirePo>(client, "purchaseOrders", cap("purchaseOrders"), 50_000),
      listAll<WirePoLine>(client, "purchaseOrderLines", cap("purchaseOrderLines"), 50_000),
      listAll<WireSo>(client, "salesOrders", cap("salesOrders"), 50_000),
      listAll<WireSoLine>(client, "salesOrderLines", cap("salesOrderLines"), 50_000),
      listAll<WireInvoice>(client, "invoices", cap("invoices"), 50_000),
      listAll<WirePayment>(client, "payments", cap("payments"), 50_000),
      listAll<WireCountSheet>(client, "countSheets", cap("countSheets"), 50_000),
      listAll<WireCountLine>(client, "countLines", cap("countLines"), 50_000),
    ]);

    const bomByProduct = groupBy(bomLines, (l) => l.product_sku);
    const contentsByFiring = groupBy(firingContents, (c) => c.firing_code);
    const poLinesByCode = groupBy(poLines, (l) => l.po_code);
    const soLinesByCode = groupBy(soLines, (l) => l.so_code);
    const paymentsByInvoice = groupBy(payments, (p) => p.invoice_no);
    const countLinesBySheet = groupBy(countLines, (l) => l.sheet_code);

    // WS-I GAP 2 — what a supplier supplies, derived from what has been ordered
    // from them rather than from a column that does not exist.
    const poSupplier = new Map(pos.map((po) => [po.code, po.supplier_id]));
    const suppliesBySupplier = new Map<string, Set<string>>();
    for (const line of poLines) {
      const supplier = poSupplier.get(line.po_code);
      if (supplier === undefined) continue;
      const set = suppliesBySupplier.get(supplier) ?? new Set<string>();
      set.add(line.sku);
      suppliesBySupplier.set(supplier, set);
    }

    const nowIso = new Date().toISOString();
    return {
      now: {
        date: toTenantDay(nowIso, timezone),
        minutes: toTenantMinutes(nowIso, timezone),
        ...SHIFT,
      },
      glazes: glazes.map((g) => ({
        id: g.id,
        nameKey: `data.glaze.${g.id}`,
        from: g.tint_from,
        to: g.tint_to,
      })),
      stations: stations.map((s) => ({
        id: s.id,
        nameKey: `data.station.${s.id}`,
        name: s.name,
        icon: s.icon,
        by: s.operator,
      })),
      items: items.map((i) => {
        const bom = (bomByProduct.get(i.sku) ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((l) => [l.component_sku, Number(l.qty_per_unit)] as [string, number]);
        return {
          sku: i.sku,
          kind: i.kind,
          nameKey: `data.item.${i.sku}`,
          name: i.name,
          unit: i.unit,
          onHand: num(i.on_hand),
          allocated: num(i.allocated),
          reorder: num(i.reorder),
          cost: num(i.cost),
          icon: i.icon,
          ...(i.glaze_id === null ? {} : { glaze: i.glaze_id }),
          ...(bom.length === 0 ? {} : { bom }),
          ...(i.labour === null ? {} : { labour: num(i.labour) }),
          ...(i.overhead === null ? {} : { overhead: num(i.overhead) }),
          ...(i.price === null ? {} : { price: num(i.price) }),
        } as Item;
      }),
      runs: runs.map((r) => {
        // Three nullable columns, one per stage, rather than a child table —
        // the app reads them as a partial record keyed by stage.
        const signoffs: Partial<Record<SignoffStage, string>> = {};
        if (r.signed_forming !== null) signoffs.forming = r.signed_forming;
        if (r.signed_firing !== null) signoffs.firing = r.signed_firing;
        if (r.signed_finishing !== null) signoffs.finishing = r.signed_finishing;
        return {
          code: r.code,
          sku: r.sku,
          qty: num(r.qty),
          good: num(r.good),
          scrap: num(r.scrap),
          stage: r.stage,
          station: r.station_id,
          startedMin: r.started_minutes,
          lot: r.lot,
          signoffs,
          forOrder: r.for_order,
          madeInSession: r.made_in_session,
        };
      }),
      firings: firings.map((f) => {
        const programme = PROGRAMMES[f.programme];
        return {
          code: f.code,
          station: f.station_id,
          programmeKey: programme === undefined ? "" : `data.programme.${programme.key}`,
          programme: f.programme,
          status: f.status,
          current: f.current_temp,
          target: f.target_temp,
          loaded: f.loaded_minutes,
          started: f.started_minutes,
          due: f.due_minutes,
          startedMin: f.elapsed_minutes,
          shelves: f.shelves,
          capacity: f.capacity,
          kwh: f.kwh === null ? null : num(f.kwh),
          contents: (contentsByFiring.get(f.code) ?? []).map((c) => ({
            run: c.run_code,
            sku: c.sku,
            qty: num(c.qty),
          })),
          steps: programme?.steps ?? [],
        };
      }),
      defects: defects.map((d) => ({
        at: d.at_minutes,
        run: d.run_code,
        sku: d.sku,
        station: d.station_id,
        reason: d.reason,
        qty: num(d.qty),
        by: d.logged_by,
      })),
      movements: movements.map((m) => ({
        sku: m.sku,
        date: m.moved_on,
        kind: m.kind,
        ref: m.ref,
        qty: num(m.qty),
        ...(m.lot === null ? {} : { lot: m.lot }),
      })),
      suppliers: suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contact: s.contact,
        lead: s.lead_days,
        onTime: num(s.on_time),
        last: s.last_receipt,
        supplies: [...(suppliesBySupplier.get(s.id) ?? [])],
      })),
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        // A bare slug the app expands at render, like every other closed
        // vocabulary in this schema.
        kind: c.kind,
      })),
      purchaseOrders: pos.map((po) => ({
        code: po.code,
        supplier: po.supplier_id,
        status: po.status,
        raised: po.raised_on,
        due: po.due_on,
        lines: (poLinesByCode.get(po.code) ?? []).map(
          (l): PoLine => ({ sku: l.sku, qty: num(l.qty), received: num(l.received), cost: num(l.cost) }),
        ),
      })),
      salesOrders: sos.map((so) => ({
        code: so.code,
        customer: so.customer_id,
        status: so.status,
        placed: so.placed_on,
        requiredBy: so.required_by,
        lines: (soLinesByCode.get(so.code) ?? []).map(
          (l): SoLine => ({
            sku: l.sku, qty: num(l.qty), alloc: num(l.alloc), price: num(l.price), run: l.run_code,
          }),
        ),
        // The invoice points at the order, so the back-reference is derived.
        invoice: invoices.find((inv) => inv.so_code === so.code)?.number ?? null,
      })),
      invoices: invoices.map((inv) => ({
        number: inv.number,
        order: inv.so_code,
        customer: inv.customer_id,
        issued: inv.issued_on,
        due: inv.due_on,
        payments: (paymentsByInvoice.get(inv.number) ?? []).map(
          (p): Payment => ({ date: p.paid_on, method: p.method, amount: num(p.amount) }),
        ),
      })),
      countSheets: countSheets.map((s) => ({
        code: s.code,
        zoneKey: `data.zone.${s.zone}`,
        zone: s.zone,
        by: s.walked_by,
        opened: s.opened_on,
        status: s.status,
        lines: (countLinesBySheet.get(s.code) ?? []).map(
          (l): CountLine => ({ sku: l.sku, counted: l.counted === null ? null : Number(l.counted) }),
        ),
      })),
    };
  } catch (error) {
    console.warn("[adminium] connected mode unavailable, using demo data:", error);
    return null;
  }
}

/** A synchronous `DataSource` over an already-fetched snapshot. */
export function snapshotSource(snap: Snapshot): DataSource {
  return {
    now: () => ({ ...snap.now }),
    glazes: () => snap.glazes.map((g) => ({ ...g })),
    items: () =>
      snap.items.map((i) => ({
        ...i,
        bom: i.bom ? i.bom.map((line) => [line[0], line[1]] as [string, number]) : undefined,
      })),
    stations: () => snap.stations.map((s) => ({ ...s })),
    runs: () => snap.runs.map((r) => ({ ...r, signoffs: { ...r.signoffs } })),
    firings: () =>
      snap.firings.map((f) => ({
        ...f,
        contents: f.contents.map((c) => ({ ...c })),
        steps: f.steps.map((s) => ({ ...s })),
      })),
    defects: () => snap.defects.map((d) => ({ ...d })),
    movements: () => snap.movements.map((m) => ({ ...m })),
    suppliers: () => snap.suppliers.map((s) => ({ ...s, supplies: [...s.supplies] })),
    customers: () => snap.customers.map((c) => ({ ...c })),
    purchaseOrders: () =>
      snap.purchaseOrders.map((po) => ({ ...po, lines: po.lines.map((l) => ({ ...l })) })),
    salesOrders: () =>
      snap.salesOrders.map((so) => ({ ...so, lines: so.lines.map((l) => ({ ...l })) })),
    invoices: () =>
      snap.invoices.map((inv) => ({ ...inv, payments: inv.payments.map((p) => ({ ...p })) })),
    countSheets: () =>
      snap.countSheets.map((s) => ({ ...s, lines: s.lines.map((l) => ({ ...l })) })),
  };
}
