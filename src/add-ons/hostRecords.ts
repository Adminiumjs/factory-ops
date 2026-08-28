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
 * So this file is where `SalesOrder` stops and `OutboundOrder` starts — and
 * where `Item` stops and a `record.actions` payload starts — and it is
 * deliberately the only place in the app that knows both sides of either.
 *
 * ── THE TWO ENDS OF ONE NAMESPACE ARE BOTH IN HERE, ON PURPOSE ────────────
 *
 * `catalogueSamples` hands out the key an add-on files things under and
 * `catalogueRecord` hands over the key it looks them up by. Those are opposite
 * ends of one seam and they have to agree, and the only way anybody notices
 * that they do not is by reading both — so they live in one file, next to each
 * other, rather than one here and one at whichever screen happened to need it.
 * They did not agree when the second one was written, and nothing anywhere
 * could have said so, because until then nothing looked a key up at all. See
 * `catalogueSamples` for the field that moved and why it was the wrong one.
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
import type {
  CatalogueSample,
  OutboundOrder,
  RecordActionsPayload,
  ShopClock,
  SlotItem,
} from "./vendor/host/index.ts";

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
 * ONE `items` ROW AS A RECORD AN ADD-ON MAY ACT ON — the Recipes card's mount.
 *
 * ── `entity` IS `item`, AND `piece` WAS THE TEMPTING WRONG ANSWER ──────────
 *
 * The contract wants this app's own lower-case word for WHAT KIND OF RECORD it
 * is, and it is printed small on whatever an add-on draws, so somebody holding
 * the output knows what the reference refers to. The works' warmest word for a
 * finished plate is `piece` — `recipes.sub` says "what each piece is built
 * from" and `catalogueSamples` below says it twice — and it is the wrong answer
 * here, because it is true of only half of `items`. Clay, glaze and cartons are
 * rows in the same ledger with the same shape (`data/types.ts` says so and says
 * why), and the day this mount reaches one of those, `piece` becomes a lie with
 * nothing anywhere to notice. `item` is what the type is called, what the store
 * calls the collection, and what the Stock screen heads its first column —
 * stable, in this app's own vocabulary, and true of every row it could ever be
 * handed.
 *
 * ── `recordId` IS THE SKU, AND IT IS THE SAME KEY `catalogueSamples` HANDS
 *    OVER — WHICH IS NOT A COINCIDENCE, SEE BELOW ───────────────────────────
 *
 * A SKU is this app's identity for a row in every direction: `itemBySku` is how
 * anything finds one, order lines carry one, movements carry one, a BOM is a
 * list of them. The contract's own note on the field is that `id`, `ref`,
 * `number` and `code` are all in use as the identity across the fifteen apps
 * and an add-on guessing between them is one shop's layout leaking in by the
 * back door; the works' answer to that question is `sku` and nothing else.
 *
 * ── `record` IS THE WHOLE ROW, SPREAD RATHER THAN TRIMMED ──────────────────
 *
 * The field is "the record itself, as the host holds it", and this app holds an
 * `Item`. Handing over a narrowed copy — sku, name, unit, and none of the cost
 * fields — was considered and refused: it would invent a SECOND idea of what a
 * works' catalogue row is, one that exists nowhere else in the app and that no
 * contract describes, and an add-on that legitimately read a field would find
 * it missing with nothing to say it had been removed. What DOES follow from the
 * whole row crossing is that the works' unit cost, labour and overhead cross
 * with it, and that is a real fact about connecting anything to this surface
 * rather than a detail: it belongs in what an operator agrees to, which is the
 * permission list the manage drawer already prints per add-on.
 *
 * THE SPREAD IS NOT A STYLE CHOICE AND MUST NOT BE "TIDIED" TO `record: item`.
 * `Item` is an `interface`, and TypeScript gives an implicit index signature to
 * anonymous object types only — so the interface is not assignable to
 * `Readonly<Record<string, unknown>>` and the direct form does not compile. The
 * obvious repair is `item as Record<string, unknown>`, which `payloadCastsGuard`
 * bans at a mount site for exactly the reason that makes it tempting: it
 * silences the one contract that keeps an add-on portable. A spread is the
 * repair that is not a cast.
 *
 * ── `patchRecord` IS ABSENT, AND THIS APP CANNOT HONESTLY OFFER ONE ────────
 *
 * The handle is optional on this payload because hosts genuinely differ about
 * whether an add-on may write back. This one differs in the plainest possible
 * direction: THERE IS NO PATH IN THIS APP THAT WRITES A FIELD OF AN `items`
 * ROW. Every write to `items` in `state/store.ts` goes through a ledger engine
 * in `lib/` — a receipt, an output, a shipment, a count — and each of them
 * moves `onHand` or `allocated` AND WRITES A MOVEMENT BESIDE IT, which is the
 * works' own rule about its own numbers: a balance that changed with nothing in
 * the history to say why is the defect the movement ledger exists to prevent.
 *
 * So a `patchRecord` here would have to be one of two things, and both are
 * worse than nothing. A handle that wrote the row directly would let an add-on
 * put stock on a shelf with no movement behind it. A handle that accepted only
 * the fields the ledger can move would be a write handle that silently ignores
 * most of what it is passed, which is the shape of promise this whole seam
 * refuses. The Recipes screen's own rate box is the same story in miniature: it
 * edits a DRAFT and offers to put it back, because not even the works edits a
 * piece's price from here.
 *
 * Passing nothing is therefore the honest answer, and it costs nothing to say
 * so: the contract's rule is that an add-on handed no handle says so on screen
 * and does the readable half of its job.
 */
export function catalogueRecord(item: Item, now: Now): Omit<RecordActionsPayload, "settings"> {
  return {
    entity: "item",
    recordId: item.sku,
    record: { ...item },
    // The same adapter the Dispatch card uses, for the same reason: this app
    // counts a time of day in minutes since midnight and the seam wants an hour
    // and a minute. A second copy of those two lines is how two mounts come to
    // disagree about what o'clock it is.
    now: shopClock(now),
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
 * glazes: a plate is a plate whatever colour it is fired, and the question this
 * list was built to answer — what does a box of these weigh — has one answer
 * per shape rather than one per glaze. Sampling all fourteen would put four
 * copies of the same row in front of the office. The families are the SKU's
 * shape-and-size prefix, which is how the seed already names them.
 *
 * ── AND THE KEY IS THE REPRESENTATIVE PIECE'S SKU, NOT THAT PREFIX ─────────
 *
 * IT USED TO BE THE PREFIX — `PLT-260` — and that was a defect nothing could
 * see until this app mounted a second surface. `CatalogueSample.key` is not a
 * grouping label: it is the key AN ADD-ON FILES THINGS UNDER, and the seam's
 * other end is `RecordActionsPayload.recordId`, which is the key it looks them
 * up BY when somebody opens a record. Those two are one namespace or the seam
 * is decorative — and `PLT-260` is not a namespace this app has, because no row
 * anywhere is called that. Anything filed against it could never be found
 * again, from any screen, forever, and nothing in either payload lets the far
 * side notice: it would simply keep reporting that the row has nothing.
 *
 * The fix is one field. The sample IS a representative piece — the contract's
 * own words are "one representative record per family" — so it is keyed by that
 * piece's own SKU, which is the identity this app uses everywhere else and the
 * identity `catalogueRecord` hands over above. THE LABEL WAS ALREADY THAT
 * PIECE'S NAME, which is what makes the old key the odd one out rather than a
 * deliberate abstraction: the office read "Dinner plate 260 · Speckled" and
 * filed against a key belonging to nothing.
 *
 * WHAT THIS DOES NOT CHANGE, checked before it was done: nothing that reads
 * these samples reads `key` except an add-on's own storage. The rows, their
 * labels, their quantities and their prices are byte for byte what they were,
 * so the shape of the list — one row per family, the whole reason for the
 * paragraph above — is untouched and no surface in this app looks different.
 *
 * WHAT WOULD CHANGE THE GRAIN ITSELF is a screen wanting to reach the other
 * nine pieces. They are unreachable from a settings form fed this list, by
 * construction, and that is a limit of the one catalogue view any slot payload
 * offers rather than something this file can fix — an add-on that cares is
 * expected to say so on its own surface. Widening to one row per SKU to suit
 * one add-on's form would be this app deciding a shared mapping on that
 * add-on's behalf, which is the coupling the whole seam exists to prevent.
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
  return [...byFamily.values()].map((item) => ({
    key: item.sku,
    label: itemName(item),
    quantity: item.unit === "set" ? 24 : 60,
    unitPrice:
      item.price === undefined ? undefined : { amount: minorUnits(item.price), currency: CURRENCY },
  }));
}
