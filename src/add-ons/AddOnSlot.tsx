/**
 * The seam, bound to THIS app — its class prefix and its store — once.
 *
 * ── WHY A FACTORY CALL AND NOT A COMPONENT ─────────────────────────────────
 *
 * The two apps that carried this seam before the kit existed each wrote the
 * component out by hand, with `className="mp-slot-fill"` typed into the JSX and
 * `useStore` imported by a fixed relative path. Those two lines are exactly why
 * the file could only ever be installed by editing it, and a copy that must be
 * edited to be installed is a fork from the first keystroke — which is how the
 * two copies came to differ in eight measured ways, two of them missing guards.
 * `kit/AddOnSlot.tsx` turns both into arguments, so this file is the whole of
 * this app's contribution: a config and a store read.
 *
 * ── CALLED ONCE, AT MODULE SCOPE ───────────────────────────────────────────
 *
 * A second `createAddOnSlot` call is not an error and is not free: it makes a
 * second component IDENTITY, so React unmounts and remounts every fill under it
 * whenever a screen renders the other one. The Dispatch card and the Works
 * screen both import the same binding from here.
 *
 * ── THE ADAPTER IS FOUR LINES AND HAS NO MAPPING STEP ──────────────────────
 *
 * `fills` is exactly what `AddOnRegistry.fillsFor` returns and `settings` is
 * exactly this app's own settings document. A mapping step here would be the
 * one place a host could reorder, filter or re-key what the registry resolved —
 * all three of which are decisions the registry has already made on purpose,
 * with `SLOT_FILL` and the `order` an add-on declared.
 *
 * TWO SEPARATE `useStore` READS RATHER THAN ONE SELECTOR RETURNING AN OBJECT,
 * because zustand compares a selector's result by identity: a selector building
 * `{ fills, settings }` returns a fresh object every render and re-renders every
 * mount on every unrelated store change — a toast, a pick tick, a theme switch.
 *
 * ── `SlotFill` IS EXPORTED AND NOTHING HERE USES IT ────────────────────────
 *
 * It is the wrapper the mount component puts round each fill, and the two
 * render-driven suites the seam ships need to reach it by name — the ones that
 * ask whether a fill actually PAINTED anything. This app declares level 1 and
 * does not run them (`host-kit.config.ts` says what that costs), so the export
 * is unused today. It stays because the alternative is a host that reaches
 * level 2 and has to edit this line to get there, and an export nobody imports
 * costs a bundle nothing: the binding is created either way.
 */

import { createAddOnSlot, type UseSlotFills } from "./kit/index.ts";
import { hostKit } from "./host-kit.config.ts";
import { useStore } from "../state/store.ts";
import type { HostedSlotId } from "./slots.ts";

const useSlotFills: UseSlotFills<HostedSlotId> = (slot, forAddOn) => ({
  fills: useStore((s) => s.registry).fillsFor(
    slot,
    useStore((s) => s.enabled),
    forAddOn,
  ),
  settings: useStore((s) => s.addOnSettings),
});

export const { AddOnSlot, SlotFill } = createAddOnSlot(hostKit, useSlotFills);
