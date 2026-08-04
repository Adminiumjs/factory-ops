/**
 * The 404.
 *
 * Reachable only from injected state — every nav item and search hit lands on a
 * member of the `View` union — so it exists to be honest rather than to be
 * found. It says what happened and offers the one way back.
 */

import { useI18n } from "../i18n/index.tsx";
import { Button, Mono } from "../components/Primitives.tsx";
import { useStore } from "../state/store.ts";

export default function NotFound() {
  const { t } = useI18n();
  const go = useStore((s) => s.go);
  const setPersona = useStore((s) => s.setPersona);

  return (
    <section className="kw-404 kw-screen">
      <Mono className="kw-404__code">{t("notfound.code")}</Mono>
      <h1 className="kw-404__title">{t("notfound.title")}</h1>
      <p className="kw-404__body">{t("notfound.body")}</p>
      <Button
        onClick={() => {
          setPersona("floor");
          go("board");
        }}
      >
        {t("notfound.action")}
      </Button>
    </section>
  );
}
