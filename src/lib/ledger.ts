/**
 * The ledger engine — the office half of the works.
 *
 * Purchase-order receipts including partials, sales-order allocation, invoice
 * line maths, the payments ledger with a running balance and aging buckets, and
 * the period roll-up behind "The books".
 *
 * THE SCOPE BOUNDARY LIVES HERE (21 D15). This module computes a VIEW over data
 * the app already holds: revenue, cost of goods from the run costings, gross
 * margin, receivables and payables. There is no double entry anywhere below, no
 * chart of accounts, no journal, no period close and no tax return. The one line
 * the books screen carries under it says so in the product, and this comment
 * says so in the code, because the next person to add a function here is the
 * person most likely to cross the line.
 *
 * Like `production.ts`: pure, deterministic, no clock, no formatting. Dates are
 * ISO `YYYY-MM-DD` strings and are compared as calendar days, never as instants,
 * so nothing here shifts by an hour twice a year.
 */

import type {
  Invoice,
  Item,
  PurchaseOrder,
  Run,
  SalesOrder,
  SoLine,
  SoStatus,
} from "../data/types.ts";
import { round2, unitCost } from "./production.ts";

/* ----------------------------------------------------------------- calendar */

/** Parse `YYYY-MM-DD` as a LOCAL calendar day — never as UTC midnight. */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function dayDiff(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000);
}

/** How many days ago `due` was, against the pinned today. Negative = still to run. */
export function daysPast(today: string, due: string): number {
  return dayDiff(due, today);
}

/** ISO date `n` days after `iso`. Used for the due date on a raised invoice. */
export function addDays(iso: string, n: number): string {
  const d = parseDay(iso);
  d.setDate(d.getDate() + n);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ------------------------------------------------------------ sales orders */

export const SO_FLOW: SoStatus[] = ["draft", "confirmed", "picking", "shipped", "invoiced"];

export function nextSoStatus(status: SoStatus): SoStatus | null {
  const i = SO_FLOW.indexOf(status);
  return i >= 0 && i < SO_FLOW.length - 1 ? SO_FLOW[i + 1] : null;
}

export type AllocationState = "awaiting" | "making" | "short" | "allocated";

export interface Allocation {
  state: AllocationState;
  /** Units still unaccounted for. Zero unless the state is `short`. */
  shortBy: number;
  /** The run covering the shortfall, when the state is `making`. */
  run: string | null;
}

/**
 * What a line is waiting on.
 *
 * A draft order has not asked stock for anything yet, so every line is simply
 * Awaiting. Once confirmed, a line is Allocated, or it is short — and if a run
 * has been raised for the shortfall it is Making rather than Short, because the
 * problem already has an answer and the reader does not need to be alarmed
 * twice.
 */
export function allocationOf(line: SoLine, status: SoStatus): Allocation {
  if (status === "draft") return { state: "awaiting", shortBy: 0, run: null };
  if (line.run) return { state: "making", shortBy: 0, run: line.run };
  const shortBy = Math.max(0, line.qty - line.alloc);
  if (shortBy > 0) return { state: "short", shortBy, run: null };
  return { state: "allocated", shortBy: 0, run: null };
}

export function orderSubtotal(order: SalesOrder): number {
  return round2(order.lines.reduce((sum, l) => sum + l.qty * l.price, 0));
}

export function orderUnits(order: SalesOrder): number {
  return order.lines.reduce((sum, l) => sum + l.qty, 0);
}

export function orderAllocatedUnits(order: SalesOrder): number {
  return order.lines.reduce((sum, l) => sum + Math.min(l.alloc, l.qty), 0);
}

/** How much of the order stock can already cover, 0–100. */
export function orderFillPct(order: SalesOrder): number {
  const wanted = orderUnits(order);
  if (wanted <= 0) return 0;
  return Math.round((orderAllocatedUnits(order) / wanted) * 100);
}

/** Margin on the whole order at the price list, against unit cost. */
export function orderMargin(items: readonly Item[], order: SalesOrder): number {
  return round2(
    order.lines.reduce((sum, l) => {
      const product = items.find((i) => i.sku === l.sku);
      return sum + (product ? (l.price - unitCost(items, product)) * l.qty : 0);
    }, 0),
  );
}

/* --------------------------------------------------------- purchase orders */

export function poValue(po: PurchaseOrder): number {
  return round2(po.lines.reduce((sum, l) => sum + l.qty * l.cost, 0));
}

export function poReceivedValue(po: PurchaseOrder): number {
  return round2(po.lines.reduce((sum, l) => sum + l.received * l.cost, 0));
}

export function poOutstandingValue(po: PurchaseOrder): number {
  return round2(
    po.lines.reduce((sum, l) => sum + Math.max(0, l.qty - l.received) * l.cost, 0),
  );
}

export function poOpenLines(po: PurchaseOrder): number {
  return po.lines.filter((l) => l.received < l.qty).length;
}

export interface ReceiptResult {
  po: PurchaseOrder;
  /** `sku → quantity actually taken in`, after capping at what is open. */
  received: Record<string, number>;
  /** True when every line closed and the order is fully Received. */
  complete: boolean;
}

/**
 * Take a receipt against a purchase order, line by line.
 *
 * A partial receipt is the normal case, not an error: whatever arrived is
 * capped at what was still open, added to stock straight away, and the line
 * stays open at the remaining quantity with the order sitting at Part-received.
 * Only when every line closes does the order become Received.
 */
export function applyReceipt(
  po: PurchaseOrder,
  entries: Record<string, number>,
): ReceiptResult {
  const received: Record<string, number> = {};

  const lines = po.lines.map((l) => {
    const open = round2(l.qty - l.received);
    const asked = entries[l.sku] ?? 0;
    const take = round2(Math.max(0, Math.min(asked, open)));
    if (take > 0) received[l.sku] = (received[l.sku] ?? 0) + take;
    return take > 0 ? { ...l, received: round2(l.received + take) } : { ...l };
  });

  const complete = lines.every((l) => l.received >= l.qty);
  return {
    po: { ...po, lines, status: complete ? "received" : "part_received" },
    received,
    complete,
  };
}

/* ---------------------------------------------------------------- invoices */

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * An invoice's amount is DERIVED from the order it was raised against, never
 * stored on the invoice. That is what makes it impossible for an order line and
 * its invoice to quietly disagree.
 */
export function invoiceTotals(
  order: SalesOrder | null,
  taxRate: number,
): InvoiceTotals {
  const subtotal = order ? orderSubtotal(order) : 0;
  const tax = round2(subtotal * taxRate);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

export function paidOf(invoice: Invoice): number {
  return round2(invoice.payments.reduce((sum, p) => sum + p.amount, 0));
}

export function outstandingOf(invoice: Invoice, total: number): number {
  return round2(total - paidOf(invoice));
}

export type InvoiceStatus = "paid" | "overdue" | "part_paid" | "sent";

/**
 * Status, in the order a reader cares about it.
 *
 * Settled beats everything. After that, LATE beats part-paid: once a date has
 * passed, "this is late" is the useful thing to say about an invoice, and
 * hiding that behind "part-paid" is how a debt gets forgotten. The half-penny
 * tolerance keeps a rounded payment from leaving an invoice a hundredth short
 * of settled forever.
 */
export function invoiceStatus(
  invoice: Invoice,
  total: number,
  today: string,
): InvoiceStatus {
  const paid = paidOf(invoice);
  if (paid >= total - 0.005) return "paid";
  if (daysPast(today, invoice.due) > 0) return "overdue";
  if (paid > 0) return "part_paid";
  return "sent";
}

export interface LedgerRow {
  kind: "invoice" | "payment";
  /** Signed: the invoice total is positive, a payment is negative. */
  amount: number;
  balance: number;
  date: string;
  method?: Invoice["payments"][number]["method"];
}

/**
 * The payments ledger: an opening "invoice total" row, then each payment,
 * each carrying the balance it left behind. Read top to bottom it ends at what
 * is still owed.
 */
export function paymentLedger(invoice: Invoice, total: number): LedgerRow[] {
  let balance = total;
  const rows: LedgerRow[] = [
    { kind: "invoice", amount: total, balance, date: invoice.issued },
  ];
  for (const p of invoice.payments) {
    balance = round2(balance - p.amount);
    rows.push({ kind: "payment", amount: -p.amount, balance, date: p.date, method: p.method });
  }
  return rows;
}

export interface PaymentCheck {
  ok: boolean;
  /** How much over the outstanding amount the entry is. Zero when it fits. */
  over: number;
}

/** Partials are welcome; overpayment is refused with the size of the excess. */
export function checkPayment(amount: number, outstanding: number): PaymentCheck {
  const over = round2(amount - outstanding);
  if (amount <= 0) return { ok: false, over: 0 };
  return over > 0.005 ? { ok: false, over } : { ok: true, over: 0 };
}

/* ------------------------------------------------------------------- aging */

export type Bucket = "current" | "d1_30" | "d31_60" | "d61";

export const BUCKETS: Bucket[] = ["current", "d1_30", "d31_60", "d61"];

/** Which aging bucket an outstanding invoice falls in. Settled ones fall out. */
export function bucketOf(status: InvoiceStatus, late: number): Bucket | null {
  if (status === "paid") return null;
  if (late <= 0) return "current";
  if (late <= 30) return "d1_30";
  if (late <= 60) return "d31_60";
  return "d61";
}

export interface AgingRow {
  bucket: Bucket;
  amount: number;
  count: number;
}

export function agingBuckets(
  rows: readonly { bucket: Bucket | null; outstanding: number }[],
): AgingRow[] {
  return BUCKETS.map((bucket) => {
    const mine = rows.filter((r) => r.bucket === bucket);
    return {
      bucket,
      amount: round2(mine.reduce((sum, r) => sum + r.outstanding, 0)),
      count: mine.length,
    };
  });
}

/* ---------------------------------------------------------------- the books */

export interface Books {
  revenue: number;
  cogs: number;
  margin: number;
  /** Gross margin as a share of revenue, or null when nothing has sold. */
  marginPct: number | null;
  receivables: number;
  payables: number;
  /** Components on the shelf, at what they cost. */
  componentValue: number;
  /** Finished goods on the shelf, at what they cost to make. */
  finishedValue: number;
  stockValue: number;
  /** Everything issued to runs that are on the floor and not yet complete. */
  wip: number;
  wipRuns: number;
}

/**
 * The period roll-up.
 *
 * Revenue is what has left the works — orders that are Shipped or Invoiced —
 * and cost of goods is those same lines at the unit cost the run costings
 * produce. Nothing here is an accrual, an accrual reversal or a journal: it is
 * arithmetic over the order book and the stock ledger, which is exactly what
 * 21 D15 says this screen is allowed to be.
 */
export function books(
  items: readonly Item[],
  orders: readonly SalesOrder[],
  runs: readonly Run[],
  pos: readonly PurchaseOrder[],
  receivables: number,
): Books {
  const sold = orders.filter((o) => o.status === "shipped" || o.status === "invoiced");

  const revenue = round2(sold.reduce((sum, o) => sum + orderSubtotal(o), 0));
  const cogs = round2(
    sold.reduce(
      (sum, o) =>
        sum +
        o.lines.reduce((lineSum, l) => {
          const product = items.find((i) => i.sku === l.sku);
          return lineSum + (product ? unitCost(items, product) * l.qty : 0);
        }, 0),
      0,
    ),
  );

  const componentValue = round2(
    items
      .filter((i) => i.kind === "component")
      .reduce((sum, i) => sum + i.onHand * i.cost, 0),
  );
  const finishedValue = round2(
    items
      .filter((i) => i.kind === "product")
      .reduce((sum, i) => sum + i.onHand * unitCost(items, i), 0),
  );

  const onFloor = runs.filter(
    (r) => r.stage !== "queued" && r.stage !== "complete",
  );
  const wip = round2(
    onFloor.reduce((sum, r) => {
      const product = items.find((i) => i.sku === r.sku);
      if (!product) return sum;
      const made = r.good + r.scrap;
      const materials = (product.bom ?? []).reduce((m, [sku, per]) => {
        const component = items.find((i) => i.sku === sku);
        return m + (component ? component.cost * per * made : 0);
      }, 0);
      return sum + materials + (product.labour ?? 0) * made + (product.overhead ?? 0) * made;
    }, 0),
  );

  const payables = round2(
    pos
      .filter((p) => p.status === "sent" || p.status === "part_received")
      .reduce((sum, p) => sum + poOutstandingValue(p), 0),
  );

  const margin = round2(revenue - cogs);
  return {
    revenue,
    cogs,
    margin,
    marginPct: revenue > 0 ? Math.round((margin / revenue) * 1000) / 10 : null,
    receivables: round2(receivables),
    payables,
    componentValue,
    finishedValue,
    stockValue: round2(componentValue + finishedValue),
    wip,
    wipRuns: onFloor.length,
  };
}
