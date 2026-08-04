/**
 * Presentation helpers.
 *
 * Everything here reads the ambient locale (`i18n/ambient.ts`) rather than a
 * hook, so the store and the two pure engines can format without being inside
 * the React tree. Callers that ARE in the tree get the same output, because the
 * provider pushes its own `t` / `money` / `number` into the ambient module on
 * every render.
 *
 * Nothing in this file reads the real clock — the pinned `now` is always passed
 * in by the caller.
 *
 * This app is dense with numbers, and every one of them is a single left-to-
 * right run wherever it sits. Under `dir="rtl"` the bidi algorithm would
 * otherwise put a Latin unit ahead of its digits — "kg 190" — so quantities go
 * through `qty()`, which isolates the whole measurement rather than only the
 * number.
 */

import type {
  AllocationState,
  Bucket,
  InvoiceStatus,
} from "./ledger.ts";
import type {
  CountStatus,
  FiringStatus,
  MovementKind,
  PayMethod,
  PoStatus,
  SoStatus,
  Stage,
} from "../data/types.ts";
import {
  locale,
  money as ambientMoney,
  number as ambientNumber,
  t,
  tOr,
} from "../i18n/ambient.ts";
import type { MessageKey } from "../i18n/messages/index.ts";

/* ------------------------------------------------------------------ labels */

/**
 * Status → message key, written out rather than assembled from a template so
 * the compiler still checks every key. A stage missing from one of these tables
 * is a build error; `` t(`chrome.stage.${s}`) `` would have been a runtime
 * shrug against a union that is going to grow.
 */
export const STAGE_KEY = {
  queued: "chrome.stage.queued",
  released: "chrome.stage.released",
  forming: "chrome.stage.forming",
  firing: "chrome.stage.firing",
  finishing: "chrome.stage.finishing",
  complete: "chrome.stage.complete",
} as const satisfies Record<Stage, MessageKey>;

export const PO_STATUS_KEY = {
  draft: "chrome.po.draft",
  sent: "chrome.po.sent",
  part_received: "chrome.po.part_received",
  received: "chrome.po.received",
} as const satisfies Record<PoStatus, MessageKey>;

export const SO_STATUS_KEY = {
  draft: "chrome.so.draft",
  confirmed: "chrome.so.confirmed",
  picking: "chrome.so.picking",
  shipped: "chrome.so.shipped",
  invoiced: "chrome.so.invoiced",
} as const satisfies Record<SoStatus, MessageKey>;

export const INVOICE_STATUS_KEY = {
  paid: "chrome.inv.paid",
  overdue: "chrome.inv.overdue",
  part_paid: "chrome.inv.part_paid",
  sent: "chrome.inv.sent",
} as const satisfies Record<InvoiceStatus, MessageKey>;

export const MOVEMENT_KEY = {
  receipt: "chrome.move.receipt",
  issue: "chrome.move.issue",
  production: "chrome.move.production",
  shipment: "chrome.move.shipment",
  adjustment: "chrome.move.adjustment",
} as const satisfies Record<MovementKind, MessageKey>;

export const FIRING_KEY = {
  loading: "chrome.fire.loading",
  firing: "chrome.fire.firing",
  cooling: "chrome.fire.cooling",
  unloaded: "chrome.fire.unloaded",
} as const satisfies Record<FiringStatus, MessageKey>;

export const BUCKET_KEY = {
  current: "chrome.bucket.current",
  d1_30: "chrome.bucket.d1_30",
  d31_60: "chrome.bucket.d31_60",
  d61: "chrome.bucket.d61",
} as const satisfies Record<Bucket, MessageKey>;

export const ALLOCATION_KEY = {
  awaiting: "chrome.alloc.awaiting",
  making: "chrome.alloc.making",
  short: "chrome.alloc.short",
  allocated: "chrome.alloc.allocated",
} as const satisfies Record<AllocationState, MessageKey>;

export const METHOD_KEY = {
  transfer: "chrome.method.transfer",
  card: "chrome.method.card",
  cheque: "chrome.method.cheque",
} as const satisfies Record<PayMethod, MessageKey>;

export const COUNT_STATUS_KEY = {
  open: "chrome.count.open",
  posted: "chrome.count.posted",
} as const satisfies Record<CountStatus, MessageKey>;

export function stageLabel(stage: Stage): string {
  return t(STAGE_KEY[stage]);
}

export function poStatusLabel(status: PoStatus): string {
  return t(PO_STATUS_KEY[status]);
}

export function soStatusLabel(status: SoStatus): string {
  return t(SO_STATUS_KEY[status]);
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  return t(INVOICE_STATUS_KEY[status]);
}

export function movementLabel(kind: MovementKind): string {
  return t(MOVEMENT_KEY[kind]);
}

export function firingLabel(status: FiringStatus): string {
  return t(FIRING_KEY[status]);
}

export function bucketLabel(bucket: Bucket): string {
  return t(BUCKET_KEY[bucket]);
}

export function methodLabel(method: PayMethod): string {
  return t(METHOD_KEY[method]);
}

export function countStatusLabel(status: CountStatus): string {
  return t(COUNT_STATUS_KEY[status]);
}

/** Resolve a seed field that stores an i18n key, falling back to its English. */
export function label(key: string, fallback: string): string {
  return tOr(key, fallback);
}

/**
 * An item's name in the reader's language.
 *
 * The seed stores BOTH a key and the English it was written in, and this is the
 * only function that should ever read `item.name` directly — everything else
 * goes through here, so a locale switch renames every plate on every screen at
 * once. Passing `null` is allowed because half the callers are looking a SKU up
 * that may not resolve.
 */
export function itemName(item: { nameKey: string; name: string } | null): string {
  return item === null ? "" : tOr(item.nameKey, item.name);
}

/** The same, for a station. */
export function stationName(station: { nameKey: string; name: string } | null): string {
  return station === null ? "" : tOr(station.nameKey, station.name);
}

/** A unit code (`kg`, `ea`, `set`) in the reader's language. */
export function unitLabel(unit: string): string {
  return tOr(`data.unit.${unit}`, unit);
}

/* ------------------------------------------------------------------- money */

/**
 * A works trades in pennies, so unlike the clinic's whole pounds these carry
 * two decimals everywhere. The currency is a property of the money and not of
 * the reader's language, so it is fixed here rather than following the locale.
 */
export function money(value: number): string {
  return ambientMoney(value, "GBP");
}

export function number(value: number, opts?: Intl.NumberFormatOptions): string {
  return ambientNumber(value, opts);
}

/**
 * A quantity, at the precision it deserves: fractions of a kilo matter, whole
 * plates do not, and a per-unit figure below one needs three places before it
 * stops being zero.
 */
export function qtyNumber(value: number, dp?: number): string {
  const places =
    dp ?? (Math.abs(value) < 10 && value % 1 !== 0 ? 2 : value % 1 !== 0 ? 1 : 0);
  return ambientNumber(value, {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}

/** "190 kg" — number and unit isolated together as one LTR run. */
export function qty(value: number, unit: string, dp?: number): string {
  return `${qtyNumber(value, dp)} ${unitLabel(unit)}`;
}

/** "96.2%" — a yield, a fill, a share. */
export function pct(value: number | null): string {
  if (value === null) return "—";
  return ambientNumber(value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + "%";
}

/** "58%" — the coarser percentages: utilisation, bar labels. */
export function pctWhole(value: number): string {
  return `${ambientNumber(Math.round(value))}%`;
}

/** "1148 °C" — a kiln reading. */
export function temp(value: number): string {
  return `${ambientNumber(value)} °C`;
}

/** "148 kWh" — a firing's energy. */
export function kwh(value: number): string {
  return `${ambientNumber(value)} kWh`;
}

/** A signed movement quantity: "+180", "−42.7". A true minus, not a hyphen. */
export function signedQty(value: number): string {
  if (value < 0) return `−${qtyNumber(Math.abs(value))}`;
  return `+${qtyNumber(value)}`;
}

/** A signed amount of money, for the payment rows in a ledger. */
export function signedMoney(value: number): string {
  if (value < 0) return `−${money(Math.abs(value))}`;
  return money(value);
}

/* ------------------------------------------------------------------- times */

/**
 * A clock reading. Deliberately NOT `Intl.DateTimeFormat`: every time in this
 * app is a minute count on a 24-hour grid, and rendering 10:15 as "10:15 AM" in
 * one locale would break the column alignment the shift header depends on.
 */
export function clock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "2h 48m" / "48m" — how long a run has been on the floor. */
export function elapsed(minutes: number | null): string {
  if (minutes === null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** "20 min" / "1 hr 30 min" — a hold on a firing programme. */
export function duration(minutes: number): string {
  if (minutes === 0) return t("chrome.nohold");
  if (minutes < 60) return t("chrome.mins", { count: minutes }, minutes);
  const hrs = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return t("chrome.hrs", { count: hrs }, hrs);
  return `${t("chrome.hrs", { count: hrs }, hrs)} ${t("chrome.mins", { count: rest }, rest)}`;
}

/* ------------------------------------------------------------------- dates */

function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale(), opts).format(new Date(y, m - 1, d));
}

/** "28 Jul" — chips, table cells, movement rows. */
export function dateShort(iso: string): string {
  return fmt(iso, { day: "numeric", month: "short" });
}

/** "28 July 2026" — headers and summary rails. */
export function dateLong(iso: string): string {
  return fmt(iso, { day: "numeric", month: "long", year: "numeric" });
}

/** "Tuesday, 28 July 2026" — the floor board's own heading. */
export function dateFull(iso: string): string {
  return fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** "44 days over" — the aging chip on an overdue invoice. */
export function daysOver(days: number): string {
  return t("chrome.daysOver", { count: days }, days);
}

/** "13 days to run" — the counterpart on one that is not late yet. */
export function daysToRun(days: number): string {
  return t("chrome.daysToRun", { count: days }, days);
}

/** "in 2 days" / "due today" — how close a required-by date is. */
export function untilDue(days: number): string {
  if (days <= 0) return t("chrome.dueToday");
  return t("chrome.inDays", { count: days }, days);
}

/* --------------------------------------------------------------------- art */

function toRgb(hex: string): [number, number, number] {
  let h = (hex || "#9a3412").replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * The gradient a finished piece is drawn as, tinted by its glaze. There is no
 * photography anywhere in this app: a plate is its glaze, and the same two stops
 * follow it onto the floor board, the stock table, a dispatch line and the
 * inside of a kiln.
 */
export function glazeTile(from: string, to: string): string {
  return `linear-gradient(140deg, ${from}, ${to})`;
}

/**
 * A component's tile is deliberately flatter and unglazed — a surface, not a
 * gradient — so a bag of clay and a finished plate read apart at a glance in a
 * list of both.
 */
export const COMPONENT_TILE = "var(--surface-3)";

/** Re-export so screens can pull one translation helper from one place. */
export { t };
export type { MessageKey };
