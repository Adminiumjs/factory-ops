/**
 * Every fact the add-on seam needs about THIS app, in one object.
 *
 * Host-owned and hand-written: `scripts/host-kit.sh` refuses to write it and
 * refuses to compare it, because everything in it is a fact about Kilnworks
 * rather than a copy of anything. The kit's own `kit/config.ts` documents each
 * field; what is recorded here is the decisions this app made.
 *
 * ── IT IS IMPORTED BY BOTH HALVES, SO IT MUST LOAD IN A BROWSER ────────────
 *
 * The mount component reads `classPrefix` out of it at module load, and the
 * guard suites read the four paths below out of it under Node. That is why the
 * paths are derived with `new URL(…, import.meta.url)` and not with
 * `node:path`/`node:url`: a `fileURLToPath` import here would put `node:url` in
 * the import graph of every screen that mounts a slot. The values are never
 * read in the browser — nothing in `kit/AddOnSlot.tsx` touches them — but the
 * MODULE is loaded there, and an import is a cost whether or not it is called.
 */

import type { HostKitConfig } from "./kit/index.ts";
import { HOSTED_SLOTS, SLOT_EMPTY_BEHAVIOUR, type HostedSlotId } from "./slots.ts";

/**
 * A directory URL as an absolute path, with no trailing slash.
 *
 * `decodeURIComponent` because a checkout under a path with a space in it is an
 * ordinary thing on a laptop and `%20` is not a directory anybody has.
 */
const dir = (relative: string): string =>
  decodeURIComponent(new URL(relative, import.meta.url).pathname).replace(/\/$/, "");

export const hostKit: HostKitConfig<HostedSlotId> = {
  appKey: "factory-ops",

  /**
   * `kw`, for Kilnworks, and it is already the prefix on every class in
   * `src/styles/` — `kw-order`, `kw-panel`, `kw-shipto`. The seam's two classes
   * join that set rather than starting a second one.
   */
  classPrefix: "kw",

  /** This app's own two, not the closed registry. See `slots.ts`. */
  hostedSlots: HOSTED_SLOTS,
  slotEmptyBehaviour: SLOT_EMPTY_BEHAVIOUR,

  /**
   * TIER 1, AND HERE IS WHAT THAT COSTS.
   *
   * This app has no DOM in its suites: no `jsdom`, no `happy-dom`, and not one
   * `.test.tsx` file in the repo. Every one of its 190-odd cases is a pure
   * function over data, which is a deliberate property of the app rather than
   * an accident — the engines in `lib/` are where its behaviour lives.
   *
   * So the four guards that need a rendered tree are NOT running here, and the
   * kit prints them by name on every run rather than letting the absence be
   * quiet. In this app's own words, what stays open is:
   *
   *   · a slot fill that returns an empty wrapper and blanks the Dispatch
   *     card's own footer on its behalf — the `:empty`-is-not-"drew nothing"
   *     defect, which no source check can see;
   *   · a mount that satisfies a grep and never renders, e.g. one left inside a
   *     JSX comment;
   *   · a company name drawn on an add-on's own surface with the
   *     not-affiliated line one press further in, which the source sweep below
   *     cannot reach because it is a question about a rendered text node.
   *
   * WHAT WOULD CHANGE IT is one `devDependencies` line — `jsdom` — plus the
   * fixtures the four guards take. That is not forbidden by 25 D11: the rule is
   * about what reaches a browser, and both hosts that already carry this seam
   * have had `jsdom` since wave 4b with no change to what they ship. It is not
   * done here because a first React test tree in an app with none is a change
   * to how this repo is tested, and that belongs in its own diff rather than
   * riding in on a carrier.
   *
   * The kit gives this no exemption field, deliberately, and the moment `jsdom`
   * appears in `package.json` the tier guard fails until this line says `2`.
   */
  tier: 1,

  rootDir: dir("../../"),
  srcDir: dir("../"),
  vendorDir: dir("./vendor"),

  /** The eight, English first. `i18n/locales.ts` is the registry. */
  localeTags: ["en-US", "de-DE", "fr-FR", "cs-CZ", "da-DK", "zh-CN", "zh-TW", "ar-EG"],

  /**
   * Where the slot rule pair may live. One file, and `components.css` is it:
   * `screens.css`'s own header says anything a second screen could reuse
   * belongs in `components.css`, and the seam is mounted on two screens.
   */
  stylesheets: [dir("../styles") + "/components.css"],

  /**
   * Files exempt from the affiliation sweep, each with the reason it is exempt.
   *
   * Empty, and that is the honest state rather than an oversight: every surface
   * in this app that prints an add-on's name or monogram draws the
   * not-affiliated line in the same component, because there is exactly one
   * such surface and it was built after the rule. An entry here would mean a
   * screen that names a company and says nothing about the relationship, which
   * is the thing 24 D12 exists to stop — so the list staying empty is the
   * result, not the absence of a check.
   */
  affiliationExempt: {},
};
