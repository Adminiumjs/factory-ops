/**
 * The Floor's five views: the board, the stations, the kilns, the seconds log
 * and the handover note.
 *
 * The board is the app's centrepiece and the one screen where the engine has to
 * be VISIBLE rather than merely correct. A run that cannot start says which
 * component is short and by how much, its advance button is disabled with that
 * reason spelled out beside it, and nothing is silently greyed out — because a
 * greyed button on a shop floor is a question somebody has to walk across the
 * building to ask.
 */

import {
  ArrowRight,
  Ban,
  Check,
  CheckCheck,
  Clock,
  ClipboardList,
  TriangleAlert,
} from "lucide-react";

import { STAGES } from "../data/types.ts";
import type { Run, Stage } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import {
  clock,
  dateFull,
  elapsed,
  firingLabel,
  itemName,
  movementLabel,
  stationName,
  pct,
  pctWhole,
  qty as qtyLabel,
  qtyNumber,
  stageLabel,
  temp,
  kwh as kwhLabel,
  duration,
  label as tLabel,
} from "../lib/format.ts";
import { dayDiff } from "../lib/ledger.ts";
import {
  blockedShortage,
  canAdvance,
  itemBySku,
  nextStage,
  shortageFor,
  stationLoads,
  unassignedRuns,
  yieldPct,
} from "../lib/production.ts";
import {
  ALL_STATIONS,
  DESK_STAFF,
  REASONS,
  customerById,
  shiftLine,
  stationById,
  useStore,
} from "../state/store.ts";
import {
  Bar,
  Button,
  Chip,
  Empty,
  Filter,
  Icon,
  Kpi,
  Mono,
  Notice,
  Panel,
  Tile,
} from "../components/Primitives.tsx";

/* =========================================================== floor board */

function RunCard({ run }: { run: Run }) {
  const { t } = useI18n();
  const items = useStore((s) => s.items);
  const openRun = useStore((s) => s.openRun);
  const advanceRun = useStore((s) => s.advanceRun);

  const product = itemBySku(items, run.sku);
  const short = blockedShortage(items, run);
  const shortItem = short ? itemBySku(items, short.sku) : null;
  const station = stationById(run.station);
  const done = run.stage === "complete";
  const next = nextStage(run.stage);
  const progress = run.qty > 0 ? Math.min(100, Math.round((run.good / run.qty) * 100)) : 0;

  return (
    <div className="kw-run kw-card">
      <button
        type="button"
        onClick={() => openRun(run.code)}
        aria-label={t("board.open")}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "block",
          inlineSize: "100%",
        }}
      >
        <div className="kw-run__top">
          <Mono className="kw-run__code">{run.code}</Mono>
          {run.startedMin !== null && (
            <Chip>
              <Clock size={11} aria-hidden="true" />
              <Mono>{elapsed(run.startedMin)}</Mono>
            </Chip>
          )}
        </div>

        <div className="kw-run__body">
          <Tile item={product} size={52} icon={30} showSku />
          <div style={{ minInlineSize: 0, flex: 1 }}>
            <div className="kw-run__name">{itemName(product)}</div>
            <div className="kw-run__line">
              {t("board.card.good", { good: qtyNumber(run.good), qty: qtyNumber(run.qty) })}
            </div>
            {run.scrap > 0 && (
              <div className="kw-run__line kw-run__line--warn">
                {t("board.card.seconds", { count: qtyNumber(run.scrap) })}
              </div>
            )}
            <div style={{ marginBlockStart: 6 }}>
              <Bar pct={progress} thin />
            </div>
          </div>
        </div>

        {station !== null && (
          <div className="kw-run__meta">
            <Icon name={station.icon} size={12} />
            {stationName(station)}
          </div>
        )}
        {run.forOrder !== null && (
          <div className="kw-run__meta" style={{ marginBlockStart: 5 }}>
            <ClipboardList size={12} aria-hidden="true" />
            <Mono>{t("board.card.for", { code: run.forOrder })}</Mono>
          </div>
        )}

        {short !== null && shortItem !== null && (
          <div className="kw-run__block">
            <TriangleAlert size={13} aria-hidden="true" style={{ flex: "0 0 auto", marginBlockStart: 1 }} />
            <span>
              {t("board.card.short", {
                qty: qtyLabel(short.qty, shortItem.unit),
                name: itemName(shortItem),
              })}
            </span>
          </div>
        )}
      </button>

      <div className="kw-run__action">
        <Button
          block
          disabled={short !== null || done || !canAdvance(items, run)}
          onClick={() => advanceRun(run.code)}
        >
          {done ? (
            <CheckCheck size={14} aria-hidden="true" />
          ) : short !== null ? (
            <Ban size={14} aria-hidden="true" />
          ) : (
            <ArrowRight size={14} aria-hidden="true" />
          )}
          {done
            ? t("board.btn.closed")
            : short !== null
              ? t("board.btn.blocked")
              : t("board.btn.advance", { stage: stageLabel(next ?? "complete") })}
        </Button>
        {/*
         * The reason is written out beside the disabled button. Never just
         * greyed: somebody has to know what to go and fetch.
         */}
        {short !== null && shortItem !== null && (
          <div className="kw-run__reason">
            {t("board.card.blocked", {
              qty: qtyLabel(short.qty, shortItem.unit),
              name: itemName(shortItem),
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function Board() {
  const { t } = useI18n();
  const runs = useStore((s) => s.runs);
  const now = useStore((s) => s.now);
  const shift = shiftLine(now);

  const totalGood = runs.reduce((sum, r) => sum + r.good, 0);
  const totalScrap = runs.reduce((sum, r) => sum + r.scrap, 0);

  return (
    <section className="kw-view kw-view--wide kw-screen">
      <div className="kw-screen__head">
        <div>
          <h1 className="kw-h1">{t("board.title")}</h1>
          <p className="kw-sub">
            {t("board.sub", {
              date: dateFull(now.date),
              start: shift.start,
              end: shift.end,
              now: shift.now,
            })}
          </p>
        </div>
        <div className="kw-kpis">
          <Kpi label={t("board.kpi.good")} value={qtyNumber(totalGood)} />
          <Kpi label={t("board.kpi.seconds")} value={qtyNumber(totalScrap)} tone="warn" />
          <Kpi label={t("board.kpi.yield")} value={pct(yieldPct(totalGood, totalScrap))} tone="pos" />
        </div>
      </div>

      {/* Six columns; under 900px they scroll horizontally with scroll-snap. */}
      <div className="kw-board kw-scroll">
        {STAGES.map((stage: Stage) => {
          const column = runs.filter((r) => r.stage === stage);
          const units = column.reduce((sum, r) => sum + r.qty, 0);
          return (
            <div key={stage} className="kw-board__col">
              <div className="kw-board__colhead">
                <span>{stageLabel(stage)}</span>
                <span className="kw-board__count">{column.length}</span>
                <span className="kw-board__units">
                  {units > 0 ? t("board.col.units", { count: qtyNumber(units) }) : t("board.col.none")}
                </span>
              </div>
              <div className="kw-board__drop">
                {column.map((run) => (
                  <RunCard key={run.code} run={run} />
                ))}
                {column.length === 0 && <div className="kw-board__empty">{t("board.col.empty")}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================== stations */

export function Stations() {
  const { t } = useI18n();
  const runs = useStore((s) => s.runs);
  const items = useStore((s) => s.items);
  const defects = useStore((s) => s.defects);
  const now = useStore((s) => s.now);

  const shiftSoFar = now.minutes - now.shiftStart;
  const loads = stationLoads(ALL_STATIONS, runs, defects, shiftSoFar);
  const waiting = unassignedRuns(runs);

  return (
    <section className="kw-view kw-screen">
      <h1 className="kw-h1">{t("stations.title")}</h1>
      <p className="kw-sub">{t("stations.sub")}</p>

      {waiting.length > 0 && (
        <div style={{ marginBlockStart: 16 }}>
          <Panel
            title={`${t("stations.waiting")} · ${t("stations.waitingCount", {}, waiting.length).replace("{count}", String(waiting.length))}`}
          >
            <div className="kw-bench">
              {waiting.map((run) => {
                const product = itemBySku(items, run.sku);
                const short = shortageFor(items, run);
                const shortItem = short ? itemBySku(items, short.sku) : null;
                return (
                  <div key={run.code} className="kw-bench__item">
                    <Tile item={product} size={28} icon={14} />
                    <div style={{ minInlineSize: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                        <Mono style={{ fontSize: 12, fontWeight: 700 }}>{run.code}</Mono>
                        <Mono className="kw-itemcell__meta">{qtyNumber(run.qty)}</Mono>
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: short ? "var(--warn)" : "var(--fg-subtle)",
                        }}
                      >
                        {short !== null && shortItem !== null
                          ? t("stations.note.short", {
                              qty: qtyLabel(short.qty, shortItem.unit),
                              name: itemName(shortItem),
                            })
                          : t("stations.note.ready")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      <div className="kw-cards">
        {loads.map((load) => {
          const product = load.current ? itemBySku(items, load.current.sku) : null;
          return (
            <div key={load.station.id} className="kw-panel kw-card" style={{ padding: 15 }}>
              <div className="kw-station__head">
                <span className="kw-station__icon">
                  <Icon name={load.station.icon} size={16} />
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{stationName(load.station)}</div>
                  <Mono className="kw-itemcell__meta">
                    {load.station.id} · {load.station.by}
                  </Mono>
                </div>
                <span style={{ marginInlineStart: "auto" }}>
                  <Chip tone={load.current ? "pos" : undefined}>
                    {load.current ? t("stations.running") : t("stations.idle")}
                  </Chip>
                </span>
              </div>

              <div className="kw-station__stats">
                <div>
                  <div className="kw-station__stat">{t("stations.good")}</div>
                  <div className="kw-station__statval">{qtyNumber(load.goodToday)}</div>
                </div>
                <div>
                  <div className="kw-station__stat">{t("stations.seconds")}</div>
                  <div className="kw-station__statval" style={{ color: "var(--warn)" }}>
                    {qtyNumber(load.secondsToday)}
                  </div>
                </div>
                <div>
                  <div className="kw-station__stat">{t("stations.busy")}</div>
                  <div
                    className="kw-station__statval"
                    style={{
                      color:
                        load.utilPct >= 70
                          ? "var(--pos)"
                          : load.utilPct >= 35
                            ? "var(--warn)"
                            : "var(--fg-subtle)",
                    }}
                  >
                    {pctWhole(load.utilPct)}
                  </div>
                </div>
              </div>

              <div className="kw-station__now">
                {load.current !== null ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <Mono style={{ fontSize: 12, fontWeight: 700 }}>{load.current.code}</Mono>
                      <Mono className="kw-itemcell__meta">{elapsed(load.current.startedMin)}</Mono>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBlockStart: 4 }}>
                      {itemName(product)}
                    </div>
                    <Mono className="kw-itemcell__meta" >
                      {t("stations.progress", {
                        good: qtyNumber(load.current.good),
                        qty: qtyNumber(load.current.qty),
                        stage: stageLabel(load.current.stage).toLowerCase(),
                      })}
                    </Mono>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>{t("stations.empty")}</div>
                )}
              </div>

              <div className="kw-station__queue">
                <div className="kw-supplier__sectitle">
                  {t("stations.queued")} · {load.queued.length}
                </div>
                {load.queued.slice(0, 3).map((r) => (
                  <div key={r.code} className="kw-station__queuerow">
                    <Mono style={{ fontWeight: 600 }}>{r.code}</Mono>
                    <span className="kw-searchpop__meta">{itemName(itemBySku(items, r.sku))}</span>
                    <Mono style={{ marginInlineStart: "auto", color: "var(--fg-subtle)" }}>
                      {qtyNumber(r.qty)}
                    </Mono>
                  </div>
                ))}
                {load.queued.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--fg-subtle)", paddingBlock: 4 }}>
                    {t("stations.noQueue")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =============================================================== firings */

export function Firings() {
  const { t } = useI18n();
  const firings = useStore((s) => s.firings);
  const items = useStore((s) => s.items);

  return (
    <section className="kw-view kw-screen">
      <h1 className="kw-h1">{t("firings.title")}</h1>
      <p className="kw-sub">{t("firings.sub")}</p>

      <div className="kw-cards kw-cards--wide">
        {firings.map((f) => {
          const station = stationById(f.station);
          const progress = Math.max(2, Math.min(100, Math.round((f.current / f.target) * 100)));
          const pieces = f.contents.reduce((sum, c) => sum + c.qty, 0);
          const tone =
            f.status === "firing"
              ? "warn"
              : f.status === "loading"
                ? "info"
                : f.status === "cooling"
                  ? "accent"
                  : undefined;
          return (
            <div key={f.code} className="kw-panel kw-card" style={{ padding: 15 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <Mono style={{ fontSize: 13, fontWeight: 700 }}>{f.code}</Mono>
                <Chip tone={tone}>{firingLabel(f.status)}</Chip>
                {f.startedMin !== null && (
                  <span style={{ marginInlineStart: "auto" }}>
                    <Chip>
                      <Clock size={11} aria-hidden="true" />
                      <Mono>{elapsed(f.startedMin)}</Mono>
                    </Chip>
                  </span>
                )}
              </div>

              <div style={{ fontSize: 13.5, fontWeight: 700, marginBlockStart: 7 }}>
                {stationName(station)}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBlockStart: 2 }}>
                {tLabel(f.programmeKey, f.programme)}
              </div>

              <div style={{ marginBlockStart: 12 }}>
                <div className="kw-firing__temp">
                  <Mono className="kw-firing__now">{temp(f.current)}</Mono>
                  <Mono className="kw-itemcell__meta">{t("firings.of", { target: temp(f.target) })}</Mono>
                </div>
                <div style={{ marginBlockStart: 7 }}>
                  <Bar
                    pct={progress}
                    tone={f.status === "firing" ? "warn" : f.status === "unloaded" ? "pos" : undefined}
                  />
                </div>
              </div>

              <div className="kw-firing__facts">
                <div>
                  <div className="kw-firing__fact">{t("firings.loaded")}</div>
                  <div className="kw-firing__factval">{clock(f.loaded)}</div>
                </div>
                <div>
                  <div className="kw-firing__fact">{t("firings.started")}</div>
                  <div className="kw-firing__factval">
                    {f.started === null ? t("firings.pending") : clock(f.started)}
                  </div>
                </div>
                <div>
                  <div className="kw-firing__fact">{t("firings.out")}</div>
                  <div className="kw-firing__factval" style={{ fontWeight: 700 }}>
                    {clock(f.due)}
                  </div>
                </div>
                <div style={{ marginInlineStart: "auto", textAlign: "end" }}>
                  <div className="kw-firing__fact">{t("firings.energy")}</div>
                  <div className="kw-firing__factval">
                    {f.kwh === null ? t("firings.notFired") : kwhLabel(f.kwh)}
                  </div>
                </div>
              </div>

              <div style={{ marginBlockStart: 12 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span className="kw-firing__fact">{t("firings.load")}</span>
                  <Mono className="kw-itemcell__meta">
                    {t("firings.shelves", { used: String(f.shelves), total: String(f.capacity) })} ·{" "}
                    {t("firings.pieces", {}, pieces).replace("{count}", qtyNumber(pieces))}
                  </Mono>
                </div>
                <div style={{ marginBlockStart: 5 }}>
                  <Bar pct={Math.round((f.shelves / f.capacity) * 100)} thin tone="muted" />
                </div>
              </div>

              <div className="kw-firing__steps">
                {f.steps.map((step, i) => (
                  <div key={i} className="kw-firing__step">
                    <div className="kw-firing__fact">{tLabel(step.labelKey, step.label)}</div>
                    <Mono style={{ fontSize: 11.5, fontWeight: 600 }}>
                      {temp(step.to)} · {duration(step.hold)}
                    </Mono>
                  </div>
                ))}
              </div>

              <div className="kw-firing__inside">
                <div className="kw-supplier__sectitle">{t("firings.inside")}</div>
                {f.contents.map((c) => {
                  const item = itemBySku(items, c.sku);
                  return (
                    <div key={c.run} className="kw-firing__load">
                      <Tile item={item} size={28} icon={14} />
                      <div style={{ minInlineSize: 0, flex: 1 }}>
                        <div className="kw-itemcell__name">{itemName(item)}</div>
                        <Mono className="kw-itemcell__meta">
                          {c.run} · {c.sku}
                        </Mono>
                      </div>
                      <Mono style={{ fontSize: 12, fontWeight: 600 }}>{qtyNumber(c.qty)}</Mono>
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

/* =============================================================== seconds */

export function Seconds() {
  const { t } = useI18n();
  const defects = useStore((s) => s.defects);
  const runs = useStore((s) => s.runs);
  const items = useStore((s) => s.items);
  const filter = useStore((s) => s.reasonFilter);
  const setReasonFilter = useStore((s) => s.setReasonFilter);

  const total = defects.reduce((sum, d) => sum + d.qty, 0);
  const good = runs.reduce((sum, r) => sum + r.good, 0);

  const byReason = REASONS.map((reason) => ({
    reason,
    qty: defects.filter((d) => d.reason === reason).reduce((sum, d) => sum + d.qty, 0),
  })).sort((a, b) => b.qty - a.qty);
  const worstReason = Math.max(1, ...byReason.map((r) => r.qty));

  const byStation = ALL_STATIONS.map((station) => ({
    station,
    qty: defects.filter((d) => d.station === station.id).reduce((sum, d) => sum + d.qty, 0),
  })).sort((a, b) => b.qty - a.qty);
  const worstStation = Math.max(1, ...byStation.map((s) => s.qty));

  const rows = defects
    .filter((d) => filter === "all" || d.reason === filter)
    .slice()
    .reverse();

  return (
    <section className="kw-view kw-screen">
      <div className="kw-screen__head">
        <div>
          <h1 className="kw-h1">{t("seconds.title")}</h1>
          <p className="kw-sub">{t("seconds.sub")}</p>
        </div>
        <div className="kw-kpis">
          <Kpi label={t("seconds.kpi.total")} value={qtyNumber(total)} tone="warn" />
          <Kpi
            label={t("seconds.kpi.rate")}
            value={pct(total + good > 0 ? Math.round((total / (total + good)) * 1000) / 10 : null)}
          />
        </div>
      </div>

      <div className="kw-split">
        <Panel title={t("seconds.byReason")}>
          {byReason.map((r) => (
            <div key={r.reason} className="kw-metric" style={{ opacity: r.qty === 0 ? 0.5 : 1 }}>
              <div className="kw-metric__top">
                <span>{tLabel(`data.reason.${r.reason}`, r.reason)}</span>
                <Mono className="kw-metric__qty">{qtyNumber(r.qty)}</Mono>
              </div>
              <Bar
                pct={Math.round((r.qty / worstReason) * 100)}
                tone={r.qty >= worstReason && r.qty > 0 ? "danger" : "warn"}
              />
              <div className="kw-metric__share">
                {total > 0
                  ? t("seconds.share", { pct: pctWhole(Math.round((r.qty / total) * 100)) })
                  : t("seconds.none")}
              </div>
            </div>
          ))}
        </Panel>

        <Panel title={t("seconds.byStation")}>
          {byStation.map((s) => (
            <div key={s.station.id} className="kw-metric" style={{ opacity: s.qty === 0 ? 0.5 : 1 }}>
              <div className="kw-metric__top">
                <span>{stationName(s.station)}</span>
                <Mono className="kw-metric__qty">{qtyNumber(s.qty)}</Mono>
              </div>
              <Bar
                pct={Math.round((s.qty / worstStation) * 100)}
                tone={s.qty >= worstStation && s.qty > 0 ? "danger" : "warn"}
              />
            </div>
          ))}
        </Panel>

        <Panel
          bodyless
          title={t("seconds.log")}
          actions={
            <div className="kw-filters">
              <Filter pressed={filter === "all"} onClick={() => setReasonFilter("all")}>
                {t("seconds.filter.all")}
              </Filter>
              {REASONS.map((r) => (
                <Filter key={r} pressed={filter === r} onClick={() => setReasonFilter(r)}>
                  {tLabel(`data.reason.${r}`, r)}
                </Filter>
              ))}
            </div>
          }
        >
          {rows.length === 0 && <Empty title={t("seconds.empty")} />}
          {rows.map((d, i) => {
            const item = itemBySku(items, d.sku);
            const station = stationById(d.station);
            return (
              <div key={`${d.run}-${i}`} className="kw-logrow">
                <Mono className="kw-logrow__at">{clock(d.at)}</Mono>
                <Tile item={item} size={30} icon={15} />
                <div style={{ minInlineSize: 0, flex: 1 }}>
                  <div className="kw-itemcell__name">{itemName(item)}</div>
                  <Mono className="kw-itemcell__meta">
                    {d.run} · {stationName(station)} · {d.by}
                  </Mono>
                </div>
                <Chip tone="warn">{tLabel(`data.reason.${d.reason}`, d.reason)}</Chip>
                <Mono style={{ fontSize: 13, fontWeight: 700, color: "var(--warn)", flex: "0 0 auto" }}>
                  {qtyNumber(d.qty)}
                </Mono>
              </div>
            );
          })}
        </Panel>
      </div>
    </section>
  );
}

/* ============================================================== handover */

export function Handover() {
  const { t } = useI18n();
  const runs = useStore((s) => s.runs);
  const items = useStore((s) => s.items);
  const defects = useStore((s) => s.defects);
  const firings = useStore((s) => s.firings);
  const movements = useStore((s) => s.movements);
  const sos = useStore((s) => s.sos);
  const now = useStore((s) => s.now);
  const note = useStore((s) => s.handoverNote);
  const signed = useStore((s) => s.handoverSigned);
  const setHandoverNote = useStore((s) => s.setHandoverNote);
  const signHandover = useStore((s) => s.signHandover);

  const shift = shiftLine(now);
  const good = runs.reduce((sum, r) => sum + r.good, 0);
  const seconds = defects.reduce((sum, d) => sum + d.qty, 0);

  /* Everything the next shift should not have to work out for themselves. */
  const flags: { tone: "warn" | "info" | "muted"; text: string }[] = [
    ...runs
      .filter((r) => r.stage === "queued")
      .map((r) => ({ run: r, short: shortageFor(items, r) }))
      .filter((x) => x.short !== null)
      .map((x) => {
        const shortItem = itemBySku(items, x.short!.sku);
        return {
          tone: "warn" as const,
          text: t("handover.flag.blocked", {
            code: x.run.code,
            qty: qtyLabel(x.short!.qty, shortItem?.unit ?? "ea"),
            name: itemName(shortItem) || x.short!.sku,
          }),
        };
      }),
    ...firings
      .filter((f) => f.status === "firing")
      .map((f) => ({
        tone: "info" as const,
        text: t("handover.flag.firing", {
          code: f.code,
          station: stationName(stationById(f.station)) || f.station,
          due: clock(f.due),
          programme: tLabel(f.programmeKey, f.programme),
        }),
      })),
    ...firings
      .filter((f) => f.status === "loading")
      .map((f) => ({
        tone: "muted" as const,
        text: t("handover.flag.loading", {
          code: f.code,
          programme: tLabel(f.programmeKey, f.programme),
        }),
      })),
  ];

  const today = movements.filter((m) => m.date === now.date);
  const kinds: ("receipt" | "production" | "shipment" | "issue" | "adjustment")[] = [
    "receipt",
    "production",
    "shipment",
    "issue",
    "adjustment",
  ];

  const due = sos
    .filter((o) => o.status === "draft" || o.status === "confirmed" || o.status === "picking")
    .map((o) => ({ order: o, days: dayDiff(now.date, o.requiredBy) }))
    .filter((x) => x.days <= 3)
    .sort((a, b) => a.days - b.days);

  return (
    <section className="kw-view kw-view--narrow kw-screen">
      <h1 className="kw-h1">{t("handover.title")}</h1>
      <p className="kw-sub">
        {t("handover.sub", { date: dateFull(now.date), start: shift.start, end: shift.end })}
      </p>

      <div className="kw-hand__stats">
        <Kpi label={t("handover.good")} value={qtyNumber(good)} />
        <Kpi label={t("handover.seconds")} value={qtyNumber(seconds)} tone="warn" />
        <Kpi label={t("handover.yield")} value={pct(yieldPct(good, seconds))} tone="pos" />
      </div>

      <div className="kw-hand__panel">
        <Panel title={t("handover.onStations")}>
          {ALL_STATIONS.map((station) => {
            const on = runs.find(
              (r) => r.station === station.id && r.stage !== "complete" && r.stage !== "queued",
            );
            return (
              <div key={station.id} className="kw-hand__row">
                <Icon name={station.icon} size={15} />
                <span className="kw-hand__name">{stationName(station)}</span>
                <Mono style={{ color: on ? "var(--fg)" : "var(--fg-subtle)", fontSize: 12 }}>
                  {on
                    ? t("handover.stationLine", {
                        code: on.code,
                        good: qtyNumber(on.good),
                        qty: qtyNumber(on.qty),
                        stage: stageLabel(on.stage).toLowerCase(),
                      })
                    : t("handover.standingEmpty")}
                </Mono>
              </div>
            );
          })}
        </Panel>
      </div>

      <div className="kw-hand__panel">
        <Panel title={t("handover.next")}>
          <div className="kw-hand__stack">
            {flags.length === 0 && (
              <Notice tone="pos" icon={<Check size={14} aria-hidden="true" />}>
                {t("handover.nothingFlagged")}
              </Notice>
            )}
            {flags.map((flag, i) => (
              <Notice key={i} tone={flag.tone === "muted" ? "info" : flag.tone}>
                {flag.text}
              </Notice>
            ))}
          </div>
        </Panel>
      </div>

      <div className="kw-hand__panel">
        <Panel title={t("handover.written")}>
          <div className="kw-hand__moves">
            {kinds.map((kind) => {
              const mine = today.filter((m) => m.kind === kind);
              const amount = mine.reduce((sum, m) => sum + Math.abs(m.qty), 0);
              return (
                <div key={kind} className="kw-hand__move" style={{ opacity: mine.length ? 1 : 0.45 }}>
                  <div className="kw-firing__fact">{movementLabel(kind)}</div>
                  <Mono style={{ fontSize: 16, fontWeight: 700 }}>
                    {mine.length ? qtyNumber(Math.round(amount * 100) / 100) : "—"}
                  </Mono>
                  <div className="kw-itemcell__meta">
                    {t("handover.rows", {}, mine.length).replace("{count}", String(mine.length))}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {due.length > 0 && (
        <div className="kw-hand__panel">
          <Panel title={t("handover.due")}>
            {due.map((x) => (
              <div key={x.order.code} className="kw-hand__row">
                <Mono style={{ fontWeight: 700, fontSize: 12 }}>{x.order.code}</Mono>
                <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
                  {customerById(x.order.customer)?.name}
                </span>
                <Mono style={{ marginInlineStart: "auto", fontSize: 11.5, color: "var(--fg-subtle)" }}>
                  {x.order.requiredBy}
                </Mono>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: x.days <= 1 ? "var(--danger)" : "var(--warn)",
                    minInlineSize: 66,
                    textAlign: "end",
                  }}
                >
                  {x.days <= 0
                    ? t("chrome.dueToday")
                    : t("chrome.inDays", {}, x.days).replace("{count}", String(x.days))}
                </span>
              </div>
            ))}
          </Panel>
        </div>
      )}

      <div className="kw-hand__panel">
        <Panel title={t("handover.anything")}>
          <textarea
            className="kw-textarea kw-fld"
            value={note}
            placeholder={t("handover.placeholder")}
            onChange={(e) => setHandoverNote(e.target.value)}
          />
          <div style={{ marginBlockStart: 12 }}>
            <Button block disabled={signed} onClick={signHandover}>
              <Check size={15} aria-hidden="true" />
              {signed
                ? t("handover.signed", { time: clock(now.minutes), name: DESK_STAFF.floor.name })
                : t("handover.sign")}
            </Button>
          </div>
        </Panel>
      </div>
    </section>
  );
}
