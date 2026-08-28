/**
 * The seeded fiction: Kilnworks, a 22-person ceramics works making tableware
 * for restaurants and independent shops.
 *
 * Ceramics was chosen because it makes a bill of materials legible without
 * inventing jargon. A dinner plate is clay, a glaze, a sheet of tissue and a
 * backstamp; a kiln firing is a production batch; a warped rim is a second.
 * Everything an inventory-and-production app needs to show is a real, ordinary
 * noun, and none of it collides with any other fiction in the marketplace.
 *
 * This module is an IMMUTABLE description. The store copies it on creation and
 * mutates the copy, so "Reset the demo" is a re-copy rather than a page reload,
 * and nothing here is ever written to.
 *
 * TIME IS PINNED to Tuesday 28 July 2026, 10:15 — mid-way through a 07:00–15:30
 * shift. Unlike the clinic desk and the hotel, this app ships no clock control:
 * the Floor advances the board, not the hour. Nothing reads a real clock.
 *
 * Every translatable string is stored as a KEY (`data.item.PLT-260-SPK`) with an
 * English fallback beside it, so an unseeded locale still renders a real word
 * instead of a dotted path. Proper nouns — people, suppliers, customers, towns —
 * stay literal: a name is a name in every language.
 */

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

/* ------------------------------------------------------------- the clock */

/** Tuesday 28 July 2026, 10:15, in a 07:00–15:30 shift. */
export const NOW: Now = {
  date: "2026-07-28",
  minutes: 10 * 60 + 15,
  shiftStart: 7 * 60,
  shiftEnd: 15 * 60 + 30,
};

/** VAT on a wholesale invoice. One rate, because this is one country. */
export const TAX_RATE = 0.2;

/** Who is on the desk, per persona. */
export const STAFF = {
  floor: { name: "Mara O.", ini: "MO" },
  office: { name: "Priya S.", ini: "PS" },
} as const;

/** The next code in each series. Seeds end one below each of these. */
export const NEXT = {
  run: 2318,
  lot: 15,
  po: 8815,
  invoice: 9042,
} as const;

/** The lot prefix. Lots are minted `LOT-2607-NN` within the month. */
export const LOT_PREFIX = "LOT-2607-";

/**
 * WHERE THE WORKS IS — the address a pallet leaves FROM.
 *
 * ── WHY IT TOOK THIS LONG TO EXIST ─────────────────────────────────────────
 *
 * Because nothing had ever needed it. The app knew where every order was
 * GOING before it knew where anything came from, which sounds backwards and is
 * not: an order's destination is a fact about the order, so it arrived with the
 * order book, and the works' own address is a fact about the works, so it had
 * no record to arrive on. The screens said "the works" and meant it — there was
 * no place they could have named.
 *
 * A route has two ends. The moment anything in this app has to describe one —
 * a label, a collection, a delivery note, a courier of any kind — the second
 * end stops being rhetorical, and a shop that cannot say where it posts from
 * has to be told rather than asked. So it is a record, in the same shape as
 * every other address here, seeded once and read through `DataSource`.
 *
 * ── ONE ADDRESS AND NOT A PAIR ─────────────────────────────────────────────
 *
 * A works can in principle have a trade counter at one door and a loading bay
 * at another, and a bigger firm would carry both. This one has a gate, and
 * inventing a second address nothing distinguishes would be a column nobody
 * could be wrong about. `db/schema.sql` says the same thing with a constraint:
 * `id = 'works'`, one row.
 *
 * THE TOWN IS REAL and the street is not, which is the rule the customers'
 * addresses already follow — Bridgwater has industrial estates and the TA6
 * outward code, and no firm on Brickyard Lane exists to be confused with this
 * one.
 */
export const WORKS: PostalAddress = {
  name: "Kilnworks",
  lines: ["Unit 7, Brickyard Lane", "Levels Trading Estate"],
  city: "Bridgwater",
  postcode: "TA6 4LN",
  country: "GB",
};

/* ---------------------------------------------------------------- glazes */

/**
 * A glaze is both a material on a shelf and a tint on a tile. The gradient
 * stops live here so a piece in Harbour blue looks the same on the floor board,
 * in the stock table, on a dispatch line and inside a kiln.
 */
export const GLAZES: Glaze[] = [
  { id: "speckled", nameKey: "data.glaze.speckled", from: "#b0a394", to: "#7c6f5f" },
  { id: "harbour", nameKey: "data.glaze.harbour", from: "#5b86b3", to: "#2f5680" },
  { id: "oxide", nameKey: "data.glaze.oxide", from: "#c06144", to: "#8c3a22" },
  { id: "matt", nameKey: "data.glaze.matt", from: "#d5d2cb", to: "#a29d93" },
];

/* ------------------------------------------------------------ components */

/**
 * Twenty components: three clay bodies, six glazes, packaging, boxes and kiln
 * furniture. Costs are what the works pays per unit, which is what every run
 * costing and every margin on the books is ultimately built from.
 *
 * `allocated` on CLY-STW-SPK deliberately exceeds `onHand` by 12 kg. That gap is
 * the whole reason RUN-2317 cannot start, and receiving the 120 kg still open on
 * PO-8813 is what clears it.
 */
const COMPONENTS: Item[] = [
  {
    sku: "CLY-STW-SPK",
    kind: "component",
    nameKey: "data.item.CLY-STW-SPK",
    name: "Speckled stoneware clay",
    unit: "kg",
    onHand: 48,
    allocated: 60,
    reorder: 40,
    cost: 1.85,
    icon: "layers",
  },
  {
    sku: "CLY-STW-WHT",
    kind: "component",
    nameKey: "data.item.CLY-STW-WHT",
    name: "White stoneware clay",
    unit: "kg",
    onHand: 320,
    allocated: 96,
    reorder: 80,
    cost: 1.65,
    icon: "layers",
  },
  {
    sku: "CLY-POR-FIN",
    kind: "component",
    nameKey: "data.item.CLY-POR-FIN",
    name: "Fine porcelain body",
    unit: "kg",
    onHand: 88,
    allocated: 42,
    reorder: 50,
    cost: 3.4,
    icon: "layers",
  },
  {
    sku: "GLZ-SPK-01",
    kind: "component",
    nameKey: "data.item.GLZ-SPK-01",
    name: "Speckled oatmeal glaze",
    unit: "L",
    onHand: 42,
    allocated: 6,
    reorder: 12,
    cost: 8.2,
    icon: "paint-bucket",
  },
  {
    sku: "GLZ-HAR-02",
    kind: "component",
    nameKey: "data.item.GLZ-HAR-02",
    name: "Harbour blue glaze",
    unit: "L",
    onHand: 18,
    allocated: 5,
    reorder: 12,
    cost: 9.6,
    icon: "paint-bucket",
  },
  {
    sku: "GLZ-OXD-03",
    kind: "component",
    nameKey: "data.item.GLZ-OXD-03",
    name: "Oxide red glaze",
    unit: "L",
    onHand: 9,
    allocated: 4,
    reorder: 10,
    cost: 11.4,
    icon: "paint-bucket",
  },
  {
    sku: "GLZ-CLR-04",
    kind: "component",
    nameKey: "data.item.GLZ-CLR-04",
    name: "Clear liner glaze",
    unit: "L",
    onHand: 26,
    allocated: 3,
    reorder: 10,
    cost: 6.3,
    icon: "paint-bucket",
  },
  {
    sku: "GLZ-MAT-05",
    kind: "component",
    nameKey: "data.item.GLZ-MAT-05",
    name: "Matt white glaze",
    unit: "L",
    onHand: 21,
    allocated: 4,
    reorder: 8,
    cost: 7.8,
    icon: "paint-bucket",
  },
  {
    sku: "GLZ-SLP-06",
    kind: "component",
    nameKey: "data.item.GLZ-SLP-06",
    name: "Black slip",
    unit: "L",
    onHand: 12,
    allocated: 1,
    reorder: 5,
    cost: 5.4,
    icon: "paint-bucket",
  },
  {
    sku: "PKG-TIS-01",
    kind: "component",
    nameKey: "data.item.PKG-TIS-01",
    name: "Tissue sheets",
    unit: "ea",
    onHand: 5200,
    allocated: 860,
    reorder: 1000,
    cost: 0.02,
    icon: "scroll",
  },
  {
    sku: "PKG-BUB-02",
    kind: "component",
    nameKey: "data.item.PKG-BUB-02",
    name: "Bubble wrap",
    unit: "m",
    onHand: 260,
    allocated: 40,
    reorder: 100,
    cost: 0.14,
    icon: "scroll",
  },
  {
    sku: "BOX-STD-12",
    kind: "component",
    nameKey: "data.item.BOX-STD-12",
    name: "Twelve-piece carton",
    unit: "ea",
    onHand: 180,
    allocated: 64,
    reorder: 90,
    cost: 0.68,
    icon: "box",
  },
  {
    sku: "BOX-SET-01",
    kind: "component",
    nameKey: "data.item.BOX-SET-01",
    name: "Service-set box",
    unit: "ea",
    onHand: 44,
    allocated: 24,
    reorder: 30,
    cost: 1.95,
    icon: "box",
  },
  {
    sku: "PKG-TAP-03",
    kind: "component",
    nameKey: "data.item.PKG-TAP-03",
    name: "Packing tape roll",
    unit: "ea",
    onHand: 22,
    allocated: 0,
    reorder: 8,
    cost: 1.1,
    icon: "circle-dot",
  },
  {
    sku: "KLN-SHF-40",
    kind: "component",
    nameKey: "data.item.KLN-SHF-40",
    name: "Kiln shelf 400 mm",
    unit: "ea",
    onHand: 26,
    allocated: 0,
    reorder: 6,
    cost: 24,
    icon: "square",
  },
  {
    sku: "KLN-PRP-75",
    kind: "component",
    nameKey: "data.item.KLN-PRP-75",
    name: "Kiln props 75 mm",
    unit: "ea",
    onHand: 118,
    allocated: 0,
    reorder: 30,
    cost: 3.2,
    icon: "columns-2",
  },
  {
    sku: "KLN-BAT-30",
    kind: "component",
    nameKey: "data.item.KLN-BAT-30",
    name: "Bat wash",
    unit: "kg",
    onHand: 7,
    allocated: 0,
    reorder: 4,
    cost: 4.6,
    icon: "paint-bucket",
  },
  {
    sku: "MSC-STK-01",
    kind: "component",
    nameKey: "data.item.MSC-STK-01",
    name: "Backstamp decals",
    unit: "ea",
    onHand: 3600,
    allocated: 720,
    reorder: 800,
    cost: 0.09,
    icon: "stamp",
  },
  {
    sku: "MSC-FLT-02",
    kind: "component",
    nameKey: "data.item.MSC-FLT-02",
    name: "Felt pads",
    unit: "ea",
    onHand: 940,
    allocated: 120,
    reorder: 300,
    cost: 0.03,
    icon: "circle",
  },
  {
    sku: "MSC-SAN-03",
    kind: "component",
    nameKey: "data.item.MSC-SAN-03",
    name: "Sanding pads",
    unit: "ea",
    onHand: 64,
    allocated: 0,
    reorder: 25,
    cost: 0.22,
    icon: "square",
  },
];

/* -------------------------------------------------------- finished goods */

/**
 * Fourteen finished pieces: a dinner plate, a side plate, a bowl and a mug in
 * each of three glazes, a jug, and the four-piece restaurant service set.
 *
 * `labour` and `overhead` are per unit and are what turn a bill of materials
 * into a unit cost. Two lines carry a deliberately thin margin — the jug and the
 * service set — because a margin table sorted worst-first is only useful when
 * something is actually worst.
 */
const PRODUCTS: Item[] = [
  {
    sku: "PLT-260-SPK",
    kind: "product",
    nameKey: "data.item.PLT-260-SPK",
    name: "Dinner plate 260 · Speckled",
    unit: "ea",
    onHand: 240,
    allocated: 96,
    reorder: 60,
    cost: 0,
    icon: "circle",
    glaze: "speckled",
    bom: [
      ["CLY-STW-SPK", 0.72],
      ["GLZ-SPK-01", 0.065],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.85,
    overhead: 0.95,
    price: 11.5,
  },
  {
    sku: "PLT-260-HAR",
    kind: "product",
    nameKey: "data.item.PLT-260-HAR",
    name: "Dinner plate 260 · Harbour",
    unit: "ea",
    onHand: 168,
    // 72 of these are promised to SO-5110, which is confirmed and unshipped.
    allocated: 72,
    reorder: 60,
    cost: 0,
    icon: "circle",
    glaze: "harbour",
    bom: [
      ["CLY-STW-WHT", 0.72],
      ["GLZ-HAR-02", 0.065],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.85,
    overhead: 0.95,
    price: 12,
  },
  {
    sku: "PLT-260-OXD",
    kind: "product",
    nameKey: "data.item.PLT-260-OXD",
    name: "Dinner plate 260 · Oxide",
    unit: "ea",
    onHand: 96,
    allocated: 0,
    reorder: 50,
    cost: 0,
    icon: "circle",
    glaze: "oxide",
    bom: [
      ["CLY-STW-WHT", 0.72],
      ["GLZ-OXD-03", 0.065],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.85,
    overhead: 0.95,
    price: 12.5,
  },
  {
    sku: "PLT-190-SPK",
    kind: "product",
    nameKey: "data.item.PLT-190-SPK",
    name: "Side plate 190 · Speckled",
    unit: "ea",
    onHand: 310,
    allocated: 90,
    reorder: 80,
    cost: 0,
    icon: "circle",
    glaze: "speckled",
    bom: [
      ["CLY-STW-SPK", 0.38],
      ["GLZ-SPK-01", 0.04],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.2,
    overhead: 0.62,
    price: 6.8,
  },
  {
    sku: "PLT-190-HAR",
    kind: "product",
    nameKey: "data.item.PLT-190-HAR",
    name: "Side plate 190 · Harbour",
    unit: "ea",
    onHand: 205,
    allocated: 0,
    reorder: 80,
    cost: 0,
    icon: "circle",
    glaze: "harbour",
    bom: [
      ["CLY-STW-WHT", 0.38],
      ["GLZ-HAR-02", 0.04],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.2,
    overhead: 0.62,
    price: 7.2,
  },
  {
    sku: "PLT-190-OXD",
    kind: "product",
    nameKey: "data.item.PLT-190-OXD",
    name: "Side plate 190 · Oxide",
    unit: "ea",
    onHand: 74,
    allocated: 36,
    reorder: 40,
    cost: 0,
    icon: "circle",
    glaze: "oxide",
    bom: [
      ["CLY-STW-WHT", 0.38],
      ["GLZ-OXD-03", 0.04],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.2,
    overhead: 0.62,
    price: 7.4,
  },
  {
    sku: "BWL-160-SPK",
    kind: "product",
    nameKey: "data.item.BWL-160-SPK",
    name: "Bowl 160 · Speckled",
    unit: "ea",
    onHand: 190,
    allocated: 0,
    reorder: 60,
    cost: 0,
    icon: "soup",
    glaze: "speckled",
    bom: [
      ["CLY-STW-SPK", 0.44],
      ["GLZ-SPK-01", 0.05],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.45,
    overhead: 0.72,
    price: 8.4,
  },
  {
    sku: "BWL-160-HAR",
    kind: "product",
    nameKey: "data.item.BWL-160-HAR",
    name: "Bowl 160 · Harbour",
    unit: "ea",
    onHand: 140,
    allocated: 0,
    reorder: 60,
    cost: 0,
    icon: "soup",
    glaze: "harbour",
    bom: [
      ["CLY-STW-WHT", 0.44],
      ["GLZ-HAR-02", 0.05],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.45,
    overhead: 0.72,
    price: 8.8,
  },
  {
    sku: "BWL-160-OXD",
    kind: "product",
    nameKey: "data.item.BWL-160-OXD",
    name: "Bowl 160 · Oxide",
    unit: "ea",
    onHand: 24,
    allocated: 24,
    reorder: 40,
    cost: 0,
    icon: "soup",
    glaze: "oxide",
    bom: [
      ["CLY-STW-WHT", 0.44],
      ["GLZ-OXD-03", 0.05],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.45,
    overhead: 0.72,
    price: 9.2,
  },
  {
    sku: "MUG-300-SPK",
    kind: "product",
    nameKey: "data.item.MUG-300-SPK",
    name: "Mug 300 · Speckled",
    unit: "ea",
    onHand: 260,
    allocated: 48,
    reorder: 70,
    cost: 0,
    icon: "coffee",
    glaze: "speckled",
    bom: [
      ["CLY-STW-SPK", 0.35],
      ["GLZ-SPK-01", 0.045],
      ["GLZ-CLR-04", 0.02],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.65,
    overhead: 0.8,
    price: 9.6,
  },
  {
    sku: "MUG-300-HAR",
    kind: "product",
    nameKey: "data.item.MUG-300-HAR",
    name: "Mug 300 · Harbour",
    unit: "ea",
    onHand: 176,
    // 48 of these are promised to SO-5110, which is confirmed and unshipped.
    allocated: 48,
    reorder: 70,
    cost: 0,
    icon: "coffee",
    glaze: "harbour",
    bom: [
      ["CLY-STW-WHT", 0.35],
      ["GLZ-HAR-02", 0.045],
      ["GLZ-CLR-04", 0.02],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.65,
    overhead: 0.8,
    price: 9.8,
  },
  {
    sku: "MUG-300-OXD",
    kind: "product",
    nameKey: "data.item.MUG-300-OXD",
    name: "Mug 300 · Oxide",
    unit: "ea",
    onHand: 36,
    allocated: 36,
    reorder: 40,
    cost: 0,
    icon: "coffee",
    glaze: "oxide",
    bom: [
      ["CLY-STW-WHT", 0.35],
      ["GLZ-OXD-03", 0.045],
      ["GLZ-CLR-04", 0.02],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
    ],
    labour: 1.65,
    overhead: 0.8,
    price: 10.2,
  },
  {
    sku: "JUG-900-OXD",
    kind: "product",
    nameKey: "data.item.JUG-900-OXD",
    name: "Water jug 900 · Oxide",
    unit: "ea",
    onHand: 18,
    allocated: 0,
    reorder: 20,
    cost: 0,
    icon: "milk",
    glaze: "oxide",
    bom: [
      ["CLY-STW-WHT", 0.86],
      ["GLZ-OXD-03", 0.09],
      ["GLZ-CLR-04", 0.03],
      ["PKG-TIS-01", 1],
      ["MSC-STK-01", 1],
      ["MSC-FLT-02", 3],
    ],
    labour: 3.2,
    overhead: 1.4,
    price: 13.2,
  },
  {
    sku: "SET-SVC-04",
    kind: "product",
    nameKey: "data.item.SET-SVC-04",
    name: "Restaurant service set · four pieces",
    unit: "set",
    onHand: 60,
    allocated: 0,
    reorder: 12,
    cost: 0,
    icon: "utensils",
    glaze: "matt",
    bom: [
      ["CLY-POR-FIN", 2.1],
      ["GLZ-MAT-05", 0.18],
      ["GLZ-SLP-06", 0.02],
      ["BOX-SET-01", 1],
      ["PKG-TIS-01", 4],
      ["MSC-STK-01", 4],
    ],
    labour: 7.4,
    overhead: 3.1,
    price: 42,
  },
];

export const ITEMS: Item[] = [...COMPONENTS, ...PRODUCTS];

/* -------------------------------------------------------------- stations */

export const STATIONS: Station[] = [
  {
    id: "ST-F1",
    nameKey: "data.station.ST-F1",
    name: "Forming bench 1",
    icon: "hammer",
    by: "Mara O.",
  },
  {
    id: "ST-F2",
    nameKey: "data.station.ST-F2",
    name: "Forming bench 2",
    icon: "hammer",
    by: "Denis K.",
  },
  { id: "ST-K1", nameKey: "data.station.ST-K1", name: "Kiln 1", icon: "flame", by: "Ivy R." },
  { id: "ST-K2", nameKey: "data.station.ST-K2", name: "Kiln 2", icon: "flame", by: "Ivy R." },
  {
    id: "ST-T1",
    nameKey: "data.station.ST-T1",
    name: "Finishing table",
    icon: "paintbrush",
    by: "Nell A.",
  },
];

/* ------------------------------------------------------------------ runs */

/**
 * Six runs across the six columns, one per stage.
 *
 * RUN-2317 is the one that matters: it sits in Queued and cannot start, because
 * 60 kg of speckled stoneware clay is promised to other work and only 48 kg is
 * on the shelf. The board names the component and the shortfall rather than
 * greying a button out, and receiving PO-8813's outstanding 120 kg clears it.
 */
export const RUNS: Run[] = [
  {
    code: "RUN-2312",
    sku: "SET-SVC-04",
    qty: 60,
    good: 60,
    scrap: 3,
    stage: "complete",
    station: "ST-T1",
    startedMin: 195,
    lot: "LOT-2607-09",
    signoffs: { forming: "Denis K.", firing: "Ivy R.", finishing: "Nell A." },
    forOrder: null,
    madeInSession: false,
  },
  {
    code: "RUN-2313",
    sku: "PLT-260-HAR",
    qty: 240,
    good: 186,
    scrap: 6,
    stage: "finishing",
    station: "ST-T1",
    startedMin: 168,
    lot: "LOT-2607-10",
    signoffs: { forming: "Denis K.", firing: "Ivy R." },
    forOrder: null,
    madeInSession: false,
  },
  {
    code: "RUN-2314",
    sku: "BWL-160-OXD",
    qty: 180,
    good: 92,
    scrap: 5,
    stage: "firing",
    station: "ST-K1",
    startedMin: 132,
    lot: "LOT-2607-11",
    signoffs: { forming: "Mara O." },
    forOrder: "SO-5108",
    madeInSession: false,
  },
  {
    code: "RUN-2315",
    sku: "MUG-300-SPK",
    qty: 300,
    good: 118,
    scrap: 4,
    stage: "forming",
    station: "ST-F1",
    startedMin: 96,
    lot: "LOT-2607-12",
    signoffs: {},
    forOrder: null,
    madeInSession: false,
  },
  {
    code: "RUN-2316",
    sku: "PLT-190-SPK",
    qty: 360,
    good: 0,
    scrap: 0,
    stage: "released",
    station: "ST-F2",
    startedMin: 24,
    lot: null,
    signoffs: {},
    forOrder: null,
    madeInSession: false,
  },
  {
    code: "RUN-2317",
    sku: "PLT-260-SPK",
    qty: 200,
    good: 0,
    scrap: 0,
    stage: "queued",
    station: null,
    startedMin: null,
    lot: null,
    signoffs: {},
    forOrder: null,
    madeInSession: false,
  },
];

/* --------------------------------------------------------------- firings */

const GLAZE_STEPS = [
  { labelKey: "data.firestep.ramp", label: "Ramp", to: 600, hold: 0 },
  { labelKey: "data.firestep.climb", label: "Climb", to: 1000, hold: 20 },
  { labelKey: "data.firestep.soak", label: "Soak", to: 1240, hold: 20 },
  { labelKey: "data.firestep.cool", label: "Cool", to: 900, hold: 90 },
];

const BISQUE_STEPS = [
  { labelKey: "data.firestep.candle", label: "Candle", to: 200, hold: 120 },
  { labelKey: "data.firestep.ramp", label: "Ramp", to: 600, hold: 0 },
  { labelKey: "data.firestep.soak", label: "Soak", to: 1000, hold: 15 },
  { labelKey: "data.firestep.cool", label: "Cool", to: 700, hold: 60 },
];

export const FIRINGS: Firing[] = [
  {
    code: "FIR-4470",
    station: "ST-K1",
    programmeKey: "data.programme.bisque",
    programme: "Bisque · 1000 °C",
    status: "unloaded",
    current: 62,
    target: 1000,
    loaded: 22 * 60 + 10,
    started: 22 * 60 + 30,
    due: 6 * 60 + 40,
    startedMin: null,
    shelves: 7,
    capacity: 7,
    kwh: 132,
    contents: [{ run: "RUN-2312", sku: "SET-SVC-04", qty: 63 }],
    steps: BISQUE_STEPS,
  },
  {
    code: "FIR-4471",
    station: "ST-K1",
    programmeKey: "data.programme.glaze",
    programme: "Glaze · 1240 °C",
    status: "firing",
    current: 1148,
    target: 1240,
    loaded: 7 * 60 + 20,
    started: 7 * 60 + 35,
    due: 14 * 60 + 10,
    startedMin: 160,
    shelves: 6,
    capacity: 7,
    kwh: null,
    contents: [{ run: "RUN-2314", sku: "BWL-160-OXD", qty: 97 }],
    steps: GLAZE_STEPS,
  },
  {
    code: "FIR-4472",
    station: "ST-K2",
    programmeKey: "data.programme.bisque",
    programme: "Bisque · 1000 °C",
    status: "cooling",
    current: 640,
    target: 1000,
    loaded: 5 * 60 + 40,
    started: 6 * 60,
    due: 11 * 60 + 30,
    startedMin: 255,
    shelves: 7,
    capacity: 7,
    kwh: 148,
    contents: [{ run: "RUN-2313", sku: "PLT-260-HAR", qty: 192 }],
    steps: BISQUE_STEPS,
  },
  {
    code: "FIR-4473",
    station: "ST-K2",
    programmeKey: "data.programme.glaze",
    programme: "Glaze · 1240 °C",
    status: "loading",
    current: 24,
    target: 1240,
    loaded: 10 * 60 + 5,
    started: null,
    due: 18 * 60 + 40,
    startedMin: null,
    shelves: 3,
    capacity: 7,
    kwh: null,
    contents: [{ run: "RUN-2315", sku: "MUG-300-SPK", qty: 122 }],
    steps: GLAZE_STEPS,
  },
];

/* --------------------------------------------------------------- seconds */

/** The reasons a piece is set aside, in the order the log lists them. */
export const DEFECT_REASONS = [
  "warp",
  "crack",
  "crawl",
  "pinhole",
  "chip",
  "handling",
] as const;

/**
 * Every second logged this shift. The quantities add up to each run's own
 * `scrap` — 3 + 6 + 5 + 4 = 18 — because a seconds log that disagrees with the
 * board is a seconds log nobody reads twice.
 */
export const DEFECTS: Defect[] = [
  { at: 468, run: "RUN-2312", sku: "SET-SVC-04", station: "ST-T1", reason: "chip", qty: 1, by: "Nell A." },
  { at: 485, run: "RUN-2312", sku: "SET-SVC-04", station: "ST-K1", reason: "crack", qty: 2, by: "Ivy R." },
  { at: 500, run: "RUN-2313", sku: "PLT-260-HAR", station: "ST-F2", reason: "warp", qty: 2, by: "Denis K." },
  { at: 532, run: "RUN-2313", sku: "PLT-260-HAR", station: "ST-K2", reason: "crawl", qty: 3, by: "Ivy R." },
  { at: 554, run: "RUN-2313", sku: "PLT-260-HAR", station: "ST-T1", reason: "chip", qty: 1, by: "Nell A." },
  { at: 566, run: "RUN-2314", sku: "BWL-160-OXD", station: "ST-F1", reason: "warp", qty: 3, by: "Mara O." },
  { at: 580, run: "RUN-2314", sku: "BWL-160-OXD", station: "ST-K1", reason: "pinhole", qty: 2, by: "Ivy R." },
  { at: 598, run: "RUN-2315", sku: "MUG-300-SPK", station: "ST-F1", reason: "handling", qty: 1, by: "Mara O." },
  { at: 606, run: "RUN-2315", sku: "MUG-300-SPK", station: "ST-F1", reason: "warp", qty: 3, by: "Mara O." },
];

/* ------------------------------------------------------------- suppliers */

export const SUPPLIERS: Supplier[] = [
  {
    id: "SUP-CLY",
    name: "Thornbury Clays",
    contact: "orders@thornburyclays.example",
    lead: 7,
    onTime: 0.96,
    last: "2026-07-21",
    supplies: ["CLY-STW-SPK", "CLY-STW-WHT", "CLY-POR-FIN"],
  },
  {
    id: "SUP-GLZ",
    name: "Kestrel Glaze Co",
    contact: "sales@kestrelglaze.example",
    lead: 10,
    onTime: 0.88,
    last: "2026-07-14",
    supplies: [
      "GLZ-SPK-01",
      "GLZ-HAR-02",
      "GLZ-OXD-03",
      "GLZ-CLR-04",
      "GLZ-MAT-05",
      "GLZ-SLP-06",
    ],
  },
  {
    id: "SUP-PKG",
    name: "Marlow Packaging",
    contact: "hello@marlowpack.example",
    lead: 4,
    onTime: 0.99,
    last: "2026-07-24",
    supplies: [
      "PKG-TIS-01",
      "PKG-BUB-02",
      "BOX-STD-12",
      "BOX-SET-01",
      "PKG-TAP-03",
      "MSC-STK-01",
      "MSC-FLT-02",
    ],
  },
  {
    id: "SUP-KLN",
    name: "Redwing Kiln Supplies",
    contact: "trade@redwingkilns.example",
    lead: 14,
    onTime: 0.82,
    last: "2026-06-30",
    supplies: ["KLN-SHF-40", "KLN-PRP-75", "KLN-BAT-30", "MSC-SAN-03"],
  },
];

/* ------------------------------------------------------- purchase orders */

/**
 * PO-8813 is the one to look at: a partial receipt that left one line open at
 * 120 kg outstanding, moved the order to Part-received, added the 180 kg that
 * did arrive to stock, and is now four days past its date.
 */
export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    code: "PO-8810",
    supplier: "SUP-PKG",
    status: "received",
    raised: "2026-07-14",
    due: "2026-07-18",
    lines: [
      { sku: "BOX-STD-12", qty: 200, received: 200, cost: 0.68 },
      { sku: "PKG-TIS-01", qty: 5000, received: 5000, cost: 0.02 },
    ],
  },
  {
    code: "PO-8811",
    supplier: "SUP-GLZ",
    status: "received",
    raised: "2026-07-04",
    due: "2026-07-14",
    lines: [
      { sku: "GLZ-SPK-01", qty: 40, received: 40, cost: 8.2 },
      { sku: "GLZ-HAR-02", qty: 20, received: 20, cost: 9.6 },
    ],
  },
  {
    code: "PO-8812",
    supplier: "SUP-KLN",
    status: "sent",
    raised: "2026-07-16",
    due: "2026-07-30",
    lines: [
      { sku: "KLN-SHF-40", qty: 8, received: 0, cost: 24 },
      { sku: "KLN-PRP-75", qty: 40, received: 0, cost: 3.2 },
    ],
  },
  {
    code: "PO-8813",
    supplier: "SUP-CLY",
    status: "part_received",
    raised: "2026-07-17",
    due: "2026-07-24",
    lines: [
      { sku: "CLY-STW-SPK", qty: 300, received: 180, cost: 1.85 },
      { sku: "CLY-STW-WHT", qty: 200, received: 200, cost: 1.65 },
    ],
  },
  {
    code: "PO-8814",
    supplier: "SUP-GLZ",
    status: "draft",
    raised: "2026-07-27",
    due: "2026-08-10",
    lines: [{ sku: "GLZ-OXD-03", qty: 30, received: 0, cost: 11.4 }],
  },
];

/* ------------------------------------------------------------- customers */

export const CUSTOMERS: Customer[] = [
  { id: "CUS-01", name: "Harbour & Vine", city: "Falmouth", kind: "restaurant" },
  { id: "CUS-02", name: "The Salt Room", city: "Whitstable", kind: "restaurant" },
  { id: "CUS-03", name: "Pennyfields Homeware", city: "Bristol", kind: "shop" },
  { id: "CUS-04", name: "Bramble & Co", city: "Bath", kind: "shop" },
  { id: "CUS-05", name: "Otterbourne Kitchen", city: "Winchester", kind: "restaurant" },
  { id: "CUS-06", name: "The Copper Pot", city: "Ludlow", kind: "restaurant" },
  { id: "CUS-07", name: "Wrenfield Stores", city: "York", kind: "shop" },
  { id: "CUS-08", name: "Marling Deli", city: "Norwich", kind: "deli" },
];

/* ---------------------------------------------------------- sales orders */

/**
 * Nine wholesale orders. Seven have been invoiced, one is being picked and one
 * is confirmed — and those last two each carry a line that cannot be filled from
 * the shelf, which is what the "Make it" button is for: it raises a run for
 * exactly the shortfall and drops it into Queued on the floor board.
 *
 * The two shortfalls are stated the same way twice on purpose. `qty − alloc` is
 * what the order book says is short; `qty − onHand` is what the picker finds on
 * the shelf. The seed keeps them equal so a reader is never asked to reconcile
 * two different numbers for the same problem.
 *
 * WHERE EACH ONE GOES is on the order, and the seed repeats a customer's own
 * address across their orders on purpose: an order takes a COPY of the address
 * at the moment it is placed, and a customer moving next year does not rewrite
 * the label on a pallet that went out last month. The two orders that are not
 * copies are the point — SO-5109 goes to Harbour & Vine's second site while
 * SO-5102 went to the restaurant, and SO-5108 has no address at all because the
 * deli collects. Both of those are open, so both are on the Dispatch screen.
 *
 * The addresses are invented. The towns are real because the customers already
 * live in real towns, and the outward halves of the postcodes are the ones
 * those towns actually use, so nothing on a label reads as nonsense to somebody
 * who knows the country. No street here belongs to a real firm.
 */
export const SALES_ORDERS: SalesOrder[] = [
  {
    code: "SO-5101",
    customer: "CUS-03",
    status: "invoiced",
    placed: "2026-05-28",
    requiredBy: "2026-06-11",
    invoice: "INV-9035",
    deliverTo: {
      name: "Pennyfields Homeware",
      lines: ["Unit 6, Colston Yard"],
      city: "Bristol",
      postcode: "BS1 5DL",
      country: "GB",
    },
    lines: [
      { sku: "PLT-260-SPK", qty: 120, alloc: 120, price: 11.5, run: null },
      { sku: "BWL-160-SPK", qty: 80, alloc: 80, price: 8.4, run: null },
    ],
  },
  {
    code: "SO-5102",
    customer: "CUS-01",
    status: "invoiced",
    placed: "2026-06-05",
    requiredBy: "2026-06-19",
    invoice: "INV-9036",
    deliverTo: {
      name: "Harbour & Vine",
      lines: ["The Old Sail Loft", "3 Bar Road"],
      city: "Falmouth",
      postcode: "TR11 4BN",
      country: "GB",
    },
    lines: [
      { sku: "SET-SVC-04", qty: 24, alloc: 24, price: 42, run: null },
      { sku: "MUG-300-HAR", qty: 60, alloc: 60, price: 9.8, run: null },
    ],
  },
  {
    code: "SO-5103",
    customer: "CUS-05",
    status: "invoiced",
    placed: "2026-05-18",
    requiredBy: "2026-05-30",
    invoice: "INV-9037",
    deliverTo: {
      name: "Otterbourne Kitchen",
      lines: ["The Granary", "Water Lane"],
      city: "Winchester",
      postcode: "SO23 9EX",
      country: "GB",
    },
    lines: [{ sku: "PLT-190-HAR", qty: 200, alloc: 200, price: 7.2, run: null }],
  },
  {
    code: "SO-5104",
    customer: "CUS-02",
    status: "invoiced",
    placed: "2026-06-22",
    requiredBy: "2026-07-06",
    invoice: "INV-9038",
    deliverTo: {
      name: "The Salt Room",
      lines: ["18 Sea Street"],
      city: "Whitstable",
      postcode: "CT5 1AP",
      country: "GB",
    },
    lines: [
      { sku: "BWL-160-HAR", qty: 90, alloc: 90, price: 8.8, run: null },
      { sku: "PLT-260-HAR", qty: 60, alloc: 60, price: 12, run: null },
    ],
  },
  {
    code: "SO-5105",
    customer: "CUS-04",
    status: "invoiced",
    placed: "2026-07-02",
    requiredBy: "2026-07-16",
    invoice: "INV-9039",
    deliverTo: {
      name: "Bramble & Co",
      lines: ["4 Northgate Buildings"],
      city: "Bath",
      postcode: "BA1 5AS",
      country: "GB",
    },
    lines: [{ sku: "MUG-300-SPK", qty: 108, alloc: 108, price: 9.6, run: null }],
  },
  {
    code: "SO-5106",
    customer: "CUS-07",
    status: "invoiced",
    placed: "2026-07-10",
    requiredBy: "2026-07-24",
    invoice: "INV-9040",
    deliverTo: {
      name: "Wrenfield Stores",
      lines: ["Wrenfield Yard", "Fossgate"],
      city: "York",
      postcode: "YO1 9TA",
      country: "GB",
    },
    lines: [
      { sku: "PLT-190-SPK", qty: 120, alloc: 120, price: 6.8, run: null },
      { sku: "BWL-160-SPK", qty: 60, alloc: 60, price: 8.4, run: null },
    ],
  },
  {
    code: "SO-5107",
    customer: "CUS-06",
    status: "invoiced",
    placed: "2026-07-14",
    requiredBy: "2026-07-27",
    invoice: "INV-9041",
    deliverTo: {
      name: "The Copper Pot",
      lines: ["11 Corve Street"],
      city: "Ludlow",
      postcode: "SY8 1DA",
      country: "GB",
    },
    lines: [
      { sku: "PLT-260-OXD", qty: 48, alloc: 48, price: 12.5, run: null },
      { sku: "MUG-300-HAR", qty: 72, alloc: 72, price: 9.8, run: null },
    ],
  },
  {
    code: "SO-5108",
    customer: "CUS-08",
    status: "picking",
    placed: "2026-07-17",
    requiredBy: "2026-07-30",
    invoice: null,
    // Their own van comes for it — a rush the deli is fetching rather than
    // waiting on. A null is the COLLECTION, not a missing address; see
    // `SalesOrder.deliverTo` for what that costs and what it buys.
    deliverTo: null,
    lines: [
      { sku: "BWL-160-OXD", qty: 60, alloc: 24, price: 9.2, run: null },
      { sku: "MUG-300-SPK", qty: 48, alloc: 48, price: 9.6, run: null },
      { sku: "PLT-190-SPK", qty: 90, alloc: 90, price: 6.8, run: null },
    ],
  },
  {
    code: "SO-5109",
    customer: "CUS-01",
    status: "confirmed",
    placed: "2026-07-21",
    requiredBy: "2026-07-31",
    invoice: null,
    // The second site, and the reason this fact lives on the order rather
    // than on the customer: SO-5102 went to the Falmouth restaurant.
    deliverTo: {
      name: "Harbour & Vine — Truro",
      lines: ["Unit 2, Tregoose Yard"],
      city: "Truro",
      postcode: "TR1 2XN",
      country: "GB",
    },
    lines: [
      { sku: "MUG-300-OXD", qty: 48, alloc: 36, price: 10.2, run: null },
      { sku: "PLT-260-SPK", qty: 96, alloc: 96, price: 11.5, run: null },
      { sku: "PLT-190-OXD", qty: 36, alloc: 36, price: 7.4, run: null },
    ],
  },
  {
    code: "SO-5110",
    customer: "CUS-03",
    status: "confirmed",
    placed: "2026-07-22",
    requiredBy: "2026-08-04",
    invoice: null,
    /*
     * THE ADDRESS ON THIS ONE IS WRONG, AND IT IS WRONG ON PURPOSE.
     *
     * `BS11` is half a postcode: the outward half. Pennyfields moved their
     * stock out to the warehouse at Avonmouth, the office copied the code off
     * the old shop's letterhead and stopped at the space, and nothing in this
     * app has ever had a reason to notice — a label prints what it is given.
     *
     * ── WHY A SEED CARRIES A DEFECT AT ALL ─────────────────────────────────
     *
     * Because the alternative is a demo in which nothing is ever wrong, and a
     * works desk whose every address is already perfect teaches a reader
     * nothing about the half of the job that is chasing an address down. The
     * two orders around it are the contrast: SO-5109 has a good address and
     * SO-5108 has none because the customer collects, so all three answers a
     * real order book gives are on the Dispatch screen at once.
     *
     * It is also the only kind of wrong worth seeding: ONE FIELD, visible on
     * the card, and correctable by typing. Anything that checks a postcode
     * against its country refuses this and says which field — and if nothing
     * ever checks, the works posts a pallet to a town rather than an address,
     * which is exactly the outcome the checking is for.
     *
     * The order is otherwise ordinary and both its lines are on the shelf, so
     * the address is the only thing standing between it and a pallet.
     */
    deliverTo: {
      name: "Pennyfields Homeware — Avonmouth",
      lines: ["Gate 3, Kingsweston Yard"],
      city: "Bristol",
      postcode: "BS11",
      country: "GB",
    },
    lines: [
      { sku: "PLT-260-HAR", qty: 72, alloc: 72, price: 12, run: null },
      { sku: "MUG-300-HAR", qty: 48, alloc: 48, price: 9.8, run: null },
    ],
  },
];

/* -------------------------------------------------------------- invoices */

/**
 * Seven invoices. Two are late at clearly different ages — eleven days and
 * forty-four — so two aging buckets carry an amount and the 61-plus bucket sits
 * honestly empty. INV-9039 is part-paid and not yet due, which is the only way
 * a Part-paid pill can exist: once an invoice is late, late is the thing worth
 * saying about it.
 */
export const INVOICES: Invoice[] = [
  {
    number: "INV-9035",
    order: "SO-5101",
    customer: "CUS-03",
    issued: "2026-06-11",
    due: "2026-06-25",
    payments: [{ date: "2026-06-24", method: "transfer", amount: 2462.4 }],
  },
  {
    number: "INV-9036",
    order: "SO-5102",
    customer: "CUS-01",
    issued: "2026-06-19",
    due: "2026-07-03",
    payments: [{ date: "2026-07-01", method: "transfer", amount: 1915.2 }],
  },
  {
    number: "INV-9037",
    order: "SO-5103",
    customer: "CUS-05",
    issued: "2026-05-31",
    due: "2026-06-14",
    payments: [],
  },
  {
    number: "INV-9038",
    order: "SO-5104",
    customer: "CUS-02",
    issued: "2026-07-03",
    due: "2026-07-17",
    payments: [{ date: "2026-07-20", method: "transfer", amount: 700 }],
  },
  {
    number: "INV-9039",
    order: "SO-5105",
    customer: "CUS-04",
    issued: "2026-07-16",
    due: "2026-07-30",
    payments: [{ date: "2026-07-24", method: "card", amount: 500 }],
  },
  {
    number: "INV-9040",
    order: "SO-5106",
    customer: "CUS-07",
    issued: "2026-07-24",
    due: "2026-08-07",
    payments: [],
  },
  {
    number: "INV-9041",
    order: "SO-5107",
    customer: "CUS-06",
    issued: "2026-07-27",
    due: "2026-08-10",
    payments: [],
  },
];

/* ---------------------------------------------------------------- counts */

export const COUNT_SHEETS: CountSheet[] = [
  {
    code: "CNT-217",
    zoneKey: "data.zone.glaze",
    zone: "Glaze store",
    by: "Priya S.",
    opened: "2026-07-28",
    status: "open",
    lines: [
      { sku: "GLZ-SPK-01", counted: null },
      { sku: "GLZ-HAR-02", counted: 17 },
      { sku: "GLZ-OXD-03", counted: null },
      { sku: "GLZ-CLR-04", counted: 26 },
    ],
  },
  {
    code: "CNT-216",
    zoneKey: "data.zone.packing",
    zone: "Packing bay",
    by: "Tomas B.",
    opened: "2026-07-21",
    status: "posted",
    lines: [
      { sku: "BOX-STD-12", counted: 180 },
      { sku: "PKG-TIS-01", counted: 5200 },
      { sku: "BOX-SET-01", counted: 44 },
      { sku: "PKG-TAP-03", counted: 22 },
    ],
  },
];

/* ------------------------------------------------------------- movements */

/**
 * The movement history behind the stock drawer.
 *
 * This is a window on the ledger, not the whole of it: the drawer derives an
 * OPENING BALANCE by subtracting these rows from what is on hand, so a partial
 * history still adds up down the right-hand column. Rows are in date order, and
 * the drawer reverses them so the newest is at the top with the opening balance
 * at the bottom, which is the direction people read a statement.
 */
export const MOVEMENTS: Movement[] = [
  /* --- clay --- */
  { sku: "CLY-STW-SPK", date: "2026-07-21", kind: "receipt", ref: "PO-8813", qty: 180 },
  { sku: "CLY-STW-SPK", date: "2026-07-22", kind: "issue", ref: "RUN-2310", qty: -86.4 },
  { sku: "CLY-STW-SPK", date: "2026-07-24", kind: "issue", ref: "RUN-2311", qty: -64.8 },
  { sku: "CLY-STW-SPK", date: "2026-07-28", kind: "issue", ref: "RUN-2315", qty: -42.7 },
  { sku: "CLY-STW-WHT", date: "2026-07-21", kind: "receipt", ref: "PO-8813", qty: 200 },
  { sku: "CLY-STW-WHT", date: "2026-07-27", kind: "issue", ref: "RUN-2313", qty: -138.24 },
  { sku: "CLY-STW-WHT", date: "2026-07-28", kind: "issue", ref: "RUN-2314", qty: -42.68 },
  { sku: "CLY-POR-FIN", date: "2026-07-27", kind: "issue", ref: "RUN-2312", qty: -132.3 },

  /* --- glazes --- */
  { sku: "GLZ-SPK-01", date: "2026-07-14", kind: "receipt", ref: "PO-8811", qty: 40 },
  { sku: "GLZ-SPK-01", date: "2026-07-28", kind: "issue", ref: "RUN-2315", qty: -5.49 },
  { sku: "GLZ-HAR-02", date: "2026-07-14", kind: "receipt", ref: "PO-8811", qty: 20 },
  { sku: "GLZ-HAR-02", date: "2026-07-27", kind: "issue", ref: "RUN-2313", qty: -12.48 },
  { sku: "GLZ-OXD-03", date: "2026-07-28", kind: "issue", ref: "RUN-2314", qty: -4.85 },
  { sku: "GLZ-MAT-05", date: "2026-07-27", kind: "issue", ref: "RUN-2312", qty: -11.34 },

  /* --- packaging --- */
  { sku: "BOX-STD-12", date: "2026-07-18", kind: "receipt", ref: "PO-8810", qty: 200 },
  { sku: "BOX-STD-12", date: "2026-07-26", kind: "issue", ref: "SO-5101", qty: -17 },
  { sku: "BOX-STD-12", date: "2026-07-28", kind: "issue", ref: "SO-5106", qty: -15 },
  { sku: "BOX-SET-01", date: "2026-07-27", kind: "issue", ref: "RUN-2312", qty: -63 },
  { sku: "PKG-TIS-01", date: "2026-07-18", kind: "receipt", ref: "PO-8810", qty: 5000 },
  { sku: "PKG-TIS-01", date: "2026-07-27", kind: "issue", ref: "RUN-2313", qty: -192 },
  { sku: "PKG-TIS-01", date: "2026-07-28", kind: "issue", ref: "RUN-2315", qty: -122 },
  { sku: "MSC-STK-01", date: "2026-07-27", kind: "issue", ref: "RUN-2313", qty: -192 },
  { sku: "MSC-STK-01", date: "2026-07-28", kind: "issue", ref: "RUN-2315", qty: -122 },

  /* --- finished goods --- */
  { sku: "PLT-260-SPK", date: "2026-07-22", kind: "production", ref: "RUN-2310", qty: 236, lot: "LOT-2607-06" },
  { sku: "PLT-260-SPK", date: "2026-07-26", kind: "shipment", ref: "SO-5101", qty: -120 },
  { sku: "PLT-260-HAR", date: "2026-07-27", kind: "production", ref: "RUN-2313", qty: 186, lot: "LOT-2607-10" },
  { sku: "PLT-190-SPK", date: "2026-07-24", kind: "production", ref: "RUN-2311", qty: 348, lot: "LOT-2607-07" },
  { sku: "PLT-190-SPK", date: "2026-07-28", kind: "shipment", ref: "SO-5106", qty: -120 },
  { sku: "BWL-160-SPK", date: "2026-07-28", kind: "shipment", ref: "SO-5106", qty: -60 },
  { sku: "MUG-300-SPK", date: "2026-07-20", kind: "production", ref: "RUN-2309", qty: 180, lot: "LOT-2607-05" },
  { sku: "MUG-300-SPK", date: "2026-07-25", kind: "shipment", ref: "SO-5105", qty: -108 },
  { sku: "MUG-300-SPK", date: "2026-07-28", kind: "production", ref: "RUN-2315", qty: 118, lot: "LOT-2607-12" },
  { sku: "SET-SVC-04", date: "2026-07-27", kind: "production", ref: "RUN-2312", qty: 60, lot: "LOT-2607-09" },
  { sku: "SET-SVC-04", date: "2026-07-27", kind: "shipment", ref: "SO-5102", qty: -24 },
  { sku: "BWL-160-OXD", date: "2026-07-21", kind: "adjustment", ref: "CNT-216", qty: -4 },
];
