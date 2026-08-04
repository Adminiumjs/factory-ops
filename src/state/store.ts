/**
 * The app's single store.
 *
 * Deliberately one zustand store rather than several: the floor board, the
 * stock table, the order book and the books all read the same items, runs and
 * movements, and splitting them would mean keeping four copies in step.
 * Everything derived — availability, yield, allocation state, an invoice's
 * status and age, the period roll-up — is computed in `lib/production.ts` and
 * `lib/ledger.ts` at render time from what lives here, never stored.
 *
 * The seed is copied into state on creation so the demo can be reset without
 * reloading the page, and so `data/demo.ts` stays an immutable description of
 * the fiction rather than mutable app state.
 *
 * THE CLOCK DOES NOT MOVE. `now` is the pinned Tuesday 10:15 and there is no
 * action that changes it: on this app the Floor advances the board, not the hour
 * (21 D6a). Every elapsed chip, invoice age and required-by date resolves
 * against that one value, and nothing in the app reads a real clock.
 */

import { create } from "zustand";

import {
  CUSTOMERS,
  GLAZES,
  LOT_PREFIX,
  NEXT,
  STAFF,
  STATIONS,
  SUPPLIERS,
  TAX_RATE,
} from "../data/demo.ts";
import { source } from "../data/source.ts";
import type {
  CountSheet,
  Defect,
  Firing,
  Invoice,
  Item,
  Movement,
  MovementKind,
  Now,
  PayMethod,
  Persona,
  PoStatus,
  PurchaseOrder,
  Run,
  SalesOrder,
  SoLine,
  Toast,
  View,
} from "../data/types.ts";
import { HOME_VIEW } from "../data/types.ts";
import { t } from "../i18n/ambient.ts";
import {
  clock,
  money,
  poStatusLabel,
  qty as qtyLabel,
  soStatusLabel,
  stageLabel,
} from "../lib/format.ts";
import {
  addDays,
  applyReceipt,
  invoiceTotals,
  nextSoStatus,
  outstandingOf,
} from "../lib/ledger.ts";
import {
  applyOutput,
  canRecordOutput,
  defaultStationFor,
  itemBySku,
  mintLot,
  nextStage,
  round2,
} from "../lib/production.ts";

const THEME_KEY = "factory-ops-theme";

export type Theme = "light" | "dark";

/* Reference data never changes during a session, so it is read once here
 * rather than copied into state and reset with everything else. */
export const PINNED: Now = source.now();
export const ALL_STATIONS = STATIONS;
export const ALL_GLAZES = GLAZES;
export const ALL_SUPPLIERS = SUPPLIERS;
export const ALL_CUSTOMERS = CUSTOMERS;
export const DESK_STAFF = STAFF;
export const TAX = TAX_RATE;
/** Reasons a piece was set aside, in log order. */
export const REASONS = ["warp", "crack", "crawl", "pinhole", "chip", "handling"];

export function stationById(id: string | null) {
  return id === null ? null : (ALL_STATIONS.find((s) => s.id === id) ?? null);
}

export function customerById(id: string) {
  return ALL_CUSTOMERS.find((c) => c.id === id) ?? null;
}

export function supplierById(id: string) {
  return ALL_SUPPLIERS.find((s) => s.id === id) ?? null;
}

export function glazeById(id: string | undefined) {
  return ALL_GLAZES.find((g) => g.id === id) ?? null;
}

/** The seed, freshly copied. Used at creation and again by `reset()`. */
function freshData() {
  return {
    items: source.items(),
    runs: source.runs(),
    movements: source.movements(),
    firings: source.firings(),
    defects: source.defects(),
    pos: source.purchaseOrders(),
    sos: source.salesOrders(),
    invoices: source.invoices(),
    counts: source.countSheets(),
    seqRun: NEXT.run,
    seqLot: NEXT.lot,
    seqPo: NEXT.po,
    seqInvoice: NEXT.invoice,
  };
}

interface State {
  /* --- routing + persona --- */
  view: View;
  persona: Persona;

  /* --- chrome --- */
  theme: Theme;
  navOpen: boolean;
  dockOpen: boolean;

  /* --- the pinned clock --- */
  now: Now;

  /* --- data --- */
  items: Item[];
  runs: Run[];
  movements: Movement[];
  firings: Firing[];
  defects: Defect[];
  pos: PurchaseOrder[];
  sos: SalesOrder[];
  invoices: Invoice[];
  counts: CountSheet[];

  /* --- code sequences --- */
  seqRun: number;
  seqLot: number;
  seqPo: number;
  seqInvoice: number;

  /* --- filters and queries --- */
  query: string;
  stockQuery: string;
  stockFilter: "all" | "below" | "products";
  moveFilter: MovementKind | "all";
  reasonFilter: string;
  invFilter: "all" | "overdue" | "part_paid" | "sent" | "paid";

  /* --- overlays --- */
  runCode: string | null;
  histSku: string | null;
  poCode: string | null;
  invNumber: string | null;
  payOpen: boolean;

  /* --- drafts --- */
  outputGood: string;
  outputScrap: string;
  receiveDraft: Record<string, string>;
  countDraft: Record<string, string>;
  picked: Record<string, boolean>;
  payAmount: string;
  payMethod: PayMethod;
  recipeSku: string;
  rateDraft: string;
  handoverNote: string;
  handoverSigned: boolean;

  toasts: Toast[];

  /* --- actions --- */
  go: (view: View) => void;
  setPersona: (p: Persona) => void;
  initTheme: () => void;
  toggleTheme: () => void;
  setNavOpen: (open: boolean) => void;
  setDockOpen: (open: boolean) => void;
  reset: () => void;
  escape: () => void;

  setQuery: (q: string) => void;
  setStockQuery: (q: string) => void;
  setStockFilter: (f: State["stockFilter"]) => void;
  setMoveFilter: (f: State["moveFilter"]) => void;
  setReasonFilter: (r: string) => void;
  setInvFilter: (f: State["invFilter"]) => void;

  openRun: (code: string | null) => void;
  advanceRun: (code: string) => void;
  setOutput: (patch: { good?: string; scrap?: string }) => void;
  saveOutput: () => void;

  openHistory: (sku: string | null) => void;

  openReceive: (code: string | null) => void;
  setReceive: (sku: string, value: string) => void;
  confirmReceive: () => void;

  openInvoice: (number: string | null) => void;
  setPayOpen: (open: boolean) => void;
  setPayAmount: (v: string) => void;
  setPayMethod: (m: PayMethod) => void;
  recordPayment: () => void;

  advanceOrder: (code: string) => void;
  makeIt: (order: string, lineIndex: number, shortBy: number) => void;
  togglePicked: (key: string) => void;
  shipOrder: (code: string) => void;

  setCount: (key: string, value: string) => void;
  postCount: (code: string) => void;

  raisePO: (supplier: string, skus: string[]) => void;

  setRecipeSku: (sku: string) => void;
  setRateDraft: (v: string) => void;

  setHandoverNote: (v: string) => void;
  signHandover: () => void;

  toast: (text: string, icon: string) => void;
}

/** True while any overlay owns a bottom corner, so the dock steps aside. */
export function overlayOpen(s: State): boolean {
  return (
    s.runCode !== null ||
    s.histSku !== null ||
    s.poCode !== null ||
    s.invNumber !== null ||
    s.navOpen
  );
}

let toastSeq = 0;

export const useStore = create<State>((set, get) => ({
  view: "board",
  persona: "floor",

  theme: "light",
  navOpen: false,
  dockOpen: true,

  now: PINNED,

  ...freshData(),

  query: "",
  stockQuery: "",
  stockFilter: "all",
  moveFilter: "all",
  reasonFilter: "all",
  invFilter: "all",

  runCode: null,
  histSku: null,
  poCode: null,
  invNumber: null,
  payOpen: false,

  outputGood: "",
  outputScrap: "",
  receiveDraft: {},
  countDraft: {},
  picked: {},
  payAmount: "",
  payMethod: "transfer",
  recipeSku: "PLT-260-SPK",
  rateDraft: "",
  handoverNote: "",
  handoverSigned: false,

  toasts: [],

  /* ------------------------------------------------------------- chrome */

  go: (view) => {
    /* Switching views scrolls back to the top: opening a run must land at its
     * header, not mid-table (house layout rule 3). */
    set({ view, navOpen: false, query: "" });
    window.scrollTo({ top: 0, behavior: "auto" });
    document.querySelector(".kw-content")?.scrollTo({ top: 0 });
  },

  setPersona: (persona) => {
    set({ persona, view: HOME_VIEW[persona], navOpen: false, query: "" });
    document.querySelector(".kw-content")?.scrollTo({ top: 0 });
  },

  initTheme: () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      // Storage disabled — fall through to the OS preference.
    }
    const prefersDark =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme: Theme = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    set({ theme });
  },

  toggleTheme: () => {
    const theme: Theme = get().theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Not being able to remember the choice is not a reason to refuse it.
    }
    set({ theme });
  },

  setNavOpen: (navOpen) => set({ navOpen }),
  setDockOpen: (dockOpen) => set({ dockOpen }),

  reset: () => {
    set({
      ...freshData(),
      view: HOME_VIEW[get().persona],
      query: "",
      stockQuery: "",
      stockFilter: "all",
      moveFilter: "all",
      reasonFilter: "all",
      invFilter: "all",
      runCode: null,
      histSku: null,
      poCode: null,
      invNumber: null,
      payOpen: false,
      outputGood: "",
      outputScrap: "",
      receiveDraft: {},
      countDraft: {},
      picked: {},
      payAmount: "",
      recipeSku: "PLT-260-SPK",
      rateDraft: "",
      handoverNote: "",
      handoverSigned: false,
      toasts: [],
    });
    get().toast(t("chrome.toast.reset"), "rotate-ccw");
  },

  /** Escape closes overlays outermost-first, never all of them at once. */
  escape: () => {
    const s = get();
    if (s.payOpen) return set({ payOpen: false });
    if (s.runCode !== null) return set({ runCode: null });
    if (s.poCode !== null) return set({ poCode: null, receiveDraft: {} });
    if (s.invNumber !== null) return set({ invNumber: null, payOpen: false });
    if (s.histSku !== null) return set({ histSku: null, moveFilter: "all" });
    if (s.navOpen) return set({ navOpen: false });
    if (s.query !== "") return set({ query: "" });
  },

  /* ------------------------------------------------------------ filters */

  setQuery: (query) => set({ query }),
  setStockQuery: (stockQuery) => set({ stockQuery }),
  setStockFilter: (stockFilter) => set({ stockFilter }),
  setMoveFilter: (moveFilter) => set({ moveFilter }),
  setReasonFilter: (reasonFilter) => set({ reasonFilter }),
  setInvFilter: (invFilter) => set({ invFilter }),

  /* ---------------------------------------------------------- the floor */

  openRun: (runCode) => set({ runCode, outputGood: "", outputScrap: "" }),

  advanceRun: (code) => {
    const s = get();
    const run = s.runs.find((r) => r.code === code);
    if (!run) return;
    const next = nextStage(run.stage);
    if (next === null) return;

    set({
      runs: s.runs.map((r) =>
        r.code === code
          ? {
              ...r,
              stage: next,
              /* A run that has never been on the floor starts its clock the
               * moment it is released, not the moment it was raised. */
              startedMin: r.startedMin ?? 0,
              station: r.station ?? defaultStationFor(next),
            }
          : r,
      ),
    });
    get().toast(
      t("chrome.toast.advanced", { code, stage: stageLabel(next) }),
      "arrow-right",
    );
  },

  setOutput: (patch) =>
    set((s) => ({
      outputGood: patch.good ?? s.outputGood,
      outputScrap: patch.scrap ?? s.outputScrap,
    })),

  saveOutput: () => {
    const s = get();
    const run = s.runs.find((r) => r.code === s.runCode);
    if (!run) return;
    const good = Number.parseInt(s.outputGood || "0", 10) || 0;
    const scrap = Number.parseInt(s.outputScrap || "0", 10) || 0;
    if (!canRecordOutput(run, good)) return;

    const lot = mintLot(LOT_PREFIX, s.seqLot);
    const result = applyOutput(
      s.items,
      s.runs,
      s.movements,
      run,
      good,
      scrap,
      lot,
      s.now.date,
    );

    set({
      items: result.items,
      runs: result.runs,
      movements: result.movements,
      seqLot: s.seqLot + 1,
      outputGood: "",
      outputScrap: "",
    });
    get().toast(
      t("chrome.toast.output", { code: run.code, lot }, good),
      "package-check",
    );
  },

  openHistory: (histSku) => set({ histSku, moveFilter: "all" }),

  /* --------------------------------------------------------- purchasing */

  openReceive: (poCode) => set({ poCode, receiveDraft: {} }),

  setReceive: (sku, value) =>
    set((s) => ({ receiveDraft: { ...s.receiveDraft, [sku]: value } })),

  confirmReceive: () => {
    const s = get();
    const po = s.pos.find((p) => p.code === s.poCode);
    if (!po) return;

    const entries: Record<string, number> = {};
    for (const line of po.lines) {
      const raw = Number.parseFloat(s.receiveDraft[line.sku] ?? "");
      if (!Number.isNaN(raw) && raw > 0) entries[line.sku] = raw;
    }
    if (Object.keys(entries).length === 0) return;

    const { po: nextPo, received, complete } = applyReceipt(po, entries);

    /* Stock goes up straight away, with a movement row to prove it. */
    const items = s.items.map((item) =>
      received[item.sku]
        ? { ...item, onHand: round2(item.onHand + received[item.sku]) }
        : item,
    );
    const movements: Movement[] = [
      ...s.movements,
      ...Object.entries(received).map(([sku, qty]) => ({
        sku,
        date: s.now.date,
        kind: "receipt" as const,
        ref: po.code,
        qty,
      })),
    ];

    set({
      items,
      movements,
      pos: s.pos.map((p) => (p.code === po.code ? nextPo : p)),
      poCode: null,
      receiveDraft: {},
    });
    get().toast(
      complete
        ? t("chrome.toast.receivedFull", { code: po.code })
        : t("chrome.toast.receivedPart", { code: po.code }),
      "truck",
    );
  },

  raisePO: (supplier, skus) => {
    if (skus.length === 0) return;
    const s = get();
    const code = `PO-${s.seqPo}`;
    const sup = supplierById(supplier);

    const po: PurchaseOrder = {
      code,
      supplier,
      status: "draft" as PoStatus,
      raised: s.now.date,
      due: addDays(s.now.date, sup?.lead ?? 7),
      lines: skus.map((sku) => {
        const item = itemBySku(s.items, sku);
        if (!item) return { sku, qty: 0, received: 0, cost: 0 };
        /* Order back up to twice the reorder point, rounded to a sane
         * multiple — nobody buys 37.4 kg of clay. */
        const need = Math.max(item.reorder * 2 - (item.onHand - item.allocated), item.reorder);
        return { sku, qty: Math.ceil(need / 10) * 10, received: 0, cost: item.cost };
      }),
    };

    set({ pos: [...s.pos, po], seqPo: s.seqPo + 1 });
    get().toast(
      t(
        "chrome.toast.poDrafted",
        { code, supplier: sup?.name ?? supplier },
        skus.length,
      ),
      "file-plus",
    );
  },

  /* --------------------------------------------------------- the office */

  openInvoice: (invNumber) => set({ invNumber, payOpen: false, payAmount: "" }),
  setPayOpen: (payOpen) => set({ payOpen }),
  setPayAmount: (payAmount) => set({ payAmount }),
  setPayMethod: (payMethod) => set({ payMethod }),

  recordPayment: () => {
    const s = get();
    const invoice = s.invoices.find((i) => i.number === s.invNumber);
    if (!invoice) return;
    const amount = round2(Number.parseFloat(s.payAmount || "0") || 0);
    if (amount <= 0) return;

    const order = s.sos.find((o) => o.code === invoice.order) ?? null;
    const { total } = invoiceTotals(order, TAX);
    if (amount > outstandingOf(invoice, total) + 0.005) return;

    set({
      invoices: s.invoices.map((i) =>
        i.number === invoice.number
          ? {
              ...i,
              payments: [
                ...i.payments,
                { date: s.now.date, method: s.payMethod, amount },
              ],
            }
          : i,
      ),
      payOpen: false,
      payAmount: "",
    });
    get().toast(
      t("chrome.toast.payment", { amount: money(amount), number: invoice.number }),
      "banknote",
    );
  },

  advanceOrder: (code) => {
    const s = get();
    const order = s.sos.find((o) => o.code === code);
    if (!order) return;
    const next = nextSoStatus(order.status);
    if (next === null) return;

    if (next === "invoiced") {
      const number = `INV-${s.seqInvoice}`;
      set({
        seqInvoice: s.seqInvoice + 1,
        sos: s.sos.map((o) =>
          o.code === code ? { ...o, status: "invoiced" as const, invoice: number } : o,
        ),
        invoices: [
          ...s.invoices,
          {
            number,
            order: code,
            customer: order.customer,
            issued: s.now.date,
            due: addDays(s.now.date, 14),
            payments: [],
          },
        ],
      });
      get().toast(t("chrome.toast.invoiceRaised", { number, code }), "receipt");
      return;
    }

    set({
      sos: s.sos.map((o) => (o.code === code ? { ...o, status: next } : o)),
    });
    get().toast(
      t("chrome.toast.orderAdvanced", { code, status: soStatusLabel(next) }),
      "arrow-right",
    );
  },

  /**
   * Raise a run for exactly the shortfall and drop it into Queued.
   *
   * The new run is marked `madeInSession`: it carries its own allocation, so it
   * is never itself reported as blocked by the shortage that created it.
   */
  makeIt: (orderCode, lineIndex, shortBy) => {
    const s = get();
    const order = s.sos.find((o) => o.code === orderCode);
    const line: SoLine | undefined = order?.lines[lineIndex];
    if (!order || !line || shortBy <= 0) return;

    const code = `RUN-${s.seqRun}`;
    const run: Run = {
      code,
      sku: line.sku,
      qty: shortBy,
      good: 0,
      scrap: 0,
      stage: "queued",
      station: null,
      startedMin: null,
      lot: null,
      signoffs: {},
      forOrder: order.code,
      madeInSession: true,
    };

    set({
      seqRun: s.seqRun + 1,
      runs: [...s.runs, run],
      sos: s.sos.map((o) =>
        o.code === orderCode
          ? { ...o, lines: o.lines.map((l, i) => (i === lineIndex ? { ...l, run: code } : l)) }
          : o,
      ),
    });
    get().toast(
      t("chrome.toast.made", { code, qty: String(shortBy), sku: line.sku }),
      "plus",
    );
  },

  togglePicked: (key) =>
    set((s) => ({ picked: { ...s.picked, [key]: !s.picked[key] } })),

  shipOrder: (code) => {
    const s = get();
    const order = s.sos.find((o) => o.code === code);
    if (!order) return;

    /* Shipping issues the stock AND releases the allocation: the units have
     * left the building, so they are neither on hand nor promised. */
    const items = s.items.map((item) => {
      const line = order.lines.find((l) => l.sku === item.sku);
      if (!line) return item;
      return {
        ...item,
        onHand: Math.max(0, round2(item.onHand - line.qty)),
        allocated: Math.max(0, round2(item.allocated - Math.min(line.alloc, line.qty))),
      };
    });

    set({
      items,
      movements: [
        ...s.movements,
        ...order.lines.map((l) => ({
          sku: l.sku,
          date: s.now.date,
          kind: "shipment" as const,
          ref: order.code,
          qty: -l.qty,
        })),
      ],
      sos: s.sos.map((o) => (o.code === code ? { ...o, status: "shipped" as const } : o)),
      picked: {},
    });
    get().toast(t("chrome.toast.shipped", { code }), "send");
  },

  /* ------------------------------------------------------------- counts */

  setCount: (key, value) =>
    set((s) => ({ countDraft: { ...s.countDraft, [key]: value } })),

  postCount: (code) => {
    const s = get();
    const sheet = s.counts.find((c) => c.code === code);
    if (!sheet) return;

    let adjusted = 0;
    const movements = [...s.movements];
    const items = s.items.map((item) => {
      const idx = sheet.lines.findIndex((l) => l.sku === item.sku);
      if (idx === -1) return item;

      const draft = s.countDraft[`${code}:${idx}`];
      const counted =
        draft !== undefined && draft !== ""
          ? Number.parseFloat(draft)
          : sheet.lines[idx].counted;
      if (counted === null || counted === undefined || Number.isNaN(counted)) return item;

      const diff = round2(counted - item.onHand);
      if (Math.abs(diff) < 0.005) return item;

      adjusted += 1;
      movements.push({
        sku: item.sku,
        date: s.now.date,
        kind: "adjustment",
        ref: code,
        qty: diff,
      });
      return { ...item, onHand: counted };
    });

    set({
      items,
      movements,
      counts: s.counts.map((c) =>
        c.code === code ? { ...c, status: "posted" as const } : c,
      ),
      countDraft: {},
    });
    get().toast(t("chrome.toast.countPosted", { code }, adjusted), "clipboard-check");
  },

  /* ------------------------------------------------------------ recipes */

  setRecipeSku: (recipeSku) => set({ recipeSku, rateDraft: "" }),
  setRateDraft: (rateDraft) => set({ rateDraft }),

  /* ----------------------------------------------------------- handover */

  setHandoverNote: (handoverNote) => set({ handoverNote }),

  signHandover: () => {
    if (get().handoverSigned) return;
    set({ handoverSigned: true });
    get().toast(t("chrome.toast.signed", { name: STAFF.floor.name }), "check");
  },

  /* ------------------------------------------------------------- toasts */

  toast: (text, icon) => {
    const id = `t${++toastSeq}`;
    set((s) => ({ toasts: [...s.toasts, { id, text, icon }] }));
    window.setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
      3600,
    );
  },
}));

/* ---------------------------------------------------------------- helpers */

/** The shift header line: "Tuesday, 28 July 2026 · shift 07:00–15:30 · 10:15 now". */
export function shiftLine(now: Now): { start: string; end: string; now: string } {
  return {
    start: clock(now.shiftStart),
    end: clock(now.shiftEnd),
    now: clock(now.minutes),
  };
}

/** Whichever of the two people is at the desk for this persona. */
export function staffFor(persona: Persona) {
  return persona === "floor" ? STAFF.floor : STAFF.office;
}

/** A quantity with its unit, resolved through the item so callers stay short. */
export function itemQty(item: Item | null, value: number, dp?: number): string {
  return item ? qtyLabel(value, item.unit, dp) : String(value);
}

/** Re-exported so screens can label a purchase order without a second import. */
export { poStatusLabel };
