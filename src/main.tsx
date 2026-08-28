/*
 * Entry point.
 *
 * The four global stylesheets are imported here, before `App`, so the cascade
 * order is deterministic in the built bundle: tokens (custom properties) →
 * base (reset, fonts, behaviour classes) → components (shared UI) → screens
 * (view-specific rules, which therefore always win a tie).
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/screens.css";

import { I18nProvider } from "./i18n/index.tsx";
import { setDataSource } from "./data/source.ts";
import { clientFromEnv, loadSnapshot, snapshotSource } from "./data/adminiumSource.ts";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root — check index.html");

/*
 * ONE condition decides demo vs connected: whether the API base URL and key are
 * present at build time. `createPublicClient` returns null when either is
 * missing, so the fallback is structural rather than a catch, and there is no
 * second flag to drift. The marketplace demo builds set neither and behave
 * byte-identically to before this file changed.
 *
 * The dynamic `import()` of `App` is load-bearing, not stylistic: `App` pulls
 * the store, which reads the data source at MODULE SCOPE. A static import would
 * evaluate it during this module's own imports — before the fetch below could
 * resolve — and the app would render demo data whatever the server said. The
 * `await` has to sit between the swap and the import, so the import has to be
 * dynamic. `setDataSource` throws if that ordering is ever broken, because the
 * failure is otherwise silent and looks exactly like a working app.
 */
async function boot(): Promise<void> {
  const client = clientFromEnv();
  if (client !== null) {
    const snap = await loadSnapshot(client);
    if (snap !== null) {
      setDataSource(snapshotSource(snap));
      console.info(
        `[adminium] connected: ${String(snap.items.length)} items, ` +
          `${String(snap.runs.length)} runs, ${String(snap.salesOrders.length)} sales orders`,
      );
    }
  }

  /*
   * REGISTER THE ADD-ONS BEFORE THE FIRST RENDER, and after the same dynamic
   * boundary the store is behind.
   *
   * Both halves matter. `demoAddOns()` merges each add-on's eight-locale bundle
   * into the host's at module load and THROWS if one is short a locale, so it
   * has to happen where a boot failure is a boot failure rather than a blank
   * screen inside a component. And it has to be a dynamic import for the reason
   * `App`'s is: this module reaches the store, which reads `DataSource` at
   * module scope, and a static import here would evaluate that before the
   * `await` above could swap a connected source in.
   */
  const [{ demoAddOns }, { useStore }] = await Promise.all([
    import("./add-ons/registry.ts"),
    import("./state/store.ts"),
  ]);
  useStore.getState().registerAddOns(demoAddOns());

  const { default: App } = await import("./app/App.tsx");
  createRoot(container as HTMLElement).render(
    <StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
}

void boot();
