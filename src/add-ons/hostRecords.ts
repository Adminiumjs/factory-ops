/**
 * THE WORKS' OWN RECORDS, MAPPED INTO THE NEUTRAL SHAPES A SLOT DECLARES.
 *
 * ── THIS MAPPING IS THE HOST'S JOB, AND THAT IS THE WHOLE SEAM ─────────────
 *
 * A slot id names a SURFACE, and its payload is the smallest shape every host
 * of that surface can honestly produce — never any one shop's record layout
 * under a general-sounding name. A print works has jobs, a maker studio has
 * basket lines and this app has sales orders; `OutboundOrder` is none of the
 * three, and each host maps its own records into it here. Pushing the mapping
 * into the add-on is exactly how one shop's vocabulary ends up in twenty
 * add-ons, which is the defect `vendor/host/payloads.ts` was written after.
 *
 * So this file is where `SalesOrder` stops and `OutboundOrder` starts, and it
 * is deliberately the only place in the app that knows both.
 *
 * ── WHAT THIS APP CANNOT HONESTLY SUPPLY, AND SAYS NOTHING ABOUT ───────────
 *
 * `SlotItem.unitWeightGrams` and `unitSize` are optional in the contract and
 * are omitted here, because THIS WORKS DOES NOT WEIGH ANYTHING. There is no
 * gram column on `items`, no dimension, and no other screen that wants one; a
 * plate's cost is clay, glaze and time. Inventing a number would be worse than
 * useless — a carrier would price a parcel off it and nothing on any screen
 * would say the figure was made up. The contract's own rule is that a host
 * omits what it does not know and the add-on handles the absence in words, and
 * the carrier does: its settings panel prints an assumed weight AS assumed, and
 * its dispatch form lets the office type the real one off the scales.
 *
 * That is a real gap in this app rather than a shortcoming of the seam, and the
 * thing that would close it is a weight column on `items` — a schema change, a
 * seed change and a stock screen that shows it, which is a different diff.
 */

import type { PostalAddress, SalesOrder, Item, Now } from "../data/types.ts";
import { itemName } from "../lib/format.ts";
import { orderSubtotal } from "../lib/ledger.ts";
import { itemBySku } from "../lib/production.ts";
import type { CatalogueSample, OutboundOrder, ShopClock, SlotItem } from "./vendor/host/index.ts";

/**
 * The one currency this works invoices in.
 *
 * `lib/format.ts` hard-codes the same code in `money()` and says why: the works
 * is in one country and every price in the seed is in one currency. The
 * duplication is honest rather than tidy — the seam wants an ISO 4217 code and
 * the formatter wants an `Intl` currency, and collapsing them would make one
 * module import the other for a three-letter string.
 */
const CURRENCY = "GBP";

/** Pounds and pence to the smallest unit, which is what `Money` carries. */
const minorUnits = (value: number): number => Math.round(value * 100);

/**
 * `Now` as the seam's `ShopClock` — and this adapter exists because the two
 * shapes disagree about what a time of day is.
 *
 * This app stores MINUTES SINCE MIDNIGHT, deliberately: it treats the shift as
 * a grid rather than as a timeline, so an elapsed chip is one subtraction and
 * nothing anywhere has to reason about an hour boundary. `ShopClock` wants an
 * hour and a minute, because a carrier's cut-off is written on a wall as 15:00.
 * Neither is wrong and the arithmetic between them is two lines, which is what
 * a seam looks like when both sides are honest about their own units.
 *
 * IT IS REQUIRED ON THE DISPATCH PAYLOAD and the reason is in that payload's
 * own comment: "has today's van gone?" and "which day does the driver come?"
 * are questions about the WORKS' clock, and an add-on answering them off its
 * own is telling this works about somebody else's Tuesday. This app's clock is
 * pinned to Tuesday 28 July 2026 at 10:15 and the add-on's own pin is a
 * different day in a different month; passing this across is what stops a
 * collection window landing before the order was placed.
 */
export function shopClock(now: Now): ShopClock {
  return {
    iso: now.date,
    hour: Math.floor(now.minutes / 60),
    minute: now.minutes % 60,
  };
}

/** One order line as the neutral `SlotItem`. */
function slotItem(
  order: SalesOrder,
  line: SalesOrder["lines"][number],
  index: number,
  items: readonly Item[],
): SlotItem {
  return {
    // Unique within the order, which is all the contract asks: a works can put
    // the same SKU on two lines of one order at two prices.
    id: `${order.code}:${String(index)}`,
    key: line.sku,
    // ALREADY TRANSLATED. The works owns its own catalogue's words and has the
    // bundle to hand; an add-on handed `PLT-260-HAR` could only print the SKU
    // at somebody or invent English for it.
    label: itemName(itemBySku(items, line.sku)),
    quantity: line.qty,
    unitPrice: { amount: minorUnits(line.price), currency: CURRENCY },
  };
}

/**
 * A sales order as something that has to leave the building.
 *
 * `destination` is `undefined` — not `null` — when the order has no delivery
 * address, and the difference is the seam's rather than this app's: the
 * contract's field is optional, and an add-on reads its absence as "the works
 * has not said where this is going" and shows an empty form rather than
 * guessing. THAT IS NOT WHAT A NULL `deliverTo` MEANS HERE. A null means the
 * customer collects, which is an answer and not an absence, so the mount site
 * does not offer a carrier for one at all — see `screens/Office.tsx`. This
 * function is written to be correct if it is ever called on one anyway, because
 * a mapping that quietly depended on its caller's discipline would be one bad
 * refactor away from a works being asked to post a collection.
 */
export function outboundOrder(
  order: SalesOrder,
  customerName: string,
  origin: PostalAddress,
  items: readonly Item[],
): OutboundOrder {
  return {
    // The reference BOTH sides already use — what the works prints on its own
    // paperwork — so a booking made through an add-on can be found again from
    // the order book.
    ref: order.code,
    recipient: { name: customerName, key: order.customer },
    items: order.lines.map((line, i) => slotItem(order, line, i, items)),
    origin,
    destination: order.deliverTo ?? undefined,
    promisedFor: order.requiredBy,
    value: { amount: minorUnits(orderSubtotal(order)), currency: CURRENCY },
  };
}

/**
 * ONE REPRESENTATIVE PIECE PER FAMILY OF WHAT THE WORKS SELLS.
 *
 * `SettingsPanelPayload.samples` is REQUIRED, and its own comment records why
 * an optional field would have been the easier and worse choice: every shop has
 * a catalogue — it is what a shop is — so "I have nothing to sample" is never
 * an honest state, and a host once passed `{ patch }` alone, `tsc` was happy,
 * and the carrier's settings form threw on `.map`.
 *
 * ── WHAT A FAMILY IS HERE, AND WHY IT IS NOT EVERY SKU ─────────────────────
 *
 * The works sells fourteen finished pieces and they are four shapes in four
 * glazes: a plate is a plate whatever colour it is fired, and a carrier's
 * question — what does a box of these weigh — has one answer per shape rather
 * than one per glaze. Sampling all fourteen would put four copies of the same
 * row in front of the office. The family key is the SKU's shape-and-size
 * prefix, which is how the seed already names them.
 *
 * COMPONENTS ARE NOT SAMPLED. Clay, glaze and cartons are things the works
 * BUYS; nothing on a sales order is ever one, so a parcel of them is not a
 * parcel this works has ever sent.
 *
 * The quantity on each row is a real order quantity out of the seed rather than
 * a round number: what a restaurant actually buys is what a carrier should be
 * asked to price.
 */
export function catalogueSamples(items: readonly Item[]): CatalogueSample[] {
  const byFamily = new Map<string, Item>();
  for (const item of items) {
    if (item.kind !== "product") continue;
    // `PLT-260-SPK` → `PLT-260`. A set has no size segment and keeps its own.
    const family = item.sku.split("-").slice(0, 2).join("-");
    if (!byFamily.has(family)) byFamily.set(family, item);
  }
  return [...byFamily.entries()].map(([family, item]) => ({
    key: family,
    label: itemName(item),
    quantity: item.unit === "set" ? 24 : 60,
    unitPrice:
      item.price === undefined ? undefined : { amount: minorUnits(item.price), currency: CURRENCY },
  }));
}
