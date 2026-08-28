/**
 * The Works screen: where the works is, and what it is connected to.
 *
 * ── THIS SCREEN HAD TO BE BUILT, NOT FOUND ─────────────────────────────────
 *
 * The desk had no settings screen of any kind. That is not an oversight in a
 * works desk — a floor lead and an office clerk have nothing to configure, and
 * every number on every other screen comes out of the order book — but
 * `settings.add-on.panel` is `surface: admin`, `fill: per-add-on`, and an
 * add-on that renders its own form needs somewhere to render it. So the surface
 * is new, and the first thing on it is deliberately NOT an add-on.
 *
 * ── IT IS FINISHED WITH NOTHING CONNECTED (24 D6) ──────────────────────────
 *
 * The works' own address is the top half of this screen and it is a host fact:
 * it is on every label and every delivery note whether or not a carrier exists,
 * it is what the Dispatch card prints when a customer is collecting, and it is
 * read through `DataSource` like everything else. A reader who never connects
 * anything still has a screen that tells them something true.
 *
 * The bottom half then lists whatever registered — and with an empty registry
 * it says, in words, that nothing is connected and that orders leave the way
 * they always have. An empty state that reads as a finished sentence rather
 * than as a gap is the whole of D6 on one screen.
 *
 * ── AND IT NAMES NO COMPANY ────────────────────────────────────────────────
 *
 * Every string below is either the works' own copy or something read off the
 * add-on object: `addOn.name`, `addOn.monogram`, `addOn.lineKey`, its
 * permission keys, and the two sentences it supplies about disconnecting.
 * Swapping the carrier for another one changes one import in
 * `add-ons/registry.ts` and nothing here. `Affiliation` is what pairs the name
 * with the line saying who is and is not involved (24 D12, AC6), and it is
 * rendered by the same component that prints the name rather than a section
 * further down — a disclaimer a reader has to scroll to is a disclaimer that
 * was not on the surface where they met the name.
 */

import { Check, Plug, Unplug } from "lucide-react";

import { AddOnSlot } from "../add-ons/AddOnSlot.tsx";
import { catalogueSamples } from "../add-ons/hostRecords.ts";
import type { AddOn } from "../add-ons/vendor/host/index.ts";
import { useI18n } from "../i18n/index.tsx";
import { Button, Chip, Empty, Panel } from "../components/Primitives.tsx";
import { WORKS, useStore } from "../state/store.ts";

/**
 * The one thing every surface naming a company owes its reader.
 *
 * Nominative use is the permission — a works may say what it is connected to —
 * and this sentence is the condition attached to it. It takes the add-on's own
 * `name` rather than a hard-coded string for the reason everything else here
 * does: the host does not know which company it is talking about, and a rule
 * that had to be re-typed per add-on is a rule that gets missed on the fourth.
 */
function Affiliation({ addOn }: { addOn: AddOn }) {
  const { t } = useI18n();
  if (!addOn.namesCompany) return null;
  return (
    <p className="kw-addon-row__note" style={{ marginBlockStart: 2 }}>
      {t("addon.host.affiliation", { name: addOn.name })}
    </p>
  );
}

/** What an add-on is asking to be allowed to do, in its own words. */
function Permissions({ addOn }: { addOn: AddOn }) {
  const { t } = useI18n();
  if (addOn.permissions.length === 0) return null;
  return (
    <div className="kw-addon-row__section">
      <div className="kw-order__fact">{t("addon.host.allows")}</div>
      <ul className="kw-addon-row__note" style={{ margin: 0, paddingInlineStart: 18 }}>
        {addOn.permissions.map((permission) => (
          <li key={permission.key}>{t(permission.key as never)}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * What a disconnect takes away and what it leaves behind (24 D16).
 *
 * BOTH SENTENCES ARE THE ADD-ON'S, and both are shown BEFORE the button rather
 * than in a dialog after it. A works reading "collections already booked keep
 * their labels" while deciding is better served than one reading it while
 * confirming, and the rule the sentences exist for — disconnecting destroys no
 * records — is a promise about the store, kept there: `disconnectAddOn` touches
 * two sets of keys and nothing the works owns.
 */
function Disconnecting({ addOn }: { addOn: AddOn }) {
  const { t } = useI18n();
  if (addOn.disconnect === undefined) return null;
  return (
    <div className="kw-addon-row__section">
      <div className="kw-order__fact">{t("addon.host.goes")}</div>
      <p className="kw-addon-row__note">{t(addOn.disconnect.goesKey as never)}</p>
      <div className="kw-order__fact" style={{ marginBlockStart: 8 }}>
        {t("addon.host.stays")}
      </div>
      <p className="kw-addon-row__note">{t(addOn.disconnect.staysKey as never)}</p>
    </div>
  );
}

function AddOnRow({ addOn }: { addOn: AddOn }) {
  const { t } = useI18n();
  const items = useStore((s) => s.items);
  const enabled = useStore((s) => s.enabled);
  const credentialled = useStore((s) => s.credentialled);
  const connectAddOn = useStore((s) => s.connectAddOn);
  const disconnectAddOn = useStore((s) => s.disconnectAddOn);
  const toggleAddOn = useStore((s) => s.toggleAddOn);
  const patchAddOnSettings = useStore((s) => s.patchAddOnSettings);

  const isConnected = credentialled.has(addOn.key);
  const isOn = enabled.has(addOn.key);

  return (
    <div className="kw-addon-row">
      <div className="kw-addon-row__head">
        {/* Three letters on a neutral tile — never a mark, drawn or traced. */}
        <span className="kw-addon-row__monogram" aria-hidden="true">
          {addOn.monogram}
        </span>
        <div className="kw-addon-row__text">
          <div className="kw-addon-row__name">{addOn.name}</div>
          <div className="kw-addon-row__line">{t(addOn.lineKey as never)}</div>
          <Affiliation addOn={addOn} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
          {isConnected ? (
            <Chip tone={isOn ? "pos" : undefined}>
              {isOn ? (
                <>
                  <Check size={11} aria-hidden="true" />
                  {t("addon.host.connected")}
                </>
              ) : (
                t("addon.host.stopped")
              )}
            </Chip>
          ) : null}
          {isConnected ? (
            <Button tone="soft" size="sm" onClick={() => toggleAddOn(addOn.key)}>
              {isOn ? t("addon.host.switchOff") : t("addon.host.switchOn")}
            </Button>
          ) : (
            <Button size="sm" onClick={() => connectAddOn(addOn.key)}>
              <Plug size={13} aria-hidden="true" />
              {t("addon.host.connect")}
            </Button>
          )}
        </div>
      </div>

      {isConnected && (
        <>
          <div className="kw-addon-row__section">
            <div className="kw-order__fact" style={{ marginBlockEnd: 8 }}>
              {t("addon.host.settings")}
            </div>
            {/*
              SLOT — `settings.add-on.panel`, scoped to the add-on this row is
              about. The add-on draws its own form and the sentence under every
              control; this screen owns the heading above it and the button
              below, and nothing else.

              IT SPEAKS WHEN EMPTY, matching `SLOT_EMPTY_BEHAVIOUR`: the heading
              is drawn unconditionally, so an add-on that fills no panel would
              otherwise leave a heading with a gap under it, which is a hole
              rather than a finished screen.

              `samples` IS REQUIRED and this is why the mount computes one: the
              second host in the fleet once passed `{ patch }` alone, `tsc` was
              happy, and the carrier's settings form threw on `.map`. The works
              says what one of a thing is; the add-on says what a parcel of them
              weighs, with its own engine.
             */}
            <AddOnSlot
              slot="settings.add-on.panel"
              forAddOn={addOn.key}
              payload={{
                patch: (values: Record<string, unknown>) =>
                  patchAddOnSettings(addOn.key, values),
                samples: catalogueSamples(items),
              }}
              fallback={<p className="kw-addon-row__note">{t("addon.host.noSettings")}</p>}
            />
          </div>

          <Permissions addOn={addOn} />
          <Disconnecting addOn={addOn} />

          <div>
            <Button tone="soft" size="sm" onClick={() => disconnectAddOn(addOn.key)}>
              <Unplug size={13} aria-hidden="true" />
              {t("addon.host.disconnect")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function Works() {
  const { t } = useI18n();
  const registry = useStore((s) => s.registry);

  return (
    <section className="kw-view kw-view--mid kw-screen">
      <h1 className="kw-h1">{t("addon.host.works.title")}</h1>
      <p className="kw-sub">{t("addon.host.works.sub")}</p>

      <div className="kw-stack" style={{ marginBlockStart: 18 }}>
        <Panel title={t("addon.host.address.title")}>
          <div className="kw-shipto" style={{ fontSize: 13 }}>
            <div className="kw-shipto__name">{WORKS.name}</div>
            {WORKS.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            <div>
              {WORKS.city} <span className="kw-shipto__post">{WORKS.postcode}</span>
            </div>
          </div>
          <p className="kw-addon-row__note" style={{ marginBlockStart: 10 }}>
            {t("addon.host.address.note")}
          </p>
        </Panel>

        <Panel title={t("addon.host.addons.title")} meta={t("addon.host.addons.sub")}>
          {registry.all.length === 0 ? (
            <Empty title={t("addon.host.addons.none")} />
          ) : (
            <div className="kw-stack">
              {registry.all.map((addOn) => (
                <AddOnRow key={addOn.key} addOn={addOn} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </section>
  );
}

export default Works;
