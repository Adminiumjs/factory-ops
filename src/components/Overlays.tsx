/**
 * The four drawers and the toast layer.
 *
 * All four are mounted once by `<App>` around the view switch, so a view change
 * never remounts them and a toast survives the navigation that raised it. Each
 * one is a right-hand sheet over a blurred scrim; Escape closes them
 * outermost-first through the store, and the dock steps aside while any of them
 * is open.
 */

import type { ReactNode } from "react";
import {
  ArrowDownRight,
  Banknote,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  ClipboardCheck,
  Coins,
  Flame,
  FileText,
  ListTree,
  PackageCheck,
  Send,
  Signature,
  Truck,
  X,
} from "lucide-react";

import type { Movement, MovementKind, PayMethod, SignoffStage } from "../data/types.ts";
import { SIGNOFF_STAGES } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import {
  bucketLabel,
  dateShort,
  invoiceStatusLabel,
  itemName,
  methodLabel,
  money,
  movementLabel,
  pct,
  qty as qtyLabel,
  qtyNumber,
  signedMoney,
  signedQty,
  stageLabel,
  stationName,
  unitLabel,
} from "../lib/format.ts";
import {
  bucketOf,
  checkPayment,
  daysPast,
  invoiceStatus,
  invoiceTotals,
  outstandingOf,
  paymentLedger,
} from "../lib/ledger.ts";
import {
  available,
  bomRows,
  historyFor,
  itemBySku,
  movementKinds,
  overBy,
  round2,
  runCost,
  stageIndex,
  yieldPct,
} from "../lib/production.ts";
import { TAX, customerById, stationById, supplierById, useStore } from "../state/store.ts";
import { Button, Chip, Field, Filter, IconButton, Mono, Notice, Readout, Tile } from "./Primitives.tsx";

/* ------------------------------------------------------------------ shell */

function Drawer({
  onClose,
  label,
  narrow,
  head,
  children,
}: {
  onClose: () => void;
  label: string;
  narrow?: boolean;
  head: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <>
      <button type="button" className="kw-drawer__scrim" aria-label={t("chrome.close")} onClick={onClose} />
      <aside
        className={`kw-drawer kw-scroll${narrow === true ? " kw-drawer--narrow" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div className="kw-drawer__head">
          {head}
          <IconButton
            label={t("chrome.close")}
            onClick={onClose}
            className="kw-iconbtn--sm"
            small
          >
            <X size={16} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="kw-drawer__body">{children}</div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------- run panel */

export function RunPanel() {
  const { t } = useI18n();
  const runCode = useStore((s) => s.runCode);
  const runs = useStore((s) => s.runs);
  const items = useStore((s) => s.items);
  const movements = useStore((s) => s.movements);
  const good = useStore((s) => s.outputGood);
  const scrap = useStore((s) => s.outputScrap);
  const setOutput = useStore((s) => s.setOutput);
  const saveOutput = useStore((s) => s.saveOutput);
  const openRun = useStore((s) => s.openRun);

  if (runCode === null) return null;
  const run = runs.find((r) => r.code === runCode);
  if (run === undefined) return null;

  const product = itemBySku(items, run.sku);
  const station = stationById(run.station);
  const cost = runCost(items, run);
  const rows = bomRows(items, run);

  const g = Number.parseInt(good || "0", 10) || 0;
  const s = Number.parseInt(scrap || "0", 10) || 0;
  const over = overBy(run, g);
  const blocked = over > 0 || g <= 0;
  const idx = stageIndex(run.stage);

  const entries = movements.filter((m) => m.ref === run.code && m.kind === "production");

  return (
    <Drawer
      onClose={() => openRun(null)}
      label={run.code}
      head={
        <>
          <Tile item={product} size={46} icon={26} />
          <div style={{ minInlineSize: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <Mono className="kw-drawer__title">{run.code}</Mono>
              <Chip>{stageLabel(run.stage)}</Chip>
              {run.forOrder !== null && (
                <Chip tone="info">
                  <Mono>{t("run.forOrder", { code: run.forOrder })}</Mono>
                </Chip>
              )}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBlockStart: 3 }}>
              {itemName(product)}
            </div>
            <Mono className="kw-drawer__meta">
              {t("run.ordered", {
                sku: run.sku,
                qty: qtyNumber(run.qty),
                good: qtyNumber(run.good),
              })}
            </Mono>
          </div>
        </>
      }
    >
      {/* --- bill of materials: required = per unit × run quantity --- */}
      <section className="kw-panel">
        <header className="kw-panel__head">
          <ListTree size={15} aria-hidden="true" />
          <h2 className="kw-panel__title">{t("run.bom")}</h2>
          <Mono className="kw-panel__sub" >
            {t("run.perUnitTimes", { qty: qtyNumber(run.qty) })}
          </Mono>
        </header>
        <div className="kw-grid kw-grid--head" style={{ "--cols": "minmax(120px,1.8fr) 84px 84px 68px" } as React.CSSProperties}>
          <div>{t("run.col.component")}</div>
          <div style={{ textAlign: "end" }}>{t("run.col.required")}</div>
          <div style={{ textAlign: "end" }}>{t("run.col.onHand")}</div>
          <div style={{ textAlign: "end" }}>{t("run.col.state")}</div>
        </div>
        {rows.map((row) => {
          const component = itemBySku(items, row.sku);
          return (
            <div
              key={row.sku}
              className="kw-grid"
              style={
                {
                  "--cols": "minmax(120px,1.8fr) 84px 84px 68px",
                  background: row.short ? "var(--warn-soft)" : undefined,
                } as React.CSSProperties
              }
            >
              <div style={{ minInlineSize: 0 }}>
                <div className="kw-itemcell__name">{itemName(component)}</div>
                <Mono className="kw-itemcell__meta">
                  {row.sku} · {t("run.perUnit", { qty: qtyNumber(row.per, row.per < 1 ? 3 : 2) })}
                </Mono>
              </div>
              <div className="kw-num kw-num--strong">
                {qtyLabel(row.required, component?.unit ?? "ea")}
              </div>
              <div className="kw-num kw-num--muted">
                {qtyLabel(row.onHand, component?.unit ?? "ea")}
              </div>
              <div style={{ textAlign: "end" }}>
                <Chip tone={row.short ? "warn" : "pos"}>
                  {row.short ? t("run.short") : t("run.ok")}
                </Chip>
              </div>
            </div>
          );
        })}
      </section>

      {/* --- station and sign-off --- */}
      <section className="kw-panel">
        <header className="kw-panel__head">
          <Signature size={15} aria-hidden="true" />
          <h2 className="kw-panel__title">{t("run.signoff")}</h2>
        </header>
        <div className="kw-panel__body">
          <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBlockEnd: 12 }}>
            {station === null ? t("run.noStation") : stationName(station)}
          </div>
          <div className="kw-steps">
            {SIGNOFF_STAGES.map((stage: SignoffStage) => {
              const by = run.signoffs[stage];
              const passed = stageIndex(stage) < idx;
              const color = by ? "var(--pos)" : passed ? "var(--warn)" : "var(--fg-subtle)";
              return (
                <div key={stage} className="kw-steps__row">
                  <span style={{ color, display: "inline-flex" }}>
                    {by ? (
                      <CircleCheck size={15} aria-hidden="true" />
                    ) : passed ? (
                      <CircleAlert size={15} aria-hidden="true" />
                    ) : (
                      <CircleDashed size={15} aria-hidden="true" />
                    )}
                  </span>
                  <span>{stageLabel(stage)}</span>
                  <span className="kw-steps__by" style={{ color }}>
                    {by ?? (passed ? t("run.unsigned") : t("run.notYet"))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- what it has cost --- */}
      <section className="kw-panel">
        <header className="kw-panel__head">
          <Coins size={15} aria-hidden="true" />
          <h2 className="kw-panel__title">{t("run.costTitle")}</h2>
          <Mono className="kw-panel__sub">
            {t("run.made", {}, run.good + run.scrap).replace(
              "{count}",
              qtyNumber(run.good + run.scrap),
            )}
          </Mono>
        </header>
        <div className="kw-panel__body" style={{ paddingBlock: 0 }}>
          <div className="kw-totals" style={{ paddingInline: 0 }}>
            <div className="kw-totals__row">
              <span>{t("run.cost.materials")}</span>
              <Mono>{money(cost.materials)}</Mono>
            </div>
            <div className="kw-totals__row">
              <span>{t("run.cost.labour")}</span>
              <Mono>{money(cost.labour)}</Mono>
            </div>
            <div className="kw-totals__row">
              <span>{t("run.cost.overhead")}</span>
              <Mono>{money(cost.overhead)}</Mono>
            </div>
            <div className="kw-totals__row kw-totals__row--grand">
              <span>{t("run.cost.total")}</span>
              <Mono>{money(cost.total)}</Mono>
            </div>
            <div className="kw-totals__row">
              <span>{t("run.cost.perUnit")}</span>
              <Mono>{cost.perUnit === null ? "—" : money(cost.perUnit)}</Mono>
            </div>
            <div className="kw-totals__row">
              <span>{t("run.cost.soldAt")}</span>
              <Mono>{money(product?.price ?? 0)}</Mono>
            </div>
          </div>

          {entries.length > 0 && (
            <div style={{ paddingBlock: "11px 15px", borderBlockStart: "1px solid var(--border)" }}>
              <div className="kw-supplier__sectitle">{t("run.recorded")}</div>
              {entries.map((m, i) => (
                <div
                  key={`${m.ref}-${i}`}
                  style={{ display: "flex", alignItems: "center", gap: 10, paddingBlock: 5 }}
                >
                  <Mono className="kw-itemcell__sku">{m.lot ?? "—"}</Mono>
                  <Mono className="kw-itemcell__meta">{dateShort(m.date)}</Mono>
                  <Mono
                    style={{ marginInlineStart: "auto", fontWeight: 700, color: "var(--pos)" }}
                  >
                    {signedQty(m.qty)}
                  </Mono>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- record output --- */}
      <section className="kw-panel">
        <header className="kw-panel__head">
          <ClipboardCheck size={15} aria-hidden="true" />
          <h2 className="kw-panel__title">{t("run.record")}</h2>
        </header>
        <div className="kw-panel__body">
          <div className="kw-outform">
            <Field label={t("run.good")}>
              <input
                className="kw-input kw-input--num kw-fld"
                inputMode="numeric"
                value={good}
                onChange={(e) => setOutput({ good: e.target.value.replace(/[^0-9]/g, "") })}
              />
            </Field>
            <Field label={t("run.seconds")}>
              <input
                className="kw-input kw-input--num kw-fld"
                inputMode="numeric"
                value={scrap}
                onChange={(e) => setOutput({ scrap: e.target.value.replace(/[^0-9]/g, "") })}
              />
            </Field>
            <Readout
              label={t("run.yield")}
              color={
                g + s === 0
                  ? "var(--fg-subtle)"
                  : (yieldPct(g, s) ?? 0) >= 95
                    ? "var(--pos)"
                    : "var(--warn)"
              }
            >
              <Mono>{pct(yieldPct(g, s))}</Mono>
            </Readout>
          </div>

          {/*
           * Overproduction is refused in plain language with the size of the
           * problem named, and the button is DISABLED rather than hidden — a
           * reader must be able to see what they cannot do and why.
           */}
          {over > 0 && (
            <div style={{ marginBlockStart: 12 }}>
              <Notice tone="danger" icon={<CircleAlert size={14} aria-hidden="true" />}>
                {t("run.over", { count: qtyNumber(over) })}
              </Notice>
            </div>
          )}

          <div style={{ marginBlockStart: 13 }}>
            <Button block disabled={blocked} onClick={saveOutput}>
              <PackageCheck size={15} aria-hidden="true" />
              {t("run.save")}
            </Button>
          </div>
          <p className="kw-honest" style={{ marginBlockStart: 9 }}>
            {t("run.saveNote")}
          </p>
        </div>
      </section>
    </Drawer>
  );
}

/* ------------------------------------------------------ movement history */

const MOVE_ICON: Record<MovementKind, typeof Truck> = {
  receipt: Truck,
  production: Flame,
  shipment: Send,
  issue: ArrowDownRight,
  adjustment: ClipboardCheck,
};

export function HistoryDrawer() {
  const { t } = useI18n();
  const histSku = useStore((s) => s.histSku);
  const items = useStore((s) => s.items);
  const movements = useStore((s) => s.movements);
  const filter = useStore((s) => s.moveFilter);
  const setMoveFilter = useStore((s) => s.setMoveFilter);
  const openHistory = useStore((s) => s.openHistory);

  if (histSku === null) return null;
  const item = itemBySku(items, histSku);
  if (item === null) return null;

  const all = movements.filter((m) => m.sku === histSku);
  const { rows, opening } = historyFor(movements, item, filter);
  const kinds = movementKinds(movements, histSku);
  const avail = available(item);

  return (
    <Drawer
      onClose={() => openHistory(null)}
      label={t("history.title")}
      head={
        <div style={{ minInlineSize: 0 }}>
          <Mono className="kw-itemcell__sku">{item.sku}</Mono>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.2px" }}>{itemName(item)}</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-subtle)", marginBlockStart: 3 }}>
            {t("history.title")} · {t("history.balanceIn", { unit: unitLabel(item.unit) })}
          </div>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        <div className="kw-kpi">
          <div className="kw-kpi__label">{t("history.onHand")}</div>
          <div className="kw-kpi__value" style={{ fontSize: 18 }}>
            {qtyNumber(item.onHand)}
          </div>
        </div>
        <div className="kw-kpi">
          <div className="kw-kpi__label">{t("history.allocated")}</div>
          <div className="kw-kpi__value" style={{ fontSize: 18, color: "var(--fg-muted)" }}>
            {qtyNumber(item.allocated)}
          </div>
        </div>
        <div className="kw-kpi">
          <div className="kw-kpi__label">{t("history.available")}</div>
          <div
            className="kw-kpi__value"
            style={{
              fontSize: 18,
              color: avail <= 0 ? "var(--danger)" : avail <= item.reorder ? "var(--warn)" : undefined,
            }}
          >
            {qtyNumber(avail)}
          </div>
        </div>
      </div>

      <section className="kw-panel">
        <header className="kw-panel__head">
          <Mono className="kw-panel__sub">
            {t("history.shown", { shown: String(rows.length), total: String(all.length) })}
          </Mono>
          <div className="kw-filters" style={{ marginInlineStart: "auto" }}>
            <Filter pressed={filter === "all"} onClick={() => setMoveFilter("all")}>
              {t("history.filter.all")}
            </Filter>
            {kinds.map((k) => (
              <Filter key={k} pressed={filter === k} onClick={() => setMoveFilter(k)}>
                {movementLabel(k)}
              </Filter>
            ))}
          </div>
        </header>

        {all.length === 0 && (
          <p className="kw-empty__body" style={{ padding: 20 }}>
            {t("history.empty")}
          </p>
        )}

        {/* Newest first — the direction people read a statement. */}
        {[...rows].reverse().map((row: Movement & { balance: number }, i) => {
          const Cmp = MOVE_ICON[row.kind];
          const positive = row.qty > 0;
          return (
            <div key={`${row.ref}-${row.kind}-${i}`} className="kw-ledger">
              <span className={`kw-ledger__dot${positive ? " kw-ledger__dot--pos" : ""}`}>
                <span>
                  <Cmp size={12} aria-hidden="true" />
                </span>
              </span>
              <div style={{ minInlineSize: 0 }}>
                <div className="kw-ledger__label">
                  {movementLabel(row.kind)}
                  {row.lot !== undefined && ` · ${row.lot}`}
                </div>
                <Mono className="kw-ledger__meta">
                  {row.ref} · {dateShort(row.date)}
                </Mono>
              </div>
              <div
                className="kw-num kw-num--strong"
                style={{ color: positive ? "var(--pos)" : undefined }}
              >
                {signedQty(row.qty)}
              </div>
              <div className="kw-num kw-num--muted">{qtyNumber(row.balance)}</div>
            </div>
          );
        })}

        {/*
         * The opening row is the balance the VISIBLE rows start from, so the
         * column keeps adding up the moment somebody clicks a filter chip.
         */}
        {all.length > 0 && (
          <div className="kw-ledger kw-ledger--opening">
            <div />
            <div>
              <div className="kw-ledger__label" style={{ color: "var(--fg-muted)" }}>
                {t("history.opening")}
              </div>
              <div className="kw-itemcell__meta">
                {filter === "all"
                  ? t("history.openingNote.all")
                  : t("history.openingNote.kind", { kind: movementLabel(filter).toLowerCase() })}
              </div>
            </div>
            <div />
            <div className="kw-num kw-num--muted">{qtyNumber(opening)}</div>
          </div>
        )}
      </section>
    </Drawer>
  );
}

/* --------------------------------------------------------- receive sheet */

export function ReceiveSheet() {
  const { t } = useI18n();
  const poCode = useStore((s) => s.poCode);
  const pos = useStore((s) => s.pos);
  const items = useStore((s) => s.items);
  const draft = useStore((s) => s.receiveDraft);
  const setReceive = useStore((s) => s.setReceive);
  const confirmReceive = useStore((s) => s.confirmReceive);
  const openReceive = useStore((s) => s.openReceive);

  if (poCode === null) return null;
  const po = pos.find((p) => p.code === poCode);
  if (po === undefined) return null;
  const supplier = supplierById(po.supplier);

  return (
    <Drawer
      narrow
      onClose={() => openReceive(null)}
      label={po.code}
      head={
        <div>
          <Mono className="kw-drawer__title">{po.code}</Mono>
          <div style={{ fontSize: 13, fontWeight: 600, marginBlockStart: 2 }}>{supplier?.name}</div>
          <div style={{ fontSize: 12, color: "var(--fg-subtle)", marginBlockStart: 2 }}>
            {t("receive.head", { date: dateShort(po.due) })}
          </div>
        </div>
      }
    >
      <section className="kw-panel">
        {po.lines.map((line) => {
          const item = itemBySku(items, line.sku);
          const open = round2(line.qty - line.received);
          const value = draft[line.sku] ?? "";
          return (
            <div key={line.sku} style={{ padding: "13px 15px", borderBlockEnd: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ minInlineSize: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{itemName(item)}</div>
                  <Mono className="kw-itemcell__meta">
                    {t("receive.ordered", {
                      sku: line.sku,
                      ordered: qtyNumber(line.qty),
                      already: qtyNumber(line.received),
                    })}
                  </Mono>
                </div>
                {open <= 0 && <Chip tone="pos">{t("receive.closed")}</Chip>}
              </div>

              {open > 0 && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginBlockStart: 10 }}>
                  <Field label={t("receive.receiving")}>
                    <input
                      className="kw-input kw-input--num kw-fld"
                      inputMode="decimal"
                      placeholder="0"
                      value={value}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                        /* Cap at what is still open — a receipt cannot exceed
                         * what was ordered, and silently accepting more would
                         * make the outstanding column meaningless. */
                        const capped =
                          raw === ""
                            ? ""
                            : String(Math.min(Number.parseFloat(raw) || 0, open));
                        setReceive(line.sku, capped);
                      }}
                    />
                  </Field>
                  <Button
                    tone="ghost"
                    onClick={() => setReceive(line.sku, String(open))}
                    className="kw-mono"
                  >
                    {t("receive.all", { qty: qtyLabel(open, item?.unit ?? "ea") })}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <Button block onClick={confirmReceive}>
        <PackageCheck size={15} aria-hidden="true" />
        {t("receive.confirm")}
      </Button>
      <p className="kw-honest" style={{ marginBlockStart: 0 }}>
        {t("receive.note")}
      </p>
    </Drawer>
  );
}

/* -------------------------------------------------------- invoice drawer */

export function InvoiceDrawer() {
  const { t } = useI18n();
  const invNumber = useStore((s) => s.invNumber);
  const invoices = useStore((s) => s.invoices);
  const sos = useStore((s) => s.sos);
  const items = useStore((s) => s.items);
  const now = useStore((s) => s.now);
  const payOpen = useStore((s) => s.payOpen);
  const payAmount = useStore((s) => s.payAmount);
  const payMethod = useStore((s) => s.payMethod);
  const setPayOpen = useStore((s) => s.setPayOpen);
  const setPayAmount = useStore((s) => s.setPayAmount);
  const setPayMethod = useStore((s) => s.setPayMethod);
  const recordPayment = useStore((s) => s.recordPayment);
  const openInvoice = useStore((s) => s.openInvoice);

  if (invNumber === null) return null;
  const invoice = invoices.find((i) => i.number === invNumber);
  if (invoice === undefined) return null;

  const order = sos.find((o) => o.code === invoice.order) ?? null;
  const totals = invoiceTotals(order, TAX);
  const outstanding = outstandingOf(invoice, totals.total);
  const status = invoiceStatus(invoice, totals.total, now.date);
  const late = daysPast(now.date, invoice.due);
  const ledger = paymentLedger(invoice, totals.total);
  const customer = customerById(invoice.customer);

  /* What this customer owes across every open invoice, not just this one. */
  const custRows = invoices
    .filter((i) => i.customer === invoice.customer)
    .map((i) => {
      const o = sos.find((x) => x.code === i.order) ?? null;
      const tt = invoiceTotals(o, TAX);
      return outstandingOf(i, tt.total);
    });
  const custOutstanding = round2(custRows.reduce((sum, v) => sum + v, 0));
  const custOpen = custRows.filter((v) => v > 0.005).length;

  const want = round2(Number.parseFloat(payAmount || "0") || 0);
  const check = checkPayment(want, outstanding);

  const tone =
    status === "paid" ? "pos" : status === "overdue" ? "danger" : status === "part_paid" ? "warn" : "info";

  return (
    <Drawer
      onClose={() => openInvoice(null)}
      label={invoice.number}
      head={
        <div style={{ minInlineSize: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <Mono className="kw-drawer__title">{invoice.number}</Mono>
            <Chip tone={tone}>{invoiceStatusLabel(status)}</Chip>
            {late > 0 && status !== "paid" && (
              <Chip tone="danger">
                <Mono>{t("chrome.daysOver", {}, late).replace("{count}", String(late))}</Mono>
              </Chip>
            )}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBlockStart: 3 }}>{customer?.name}</div>
          <Mono className="kw-drawer__meta">
            {t("invoice.issuedDue", {
              issued: dateShort(invoice.issued),
              due: dateShort(invoice.due),
              order: invoice.order,
            })}
          </Mono>
          <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBlockStart: 4 }}>
            {t("invoice.owes", {
              amount: money(custOutstanding),
              count: t("invoice.openCount", { count: String(custOpen) }),
            })}
          </div>
        </div>
      }
    >
      {/* --- the lines, subtotal, tax, total --- */}
      <section className="kw-panel">
        <div
          className="kw-grid kw-grid--head"
          style={{ "--cols": "minmax(130px,2fr) 56px 82px 88px" } as React.CSSProperties}
        >
          <div>{t("invoice.col.line")}</div>
          <div style={{ textAlign: "end" }}>{t("invoice.col.qty")}</div>
          <div style={{ textAlign: "end" }}>{t("invoice.col.unit")}</div>
          <div style={{ textAlign: "end" }}>{t("invoice.col.total")}</div>
        </div>
        {(order?.lines ?? []).map((line) => {
          const item = itemBySku(items, line.sku);
          return (
            <div
              key={line.sku}
              className="kw-grid"
              style={{ "--cols": "minmax(130px,2fr) 56px 82px 88px" } as React.CSSProperties}
            >
              <div style={{ minInlineSize: 0 }}>
                <div className="kw-itemcell__name">{itemName(item)}</div>
                <Mono className="kw-itemcell__meta">{line.sku}</Mono>
              </div>
              <div className="kw-num">{qtyNumber(line.qty)}</div>
              <div className="kw-num kw-num--muted">{money(line.price)}</div>
              <div className="kw-num kw-num--strong">{money(round2(line.qty * line.price))}</div>
            </div>
          );
        })}
        <div className="kw-totals">
          <div className="kw-totals__row">
            <span>{t("invoice.subtotal")}</span>
            <Mono>{money(totals.subtotal)}</Mono>
          </div>
          <div className="kw-totals__row">
            <span>{t("invoice.tax", { pct: `${Math.round(TAX * 100)}%` })}</span>
            <Mono>{money(totals.tax)}</Mono>
          </div>
          <div className="kw-totals__row kw-totals__row--grand">
            <span>{t("invoice.total")}</span>
            <Mono>{money(totals.total)}</Mono>
          </div>
        </div>
      </section>

      {/* --- the payments ledger, with a running balance down the right --- */}
      <section className="kw-panel">
        <header className="kw-panel__head">
          <NotebookIcon />
          <h2 className="kw-panel__title">{t("invoice.payments")}</h2>
          <Mono className="kw-panel__sub">
            {t("invoice.outstanding", { amount: money(outstanding) })}
          </Mono>
        </header>

        {ledger.map((row, i) => (
          <div key={i} className="kw-ledger" style={{ gridTemplateColumns: "22px minmax(110px,1.6fr) 96px 96px" }}>
            <span
              style={{
                display: "inline-flex",
                color: row.kind === "payment" ? "var(--pos)" : "var(--fg)",
              }}
            >
              {row.kind === "payment" ? (
                <Banknote size={15} aria-hidden="true" />
              ) : (
                <FileText size={15} aria-hidden="true" />
              )}
            </span>
            <div style={{ minInlineSize: 0 }}>
              <div className="kw-ledger__label">
                {row.kind === "payment" ? methodLabel(row.method as PayMethod) : t("invoice.totalRow")}
              </div>
              <Mono className="kw-ledger__meta">
                {row.kind === "payment"
                  ? dateShort(row.date)
                  : t("invoice.raised", { date: dateShort(row.date) })}
              </Mono>
            </div>
            <div
              className="kw-num kw-num--strong"
              style={{ color: row.kind === "payment" ? "var(--pos)" : undefined }}
            >
              {signedMoney(row.amount)}
            </div>
            <div className="kw-num kw-num--muted">{money(row.balance)}</div>
          </div>
        ))}

        <div className="kw-panel__body">
          {outstanding <= 0.005 && (
            <Notice tone="pos" icon={<CircleCheck size={15} aria-hidden="true" />}>
              {t("invoice.settledFull")}
            </Notice>
          )}

          {payOpen && (
            <div
              style={{
                padding: 13,
                border: "1px solid var(--border-strong)",
                borderRadius: 11,
                background: "var(--surface-2)",
                animation: "kw-pop .14s ease-out",
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Field label={t("invoice.amount")}>
                  <input
                    className="kw-input kw-input--num kw-fld"
                    inputMode="decimal"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  />
                </Field>
                <Field label={t("invoice.method")}>
                  <select
                    className="kw-select kw-fld"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PayMethod)}
                  >
                    <option value="transfer">{methodLabel("transfer")}</option>
                    <option value="card">{methodLabel("card")}</option>
                    <option value="cheque">{methodLabel("cheque")}</option>
                  </select>
                </Field>
              </div>

              {/* Partials are welcome; overpayment is refused with the excess named. */}
              {check.over > 0 && (
                <div style={{ marginBlockStart: 10 }}>
                  <Notice tone="danger">
                    {t("invoice.over", {
                      over: money(check.over),
                      outstanding: money(outstanding),
                    })}
                  </Notice>
                </div>
              )}

              <div style={{ display: "flex", gap: 9, marginBlockStart: 11 }}>
                <Button
                  disabled={!check.ok}
                  onClick={recordPayment}
                  className="kw-button--block"
                >
                  {t("invoice.recordBtn")}
                </Button>
                <Button tone="ghost" onClick={() => setPayOpen(false)}>
                  {t("chrome.cancel")}
                </Button>
              </div>
            </div>
          )}

          {!payOpen && outstanding > 0.005 && (
            <Button
              tone="soft"
              block
              onClick={() => {
                setPayAmount(outstanding.toFixed(2));
                setPayOpen(true);
              }}
            >
              <Banknote size={15} aria-hidden="true" />
              {t("invoice.record")}
            </Button>
          )}
        </div>
      </section>

      {/* Aging context for the reader who arrived from the buckets. */}
      <p className="kw-honest" style={{ marginBlockStart: 0 }}>
        {bucketLabel(bucketOf(status, late) ?? "current")}
      </p>
    </Drawer>
  );
}

/** Lucide's notebook glyph, wrapped so the import list above stays tidy. */
function NotebookIcon() {
  return <FileText size={15} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ toasts */

export function ToastLayer() {
  const toasts = useStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="kw-toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="kw-toast">
          {toast.text}
        </div>
      ))}
    </div>
  );
}
