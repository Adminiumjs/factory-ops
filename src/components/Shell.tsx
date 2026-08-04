/**
 * Internal-tool chrome throughout — this app has no public face, so unlike the
 * clinic desk and the hotel there is ONE shell rather than two. What the demo
 * dock's Floor | Office segment switches is who the sidebar is for, not what
 * kind of product the reader is looking at.
 *
 * The sidebar changes with the persona: the Floor gets the board, the stations,
 * the kilns, the seconds log and the handover note; the Office gets stock,
 * counts, purchasing, suppliers, the order book, dispatch, invoices, recipes and
 * the money. Under 900px the sidebar becomes a hamburger and a slide-in sheet.
 */

import { useMemo, useState } from "react";
import {
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Columns3,
  Factory,
  Flame,
  Hammer,
  ListTree,
  Menu,
  Moon,
  NotebookPen,
  Package,
  Receipt,
  Search,
  Send,
  Sun,
  Truck,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";

import type { Persona, View } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import type { MessageKey } from "../i18n/messages/index.ts";
import { itemName } from "../lib/format.ts";
import { itemBySku } from "../lib/production.ts";
import { staffFor, useStore } from "../state/store.ts";

/* ------------------------------------------------------------------- nav */

interface NavEntry {
  view: View;
  labelKey: MessageKey;
  icon: typeof Columns3;
}

const NAV: Record<Persona, NavEntry[]> = {
  floor: [
    { view: "board", labelKey: "chrome.nav.board", icon: Columns3 },
    { view: "stations", labelKey: "chrome.nav.stations", icon: Hammer },
    { view: "firings", labelKey: "chrome.nav.firings", icon: Flame },
    { view: "seconds", labelKey: "chrome.nav.seconds", icon: TriangleAlert },
    { view: "handover", labelKey: "chrome.nav.handover", icon: NotebookPen },
  ],
  office: [
    { view: "stock", labelKey: "chrome.nav.stock", icon: Boxes },
    { view: "counts", labelKey: "chrome.nav.counts", icon: ClipboardCheck },
    { view: "purchasing", labelKey: "chrome.nav.purchasing", icon: Truck },
    { view: "suppliers", labelKey: "chrome.nav.suppliers", icon: Factory },
    { view: "orders", labelKey: "chrome.nav.orders", icon: ClipboardList },
    { view: "dispatch", labelKey: "chrome.nav.dispatch", icon: Send },
    { view: "invoices", labelKey: "chrome.nav.invoices", icon: Receipt },
    { view: "recipes", labelKey: "chrome.nav.recipes", icon: ListTree },
    { view: "books", labelKey: "chrome.nav.books", icon: Wallet },
  ],
};

function NavList({ onPick }: { onPick?: () => void }) {
  const { t } = useI18n();
  const view = useStore((s) => s.view);
  const persona = useStore((s) => s.persona);
  const go = useStore((s) => s.go);

  return (
    <nav className="kw-sidebar__nav" aria-label={t("chrome.brand.desk")}>
      {NAV[persona].map((entry) => {
        const Cmp = entry.icon;
        return (
          <button
            key={entry.view}
            type="button"
            className="kw-navitem"
            aria-current={view === entry.view ? "page" : undefined}
            onClick={() => {
              go(entry.view);
              onPick?.();
            }}
          >
            <Cmp size={16} aria-hidden="true" />
            {t(entry.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}

function Brand() {
  const { t } = useI18n();
  return (
    <div className="kw-sidebar__brand">
      <span className="kw-sidebar__mark" aria-hidden="true">
        <Flame size={17} />
      </span>
      <span>
        <span className="kw-sidebar__name">{t("chrome.brand")}</span>
        <span className="kw-sidebar__sub">{t("chrome.brand.desk")}</span>
      </span>
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <div className="kw-sidebar__foot">
      {t("chrome.footer.copy")}
      <span className="kw-sidebar__chip kw-mono">{t("chrome.footer.chip")}</span>
    </div>
  );
}

function ThemeButton() {
  const { t } = useI18n();
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const label = t(theme === "dark" ? "chrome.dock.theme.light" : "chrome.dock.theme.dark");
  return (
    <button type="button" className="kw-iconbtn kw-btn" onClick={toggleTheme} aria-label={label} title={label}>
      {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  );
}

/* ---------------------------------------------------------------- search */

/**
 * One search box over SKUs, run codes and order numbers. It is a filter over
 * what is already in memory rather than a query — there is no server in a demo —
 * and picking a hit navigates to the thing itself rather than to a list.
 */
function GlobalSearch() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const query = useStore((s) => s.query);
  const setQuery = useStore((s) => s.setQuery);
  const items = useStore((s) => s.items);
  const runs = useStore((s) => s.runs);
  const sos = useStore((s) => s.sos);
  const go = useStore((s) => s.go);
  const setPersona = useStore((s) => s.setPersona);
  const openRun = useStore((s) => s.openRun);
  const openHistory = useStore((s) => s.openHistory);

  const q = query.trim().toLowerCase();

  const hits = useMemo(() => {
    if (q.length < 2) return null;
    return {
      runs: runs.filter((r) => r.code.toLowerCase().includes(q)).slice(0, 4),
      items: items
        .filter((i) => i.sku.toLowerCase().includes(q) || itemName(i).toLowerCase().includes(q))
        .slice(0, 5),
      orders: sos.filter((o) => o.code.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [q, runs, items, sos]);

  const total =
    hits === null ? 0 : hits.runs.length + hits.items.length + hits.orders.length;

  return (
    <div className="kw-topbar__search">
      <Search size={15} aria-hidden="true" />
      <input
        className="kw-topbar__input kw-fld"
        type="search"
        value={query}
        placeholder={t("chrome.search.placeholder")}
        aria-label={t("chrome.search.label")}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 140)}
      />

      {open && hits !== null && (
        <div className="kw-searchpop kw-scroll">
          {total === 0 && (
            <p className="kw-searchpop__empty">{t("chrome.search.empty", { query })}</p>
          )}

          {hits.runs.length > 0 && (
            <div className="kw-searchpop__group">{t("chrome.search.runs")}</div>
          )}
          {hits.runs.map((r) => (
            <button
              key={r.code}
              type="button"
              className="kw-searchpop__row"
              onMouseDown={() => {
                setPersona("floor");
                openRun(r.code);
                setQuery("");
              }}
            >
              <Columns3 size={15} aria-hidden="true" />
              <span className="kw-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                {r.code}
              </span>
              <span className="kw-searchpop__meta">
                {itemName(itemBySku(items, r.sku)) || r.sku}
              </span>
            </button>
          ))}

          {hits.items.length > 0 && (
            <div className="kw-searchpop__group">{t("chrome.search.items")}</div>
          )}
          {hits.items.map((i) => (
            <button
              key={i.sku}
              type="button"
              className="kw-searchpop__row"
              onMouseDown={() => {
                setPersona("office");
                go("stock");
                openHistory(i.sku);
                setQuery("");
              }}
            >
              <Package size={15} aria-hidden="true" />
              <span className="kw-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                {i.sku}
              </span>
              <span className="kw-searchpop__meta">{itemName(i)}</span>
            </button>
          ))}

          {hits.orders.length > 0 && (
            <div className="kw-searchpop__group">{t("chrome.search.orders")}</div>
          )}
          {hits.orders.map((o) => (
            <button
              key={o.code}
              type="button"
              className="kw-searchpop__row"
              onMouseDown={() => {
                setPersona("office");
                go("orders");
                setQuery("");
              }}
            >
              <ClipboardList size={15} aria-hidden="true" />
              <span className="kw-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                {o.code}
              </span>
              <span className="kw-searchpop__meta">{o.lines.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- shell */

export default function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const navOpen = useStore((s) => s.navOpen);
  const setNavOpen = useStore((s) => s.setNavOpen);
  const persona = useStore((s) => s.persona);
  const staff = staffFor(persona);

  return (
    <div className="kw-app">
      <aside className="kw-sidebar">
        <Brand />
        <div className="kw-sidebar__persona">
          {t(persona === "floor" ? "chrome.dock.floor" : "chrome.dock.office")}
        </div>
        <NavList />
        <Footer />
      </aside>

      {navOpen && (
        <>
          <button
            type="button"
            className="kw-scrim"
            aria-label={t("chrome.menu.close")}
            onClick={() => setNavOpen(false)}
          />
          <div className="kw-sheet" role="dialog" aria-modal="true" aria-label={t("chrome.brand")}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Brand />
              <button
                type="button"
                className="kw-iconbtn kw-btn kw-iconbtn--sm"
                style={{ marginInlineStart: "auto", marginInlineEnd: 8 }}
                onClick={() => setNavOpen(false)}
                aria-label={t("chrome.menu.close")}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
            <NavList onPick={() => setNavOpen(false)} />
            <Footer />
          </div>
        </>
      )}

      <div className="kw-main">
        <header className="kw-topbar">
          <button
            type="button"
            className="kw-iconbtn kw-btn kw-narrow-only"
            onClick={() => setNavOpen(true)}
            aria-label={t("chrome.menu.open")}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          <GlobalSearch />
          <div className="kw-topbar__spacer" />

          <ThemeButton />
          <span className="kw-userchip">
            <span className="kw-avatar" aria-hidden="true">
              {staff.ini}
            </span>
            <span className="kw-wide-only">{staff.name}</span>
          </span>
        </header>

        <main className="kw-content kw-scroll" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
