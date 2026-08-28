/**
 * The DataSource seam.
 *
 * This app ships in demo mode: every read below returns the seeded fiction in
 * `demo.ts`, synchronously, with no network involved. The seam exists so that
 * pointing the app at a real Adminium deployment is a change to ONE file rather
 * than a rewrite — the screens and the store already talk to this interface and
 * never import `demo.ts` for data they render.
 *
 * That second implementation now exists: `adminiumSource.ts` reads a real
 * Adminium instance through `@adminiumjs/public-client` and is swapped in by
 * `main.tsx` before React mounts. `demoSource` remains the fallback whenever
 * either build-time env var is absent — which is the case for every
 * marketplace demo, and is why that fallback is structural rather than a catch.
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
  WORKS,
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
  PostalAddress,
  PurchaseOrder,
  Run,
  SalesOrder,
  Station,
  Supplier,
} from "./types.ts";

export interface DataSource {
  /** The pinned clock. A live deployment would return the real one here. */
  now(): Now;
  /**
   * WHERE THE WORKS IS — the address goods leave from.
   *
   * On the seam rather than imported from `demo.ts` for the reason every other
   * read here is: a connected build's address is whatever the office typed into
   * the dashboard, and a constant would make the demo's Bridgwater unit the
   * permanent answer for every tenant. It is not nullable — `db/schema.sql`
   * carries a one-row table with every column NOT NULL, because a works with no
   * address is not a state, it is a works that has not been set up.
   */
  works(): PostalAddress;
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
  // Copied to the same depth an order's address is: an object holding an array.
  works: () => ({ ...WORKS, lines: [...WORKS.lines] }),
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
    SALES_ORDERS.map((o) => ({
      ...o,
      lines: o.lines.map((l) => ({ ...l })),
      // The address is a nested object with a nested array inside it, so a
      // spread of the order alone would hand every caller the SAME `lines`
      // array out of the seed — the one thing the header above promises does
      // not happen. `null` stays null: a collection has nothing to copy.
      deliverTo: o.deliverTo === null ? null : { ...o.deliverTo, lines: [...o.deliverTo.lines] },
    })),
  invoices: () => INVOICES.map((i) => ({ ...i, payments: i.payments.map((p) => ({ ...p })) })),
  countSheets: () =>
    COUNT_SHEETS.map((c) => ({ ...c, lines: c.lines.map((l) => ({ ...l })) })),
};

let current: DataSource = demoSource;
let read = false;

/**
 * The source the app is currently wired to.
 *
 * An indirection rather than a `let`, because the store reads it at MODULE
 * SCOPE — a re-exported binding would be captured at import time and a later
 * swap would change nothing.
 */
export const source: DataSource = {
  now: () => ((read = true), current.now()),
  works: () => ((read = true), current.works()),
  glazes: () => ((read = true), current.glazes()),
  items: () => ((read = true), current.items()),
  stations: () => ((read = true), current.stations()),
  runs: () => ((read = true), current.runs()),
  firings: () => ((read = true), current.firings()),
  defects: () => ((read = true), current.defects()),
  movements: () => ((read = true), current.movements()),
  suppliers: () => ((read = true), current.suppliers()),
  customers: () => ((read = true), current.customers()),
  purchaseOrders: () => ((read = true), current.purchaseOrders()),
  salesOrders: () => ((read = true), current.salesOrders()),
  invoices: () => ((read = true), current.invoices()),
  countSheets: () => ((read = true), current.countSheets()),
};

/**
 * Swap the backing source. Must happen before any module-scope read.
 *
 * The tripwire is the whole reason this is a function and not an assignment:
 * the ordering it depends on is invisible, and getting it wrong fails SILENTLY
 * — the app renders demo data against a configured backend and looks fine.
 */
export function setDataSource(next: DataSource): void {
  if (read) {
    throw new Error(
      "setDataSource() called after the store already read — import App dynamically, after the snapshot resolves.",
    );
  }
  current = next;
}

/**
 * True once a real backend is behind the seam.
 *
 * Read by the demo dock, which resets and advances seeded fiction: against real
 * rows those controls either lie or do damage, so it does not render.
 */
export function isConnected(): boolean {
  return current !== demoSource;
}
