/**
 * The shapes the works desk runs on.
 *
 * Two rules hold everywhere below.
 *
 * 1. NOTHING here is a formatted string. Quantities are numbers, money is a
 *    number of pounds, dates are ISO `YYYY-MM-DD`, and times of day are minutes
 *    since midnight. Everything a reader sees is produced at render time by
 *    `lib/format.ts` against the live locale, so switching language never has to
 *    re-shape the data.
 *
 * 2. Anything derived is ABSENT. A run's yield, an item's available quantity, an
 *    invoice's status and outstanding amount, the period roll-up on the books —
 *    none of them are stored, because a stored derivation is a second source of
 *    truth that drifts the first time somebody edits the other one. They are
 *    computed in `lib/production.ts` and `lib/ledger.ts` from what is here.
 *
 * The one deliberate exception is `Item.allocated`. It is a real ledger position
 * — stock promised to an order that has not shipped — not a derivation of the
 * order book, because a partial allocation is a decision somebody made rather
 * than an arithmetic consequence.
 */

/* -------------------------------------------------------------- navigation */

export type Persona = "floor" | "office";

export type View =
  /* Floor */
  | "board"
  | "stations"
  | "firings"
  | "seconds"
  | "handover"
  /* Office */
  | "stock"
  | "counts"
  | "purchasing"
  | "suppliers"
  | "orders"
  | "dispatch"
  | "invoices"
  | "recipes"
  | "books"
  /* The works' own record: where it is, and what it is connected to. */
  | "works"
  | "notfound";

/** Where each persona lands when the dock switches to it. */
export const HOME_VIEW: Record<Persona, View> = {
  floor: "board",
  office: "stock",
};

/* ------------------------------------------------------------- the clock */

/**
 * The pinned "now".
 *
 * `date` is the shift's calendar day and `minutes` is the point in it. Unlike
 * the clinic desk and the hotel, this app ships NO clock control: the Floor
 * advances the board, not the hour (21 D6a). The value is therefore constant
 * for the whole session and exists so that ages, elapsed chips and required-by
 * dates have one place to resolve against instead of reading a real clock.
 */
export interface Now {
  /** ISO `YYYY-MM-DD` — Tuesday 28 July 2026. */
  date: string;
  /** Minutes since midnight — 10:15, mid-way through a 07:00–15:30 shift. */
  minutes: number;
  /** Shift bounds, in minutes since midnight. */
  shiftStart: number;
  shiftEnd: number;
}

/* ---------------------------------------------------------------- catalogue */

/**
 * A glaze is a colour on a shelf and a gradient on a tile, so the two live
 * together: `from`/`to` are the tile's stops, and every piece in that glaze is
 * tinted the same way everywhere it appears.
 */
export interface Glaze {
  id: string;
  /** i18n key for the glaze's name — resolved through `tOr`. */
  nameKey: string;
  from: string;
  to: string;
}

export type ItemKind = "component" | "product";

/**
 * A row in the stock ledger. Components and finished goods share the shape
 * because they share the ledger: both are received or made, allocated, issued
 * and counted, and the movement history does not care which it is looking at.
 *
 * `unit` is the unit code (`kg`, `ea`, `set`, `L`), resolved to the reader's
 * language at render time.
 */
export interface Item {
  sku: string;
  kind: ItemKind;
  /** i18n key for the item name — `data.item.<sku>`. */
  nameKey: string;
  /** English fallback, so an unseeded locale still renders something real. */
  name: string;
  unit: string;
  onHand: number;
  /** Promised to an order that has not shipped. NOT derived. */
  allocated: number;
  /** Below this, the reorder bar turns amber. */
  reorder: number;
  /** What one unit costs to buy (components) — pounds. */
  cost: number;
  /** Lucide icon name. */
  icon: string;
  /** Finished goods only. */
  glaze?: string;
  /** Finished goods only — `[componentSku, perUnitQty]`. */
  bom?: [string, number][];
  /** Finished goods only — labour and overhead per unit, pounds. */
  labour?: number;
  overhead?: number;
  /** Finished goods only — the price list rate, pounds. */
  price?: number;
}

/* --------------------------------------------------------------- the floor */

export const STAGES = [
  "queued",
  "released",
  "forming",
  "firing",
  "finishing",
  "complete",
] as const;

export type Stage = (typeof STAGES)[number];

/** The three stages that carry a sign-off in the run panel. */
export const SIGNOFF_STAGES = ["forming", "firing", "finishing"] as const;

export type SignoffStage = (typeof SIGNOFF_STAGES)[number];

export interface Station {
  id: string;
  /** i18n key — `data.station.<id>`. */
  nameKey: string;
  name: string;
  icon: string;
  /** Who is on it this shift. */
  by: string;
}

export interface Run {
  code: string;
  sku: string;
  qty: number;
  good: number;
  scrap: number;
  stage: Stage;
  /** Station id, or null while the run is waiting for a bench. */
  station: string | null;
  /** Minutes elapsed on the floor, or null before it starts. */
  startedMin: number | null;
  /** Lot code, minted when output is first recorded. */
  lot: string | null;
  signoffs: Partial<Record<SignoffStage, string>>;
  /** Sales order this run was raised for, if any. */
  forOrder: string | null;
  /**
   * Raised during the session by "Make it". Such a run carries its own
   * allocation and is therefore never blocked on a short component — the
   * shortfall it was created for is the reason it exists.
   */
  madeInSession: boolean;
}

export type MovementKind =
  | "receipt"
  | "issue"
  | "production"
  | "shipment"
  | "adjustment";

export interface Movement {
  sku: string;
  date: string;
  kind: MovementKind;
  /** The run, order or count sheet that caused it. */
  ref: string;
  /** Signed: positive in, negative out. */
  qty: number;
  lot?: string;
}

export type FiringStatus = "loading" | "firing" | "cooling" | "unloaded";

export interface FiringStep {
  /** i18n key — `data.firestep.<id>`. */
  labelKey: string;
  label: string;
  to: number;
  /** Hold, in minutes. */
  hold: number;
}

export interface Firing {
  code: string;
  station: string;
  /** i18n key — `data.programme.<id>`. */
  programmeKey: string;
  programme: string;
  status: FiringStatus;
  /** Degrees Celsius. */
  current: number;
  target: number;
  /** Minutes since midnight. */
  loaded: number;
  started: number | null;
  due: number;
  startedMin: number | null;
  shelves: number;
  capacity: number;
  kwh: number | null;
  contents: { run: string; sku: string; qty: number }[];
  steps: FiringStep[];
}

export interface Defect {
  /** Minutes since midnight. */
  at: number;
  run: string;
  sku: string;
  station: string;
  /** Reason id — `data.reason.<id>`. */
  reason: string;
  qty: number;
  by: string;
}

/* --------------------------------------------------------------- the office */

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  /** Days. */
  lead: number;
  /** 0–1. */
  onTime: number;
  /** ISO date of the last receipt. */
  last: string;
  supplies: string[];
}

export interface Customer {
  id: string;
  name: string;
  city: string;
  /** Kind id — `data.custkind.<id>`. */
  kind: string;
}

export type PoStatus = "draft" | "sent" | "part_received" | "received";

export interface PoLine {
  sku: string;
  qty: number;
  received: number;
  /** Agreed rate, pounds per unit. */
  cost: number;
}

export interface PurchaseOrder {
  code: string;
  supplier: string;
  status: PoStatus;
  raised: string;
  due: string;
  lines: PoLine[];
}

export type SoStatus =
  | "draft"
  | "confirmed"
  | "picking"
  | "shipped"
  | "invoiced";

export interface SoLine {
  sku: string;
  qty: number;
  /** Units allocated out of `qty`. */
  alloc: number;
  /** Pounds per unit. */
  price: number;
  /** Run raised to cover the shortfall, if any. */
  run: string | null;
}

/**
 * SOMEWHERE A PALLET CAN GO.
 *
 * ── WHY THIS HANGS OFF AN ORDER AND NOT OFF A CUSTOMER ─────────────────────
 *
 * `Customer` carries a `city` and nothing else, which was enough while the desk
 * only ever grouped orders by who placed them. It is not enough to hand a
 * pallet to a driver: that needs a door, and one customer does not have one
 * door. Harbour & Vine send most of their tableware to the Falmouth restaurant
 * and SO-5109 to the second site in Truro; a shop's goods go to a warehouse
 * while its post goes to the shop. Hanging the address off the customer would
 * make the second case unrepresentable and the first quietly wrong, so it hangs
 * off the thing that actually travels.
 *
 * ── THE SHAPE IS BORROWED ON PURPOSE ───────────────────────────────────────
 *
 * These five fields, with these names and these meanings, are what Adminium's
 * add-on host seam already calls a `PostalAddress` — the shape its dispatch and
 * checkout payloads carry, and the one a carrier reads. Nothing of that seam is
 * installed here and this app does not depend on it; the SHAPE is copied rather
 * than invented so that anything which later reads a works' orders across it is
 * a pass-through instead of a translation layer somebody has to keep correct.
 * If the seam's shape moves, this one follows it — it does not get a private
 * opinion about what an address is.
 *
 * The one deliberate difference is that `lines` is mutable here and readonly
 * there. Every record in this file is copied on its way out of `data/source.ts`
 * and mutated by the store afterwards, and a readonly array in the middle of
 * that would be the odd one out. It is still assignable to the seam's readonly
 * field, so the borrowing survives.
 *
 * `country` IS A CODE — `GB`, never "United Kingdom" — for the reason the seam
 * gives: it is the one field in here a machine reads, because a carrier checks
 * a postcode against a country. Everything else is text for a label.
 */
export interface PostalAddress {
  /**
   * Who the pallet is addressed to. Not always the customer's own name: a
   * second site, a warehouse, a kitchen door round the back of the restaurant.
   */
  name: string;
  /** Street lines, in the order they are written on the label. */
  lines: string[];
  city: string;
  postcode: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
}

export interface SalesOrder {
  code: string;
  customer: string;
  status: SoStatus;
  placed: string;
  requiredBy: string;
  lines: SoLine[];
  invoice: string | null;
  /**
   * WHERE THE GOODS GO — or `null`, which MEANS THE CUSTOMER COLLECTS.
   *
   * ── NULL IS AN ANSWER HERE, NOT A BLANK ─────────────────────────────────
   *
   * A works does both. Most orders go on a pallet to a door; some the customer
   * fetches, and for those the office wants no address because there is nothing
   * to address. So the field is nullable — and the whole weight of the decision
   * sits on what the null MEANS. It means COLLECTION: somebody was asked and
   * the answer was "they take it". It does NOT mean "nobody has typed it yet".
   *
   * That distinction is the difference between a state and a hole, and it is
   * only real because three other places honour it:
   *
   *  - `db/schema.sql` refuses a half-filled address — either all five parts
   *    are present or none are — so a null cannot be somebody who stopped
   *    halfway through the form;
   *  - the Dispatch screen renders the null AS COLLECTION, in words, in the
   *    place the address would have occupied, rather than leaving a gap;
   *  - the seed exercises it. SO-5108 is a collection, so the state is on a
   *    screen in the running demo instead of only in this comment.
   *
   * `| null` rather than `?`, because `?` already means something else in this
   * file: `Item.glaze` is optional because a bag of clay HAS no glaze. Every
   * sales order has a route, and this one's route is that they collect.
   *
   * WHAT WOULD CHANGE THIS. A draft-order intake, where an order can honestly
   * exist before anybody has been asked where it goes. Then the null carries
   * two meanings, one of them a hole, and the field has to become a two-state
   * value — a mode beside an optional address — with the schema's constraint
   * rewritten to match. Adding that mode before such a screen exists would be a
   * column nobody could be wrong about, which is a different kind of lie.
   */
  deliverTo: PostalAddress | null;
}

export type PayMethod = "transfer" | "card" | "cheque";

export interface Payment {
  date: string;
  method: PayMethod;
  amount: number;
}

/**
 * An invoice stores only what was agreed and what has come in. The amount, the
 * tax, the status and the age are all derived in `lib/ledger.ts` from the order
 * it was raised from, so an order line and its invoice can never disagree.
 */
export interface Invoice {
  number: string;
  order: string;
  customer: string;
  issued: string;
  due: string;
  payments: Payment[];
}

export type CountStatus = "open" | "posted";

export interface CountLine {
  sku: string;
  /** What the walker wrote down, or null if the line is not walked yet. */
  counted: number | null;
}

export interface CountSheet {
  code: string;
  /** i18n key — `data.zone.<id>`. */
  zoneKey: string;
  zone: string;
  by: string;
  opened: string;
  status: CountStatus;
  lines: CountLine[];
}

/* ---------------------------------------------------------------- overlays */

export interface Toast {
  id: string;
  text: string;
  icon: string;
}
