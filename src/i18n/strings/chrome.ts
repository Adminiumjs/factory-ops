/**
 * Area bundle: **chrome**.
 *
 * Everything outside a screen's own body — the two shells, the navigation, the
 * demo dock, the toasts, and every status word the app puts in a pill. Screen
 * copy lives in `screens.ts`; the seed's own prose lives in `data.ts`.
 *
 * VOCABULARY. Kilnworks bans a short list of words in every language, not only
 * English (21 D10a). The one that will catch a translator out first is the
 * English word for a works — never use it; this is "the works", "the floor" or
 * "the site". The rest: no "production p·l·a·n" (say the schedule or the run
 * queue), no "p·l·a·n·n·e·r" (scheduler), no "p·r·i·c·i·n·g" (price list or
 * rates), no "b·i·l·l·i·n·g" (invoicing), no "t·i·e·r", no "u·p·g·r·a·d·e", and
 * no "f·r·e·e" in any form — which also rules out the usual phrase for stock
 * issued at no charge. Other languages carry their own versions of the same
 * traps: German Zeitp·l·a·n and T·i·e·r, French p·l·a·n, Danish p·l·a·n. The
 * translations below route around all of them on purpose, which is why some read
 * a shade more concrete than a literal rendering would.
 */
import type { LocaleTag } from "../locales.ts";

const EN = {
  /* --- brand and footer --- */
  "chrome.skipToContent": "Skip to content",
  "chrome.brand": "Kilnworks",
  "chrome.brand.desk": "Works desk",
  "chrome.footer.copy": "© 2026 Kilnworks. A demo works desk shipped with Adminium.",
  "chrome.footer.chip": "adminium.dev/demo/factory-ops",

  /* --- topbar --- */
  "chrome.search.placeholder": "Search SKUs, runs, orders…",
  "chrome.search.label": "Search the works",
  "chrome.search.empty": "Nothing matches “{query}”.",
  "chrome.search.runs": "Runs",
  "chrome.search.items": "Stock",
  "chrome.search.orders": "Orders",
  "chrome.menu.open": "Open navigation",
  "chrome.menu.close": "Close navigation",

  /* --- navigation --- */
  "chrome.nav.board": "Floor board",
  "chrome.nav.stations": "Stations",
  "chrome.nav.firings": "Firings",
  "chrome.nav.seconds": "Seconds",
  "chrome.nav.handover": "Handover",
  "chrome.nav.stock": "Stock",
  "chrome.nav.counts": "Counts",
  "chrome.nav.purchasing": "Purchasing",
  "chrome.nav.suppliers": "Suppliers",
  "chrome.nav.orders": "Orders",
  "chrome.nav.dispatch": "Dispatch",
  "chrome.nav.invoices": "Invoices",
  "chrome.nav.recipes": "Recipes",
  "chrome.nav.books": "The books",

  /* --- demo dock --- */
  "chrome.dock.title": "Demo controls",
  "chrome.dock.expand": "Show the demo controls",
  "chrome.dock.collapse": "Hide the demo controls",
  "chrome.dock.persona": "Who is at the desk",
  "chrome.dock.floor": "Floor",
  "chrome.dock.office": "Office",
  "chrome.dock.theme": "Theme",
  "chrome.dock.theme.light": "Switch to the light theme",
  "chrome.dock.theme.dark": "Switch to the dark theme",
  "chrome.dock.language": "Language",
  "chrome.dock.reset": "Reset the demo",
  "chrome.dock.shift": "Shift {start}–{end}",

  /* --- run stages --- */
  "chrome.stage.queued": "Queued",
  "chrome.stage.released": "Released",
  "chrome.stage.forming": "Forming",
  "chrome.stage.firing": "Firing",
  "chrome.stage.finishing": "Finishing",
  "chrome.stage.complete": "Complete",

  /* --- purchase order statuses --- */
  "chrome.po.draft": "Draft",
  "chrome.po.sent": "Sent",
  "chrome.po.part_received": "Part-received",
  "chrome.po.received": "Received",

  /* --- sales order statuses --- */
  "chrome.so.draft": "Draft",
  "chrome.so.confirmed": "Confirmed",
  "chrome.so.picking": "Picking",
  "chrome.so.shipped": "Shipped",
  "chrome.so.invoiced": "Invoiced",

  /* --- invoice statuses --- */
  "chrome.inv.paid": "Paid",
  "chrome.inv.overdue": "Overdue",
  "chrome.inv.part_paid": "Part-paid",
  "chrome.inv.sent": "Sent",

  /* --- movement kinds --- */
  "chrome.move.receipt": "Receipt",
  "chrome.move.issue": "Issue",
  "chrome.move.production": "Production",
  "chrome.move.shipment": "Shipment",
  "chrome.move.adjustment": "Adjustment",

  /* --- firing statuses --- */
  "chrome.fire.loading": "Loading",
  "chrome.fire.firing": "Firing",
  "chrome.fire.cooling": "Cooling",
  "chrome.fire.unloaded": "Unloaded",

  /* --- aging buckets --- */
  "chrome.bucket.current": "Current",
  "chrome.bucket.d1_30": "1–30 days",
  "chrome.bucket.d31_60": "31–60 days",
  "chrome.bucket.d61": "61+ days",

  /* --- order line allocation --- */
  "chrome.alloc.awaiting": "Awaiting",
  "chrome.alloc.making": "Making · {run}",
  "chrome.alloc.short": "SHORT BY {count}",
  "chrome.alloc.allocated": "Allocated",

  /* --- payment methods --- */
  "chrome.method.transfer": "Bank transfer",
  "chrome.method.card": "Card",
  "chrome.method.cheque": "Cheque",

  /* --- count sheet statuses --- */
  "chrome.count.open": "Open",
  "chrome.count.posted": "Posted",

  /* --- quantities of time --- */
  "chrome.mins": "{count} min|{count} min",
  "chrome.hrs": "{count} hr|{count} hrs",
  "chrome.nohold": "no hold",
  "chrome.daysOver": "{count} day over|{count} days over",
  "chrome.daysToRun": "{count} day to run|{count} days to run",
  "chrome.dueToday": "due today",
  "chrome.inDays": "in {count} day|in {count} days",

  /* --- small words --- */
  "chrome.close": "Close",
  "chrome.cancel": "Cancel",

  /* --- toasts --- */
  "chrome.toast.advanced": "{code} moved to {stage}",
  "chrome.toast.output": "{count} good unit on {code} · lot {lot}|{count} good units on {code} · lot {lot}",
  "chrome.toast.receivedFull": "{code} received in full",
  "chrome.toast.receivedPart": "{code} part-received · outstanding lines stay open",
  "chrome.toast.made": "{code} queued for {qty} × {sku}",
  "chrome.toast.orderAdvanced": "{code} → {status}",
  "chrome.toast.invoiceRaised": "{number} raised from {code}",
  "chrome.toast.shipped": "{code} shipped · stock issued and movements written",
  "chrome.toast.payment": "{amount} recorded against {number}",
  "chrome.toast.countPosted": "{code} posted · {count} line adjusted|{code} posted · {count} lines adjusted",
  "chrome.toast.poDrafted": "{code} drafted for {supplier} · {count} line|{code} drafted for {supplier} · {count} lines",
  "chrome.toast.signed": "Handover signed off in the demo · no signature is captured",
  "chrome.toast.reset": "The demo is back to how it started",
};

type Bundle = Record<keyof typeof EN, string>;

const DE: Bundle = {
  "chrome.skipToContent": "Zum Inhalt springen",
  "chrome.brand": "Kilnworks",
  "chrome.brand.desk": "Werkstattpult",
  "chrome.footer.copy":
    "© 2026 Kilnworks. Ein Demo-Werkstattpult, mitgeliefert von Adminium.",
  "chrome.footer.chip": "adminium.dev/demo/factory-ops",

  "chrome.search.placeholder": "Artikelnummern, Chargen, Aufträge suchen…",
  "chrome.search.label": "In der Werkstatt suchen",
  "chrome.search.empty": "Nichts passt zu „{query}“.",
  "chrome.search.runs": "Chargen",
  "chrome.search.items": "Bestand",
  "chrome.search.orders": "Aufträge",
  "chrome.menu.open": "Navigation öffnen",
  "chrome.menu.close": "Navigation schließen",

  "chrome.nav.board": "Hallenboard",
  "chrome.nav.stations": "Arbeitsplätze",
  "chrome.nav.firings": "Brände",
  "chrome.nav.seconds": "Ausschuss",
  "chrome.nav.handover": "Übergabe",
  "chrome.nav.stock": "Bestand",
  "chrome.nav.counts": "Zählungen",
  "chrome.nav.purchasing": "Einkauf",
  "chrome.nav.suppliers": "Lieferanten",
  "chrome.nav.orders": "Aufträge",
  "chrome.nav.dispatch": "Versand",
  "chrome.nav.invoices": "Rechnungen",
  "chrome.nav.recipes": "Rezepturen",
  "chrome.nav.books": "Die Zahlen",

  "chrome.dock.title": "Demo-Steuerung",
  "chrome.dock.expand": "Demo-Steuerung einblenden",
  "chrome.dock.collapse": "Demo-Steuerung ausblenden",
  "chrome.dock.persona": "Wer am Pult steht",
  "chrome.dock.floor": "Halle",
  "chrome.dock.office": "Büro",
  "chrome.dock.theme": "Darstellung",
  "chrome.dock.theme.light": "Zur hellen Darstellung wechseln",
  "chrome.dock.theme.dark": "Zur dunklen Darstellung wechseln",
  "chrome.dock.language": "Sprache",
  "chrome.dock.reset": "Demo zurücksetzen",
  "chrome.dock.shift": "Schicht {start}–{end}",

  "chrome.stage.queued": "In der Warteschlange",
  "chrome.stage.released": "Freigegeben",
  "chrome.stage.forming": "Formen",
  "chrome.stage.firing": "Brennen",
  "chrome.stage.finishing": "Nacharbeit",
  "chrome.stage.complete": "Fertig",

  "chrome.po.draft": "Entwurf",
  "chrome.po.sent": "Versendet",
  "chrome.po.part_received": "Teilweise eingegangen",
  "chrome.po.received": "Eingegangen",

  "chrome.so.draft": "Entwurf",
  "chrome.so.confirmed": "Bestätigt",
  "chrome.so.picking": "Kommissionierung",
  "chrome.so.shipped": "Versandt",
  "chrome.so.invoiced": "Berechnet",

  "chrome.inv.paid": "Bezahlt",
  "chrome.inv.overdue": "Überfällig",
  "chrome.inv.part_paid": "Teilbezahlt",
  "chrome.inv.sent": "Versendet",

  "chrome.move.receipt": "Wareneingang",
  "chrome.move.issue": "Entnahme",
  "chrome.move.production": "Fertigung",
  "chrome.move.shipment": "Warenausgang",
  "chrome.move.adjustment": "Korrektur",

  "chrome.fire.loading": "Wird beladen",
  "chrome.fire.firing": "Brennt",
  "chrome.fire.cooling": "Kühlt ab",
  "chrome.fire.unloaded": "Entladen",

  "chrome.bucket.current": "Laufend",
  "chrome.bucket.d1_30": "1–30 Tage",
  "chrome.bucket.d31_60": "31–60 Tage",
  "chrome.bucket.d61": "61+ Tage",

  "chrome.alloc.awaiting": "Offen",
  "chrome.alloc.making": "In Arbeit · {run}",
  "chrome.alloc.short": "ES FEHLEN {count}",
  "chrome.alloc.allocated": "Reserviert",

  "chrome.method.transfer": "Überweisung",
  "chrome.method.card": "Karte",
  "chrome.method.cheque": "Scheck",

  "chrome.count.open": "Offen",
  "chrome.count.posted": "Gebucht",

  "chrome.mins": "{count} Min.|{count} Min.",
  "chrome.hrs": "{count} Std.|{count} Std.",
  "chrome.nohold": "keine Haltezeit",
  "chrome.daysOver": "{count} Tag überfällig|{count} Tage überfällig",
  "chrome.daysToRun": "noch {count} Tag|noch {count} Tage",
  "chrome.dueToday": "heute fällig",
  "chrome.inDays": "in {count} Tag|in {count} Tagen",

  "chrome.close": "Schließen",
  "chrome.cancel": "Abbrechen",

  "chrome.toast.advanced": "{code} weiter zu {stage}",
  "chrome.toast.output":
    "{count} gutes Stück auf {code} · Los {lot}|{count} gute Stücke auf {code} · Los {lot}",
  "chrome.toast.receivedFull": "{code} vollständig eingegangen",
  "chrome.toast.receivedPart":
    "{code} teilweise eingegangen · offene Positionen bleiben offen",
  "chrome.toast.made": "{code} eingereiht für {qty} × {sku}",
  "chrome.toast.orderAdvanced": "{code} → {status}",
  "chrome.toast.invoiceRaised": "{number} aus {code} erstellt",
  "chrome.toast.shipped": "{code} versandt · Bestand entnommen und Bewegungen gebucht",
  "chrome.toast.payment": "{amount} auf {number} verbucht",
  "chrome.toast.countPosted":
    "{code} gebucht · {count} Position korrigiert|{code} gebucht · {count} Positionen korrigiert",
  "chrome.toast.poDrafted":
    "{code} für {supplier} entworfen · {count} Position|{code} für {supplier} entworfen · {count} Positionen",
  "chrome.toast.signed":
    "Übergabe in der Demo abgezeichnet · es wird keine Unterschrift erfasst",
  "chrome.toast.reset": "Die Demo ist wieder im Ausgangszustand",
};

const FR: Bundle = {
  "chrome.skipToContent": "Aller au contenu",
  "chrome.brand": "Kilnworks",
  "chrome.brand.desk": "Poste d’atelier",
  "chrome.footer.copy":
    "© 2026 Kilnworks. Un poste d’atelier de démonstration livré avec Adminium.",
  "chrome.footer.chip": "adminium.dev/demo/factory-ops",

  "chrome.search.placeholder": "Rechercher références, séries, commandes…",
  "chrome.search.label": "Rechercher dans l’atelier",
  "chrome.search.empty": "Rien ne correspond à « {query} ».",
  "chrome.search.runs": "Séries",
  "chrome.search.items": "Stock",
  "chrome.search.orders": "Commandes",
  "chrome.menu.open": "Ouvrir la navigation",
  "chrome.menu.close": "Fermer la navigation",

  "chrome.nav.board": "Tableau d’atelier",
  "chrome.nav.stations": "Postes",
  "chrome.nav.firings": "Cuissons",
  "chrome.nav.seconds": "Rebuts",
  "chrome.nav.handover": "Passation",
  "chrome.nav.stock": "Stock",
  "chrome.nav.counts": "Inventaires",
  "chrome.nav.purchasing": "Achats",
  "chrome.nav.suppliers": "Fournisseurs",
  "chrome.nav.orders": "Commandes",
  "chrome.nav.dispatch": "Expédition",
  "chrome.nav.invoices": "Factures",
  "chrome.nav.recipes": "Recettes",
  "chrome.nav.books": "Les comptes",

  "chrome.dock.title": "Commandes de démonstration",
  "chrome.dock.expand": "Afficher les commandes de démonstration",
  "chrome.dock.collapse": "Masquer les commandes de démonstration",
  "chrome.dock.persona": "Qui tient le poste",
  "chrome.dock.floor": "Atelier",
  "chrome.dock.office": "Bureau",
  "chrome.dock.theme": "Thème",
  "chrome.dock.theme.light": "Passer au thème clair",
  "chrome.dock.theme.dark": "Passer au thème sombre",
  "chrome.dock.language": "Langue",
  "chrome.dock.reset": "Réinitialiser la démonstration",
  "chrome.dock.shift": "Poste {start}–{end}",

  "chrome.stage.queued": "En attente",
  "chrome.stage.released": "Lancée",
  "chrome.stage.forming": "Façonnage",
  "chrome.stage.firing": "Cuisson",
  "chrome.stage.finishing": "Finition",
  "chrome.stage.complete": "Terminée",

  "chrome.po.draft": "Brouillon",
  "chrome.po.sent": "Envoyée",
  "chrome.po.part_received": "Reçue en partie",
  "chrome.po.received": "Reçue",

  "chrome.so.draft": "Brouillon",
  "chrome.so.confirmed": "Confirmée",
  "chrome.so.picking": "Préparation",
  "chrome.so.shipped": "Expédiée",
  "chrome.so.invoiced": "Facturée",

  "chrome.inv.paid": "Réglée",
  "chrome.inv.overdue": "En retard",
  "chrome.inv.part_paid": "Réglée en partie",
  "chrome.inv.sent": "Envoyée",

  "chrome.move.receipt": "Réception",
  "chrome.move.issue": "Sortie",
  "chrome.move.production": "Fabrication",
  "chrome.move.shipment": "Expédition",
  "chrome.move.adjustment": "Ajustement",

  "chrome.fire.loading": "Enfournement",
  "chrome.fire.firing": "En cuisson",
  "chrome.fire.cooling": "Refroidissement",
  "chrome.fire.unloaded": "Défournée",

  "chrome.bucket.current": "À échoir",
  "chrome.bucket.d1_30": "1–30 jours",
  "chrome.bucket.d31_60": "31–60 jours",
  "chrome.bucket.d61": "61+ jours",

  "chrome.alloc.awaiting": "En attente",
  "chrome.alloc.making": "En fabrication · {run}",
  "chrome.alloc.short": "IL MANQUE {count}",
  "chrome.alloc.allocated": "Réservée",

  "chrome.method.transfer": "Virement",
  "chrome.method.card": "Carte",
  "chrome.method.cheque": "Chèque",

  "chrome.count.open": "Ouvert",
  "chrome.count.posted": "Comptabilisé",

  "chrome.mins": "{count} min|{count} min",
  "chrome.hrs": "{count} h|{count} h",
  "chrome.nohold": "sans palier",
  "chrome.daysOver": "{count} jour de retard|{count} jours de retard",
  "chrome.daysToRun": "encore {count} jour|encore {count} jours",
  "chrome.dueToday": "échue aujourd’hui",
  "chrome.inDays": "dans {count} jour|dans {count} jours",

  "chrome.close": "Fermer",
  "chrome.cancel": "Annuler",

  "chrome.toast.advanced": "{code} passe à {stage}",
  "chrome.toast.output":
    "{count} pièce bonne sur {code} · lot {lot}|{count} pièces bonnes sur {code} · lot {lot}",
  "chrome.toast.receivedFull": "{code} reçue en totalité",
  "chrome.toast.receivedPart":
    "{code} reçue en partie · les lignes restantes restent ouvertes",
  "chrome.toast.made": "{code} mise en file pour {qty} × {sku}",
  "chrome.toast.orderAdvanced": "{code} → {status}",
  "chrome.toast.invoiceRaised": "{number} établie à partir de {code}",
  "chrome.toast.shipped":
    "{code} expédiée · stock sorti et mouvements enregistrés",
  "chrome.toast.payment": "{amount} enregistré sur {number}",
  "chrome.toast.countPosted":
    "{code} comptabilisé · {count} ligne ajustée|{code} comptabilisé · {count} lignes ajustées",
  "chrome.toast.poDrafted":
    "{code} rédigée pour {supplier} · {count} ligne|{code} rédigée pour {supplier} · {count} lignes",
  "chrome.toast.signed":
    "Passation signée dans la démonstration · aucune signature n’est enregistrée",
  "chrome.toast.reset": "La démonstration est revenue à son état initial",
};

const CS: Bundle = {
  "chrome.skipToContent": "Přejít na obsah",
  "chrome.brand": "Kilnworks",
  "chrome.brand.desk": "Dílenský pult",
  "chrome.footer.copy":
    "© 2026 Kilnworks. Ukázkový dílenský pult dodávaný s Adminiem.",
  "chrome.footer.chip": "adminium.dev/demo/factory-ops",

  "chrome.search.placeholder": "Hledat kódy, dávky, objednávky…",
  "chrome.search.label": "Hledat v dílně",
  "chrome.search.empty": "Nic neodpovídá „{query}“.",
  "chrome.search.runs": "Dávky",
  "chrome.search.items": "Sklad",
  "chrome.search.orders": "Objednávky",
  "chrome.menu.open": "Otevřít navigaci",
  "chrome.menu.close": "Zavřít navigaci",

  "chrome.nav.board": "Dílenská tabule",
  "chrome.nav.stations": "Pracoviště",
  "chrome.nav.firings": "Výpaly",
  "chrome.nav.seconds": "Zmetky",
  "chrome.nav.handover": "Předávka",
  "chrome.nav.stock": "Sklad",
  "chrome.nav.counts": "Inventury",
  "chrome.nav.purchasing": "Nákup",
  "chrome.nav.suppliers": "Dodavatelé",
  "chrome.nav.orders": "Objednávky",
  "chrome.nav.dispatch": "Expedice",
  "chrome.nav.invoices": "Faktury",
  "chrome.nav.recipes": "Receptury",
  "chrome.nav.books": "Peníze",

  "chrome.dock.title": "Ovládání ukázky",
  "chrome.dock.expand": "Zobrazit ovládání ukázky",
  "chrome.dock.collapse": "Skrýt ovládání ukázky",
  "chrome.dock.persona": "Kdo je u pultu",
  "chrome.dock.floor": "Dílna",
  "chrome.dock.office": "Kancelář",
  "chrome.dock.theme": "Motiv",
  "chrome.dock.theme.light": "Přepnout na světlý motiv",
  "chrome.dock.theme.dark": "Přepnout na tmavý motiv",
  "chrome.dock.language": "Jazyk",
  "chrome.dock.reset": "Obnovit ukázku",
  "chrome.dock.shift": "Směna {start}–{end}",

  "chrome.stage.queued": "Ve frontě",
  "chrome.stage.released": "Uvolněno",
  "chrome.stage.forming": "Tvarování",
  "chrome.stage.firing": "Výpal",
  "chrome.stage.finishing": "Dokončování",
  "chrome.stage.complete": "Hotovo",

  "chrome.po.draft": "Koncept",
  "chrome.po.sent": "Odesláno",
  "chrome.po.part_received": "Částečně přijato",
  "chrome.po.received": "Přijato",

  "chrome.so.draft": "Koncept",
  "chrome.so.confirmed": "Potvrzeno",
  "chrome.so.picking": "Vychystávání",
  "chrome.so.shipped": "Odesláno",
  "chrome.so.invoiced": "Fakturováno",

  "chrome.inv.paid": "Uhrazeno",
  "chrome.inv.overdue": "Po splatnosti",
  "chrome.inv.part_paid": "Částečně uhrazeno",
  "chrome.inv.sent": "Odesláno",

  "chrome.move.receipt": "Příjem",
  "chrome.move.issue": "Výdej",
  "chrome.move.production": "Výroba",
  "chrome.move.shipment": "Expedice",
  "chrome.move.adjustment": "Oprava",

  "chrome.fire.loading": "Sázení",
  "chrome.fire.firing": "Pálí se",
  "chrome.fire.cooling": "Chladne",
  "chrome.fire.unloaded": "Vysázeno",

  "chrome.bucket.current": "V termínu",
  "chrome.bucket.d1_30": "1–30 dní",
  "chrome.bucket.d31_60": "31–60 dní",
  "chrome.bucket.d61": "61+ dní",

  "chrome.alloc.awaiting": "Čeká",
  "chrome.alloc.making": "Vyrábí se · {run}",
  "chrome.alloc.short": "CHYBÍ {count}",
  "chrome.alloc.allocated": "Rezervováno",

  "chrome.method.transfer": "Převodem",
  "chrome.method.card": "Kartou",
  "chrome.method.cheque": "Šekem",

  "chrome.count.open": "Otevřená",
  "chrome.count.posted": "Zaúčtovaná",

  "chrome.mins": "{count} min|{count} min|{count} min",
  "chrome.hrs": "{count} h|{count} h|{count} h",
  "chrome.nohold": "bez výdrže",
  "chrome.daysOver":
    "{count} den po splatnosti|{count} dny po splatnosti|{count} dní po splatnosti",
  "chrome.daysToRun": "zbývá {count} den|zbývají {count} dny|zbývá {count} dní",
  "chrome.dueToday": "splatné dnes",
  "chrome.inDays": "za {count} den|za {count} dny|za {count} dní",

  "chrome.close": "Zavřít",
  "chrome.cancel": "Zrušit",

  "chrome.toast.advanced": "{code} postoupila do fáze {stage}",
  "chrome.toast.output":
    "{count} dobrý kus na {code} · šarže {lot}|{count} dobré kusy na {code} · šarže {lot}|{count} dobrých kusů na {code} · šarže {lot}",
  "chrome.toast.receivedFull": "{code} přijata v plné výši",
  "chrome.toast.receivedPart":
    "{code} přijata částečně · nedodané položky zůstávají otevřené",
  "chrome.toast.made": "{code} zařazena na {qty} × {sku}",
  "chrome.toast.orderAdvanced": "{code} → {status}",
  "chrome.toast.invoiceRaised": "{number} vystavena z {code}",
  "chrome.toast.shipped": "{code} odeslána · sklad vydán a pohyby zapsány",
  "chrome.toast.payment": "{amount} zapsáno k {number}",
  "chrome.toast.countPosted":
    "{code} zaúčtována · upravena {count} položka|{code} zaúčtována · upraveny {count} položky|{code} zaúčtována · upraveno {count} položek",
  "chrome.toast.poDrafted":
    "{code} připravena pro {supplier} · {count} položka|{code} připravena pro {supplier} · {count} položky|{code} připravena pro {supplier} · {count} položek",
  "chrome.toast.signed": "Předávka odsouhlasena v ukázce · žádný podpis se neukládá",
  "chrome.toast.reset": "Ukázka je zpět ve výchozím stavu",
};

const DA: Bundle = {
  "chrome.skipToContent": "Gå til indhold",
  "chrome.brand": "Kilnworks",
  "chrome.brand.desk": "Værkstedspult",
  "chrome.footer.copy":
    "© 2026 Kilnworks. En demo-værkstedspult, der følger med Adminium.",
  "chrome.footer.chip": "adminium.dev/demo/factory-ops",

  "chrome.search.placeholder": "Søg varenumre, serier, ordrer…",
  "chrome.search.label": "Søg i værkstedet",
  "chrome.search.empty": "Intet matcher “{query}”.",
  "chrome.search.runs": "Serier",
  "chrome.search.items": "Lager",
  "chrome.search.orders": "Ordrer",
  "chrome.menu.open": "Åbn navigation",
  "chrome.menu.close": "Luk navigation",

  "chrome.nav.board": "Værkstedstavle",
  "chrome.nav.stations": "Arbejdspladser",
  "chrome.nav.firings": "Brændinger",
  "chrome.nav.seconds": "Kassation",
  "chrome.nav.handover": "Overlevering",
  "chrome.nav.stock": "Lager",
  "chrome.nav.counts": "Optællinger",
  "chrome.nav.purchasing": "Indkøb",
  "chrome.nav.suppliers": "Leverandører",
  "chrome.nav.orders": "Ordrer",
  "chrome.nav.dispatch": "Forsendelse",
  "chrome.nav.invoices": "Fakturaer",
  "chrome.nav.recipes": "Opskrifter",
  "chrome.nav.books": "Pengene",

  "chrome.dock.title": "Demo-styring",
  "chrome.dock.expand": "Vis demo-styringen",
  "chrome.dock.collapse": "Skjul demo-styringen",
  "chrome.dock.persona": "Hvem står ved pulten",
  "chrome.dock.floor": "Værksted",
  "chrome.dock.office": "Kontor",
  "chrome.dock.theme": "Tema",
  "chrome.dock.theme.light": "Skift til lyst tema",
  "chrome.dock.theme.dark": "Skift til mørkt tema",
  "chrome.dock.language": "Sprog",
  "chrome.dock.reset": "Nulstil demoen",
  "chrome.dock.shift": "Vagt {start}–{end}",

  "chrome.stage.queued": "I kø",
  "chrome.stage.released": "Frigivet",
  "chrome.stage.forming": "Formning",
  "chrome.stage.firing": "Brænding",
  "chrome.stage.finishing": "Efterbehandling",
  "chrome.stage.complete": "Færdig",

  "chrome.po.draft": "Kladde",
  "chrome.po.sent": "Sendt",
  "chrome.po.part_received": "Delvist modtaget",
  "chrome.po.received": "Modtaget",

  "chrome.so.draft": "Kladde",
  "chrome.so.confirmed": "Bekræftet",
  "chrome.so.picking": "Plukning",
  "chrome.so.shipped": "Afsendt",
  "chrome.so.invoiced": "Faktureret",

  "chrome.inv.paid": "Betalt",
  "chrome.inv.overdue": "Forfalden",
  "chrome.inv.part_paid": "Delvist betalt",
  "chrome.inv.sent": "Sendt",

  "chrome.move.receipt": "Tilgang",
  "chrome.move.issue": "Udtag",
  "chrome.move.production": "Produktion",
  "chrome.move.shipment": "Afgang",
  "chrome.move.adjustment": "Regulering",

  "chrome.fire.loading": "Sættes ind",
  "chrome.fire.firing": "Brænder",
  "chrome.fire.cooling": "Køler af",
  "chrome.fire.unloaded": "Tømt",

  "chrome.bucket.current": "Ikke forfalden",
  "chrome.bucket.d1_30": "1–30 dage",
  "chrome.bucket.d31_60": "31–60 dage",
  "chrome.bucket.d61": "61+ dage",

  "chrome.alloc.awaiting": "Afventer",
  "chrome.alloc.making": "Under produktion · {run}",
  "chrome.alloc.short": "MANGLER {count}",
  "chrome.alloc.allocated": "Reserveret",

  "chrome.method.transfer": "Bankoverførsel",
  "chrome.method.card": "Kort",
  "chrome.method.cheque": "Check",

  "chrome.count.open": "Åben",
  "chrome.count.posted": "Bogført",

  "chrome.mins": "{count} min.|{count} min.",
  "chrome.hrs": "{count} t.|{count} t.",
  "chrome.nohold": "ingen holdetid",
  "chrome.daysOver": "{count} dag over|{count} dage over",
  "chrome.daysToRun": "{count} dag tilbage|{count} dage tilbage",
  "chrome.dueToday": "forfalder i dag",
  "chrome.inDays": "om {count} dag|om {count} dage",

  "chrome.close": "Luk",
  "chrome.cancel": "Annullér",

  "chrome.toast.advanced": "{code} rykket til {stage}",
  "chrome.toast.output":
    "{count} god enhed på {code} · parti {lot}|{count} gode enheder på {code} · parti {lot}",
  "chrome.toast.receivedFull": "{code} modtaget fuldt ud",
  "chrome.toast.receivedPart":
    "{code} delvist modtaget · restlinjer forbliver åbne",
  "chrome.toast.made": "{code} sat i kø til {qty} × {sku}",
  "chrome.toast.orderAdvanced": "{code} → {status}",
  "chrome.toast.invoiceRaised": "{number} oprettet ud fra {code}",
  "chrome.toast.shipped": "{code} afsendt · lager udtaget og bevægelser bogført",
  "chrome.toast.payment": "{amount} registreret på {number}",
  "chrome.toast.countPosted":
    "{code} bogført · {count} linje reguleret|{code} bogført · {count} linjer reguleret",
  "chrome.toast.poDrafted":
    "{code} oprettet til {supplier} · {count} linje|{code} oprettet til {supplier} · {count} linjer",
  "chrome.toast.signed": "Overlevering godkendt i demoen · ingen underskrift gemmes",
  "chrome.toast.reset": "Demoen er tilbage ved udgangspunktet",
};

const ZH_CN: Bundle = {
  "chrome.skipToContent": "跳到主要内容",
  "chrome.brand": "Kilnworks",
  "chrome.brand.desk": "车间工作台",
  "chrome.footer.copy": "© 2026 Kilnworks。随 Adminium 提供的车间演示工作台。",
  "chrome.footer.chip": "adminium.dev/demo/factory-ops",

  "chrome.search.placeholder": "搜索料号、批次、订单…",
  "chrome.search.label": "在车间中搜索",
  "chrome.search.empty": "没有与“{query}”匹配的内容。",
  "chrome.search.runs": "批次",
  "chrome.search.items": "库存",
  "chrome.search.orders": "订单",
  "chrome.menu.open": "打开导航",
  "chrome.menu.close": "关闭导航",

  "chrome.nav.board": "车间看板",
  "chrome.nav.stations": "工位",
  "chrome.nav.firings": "窑烧",
  "chrome.nav.seconds": "次品",
  "chrome.nav.handover": "交班",
  "chrome.nav.stock": "库存",
  "chrome.nav.counts": "盘点",
  "chrome.nav.purchasing": "采购",
  "chrome.nav.suppliers": "供应商",
  "chrome.nav.orders": "订单",
  "chrome.nav.dispatch": "发货",
  "chrome.nav.invoices": "发票",
  "chrome.nav.recipes": "配方",
  "chrome.nav.books": "账面",

  "chrome.dock.title": "演示控件",
  "chrome.dock.expand": "显示演示控件",
  "chrome.dock.collapse": "隐藏演示控件",
  "chrome.dock.persona": "谁在台前",
  "chrome.dock.floor": "车间",
  "chrome.dock.office": "办公室",
  "chrome.dock.theme": "主题",
  "chrome.dock.theme.light": "切换到浅色主题",
  "chrome.dock.theme.dark": "切换到深色主题",
  "chrome.dock.language": "语言",
  "chrome.dock.reset": "重置演示",
  "chrome.dock.shift": "班次 {start}–{end}",

  "chrome.stage.queued": "排队中",
  "chrome.stage.released": "已下达",
  "chrome.stage.forming": "成型",
  "chrome.stage.firing": "烧制",
  "chrome.stage.finishing": "修整",
  "chrome.stage.complete": "已完成",

  "chrome.po.draft": "草稿",
  "chrome.po.sent": "已发出",
  "chrome.po.part_received": "部分到货",
  "chrome.po.received": "已到货",

  "chrome.so.draft": "草稿",
  "chrome.so.confirmed": "已确认",
  "chrome.so.picking": "拣配中",
  "chrome.so.shipped": "已发货",
  "chrome.so.invoiced": "已开票",

  "chrome.inv.paid": "已付清",
  "chrome.inv.overdue": "已逾期",
  "chrome.inv.part_paid": "部分付款",
  "chrome.inv.sent": "已发出",

  "chrome.move.receipt": "入库",
  "chrome.move.issue": "领用",
  "chrome.move.production": "产出",
  "chrome.move.shipment": "出库",
  "chrome.move.adjustment": "调整",

  "chrome.fire.loading": "装窑中",
  "chrome.fire.firing": "烧制中",
  "chrome.fire.cooling": "降温中",
  "chrome.fire.unloaded": "已出窑",

  "chrome.bucket.current": "未到期",
  "chrome.bucket.d1_30": "1–30 天",
  "chrome.bucket.d31_60": "31–60 天",
  "chrome.bucket.d61": "61 天以上",

  "chrome.alloc.awaiting": "待处理",
  "chrome.alloc.making": "生产中 · {run}",
  "chrome.alloc.short": "尚缺 {count}",
  "chrome.alloc.allocated": "已预留",

  "chrome.method.transfer": "银行转账",
  "chrome.method.card": "刷卡",
  "chrome.method.cheque": "支票",

  "chrome.count.open": "进行中",
  "chrome.count.posted": "已过账",

  "chrome.mins": "{count} 分钟",
  "chrome.hrs": "{count} 小时",
  "chrome.nohold": "不保温",
  "chrome.daysOver": "逾期 {count} 天",
  "chrome.daysToRun": "还有 {count} 天",
  "chrome.dueToday": "今天到期",
  "chrome.inDays": "{count} 天后",

  "chrome.close": "关闭",
  "chrome.cancel": "取消",

  "chrome.toast.advanced": "{code} 已移到{stage}",
  "chrome.toast.output": "{code} 记录 {count} 件良品 · 批号 {lot}",
  "chrome.toast.receivedFull": "{code} 已全部到货",
  "chrome.toast.receivedPart": "{code} 部分到货 · 未到的行继续保持开启",
  "chrome.toast.made": "{code} 已排入 {qty} × {sku}",
  "chrome.toast.orderAdvanced": "{code} → {status}",
  "chrome.toast.invoiceRaised": "已由 {code} 开出 {number}",
  "chrome.toast.shipped": "{code} 已发货 · 库存已领出并写入台账",
  "chrome.toast.payment": "已在 {number} 上登记 {amount}",
  "chrome.toast.countPosted": "{code} 已过账 · 调整了 {count} 行",
  "chrome.toast.poDrafted": "已为 {supplier} 起草 {code} · 共 {count} 行",
  "chrome.toast.signed": "交班已在演示中签核 · 不会保存任何签名",
  "chrome.toast.reset": "演示已恢复到初始状态",
};

const ZH_TW: Bundle = {
  "chrome.skipToContent": "跳到主要內容",
  "chrome.brand": "Kilnworks",
  "chrome.brand.desk": "工廠工作台",
  "chrome.footer.copy": "© 2026 Kilnworks。隨 Adminium 提供的工廠示範工作台。",
  "chrome.footer.chip": "adminium.dev/demo/factory-ops",

  "chrome.search.placeholder": "搜尋料號、批次、訂單…",
  "chrome.search.label": "在廠內搜尋",
  "chrome.search.empty": "沒有符合「{query}」的項目。",
  "chrome.search.runs": "批次",
  "chrome.search.items": "庫存",
  "chrome.search.orders": "訂單",
  "chrome.menu.open": "開啟導覽",
  "chrome.menu.close": "關閉導覽",

  "chrome.nav.board": "現場看板",
  "chrome.nav.stations": "工作站",
  "chrome.nav.firings": "窯燒",
  "chrome.nav.seconds": "次品",
  "chrome.nav.handover": "交接",
  "chrome.nav.stock": "庫存",
  "chrome.nav.counts": "盤點",
  "chrome.nav.purchasing": "採購",
  "chrome.nav.suppliers": "供應商",
  "chrome.nav.orders": "訂單",
  "chrome.nav.dispatch": "出貨",
  "chrome.nav.invoices": "發票",
  "chrome.nav.recipes": "配方",
  "chrome.nav.books": "帳面",

  "chrome.dock.title": "示範控制項",
  "chrome.dock.expand": "顯示示範控制項",
  "chrome.dock.collapse": "隱藏示範控制項",
  "chrome.dock.persona": "誰在顧台",
  "chrome.dock.floor": "現場",
  "chrome.dock.office": "辦公室",
  "chrome.dock.theme": "主題",
  "chrome.dock.theme.light": "切換為淺色主題",
  "chrome.dock.theme.dark": "切換為深色主題",
  "chrome.dock.language": "語言",
  "chrome.dock.reset": "重設示範",
  "chrome.dock.shift": "班次 {start}–{end}",

  "chrome.stage.queued": "排隊中",
  "chrome.stage.released": "已下線",
  "chrome.stage.forming": "成型",
  "chrome.stage.firing": "燒製",
  "chrome.stage.finishing": "修整",
  "chrome.stage.complete": "已完成",

  "chrome.po.draft": "草稿",
  "chrome.po.sent": "已寄出",
  "chrome.po.part_received": "部分到貨",
  "chrome.po.received": "已到貨",

  "chrome.so.draft": "草稿",
  "chrome.so.confirmed": "已確認",
  "chrome.so.picking": "揀貨中",
  "chrome.so.shipped": "已出貨",
  "chrome.so.invoiced": "已開立",

  "chrome.inv.paid": "已付清",
  "chrome.inv.overdue": "已逾期",
  "chrome.inv.part_paid": "部分付款",
  "chrome.inv.sent": "已寄出",

  "chrome.move.receipt": "入庫",
  "chrome.move.issue": "領用",
  "chrome.move.production": "產出",
  "chrome.move.shipment": "出庫",
  "chrome.move.adjustment": "調整",

  "chrome.fire.loading": "裝窯中",
  "chrome.fire.firing": "燒製中",
  "chrome.fire.cooling": "降溫中",
  "chrome.fire.unloaded": "已出窯",

  "chrome.bucket.current": "未到期",
  "chrome.bucket.d1_30": "1–30 天",
  "chrome.bucket.d31_60": "31–60 天",
  "chrome.bucket.d61": "61 天以上",

  "chrome.alloc.awaiting": "待處理",
  "chrome.alloc.making": "生產中 · {run}",
  "chrome.alloc.short": "尚缺 {count}",
  "chrome.alloc.allocated": "已保留",

  "chrome.method.transfer": "銀行轉帳",
  "chrome.method.card": "刷卡",
  "chrome.method.cheque": "支票",

  "chrome.count.open": "進行中",
  "chrome.count.posted": "已過帳",

  "chrome.mins": "{count} 分鐘",
  "chrome.hrs": "{count} 小時",
  "chrome.nohold": "不持溫",
  "chrome.daysOver": "逾期 {count} 天",
  "chrome.daysToRun": "還有 {count} 天",
  "chrome.dueToday": "今天到期",
  "chrome.inDays": "{count} 天後",

  "chrome.close": "關閉",
  "chrome.cancel": "取消",

  "chrome.toast.advanced": "{code} 已移到{stage}",
  "chrome.toast.output": "{code} 記錄 {count} 件良品 · 批號 {lot}",
  "chrome.toast.receivedFull": "{code} 已全數到貨",
  "chrome.toast.receivedPart": "{code} 部分到貨 · 未到的明細仍保持開啟",
  "chrome.toast.made": "{code} 已排入 {qty} × {sku}",
  "chrome.toast.orderAdvanced": "{code} → {status}",
  "chrome.toast.invoiceRaised": "已由 {code} 開立 {number}",
  "chrome.toast.shipped": "{code} 已出貨 · 庫存已領出並寫入異動",
  "chrome.toast.payment": "已在 {number} 上登錄 {amount}",
  "chrome.toast.countPosted": "{code} 已過帳 · 調整了 {count} 筆",
  "chrome.toast.poDrafted": "已為 {supplier} 草擬 {code} · 共 {count} 筆",
  "chrome.toast.signed": "交接已在示範中簽核 · 不會保存任何簽名",
  "chrome.toast.reset": "示範已回到起始狀態",
};

const AR: Bundle = {
  "chrome.skipToContent": "تخطَّ إلى المحتوى",
  "chrome.brand": "Kilnworks",
  "chrome.brand.desk": "مكتب الورشة",
  "chrome.footer.copy": "© 2026 Kilnworks. مكتب ورشة تجريبي يأتي مع Adminium.",
  "chrome.footer.chip": "adminium.dev/demo/factory-ops",

  "chrome.search.placeholder": "ابحث عن الأصناف أو الدفعات أو الطلبات…",
  "chrome.search.label": "البحث في الورشة",
  "chrome.search.empty": "لا شيء يطابق «{query}».",
  "chrome.search.runs": "الدفعات",
  "chrome.search.items": "المخزون",
  "chrome.search.orders": "الطلبات",
  "chrome.menu.open": "فتح التنقل",
  "chrome.menu.close": "إغلاق التنقل",

  "chrome.nav.board": "لوحة الورشة",
  "chrome.nav.stations": "المحطات",
  "chrome.nav.firings": "الحرقات",
  "chrome.nav.seconds": "الهالك",
  "chrome.nav.handover": "التسليم",
  "chrome.nav.stock": "المخزون",
  "chrome.nav.counts": "الجرد",
  "chrome.nav.purchasing": "المشتريات",
  "chrome.nav.suppliers": "المورّدون",
  "chrome.nav.orders": "الطلبات",
  "chrome.nav.dispatch": "الشحن",
  "chrome.nav.invoices": "الفواتير",
  "chrome.nav.recipes": "التركيبات",
  "chrome.nav.books": "الحسابات",

  "chrome.dock.title": "أدوات العرض",
  "chrome.dock.expand": "إظهار أدوات العرض",
  "chrome.dock.collapse": "إخفاء أدوات العرض",
  "chrome.dock.persona": "من على المكتب",
  "chrome.dock.floor": "الورشة",
  "chrome.dock.office": "المكتب",
  "chrome.dock.theme": "المظهر",
  "chrome.dock.theme.light": "التبديل إلى المظهر الفاتح",
  "chrome.dock.theme.dark": "التبديل إلى المظهر الداكن",
  "chrome.dock.language": "اللغة",
  "chrome.dock.reset": "إعادة ضبط العرض",
  "chrome.dock.shift": "الوردية {start}–{end}",

  "chrome.stage.queued": "في الانتظار",
  "chrome.stage.released": "مُطلقة",
  "chrome.stage.forming": "التشكيل",
  "chrome.stage.firing": "الحرق",
  "chrome.stage.finishing": "التشطيب",
  "chrome.stage.complete": "مكتملة",

  "chrome.po.draft": "مسودة",
  "chrome.po.sent": "مُرسَل",
  "chrome.po.part_received": "مُستلَم جزئيًا",
  "chrome.po.received": "مُستلَم",

  "chrome.so.draft": "مسودة",
  "chrome.so.confirmed": "مؤكَّد",
  "chrome.so.picking": "التجهيز",
  "chrome.so.shipped": "مشحون",
  "chrome.so.invoiced": "مفوتَر",

  "chrome.inv.paid": "مدفوعة",
  "chrome.inv.overdue": "متأخرة",
  "chrome.inv.part_paid": "مدفوعة جزئيًا",
  "chrome.inv.sent": "مُرسَلة",

  "chrome.move.receipt": "استلام",
  "chrome.move.issue": "صرف",
  "chrome.move.production": "إنتاج",
  "chrome.move.shipment": "شحن",
  "chrome.move.adjustment": "تسوية",

  "chrome.fire.loading": "التحميل",
  "chrome.fire.firing": "قيد الحرق",
  "chrome.fire.cooling": "التبريد",
  "chrome.fire.unloaded": "تم التفريغ",

  "chrome.bucket.current": "غير مستحقة",
  "chrome.bucket.d1_30": "١–٣٠ يومًا",
  "chrome.bucket.d31_60": "٣١–٦٠ يومًا",
  "chrome.bucket.d61": "٦١ يومًا فأكثر",

  "chrome.alloc.awaiting": "بالانتظار",
  "chrome.alloc.making": "قيد الصنع · {run}",
  "chrome.alloc.short": "ينقص {count}",
  "chrome.alloc.allocated": "محجوزة",

  "chrome.method.transfer": "تحويل بنكي",
  "chrome.method.card": "بطاقة",
  "chrome.method.cheque": "شيك",

  "chrome.count.open": "مفتوح",
  "chrome.count.posted": "مُرحَّل",

  "chrome.mins":
    "{count} دقيقة|دقيقة واحدة|دقيقتان|{count} دقائق|{count} دقيقة|{count} دقيقة",
  "chrome.hrs": "{count} ساعة|ساعة واحدة|ساعتان|{count} ساعات|{count} ساعة|{count} ساعة",
  "chrome.nohold": "بدون تثبيت",
  "chrome.daysOver":
    "متأخرة {count} يوم|متأخرة يومًا واحدًا|متأخرة يومين|متأخرة {count} أيام|متأخرة {count} يومًا|متأخرة {count} يوم",
  "chrome.daysToRun":
    "يتبقى {count} يوم|يتبقى يوم واحد|يتبقى يومان|تتبقى {count} أيام|يتبقى {count} يومًا|يتبقى {count} يوم",
  "chrome.dueToday": "مستحقة اليوم",
  "chrome.inDays":
    "خلال {count} يوم|خلال يوم واحد|خلال يومين|خلال {count} أيام|خلال {count} يومًا|خلال {count} يوم",

  "chrome.close": "إغلاق",
  "chrome.cancel": "إلغاء",

  "chrome.toast.advanced": "انتقلت {code} إلى {stage}",
  "chrome.toast.output":
    "{count} قطعة سليمة على {code} · التشغيلة {lot}|قطعة سليمة واحدة على {code} · التشغيلة {lot}|قطعتان سليمتان على {code} · التشغيلة {lot}|{count} قطع سليمة على {code} · التشغيلة {lot}|{count} قطعة سليمة على {code} · التشغيلة {lot}|{count} قطعة سليمة على {code} · التشغيلة {lot}",
  "chrome.toast.receivedFull": "استُلمت {code} بالكامل",
  "chrome.toast.receivedPart": "استُلمت {code} جزئيًا · تبقى البنود الناقصة مفتوحة",
  "chrome.toast.made": "أُدرجت {code} لعدد {qty} × {sku}",
  "chrome.toast.orderAdvanced": "{code} ← {status}",
  "chrome.toast.invoiceRaised": "صدرت {number} من {code}",
  "chrome.toast.shipped": "شُحنت {code} · صُرف المخزون وسُجلت الحركات",
  "chrome.toast.payment": "سُجل {amount} على {number}",
  "chrome.toast.countPosted":
    "رُحّلت {code} · عُدّل {count} بند|رُحّلت {code} · عُدّل بند واحد|رُحّلت {code} · عُدّل بندان|رُحّلت {code} · عُدّلت {count} بنود|رُحّلت {code} · عُدّل {count} بندًا|رُحّلت {code} · عُدّل {count} بند",
  "chrome.toast.poDrafted":
    "أُعدّت {code} لـ {supplier} · {count} بند|أُعدّت {code} لـ {supplier} · بند واحد|أُعدّت {code} لـ {supplier} · بندان|أُعدّت {code} لـ {supplier} · {count} بنود|أُعدّت {code} لـ {supplier} · {count} بندًا|أُعدّت {code} لـ {supplier} · {count} بند",
  "chrome.toast.signed": "اعتُمد التسليم في العرض · لا يُحفظ أي توقيع",
  "chrome.toast.reset": "عاد العرض إلى حالته الأولى",
};

export const chrome = {
  "en-US": EN,
  "de-DE": DE,
  "fr-FR": FR,
  "cs-CZ": CS,
  "da-DK": DA,
  "zh-CN": ZH_CN,
  "zh-TW": ZH_TW,
  "ar-EG": AR,
} satisfies Record<LocaleTag, Record<keyof typeof EN, string>>;
