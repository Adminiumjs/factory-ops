/**
 * The small shared pieces: buttons, chips, panels, fields, tiles, KPI cards,
 * bars, grid rows and empty states.
 *
 * They are grouped in one module rather than one file each because none of them
 * is more than a handful of lines and they are always imported together.
 * Anything with real behaviour — the shell, the dock, the overlays — lives in
 * its own file.
 */

import type { CSSProperties, ReactNode } from "react";
import {
  Box,
  Circle,
  CircleDot,
  Coffee,
  Columns2,
  Flame,
  Hammer,
  Layers,
  Milk,
  PaintBucket,
  Paintbrush,
  Scroll,
  Soup,
  Square,
  Stamp,
  Utensils,
} from "lucide-react";

import type { Item } from "../data/types.ts";
import { COMPONENT_TILE, glazeTile, itemName } from "../lib/format.ts";
import { glazeById } from "../state/store.ts";

/* ------------------------------------------------------------------ icons */

/**
 * The seed stores a Lucide icon NAME, and this table turns it into a component.
 * Written out rather than imported dynamically so the bundle only carries the
 * icons this app actually draws — and so a typo in the seed is caught here
 * rather than rendering nothing at all.
 */
const ICONS = {
  box: Box,
  circle: Circle,
  "circle-dot": CircleDot,
  coffee: Coffee,
  "columns-2": Columns2,
  flame: Flame,
  hammer: Hammer,
  layers: Layers,
  milk: Milk,
  "paint-bucket": PaintBucket,
  paintbrush: Paintbrush,
  scroll: Scroll,
  soup: Soup,
  square: Square,
  stamp: Stamp,
  utensils: Utensils,
} as const;

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const Cmp = ICONS[name as keyof typeof ICONS] ?? Circle;
  return <Cmp size={size} aria-hidden="true" />;
}

/* ----------------------------------------------------------------- button */

type Tone = "accent" | "ghost" | "soft" | "warn";

export function Button({
  children,
  onClick,
  tone = "accent",
  size,
  block,
  disabled,
  title,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: Tone;
  size?: "sm";
  block?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const cls = [
    "kw-button",
    "kw-btn",
    tone === "accent" ? "" : `kw-button--${tone}`,
    size === "sm" ? "kw-button--sm" : "",
    block ? "kw-button--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  label,
  small,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  small?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`kw-iconbtn kw-btn${small ? " kw-iconbtn--sm" : ""} ${className}`.trim()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- chip */

export function Chip({
  children,
  tone,
  outline,
  style,
}: {
  children: ReactNode;
  tone?: "pos" | "warn" | "danger" | "info" | "accent";
  outline?: boolean;
  style?: CSSProperties;
}) {
  const cls = [
    "kw-chip",
    tone ? `kw-chip--${tone}` : "",
    outline ? "kw-chip--outline" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}

/** A filter pill. `pressed` takes the accent, so a live filter is obvious. */
export function Filter({
  children,
  count,
  pressed,
  onClick,
}: {
  children: ReactNode;
  count?: ReactNode;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="kw-filter kw-btn" aria-pressed={pressed} onClick={onClick}>
      {children}
      {count !== undefined && <span className="kw-filter__count">{count}</span>}
    </button>
  );
}

/** An amount, a date, a code — anything that must not be re-ordered by bidi. */
export function Mono({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`kw-mono ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ panel */

export function Panel({
  title,
  meta,
  actions,
  children,
  bodyless,
  className = "",
}: {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Skip the padded body — for a panel whose content is its own grid. */
  bodyless?: boolean;
  className?: string;
}) {
  return (
    <section className={`kw-panel ${className}`.trim()}>
      {title !== undefined && (
        <header className="kw-panel__head">
          <h2 className="kw-panel__title">{title}</h2>
          {meta !== undefined && <span className="kw-panel__sub">{meta}</span>}
          {actions !== undefined && (
            <div style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>{actions}</div>
          )}
        </header>
      )}
      {bodyless ? children : <div className="kw-panel__body">{children}</div>}
    </section>
  );
}

/* --------------------------------------------------------------- KPI card */

export function Kpi({
  label,
  value,
  hint,
  tone,
  large,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "pos" | "warn" | "danger" | "muted";
  large?: boolean;
}) {
  return (
    <div className="kw-kpi">
      <div className="kw-kpi__label">{label}</div>
      <div
        className={`kw-kpi__value${large ? " kw-kpi__value--lg" : ""}`}
        style={tone ? { color: tone === "muted" ? "var(--fg-muted)" : `var(--${tone})` } : undefined}
      >
        {value}
      </div>
      {hint !== undefined && <div className="kw-kpi__hint">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ tiles */

/**
 * A piece is its glaze. A finished good gets the two-stop gradient of the glaze
 * it is finished in — the same two stops everywhere that piece appears — and a
 * component gets a flat, utilitarian surface instead, so a bag of clay and a
 * dinner plate never read as the same kind of thing.
 */
export function Tile({
  item,
  size = 34,
  icon = 17,
  badge,
  showSku,
}: {
  item: Item | null;
  size?: number;
  icon?: number;
  badge?: ReactNode;
  showSku?: boolean;
}) {
  if (item === null) {
    return <span className="kw-tile kw-tile--component" style={{ width: size, height: size }} />;
  }
  const glaze = item.kind === "product" ? glazeById(item.glaze) : null;
  const background = glaze ? glazeTile(glaze.from, glaze.to) : COMPONENT_TILE;
  return (
    <span
      className={`kw-tile${item.kind === "component" ? " kw-tile--component" : ""}`}
      style={{ width: size, height: size, background }}
      aria-hidden="true"
    >
      <Icon name={item.icon} size={icon} />
      {showSku === true && size >= 46 && <span className="kw-tile__sku">{item.sku}</span>}
      {badge !== undefined && <span className="kw-tile__badge">{badge}</span>}
    </span>
  );
}

/** A tile plus the SKU-over-name pair every table leads with. */
export function ItemCell({
  item,
  meta,
  size = 34,
}: {
  item: Item | null;
  meta?: ReactNode;
  size?: number;
}) {
  return (
    <div className="kw-itemcell">
      <Tile item={item} size={size} icon={Math.round(size / 2)} />
      <div className="kw-itemcell__body">
        <div className="kw-itemcell__sku">{item?.sku}</div>
        <div className="kw-itemcell__name">{itemName(item)}</div>
        {meta !== undefined && <div className="kw-itemcell__meta">{meta}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- bars */

export function Bar({
  pct,
  tone,
  thin,
  label,
}: {
  pct: number;
  tone?: "pos" | "warn" | "danger" | "muted";
  thin?: boolean;
  label?: { text: string; color: string };
}) {
  return (
    <div>
      <div className={`kw-bar${thin === true ? " kw-bar--thin" : ""}`}>
        <div
          className={`kw-bar__fill${tone ? ` kw-bar__fill--${tone}` : ""}`}
          style={{ inlineSize: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      {label !== undefined && (
        <div className="kw-bar__label" style={{ color: label.color }}>
          {label.text}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- fields */

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="kw-field">
      <span className="kw-label">{label}</span>
      {children}
    </label>
  );
}

/** A read-only twin of a field — a live yield, a computed margin. */
export function Readout({
  label,
  children,
  color,
}: {
  label: string;
  children: ReactNode;
  color?: string;
}) {
  return (
    <div className="kw-field">
      <span className="kw-label">{label}</span>
      <div className="kw-readout" style={color !== undefined ? { color } : undefined}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ empty state */

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="kw-empty">
      <div className="kw-empty__title">{title}</div>
      {body !== undefined && <p className="kw-empty__body">{body}</p>}
    </div>
  );
}

/** The line that tells a reader what this workspace deliberately is not. */
export function Honest({ children }: { children: ReactNode }) {
  return <p className="kw-honest">{children}</p>;
}

/** An honest inline explanation — a refusal, a warning, a confirmation. */
export function Notice({
  tone,
  icon,
  children,
}: {
  tone: "danger" | "warn" | "info" | "pos";
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`kw-notice kw-notice--${tone}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------- segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  full,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className={`kw-seg${full === true ? " kw-seg--full" : ""}`} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="kw-seg__btn"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
