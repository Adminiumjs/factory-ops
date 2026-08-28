/**
 * The slots THIS app hosts, and what it draws where nothing fills one.
 *
 * ── THE ONES IT MOUNTS, AND THE ONES IT CANNOT HAVE ────────────────────────
 *
 * The closed registry has twelve ids (`vendor/host/slots.ts`). A works desk
 * mounts three of them, and the interesting part of this file is which of the
 * rest it does not and why — because "we only did the easy ones" and "these are
 * what this app has" read identically until somebody writes the second one
 * down. The names below are what matters and the count is not: `HOSTED_SLOTS`
 * is the list, this prose is a reading of it, and the moment those two disagree
 * it is the prose that is wrong.
 *
 * `manifest.json` declares ONE frontend and its `side` is `staff`. There is no
 * customer half of this app: no basket, no product page, no order page a
 * customer signs into. So the three customer-facing delivery ids are not
 * missing here, they are UNHOSTABLE — a host that declared them would have to
 * invent a screen for a person who never opens this app:
 *
 *   `checkout.delivery.methods`  a till. This works invoices on account after
 *                                the pallet has gone; nobody pays at a counter.
 *   `order.dispatch.panel`       the customer's own view of a shipment in
 *                                flight. The Office sees dispatch from the
 *                                other side of the counter, which is what
 *                                `order.dispatch.actions` is.
 *   `product.options.personalize`, `cart.line.preview`, `product.admin.panel`
 *                                a shop that sells to the public. This one
 *                                makes tableware to order for restaurants.
 *
 * That is the exact mirror of the storefront, which hosts those three and
 * cannot host this one. A slot id names a SURFACE and never an app (24 D21), so
 * two hosts of one add-on legitimately mount disjoint halves of it.
 *
 * The rest are not about this app's shape:
 *
 *   `artwork.sources`     nothing here reproduces a design. A backstamp is a
 *                         decal off a shelf, and it is an `items` row.
 *   `nav.add-on.routes`   this app switches screens off one store field and has
 *                         no router (`app/App.tsx`). Declaring a route slot with
 *                         nowhere to route to is the mistake the print works
 *                         made and then undid.
 *   `order.line.actions`  a per-LINE action. The Dispatch card's lines are pick
 *                         ticks, and there is nothing an add-on could do to one
 *                         plate that it could not do better to the order.
 *   `record.editor.panel` its host is Adminium's generated dashboard.
 *
 * ── AND `record.actions`, WHICH THIS FILE USED TO REFUSE ───────────────────
 *
 * It sat in the list above with the reason "nothing in this app puts one record
 * on a screen with an action to take on it". THAT WAS WRONG, and it is worth
 * saying so rather than quietly deleting the line: the Recipes screen has
 * always put exactly one finished piece on a screen, with its recipe, its cost
 * and its rate around it, and a person is on it because that piece is what they
 * are dealing with. What the old line actually recorded is that no add-on
 * filled the id, which is a fact about the registry and not about this app —
 * and a host that declines a surface because nothing wants it yet is a host
 * that will decline it again when something does.
 *
 * So it is hosted, and `screens/Office.tsx` mounts it on the Recipes card. The
 * mapping from an `Item` row into `RecordActionsPayload` is in `hostRecords.ts`
 * with the rest of this app's seam mappings, and the one thing worth knowing
 * before reading it is that this app's own identity for a piece is its SKU.
 *
 * A slot a host declares and never mounts is worse than an absent one, because
 * an add-on author reads the list and writes against it. `addOns.test.ts` holds
 * this list to the screens in both directions.
 *
 * IT DOES NOT HOLD IT BY RENDERING, HERE. `mountsGuard` is the guard that
 * proves a declared slot is really drawn, it needs a DOM, and this app is at
 * kit tier 1 (`host-kit.config.ts`) — so the ONLY thing standing between this
 * list and a slot nobody draws is whoever reads the diff. That is the cost the
 * tier guard prints by name on every run; the first two entries below arrived
 * in the same change that declared the tier, and the third is the first this
 * app has added while paying it.
 */

import type { SlotEmptyBehaviour, SlotId } from "./vendor/host/index.ts";

/**
 * THE THREE, and they are this app's list rather than the registry's.
 *
 * `vendor/host/slots.ts` exports the CLOSED REGISTRY under this same name,
 * `HOSTED_SLOTS`, and importing that one instead would silently widen every
 * check the kit runs: the mounts guard would demand mounts for twelve ids, the
 * table below would need twelve rows, and `<AddOnSlot>` would accept ids this
 * app never draws. The kit asserts this list is a strict subset of the registry
 * so that the mis-import is a named failure rather than a quiet widening.
 */
export const HOSTED_SLOTS = [
  "order.dispatch.actions",
  "settings.add-on.panel",
  "record.actions",
] as const satisfies readonly SlotId[];

export type HostedSlotId = (typeof HOSTED_SLOTS)[number];

/** Whether this build mounts a slot at all. */
export function isHosted(slot: SlotId): slot is HostedSlotId {
  return (HOSTED_SLOTS as readonly string[]).includes(slot);
}

/**
 * How each mount behaves when nothing fills it.
 *
 * ── EVERY ANSWER IS ABOUT THE SCREEN, NOT ABOUT THE SLOT ───────────────────
 *
 * `order.dispatch.actions` is SILENT. The Dispatch card already ends in a
 * finished sentence — every line ticked, a Ship button, and the works hands the
 * pallet to whoever is collecting it. A works with no carrier connected is not
 * missing anything; it is a works that books its own transport, which is how
 * most of them run. A dashed "no carriers connected" panel under the Ship
 * button would be the app describing a hole it does not have (24 D6).
 *
 * `settings.add-on.panel` SPEAKS, and for the opposite reason: the surface that
 * mounts it puts the panel under a heading of its own, and a heading with a gap
 * under it is a hole. An add-on with nothing to set still owes the office a
 * sentence saying so.
 *
 * `record.actions` is SILENT, and it is the same answer as the first for the
 * same reason rather than by copying it. The Recipes card is a finished account
 * of one piece — what it is built from, what it costs, what it earns and who
 * is waiting for it — and it ends where the works stops having something to
 * say. The mount adds no heading of its own and no frame: an add-on that fills
 * it brings its own panel, and one that does not leaves a card that was already
 * complete. A dashed "nothing here" box under the rate panel would be this app
 * announcing a hole in a screen it finished before any add-on existed, which is
 * exactly what 24 D6 is about.
 *
 * THE TEST FOR `speaks` IS WHETHER THE HOST DREW SOMETHING FIRST. That is the
 * whole rule, and it is why the settings panel is the odd one out: it is the
 * only one of the three where this app puts a heading above the slot, and a
 * heading with a gap under it is a hole whatever is or is not connected.
 *
 * All three are properties of the SCREEN this app built and not of the slot id
 * — the print works reaches the same answers for the first two ids by its own
 * route, and the maker studio disagrees about the settings panel because it
 * inlines it with no heading. There is deliberately no shared table; see
 * `vendor/host/slots.ts` for the ruling.
 */
export const SLOT_EMPTY_BEHAVIOUR: Readonly<Record<HostedSlotId, SlotEmptyBehaviour>> = {
  "order.dispatch.actions": "silent",
  "settings.add-on.panel": "speaks",
  "record.actions": "silent",
};
