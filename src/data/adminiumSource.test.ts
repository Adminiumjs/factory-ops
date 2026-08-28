// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Connected mode (28-public-surface.md §5.2, 28-T28 wave 4).
 *
 * Drives the SHIPPED client against canned wire responses rather than a stub of
 * it, so `assertRefs`, the config fetch and URL building are under test too —
 * those are where a connected app actually fails, not in the mapping.
 *
 * The cases below are chosen for the failures that are SILENT: demo mode
 * quietly stopping (thirteen public demos break, build stays green), a swap
 * arriving after the store has read (renders demo data against a real backend
 * and looks correct), a child table grouped by the wrong parent, and the two
 * WS-I gaps this repo carries — both of which degrade rather than throw, which
 * is exactly why they need asserting.
 */

import { describe, expect, it } from "vitest";

import { createPublicClient } from "@adminiumjs/public-client";

import { loadSnapshot, snapshotSource } from "./adminiumSource.ts";
import { demoSource, isConnected, setDataSource, source } from "./source.ts";

const ROWS: Record<string, unknown[]> = {
  works: [{
    id: "works", name: "Test Works", line1: "1 Test Lane", line2: null,
    city: "Testburgh", postcode: "TE1 1ST", country: "GB",
  }],
  glazes: [{ id: "OXD", name: "Oxide", tint_from: "#a", tint_to: "#b" }],
  stations: [{ id: "ST-K1", name: "Kiln 1", icon: "flame", operator: "Rosa" }],
  suppliers: [
    { id: "SUP-CLY", name: "Clayworks", contact: "c@x.test", lead_days: 7, on_time: "0.940", last_receipt: "2026-07-20" },
    { id: "SUP-NEW", name: "Brand New", contact: "n@x.test", lead_days: 3, on_time: "1.000", last_receipt: "2026-07-01" },
  ],
  customers: [{ id: "CUS-01", name: "Harbour Ceramics", city: "Leith", kind: "retail" }],
  items: [
    {
      sku: "BWL-160-OXD", kind: "product", name: "Bowl 160", unit: "ea",
      on_hand: "40.000", allocated: "5.000", reorder: "10.000", cost: "3.20",
      icon: "circle", glaze_id: "OXD", labour: "1.50", overhead: "0.80", price: "18.00",
    },
    {
      sku: "CLY-STW-WHT", kind: "component", name: "Stoneware white", unit: "kg",
      on_hand: "120.000", allocated: "0.000", reorder: "50.000", cost: "1.10",
      icon: "package", glaze_id: null, labour: null, overhead: null, price: null,
    },
  ],
  // Deliberately out of position order — the mapping must sort them.
  bomLines: [
    { product_sku: "BWL-160-OXD", component_sku: "GLZ-OXD", qty_per_unit: "0.0400", position: 2 },
    { product_sku: "BWL-160-OXD", component_sku: "CLY-STW-WHT", qty_per_unit: "0.6000", position: 1 },
  ],
  runs: [
    {
      code: "RUN-2314", sku: "BWL-160-OXD", qty: "100.000", good: "97.000", scrap: "3.000",
      stage: "firing", station_id: "ST-K1", started_minutes: 455, lot: "L-2314",
      signed_forming: "Rosa", signed_firing: null, signed_finishing: null,
      for_order: "SO-8801", made_in_session: false,
    },
  ],
  firings: [
    {
      code: "FIR-4471", station_id: "ST-K1", programme: "Glaze · 1240 °C", status: "firing",
      current_temp: 1148, target_temp: 1240, loaded_minutes: 440, started_minutes: 455,
      due_minutes: 850, elapsed_minutes: 160, shelves: 6, capacity: 7, kwh: null,
    },
    {
      code: "FIR-9999", station_id: "ST-K1", programme: "Renamed by an operator", status: "loading",
      current_temp: 20, target_temp: 1000, loaded_minutes: 600, started_minutes: null,
      due_minutes: 900, elapsed_minutes: null, shelves: 1, capacity: 7, kwh: null,
    },
  ],
  firingContents: [{ firing_code: "FIR-4471", run_code: "RUN-2314", sku: "BWL-160-OXD", qty: "97.000" }],
  defects: [
    { at_minutes: 610, run_code: "RUN-2314", sku: "BWL-160-OXD", station_id: "ST-K1", reason: "chip", qty: "3.000", logged_by: "Rosa" },
  ],
  movements: [{ sku: "CLY-STW-WHT", moved_on: "2026-07-27", kind: "receipt", ref: "PO-5501", qty: "60.000", lot: null }],
  purchaseOrders: [{ code: "PO-5501", supplier_id: "SUP-CLY", status: "received", raised_on: "2026-07-10", due_on: "2026-07-20" }],
  purchaseOrderLines: [{ po_code: "PO-5501", sku: "CLY-STW-WHT", qty: "60.000", received: "60.000", cost: "1.10" }],
  // Three orders, one per state the delivery address can arrive in: a whole
  // one, an empty one (the customer collects), and the half-filled row the
  // schema forbids and the wire cannot.
  salesOrders: [
    {
      code: "SO-8801", customer_id: "CUS-01", status: "confirmed", placed_on: "2026-07-15", required_by: "2026-08-05",
      deliver_to_name: "Harbour Ceramics", deliver_to_line1: "The Old Bonded Store", deliver_to_line2: "9 Shore Road",
      deliver_to_city: "Leith", deliver_to_postcode: "EH6 6QU", deliver_to_country: "GB",
    },
    {
      code: "SO-8802", customer_id: "CUS-01", status: "picking", placed_on: "2026-07-16", required_by: "2026-08-06",
      deliver_to_name: null, deliver_to_line1: null, deliver_to_line2: null,
      deliver_to_city: null, deliver_to_postcode: null, deliver_to_country: null,
    },
    {
      code: "SO-8803", customer_id: "CUS-01", status: "picking", placed_on: "2026-07-17", required_by: "2026-08-07",
      deliver_to_name: "Harbour Ceramics", deliver_to_line1: null, deliver_to_line2: null,
      deliver_to_city: null, deliver_to_postcode: "EH6 6QU", deliver_to_country: "GB",
    },
  ],
  salesOrderLines: [{ so_code: "SO-8801", sku: "BWL-160-OXD", qty: "100.000", alloc: "40.000", price: "18.00", run_code: "RUN-2314" }],
  invoices: [{ number: "INV-2201", so_code: "SO-8801", customer_id: "CUS-01", issued_on: "2026-07-16", due_on: "2026-08-15" }],
  payments: [{ invoice_no: "INV-2201", paid_on: "2026-07-30", method: "transfer", amount: "900.00" }],
  countSheets: [{ code: "CNT-19", zone: "glaze", walked_by: "Rosa", opened_on: "2026-07-26", status: "open" }],
  countLines: [{ sheet_code: "CNT-19", sku: "CLY-STW-WHT", counted: null }],
};

function fakeFetch(overrides: { expose?: (ref: string) => string[] } = {}) {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(String(input));
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

    if (url.pathname.endsWith("/public/config")) {
      const refs: Record<string, unknown> = {};
      for (const ref of Object.keys(ROWS)) {
        refs[ref] = {
          actions: ["list"],
          expose: overrides.expose?.(ref) ?? Object.keys((ROWS[ref]?.[0] ?? {}) as object),
          filterable: [], searchable: [], orderable: [], writable: [], limit: 500,
        };
      }
      // `/public/config` is the one route the client unwraps (`body.data`);
      // `list` reads the body itself.
      return json({ data: { version: 1, side: "customer", timezone: "Europe/London", currency: "GBP", claim: null, refs } });
    }
    const ref = url.pathname.split("/").pop() ?? "";
    return json({ data: ROWS[ref] ?? [] });
  };
}

const clientWith = (fetch: ReturnType<typeof fakeFetch> | typeof globalThis.fetch) =>
  createPublicClient({ baseUrl: "https://api.example.test", publishableKey: "adm_pub_test", fetch });

const snapshot = async () => (await loadSnapshot(clientWith(fakeFetch())!))!;

describe("demo mode is the structural default", () => {
  it("builds no client when either variable is absent", () => {
    expect(createPublicClient({ baseUrl: "https://x.test", publishableKey: "" })).toBeNull();
    expect(createPublicClient({ baseUrl: "", publishableKey: "adm_pub_x" })).toBeNull();
  });

  it("falls back rather than throwing when the server is unreachable", async () => {
    const client = clientWith(async () => {
      throw new Error("ECONNREFUSED");
    });
    expect(await loadSnapshot(client!)).toBeNull();
  });

  it("falls back when the scope does not expose a column the app reads", async () => {
    const client = clientWith(fakeFetch({ expose: (ref) => (ref === "items" ? ["sku"] : ["id"]) }));
    expect(await loadSnapshot(client!)).toBeNull();
  });
});

describe("identity passes straight through, because the keys are text", () => {
  it("derives every i18n key from the row's own identifier", async () => {
    const snap = await snapshot();
    expect(snap.items[0]!.nameKey).toBe("data.item.BWL-160-OXD");
    expect(snap.stations[0]!.nameKey).toBe("data.station.ST-K1");
    expect(snap.glazes[0]!.nameKey).toBe("data.glaze.OXD");
    expect(snap.countSheets[0]!.zoneKey).toBe("data.zone.glaze");
    // `numeric` arrives as a string and must not reach arithmetic as one.
    expect(snap.items[0]!.onHand).toBe(40);
    expect(snap.items[0]!.price).toBe(18);
  });

  it("omits the finished-goods-only fields on a component", async () => {
    const snap = await snapshot();
    const component = snap.items.find((i) => i.sku === "CLY-STW-WHT")!;
    expect(component.glaze).toBeUndefined();
    expect(component.bom).toBeUndefined();
    expect(component.labour).toBeUndefined();
  });
});

describe("child rows group by their parent's text key", () => {
  it("orders a bill of materials by position, not by arrival", async () => {
    // `bom_lines.id` is a serial nobody addresses; `position` is the order that
    // matters, and the wire does not promise to return rows in it.
    const snap = await snapshot();
    expect(snap.items.find((i) => i.sku === "BWL-160-OXD")!.bom).toEqual([
      ["CLY-STW-WHT", 0.6],
      ["GLZ-OXD", 0.04],
    ]);
  });

  it("assembles orders, invoices and count sheets from their line tables", async () => {
    const snap = await snapshot();
    expect(snap.purchaseOrders[0]!.lines).toEqual([
      { sku: "CLY-STW-WHT", qty: 60, received: 60, cost: 1.1 },
    ]);
    expect(snap.salesOrders[0]!.lines[0]).toMatchObject({ sku: "BWL-160-OXD", alloc: 40, run: "RUN-2314" });
    expect(snap.invoices[0]!.payments).toEqual([{ date: "2026-07-30", method: "transfer", amount: 900 }]);
    // A line the walker has not reached is null, not zero — the difference
    // between "counted nothing" and "not counted".
    expect(snap.countSheets[0]!.lines).toEqual([{ sku: "CLY-STW-WHT", counted: null }]);
  });

  it("derives the order's invoice back-reference", async () => {
    const snap = await snapshot();
    expect(snap.salesOrders[0]!.invoice).toBe("INV-2201");
  });

  it("folds the three sign-off columns into a partial record", async () => {
    const snap = await snapshot();
    expect(snap.runs[0]!.signoffs).toEqual({ forming: "Rosa" });
  });
});

describe("the two WS-I gaps degrade visibly", () => {
  it("recognises a firing programme by its display text, and shows nothing when renamed", async () => {
    // GAP 1. `firings.programme` stores operator-editable text and the ramp
    // steps have no table, so a renamed programme loses its steps. Visible on
    // the kiln screen rather than silent — and the argument for the table.
    const snap = await snapshot();
    const known = snap.firings.find((f) => f.code === "FIR-4471")!;
    expect(known.programmeKey).toBe("data.programme.glaze");
    expect(known.steps).toHaveLength(4);
    expect(known.contents).toEqual([{ run: "RUN-2314", sku: "BWL-160-OXD", qty: 97 }]);

    const renamed = snap.firings.find((f) => f.code === "FIR-9999")!;
    expect(renamed.programmeKey).toBe("");
    expect(renamed.steps).toEqual([]);
  });

  it("derives what a supplier supplies from what has been ordered", async () => {
    // GAP 2. There is no `supplier_items` table. Deriving it is truer than a
    // maintained list — and it means a supplier with no orders yet supplies
    // nothing, which this pins so the behaviour is a decision, not a surprise.
    const snap = await snapshot();
    expect(snap.suppliers.find((s) => s.id === "SUP-CLY")!.supplies).toEqual(["CLY-STW-WHT"]);
    expect(snap.suppliers.find((s) => s.id === "SUP-NEW")!.supplies).toEqual([]);
  });
});

describe("the delivery address keeps its meaning across the wire", () => {
  it("rebuilds a whole address out of the six columns", async () => {
    const snap = await snapshot();
    expect(snap.salesOrders.find((o) => o.code === "SO-8801")!.deliverTo).toEqual({
      name: "Harbour Ceramics",
      lines: ["The Old Bonded Store", "9 Shore Road"],
      city: "Leith",
      postcode: "EH6 6QU",
      country: "GB",
    });
  });

  it("reads an empty address as the collection it means, not as a blank", async () => {
    const snap = await snapshot();
    expect(snap.salesOrders.find((o) => o.code === "SO-8802")!.deliverTo).toBeNull();
  });

  it("refuses to turn a half-filled address into a collection", async () => {
    // THE FAILURE THIS PINS. `db/schema.sql` will not store four parts out of
    // five, but that CHECK has no home in `manifest.json`, so a connected scope
    // can send one. Reading it as null would silently reclassify an order
    // somebody typed a postcode into as one nobody is delivering — and no
    // screen would ever say why. The gaps stay visible instead.
    const snap = await snapshot();
    const partial = snap.salesOrders.find((o) => o.code === "SO-8803")!.deliverTo;
    expect(partial).not.toBeNull();
    expect(partial).toEqual({
      name: "Harbour Ceramics",
      lines: [],
      city: "",
      postcode: "EH6 6QU",
      country: "GB",
    });
  });

  it("hands back a copy of the address, not the snapshot's own", async () => {
    const connected = snapshotSource(await snapshot());
    connected.salesOrders()[0]!.deliverTo!.lines.push("mutated");
    expect(connected.salesOrders()[0]!.deliverTo!.lines).toEqual([
      "The Old Bonded Store",
      "9 Shore Road",
    ]);
  });
});

describe("the clock and the seam", () => {
  it("builds today from the tenant's zone, and keeps the shift constant", async () => {
    const snap = await snapshot();
    expect(snap.now.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof snap.now.minutes).toBe("number");
    // WS-I G4 — the shift has no home in the schema.
    expect(snap.now.shiftStart).toBe(420);
    expect(snap.now.shiftEnd).toBe(930);
  });

  it("hands back copies, like demoSource does", async () => {
    const connected = snapshotSource(await snapshot());
    connected.suppliers()[0]!.supplies.push("mutated");
    expect(connected.suppliers()[0]!.supplies).toEqual(["CLY-STW-WHT"]);
  });

  it("reports demo mode until a real source is installed", () => {
    expect(isConnected()).toBe(false);
  });

  it("refuses a swap that arrives after the store has read", () => {
    // THE SILENT FAILURE THIS PINS. The store reads at module scope, so a
    // static `import App` evaluates it before any fetch can resolve. The app
    // then renders demo data against a configured backend and looks correct.
    source.items();
    expect(() => setDataSource(demoSource)).toThrow(/after the store already read/);
  });
});
