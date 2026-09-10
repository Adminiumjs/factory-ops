/**
 * The add-on seam's gates, wired into this repo's own suite.
 *
 * ── THE GUARDS ARE NOT AUTO-DISCOVERED, AND THAT IS DELIBERATE ─────────────
 *
 * Every one of them is a factory that declares its own `describe`, and this
 * file is the only thing that calls them. A guard that ran because a file
 * existed would be a guard that stopped running the day a glob changed, and it
 * would stop running silently — which is the exact failure the whole kit was
 * written after. `tierGuard` closes the loop by reading this file's source and
 * failing if any of the seven that need no DOM is not named in it.
 *
 * ── AND THIS FILE NAMES THE ADD-ON ON PURPOSE ──────────────────────────────
 *
 * Acceptance criterion 5 is about SHIPPED source: nothing outside the vendored
 * tree and the one import line in `registry.ts` may name a company. A suite is
 * not shipped, and a suite that asserted the seam without ever naming what is
 * on the far side of it would be asserting nothing at all — it could not tell
 * "the carrier's dispatch fill resolves" from "no fill resolves".
 */

import { describe, expect, it } from "vitest";

import { hostKit } from "./host-kit.config.ts";
import { HOSTED_SLOTS, SLOT_EMPTY_BEHAVIOUR, isHosted } from "./slots.ts";
import { DEFAULT_ADD_ON_SETTINGS, demoAddOns } from "./registry.ts";
import { catalogueRecord, catalogueSamples } from "./hostRecords.ts";
import { ITEMS, NOW } from "../data/demo.ts";
import { createRegistry, SLOT_FILL } from "./vendor/host/index.ts";
import { MESSAGES, registeredAddOnMessageKeys } from "../i18n/messages/index.ts";
import {
  brandGuard,
  factsGuard,
  labelPairingSourceGuard,
  lexiconGuard,
  payloadCastsGuard,
  deliveryClaimsGuard,
  recordPayloadGuard,
  stylesGuard,
  tierGuard,
  vendoredGuard,
} from "../testing/kit/index.ts";

/**
 * Claims about a delivery this app has already answered for (34 D19).
 *
 * Filled in below, per key, with the argument being made — see
 * `testing/kit/delivery-claims.ts` for the three that are legitimate.
 */
const DELIVERY_CLAIMS: Record<string, string> = {};


/* ─── the kit's own gates ─────────────────────────────────────────────────── */

/**
 * The vocabulary ban, over the MERGED bundle.
 *
 * `MESSAGES` is merged in place by `registerAddOnMessages`, and importing
 * `./registry.ts` above is what makes that happen — the import is for its
 * module-load side effect as much as for `demoAddOns`. Reading the host's own
 * area modules instead would run this gate over exactly the half of the copy
 * that is not on trial.
 */
lexiconGuard(hostKit, { bundleFor: (locale) => MESSAGES[locale as keyof typeof MESSAGES] ?? {} });

brandGuard(hostKit);
labelPairingSourceGuard(hostKit);
payloadCastsGuard(hostKit);
factsGuard(hostKit);
vendoredGuard(hostKit);
stylesGuard(hostKit);
/*
 * 34 D19. This app labels no simulation — it has no demo-marker convention at
 * all — so every claim it makes has to be answered in `claimsDeclared`, by
 * name, with the argument being made.
 */
deliveryClaimsGuard(hostKit, {
  bundleFor: (locale) => MESSAGES[locale as keyof typeof MESSAGES] ?? {},
  demoLabels: {},
  claimsDeclared: DELIVERY_CLAIMS,
});
recordPayloadGuard(hostKit);

tierGuard(hostKit);

/* ─── what is true of THIS host and no other ──────────────────────────────── */

describe("factory-ops · the add-ons it registers", () => {
  const registry = createRegistry(demoAddOns());

  it("registers at least one, so every case below is deciding something", () => {
    /*
     * THE GUARD ON THE GUARD. Every assertion in this block is a statement
     * about a list, and a list that came back empty would satisfy most of them
     * — `every` over nothing is true. The registry going empty is not a fantasy
     * either: it is one bad merge in `registry.ts` away, and the app would
     * still build, still render and still pass its other 190 cases.
     */
    expect(registry.all.length).toBeGreaterThan(0);
  });

  it("merged every registered add-on's strings into all eight locales", () => {
    /*
     * `registerAddOnMessages` throws on a short bundle, so a missing locale
     * fails at module load rather than here. What this checks is the thing a
     * throw cannot: that registration HAPPENED for every add-on that has
     * strings. A registry built without the message loop would leave every
     * `addon.shipping-dhl.*` key resolving to its own dotted path on screen,
     * with nothing red anywhere.
     */
    const withStrings = registry.all.filter((addOn) => addOn.messages !== undefined);
    expect(registeredAddOnMessageKeys()).toEqual(withStrings.map((a) => a.key).sort());
    for (const locale of hostKit.localeTags) {
      const bundle = MESSAGES[locale as keyof typeof MESSAGES];
      expect(bundle["addon.shipping-dhl.line"], locale).toBeTypeOf("string");
    }
  });

  it("starts with nothing switched on, so the desk is finished without it", () => {
    /*
     * 24 D6, asserted rather than described. `registerAddOns` sets no `enabled`
     * key, so the first render after a boot draws every slot's empty state —
     * which is what makes "the app looks finished with the add-on off" a thing
     * a reviewer can check by opening it rather than a claim in a header.
     */
    for (const slot of HOSTED_SLOTS) {
      expect(registry.fillsFor(slot, new Set()), slot).toEqual([]);
    }
  });

  it("seeds a default for every setting an add-on declares", () => {
    for (const addOn of registry.all) {
      const values = DEFAULT_ADD_ON_SETTINGS[addOn.key] ?? {};
      for (const setting of addOn.settings) {
        expect(values[setting.key], `${addOn.key}.${setting.key}`).toBeDefined();
      }
    }
  });

  it("holds no secret, because there is nowhere in this app to put one", () => {
    /*
     * 24 D15 from the host's side. An add-on's `settings` list is what its
     * panel may render IN A BROWSER; its credentials are declared secret in its
     * manifest and live in its server half. This asserts the default document
     * this app boots with carries neither of the carrier's two — not because
     * they were carefully removed, but because nothing here has a field for
     * one, and this case is what would notice if that changed.
     */
    const flat = JSON.stringify(DEFAULT_ADD_ON_SETTINGS);
    expect(flat).not.toContain("api_key");
    expect(flat).not.toContain("account_number");
  });

  it("fills the dispatch slot this app actually mounts", () => {
    /*
     * The seam is only worth having if something crosses it. The carrier fills
     * `order.dispatch.actions`; it also fills three slots this app does not
     * mount, and those fills simply never render — which is D21 working rather
     * than a mismatch.
     */
    const all = new Set(registry.all.map((a) => a.key));
    expect(registry.fillsFor("order.dispatch.actions", all).map((f) => f.addOn)).toContain(
      "shipping-dhl",
    );
  });

  it("fills the record slot the Recipes card mounts", () => {
    /*
     * The same statement for the third slot, and it is worth its own case
     * rather than a loop over the other one, because it is the one this app
     * could most easily have got wrong: `record.actions` was in the registry
     * unfilled by anything for the whole time this host declined to mount it,
     * so "the slot is hosted" and "something reaches it" were separate facts
     * until this add-on arrived.
     */
    const all = new Set(registry.all.map((a) => a.key));
    expect(registry.fillsFor("record.actions", all).map((f) => f.addOn)).toContain(
      "barcode-labels",
    );
  });

  it("gives the settings drawer ONE panel, not every add-on's", () => {
    const all = new Set(registry.all.map((a) => a.key));
    expect(SLOT_FILL["settings.add-on.panel"]).toBe("per-add-on");
    for (const addOn of registry.all) {
      const mine = registry.fillsFor("settings.add-on.panel", all, addOn.key);
      expect(mine.every((f) => f.addOn === addOn.key), addOn.key).toBe(true);
    }
  });
});

/**
 * THE TWO ENDS OF ONE KEY NAMESPACE, HELD TOGETHER.
 *
 * `catalogueSamples` hands an add-on the key it files things under, and
 * `catalogueRecord` hands over the key it looks them up by when somebody opens
 * a record. Nothing on either payload lets the FAR side notice that they
 * disagree — the contract says so in as many words — so an add-on given a key
 * belonging to no row simply reports, forever, that the row has nothing, on
 * every screen, in every locale, with nothing red anywhere.
 *
 * That is not hypothetical here: this app handed out `PLT-260`, a shape-and-
 * size prefix that names no row, for as long as it had a settings panel and no
 * record mount. Mounting the record surface is what made the disagreement
 * REACHABLE, and these cases are what make it VISIBLE — because the guard that
 * would otherwise be watching this whole area, `mountsGuard`, needs a DOM and
 * is not running in this host at all (`host-kit.config.ts` declares tier 1).
 */
describe("factory-ops · the keys it hands across the seam", () => {
  const skus = new Set(ITEMS.map((item) => item.sku));

  it("samples a catalogue row by a key that is a row", () => {
    const keys = catalogueSamples(ITEMS).map((sample) => sample.key);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.filter((key) => !skus.has(key))).toEqual([]);
  });

  it("identifies a record by the same key `itemBySku` finds it with", () => {
    for (const item of ITEMS) {
      expect(catalogueRecord(item, NOW).recordId, item.sku).toBe(item.sku);
    }
  });

  it("offers no write handle, because nothing in this app writes an item's fields", () => {
    /*
     * `patchRecord` is optional on the payload and its absence is a decision
     * with a long reason in `hostRecords.ts`: every write to `items` goes
     * through a ledger engine that moves a balance AND writes a movement beside
     * it, so a generic patch handle would either bypass that rule or accept
     * fields it silently ignores. Asserted rather than described, because the
     * helpful-looking addition is one line and reads like an improvement.
     */
    expect("patchRecord" in catalogueRecord(ITEMS[0]!, NOW)).toBe(false);
  });

  it("dates the record off the works' own clock, adapted rather than re-derived", () => {
    // The seam wants an hour and a minute; this app counts minutes since
    // midnight. `NOW` is 10:15 on the pinned Tuesday.
    expect(catalogueRecord(ITEMS[0]!, NOW).now).toEqual({
      iso: NOW.date,
      hour: Math.floor(NOW.minutes / 60),
      minute: NOW.minutes % 60,
    });
  });
});

describe("factory-ops · the slots it says it hosts", () => {
  it("hosts a strict subset of the closed registry", () => {
    // The kit's mounts guard says the same thing and needs a DOM to say the
    // rest of what it says; this half needs none and is the half that catches
    // the `HOSTED_SLOTS` mis-import described in `slots.ts`.
    expect(HOSTED_SLOTS.every((slot) => isHosted(slot))).toBe(true);
    expect(HOSTED_SLOTS.length).toBeLessThan(Object.keys(SLOT_FILL).length);
  });

  it("decides an empty behaviour for every slot it hosts, and no other", () => {
    expect(Object.keys(SLOT_EMPTY_BEHAVIOUR).sort()).toEqual([...HOSTED_SLOTS].sort());
  });

  it("does not claim the three customer surfaces it has no screen for", () => {
    /*
     * `manifest.json` declares one frontend and its side is `staff`. These
     * three are the customer halves of the same add-on, and a works desk
     * mounting them would have to invent a screen for somebody who never opens
     * this app. Named here rather than merely absent, because "we did not get
     * to it" and "this app has no such surface" look identical in a list.
     */
    for (const slot of [
      "checkout.delivery.methods",
      "order.dispatch.panel",
      "product.options.personalize",
    ] as const) {
      expect(isHosted(slot), slot).toBe(false);
    }
  });
});
