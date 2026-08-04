/**
 * The production engine — the floor half of the works.
 *
 * Everything here is a PURE function of data passed in. Nothing reads the
 * store, nothing reads a real clock, nothing formats a string for a human. That
 * is what makes the whole of it testable in `production.test.ts` without a DOM,
 * and it is why the store can be a thin layer that applies the results.
 *
 * Four rules this module exists to hold:
 *
 *   available = on hand − allocated          (the number people misread)
 *   required  = per-unit quantity × run quantity
 *   a run is BLOCKED when a component it needs is over-allocated, and the block
 *     names the component and the shortfall
 *   a run cannot record more good units than it was raised for
 *
 * Money is in pounds and every arithmetic result is rounded to the penny at the
 * point it is produced. Floating-point drift in a stock balance is how a works
 * ends up with 47.99999999 kg of clay.
 */

import type { Item, Movement, PurchaseOrder, Run, Stage, Station } from "../data/types.ts";
import { STAGES } from "../data/types.ts";

/* ------------------------------------------------------------- arithmetic */

/** Round to the penny (or to two decimals of a quantity). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Round to one decimal — the granularity a shortfall is quoted at. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/* ------------------------------------------------------------------ stock */

export function itemBySku(items: readonly Item[], sku: string): Item | null {
  return items.find((i) => i.sku === sku) ?? null;
}

/**
 * The number the whole stock screen is built around. On hand is what is on the
 * shelf; allocated is what is already promised to an order that has not shipped;
 * available is what anybody may actually use, and it can legitimately be
 * negative when more has been promised than exists.
 */
export function available(item: Item): number {
  return round2(item.onHand - item.allocated);
}

export type StockTone = "danger" | "warn" | "ok";

/** Zero available is a stop; at or below the reorder point is a warning. */
export function stockTone(item: Item): StockTone {
  const avail = available(item);
  if (avail <= 0) return "danger";
  if (avail <= item.reorder) return "warn";
  return "ok";
}

export function belowReorder(item: Item): boolean {
  return available(item) <= item.reorder;
}

/**
 * How full the reorder bar is drawn. Twice the reorder point is treated as
 * "comfortable", so the bar has somewhere to go above the line rather than
 * pinning at full the moment stock is adequate.
 */
export function reorderBarPct(item: Item): number {
  const avail = available(item);
  const span = Math.max(item.reorder * 2, 1);
  return Math.max(3, Math.min(100, Math.round((avail / span) * 100)));
}

/** Outstanding quantity on purchase orders that are still open — what is coming. */
export function onOrder(pos: readonly PurchaseOrder[], sku: string): number {
  const open = pos.filter((p) => p.status === "sent" || p.status === "part_received");
  return round2(
    open.reduce(
      (total, p) =>
        total +
        p.lines
          .filter((l) => l.sku === sku)
          .reduce((sum, l) => sum + Math.max(0, l.qty - l.received), 0),
      0,
    ),
  );
}

export function supplierIdFor(
  suppliers: readonly { id: string; supplies: readonly string[] }[],
  sku: string,
): string | null {
  return suppliers.find((s) => s.supplies.includes(sku))?.id ?? null;
}

export function lastMovement(movements: readonly Movement[], sku: string): Movement | null {
  const mine = movements.filter((m) => m.sku === sku);
  return mine.length > 0 ? mine[mine.length - 1] : null;
}

/* ---------------------------------------------------------- the ledger view */

export interface HistoryRow extends Movement {
  /** Running balance AFTER this row. */
  balance: number;
}

export interface History {
  /** Oldest first, each carrying the balance it produced. */
  rows: HistoryRow[];
  /** The balance the first row started from. */
  opening: number;
}

/**
 * Walk an item's movements forward from a derived opening balance so the
 * right-hand column arrives exactly at what is on hand today.
 *
 * The opening balance is DERIVED (`onHand − Σ movements`) rather than stored,
 * because the seed is a window on the ledger rather than the whole of it, and a
 * stored opening would be a second number to keep in step.
 */
export function historyFor(
  movements: readonly Movement[],
  item: Item,
  kind: Movement["kind"] | "all" = "all",
): History {
  const mine = movements.filter((m) => m.sku === item.sku);
  const net = mine.reduce((sum, m) => sum + m.qty, 0);
  let balance = round2(item.onHand - net);
  const opening = balance;

  const walked: HistoryRow[] = mine.map((m) => {
    balance = round2(balance + m.qty);
    return { ...m, balance };
  });

  if (kind === "all") return { rows: walked, opening };

  /*
   * With a filter on, the opening row must be the balance the VISIBLE rows
   * start from, or the column stops adding up the moment somebody clicks a
   * chip. Take it from the first visible row rather than from the whole
   * history.
   */
  const visible = walked.filter((r) => r.kind === kind);
  const first = visible[0];
  return {
    rows: visible,
    opening: first ? round2(first.balance - first.qty) : opening,
  };
}

/** The distinct movement kinds present for one item, for the filter chips. */
export function movementKinds(
  movements: readonly Movement[],
  sku: string,
): Movement["kind"][] {
  const seen: Movement["kind"][] = [];
  for (const m of movements) {
    if (m.sku === sku && !seen.includes(m.kind)) seen.push(m.kind);
  }
  return seen;
}

/* --------------------------------------------------------------- the bill */

export interface BomRow {
  sku: string;
  /** Quantity per finished unit. */
  per: number;
  /** per × run quantity. */
  required: number;
  onHand: number;
  short: boolean;
}

/** Explode a run's bill of materials against the run quantity. */
export function bomRows(items: readonly Item[], run: Run): BomRow[] {
  const product = itemBySku(items, run.sku);
  if (!product?.bom) return [];
  return product.bom.map(([sku, per]) => {
    const component = itemBySku(items, sku);
    const required = round2(per * run.qty);
    return {
      sku,
      per,
      required,
      onHand: component?.onHand ?? 0,
      short: (component?.onHand ?? 0) < required,
    };
  });
}

export interface Shortage {
  sku: string;
  /** How much more is promised than exists, in the component's own unit. */
  qty: number;
}

/**
 * Why a run cannot start.
 *
 * A run is blocked when one of its components is OVER-ALLOCATED — more of it is
 * promised elsewhere than sits on the shelf — and the gap is that
 * over-allocation, so receiving exactly that much clears the block. The first
 * component in the bill wins, because a floor needs one reason, not four.
 *
 * A run raised during the session by "Make it" carries its own allocation: the
 * shortfall it exists to cover is the reason it was created, so it is never
 * reported as blocked by it.
 */
export function shortageFor(items: readonly Item[], run: Run): Shortage | null {
  if (run.madeInSession) return null;
  const product = itemBySku(items, run.sku);
  if (!product?.bom) return null;

  for (const [sku] of product.bom) {
    const component = itemBySku(items, sku);
    if (!component) continue;
    const gap = round1(component.allocated - component.onHand);
    if (gap > 0) return { sku, qty: gap };
  }
  return null;
}

/** Only a queued run reports a block: once released, the clay is already out. */
export function blockedShortage(items: readonly Item[], run: Run): Shortage | null {
  return run.stage === "queued" ? shortageFor(items, run) : null;
}

/* -------------------------------------------------------- the state machine */

export function nextStage(stage: Stage): Stage | null {
  const i = STAGES.indexOf(stage);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

/** A run advances unless it is finished or blocked on a short component. */
export function canAdvance(items: readonly Item[], run: Run): boolean {
  if (run.stage === "complete") return false;
  return blockedShortage(items, run) === null;
}

/**
 * Where a run lands when it is released without a station of its own. Forming
 * work goes to the first bench, firing to the first kiln, everything else to the
 * finishing table.
 */
export function defaultStationFor(stage: Stage): string | null {
  if (stage === "forming") return "ST-F1";
  if (stage === "firing") return "ST-K1";
  if (stage === "finishing") return "ST-T1";
  return null;
}

/* ------------------------------------------------------------ recording out */

/** Yield as a percentage of everything made, or null when nothing has been. */
export function yieldPct(good: number, scrap: number): number | null {
  const made = good + scrap;
  if (made <= 0) return null;
  return Math.round((good / made) * 1000) / 10;
}

/**
 * How far past the run quantity a proposed entry would take it. Zero or less
 * means the entry is fine; a positive number is exactly what the refusal
 * message names, so the reader is told the size of the problem rather than that
 * there is one.
 */
export function overBy(run: Run, good: number): number {
  return run.good + good - run.qty;
}

export function canRecordOutput(run: Run, good: number): boolean {
  return good > 0 && overBy(run, good) <= 0;
}

/** `LOT-2607-14` — zero-padded within the month, so lots sort as text. */
export function mintLot(prefix: string, seq: number): string {
  return `${prefix}${String(seq).padStart(2, "0")}`;
}

export interface OutputResult {
  items: Item[];
  runs: Run[];
  movements: Movement[];
  lot: string;
}

/**
 * Apply a recorded output.
 *
 * Every component in the bill is issued against everything MADE — good units and
 * seconds alike, because a warped plate consumed its clay — the good units are
 * added to finished stock, a lot code is minted, and one movement row is written
 * for each of them so the history proves what happened.
 */
export function applyOutput(
  items: readonly Item[],
  runs: readonly Run[],
  movements: readonly Movement[],
  run: Run,
  good: number,
  scrap: number,
  lot: string,
  date: string,
): OutputResult {
  const product = itemBySku(items, run.sku);
  const bom = product?.bom ?? [];
  const made = good + scrap;

  const nextItems = items.map((item) => {
    const line = bom.find(([sku]) => sku === item.sku);
    if (line) {
      return { ...item, onHand: Math.max(0, round2(item.onHand - line[1] * made)) };
    }
    if (item.sku === run.sku) return { ...item, onHand: round2(item.onHand + good) };
    return item;
  });

  const nextMovements: Movement[] = [
    ...movements,
    { sku: run.sku, date, kind: "production", ref: run.code, qty: good, lot },
    ...bom.map(([sku, per]) => ({
      sku,
      date,
      kind: "issue" as const,
      ref: run.code,
      qty: -round2(per * made),
    })),
  ];

  const nextRuns = runs.map((r) =>
    r.code === run.code
      ? { ...r, good: r.good + good, scrap: r.scrap + scrap, lot: r.lot ?? lot }
      : r,
  );

  return { items: nextItems, runs: nextRuns, movements: nextMovements, lot };
}

/* ------------------------------------------------------------------ costing */

/**
 * What one finished unit costs to make: its bill of materials at component
 * cost, plus the labour and overhead the works books against it.
 */
export function unitCost(items: readonly Item[], product: Item): number {
  const materials = (product.bom ?? []).reduce((sum, [sku, per]) => {
    const component = itemBySku(items, sku);
    return sum + (component ? component.cost * per : 0);
  }, 0);
  return round2(materials + (product.labour ?? 0) + (product.overhead ?? 0));
}

export interface RunCost {
  materials: number;
  labour: number;
  overhead: number;
  total: number;
  /** Total spread over the GOOD units only — seconds carry their own cost. */
  perUnit: number | null;
}

export function runCost(items: readonly Item[], run: Run): RunCost {
  const product = itemBySku(items, run.sku);
  if (!product) return { materials: 0, labour: 0, overhead: 0, total: 0, perUnit: null };

  const made = run.good + run.scrap;
  const materials = (product.bom ?? []).reduce((sum, [sku, per]) => {
    const component = itemBySku(items, sku);
    return sum + (component ? component.cost * per * made : 0);
  }, 0);
  const labour = (product.labour ?? 0) * made;
  const overhead = (product.overhead ?? 0) * made;
  const total = materials + labour + overhead;

  return {
    materials: round2(materials),
    labour: round2(labour),
    overhead: round2(overhead),
    total: round2(total),
    perUnit: run.good > 0 ? round2(total / run.good) : null,
  };
}

/** Unit margin against the price list, and that margin as a share of the rate. */
export function marginOf(
  items: readonly Item[],
  product: Item,
  rate = product.price ?? 0,
): { cost: number; margin: number; pct: number | null } {
  const cost = unitCost(items, product);
  const margin = round2(rate - cost);
  return { cost, margin, pct: rate > 0 ? Math.round((margin / rate) * 1000) / 10 : null };
}

/* ----------------------------------------------------------------- stations */

export interface StationLoad {
  station: Station;
  /** The run on it now, if any. */
  current: Run | null;
  /** Everything else assigned to it, in board order. */
  queued: Run[];
  goodToday: number;
  secondsToday: number;
  /** Share of the shift the station has been busy, 0–100. */
  utilPct: number;
}

/**
 * What is on each bench, kiln and table right now.
 *
 * A run counts as "on" a station once it has left Queued and before it reaches
 * Complete — a queued run has been assigned nothing yet, and a complete one has
 * moved on. Everything behind the first is queued behind it.
 */
export function stationLoads(
  stations: readonly Station[],
  runs: readonly Run[],
  defects: readonly { station: string; qty: number }[],
  shiftMinutes: number,
): StationLoad[] {
  return stations.map((station) => {
    const active = runs.filter(
      (r) => r.station === station.id && r.stage !== "complete" && r.stage !== "queued",
    );
    const here = runs.filter((r) => r.station === station.id);
    const busy = Math.min(
      shiftMinutes,
      here.reduce((sum, r) => sum + (r.startedMin ?? 0), 0),
    );

    return {
      station,
      current: active[0] ?? null,
      queued: active.slice(1),
      goodToday: here.reduce((sum, r) => sum + r.good, 0),
      secondsToday: defects
        .filter((d) => d.station === station.id)
        .reduce((sum, d) => sum + d.qty, 0),
      utilPct: shiftMinutes > 0 ? Math.round((busy / shiftMinutes) * 100) : 0,
    };
  });
}

/** Runs that have not been given a bench yet — they belong to the works. */
export function unassignedRuns(runs: readonly Run[]): Run[] {
  return runs.filter((r) => r.stage === "queued" && r.station === null);
}

/* ------------------------------------------------------------------- counts */

/**
 * A count line's variance: what was walked, less what the record says. Negative
 * is a shortfall on the shelf, which is the direction that costs money.
 */
export function varianceOf(item: Item, counted: number | null): number | null {
  if (counted === null || Number.isNaN(counted)) return null;
  return round2(counted - item.onHand);
}
