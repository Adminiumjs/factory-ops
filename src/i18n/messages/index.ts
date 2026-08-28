/**
 * The message registry.
 *
 * The app's strings are split across three area modules under `../strings/` so
 * they can be authored without one enormous file. This module is the only
 * place that knows they are separate: it flattens them into one bundle per
 * locale, which is what the runtime looks keys up in.
 *
 * Keys must be unique across areas — a later area silently wins a collision,
 * so namespace them (`chrome.*`, `board.*`, `data.*`, `addon.*`).
 *
 * ── AN ADD-ON'S OWN STRINGS ARE NOT AN AREA, AND THAT IS THE POINT ─────────
 *
 * The four areas below are this app's, and they are checked by the compiler:
 * `en-US` defines the keys and the other seven must carry every one of them.
 * A vendored add-on's bundle could have been a fifth — three lines, and the
 * same guarantee — and it is deliberately not, because it would have made the
 * host's key vocabulary a function of which add-ons happened to be vendored.
 * This module, the app's own i18n core, would name a company. A host that has
 * to be edited to accept a second add-on does not have an add-on system.
 *
 * So an add-on REGISTERS its bundle instead (`registerAddOnMessages`, called
 * from `add-ons/registry.ts` at module load). What that trade cost, exactly:
 *
 *   LOST   — add-on keys are not members of `MessageKey`, so `t()` on one is
 *            not spell-checked. Host code that renders an add-on's string was
 *            always going through a cast anyway, because the keys are only
 *            known through the add-on object.
 *   LOST   — a locale missing a key inside an add-on's bundle is no longer a
 *            compile error IN THIS REPO. It still is in the add-on's own,
 *            where the person who can fix it works.
 *   KEPT   — the guarantee itself, moved from the type checker into
 *            `registerAddOnMessages`, which walks the bundle and THROWS naming
 *            the add-on, the locale and the key. It runs at module load on
 *            every boot including the demo, so it cannot be skipped the way a
 *            test can.
 *
 * A RETROFIT THAT MERGES ADD-ON STRINGS WITHOUT THAT FUNCTION LOSES THE
 * GUARANTEE WITH NOTHING TO SAY SO. `Object.assign(MESSAGES[locale], bundle
 * [locale])` in a loop is four lines, works, passes every test in this repo,
 * and silently accepts an add-on missing three locales — which then falls back
 * to English on screen for a reader who cannot read it.
 */
import type { Translated } from "../untranslated.ts";
import { LOCALE_TAGS, type LocaleTag } from "../locales.ts";
import { addOns } from "../strings/addOns.ts";
import { chrome } from "../strings/chrome.ts";
import { screens } from "../strings/screens.ts";
import { data } from "../strings/data.ts";

/**
 * Parity guard. `en-US` defines the keys; the other seven must each carry a
 * string for every one of them. A translation module that is missing an English
 * key is a COMPILE error here rather than a silent per-key fallback to English
 * at runtime — which is the failure mode this whole layer exists to prevent.
 */
type Area<EN extends Record<string, string>> = { "en-US": EN } & Record<
  Exclude<LocaleTag, "en-US">,
  Translated<EN>
>;

const AREAS: [
  Area<(typeof chrome)["en-US"]>,
  Area<(typeof screens)["en-US"]>,
  Area<(typeof data)["en-US"]>,
  Area<(typeof addOns)["en-US"]>,
] = [chrome, screens, data, addOns];

export const MESSAGES = Object.fromEntries(
  LOCALE_TAGS.map((t) => [t, Object.assign({}, ...AREAS.map((a) => a[t] ?? {}))]),
) as Record<LocaleTag, Record<string, string>>;

/** Keys are typed off English — the source of truth — so a typo is a compile error. */
export type MessageKey =
  | keyof (typeof chrome)["en-US"]
  | keyof (typeof screens)["en-US"]
  | keyof (typeof data)["en-US"]
  | keyof (typeof addOns)["en-US"];

/** One add-on's bundle, as it travels on the add-on object. */
export type AddOnMessages = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** Which add-ons have registered, for the suite that checks they all did. */
const registered = new Set<string>();

export function registeredAddOnMessageKeys(): readonly string[] {
  return [...registered].sort();
}

/**
 * Merge one add-on's strings into the runtime bundle, refusing anything that is
 * not complete in all eight locales.
 *
 * ── IT THROWS, AND LOUDLY, ON PURPOSE ──────────────────────────────────────
 *
 * What it replaces was a compile error, and the failure it stands in for — a
 * key present in English and absent in Arabic — puts a raw dotted path on a
 * screen in exactly one of eight languages, which is the failure nobody notices
 * until a reader complains. A boot that dies naming the locale and the key is
 * strictly better than a works running with a hole in its Arabic.
 *
 * A COLLISION IS REFUSED for the same reason a later area silently winning one
 * is a hazard: an add-on that could overwrite `dispatch.ship` would be quietly
 * rewriting the works' own copy, and nothing on screen would look wrong.
 *
 * `trim()` rather than a bare emptiness check, because a key whose value is a
 * single space passes `!== ""` and renders as nothing at all — which is the
 * missing-string defect with the alarm disconnected.
 */
export function registerAddOnMessages(addOnKey: string, bundle: AddOnMessages): void {
  const english = bundle["en-US"];
  if (english === undefined) {
    throw new Error(`add-on "${addOnKey}" registered no en-US strings`);
  }

  const keys = Object.keys(english);
  for (const locale of LOCALE_TAGS) {
    const localeBundle = bundle[locale];
    if (localeBundle === undefined) {
      throw new Error(`add-on "${addOnKey}" is missing the ${locale} locale entirely`);
    }
    for (const key of keys) {
      const value = localeBundle[key];
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`add-on "${addOnKey}" is missing ${locale} for "${key}"`);
      }
    }
  }

  for (const key of keys) {
    if (MESSAGES["en-US"][key] !== undefined) {
      throw new Error(`add-on "${addOnKey}" would overwrite the existing message key "${key}"`);
    }
  }

  /*
   * Mutating the same objects rather than rebuilding `MESSAGES` is what lets
   * the provider hold a reference to a locale's bundle across a registration —
   * and registration happens at module load, before any of them is read, so
   * nothing is ever seen half-merged.
   */
  for (const locale of LOCALE_TAGS) Object.assign(MESSAGES[locale], bundle[locale]);
  registered.add(addOnKey);
}
