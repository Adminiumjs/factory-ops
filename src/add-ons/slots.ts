/**
 * The slots THIS app hosts, and what it draws where nothing fills one.
 *
 * ── TWO SLOTS, AND THE THREE IT CANNOT HAVE ────────────────────────────────
 *
 * The closed registry has twelve ids (`vendor/host/slots.ts`). A works desk
 * mounts two of them, and the interesting part of this file is which eight it
 * does not and why — because "we only did two" and "two is what this app has"
 * read identically until somebody writes the second one down.
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
 * The remaining three are not about this app's shape:
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
 *   `record.actions`      bought 2026-08-28 and unfilled everywhere. Nothing in
 *                         this app puts one record on a screen with an action to
 *                         take on it that is not already one of the two below.
 *
 * A slot a host declares and never mounts is worse than an absent one, because
 * an add-on author reads the list and writes against it. `addOns.test.ts` holds
 * this list to the screens in both directions.
 */

import type { SlotEmptyBehaviour, SlotId } from "./vendor/host/index.ts";

/**
 * THE TWO, and they are this app's list rather than the registry's.
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
] as const satisfies readonly SlotId[];

export type HostedSlotId = (typeof HOSTED_SLOTS)[number];

/** Whether this build mounts a slot at all. */
export function isHosted(slot: SlotId): slot is HostedSlotId {
  return (HOSTED_SLOTS as readonly string[]).includes(slot);
}

/**
 * How each mount behaves when nothing fills it.
 *
 * ── ONE OF EACH, AND BOTH ANSWERS ARE ABOUT THE SCREEN ─────────────────────
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
 * Both halves of that pair are properties of the SCREEN this app built and not
 * of the slot id — the print works reaches the same two answers for the same
 * two ids by its own route, and the maker studio disagrees about the second
 * because it inlines the panel with no heading. There is deliberately no shared
 * table; see `vendor/host/slots.ts` for the ruling.
 */
export const SLOT_EMPTY_BEHAVIOUR: Readonly<Record<HostedSlotId, SlotEmptyBehaviour>> = {
  "order.dispatch.actions": "silent",
  "settings.add-on.panel": "speaks",
};
