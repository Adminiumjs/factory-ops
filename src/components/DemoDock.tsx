/**
 * The demo dock.
 *
 * A fixed panel holding everything that makes this a demo rather than a
 * product: the theme toggle, the locale picker and a
 * reset. It is deliberately labelled "Demo controls" so nobody mistakes it for
 * a feature of the works' software.
 *
 * THERE IS NO CLOCK CHIP HERE, and that is a design decision rather than an
 * omission (21 D6a). The clinic desk moves time forward and the hotel jumps to
 * check-out; on this app the Floor advances the board and time simply stands at
 * 10:15. Adding a clock would imply that runs progress on their own, which is
 * the opposite of what a works desk is for.
 *
 * House layout rule 1 is enforced here: whenever an overlay owns the screen —
 * the run panel, the movement history, the receive sheet, the invoice drawer,
 * the mobile nav — the dock moves to the opposite inline corner rather than
 * sitting on top of a primary action. `--shifted` swaps `inset-inline-end` for
 * `inset-inline-start`, which mirrors correctly in RTL without a second rule.
 */

import { ChevronDown, Moon, RotateCcw, Settings2, Sun } from "lucide-react";

import { LOCALES, LOCALE_TAGS, useI18n, type LocaleTag } from "../i18n/index.tsx";
import { overlayOpen, useStore } from "../state/store.ts";

export default function DemoDock() {
  const { t, locale, setLocale } = useI18n();
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const open = useStore((s) => s.dockOpen);
  const setOpen = useStore((s) => s.setDockOpen);
  const reset = useStore((s) => s.reset);
  const shifted = useStore(overlayOpen);

  if (!open) {
    return (
      <button
        type="button"
        className={`kw-dock__mini kw-btn${shifted ? " kw-dock--shifted" : ""}`}
        onClick={() => setOpen(true)}
        aria-label={t("chrome.dock.expand")}
      >
        <Settings2 size={15} aria-hidden="true" />
        {t("chrome.dock.title")}
      </button>
    );
  }

  const themeLabel = t(
    theme === "dark" ? "chrome.dock.theme.light" : "chrome.dock.theme.dark",
  );

  return (
    <aside className={`kw-dock${shifted ? " kw-dock--shifted" : ""}`} aria-label={t("chrome.dock.title")}>
      <div className="kw-dock__head">
        <Settings2 size={13} aria-hidden="true" />
        {t("chrome.dock.title")}
        <button
          type="button"
          className="kw-dock__collapse"
          onClick={() => setOpen(false)}
          aria-label={t("chrome.dock.collapse")}
        >
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>
      {/* The persona switch lives in the app chrome now (Shell.tsx).
          It is not a demo control: both personas are staff, and outside a
          demo build this dock does not exist — so a switcher that only
          lived here left half the app unreachable. */}

      <div className="kw-dock__row">
        <span className="kw-dock__label">{t("chrome.dock.language")}</span>
        <select
          className="kw-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value as LocaleTag)}
          aria-label={t("chrome.dock.language")}
        >
          {LOCALE_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {LOCALES[tag].native}
            </option>
          ))}
        </select>
      </div>

      <div className="kw-dock__row">
        <span className="kw-dock__label">{t("chrome.dock.theme")}</span>
        <button
          type="button"
          className="kw-iconbtn kw-btn kw-iconbtn--sm"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {theme === "dark" ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="kw-iconbtn kw-btn kw-iconbtn--sm"
          onClick={reset}
          aria-label={t("chrome.dock.reset")}
          title={t("chrome.dock.reset")}
          style={{ marginInlineStart: "auto" }}
        >
          <RotateCcw size={15} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
