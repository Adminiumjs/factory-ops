/**
 * The app shell.
 *
 * Routing is a plain state switch over `store.view` — no react-router. Every
 * member of the `View` union is mapped to a screen below, so no nav item, search
 * hit or persona switch can land on a route that does not exist; anything the
 * union does not cover falls through to the 404.
 *
 * The chrome — the shell, the dock, the toasts and all four drawers — is mounted
 * once around the switch, so a view change never remounts it and a toast
 * survives the navigation that raised it.
 */

import { useEffect } from "react";
import type { ComponentType } from "react";

import DemoDock from "../components/DemoDock.tsx";
import {
  HistoryDrawer,
  InvoiceDrawer,
  ReceiveSheet,
  RunPanel,
  ToastLayer,
} from "../components/Overlays.tsx";
import Shell from "../components/Shell.tsx";
import type { View } from "../data/types.ts";
import { setAmbient } from "../i18n/ambient.ts";
import { useI18n } from "../i18n/index.tsx";
import { useStore } from "../state/store.ts";

import { Board, Firings, Handover, Seconds, Stations } from "../screens/Floor.tsx";
import NotFound from "../screens/NotFound.tsx";
import {
  Books,
  Counts,
  Dispatch,
  Invoices,
  Orders,
  Purchasing,
  Recipes,
  Stock,
  Suppliers,
} from "../screens/Office.tsx";

const SCREENS: Record<View, ComponentType> = {
  board: Board,
  stations: Stations,
  firings: Firings,
  seconds: Seconds,
  handover: Handover,
  stock: Stock,
  counts: Counts,
  purchasing: Purchasing,
  suppliers: Suppliers,
  orders: Orders,
  dispatch: Dispatch,
  invoices: Invoices,
  recipes: Recipes,
  books: Books,
  notfound: NotFound,
};

function CurrentScreen() {
  const view = useStore((s) => s.view);
  /* Unknown values can only arrive from injected state — 404 them. */
  const Screen = SCREENS[view] ?? NotFound;
  return <Screen />;
}

export default function App() {
  const initTheme = useStore((s) => s.initTheme);
  const escape = useStore((s) => s.escape);

  /*
   * Publish the live locale to the module-level bridge before anything below
   * renders. `lib/format.ts` builds its `Intl` instances from it, and the store
   * and both engines call those formatters from outside React where no hook can
   * reach the provider. Assigning during render rather than in an effect
   * matters: children render after this line, so the first paint after a locale
   * switch is already in the new locale instead of one frame behind.
   */
  const { locale, t, money, number } = useI18n();
  setAmbient(locale, t, money, number);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  /* Document-level Escape. The store closes overlays outermost-first. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") escape();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [escape]);

  return (
    <>
      <a className="kw-sr-only" href="#main">
        {t("chrome.skipToContent")}
      </a>
      <Shell>
        <CurrentScreen />
      </Shell>
      <DemoDock />
      <ToastLayer />
      <RunPanel />
      <HistoryDrawer />
      <ReceiveSheet />
      <InvoiceDrawer />
    </>
  );
}
