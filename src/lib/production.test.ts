/**
 * Production-engine assertions.
 *
 * These test the RULES, not the seed: each case builds the smallest data that
 * can express the rule, so a change to the fiction never turns this suite red
 * and a change to the arithmetic always does. The seeded works gets one section
 * of its own at the end, because a few of its numbers are load-bearing for the
 * demo story (the 12 kg shortfall, the yield in the board header) and should
 * not drift silently.
 */

import { describe, expect, it } from "vitest";

import { ITEMS, NOW, RUNS, STATIONS } from "../data/demo.ts";
import type { Item, Movement, Run } from "../data/types.ts";
import {
  applyOutput,
  available,
  belowReorder,
  blockedShortage,
  bomRows,
  canAdvance,
  canRecordOutput,
  defaultStationFor,
  historyFor,
  itemBySku,
  marginOf,
  mintLot,
  movementKinds,
  nextStage,
  onOrder,
  overBy,
  reorderBarPct,
  round2,
  runCost,
  shortageFor,
  stationLoads,
  stockTone,
  unassignedRuns,
  unitCost,
  varianceOf,
  yieldPct,
} from "./production.ts";

/* ------------------------------------------------------------- fixtures */

function component(patch: Partial<Item> & { sku: string }): Item {
  return {
    kind: "component",
    nameKey: `data.item.${patch.sku}`,
    name: patch.sku,
    unit: "kg",
    onHand: 0,
    allocated: 0,
    reorder: 10,
    cost: 1,
    icon: "layers",
    ...patch,
  };
}

function product(patch: Partial<Item> & { sku: string }): Item {
  return {
    kind: "product",
    nameKey: `data.item.${patch.sku}`,
    name: patch.sku,
    unit: "ea",
    onHand: 0,
    allocated: 0,
    reorder: 10,
    cost: 0,
    icon: "circle",
    labour: 0,
    overhead: 0,
    price: 10,
    ...patch,
  };
}

function run(patch: Partial<Run> & { code: string; sku: string }): Run {
  return {
    qty: 100,
    good: 0,
    scrap: 0,
    stage: "queued",
    station: null,
    startedMin: null,
    lot: null,
    signoffs: {},
    forOrder: null,
    madeInSession: false,
    ...patch,
  };
}

/* ------------------------------------------------------------------ stock */

describe("available", () => {
  it("is on hand minus allocated", () => {
    expect(available(component({ sku: "A", onHand: 48, allocated: 12 }))).toBe(36);
  });

  it("goes NEGATIVE when more is promised than exists", () => {
    // The whole point of tracking allocation separately: over-promising is a
    // real state a works can be in, not an error to clamp away.
    expect(available(component({ sku: "A", onHand: 48, allocated: 60 }))).toBe(-12);
  });

  it("does not accumulate float error", () => {
    expect(available(component({ sku: "A", onHand: 0.3, allocated: 0.1 }))).toBe(0.2);
  });
});

describe("stockTone", () => {
  const it2 = (onHand: number, allocated: number, reorder: number) =>
    stockTone(component({ sku: "A", onHand, allocated, reorder }));

  it("is danger at or below zero available", () => {
    expect(it2(10, 10, 5)).toBe("danger");
    expect(it2(10, 12, 5)).toBe("danger");
  });

  it("is warn AT the reorder point, not only below it", () => {
    expect(it2(15, 10, 5)).toBe("warn");
  });

  it("is ok above the point", () => {
    expect(it2(20, 10, 5)).toBe("ok");
  });

  it("agrees with belowReorder", () => {
    const low = component({ sku: "A", onHand: 15, allocated: 10, reorder: 5 });
    expect(belowReorder(low)).toBe(true);
    expect(stockTone(low)).not.toBe("ok");
  });
});

describe("reorderBarPct", () => {
  it("treats twice the reorder point as full", () => {
    expect(reorderBarPct(component({ sku: "A", onHand: 20, reorder: 10 }))).toBe(100);
  });

  it("is half full at the point itself", () => {
    expect(reorderBarPct(component({ sku: "A", onHand: 10, reorder: 10 }))).toBe(50);
  });

  it("never renders a zero-width bar", () => {
    expect(reorderBarPct(component({ sku: "A", onHand: 0, reorder: 10 }))).toBe(3);
  });
});

describe("onOrder", () => {
  const base = {
    supplier: "SUP",
    raised: "2026-07-01",
    due: "2026-07-10",
  };

  it("counts only what is still outstanding on OPEN orders", () => {
    const pos = [
      { code: "PO-1", status: "sent" as const, ...base, lines: [{ sku: "A", qty: 100, received: 40, cost: 1 }] },
      { code: "PO-2", status: "received" as const, ...base, lines: [{ sku: "A", qty: 50, received: 50, cost: 1 }] },
      { code: "PO-3", status: "draft" as const, ...base, lines: [{ sku: "A", qty: 90, received: 0, cost: 1 }] },
    ];
    // 60 from PO-1. PO-2 has arrived; PO-3 has not been sent.
    expect(onOrder(pos, "A")).toBe(60);
  });

  it("includes part-received orders", () => {
    const pos = [
      {
        code: "PO-1",
        status: "part_received" as const,
        ...base,
        lines: [{ sku: "A", qty: 300, received: 180, cost: 1 }],
      },
    ];
    expect(onOrder(pos, "A")).toBe(120);
  });
});

/* ------------------------------------------------------------- the bill */

describe("bomRows", () => {
  const items = [
    component({ sku: "CLAY", onHand: 50 }),
    component({ sku: "GLAZE", onHand: 2 }),
    product({ sku: "PLATE", bom: [["CLAY", 0.5], ["GLAZE", 0.05]] }),
  ];

  it("multiplies the per-unit quantity by the run quantity", () => {
    const rows = bomRows(items, run({ code: "R", sku: "PLATE", qty: 100 }));
    expect(rows.map((r) => r.required)).toEqual([50, 5]);
  });

  it("marks a line short when on hand cannot cover what is required", () => {
    const rows = bomRows(items, run({ code: "R", sku: "PLATE", qty: 100 }));
    expect(rows.map((r) => r.short)).toEqual([false, true]);
  });

  it("returns nothing for a product with no bill", () => {
    expect(bomRows(items, run({ code: "R", sku: "CLAY" }))).toEqual([]);
  });
});

describe("shortageFor", () => {
  const items = [
    component({ sku: "CLAY", onHand: 48, allocated: 60 }),
    component({ sku: "GLAZE", onHand: 30, allocated: 4 }),
    product({ sku: "PLATE", bom: [["CLAY", 0.7], ["GLAZE", 0.06]] }),
  ];

  it("names the component and the size of the gap", () => {
    expect(shortageFor(items, run({ code: "R", sku: "PLATE" }))).toEqual({
      sku: "CLAY",
      qty: 12,
    });
  });

  it("returns the FIRST short component — a floor needs one reason", () => {
    const both = [
      component({ sku: "CLAY", onHand: 1, allocated: 5 }),
      component({ sku: "GLAZE", onHand: 1, allocated: 9 }),
      product({ sku: "PLATE", bom: [["CLAY", 1], ["GLAZE", 1]] }),
    ];
    expect(shortageFor(both, run({ code: "R", sku: "PLATE" }))?.sku).toBe("CLAY");
  });

  it("is null when everything promised is on the shelf", () => {
    const fine = [
      component({ sku: "CLAY", onHand: 100, allocated: 60 }),
      product({ sku: "PLATE", bom: [["CLAY", 0.7]] }),
    ];
    expect(shortageFor(fine, run({ code: "R", sku: "PLATE" }))).toBeNull();
  });

  it("never blocks a run raised in-session — it carries its own allocation", () => {
    const made = run({ code: "R", sku: "PLATE", madeInSession: true });
    expect(shortageFor(items, made)).toBeNull();
  });
});

describe("blockedShortage", () => {
  const items = [
    component({ sku: "CLAY", onHand: 10, allocated: 30 }),
    product({ sku: "PLATE", bom: [["CLAY", 1]] }),
  ];

  it("reports a block only while the run is queued", () => {
    expect(blockedShortage(items, run({ code: "R", sku: "PLATE", stage: "queued" }))).not.toBeNull();
  });

  it("stays quiet once released — the clay is already out of the store", () => {
    expect(blockedShortage(items, run({ code: "R", sku: "PLATE", stage: "released" }))).toBeNull();
    expect(blockedShortage(items, run({ code: "R", sku: "PLATE", stage: "firing" }))).toBeNull();
  });
});

/* ------------------------------------------------------- state machine */

describe("nextStage", () => {
  it("walks the six stages in order", () => {
    expect(nextStage("queued")).toBe("released");
    expect(nextStage("released")).toBe("forming");
    expect(nextStage("forming")).toBe("firing");
    expect(nextStage("firing")).toBe("finishing");
    expect(nextStage("finishing")).toBe("complete");
  });

  it("stops at complete", () => {
    expect(nextStage("complete")).toBeNull();
  });
});

describe("canAdvance", () => {
  const short = [
    component({ sku: "CLAY", onHand: 1, allocated: 9 }),
    product({ sku: "PLATE", bom: [["CLAY", 1]] }),
  ];

  it("refuses a blocked run", () => {
    expect(canAdvance(short, run({ code: "R", sku: "PLATE" }))).toBe(false);
  });

  it("refuses a finished run", () => {
    const ok = [product({ sku: "PLATE" })];
    expect(canAdvance(ok, run({ code: "R", sku: "PLATE", stage: "complete" }))).toBe(false);
  });

  it("allows anything else", () => {
    const ok = [product({ sku: "PLATE" })];
    expect(canAdvance(ok, run({ code: "R", sku: "PLATE", stage: "forming" }))).toBe(true);
  });
});

describe("defaultStationFor", () => {
  it("sends work to the right kind of station", () => {
    expect(defaultStationFor("forming")).toBe("ST-F1");
    expect(defaultStationFor("firing")).toBe("ST-K1");
    expect(defaultStationFor("finishing")).toBe("ST-T1");
  });

  it("assigns nothing for stages that are not a place", () => {
    expect(defaultStationFor("queued")).toBeNull();
    expect(defaultStationFor("complete")).toBeNull();
  });
});

/* ------------------------------------------------------ recording output */

describe("yieldPct", () => {
  it("is good over everything made", () => {
    expect(yieldPct(95, 5)).toBe(95);
  });

  it("keeps one decimal", () => {
    expect(yieldPct(186, 6)).toBe(96.9);
  });

  it("is null before anything is made — not zero", () => {
    expect(yieldPct(0, 0)).toBeNull();
  });
});

describe("overBy / canRecordOutput", () => {
  const r = run({ code: "R", sku: "PLATE", qty: 200, good: 190 });

  it("names how far past the run quantity an entry would go", () => {
    expect(overBy(r, 18)).toBe(8);
  });

  it("allows an entry that lands exactly on the quantity", () => {
    expect(overBy(r, 10)).toBe(0);
    expect(canRecordOutput(r, 10)).toBe(true);
  });

  it("refuses overproduction", () => {
    expect(canRecordOutput(r, 11)).toBe(false);
  });

  it("refuses an empty entry", () => {
    expect(canRecordOutput(r, 0)).toBe(false);
  });
});

describe("applyOutput", () => {
  const items = [
    component({ sku: "CLAY", onHand: 100 }),
    component({ sku: "GLAZE", onHand: 10 }),
    product({ sku: "PLATE", onHand: 20, bom: [["CLAY", 0.5], ["GLAZE", 0.05]] }),
  ];
  const runs = [run({ code: "R-1", sku: "PLATE", qty: 100 })];
  const movements: Movement[] = [];

  const result = applyOutput(items, runs, movements, runs[0], 40, 4, "LOT-1", "2026-07-28");

  it("issues every component against everything MADE, seconds included", () => {
    // A warped plate consumed its clay: 44 pieces, not 40.
    expect(itemBySku(result.items, "CLAY")?.onHand).toBe(78);
    expect(itemBySku(result.items, "GLAZE")?.onHand).toBe(7.8);
  });

  it("adds only the GOOD units to finished stock", () => {
    expect(itemBySku(result.items, "PLATE")?.onHand).toBe(60);
  });

  it("writes one movement per component plus the production row", () => {
    expect(result.movements).toHaveLength(3);
    expect(result.movements[0]).toMatchObject({ kind: "production", qty: 40, lot: "LOT-1" });
    expect(result.movements.filter((m) => m.kind === "issue").map((m) => m.qty)).toEqual([-22, -2.2]);
  });

  it("mints the lot once and keeps the first one on a second entry", () => {
    const again = applyOutput(
      result.items,
      result.runs,
      result.movements,
      result.runs[0],
      10,
      0,
      "LOT-2",
      "2026-07-28",
    );
    expect(again.runs[0].lot).toBe("LOT-1");
  });

  it("accumulates good and scrap on the run", () => {
    expect(result.runs[0]).toMatchObject({ good: 40, scrap: 4 });
  });

  it("never drives a component below zero", () => {
    const thin = [component({ sku: "CLAY", onHand: 1 }), product({ sku: "P", bom: [["CLAY", 1]] })];
    const out = applyOutput(thin, [run({ code: "R", sku: "P" })], [], run({ code: "R", sku: "P" }), 50, 0, "L", "d");
    expect(itemBySku(out.items, "CLAY")?.onHand).toBe(0);
  });
});

describe("mintLot", () => {
  it("zero-pads within the month so lots sort as text", () => {
    expect(mintLot("LOT-2607-", 9)).toBe("LOT-2607-09");
    expect(mintLot("LOT-2607-", 14)).toBe("LOT-2607-14");
  });
});

/* ---------------------------------------------------------------- ledger */

describe("historyFor", () => {
  const item = component({ sku: "A", onHand: 48 });
  const movements: Movement[] = [
    { sku: "A", date: "2026-07-21", kind: "receipt", ref: "PO-1", qty: 180 },
    { sku: "A", date: "2026-07-22", kind: "issue", ref: "R-1", qty: -86.4 },
    { sku: "A", date: "2026-07-24", kind: "issue", ref: "R-2", qty: -64.8 },
    { sku: "B", date: "2026-07-24", kind: "issue", ref: "R-2", qty: -5 },
  ];

  it("derives the opening balance so the column lands on what is on hand", () => {
    const { rows, opening } = historyFor(movements, item);
    expect(opening).toBe(19.2);
    expect(rows[rows.length - 1].balance).toBe(item.onHand);
  });

  it("ignores movements for other items", () => {
    expect(historyFor(movements, item).rows).toHaveLength(3);
  });

  it("re-bases the opening balance when a filter is on", () => {
    // With only the issues visible the column must still add up, so the opening
    // row becomes the balance the first VISIBLE row started from.
    const { rows, opening } = historyFor(movements, item, "issue");
    expect(rows).toHaveLength(2);
    expect(round2(opening + rows[0].qty)).toBe(rows[0].balance);
    expect(opening).toBe(199.2);
  });

  it("survives an item with no history at all", () => {
    const { rows, opening } = historyFor([], item);
    expect(rows).toEqual([]);
    expect(opening).toBe(48);
  });
});

describe("movementKinds", () => {
  it("lists each kind once, in the order it first appears", () => {
    const movements: Movement[] = [
      { sku: "A", date: "d", kind: "receipt", ref: "1", qty: 1 },
      { sku: "A", date: "d", kind: "issue", ref: "2", qty: -1 },
      { sku: "A", date: "d", kind: "receipt", ref: "3", qty: 1 },
      { sku: "B", date: "d", kind: "shipment", ref: "4", qty: -1 },
    ];
    expect(movementKinds(movements, "A")).toEqual(["receipt", "issue"]);
  });
});

/* --------------------------------------------------------------- costing */

describe("unitCost", () => {
  const items = [
    component({ sku: "CLAY", cost: 1.85 }),
    component({ sku: "GLAZE", cost: 8.2 }),
    product({
      sku: "PLATE",
      bom: [["CLAY", 0.72], ["GLAZE", 0.065]],
      labour: 1.85,
      overhead: 0.95,
    }),
  ];

  it("is the bill at component cost plus labour and overhead", () => {
    // 1.332 + 0.533 + 1.85 + 0.95
    expect(unitCost(items, itemBySku(items, "PLATE")!)).toBe(4.67);
  });

  it("is zero for something with no bill and no labour", () => {
    expect(unitCost(items, product({ sku: "X" }))).toBe(0);
  });
});

describe("runCost", () => {
  const items = [
    component({ sku: "CLAY", cost: 2 }),
    product({ sku: "PLATE", bom: [["CLAY", 0.5]], labour: 1, overhead: 0.5 }),
  ];

  it("costs everything made, then spreads it over the GOOD units only", () => {
    const cost = runCost(items, run({ code: "R", sku: "PLATE", good: 90, scrap: 10 }));
    expect(cost.materials).toBe(100);
    expect(cost.labour).toBe(100);
    expect(cost.overhead).toBe(50);
    expect(cost.total).toBe(250);
    // The seconds' share lands on the good units — that is what scrap costs.
    expect(cost.perUnit).toBe(2.78);
  });

  it("has no per-unit figure before anything good comes off", () => {
    expect(runCost(items, run({ code: "R", sku: "PLATE" })).perUnit).toBeNull();
  });
});

describe("marginOf", () => {
  const items = [
    component({ sku: "CLAY", cost: 2 }),
    product({ sku: "PLATE", bom: [["CLAY", 1]], labour: 1, overhead: 1, price: 10 }),
  ];

  it("measures the margin against the price list by default", () => {
    expect(marginOf(items, itemBySku(items, "PLATE")!)).toEqual({
      cost: 4,
      margin: 6,
      pct: 60,
    });
  });

  it("accepts a rate somebody is trying out", () => {
    expect(marginOf(items, itemBySku(items, "PLATE")!, 5).pct).toBe(20);
  });

  it("reports a loss rather than clamping at zero", () => {
    expect(marginOf(items, itemBySku(items, "PLATE")!, 3).margin).toBe(-1);
  });
});

/* -------------------------------------------------------------- stations */

describe("stationLoads", () => {
  const runs = [
    run({ code: "R-1", sku: "P", station: "ST-F1", stage: "forming", startedMin: 60, good: 10 }),
    run({ code: "R-2", sku: "P", station: "ST-F1", stage: "released", startedMin: 20 }),
    run({ code: "R-3", sku: "P", station: "ST-F1", stage: "complete", good: 5 }),
    run({ code: "R-4", sku: "P", station: null, stage: "queued" }),
  ];

  const loads = stationLoads(STATIONS, runs, [{ station: "ST-F1", qty: 3 }], 200);
  const f1 = loads.find((l) => l.station.id === "ST-F1")!;

  it("puts the first active run on the station and queues the rest behind it", () => {
    expect(f1.current?.code).toBe("R-1");
    expect(f1.queued.map((r) => r.code)).toEqual(["R-2"]);
  });

  it("counts good units from everything that passed through, complete included", () => {
    expect(f1.goodToday).toBe(15);
  });

  it("caps utilisation at the shift", () => {
    const busy = stationLoads(STATIONS, runs, [], 50);
    expect(busy.find((l) => l.station.id === "ST-F1")!.utilPct).toBe(100);
  });

  it("leaves an untouched station idle", () => {
    expect(loads.find((l) => l.station.id === "ST-K2")!.current).toBeNull();
  });
});

describe("unassignedRuns", () => {
  it("returns queued runs with no bench of their own", () => {
    const runs = [
      run({ code: "R-1", sku: "P", stage: "queued", station: null }),
      run({ code: "R-2", sku: "P", stage: "queued", station: "ST-F1" }),
      run({ code: "R-3", sku: "P", stage: "forming", station: null }),
    ];
    expect(unassignedRuns(runs).map((r) => r.code)).toEqual(["R-1"]);
  });
});

/* ---------------------------------------------------------------- counts */

describe("varianceOf", () => {
  const item = component({ sku: "A", onHand: 40 });

  it("is what was walked less what the record says", () => {
    expect(varianceOf(item, 37)).toBe(-3);
    expect(varianceOf(item, 42)).toBe(2);
  });

  it("is null for a line nobody has walked", () => {
    expect(varianceOf(item, null)).toBeNull();
  });
});

/* ------------------------------------------------------ the seeded works */

describe("the seeded works", () => {
  it("pins the clock to the Tuesday morning, mid-shift", () => {
    expect(NOW.date).toBe("2026-07-28");
    expect(NOW.minutes).toBe(615);
    expect(NOW.minutes).toBeGreaterThan(NOW.shiftStart);
    expect(NOW.minutes).toBeLessThan(NOW.shiftEnd);
  });

  it("has exactly one run on the board that cannot start", () => {
    const blocked = RUNS.filter((r) => blockedShortage(ITEMS, r) !== null);
    expect(blocked.map((r) => r.code)).toEqual(["RUN-2317"]);
  });

  it("is short by 12 kg of speckled stoneware clay, and says which", () => {
    const short = blockedShortage(ITEMS, RUNS.find((r) => r.code === "RUN-2317")!);
    expect(short).toEqual({ sku: "CLY-STW-SPK", qty: 12 });
  });

  it("puts one run in each of the six columns", () => {
    const stages = RUNS.map((r) => r.stage);
    expect(new Set(stages).size).toBe(6);
  });

  it("reports a believable yield in the board header", () => {
    const good = RUNS.reduce((sum, r) => sum + r.good, 0);
    const scrap = RUNS.reduce((sum, r) => sum + r.scrap, 0);
    expect(good).toBe(456);
    expect(scrap).toBe(18);
    expect(yieldPct(good, scrap)).toBe(96.2);
  });

  it("gives every finished piece a bill of materials", () => {
    for (const item of ITEMS.filter((i) => i.kind === "product")) {
      expect(item.bom?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("prices every finished piece above what it costs to make", () => {
    for (const item of ITEMS.filter((i) => i.kind === "product")) {
      expect(marginOf(ITEMS, item).margin).toBeGreaterThan(0);
    }
  });

  it("points every bill line at a component that exists", () => {
    for (const item of ITEMS.filter((i) => i.kind === "product")) {
      for (const [sku] of item.bom ?? []) {
        expect(itemBySku(ITEMS, sku), `${item.sku} needs ${sku}`).not.toBeNull();
      }
    }
  });
});
