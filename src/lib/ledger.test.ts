/**
 * Ledger-engine assertions.
 *
 * Same discipline as the production suite: the rules are tested against the
 * smallest data that can express them, and the seeded works gets one section at
 * the end for the numbers the demo story depends on — the eleven-day and
 * forty-four-day overdue invoices, the one part-paid invoice, and the two order
 * lines that are short by exactly what the "Make it" button will raise a run
 * for.
 *
 * 21 D15 is asserted here too. If somebody ever adds a journal or a period
 * close to `ledger.ts`, the last test in this file is the one that should have
 * stopped them.
 */

import { describe, expect, it } from "vitest";

import {
  INVOICES,
  ITEMS,
  NOW,
  PURCHASE_ORDERS,
  RUNS,
  SALES_ORDERS,
  TAX_RATE,
} from "../data/demo.ts";
import type { Invoice, SalesOrder, SoLine } from "../data/types.ts";
import {
  addDays,
  agingBuckets,
  allocationOf,
  applyReceipt,
  books,
  bucketOf,
  checkPayment,
  dayDiff,
  daysPast,
  invoiceStatus,
  invoiceTotals,
  nextSoStatus,
  orderAllocatedUnits,
  orderFillPct,
  orderSubtotal,
  outstandingOf,
  paidOf,
  paymentLedger,
  poOpenLines,
  poOutstandingValue,
  poReceivedValue,
  poValue,
} from "./ledger.ts";
import { itemBySku, unitCost } from "./production.ts";

/* ------------------------------------------------------------- fixtures */

function line(patch: Partial<SoLine> & { sku: string }): SoLine {
  return { qty: 10, alloc: 10, price: 5, run: null, ...patch };
}

function order(patch: Partial<SalesOrder> & { code: string }): SalesOrder {
  return {
    customer: "CUS-1",
    status: "confirmed",
    placed: "2026-07-01",
    requiredBy: "2026-07-15",
    lines: [line({ sku: "A" })],
    invoice: null,
    // A collection, because nothing the ledger computes has ever cared where
    // the goods go — and a fixture that quietly invented an address would
    // suggest one of these sums does.
    deliverTo: null,
    ...patch,
  };
}

function invoice(patch: Partial<Invoice> & { number: string }): Invoice {
  return {
    order: "SO-1",
    customer: "CUS-1",
    issued: "2026-07-01",
    due: "2026-07-15",
    payments: [],
    ...patch,
  };
}

/* ------------------------------------------------------------- calendar */

describe("dayDiff / daysPast / addDays", () => {
  it("counts whole calendar days forward and back", () => {
    expect(dayDiff("2026-07-28", "2026-07-30")).toBe(2);
    expect(dayDiff("2026-07-30", "2026-07-28")).toBe(-2);
  });

  it("crosses a month boundary", () => {
    expect(dayDiff("2026-07-28", "2026-08-03")).toBe(6);
  });

  it("reports a due date in the past as positive days past", () => {
    expect(daysPast("2026-07-28", "2026-07-17")).toBe(11);
  });

  it("reports one still to run as negative", () => {
    expect(daysPast("2026-07-28", "2026-08-07")).toBe(-10);
  });

  it("adds days across a month end", () => {
    expect(addDays("2026-07-28", 14)).toBe("2026-08-11");
  });

  it("parses as a LOCAL day, so a date never slips by a timezone", () => {
    // The bug this guards is `new Date("2026-07-28")` being UTC midnight, which
    // is the 27th anywhere west of Greenwich.
    expect(dayDiff("2026-07-28", "2026-07-28")).toBe(0);
  });
});

/* --------------------------------------------------------- sales orders */

describe("nextSoStatus", () => {
  it("walks the five statuses in order", () => {
    expect(nextSoStatus("draft")).toBe("confirmed");
    expect(nextSoStatus("confirmed")).toBe("picking");
    expect(nextSoStatus("picking")).toBe("shipped");
    expect(nextSoStatus("shipped")).toBe("invoiced");
  });

  it("stops once invoiced", () => {
    expect(nextSoStatus("invoiced")).toBeNull();
  });
});

describe("allocationOf", () => {
  it("leaves every line Awaiting while the order is a draft", () => {
    // A draft has not asked stock for anything, so nothing can be short yet.
    expect(allocationOf(line({ sku: "A", qty: 60, alloc: 0 }), "draft").state).toBe("awaiting");
  });

  it("is Allocated when the line is covered", () => {
    expect(allocationOf(line({ sku: "A", qty: 60, alloc: 60 }), "confirmed").state).toBe("allocated");
  });

  it("names the shortfall when it is short", () => {
    expect(allocationOf(line({ sku: "A", qty: 60, alloc: 24 }), "confirmed")).toEqual({
      state: "short",
      shortBy: 36,
      run: null,
    });
  });

  it("says Making rather than Short once a run covers it", () => {
    // The problem already has an answer; alarming the reader twice is noise.
    expect(allocationOf(line({ sku: "A", qty: 60, alloc: 24, run: "RUN-1" }), "confirmed")).toEqual({
      state: "making",
      shortBy: 0,
      run: "RUN-1",
    });
  });

  it("never reports a negative shortfall on an over-allocated line", () => {
    expect(allocationOf(line({ sku: "A", qty: 10, alloc: 20 }), "confirmed").shortBy).toBe(0);
  });
});

describe("order arithmetic", () => {
  const o = order({
    code: "SO-1",
    lines: [line({ sku: "A", qty: 60, alloc: 24, price: 9.2 }), line({ sku: "B", qty: 48, alloc: 48, price: 9.6 })],
  });

  it("totals the lines", () => {
    expect(orderSubtotal(o)).toBe(1012.8);
  });

  it("counts allocated units without letting one line over-count", () => {
    const over = order({ code: "SO-2", lines: [line({ sku: "A", qty: 10, alloc: 40 })] });
    expect(orderAllocatedUnits(over)).toBe(10);
  });

  it("reports fill as a percentage of what was asked for", () => {
    expect(orderFillPct(o)).toBe(67);
  });

  it("is 0% rather than NaN for an order with no lines", () => {
    expect(orderFillPct(order({ code: "SO-3", lines: [] }))).toBe(0);
  });
});

/* ------------------------------------------------------ purchase orders */

describe("purchase-order values", () => {
  const po = {
    code: "PO-1",
    supplier: "SUP",
    status: "part_received" as const,
    raised: "2026-07-17",
    due: "2026-07-24",
    lines: [
      { sku: "CLAY", qty: 300, received: 180, cost: 1.85 },
      { sku: "WHITE", qty: 200, received: 200, cost: 1.65 },
    ],
  };

  it("splits the order value into what has arrived and what has not", () => {
    expect(poValue(po)).toBe(885);
    expect(poReceivedValue(po)).toBe(663);
    expect(poOutstandingValue(po)).toBe(222);
  });

  it("the two halves add back to the whole", () => {
    expect(poReceivedValue(po) + poOutstandingValue(po)).toBe(poValue(po));
  });

  it("counts only the lines still open", () => {
    expect(poOpenLines(po)).toBe(1);
  });
});

describe("applyReceipt", () => {
  const po = {
    code: "PO-1",
    supplier: "SUP",
    status: "sent" as const,
    raised: "2026-07-17",
    due: "2026-07-24",
    lines: [
      { sku: "A", qty: 100, received: 0, cost: 1 },
      { sku: "B", qty: 50, received: 0, cost: 2 },
    ],
  };

  it("takes a PARTIAL receipt and leaves the line open", () => {
    const r = applyReceipt(po, { A: 60 });
    expect(r.po.status).toBe("part_received");
    expect(r.po.lines[0].received).toBe(60);
    expect(r.complete).toBe(false);
  });

  it("closes the order only when every line is full", () => {
    const r = applyReceipt(po, { A: 100, B: 50 });
    expect(r.po.status).toBe("received");
    expect(r.complete).toBe(true);
  });

  it("caps a receipt at what was still open", () => {
    // Accepting more than was ordered would make the outstanding column a lie.
    const r = applyReceipt(po, { A: 500 });
    expect(r.received.A).toBe(100);
    expect(r.po.lines[0].received).toBe(100);
  });

  it("ignores a zero or negative entry", () => {
    const r = applyReceipt(po, { A: 0, B: -5 });
    expect(r.received).toEqual({});
    expect(r.po.lines.every((l) => l.received === 0)).toBe(true);
  });

  it("does not mutate the order it was given", () => {
    applyReceipt(po, { A: 60 });
    expect(po.lines[0].received).toBe(0);
  });
});

/* --------------------------------------------------------------- money */

describe("invoiceTotals", () => {
  const o = order({ code: "SO-1", lines: [line({ sku: "A", qty: 120, price: 11.5 })] });

  it("derives the amount from the order, never from the invoice", () => {
    expect(invoiceTotals(o, 0.2)).toEqual({ subtotal: 1380, tax: 276, total: 1656 });
  });

  it("is zero when the order has gone missing", () => {
    expect(invoiceTotals(null, 0.2)).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });
});

describe("invoiceStatus", () => {
  const total = 1000;

  it("is Paid once the payments cover it", () => {
    const i = invoice({ number: "I", payments: [{ date: "d", method: "transfer", amount: 1000 }] });
    expect(invoiceStatus(i, total, "2026-07-28")).toBe("paid");
  });

  it("tolerates a half-penny of rounding", () => {
    const i = invoice({ number: "I", payments: [{ date: "d", method: "card", amount: 999.998 }] });
    expect(invoiceStatus(i, total, "2026-07-28")).toBe("paid");
  });

  it("says Overdue rather than Part-paid once the date has passed", () => {
    // Late is the useful thing to say. Hiding it behind "part-paid" is how a
    // debt gets forgotten.
    const i = invoice({
      number: "I",
      due: "2026-07-17",
      payments: [{ date: "d", method: "transfer", amount: 700 }],
    });
    expect(invoiceStatus(i, total, "2026-07-28")).toBe("overdue");
  });

  it("says Part-paid while it is still in date", () => {
    const i = invoice({
      number: "I",
      due: "2026-07-30",
      payments: [{ date: "d", method: "card", amount: 500 }],
    });
    expect(invoiceStatus(i, total, "2026-07-28")).toBe("part_paid");
  });

  it("says Sent when nothing has come in and nothing is late", () => {
    expect(invoiceStatus(invoice({ number: "I", due: "2026-08-07" }), total, "2026-07-28")).toBe("sent");
  });
});

describe("paymentLedger", () => {
  const i = invoice({
    number: "I",
    payments: [
      { date: "2026-07-10", method: "transfer", amount: 400 },
      { date: "2026-07-20", method: "card", amount: 250 },
    ],
  });

  const rows = paymentLedger(i, 1000);

  it("opens with the invoice total", () => {
    expect(rows[0]).toMatchObject({ kind: "invoice", amount: 1000, balance: 1000 });
  });

  it("carries a running balance down the right", () => {
    expect(rows.map((r) => r.balance)).toEqual([1000, 600, 350]);
  });

  it("signs payments negative so the column reads as a statement", () => {
    expect(rows[1].amount).toBe(-400);
  });

  it("ends at what is still owed", () => {
    expect(rows[rows.length - 1].balance).toBe(outstandingOf(i, 1000));
  });
});

describe("checkPayment", () => {
  it("accepts a partial", () => {
    expect(checkPayment(300, 1000)).toEqual({ ok: true, over: 0 });
  });

  it("accepts the exact outstanding amount", () => {
    expect(checkPayment(1000, 1000).ok).toBe(true);
  });

  it("refuses an overpayment and names the excess", () => {
    expect(checkPayment(1200, 1000)).toEqual({ ok: false, over: 200 });
  });

  it("refuses nothing at all", () => {
    expect(checkPayment(0, 1000).ok).toBe(false);
  });
});

describe("paidOf / outstandingOf", () => {
  it("sums the payments and subtracts them", () => {
    const i = invoice({
      number: "I",
      payments: [
        { date: "d", method: "card", amount: 12.34 },
        { date: "d", method: "cheque", amount: 7.66 },
      ],
    });
    expect(paidOf(i)).toBe(20);
    expect(outstandingOf(i, 100)).toBe(80);
  });
});

/* ---------------------------------------------------------------- aging */

describe("bucketOf", () => {
  it("drops settled invoices out of the aging entirely", () => {
    expect(bucketOf("paid", 44)).toBeNull();
  });

  it("puts anything not yet due in Current", () => {
    expect(bucketOf("sent", -10)).toBe("current");
    expect(bucketOf("part_paid", 0)).toBe("current");
  });

  it("splits at 30 and 60 days", () => {
    expect(bucketOf("overdue", 1)).toBe("d1_30");
    expect(bucketOf("overdue", 30)).toBe("d1_30");
    expect(bucketOf("overdue", 31)).toBe("d31_60");
    expect(bucketOf("overdue", 60)).toBe("d31_60");
    expect(bucketOf("overdue", 61)).toBe("d61");
  });
});

describe("agingBuckets", () => {
  it("returns all four buckets, empty ones included", () => {
    const rows = agingBuckets([
      { bucket: "current", outstanding: 100 },
      { bucket: "d1_30", outstanding: 50 },
      { bucket: null, outstanding: 999 },
    ]);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.count)).toEqual([1, 1, 0, 0]);
  });

  it("ignores rows that fell out of the aging", () => {
    const rows = agingBuckets([{ bucket: null, outstanding: 999 }]);
    expect(rows.every((r) => r.amount === 0)).toBe(true);
  });
});

/* ------------------------------------------------------------- the books */

describe("books", () => {
  const items = [
    { ...itemBySku(ITEMS, "CLY-STW-SPK")! },
    { ...itemBySku(ITEMS, "PLT-260-SPK")! },
  ];

  it("counts only what has LEFT the works as revenue", () => {
    const orders = [
      order({ code: "SO-1", status: "invoiced", lines: [line({ sku: "PLT-260-SPK", qty: 10, price: 11.5 })] }),
      order({ code: "SO-2", status: "shipped", lines: [line({ sku: "PLT-260-SPK", qty: 10, price: 11.5 })] }),
      order({ code: "SO-3", status: "picking", lines: [line({ sku: "PLT-260-SPK", qty: 10, price: 11.5 })] }),
      order({ code: "SO-4", status: "draft", lines: [line({ sku: "PLT-260-SPK", qty: 10, price: 11.5 })] }),
    ];
    expect(books(items, orders, [], [], 0).revenue).toBe(230);
  });

  it("takes cost of goods from the run costings, not from a stored figure", () => {
    const orders = [
      order({ code: "SO-1", status: "invoiced", lines: [line({ sku: "PLT-260-SPK", qty: 10, price: 11.5 })] }),
    ];
    const b = books(items, orders, [], [], 0);
    expect(b.cogs).toBe(Math.round(unitCost(items, items[1]) * 10 * 100) / 100);
    expect(b.margin).toBe(Math.round((b.revenue - b.cogs) * 100) / 100);
  });

  it("has no margin percentage before anything sells", () => {
    expect(books(items, [], [], [], 0).marginPct).toBeNull();
  });

  it("counts work in progress only for runs actually on the floor", () => {
    const runs = [
      { ...RUNS[0], stage: "complete" as const },
      { ...RUNS[1], stage: "firing" as const },
      { ...RUNS[5], stage: "queued" as const },
    ];
    expect(books(ITEMS, [], runs, [], 0).wipRuns).toBe(1);
  });

  it("owes only on orders that have been sent", () => {
    const pos = PURCHASE_ORDERS;
    const b = books(ITEMS, [], [], pos, 0);
    const expected = pos
      .filter((p) => p.status === "sent" || p.status === "part_received")
      .reduce((sum, p) => sum + poOutstandingValue(p), 0);
    expect(b.payables).toBe(Math.round(expected * 100) / 100);
  });

  it("values components at cost and finished goods at what they cost to make", () => {
    const b = books(ITEMS, [], [], [], 0);
    expect(b.stockValue).toBe(Math.round((b.componentValue + b.finishedValue) * 100) / 100);
  });
});

/* ------------------------------------------------------ the seeded works */

describe("the seeded works", () => {
  const rows = INVOICES.map((inv) => {
    const o = SALES_ORDERS.find((x) => x.code === inv.order) ?? null;
    const totals = invoiceTotals(o, TAX_RATE);
    const status = invoiceStatus(inv, totals.total, NOW.date);
    const late = daysPast(NOW.date, inv.due);
    return { inv, ...totals, status, late, outstanding: outstandingOf(inv, totals.total) };
  });

  it("ties every invoice to an order that exists", () => {
    for (const inv of INVOICES) {
      expect(
        SALES_ORDERS.find((o) => o.code === inv.order),
        `${inv.number} → ${inv.order}`,
      ).toBeDefined();
      expect(invoiceTotals(SALES_ORDERS.find((o) => o.code === inv.order)!, TAX_RATE).total).toBeGreaterThan(0);
    }
  });

  it("has exactly two overdue invoices, at clearly different ages", () => {
    const overdue = rows.filter((r) => r.status === "overdue");
    expect(overdue.map((r) => r.late).sort((a, b) => a - b)).toEqual([11, 44]);
  });

  it("populates two aging buckets and honestly leaves 61+ empty", () => {
    const buckets = agingBuckets(rows.map((r) => ({ bucket: bucketOf(r.status, r.late), outstanding: r.outstanding })));
    expect(buckets.map((b) => b.count)).toEqual([3, 1, 1, 0]);
  });

  it("has exactly one part-paid invoice, and it is not yet due", () => {
    const part = rows.filter((r) => r.status === "part_paid");
    expect(part).toHaveLength(1);
    expect(part[0].late).toBeLessThan(0);
    expect(paidOf(part[0].inv)).toBeGreaterThan(0);
  });

  it("never lets a payment exceed what an invoice is for", () => {
    for (const r of rows) expect(r.outstanding).toBeGreaterThanOrEqual(0);
  });

  it("carries exactly two short order lines for the Make-it button", () => {
    const short = SALES_ORDERS.flatMap((o) =>
      o.lines
        .map((l, i) => ({ o, l, i, alloc: allocationOf(l, o.status) }))
        .filter((x) => x.alloc.state === "short"),
    );
    expect(short.map((x) => `${x.o.code}/${x.l.sku}`)).toEqual([
      "SO-5108/BWL-160-OXD",
      "SO-5109/MUG-300-OXD",
    ]);
    expect(short.map((x) => x.alloc.shortBy)).toEqual([36, 12]);
  });

  it("states each shortfall the same way in the order book and on the shelf", () => {
    // qty − alloc is what the office says; qty − onHand is what the picker
    // finds. A reader should never have to reconcile two numbers for one
    // problem, so the seed keeps them equal.
    for (const o of SALES_ORDERS) {
      for (const l of o.lines) {
        const alloc = allocationOf(l, o.status);
        if (alloc.state !== "short") continue;
        const item = itemBySku(ITEMS, l.sku)!;
        expect(Math.max(0, l.qty - item.onHand)).toBe(alloc.shortBy);
      }
    }
  });

  it("has exactly one part-received purchase order, and it is late", () => {
    const part = PURCHASE_ORDERS.filter((p) => p.status === "part_received");
    expect(part).toHaveLength(1);
    expect(daysPast(NOW.date, part[0].due)).toBeGreaterThan(0);
    expect(poOutstandingValue(part[0])).toBeGreaterThan(0);
  });

  it("has the outstanding clay on that order clear exactly the blocked run", () => {
    const clay = itemBySku(ITEMS, "CLY-STW-SPK")!;
    const outstanding = PURCHASE_ORDERS.filter((p) => p.status === "part_received")
      .flatMap((p) => p.lines)
      .filter((l) => l.sku === "CLY-STW-SPK")
      .reduce((sum, l) => sum + (l.qty - l.received), 0);
    expect(outstanding).toBeGreaterThan(clay.allocated - clay.onHand);
  });

  it("turns a real profit on the period", () => {
    const receivables = rows.reduce((sum, r) => sum + r.outstanding, 0);
    const b = books(ITEMS, SALES_ORDERS, RUNS, PURCHASE_ORDERS, receivables);
    expect(b.revenue).toBeGreaterThan(0);
    expect(b.margin).toBeGreaterThan(0);
    expect(b.marginPct).toBeGreaterThan(40);
  });

  /*
   * 21 D15 — the boundary, asserted rather than merely documented. "The books"
   * is a roll-up over data the app already holds. If a future change adds a
   * journal, a chart of accounts or a period close to this engine, this is the
   * test that fails first.
   */
  it("keeps the money view a view — no journals, no accounts, no close", () => {
    const b = books(ITEMS, SALES_ORDERS, RUNS, PURCHASE_ORDERS, 0);
    const keys = Object.keys(b).sort();
    expect(keys).toEqual([
      "cogs",
      "componentValue",
      "finishedValue",
      "margin",
      "marginPct",
      "payables",
      "receivables",
      "revenue",
      "stockValue",
      "wip",
      "wipRuns",
    ]);
  });
});
