/**
 * Area bundle: **add-ons**.
 *
 * The words the HOST puts around an add-on: the Works screen's own headings,
 * its empty state, and the sentence that has to appear wherever a company is
 * named. An add-on's OWN copy is not here — it travels on the
 * add-on object and is merged at registration by `registerAddOnMessages`, which
 * throws if any of the eight locales is short a key.
 *
 * ── WHY EVERY KEY STARTS `addon.` ──────────────────────────────────────────
 *
 * Because the vocabulary gate splits on that prefix. It fails over
 * ADD-ON-CONTRIBUTED strings and reports the app's pre-existing copy as debt
 * (31 D4), and "contributed" means both halves: an add-on's own bundle
 * (`addon.<key>.…`) and the copy a host writes at a mount site. Filing these
 * under `screens.*` would quietly move them onto the debt side, where a banned
 * word would be reported and not refused. This module is the newest copy in the
 * app and there is no reason for it to be held to a lower bar than the add-on's.
 *
 * VOCABULARY. The whole of `chrome.ts`'s note applies here and one trap is
 * worth repeating because this file walks into it: the Czech word for "for" is
 * a standalone banned token, so the Czech below says where goods go rather than
 * what an address is for. The German past participles ending `-tiert` carry the
 * banned run for an animal and are avoided the same way.
 */
import type { LocaleTag } from "../locales.ts";

const EN = {
  /* --- the Works screen --- */
  "addon.host.works.title": "Works",
  "addon.host.works.sub": "Where the works is, and what it is connected to.",
  "addon.host.address.title": "Goods leave from",
  "addon.host.address.note":
    "The collection address on every label and delivery note. The desk reads it; the office keeps it right.",

  /* --- the shelf --- */
  "addon.host.addons.title": "Connected to the works",
  "addon.host.addons.sub":
    "None of this is needed. Every screen on the desk is finished without it, and switching one off puts them back exactly as they were.",
  "addon.host.addons.none":
    "Nothing is connected. Orders leave the way they always have — the works books its own transport, or the customer collects.",

  /* --- one add-on's row --- */
  "addon.host.connect": "Connect",
  "addon.host.disconnect": "Disconnect",
  "addon.host.connected": "Connected",
  "addon.host.stopped": "Switched off",
  "addon.host.switchOn": "Switch on",
  "addon.host.switchOff": "Switch off",
  "addon.host.allows": "What it is allowed to do",
  "addon.host.settings": "Settings",
  "addon.host.noSettings": "This one has nothing to set.",
  "addon.host.goes": "Disconnecting takes away",
  "addon.host.stays": "Disconnecting keeps",
  "addon.host.affiliation":
    "{name} is a separate company. Kilnworks and Adminium are not affiliated with it and are not endorsed by it; the name is here only to say what the works is connected to.",
};

type Bundle = Record<keyof typeof EN, string>;

const DE: Bundle = {
  "addon.host.works.title": "Werkstatt",
  "addon.host.works.sub": "Wo die Werkstatt liegt und womit sie verbunden ist.",
  "addon.host.address.title": "Ware geht ab hier raus",
  "addon.host.address.note":
    "Die Abholadresse auf jedem Etikett und jedem Lieferschein. Das Pult liest sie; das Büro hält sie aktuell.",

  "addon.host.addons.title": "Mit der Werkstatt verbunden",
  "addon.host.addons.sub":
    "Nichts davon wird gebraucht. Jeder Bildschirm am Pult ist auch ohne fertig, und beim Abschalten sehen sie wieder genau so aus wie vorher.",
  "addon.host.addons.none":
    "Nichts ist verbunden. Aufträge gehen raus wie immer — die Werkstatt bucht den Transport selbst, oder die Kundschaft holt ab.",

  "addon.host.connect": "Verbinden",
  "addon.host.disconnect": "Trennen",
  "addon.host.connected": "Verbunden",
  "addon.host.stopped": "Abgeschaltet",
  "addon.host.switchOn": "Einschalten",
  "addon.host.switchOff": "Abschalten",
  "addon.host.allows": "Was es darf",
  "addon.host.settings": "Einstellungen",
  "addon.host.noSettings": "Hier gibt es nichts einzustellen.",
  "addon.host.goes": "Beim Trennen fällt weg",
  "addon.host.stays": "Beim Trennen bleibt",
  "addon.host.affiliation":
    "{name} ist ein eigenständiges Unternehmen. Kilnworks und Adminium gehören nicht dazu und werden von ihm nicht unterstützt; der Name steht hier nur, um zu sagen, womit die Werkstatt verbunden ist.",
};

const FR: Bundle = {
  "addon.host.works.title": "Atelier",
  "addon.host.works.sub": "Où se trouve l’atelier, et ce à quoi il est raccordé.",
  "addon.host.address.title": "La marchandise part d’ici",
  "addon.host.address.note":
    "L’adresse d’enlèvement figurant sur chaque étiquette et chaque bon de livraison. Le poste la lit ; le bureau la tient à jour.",

  "addon.host.addons.title": "Raccordé à l’atelier",
  "addon.host.addons.sub":
    "Rien de tout cela n’est nécessaire. Chaque écran du poste est complet sans, et une fois désactivé tout redevient exactement comme avant.",
  "addon.host.addons.none":
    "Rien n’est raccordé. Les commandes partent comme toujours — l’atelier réserve lui-même le transport, ou le client vient chercher.",

  "addon.host.connect": "Raccorder",
  "addon.host.disconnect": "Débrancher",
  "addon.host.connected": "Raccordé",
  "addon.host.stopped": "Désactivé",
  "addon.host.switchOn": "Activer",
  "addon.host.switchOff": "Désactiver",
  "addon.host.allows": "Ce qu’il a le droit de faire",
  "addon.host.settings": "Réglages",
  "addon.host.noSettings": "Il n’y a rien à régler ici.",
  "addon.host.goes": "En débranchant, on perd",
  "addon.host.stays": "En débranchant, on garde",
  "addon.host.affiliation":
    "{name} est une société distincte. Kilnworks et Adminium n’en font pas partie et n’ont reçu d’elle aucune approbation ; son nom figure ici uniquement pour dire à quoi l’atelier est raccordé.",
};

const CS: Bundle = {
  "addon.host.works.title": "Dílna",
  "addon.host.works.sub": "Kde dílna je a s čím je propojená.",
  "addon.host.address.title": "Odsud zboží odjíždí",
  "addon.host.address.note":
    "Adresa svozu na každé etiketě a každém dodacím listu. Pult ji čte, kancelář ji udržuje správnou.",

  "addon.host.addons.title": "Propojeno s dílnou",
  "addon.host.addons.sub":
    "Nic z toho není nutné. Každá obrazovka pultu je hotová i bez toho a po vypnutí vypadají přesně jako předtím.",
  "addon.host.addons.none":
    "Nic není propojeno. Zakázky odcházejí jako vždy — dílna si dopravu objedná sama, nebo si zboží vyzvedne zákazník.",

  "addon.host.connect": "Připojit",
  "addon.host.disconnect": "Odpojit",
  "addon.host.connected": "Připojeno",
  "addon.host.stopped": "Vypnuto",
  "addon.host.switchOn": "Zapnout",
  "addon.host.switchOff": "Vypnout",
  "addon.host.allows": "Co smí dělat",
  "addon.host.settings": "Nastavení",
  "addon.host.noSettings": "Tady se nedá nic nastavit.",
  "addon.host.goes": "Odpojením zmizí",
  "addon.host.stays": "Odpojením zůstane",
  "addon.host.affiliation":
    "{name} je samostatná společnost. Kilnworks ani Adminium k ní nepatří a nemají od ní žádné schválení; její název je tu jen kvůli tomu, aby bylo vidět, s čím je dílna propojená.",
};

const DA: Bundle = {
  "addon.host.works.title": "Værksted",
  "addon.host.works.sub": "Hvor værkstedet ligger, og hvad det er koblet til.",
  "addon.host.address.title": "Varerne afhentes her",
  "addon.host.address.note":
    "Afhentningsadressen på hver etiket og hver følgeseddel. Pulten læser den; kontoret holder den ved lige.",

  "addon.host.addons.title": "Koblet til værkstedet",
  "addon.host.addons.sub":
    "Intet af det her er nødvendigt. Hver skærm på pulten er færdig foruden, og slår man noget fra, ser de ud præcis som før.",
  "addon.host.addons.none":
    "Intet er koblet til. Ordrer går ud som altid — værkstedet bestiller selv transporten, eller kunden henter.",

  "addon.host.connect": "Kobl til",
  "addon.host.disconnect": "Kobl fra",
  "addon.host.connected": "Koblet til",
  "addon.host.stopped": "Slået fra",
  "addon.host.switchOn": "Slå til",
  "addon.host.switchOff": "Slå fra",
  "addon.host.allows": "Hvad den må",
  "addon.host.settings": "Indstillinger",
  "addon.host.noSettings": "Her er ikke noget at stille på.",
  "addon.host.goes": "Kobler du fra, forsvinder",
  "addon.host.stays": "Kobler du fra, bliver",
  "addon.host.affiliation":
    "{name} er et selvstændigt selskab. Kilnworks og Adminium hører ikke til det og er ikke godkendt af det; navnet står her kun for at sige, hvad værkstedet er koblet til.",
};

const ZH_CN: Bundle = {
  "addon.host.works.title": "车间",
  "addon.host.works.sub": "车间在哪里，以及接入了什么。",
  "addon.host.address.title": "货物从这里发出",
  "addon.host.address.note": "每张标签和送货单上的取货地址。工作台只读取它，由办公室保持正确。",

  "addon.host.addons.title": "已接入车间",
  "addon.host.addons.sub":
    "这些都不是必需的。没有它们，工作台的每个界面也是完整的；关掉之后，界面会和原来一模一样。",
  "addon.host.addons.none": "尚未接入任何东西。订单照旧发出 —— 车间自行安排运输，或者由客户自提。",

  "addon.host.connect": "接入",
  "addon.host.disconnect": "断开",
  "addon.host.connected": "已接入",
  "addon.host.stopped": "已关闭",
  "addon.host.switchOn": "开启",
  "addon.host.switchOff": "关闭",
  "addon.host.allows": "它获准做的事",
  "addon.host.settings": "设置",
  "addon.host.noSettings": "这里没有可设置的内容。",
  "addon.host.goes": "断开后会失去",
  "addon.host.stays": "断开后会保留",
  "addon.host.affiliation":
    "{name} 是一家独立公司。Kilnworks 与 Adminium 均不隶属于它，也未获得它的认可；这里写出它的名称，只是为了说明车间接入了什么。",
};

const ZH_TW: Bundle = {
  "addon.host.works.title": "工廠",
  "addon.host.works.sub": "工廠位於何處，以及接上了什麼。",
  "addon.host.address.title": "貨物從這裡出去",
  "addon.host.address.note": "每張標籤和送貨單上的取貨地址。工作台只讀取它，由辦公室維持正確。",

  "addon.host.addons.title": "已接上工廠",
  "addon.host.addons.sub":
    "這些都不是必要的。少了它們，工作台的每個畫面一樣完整；關掉之後，畫面會和原來完全一樣。",
  "addon.host.addons.none": "尚未接上任何東西。訂單照舊出貨 —— 工廠自行安排運輸，或由客戶自取。",

  "addon.host.connect": "接上",
  "addon.host.disconnect": "斷開",
  "addon.host.connected": "已接上",
  "addon.host.stopped": "已關閉",
  "addon.host.switchOn": "開啟",
  "addon.host.switchOff": "關閉",
  "addon.host.allows": "它獲准做的事",
  "addon.host.settings": "設定",
  "addon.host.noSettings": "這裡沒有可以設定的項目。",
  "addon.host.goes": "斷開後會失去",
  "addon.host.stays": "斷開後會保留",
  "addon.host.affiliation":
    "{name} 是一家獨立公司。Kilnworks 與 Adminium 都不隸屬於它，也未取得它的背書；這裡寫出它的名稱，只是為了說明工廠接上了什麼。",
};

const AR: Bundle = {
  "addon.host.works.title": "الورشة",
  "addon.host.works.sub": "أين تقع الورشة، وبماذا هي موصولة.",
  "addon.host.address.title": "البضاعة تخرج من هنا",
  "addon.host.address.note":
    "عنوان الاستلام المطبوع على كل ملصق وكل إشعار تسليم. المكتب يبقيه صحيحًا، والورشة تقرأه فقط.",

  "addon.host.addons.title": "موصول بالورشة",
  "addon.host.addons.sub":
    "لا شيء من هذا ضروري. كل شاشة على المكتب مكتملة بدونه، وعند إيقافه تعود الشاشات كما كانت تمامًا.",
  "addon.host.addons.none":
    "لا شيء موصول. الطلبات تخرج كما كانت دائمًا — الورشة تحجز النقل بنفسها، أو يستلم الزبون بنفسه.",

  "addon.host.connect": "وصل",
  "addon.host.disconnect": "فصل",
  "addon.host.connected": "موصول",
  "addon.host.stopped": "متوقّف",
  "addon.host.switchOn": "تشغيل",
  "addon.host.switchOff": "إيقاف",
  "addon.host.allows": "ما يُسمح له به",
  "addon.host.settings": "الإعدادات",
  "addon.host.noSettings": "لا يوجد هنا ما يُضبط.",
  "addon.host.goes": "عند الفصل يذهب",
  "addon.host.stays": "عند الفصل يبقى",
  "addon.host.affiliation":
    "‏{name} شركة مستقلة. لا تتبع Kilnworks ولا Adminium لها ولا تحملان أي تزكية منها؛ اسمها مذكور هنا فقط لبيان ما هي الورشة موصولة به.",
};

export const addOns = {
  "en-US": EN,
  "de-DE": DE,
  "fr-FR": FR,
  "cs-CZ": CS,
  "da-DK": DA,
  "zh-CN": ZH_CN,
  "zh-TW": ZH_TW,
  "ar-EG": AR,
} satisfies Record<LocaleTag, Record<keyof typeof EN, string>>;
