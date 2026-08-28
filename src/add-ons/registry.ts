/**
 * The list this app registers at startup, and THE ONLY PLACE ITS SHIPPED SOURCE
 * NAMES AN ADD-ON.
 *
 * ── WHAT "THE ONLY PLACE" MEANS, PRECISELY ─────────────────────────────────
 *
 * One line each: the `import { register as … } from './vendor/<key>/index.ts'`
 * lines below, and the array they feed. Acceptance criterion 5 is checked by a
 * grep over every shipped source outside `./vendor/`, and it forgives a line
 * SHAPE rather than a file — so a `const carrier = "…";` two lines under an
 * import would fail here, in the one file most likely to hold one.
 *
 * Everything else about an add-on arrives inside the object `register()`
 * returns: its name, its monogram, its one-line description, its permissions,
 * its settings and their defaults, its eight-locale strings, its seeded
 * history, and what it says goes and stays when the works disconnects it.
 * Replacing one is replacing one import here and one package over there.
 * Nothing on the Works screen, the Dispatch card or the Recipes card changes,
 * because none of them knows what it is drawing.
 *
 * THE SECOND ENTRY IS THE PROOF OF THAT, and it is worth saying because a seam
 * with one add-on in it has never been asked the question. Registering it
 * needed this file and the sync script's file list, and nothing else: no screen
 * learned a name, no i18n module gained a key, and the two surfaces it fills
 * were already there — one of them mounted in the same diff, for its own
 * reasons, by a screen that still does not know what fills it.
 *
 * The suites are the deliberate exception and say so: `addOns.test.ts` names
 * the key on purpose, because a suite that asserted the seam without ever
 * naming what is on the far side of it would be asserting nothing.
 *
 * ── AN EMPTY REGISTRY IS THE STARTING STATE ────────────────────────────────
 *
 * The store boots `EMPTY_REGISTRY` and calls `registerAddOns(demoAddOns())`
 * from `main.tsx`, rather than building the registry at store-init from this
 * list. Three reasons, and the first one is the one that matters here:
 *
 *  1. THE SEAM WAS INSTALLABLE BEFORE THIS FILE EXISTED. With an empty registry
 *     every slot draws its fallback and the app is unchanged on screen, so the
 *     retrofit landed and was reviewable on its own.
 *  2. The store stops importing add-on bundles. Every screen imports the store;
 *     under the other shape every screen's module graph contains every add-on.
 *  3. Connected mode needs it — the list comes from `GET /api/v1/add-ons` and
 *     the bundles are `import()`ed, so only the SOURCE of the list changes.
 *
 * `./vendor/<key>/` IS A SYNCED COPY, NOT A FORK. The add-ons are one
 * repository, a package each, and this app is standalone with no npm package
 * tying them together — so the build gets a copy, every vendored file says so
 * in its own header, and `npm run add-ons:status` re-derives the whole tree and
 * compares it byte for byte. A hand-edit under `vendor/` is invisible until it
 * is a bug in two places at once.
 */

import { registerAddOnMessages } from "../i18n/messages/index.ts";
import { register as shippingDhl } from "./vendor/shipping-dhl/index.ts";
import { register as barcodeLabels } from "./vendor/barcode-labels/index.ts";
import {
  defaultSettingsFor,
  type AddOn,
  type AddOnSettings,
} from "./vendor/host/index.ts";

/**
 * Registered once, at module load, because REGISTRATION IS WHERE THE MESSAGES
 * ARRIVE.
 *
 * An add-on's strings ride on the add-on object and are merged here rather than
 * imported by `i18n/messages/index.ts` — see that file for the whole accounting
 * of what moved from the compiler to `registerAddOnMessages`. Doing it at
 * module load rather than in a mount effect is the guarantee: this module is
 * imported by `main.tsx` before React mounts, so the merge is complete and its
 * refusals have already fired before the first render reads a bundle.
 */
const REGISTERED: readonly AddOn[] = [shippingDhl(), barcodeLabels()];
for (const addOn of REGISTERED) {
  if (addOn.messages !== undefined) registerAddOnMessages(addOn.key, addOn.messages);
}

/** Everything the Works screen lists. */
export function demoAddOns(): AddOn[] {
  return [...REGISTERED];
}

/**
 * What every add-on starts from, keyed by add-on key and OPAQUE to this app.
 *
 * The carrier's two secret settings — an API key and an account number — are
 * absent BY CONSTRUCTION rather than by omission (24 D15): they are declared
 * `secret` in the add-on's manifest, they live in its server half, and a store
 * the browser can read is precisely where they must never appear. Nothing in
 * this repo has a field to put one in.
 */
export const DEFAULT_ADD_ON_SETTINGS: AddOnSettings = defaultSettingsFor(REGISTERED);
