/**
 * The Office's nine views: stock, counts, purchasing, suppliers, the order
 * book, dispatch, invoices, recipes and the money.
 *
 * Two things here are load-bearing and worth reading before changing anything.
 *
 * STOCK exists to make one subtraction obvious. Available is on hand minus
 * allocated, that is the number people misread, and the table says so in its
 * own subtitle, rules the available column above its total, and colours it
 * amber at the reorder point and red at zero.
 *
 * THE BOOKS is a VIEW, not an accounting product (21 D15). It rolls up revenue,
 * cost of goods from the run costings, margin, receivables and payables from
 * data the app already holds, and it carries one honest line saying exactly
 * that. No double entry, no journals, no period close — and nothing added here
 * later should change that.
 */

import {
  Banknote,
  ClipboardCheck,
  FilePlus,
  PackageOpen,
  Receipt,
  ArrowRight,
  Check,
  Search,
  Send,
} from "lucide-react";

import { AddOnSlot } from "../add-ons/AddOnSlot.tsx";
import { outboundOrder, shopClock } from "../add-ons/hostRecords.ts";
import type { Invoice, PostalAddress, SalesOrder } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import {
  bucketLabel,
  dateShort,
  invoiceStatusLabel,
  itemName,
  money,
  movementLabel,
  pct,
  poStatusLabel,
  qty as qtyLabel,
  qtyNumber,
  soStatusLabel,
  unitLabel,
  label as tLabel,
} from "../lib/format.ts";
import {
  BUCKETS,
  agingBuckets,
  allocationOf,
  bucketOf,
  books as rollUp,
  daysPast,
  invoiceStatus,
  invoiceTotals,
  nextSoStatus,
  orderAllocatedUnits,
  orderFillPct,
  orderMargin,
  orderSubtotal,
  orderUnits,
  outstandingOf,
  paidOf,
  poOpenLines,
  poOutstandingValue,
  poReceivedValue,
  poValue,
} from "../lib/ledger.ts";
import {
  available,
  belowReorder,
  itemBySku,
  lastMovement,
  marginOf,
  onOrder,
  reorderBarPct,
  round2,
  stockTone,
  supplierIdFor,
  unitCost,
  varianceOf,
} from "../lib/production.ts";
import {
  ALL_SUPPLIERS,
  TAX,
  WORKS,
  customerById,
  supplierById,
  useStore,
} from "../state/store.ts";
import {
  Bar,
  Button,
  Chip,
  Empty,
  Field,
  Filter,
  Icon,
  ItemCell,
  Kpi,
  Mono,
  Notice,
  Panel,
  Tile,
} from "../components/Primitives.tsx";

/* ================================================================= stock */

const STOCK_COLS = "minmax(200px,2.2fr) 64px repeat(3,74px) 88px minmax(120px,1fr)";

export function Stock() {
  const { t } = useI18n();
  const items = useStore((s) => s.items);
  const pos = useStore((s) => s.pos);
  const movements = useStore((s) => s.movements);
  const query = useStore((s) => s.stockQuery);
  const filter = useStore((s) => s.stockFilter);
  const setStockQuery = useStore((s) => s.setStockQuery);
  const setStockFilter = useStore((s) => s.setStockFilter);
  const openHistory = useStore((s) => s.openHistory);

  const below = items.filter(belowReorder);
  const products = items.filter((i) => i.kind === "product");

  const q = query.trim().toLowerCase();
  let rows = filter === "below" ? below : filter === "products" ? products : items;
  if (q !== "") {
    rows = rows.filter(
      (i) => i.sku.toLowerCase().includes(q) || itemName(i).toLowerCase().includes(q),
    );
  }

  return (
    <section className="kw-view kw-screen" style={{ maxInlineSize: 1280 }}>
      <h1 className="kw-h1">{t("stock.title")}</h1>
      <p className="kw-sub">{t("stock.sub")}</p>

      <div className="kw-stock__tools">
        <div className="kw-stock__search">
          <Search size={15} aria-hidden="true" />
          <input
            className="kw-input kw-fld"
            type="search"
            value={query}
            placeholder={t("stock.search")}
            aria-label={t("stock.search")}
            onChange={(e) => setStockQuery(e.target.value)}
          />
        </div>
        <Filter pressed={filter === "all"} count={items.length} onClick={() => setStockFilter("all")}>
          {t("stock.filter.all")}
        </Filter>
        <Filter pressed={filter === "below"} count={below.length} onClick={() => setStockFilter("below")}>
          {t("stock.filter.below")}
        </Filter>
        <Filter
          pressed={filter === "products"}
          count={products.length}
          onClick={() => setStockFilter("products")}
        >
          {t("stock.filter.products")}
        </Filter>
      </div>

      <div className="kw-panel kw-scrollx" style={{ overflow: "hidden" }}>
        <div
          className="kw-grid kw-grid--head kw-grid--collapse"
          style={{ "--cols": STOCK_COLS } as React.CSSProperties}
        >
          <div>{t("stock.col.item")}</div>
          <div>{t("stock.col.unit")}</div>
          <div style={{ textAlign: "end" }}>{t("stock.col.onHand")}</div>
          <div style={{ textAlign: "end" }}>{t("stock.col.allocated")}</div>
          <div style={{ textAlign: "end" }}>{t("stock.col.available")}</div>
          <div style={{ textAlign: "end" }}>{t("stock.col.cost")}</div>
          <div>{t("stock.col.reorder")}</div>
        </div>

        {rows.length === 0 && <Empty title={t("stock.empty")} />}

        {rows.map((item) => {
          const avail = available(item);
          const tone = stockTone(item);
          const coming = item.kind === "component" ? onOrder(pos, item.sku) : 0;
          const last = lastMovement(movements, item.sku);
          const supplierId = supplierIdFor(ALL_SUPPLIERS, item.sku);
          const supplier = supplierId === null ? null : supplierById(supplierId);

          return (
            <button
              key={item.sku}
              type="button"
              className="kw-grid kw-grid--row kw-grid--collapse"
              style={{ "--cols": STOCK_COLS } as React.CSSProperties}
              onClick={() => openHistory(item.sku)}
              aria-label={t("stock.openHistory")}
            >
              <div className="kw-span">
                <ItemCell
                  item={item}
                  meta={
                    <>
                      {item.kind === "component" ? (supplier?.name ?? "") : t("stock.madeHere")}
                      {" · "}
                      {last === null
                        ? t("stock.noMoves")
                        : t("stock.lastMove", {
                            kind: movementLabel(last.kind).toLowerCase(),
                            date: dateShort(last.date),
                          })}
                    </>
                  }
                />
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{unitLabel(item.unit)}</div>
              <div className="kw-num">
                {qtyNumber(item.onHand)}
                {coming > 0 && (
                  <div className="kw-stock__oncoming">
                    {t("stock.onOrder", { qty: qtyNumber(coming) })}
                  </div>
                )}
              </div>
              <div className="kw-num kw-num--muted">−{qtyNumber(item.allocated)}</div>
              <div
                className="kw-num kw-num--strong kw-num--sum"
                style={{
                  color:
                    tone === "danger" ? "var(--danger)" : tone === "warn" ? "var(--warn)" : undefined,
                }}
              >
                {qtyNumber(avail)}
              </div>
              <div className="kw-num">{money(item.cost)}</div>
              <div className="kw-span">
                <Bar
                  pct={reorderBarPct(item)}
                  tone={tone === "ok" ? "pos" : tone}
                  label={{
                    text:
                      tone === "danger"
                        ? t("stock.bar.none")
                        : tone === "warn"
                          ? t("stock.bar.at", { qty: qtyNumber(item.reorder) })
                          : t("stock.bar.point", { qty: qtyNumber(item.reorder) }),
                    color:
                      tone === "danger"
                        ? "var(--danger)"
                        : tone === "warn"
                          ? "var(--warn)"
                          : "var(--pos)",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ================================================================ counts */

const COUNT_COLS = "minmax(160px,2fr) 90px 110px 110px";

export function Counts() {
  const { t } = useI18n();
  const counts = useStore((s) => s.counts);
  const items = useStore((s) => s.items);
  const draft = useStore((s) => s.countDraft);
  const setCount = useStore((s) => s.setCount);
  const postCount = useStore((s) => s.postCount);

  return (
    <section className="kw-view kw-view--mid kw-screen">
      <h1 className="kw-h1">{t("counts.title")}</h1>
      <p className="kw-sub">{t("counts.sub")}</p>

      <div className="kw-stack">
        {counts.map((sheet) => {
          const lines = sheet.lines.map((line, i) => {
            const item = itemBySku(items, line.sku);
            const key = `${sheet.code}:${i}`;
            const raw = draft[key];
            const counted =
              raw !== undefined && raw !== "" ? Number.parseFloat(raw) : line.counted;
            const walked = counted !== null && counted !== undefined && !Number.isNaN(counted);
            return { line, item, key, raw, counted, walked, variance: item ? varianceOf(item, counted ?? null) : null };
          });
          const walkedCount = lines.filter((l) => l.walked).length;

          return (
            <div key={sheet.code} className="kw-order kw-scrollx">
              <div className="kw-count__head">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Mono className="kw-count__code">{sheet.code}</Mono>
                    <Chip tone={sheet.status === "open" ? "warn" : "pos"}>
                      {t(sheet.status === "open" ? "chrome.count.open" : "chrome.count.posted")}
                    </Chip>
                  </div>
                  <div className="kw-order__who">{tLabel(sheet.zoneKey, sheet.zone)}</div>
                  <div className="kw-order__where">
                    {t("counts.opened", { date: dateShort(sheet.opened), name: sheet.by })} ·{" "}
                    {t("counts.progress", {
                      walked: String(walkedCount),
                      total: String(lines.length),
                    })}
                  </div>
                </div>
                {sheet.status === "open" && walkedCount > 0 && (
                  <span style={{ marginInlineStart: "auto" }}>
                    <Button onClick={() => postCount(sheet.code)}>
                      <ClipboardCheck size={14} aria-hidden="true" />
                      {t("counts.post")}
                    </Button>
                  </span>
                )}
              </div>

              <div
                className="kw-grid kw-grid--head kw-minw"
                style={{ "--cols": COUNT_COLS } as React.CSSProperties}
              >
                <div>{t("counts.col.item")}</div>
                <div style={{ textAlign: "end" }}>{t("counts.col.onRecord")}</div>
                <div style={{ textAlign: "end" }}>{t("counts.col.counted")}</div>
                <div style={{ textAlign: "end" }}>{t("counts.col.variance")}</div>
              </div>

              {lines.map((l) => (
                <div
                  key={l.key}
                  className="kw-grid kw-minw"
                  style={{ "--cols": COUNT_COLS } as React.CSSProperties}
                >
                  <div style={{ minInlineSize: 0 }}>
                    <div className="kw-itemcell__name">{itemName(l.item)}</div>
                    <Mono className="kw-itemcell__meta">
                      {l.line.sku} · {unitLabel(l.item?.unit ?? "ea")}
                    </Mono>
                  </div>
                  <div className="kw-num kw-num--muted">{qtyNumber(l.item?.onHand ?? 0)}</div>
                  <div>
                    {sheet.status === "open" ? (
                      <input
                        className="kw-input kw-input--num kw-fld"
                        inputMode="decimal"
                        placeholder="—"
                        value={l.raw ?? (l.line.counted === null ? "" : String(l.line.counted))}
                        onChange={(e) => setCount(l.key, e.target.value.replace(/[^0-9.]/g, ""))}
                      />
                    ) : (
                      <div className="kw-num kw-num--strong">
                        {l.walked ? qtyNumber(l.counted as number) : "—"}
                      </div>
                    )}
                  </div>
                  <div
                    className="kw-num kw-num--strong"
                    style={{
                      color:
                        l.variance === null
                          ? "var(--fg-subtle)"
                          : l.variance === 0
                            ? "var(--pos)"
                            : l.variance < 0
                              ? "var(--danger)"
                              : "var(--warn)",
                    }}
                  >
                    {l.variance === null
                      ? t("counts.notWalked")
                      : `${l.variance > 0 ? "+" : ""}${qtyNumber(l.variance)}`}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================ purchasing */

const PO_COLS = "minmax(140px,2fr) 86px 86px 78px minmax(110px,1fr)";

export function Purchasing() {
  const { t } = useI18n();
  const pos = useStore((s) => s.pos);
  const items = useStore((s) => s.items);
  const now = useStore((s) => s.now);
  const openReceive = useStore((s) => s.openReceive);

  return (
    <section className="kw-view kw-screen">
      <h1 className="kw-h1">{t("purchasing.title")}</h1>
      <p className="kw-sub">{t("purchasing.sub")}</p>

      <div className="kw-stack">
        {pos.map((po) => {
          const supplier = supplierById(po.supplier);
          const late = daysPast(now.date, po.due);
          const open = poOpenLines(po);
          const tone =
            po.status === "received"
              ? "pos"
              : po.status === "part_received"
                ? "warn"
                : po.status === "sent"
                  ? "info"
                  : undefined;

          return (
            <div key={po.code} className="kw-order kw-card kw-scrollx">
              <div className="kw-order__head">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <Mono className="kw-order__code">{po.code}</Mono>
                    <Chip tone={tone}>{poStatusLabel(po.status)}</Chip>
                    {late > 0 && po.status !== "received" && (
                      <Chip tone="danger">
                        <Mono>
                          {t("purchasing.late", {}, late).replace("{count}", String(late))}
                        </Mono>
                      </Chip>
                    )}
                  </div>
                  <div className="kw-order__who">{supplier?.name}</div>
                </div>

                <div className="kw-order__facts">
                  <div>
                    <div className="kw-order__fact">{t("purchasing.raised")}</div>
                    <div className="kw-order__factval">{dateShort(po.raised)}</div>
                  </div>
                  <div>
                    <div className="kw-order__fact">{t("purchasing.due")}</div>
                    <div className="kw-order__factval">{dateShort(po.due)}</div>
                  </div>
                  <div>
                    <div className="kw-order__fact">{t("purchasing.value")}</div>
                    <div className="kw-order__factval kw-order__factval--strong">
                      {money(poValue(po))}
                    </div>
                  </div>
                  {po.status !== "received" && po.status !== "draft" && (
                    <Button onClick={() => openReceive(po.code)}>
                      <PackageOpen size={14} aria-hidden="true" />
                      {t("purchasing.receive")}
                    </Button>
                  )}
                </div>
              </div>

              <div className="kw-order__lines">
                {po.lines.map((line) => {
                  const item = itemBySku(items, line.sku);
                  const openQty = round2(line.qty - line.received);
                  return (
                    <div
                      key={line.sku}
                      className="kw-grid kw-grid--collapse"
                      style={{ "--cols": PO_COLS } as React.CSSProperties}
                    >
                      <div className="kw-span" style={{ minInlineSize: 0 }}>
                        <div className="kw-itemcell__name">{itemName(item)}</div>
                        <Mono className="kw-itemcell__meta">{line.sku}</Mono>
                      </div>
                      <div className="kw-num">{qtyLabel(line.qty, item?.unit ?? "ea")}</div>
                      <div className="kw-num kw-num--muted">{qtyNumber(line.received)}</div>
                      <div className="kw-num kw-num--muted">{money(line.cost)}</div>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          textAlign: "end",
                          color: openQty > 0 ? "var(--warn)" : "var(--pos)",
                        }}
                      >
                        {openQty > 0
                          ? t("purchasing.lineOpen", {
                              qty: qtyLabel(openQty, item?.unit ?? "ea"),
                            })
                          : t("purchasing.lineClosed")}
                      </div>
                    </div>
                  );
                })}

                <div className="kw-order__foot">
                  <span>
                    {t("purchasing.lines", {}, po.lines.length).replace(
                      "{count}",
                      String(po.lines.length),
                    )}
                  </span>
                  <span style={{ color: open > 0 ? "var(--warn)" : "var(--fg-subtle)", fontWeight: 600 }}>
                    {open > 0
                      ? t("purchasing.openLines", { count: String(open) })
                      : t("purchasing.allClosed")}
                  </span>
                  <Mono>
                    {t("purchasing.valueLine", {
                      in: money(poReceivedValue(po)),
                      out: money(poOutstandingValue(po)),
                    })}
                  </Mono>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================= suppliers */

export function Suppliers() {
  const { t } = useI18n();
  const pos = useStore((s) => s.pos);
  const items = useStore((s) => s.items);
  const raisePO = useStore((s) => s.raisePO);

  return (
    <section className="kw-view kw-screen">
      <h1 className="kw-h1">{t("suppliers.title")}</h1>
      <p className="kw-sub">{t("suppliers.sub")}</p>

      <div className="kw-cards kw-cards--wide">
        {ALL_SUPPLIERS.map((supplier) => {
          const mine = pos.filter((p) => p.supplier === supplier.id);
          const open = mine.filter((p) => p.status !== "received");
          const spend = round2(mine.reduce((sum, p) => sum + poReceivedValue(p), 0));

          /* Below its point AND nothing already coming — the only case where
           * drafting another order is the right suggestion. */
          const low = supplier.supplies.filter((sku) => {
            const item = itemBySku(items, sku);
            return item !== null && belowReorder(item) && onOrder(pos, sku) <= 0;
          });

          return (
            <div key={supplier.id} className="kw-panel kw-card" style={{ padding: 15 }}>
              <div className="kw-supplier__name">{supplier.name}</div>
              <div className="kw-supplier__contact">{supplier.contact}</div>

              <div className="kw-supplier__facts">
                <div>
                  <div className="kw-order__fact">{t("suppliers.lead")}</div>
                  <Mono className="kw-order__factval">
                    {t("suppliers.leadDays", {}, supplier.lead).replace(
                      "{count}",
                      String(supplier.lead),
                    )}
                  </Mono>
                </div>
                <div>
                  <div className="kw-order__fact">{t("suppliers.onTime")}</div>
                  <Mono
                    className="kw-order__factval kw-order__factval--strong"
                    style={{
                      color:
                        supplier.onTime >= 0.95
                          ? "var(--pos)"
                          : supplier.onTime >= 0.85
                            ? "var(--warn)"
                            : "var(--danger)",
                    }}
                  >
                    {Math.round(supplier.onTime * 100)}%
                  </Mono>
                </div>
                <div>
                  <div className="kw-order__fact">{t("suppliers.lastIn")}</div>
                  <Mono className="kw-order__factval">{dateShort(supplier.last)}</Mono>
                </div>
                <div style={{ marginInlineStart: "auto", textAlign: "end" }}>
                  <div className="kw-order__fact">{t("suppliers.received")}</div>
                  <Mono className="kw-order__factval kw-order__factval--strong">{money(spend)}</Mono>
                </div>
              </div>

              {low.length > 0 && (
                <div className="kw-supplier__low">
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    {t("suppliers.low", {}, low.length).replace("{count}", String(low.length))}
                  </div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.4, marginBlockStart: 2 }}>
                    {low.map((sku) => itemName(itemBySku(items, sku))).filter(Boolean).join(", ")}
                  </div>
                  <div style={{ marginBlockStart: 9 }}>
                    <Button tone="warn" size="sm" onClick={() => raisePO(supplier.id, low)}>
                      <FilePlus size={13} aria-hidden="true" />
                      {t("suppliers.draft")}
                    </Button>
                  </div>
                </div>
              )}

              <div className="kw-supplier__section">
                <div className="kw-supplier__sectitle">{t("suppliers.priceList")}</div>
                {supplier.supplies.map((sku) => {
                  const item = itemBySku(items, sku);
                  if (item === null) return null;
                  const avail = available(item);
                  const tone = stockTone(item);
                  return (
                    <div key={sku} className="kw-supplier__rate">
                      <div style={{ minInlineSize: 0, flex: 1 }}>
                        <div className="kw-itemcell__name">{itemName(item)}</div>
                        <Mono className="kw-itemcell__meta">{sku}</Mono>
                      </div>
                      <Mono
                        style={{
                          fontSize: 11.5,
                          color:
                            tone === "danger"
                              ? "var(--danger)"
                              : tone === "warn"
                                ? "var(--warn)"
                                : "var(--fg-muted)",
                        }}
                      >
                        {qtyLabel(avail, item.unit)}
                      </Mono>
                      <Mono style={{ fontSize: 12.5, fontWeight: 700, minInlineSize: 60, textAlign: "end" }}>
                        {money(item.cost)}
                      </Mono>
                    </div>
                  );
                })}
              </div>

              <div className="kw-supplier__section">
                <div className="kw-supplier__sectitle">
                  {t("suppliers.pos")} ·{" "}
                  {open.length > 0
                    ? t("suppliers.open", { count: String(open.length) })
                    : t("suppliers.nothingOpen")}
                </div>
                {open.map((po) => (
                  <div key={po.code} style={{ display: "flex", alignItems: "center", gap: 9, paddingBlock: 5 }}>
                    <Mono style={{ fontSize: 11.5, fontWeight: 600 }}>{po.code}</Mono>
                    <Chip
                      tone={po.status === "part_received" ? "warn" : po.status === "sent" ? "info" : undefined}
                    >
                      {poStatusLabel(po.status)}
                    </Chip>
                    <Mono style={{ marginInlineStart: "auto", fontSize: 11.5, color: "var(--fg-muted)" }}>
                      {dateShort(po.due)}
                    </Mono>
                    <Mono style={{ fontSize: 12, fontWeight: 700 }}>
                      {money(poOutstandingValue(po))}
                    </Mono>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ================================================================ orders */

const SO_COLS = "minmax(160px,2fr) 58px 78px 88px minmax(130px,auto)";

export function Orders() {
  const { t } = useI18n();
  const sos = useStore((s) => s.sos);
  const items = useStore((s) => s.items);
  const now = useStore((s) => s.now);
  const advanceOrder = useStore((s) => s.advanceOrder);
  const makeIt = useStore((s) => s.makeIt);

  const toneFor = (o: SalesOrder) =>
    o.status === "invoiced"
      ? "accent"
      : o.status === "shipped"
        ? "pos"
        : o.status === "picking"
          ? "warn"
          : o.status === "confirmed"
            ? "info"
            : undefined;

  return (
    <section className="kw-view kw-screen">
      <h1 className="kw-h1">{t("orders.title")}</h1>
      <p className="kw-sub">{t("orders.sub")}</p>

      <div className="kw-stack">
        {sos.map((order) => {
          const customer = customerById(order.customer);
          const daysLeft = -daysPast(now.date, order.requiredBy);
          const soon = daysLeft >= 0 && daysLeft <= 4;
          const next = nextSoStatus(order.status);

          return (
            <div key={order.code} className="kw-order kw-card kw-scrollx">
              <div className="kw-order__head">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Mono className="kw-order__code">{order.code}</Mono>
                    <Chip tone={toneFor(order)}>{soStatusLabel(order.status)}</Chip>
                  </div>
                  <div className="kw-order__who">{customer?.name}</div>
                  <div className="kw-order__where">
                    {tLabel(`data.custkind.${customer?.kind}`, customer?.kind ?? "")} · {customer?.city}
                  </div>
                </div>

                <div className="kw-order__facts">
                  <div>
                    <div className="kw-order__fact">{t("orders.requiredBy")}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBlockStart: 2 }}>
                      <Chip tone={soon ? "warn" : undefined}>
                        <Mono>{dateShort(order.requiredBy)}</Mono>
                      </Chip>
                      {soon && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--warn)" }}>
                          {daysLeft <= 0
                            ? t("chrome.dueToday")
                            : t("chrome.inDays", {}, daysLeft).replace("{count}", String(daysLeft))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="kw-order__fact">{t("orders.total")}</div>
                    <div className="kw-order__factval kw-order__factval--strong">
                      {money(orderSubtotal(order))}
                    </div>
                  </div>
                  <div>
                    <div className="kw-order__fact">{t("orders.margin")}</div>
                    <div
                      className="kw-order__factval kw-order__factval--strong"
                      style={{ color: "var(--pos)" }}
                    >
                      {money(orderMargin(items, order))}
                    </div>
                  </div>
                  {order.invoice !== null && (
                    <div>
                      <div className="kw-order__fact">{t("orders.invoice")}</div>
                      <div className="kw-order__factval" style={{ fontWeight: 600 }}>
                        {order.invoice}
                      </div>
                    </div>
                  )}
                  <Button disabled={next === null} onClick={() => advanceOrder(order.code)}>
                    {order.status === "shipped" ? (
                      <Receipt size={14} aria-hidden="true" />
                    ) : (
                      <ArrowRight size={14} aria-hidden="true" />
                    )}
                    {next === null
                      ? t("orders.done")
                      : next === "invoiced"
                        ? t("orders.raise")
                        : t("orders.next", { status: soStatusLabel(next) })}
                  </Button>
                </div>
              </div>

              <div className="kw-order__lines">
                <div className="kw-fillbar">
                  <div className="kw-fillbar__top">
                    <span className="kw-order__fact">{t("orders.allocated")}</span>
                    <Mono className="kw-itemcell__meta">
                      {t("orders.fill", {
                        alloc: qtyNumber(orderAllocatedUnits(order)),
                        total: qtyNumber(orderUnits(order)),
                      })}
                    </Mono>
                  </div>
                  <div style={{ marginBlockStart: 5 }}>
                    <Bar pct={orderFillPct(order)} thin />
                  </div>
                </div>

                {order.lines.map((line, i) => {
                  const item = itemBySku(items, line.sku);
                  const alloc = allocationOf(line, order.status);
                  const tone =
                    alloc.state === "allocated"
                      ? "pos"
                      : alloc.state === "making"
                        ? "info"
                        : alloc.state === "short"
                          ? "danger"
                          : undefined;
                  return (
                    <div
                      key={`${line.sku}-${i}`}
                      className="kw-grid kw-grid--collapse"
                      style={{ "--cols": SO_COLS } as React.CSSProperties}
                    >
                      <div className="kw-span">
                        <ItemCell item={item} size={30} />
                      </div>
                      <div className="kw-num">{qtyNumber(line.qty)}</div>
                      <div className="kw-num kw-num--muted">{money(line.price)}</div>
                      <div className="kw-num kw-num--strong">
                        {money(round2(line.qty * line.price))}
                      </div>
                      <div
                        className="kw-span"
                        style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}
                      >
                        <Chip tone={tone}>
                          {alloc.state === "making"
                            ? t("chrome.alloc.making", { run: alloc.run ?? "" })
                            : alloc.state === "short"
                              ? t("chrome.alloc.short", { count: qtyNumber(alloc.shortBy) })
                              : alloc.state === "allocated"
                                ? t("chrome.alloc.allocated")
                                : t("chrome.alloc.awaiting")}
                        </Chip>
                        {/* One button turns a shortfall into a run for exactly it. */}
                        {alloc.state === "short" && (
                          <Button
                            tone="soft"
                            size="sm"
                            onClick={() => makeIt(order.code, i, alloc.shortBy)}
                          >
                            {t("orders.make")}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================== dispatch */

/**
 * WHERE ONE ORDER'S GOODS GO — both answers, in the same place on the card.
 *
 * ── WHY THE ABSENT ADDRESS GETS MORE WORDS THAN THE PRESENT ONE ────────────
 *
 * `SalesOrder.deliverTo` is nullable and its null MEANS the customer collects
 * (see that field for the whole argument). A nullable field is only a state
 * rather than a hole if something says so where somebody is looking, and the
 * place somebody is looking is here: the picker has the order ticked off and is
 * about to decide what happens to the pallet. An empty gap under the customer's
 * name would read as "the office has not filled this in yet" and the picker
 * would go and ask. So the null renders a heading of its own and a sentence
 * naming who is coming for it.
 *
 * ── AND WHY THE COUNTRY IS STORED AND NOT PRINTED ──────────────────────────
 *
 * `country` is on the record because a carrier checks a postcode against one,
 * and it is a machine's field. Every address in this works is in one country —
 * the same assumption `TAX_RATE` already makes with a single VAT rate — so a
 * two-letter code under every address would be the desk telling itself
 * something it knows. The first order that leaves the country changes both
 * decisions at once, and this line is where the second one gets revisited.
 */
function ShipTo({ address, customer }: { address: PostalAddress | null; customer: string }) {
  const { t } = useI18n();

  if (address === null) {
    return (
      <div className="kw-shipto">
        <div className="kw-order__fact">{t("dispatch.collection")}</div>
        {t("dispatch.collectNote", { customer })}
        {/*
          THE WORKS' OWN ADDRESS, on the one card where somebody has to tell a
          customer where to come. It was "the works" in words until the works
          had an address anywhere in the repo; naming the place is the whole
          point of having added one, and the collection card is where a person
          is standing when they need it.
         */}
        <div className="kw-shipto__name" style={{ marginBlockStart: 4 }}>
          {WORKS.name}
        </div>
        {WORKS.lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <div>
          {WORKS.city} <span className="kw-shipto__post">{WORKS.postcode}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="kw-shipto">
      <div className="kw-order__fact">{t("dispatch.deliverTo")}</div>
      <div className="kw-shipto__name">{address.name}</div>
      {address.lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
      <div>
        {address.city} <span className="kw-shipto__post">{address.postcode}</span>
      </div>
    </div>
  );
}

export function Dispatch() {
  const { t } = useI18n();
  const sos = useStore((s) => s.sos);
  const items = useStore((s) => s.items);
  const now = useStore((s) => s.now);
  const picked = useStore((s) => s.picked);
  const togglePicked = useStore((s) => s.togglePicked);
  const shipOrder = useStore((s) => s.shipOrder);
  const makeIt = useStore((s) => s.makeIt);

  const open = sos.filter((o) => o.status === "confirmed" || o.status === "picking");

  return (
    <section className="kw-view kw-view--mid kw-screen">
      <h1 className="kw-h1">{t("dispatch.title")}</h1>
      <p className="kw-sub">{t("dispatch.sub")}</p>

      {open.length === 0 && (
        <div style={{ marginBlockStart: 18 }}>
          <Panel>
            <Empty title={t("dispatch.empty")} />
          </Panel>
        </div>
      )}

      <div className="kw-stack">
        {open.map((order) => {
          const customer = customerById(order.customer);
          const daysLeft = -daysPast(now.date, order.requiredBy);
          const rows = order.lines.map((line, i) => {
            const item = itemBySku(items, line.sku);
            const onHand = item?.onHand ?? 0;
            const canPick = onHand >= line.qty;
            const gap = Math.max(0, round2(line.qty - onHand));
            const key = `${order.code}:${i}`;
            return { line, item, i, key, canPick, gap, isPicked: picked[key] === true, onHand };
          });
          const allPicked = rows.length > 0 && rows.every((r) => r.isPicked);
          const cartons = order.lines.reduce((sum, l) => {
            const item = itemBySku(items, l.sku);
            return sum + (item?.unit === "set" ? l.qty : Math.ceil(l.qty / 12));
          }, 0);

          return (
            <div key={order.code} className="kw-order">
              <div className="kw-order__head">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Mono className="kw-order__code">{order.code}</Mono>
                    <Chip tone={order.status === "picking" ? "warn" : "info"}>
                      {soStatusLabel(order.status)}
                    </Chip>
                  </div>
                  <div className="kw-order__who">{customer?.name}</div>
                  <ShipTo address={order.deliverTo} customer={customer?.name ?? order.customer} />
                </div>
                <div className="kw-order__facts">
                  <div>
                    <div className="kw-order__fact">{t("orders.requiredBy")}</div>
                    <Chip tone={daysLeft <= 4 ? "warn" : undefined}>
                      <Mono>{dateShort(order.requiredBy)}</Mono>
                    </Chip>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg-subtle)" }}>
                    {t("dispatch.picked", {
                      picked: String(rows.filter((r) => r.isPicked).length),
                      total: String(rows.length),
                    })}
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <div className="kw-order__factval kw-order__factval--strong">
                      {money(orderSubtotal(order))}
                    </div>
                    <Mono className="kw-itemcell__meta">
                      {t("dispatch.cartons", {}, cartons).replace("{count}", String(cartons))} ·{" "}
                      {daysLeft <= 0
                        ? t("chrome.dueToday")
                        : t("chrome.inDays", {}, daysLeft).replace("{count}", String(daysLeft))}
                    </Mono>
                  </div>
                </div>
              </div>

              <div className="kw-order__lines">
                {rows.map((r) => (
                  <div key={r.key} className="kw-pick">
                    <button
                      type="button"
                      className="kw-pick__tick kw-btn"
                      aria-pressed={r.isPicked}
                      aria-label={t("dispatch.toggle")}
                      disabled={!r.canPick}
                      onClick={() => togglePicked(r.key)}
                    >
                      <Check size={14} aria-hidden="true" />
                    </button>
                    <Tile item={r.item} size={32} icon={16} />
                    <div style={{ minInlineSize: 0, flex: 1 }}>
                      <div className="kw-itemcell__name">{itemName(r.item)}</div>
                      <Mono className="kw-itemcell__meta">
                        {r.line.sku} ·{" "}
                        {r.item?.unit === "set"
                          ? t("dispatch.wrapped", { count: qtyNumber(r.line.qty) })
                          : t("dispatch.cartons", {}, Math.ceil(r.line.qty / 12)).replace(
                              "{count}",
                              String(Math.ceil(r.line.qty / 12)),
                            )}
                      </Mono>
                    </div>
                    <div className="kw-pick__wrap" style={{ display: "contents" }}>
                      <div style={{ textAlign: "end", flex: "0 0 auto" }}>
                        <Mono style={{ fontSize: 13, fontWeight: 700 }}>{qtyNumber(r.line.qty)}</Mono>
                        <Mono className="kw-itemcell__meta">
                          {t("dispatch.onHand", { qty: qtyNumber(r.onHand) })}
                        </Mono>
                      </div>
                      <Chip
                        tone={
                          r.isPicked
                            ? "pos"
                            : r.canPick
                              ? undefined
                              : r.line.run !== null
                                ? "info"
                                : "danger"
                        }
                      >
                        {r.isPicked
                          ? t("dispatch.state.picked")
                          : r.canPick
                            ? t("dispatch.state.ready")
                            : r.line.run !== null
                              ? t("chrome.alloc.making", { run: r.line.run })
                              : t("chrome.alloc.short", { count: qtyNumber(r.gap) })}
                      </Chip>
                      {!r.canPick && r.line.run === null && (
                        <Button
                          tone="soft"
                          size="sm"
                          onClick={() => makeIt(order.code, r.i, r.gap)}
                        >
                          {t("orders.make")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div style={{ marginBlockStart: 13 }}>
                  <Button block disabled={!allPicked} onClick={() => shipOrder(order.code)}>
                    <Send size={15} aria-hidden="true" />
                    {allPicked ? t("dispatch.ship") : t("dispatch.shipBlocked")}
                  </Button>
                </div>

                {/*
                  ONE SLOT — `order.dispatch.actions`, under the Ship button.
                  Four decisions are worth reading before this line is moved.

                  ONLY FOR AN ORDER THAT IS BEING SENT. `deliverTo === null`
                  MEANS THE CUSTOMER COLLECTS — it is an answer, not a blank —
                  so a collection order is not offered a carrier at all. The
                  alternative was to mount it everywhere and let the add-on
                  report that it has no destination, and that would be this
                  works telling itself a lie in a more polite voice: nobody is
                  posting SO-5108, and a "we do not know where this is going"
                  panel over an order somebody is driving to fetch is a hole
                  where there is a decision. The card already says so in words
                  above.

                  NOT GATED ON `allPicked`. The Ship button is, because issuing
                  stock for a pallet that is not on the pallet is the works'
                  own rule about its own numbers. Whether a collection can be
                  booked before the last mug is wrapped is the carrier's rule
                  and the office's business, and a host that imposed its stock
                  rule on an add-on's action would be deciding something it was
                  not asked about.

                  SILENT WHEN NOTHING FILLS IT — no `fallback` prop, matching
                  `SLOT_EMPTY_BEHAVIOUR`. A works with no carrier connected
                  books its own transport and this card is already finished
                  (24 D6); a dashed "no carrier" box under the Ship button
                  would be the app describing a hole it does not have.

                  NOTHING FROM IN HERE GOES THROUGH `toast()`. This app's toast
                  takes FINISHED TEXT rather than a key, so a string raised in
                  one language would sit there in that language while the rest
                  of the page switched — and an add-on's result is exactly the
                  kind of text a reader would re-read after switching. The fill
                  renders its own outcome in place, where it re-renders with the
                  document's `lang` like everything else. `shipOrder`'s own
                  toast is the works' own copy and is unchanged.
                 */}
                {order.deliverTo !== null && (
                  <AddOnSlot
                    slot="order.dispatch.actions"
                    payload={{
                      order: outboundOrder(
                        order,
                        customer?.name ?? order.customer,
                        WORKS,
                        items,
                      ),
                      // REQUIRED, and this is the adapter the payload's own
                      // comment demands: an add-on answering "has today's van
                      // gone?" off its own clock is telling this works about
                      // somebody else's Tuesday.
                      now: shopClock(now),
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================== invoices */

const INV_COLS = "110px minmax(140px,1.6fr) 88px 88px 104px 96px minmax(96px,auto)";

export function Invoices() {
  const { t } = useI18n();
  const invoices = useStore((s) => s.invoices);
  const sos = useStore((s) => s.sos);
  const now = useStore((s) => s.now);
  const filter = useStore((s) => s.invFilter);
  const setInvFilter = useStore((s) => s.setInvFilter);
  const openInvoice = useStore((s) => s.openInvoice);

  const rows = invoices.map((invoice: Invoice) => {
    const order = sos.find((o) => o.code === invoice.order) ?? null;
    const totals = invoiceTotals(order, TAX);
    const status = invoiceStatus(invoice, totals.total, now.date);
    const late = daysPast(now.date, invoice.due);
    return {
      invoice,
      total: totals.total,
      outstanding: outstandingOf(invoice, totals.total),
      paid: paidOf(invoice),
      status,
      late,
      bucket: bucketOf(status, late),
    };
  });

  const buckets = agingBuckets(rows);
  const shown = rows.filter((r) => filter === "all" || r.status === filter);

  return (
    <section className="kw-view kw-screen">
      <h1 className="kw-h1">{t("invoices.title")}</h1>
      <p className="kw-sub">{t("invoices.sub")}</p>

      {/* Aging across the top; the empty bucket is dimmed, not hidden. */}
      <div className="kw-buckets">
        {buckets.map((b, i) => (
          <div key={b.bucket} className={`kw-bucket${b.count === 0 ? " kw-bucket--empty" : ""}`}>
            <div className="kw-kpi__label">{bucketLabel(b.bucket)}</div>
            <div
              className="kw-bucket__amount"
              style={{
                color: i === 0 ? undefined : i === 1 ? "var(--warn)" : "var(--danger)",
              }}
            >
              {money(b.amount)}
            </div>
            <div className="kw-kpi__hint">
              {t("invoices.bucketCount", {}, b.count).replace("{count}", String(b.count))}
            </div>
          </div>
        ))}
      </div>

      <div className="kw-filters" style={{ marginBlockEnd: 12 }}>
        <Filter pressed={filter === "all"} onClick={() => setInvFilter("all")}>
          {t("invoices.filter.all")}
        </Filter>
        {(["overdue", "part_paid", "sent", "paid"] as const).map((f) => (
          <Filter key={f} pressed={filter === f} onClick={() => setInvFilter(f)}>
            {invoiceStatusLabel(f)}
          </Filter>
        ))}
      </div>

      <div className="kw-panel" style={{ overflow: "hidden" }}>
        <div className="kw-grid kw-grid--head" style={{ "--cols": INV_COLS } as React.CSSProperties}>
          <div>{t("invoices.col.number")}</div>
          <div>{t("invoices.col.customer")}</div>
          <div>{t("invoices.col.issued")}</div>
          <div>{t("invoices.col.due")}</div>
          <div style={{ textAlign: "end" }}>{t("invoices.col.amount")}</div>
          <div style={{ textAlign: "end" }}>{t("invoices.col.outstanding")}</div>
          <div style={{ textAlign: "end" }}>{t("invoices.col.status")}</div>
        </div>

        {shown.length === 0 && <Empty title={t("invoices.empty")} />}

        {shown.map((r) => {
          const customer = customerById(r.invoice.customer);
          const tone =
            r.status === "paid"
              ? "pos"
              : r.status === "overdue"
                ? "danger"
                : r.status === "part_paid"
                  ? "warn"
                  : "info";
          return (
            <button
              key={r.invoice.number}
              type="button"
              className="kw-grid kw-grid--row kw-grid--collapse"
              style={{ "--cols": INV_COLS } as React.CSSProperties}
              onClick={() => openInvoice(r.invoice.number)}
            >
              <Mono style={{ fontSize: 12.5, fontWeight: 700 }}>{r.invoice.number}</Mono>
              <div className="kw-itemcell__name">{customer?.name}</div>
              <Mono className="kw-itemcell__meta">{dateShort(r.invoice.issued)}</Mono>
              <Mono className="kw-itemcell__meta">{dateShort(r.invoice.due)}</Mono>
              <div className="kw-num kw-num--strong">{money(r.total)}</div>
              <div className="kw-num kw-num--muted">{money(r.outstanding)}</div>
              <div
                className="kw-span"
                style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end" }}
              >
                <div style={{ textAlign: "end" }}>
                  {r.late > 0 && r.status !== "paid" ? (
                    <Chip tone="danger">
                      <Mono>
                        {t("chrome.daysOver", {}, r.late).replace("{count}", String(r.late))}
                      </Mono>
                    </Chip>
                  ) : (
                    <Mono
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: r.status === "paid" ? "var(--pos)" : "var(--fg-subtle)",
                      }}
                    >
                      {r.status === "paid"
                        ? t("invoices.settled")
                        : t("chrome.daysToRun", {}, -r.late).replace("{count}", String(-r.late))}
                    </Mono>
                  )}
                  <div className="kw-itemcell__meta">
                    {r.invoice.payments.length > 0
                      ? t("invoices.payments", {}, r.invoice.payments.length).replace(
                          "{count}",
                          String(r.invoice.payments.length),
                        )
                      : t("invoices.nothingIn")}
                  </div>
                </div>
                <Chip tone={tone}>{invoiceStatusLabel(r.status)}</Chip>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* =============================================================== recipes */

const RECIPE_COLS = "minmax(150px,2fr) 90px 90px 90px";

export function Recipes() {
  const { t } = useI18n();
  const items = useStore((s) => s.items);
  const sos = useStore((s) => s.sos);
  const recipeSku = useStore((s) => s.recipeSku);
  const rateDraft = useStore((s) => s.rateDraft);
  const setRecipeSku = useStore((s) => s.setRecipeSku);
  const setRateDraft = useStore((s) => s.setRateDraft);

  const products = items.filter((i) => i.kind === "product");
  const product = itemBySku(items, recipeSku) ?? products[0] ?? null;
  if (product === null) return null;

  const bomCost = round2(
    (product.bom ?? []).reduce((sum, [sku, per]) => {
      const component = itemBySku(items, sku);
      return sum + (component ? component.cost * per : 0);
    }, 0),
  );
  const cost = unitCost(items, product);
  const rate = rateDraft !== "" ? Number.parseFloat(rateDraft) || 0 : (product.price ?? 0);
  const m = marginOf(items, product, rate);
  const changed = rateDraft !== "" && Math.abs(rate - (product.price ?? 0)) > 0.005;

  const wanted = sos.filter(
    (o) => o.status !== "invoiced" && o.lines.some((l) => l.sku === product.sku),
  );

  return (
    <section className="kw-view kw-screen">
      <h1 className="kw-h1">{t("recipes.title")}</h1>
      <p className="kw-sub">{t("recipes.sub")}</p>

      <div className="kw-recipe">
        <div className="kw-recipe__list kw-scroll">
          {products.map((p) => (
            <button
              key={p.sku}
              type="button"
              className="kw-recipe__pick"
              aria-pressed={p.sku === product.sku}
              onClick={() => setRecipeSku(p.sku)}
            >
              <Tile item={p} size={28} icon={14} />
              <div style={{ minInlineSize: 0, flex: 1 }}>
                <div className="kw-itemcell__name">{itemName(p)}</div>
                <Mono className="kw-itemcell__meta">{p.sku}</Mono>
              </div>
              <Mono style={{ fontSize: 11.5, fontWeight: 600 }}>{money(unitCost(items, p))}</Mono>
            </button>
          ))}
        </div>

        <div className="kw-recipe__main">
          <div className="kw-panel kw-scrollx">
            <div className="kw-recipe__head">
              <Tile item={product} size={42} icon={22} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{itemName(product)}</div>
                <Mono className="kw-itemcell__meta">
                  {product.sku} · {t("recipes.perUnit", { unit: unitLabel(product.unit) })}
                </Mono>
              </div>
              <div style={{ marginInlineStart: "auto", textAlign: "end" }}>
                <div className="kw-order__fact">{t("recipes.onHand")}</div>
                <Mono style={{ fontSize: 13, fontWeight: 700 }}>{qtyNumber(product.onHand)}</Mono>
                <Mono className="kw-itemcell__meta">
                  {t("recipes.available", { qty: qtyNumber(available(product)) })}
                </Mono>
              </div>
            </div>

            <div
              className="kw-grid kw-grid--head kw-minw"
              style={{ "--cols": RECIPE_COLS, minInlineSize: 520 } as React.CSSProperties}
            >
              <div>{t("recipes.col.component")}</div>
              <div style={{ textAlign: "end" }}>{t("recipes.col.perUnit")}</div>
              <div style={{ textAlign: "end" }}>{t("recipes.col.rate")}</div>
              <div style={{ textAlign: "end" }}>{t("recipes.col.cost")}</div>
            </div>

            {(product.bom ?? []).map(([sku, per]) => {
              const component = itemBySku(items, sku);
              return (
                <div
                  key={sku}
                  className="kw-grid kw-minw"
                  style={{ "--cols": RECIPE_COLS, minInlineSize: 520 } as React.CSSProperties}
                >
                  <div style={{ minInlineSize: 0 }}>
                    <div className="kw-itemcell__name">{itemName(component)}</div>
                    <Mono className="kw-itemcell__meta">{sku}</Mono>
                  </div>
                  <div className="kw-num">
                    {qtyLabel(per, component?.unit ?? "ea", per < 1 ? 3 : 2)}
                  </div>
                  <div className="kw-num kw-num--muted">{money(component?.cost ?? 0)}</div>
                  <div className="kw-num kw-num--strong">
                    {money(round2((component?.cost ?? 0) * per))}
                  </div>
                </div>
              );
            })}

            <div className="kw-totals">
              <div className="kw-totals__row">
                <span>{t("recipes.materials")}</span>
                <Mono>{money(bomCost)}</Mono>
              </div>
              <div className="kw-totals__row">
                <span>{t("recipes.labour")}</span>
                <Mono>{money(product.labour ?? 0)}</Mono>
              </div>
              <div className="kw-totals__row">
                <span>{t("recipes.overhead")}</span>
                <Mono>{money(product.overhead ?? 0)}</Mono>
              </div>
              <div className="kw-totals__row kw-totals__row--grand">
                <span>{t("recipes.unitCost")}</span>
                <Mono>{money(cost)}</Mono>
              </div>
            </div>
          </div>

          <Panel title={t("recipes.sellRate")}>
            <div className="kw-recipe__rate">
              <Field label={t("recipes.rate")}>
                <input
                  className="kw-input kw-input--num kw-fld"
                  inputMode="decimal"
                  value={rateDraft !== "" ? rateDraft : (product.price ?? 0).toFixed(2)}
                  onChange={(e) => setRateDraft(e.target.value.replace(/[^0-9.]/g, ""))}
                />
              </Field>
              <div className="kw-field">
                <span className="kw-label">{t("recipes.margin")}</span>
                <div
                  className="kw-readout"
                  style={{
                    color:
                      m.margin <= 0
                        ? "var(--danger)"
                        : (m.pct ?? 0) < 50
                          ? "var(--warn)"
                          : "var(--pos)",
                  }}
                >
                  <Mono>{money(m.margin)}</Mono>
                </div>
              </div>
              <div className="kw-field">
                <span className="kw-label">{t("recipes.marginPct")}</span>
                <div
                  className="kw-readout"
                  style={{
                    color:
                      m.margin <= 0
                        ? "var(--danger)"
                        : (m.pct ?? 0) < 50
                          ? "var(--warn)"
                          : "var(--pos)",
                  }}
                >
                  <Mono>{pct(m.pct)}</Mono>
                </div>
              </div>
            </div>

            {changed && (
              <div style={{ marginBlockStart: 11, display: "flex", alignItems: "center", gap: 10 }}>
                <Notice tone="info">
                  {t("recipes.trying", { rate: money(product.price ?? 0) })}
                </Notice>
                <Button tone="ghost" size="sm" onClick={() => setRateDraft("")}>
                  {t("recipes.putBack")}
                </Button>
              </div>
            )}
          </Panel>

          {wanted.length > 0 && (
            <Panel title={t("recipes.usedIn")}>
              {wanted.map((o) => (
                <div key={o.code} className="kw-hand__row">
                  <Mono style={{ fontSize: 12, fontWeight: 700 }}>{o.code}</Mono>
                  <Chip>{soStatusLabel(o.status)}</Chip>
                  <span className="kw-searchpop__meta">{customerById(o.customer)?.name}</span>
                  <Mono style={{ marginInlineStart: "auto", fontSize: 12.5, fontWeight: 700 }}>
                    {qtyNumber(
                      o.lines.filter((l) => l.sku === product.sku).reduce((sum, l) => sum + l.qty, 0),
                    )}
                  </Mono>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================= the books */

const MARGIN_COLS = "minmax(180px,2fr) 92px 92px 92px 80px";

export function Books() {
  const { t } = useI18n();
  const items = useStore((s) => s.items);
  const sos = useStore((s) => s.sos);
  const runs = useStore((s) => s.runs);
  const pos = useStore((s) => s.pos);
  const invoices = useStore((s) => s.invoices);
  const now = useStore((s) => s.now);

  const invoiceRows = invoices.map((invoice) => {
    const order = sos.find((o) => o.code === invoice.order) ?? null;
    const totals = invoiceTotals(order, TAX);
    const status = invoiceStatus(invoice, totals.total, now.date);
    const late = daysPast(now.date, invoice.due);
    return {
      outstanding: outstandingOf(invoice, totals.total),
      bucket: bucketOf(status, late),
    };
  });
  const receivables = round2(invoiceRows.reduce((sum, r) => sum + r.outstanding, 0));
  const aging = agingBuckets(invoiceRows);
  const b = rollUp(items, sos, runs, pos, receivables);

  const margins = items
    .filter((i) => i.kind === "product")
    .map((p) => ({ product: p, ...marginOf(items, p) }))
    /* Worst first: a margin table sorted any other way makes you hunt for the
     * only rows that need a decision. */
    .sort((x, y) => (x.pct ?? 0) - (y.pct ?? 0));

  const openPos = pos.filter((p) => p.status === "sent" || p.status === "part_received");

  return (
    <section className="kw-view kw-screen">
      <h1 className="kw-h1">{t("books.title")}</h1>
      <p className="kw-sub">{t("books.sub")}</p>

      <div className="kw-books__big">
        <div className="kw-panel" style={{ padding: "16px 18px" }}>
          <div className="kw-kpi__label">{t("books.revenue")}</div>
          <div className="kw-kpi__value kw-kpi__value--lg">{money(b.revenue)}</div>
        </div>
        <div className="kw-panel" style={{ padding: "16px 18px" }}>
          <div className="kw-kpi__label">{t("books.cogs")}</div>
          <div className="kw-kpi__value kw-kpi__value--lg" style={{ color: "var(--fg-muted)" }}>
            {money(b.cogs)}
          </div>
          <div className="kw-kpi__hint">{t("books.cogsNote")}</div>
        </div>
        <div className="kw-panel" style={{ padding: "16px 18px" }}>
          <div className="kw-kpi__label">{t("books.margin")}</div>
          <div className="kw-kpi__value kw-kpi__value--lg" style={{ color: "var(--pos)" }}>
            {money(b.margin)}
          </div>
        </div>
        <div className="kw-panel" style={{ padding: "16px 18px" }}>
          <div className="kw-kpi__label">{t("books.marginPct")}</div>
          <div className="kw-kpi__value kw-kpi__value--lg" style={{ color: "var(--pos)" }}>
            {pct(b.marginPct)}
          </div>
        </div>
      </div>

      <div className="kw-books__pair">
        <div className="kw-panel" style={{ padding: "15px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t("books.receivables")}</span>
            <Mono style={{ marginInlineStart: "auto", fontSize: 18, fontWeight: 700 }}>
              {money(b.receivables)}
            </Mono>
          </div>
          <div className="kw-books__aging">
            {aging.map((row, i) => (
              <div
                key={row.bucket}
                className="kw-books__agingrow"
                style={{ opacity: row.count === 0 ? 0.45 : 1 }}
              >
                <span>{bucketLabel(BUCKETS[i])}</span>
                <Mono
                  style={{
                    color: i === 0 ? undefined : i === 1 ? "var(--warn)" : "var(--danger)",
                  }}
                >
                  {money(row.amount)}
                </Mono>
              </div>
            ))}
          </div>
        </div>

        <div className="kw-panel" style={{ padding: "15px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t("books.payables")}</span>
            <Mono style={{ marginInlineStart: "auto", fontSize: 18, fontWeight: 700 }}>
              {money(b.payables)}
            </Mono>
          </div>
          <div className="kw-books__aging">
            {openPos.map((po) => (
              <div key={po.code} className="kw-books__agingrow">
                <Mono>{po.code}</Mono>
                <Mono
                  style={{
                    color: daysPast(now.date, po.due) > 0 ? "var(--danger)" : undefined,
                  }}
                >
                  {money(poOutstandingValue(po))}
                </Mono>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="kw-books__small">
        <div className="kw-panel" style={{ padding: "15px 16px" }}>
          <div className="kw-kpi__label">{t("books.stockValue")}</div>
          <div className="kw-kpi__value">{money(b.stockValue)}</div>
          <Mono className="kw-kpi__hint">
            {t("books.stockSplit", {
              components: money(b.componentValue),
              finished: money(b.finishedValue),
            })}
          </Mono>
        </div>
        <div className="kw-panel" style={{ padding: "15px 16px" }}>
          <div className="kw-kpi__label">{t("books.wip")}</div>
          <div className="kw-kpi__value">{money(b.wip)}</div>
          <div className="kw-kpi__hint">
            {t("books.wipNote", {}, b.wipRuns).replace("{count}", String(b.wipRuns))}
          </div>
        </div>
      </div>

      <div className="kw-panel kw-scrollx" style={{ marginBlockStart: 18 }}>
        <header className="kw-panel__head">
          <h2 className="kw-panel__title">{t("books.byProduct")}</h2>
          <span className="kw-panel__sub">{t("books.worstFirst")}</span>
        </header>
        <div
          className="kw-grid kw-grid--head kw-minw"
          style={{ "--cols": MARGIN_COLS } as React.CSSProperties}
        >
          <div>{t("books.col.product")}</div>
          <div style={{ textAlign: "end" }}>{t("books.col.unitCost")}</div>
          <div style={{ textAlign: "end" }}>{t("books.col.soldAt")}</div>
          <div style={{ textAlign: "end" }}>{t("books.col.margin")}</div>
          <div style={{ textAlign: "end" }}>{t("books.col.marginPct")}</div>
        </div>
        {margins.map((row) => (
          <div
            key={row.product.sku}
            className="kw-grid kw-minw"
            style={{ "--cols": MARGIN_COLS } as React.CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, minInlineSize: 0 }}>
              <Tile item={row.product} size={28} icon={14} />
              <div style={{ minInlineSize: 0 }}>
                <div className="kw-itemcell__name">{itemName(row.product)}</div>
                <Mono className="kw-itemcell__meta">{row.product.sku}</Mono>
              </div>
            </div>
            <div className="kw-num kw-num--muted">{money(row.cost)}</div>
            <div className="kw-num">{money(row.product.price ?? 0)}</div>
            <div className="kw-num">{money(row.margin)}</div>
            <div
              className="kw-num kw-num--strong"
              style={{ color: (row.pct ?? 0) < 50 ? "var(--warn)" : "var(--pos)" }}
            >
              {pct(row.pct)}
            </div>
          </div>
        ))}
      </div>

      {/*
       * 21 D15, verbatim and non-negotiable. "The books" is a view over data the
       * app already holds, and it says so where a reader will actually see it.
       */}
      <p className="kw-honest">{t("books.honest")}</p>
    </section>
  );
}

/* Kept out of the default export set so the icon import stays used. */
export const OFFICE_ICONS = { Banknote, Icon, Kpi };
