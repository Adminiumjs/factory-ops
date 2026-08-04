/**
 * The DataSource seam.
 *
 * This app ships in demo mode: every read below returns the seeded fiction in
 * `demo.ts`, synchronously, with no network involved. The seam exists so that
 * pointing the app at a real Adminium deployment is a change to ONE file rather
 * than a rewrite — the screens and the store already talk to this interface and
 * never import `demo.ts` for data they render.
 *
 * When `@adminium/manifest` lands (Phase B), a second implementation backed by
 * `AdminiumDataSource` slots in here and `demoSource` becomes the fallback used
 * when no `adm_pub_` key is configured. The tables in `db/schema.sql` are the
 * contract that implementation will read.
 */

import {
  COUNT_SHEETS,
  CUSTOMERS,
  DEFECTS,
  FIRINGS,
  GLAZES,
  INVOICES,
  ITEMS,
  MOVEMENTS,
  NOW,
  PURCHASE_ORDERS,
  RUNS,
  SALES_ORDERS,
  STATIONS,
  SUPPLIERS,
} from "./demo.ts";
import type {
  CountSheet,
  Customer,
  Defect,
  Firing,
  Glaze,
  Invoice,
  Item,
  Movement,
  Now,
  PurchaseOrder,
  Run,
  SalesOrder,
  Station,
  Supplier,
} from "./types.ts";

export interface DataSource {
  /** The pinned clock. A live deployment would return the real one here. */
  now(): Now;
  glazes(): Glaze[];
  items(): Item[];
  stations(): Station[];
  runs(): Run[];
  firings(): Firing[];
  defects(): Defect[];
  movements(): Movement[];
  suppliers(): Supplier[];
  customers(): Customer[];
  purchaseOrders(): PurchaseOrder[];
  salesOrders(): SalesOrder[];
  invoices(): Invoice[];
  countSheets(): CountSheet[];
}

/**
 * Records are copied on the way out, nested arrays and all. A caller that
 * mutates what it is given cannot reach back into the seed, which is what lets
 * the demo reset cleanly without a page reload.
 */
export const demoSource: DataSource = {
  now: () => ({ ...NOW }),
  glazes: () => GLAZES.map((g) => ({ ...g })),
  items: () =>
    ITEMS.map((i) => ({
      ...i,
      bom: i.bom ? i.bom.map((line) => [line[0], line[1]] as [string, number]) : undefined,
    })),
  stations: () => STATIONS.map((s) => ({ ...s })),
  runs: () => RUNS.map((r) => ({ ...r, signoffs: { ...r.signoffs } })),
  firings: () =>
    FIRINGS.map((f) => ({
      ...f,
      contents: f.contents.map((c) => ({ ...c })),
      steps: f.steps.map((s) => ({ ...s })),
    })),
  defects: () => DEFECTS.map((d) => ({ ...d })),
  movements: () => MOVEMENTS.map((m) => ({ ...m })),
  suppliers: () => SUPPLIERS.map((s) => ({ ...s, supplies: [...s.supplies] })),
  customers: () => CUSTOMERS.map((c) => ({ ...c })),
  purchaseOrders: () =>
    PURCHASE_ORDERS.map((p) => ({ ...p, lines: p.lines.map((l) => ({ ...l })) })),
  salesOrders: () =>
    SALES_ORDERS.map((o) => ({ ...o, lines: o.lines.map((l) => ({ ...l })) })),
  invoices: () => INVOICES.map((i) => ({ ...i, payments: i.payments.map((p) => ({ ...p })) })),
  countSheets: () =>
    COUNT_SHEETS.map((c) => ({ ...c, lines: c.lines.map((l) => ({ ...l })) })),
};

/** The source the app is currently wired to. */
export const source: DataSource = demoSource;
