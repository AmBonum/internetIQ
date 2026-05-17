import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useSyncExternalStore, ReactNode } from "react";
import {
  BookOpen, Sparkles, Search, ChevronRight, LayoutDashboard, FilePlus2, Library,
  Users, Bell, History, Shield, FileText, ClipboardList, Layers, UsersRound,
  ListChecks, Settings, FolderTree, Image as ImageIcon, BarChart3,
  LifeBuoy, Globe, Navigation, Share2, Lock, KeyRound, ArrowRight, MousePointerClick,
  Eye, Database, Cookie, UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Dokumentácia — SubenAI" },
      { name: "description", content: "Detailné návody pre platformu SubenAI: workspace /app, verejný web a aké dáta zbierame." },
      { property: "og:title", content: "Dokumentácia — SubenAI" },
      { property: "og:description", content: "Krok-za-krokom návody s príkladmi a transparentný prehľad zbieraných dát." },
    ],
  }),
  component: DocsPage,
});

/* ---------------- helpers ---------------- */

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-mono">{children}</code>;
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{n}</div>
      <div className="space-y-1.5">
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground [&>*+*]:mt-1.5">{children}</div>
      </div>
    </div>
  );
}

function Click({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">
      <MousePointerClick className="h-3 w-3 text-primary" />{children}
    </span>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 flex gap-2 rounded-md border-l-2 border-primary/40 bg-muted/40 p-2">
      <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <div className="text-xs text-foreground/80"><span className="font-semibold text-primary">Uvidíte: </span>{children}</div>
    </div>
  );
}

function Example({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Príklad — {title}</div>
      <div className="text-sm text-foreground/90 [&>*+*]:mt-2">{children}</div>
    </div>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-primary/60 bg-primary/5 p-3 text-sm">
      <span className="font-semibold text-primary">Tip · </span>{children}
    </div>
  );
}

function DataTable({ rows }: { rows: { field: string; purpose: string; retention: string; legal: string }[] }) {
  return (
    <div className="not-prose overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 pr-3 font-semibold">Údaj</th>
            <th className="py-2 pr-3 font-semibold">Účel</th>
            <th className="py-2 pr-3 font-semibold">Doba uchovania</th>
            <th className="py-2 font-semibold">Právny základ</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.field}>
              <td className="py-2 pr-3 font-medium text-foreground">{r.field}</td>
              <td className="py-2 pr-3 text-muted-foreground">{r.purpose}</td>
              <td className="py-2 pr-3 text-muted-foreground">{r.retention}</td>
              <td className="py-2 text-muted-foreground">{r.legal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- content ---------------- */

type Group =
  | "Začíname"
  | "Workspace /app"
  | "Verejný web subenai.sk"
  | "Administrácia"
  | "Bezpečnosť & GDPR"
  | "Dáta a súkromie";

type Section = {
  id: string;
  title: string;
  icon: typeof BookOpen;
  group: Group;
  body: ReactNode;
  tags?: string[];
};

const SECTIONS: Section[] = [

  /* ===== ZAČÍNAME ===== */
  {
    id: "overview", title: "Prehľad platformy", icon: Sparkles, group: "Začíname",
    tags: ["úvod", "intro"],
    body: (
      <div className="space-y-3 text-sm">
        <p><strong>SubenAI</strong> je platforma pre tvorbu, distribúciu a vyhodnocovanie testov a školení. Skladá sa z troch častí:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Verejný web</strong> (<Code>subenai.sk</Code>) — landing, blog, registrácia, prihlásenie.</li>
          <li><strong>Workspace</strong> (<Link to="/app" className="text-primary underline">/app</Link>) — autor testov, audiences, výsledky.</li>
          <li><strong>Admin platformy</strong> (<Link to="/admin" className="text-primary underline">/admin</Link>) — knižnica otázok, kategórie, CMS verejného webu.</li>
        </ul>
        <p>Respondent <strong>nepotrebuje registráciu</strong> — test vyplní cez zdieľaný link <Code>/t/&lt;shareId&gt;</Code> (voliteľne chránený heslom).</p>
        <Tip>Ak hľadáte „čo zbierame o mne ako návštevníkovi", choďte na sekciu <strong>Dáta a súkromie</strong> v ľavom menu.</Tip>
      </div>
    ),
  },

  {
    id: "quickstart", title: "Rýchly štart (5 minút)", icon: ArrowRight, group: "Začíname",
    body: (
      <div className="space-y-4 text-sm">
        <Step n={1} title="Prihláste sa do workspace">
          V prehliadači otvorte <Link to="/login" className="text-primary underline">/login</Link>. Vyplňte email a heslo a kliknite <Click>Prihlásiť sa</Click>.
          <Screen>formulár s poľami <em>Email</em> a <em>Heslo</em>, dole odkaz „Zabudnuté heslo".</Screen>
          <p>Pre demo použite účet: <Code>autor@subenai.sk</Code> / ľubovoľné heslo (mock).</p>
        </Step>
        <Step n={2} title="Vytvorte test">
          V ľavom menu kliknite <Click>Nový test</Click> alebo otvorte <Link to="/app/tests/new" className="text-primary underline">/app/tests/new</Link>.
          <Screen>3-krokový sprievodca: <em>Základ → Segmentácia a GDPR → Intake polia</em>.</Screen>
          <p>V kroku 1 vyplňte aspoň <em>Názov</em> a <em>Účel</em>. Kliknite <Click>Pokračovať</Click> medzi krokmi.</p>
        </Step>
        <Step n={3} title="Pridajte otázky">
          Po dokončení sprievodcu sa otvorí editor testu. Prepnite na tab <Click>Otázky a intake</Click>.
          <p>Kliknite <Click>+ Pridať z knižnice</Click>, zaškrtnite otázky a potvrďte <Click>Pridať vybrané</Click>.</p>
          <Screen>tabuľka otázok s drag-handle pre zmenu poradia.</Screen>
        </Step>
        <Step n={4} title="Publikujte a zdieľajte">
          Prepnite na tab <Click>Verzie</Click> a kliknite <Click>Publish</Click>. Po publikovaní sa pri názve objaví zelený badge <Code>v1 · published</Code>.
          <p>Link nájdete v tabe <Click>Zdieľanie</Click> v poli „Zdieľacia URL". Kliknite <Click>Skopírovať</Click>.</p>
        </Step>
        <Step n={5} title="Sledujte výsledky">
          Prepnite na tab <Click>Dashboard</Click>. Zobrazia sa 4 KPI karty: <em>Sessions, Pass rate, Priemerný čas, Priemerné skóre</em>, plus tabuľka respondentov a heatmapa otázok.
          <p>Export: tlačidlá <Click>CSV</Click>, <Click>JSON</Click>, <Click>PDF report</Click> vpravo hore.</p>
        </Step>
      </div>
    ),
  },

  {
    id: "roles", title: "Roly a oprávnenia", icon: Shield, group: "Začíname",
    body: (
      <div className="space-y-3 text-sm">
        <p>Systém pozná 4 typy aktérov:</p>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-muted-foreground"><th className="py-2 pr-3">Rola</th><th className="pr-3">Kde sa prihlasuje</th><th>Čo môže</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-2 pr-3 font-medium">Respondent</td><td className="pr-3"><Code>/t/&lt;shareId&gt;</Code></td><td>Vyplní test cez link, bez registrácie.</td></tr>
              <tr><td className="py-2 pr-3 font-medium">Autor (Workspace)</td><td className="pr-3"><Link to="/login" className="text-primary underline">/login</Link></td><td>Vytvára testy, audiences, pozerá výsledky.</td></tr>
              <tr><td className="py-2 pr-3 font-medium">Owner / Editor / Viewer</td><td className="pr-3"><Link to="/app/teams" className="text-primary underline">/app/teams</Link></td><td>Tímové roly v rámci workspace.</td></tr>
              <tr><td className="py-2 pr-3 font-medium">Admin platformy</td><td className="pr-3"><Link to="/admin-login" className="text-primary underline">/admin-login</Link></td><td>Knižnica otázok, CMS, schvaľovanie.</td></tr>
            </tbody>
          </table>
        </div>
        <Tip>Roly v tíme meníte v <Link to="/app/teams" className="text-primary underline">/app/teams</Link> → klik na člena → výber roly z drop-downu.</Tip>
      </div>
    ),
  },

  /* ===== WORKSPACE /APP ===== */
  {
    id: "dashboard", title: "Dashboard workspace", icon: LayoutDashboard, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>Domovská obrazovka <Link to="/app" className="text-primary underline">/app</Link>.</p>
        <Step n={1} title="Onboarding checklist">
          Hore karta s 5 krokmi (vytvoriť test, importovať skupinu, publikovať, atď.). Po dokončení kroku sa rozsvieti zelená fajka.
        </Step>
        <Step n={2} title="KPI karty">
          Štyri karty: <em>Aktívne testy</em>, <em>Sessions tento mesiac</em>, <em>Priemerná úspešnosť</em>, <em>Nevyriešené notifikácie</em>. Kliknutím na kartu sa otvorí detail.
        </Step>
        <Step n={3} title="Najnovšia aktivita">
          Tabuľka s posledných 10 sessions: <em>respondent, test, výsledok, čas, status</em>. Klik na riadok otvorí detail sessionu.
        </Step>
        <Step n={4} title="Rýchle akcie">
          Tlačidlá <Click>+ Nový test</Click>, <Click>+ Importovať skupinu</Click>, <Click>Otvoriť šablónu</Click>.
        </Step>
      </div>
    ),
  },

  {
    id: "tests-create", title: "Tvorba testu (sprievodca)", icon: FilePlus2, group: "Workspace /app",
    tags: ["nový", "wizard"],
    body: (
      <div className="space-y-4 text-sm">
        <p>Otvorte <Link to="/app/tests/new" className="text-primary underline">/app/tests/new</Link>. Sprievodca má 3 kroky a v hornom progress bare vidíte, v ktorom ste.</p>
        <Step n={1} title="Krok 1 — Základné info">
          <ul className="ml-4 list-disc space-y-1">
            <li><em>Názov</em> (povinné, max 100 znakov).</li>
            <li><em>Popis</em> — zobrazí sa respondentovi v intro obrazovke.</li>
            <li><em>Jazyk</em> — sk / en / cs.</li>
            <li><em>Časový limit</em> — v minútach (0 = bez limitu).</li>
            <li><em>Prahová hranica úspešnosti</em> — % (default 70).</li>
          </ul>
          Kliknite <Click>Pokračovať</Click>.
        </Step>
        <Step n={2} title="Krok 2 — GDPR & segmentácia">
          Vyberte <em>účel spracovania</em> z drop-downu (vzdelávanie / HR / marketing / akademický výskum). Pridajte voliteľné segmenty (oddelenie, lokalita) pomocou <Click>+ Segment</Click>.
          <Screen>náhľad GDPR textu, ktorý uvidí respondent.</Screen>
        </Step>
        <Step n={3} title="Krok 3 — Intake polia">
          Pridávajte polia tlačidlom <Click>+ Pridať pole</Click>. Pre každé nastavte: <em>Label, Typ</em> (text/email/select/number/date), <em>Povinné</em>, <em>PII</em>.
          <p>Max 20 polí. Polia označené <Code>PII</Code> sa automaticky logujú do audit logu pri každom prístupe.</p>
        </Step>
        <Step n={4} title="Dokončenie">
          Kliknite <Click>Vytvoriť test</Click>. Vytvorí sa <em>draft</em> a presmeruje vás na editor <Code>/app/tests/&lt;testId&gt;</Code>.
        </Step>
        <Example title="HR onboarding test">
          Názov: „BOZP & GDPR pre nových zamestnancov 2026"<br />
          Účel: <Code>HR / vzdelávanie</Code><br />
          Intake polia: <em>Meno (povinné, PII)</em>, <em>Email (povinné, PII)</em>, <em>Oddelenie (select)</em>, <em>Dátum nástupu (date)</em>.
        </Example>
      </div>
    ),
  },

  {
    id: "tests-editor", title: "Editor testu (6 tabov)", icon: ClipboardList, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>Editor testu <Code>/app/tests/&lt;testId&gt;</Code> má hore 6 tabov:</p>
        <ol className="ml-5 list-decimal space-y-2">
          <li><strong>Dashboard</strong> — KPI, top/bottom otázky, heatmapa, exporty.</li>
          <li><strong>Otázky a intake</strong> — výber z knižnice + správa intake polí.</li>
          <li><strong>Skupiny</strong> — priradenie audiences (hromadná distribúcia).</li>
          <li><strong>Logika a notifikácie</strong> — skip logic + triggery (milestone, anomália).</li>
          <li><strong>Zdieľanie</strong> — link, per-test heslo, expirácia, jednorazové linky.</li>
          <li><strong>Verzie</strong> — draft → publish → archive, snapshoty pre audit.</li>
        </ol>
        <Step n={1} title="Zmena stavu testu">
          V hlavičke editora je drop-down statusu. Klik na <Click>Draft ▾</Click> → vyberte <em>Published</em> alebo <em>Archived</em>. Pri publikácii sa automaticky uloží snapshot do <em>Verzie</em>.
        </Step>
        <Tip>Test nemôžete publikovať, ak neobsahuje aspoň 1 otázku a všetky <em>povinné</em> intake polia nemajú vyplnený typ.</Tip>
      </div>
    ),
  },

  {
    id: "tests-dashboard", title: "Dashboard testu (vyhodnotenie)", icon: BarChart3, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>V editore testu → tab <Click>Dashboard</Click>.</p>
        <Step n={1} title="Sumár hore">
          KPI karty: <em>Sessions</em>, <em>Pass rate %</em>, <em>Ø čas (mm:ss)</em>, <em>Ø skóre %</em>. Pri zmene filtra (dátum, segment) sa prepočítajú live.
        </Step>
        <Step n={2} title="Tabuľka respondentov">
          Stĺpce: <em>Respondent (email/anonym), Štart, Trvanie, Skóre, Status</em>. Filtre nad tabuľkou: <em>Status</em> (všetci/úspešní/neúspešní), <em>Dátumový rozsah</em>, <em>Segment</em>.
        </Step>
        <Step n={3} title="Detail respondenta">
          Klik na riadok → otvorí sa drawer vpravo s rozpisom <strong>každej otázky</strong>: text otázky, jeho odpoveď, správna odpoveď, čas v sekundách, body.
          <Screen>v hornej časti drawer-u graf „odpovede v čase" a celkové hodnotenie.</Screen>
        </Step>
        <Step n={4} title="Analýza otázok">
          Pod tabuľkou heatmapa: <em>úspešnosť % × priemerný čas</em>. Otázky &lt; 40 % úspešnosti sa zvýraznia červeno.
        </Step>
        <Step n={5} title="Exporty">
          Vpravo hore <Click>CSV</Click>, <Click>JSON</Click>, <Click>PDF report</Click>. PDF obsahuje sumár + top/bottom 5 otázok + zoznam respondentov (PII anonymizované, ak nie ste owner).
        </Step>
        <Example title="Identifikácia problémovej otázky">
          Otázka „Aká je max. doba odpočinku?" má úspešnosť 32 % a Ø čas 87 s.
          Klik na otázku v heatmape → preview v knižnici. Po preformulovaní vytvorte novú verziu otázky a publikujte test ako <Code>v2</Code>.
        </Example>
      </div>
    ),
  },

  {
    id: "library", title: "Knižnica otázok", icon: Library, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>Otvorte <Link to="/app/library" className="text-primary underline">/app/library</Link>.</p>
        <Step n={1} title="Vyhľadávanie a filtre">
          Hore vyhľadávacie pole (fulltext v texte otázky + tagoch). Vľavo filtre: <em>Kategória, Jazyk, Obtiažnosť, Typ otázky</em>.
        </Step>
        <Step n={2} title="Preview otázky">
          Klik na riadok otázky → modal s plnou ukážkou, metadátami, použitím v testoch a verziami.
        </Step>
        <Step n={3} title="Pridanie do testu">
          V modale klik <Click>+ Pridať do testu</Click> → vyberte test z drop-downu.
        </Step>
        <p>Podporovaných je <strong>15+ typov</strong>:</p>
        <div className="not-prose grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
          {["single choice","multi choice","true/false","short text","long text","number","scale 1–10","NPS","date","file upload","ranking","matching","hotspot","signature","slider"].map(t=>(<Badge key={t} variant="secondary">{t}</Badge>))}
        </div>
        <Tip>Otázky vytvára a schvaľuje admin platformy v <Link to="/admin/questions" className="text-primary underline">/admin/questions</Link>. Vo workspace ich len vyberáte.</Tip>
      </div>
    ),
  },

  {
    id: "templates", title: "Šablóny testov", icon: Layers, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>Otvorte <Link to="/app/templates" className="text-primary underline">/app/templates</Link>.</p>
        <Step n={1} title="Prehľad šablón">
          Karty so šablónami: <em>BOZP základ, GDPR pre zamestnancov, Onboarding IT, Spokojnosť zákazníka (NPS), Akademický kvíz</em>. Každá karta zobrazuje počet otázok, jazyk, obtiažnosť.
        </Step>
        <Step n={2} title="Použiť šablónu">
          Klik <Click>Použiť šablónu</Click> → vytvorí sa <em>draft</em> kópia vo vašom účte a otvorí sa editor. Šablónu môžete ďalej upravovať bez vplyvu na originál.
        </Step>
        <Example title="BOZP pre 50 ľudí za 10 minút">
          Šablóna „BOZP základ" → <Click>Použiť šablónu</Click> → v editore tab <Click>Skupiny</Click> → vyberte <em>HR – noví zamestnanci 2026</em> → <Click>Assign &amp; Send</Click> → publikujte v tabe <Click>Verzie</Click>.
        </Example>
      </div>
    ),
  },

  {
    id: "audiences", title: "Skupiny respondentov", icon: UsersRound, group: "Workspace /app",
    tags: ["audience", "import", "email"],
    body: (
      <div className="space-y-4 text-sm">
        <p>Otvorte <Link to="/app/audiences" className="text-primary underline">/app/audiences</Link>.</p>
        <Step n={1} title="Vytvoriť skupinu">
          Vpravo hore <Click>+ Nová skupina</Click>. Dialog: <em>Názov, Popis</em>. Potvrďte <Click>Vytvoriť</Click>.
        </Step>
        <Step n={2} title="Importovať členov">
          V detaile skupiny klik <Click>+ Pridať členov</Click>. V textarea vložte emaily oddelené čiarkou, medzerou, bodkočiarkou alebo novým riadkom. Po <Click>Importovať</Click> systém odfiltruje duplicity a zobrazí počet pridaných.
          <Screen>toast „Pridaných 47 nových členov, 3 duplicity ignorované".</Screen>
        </Step>
        <Step n={3} title="Priradiť test skupine">
          V editore testu → tab <Click>Skupiny</Click> → drop-down <em>Vybrať skupinu</em> → <Click>Assign &amp; Send</Click>. Pre každého člena sa vytvorí unikátna session a (mock) sa odošle email s linkom.
        </Step>
        <Example title="Hromadný import">
          <pre className="rounded bg-background p-2 text-xs">jana@firma.sk, peter@firma.sk{"\n"}lucia@firma.sk{"\n"}adam@firma.sk; martin@firma.sk</pre>
          Výsledok: 5 unikátnych členov.
        </Example>
        <Tip>Skupina sa dá použiť opakovane pre viac testov. Členov môžete pridávať/odoberať aj po priradení.</Tip>
      </div>
    ),
  },

  {
    id: "teams", title: "Tímy a roly", icon: Users, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>Otvorte <Link to="/app/teams" className="text-primary underline">/app/teams</Link>.</p>
        <Step n={1} title="Pozvať člena">
          Klik <Click>+ Pozvať</Click> → email + výber roly (<em>Owner / Editor / Viewer</em>) → <Click>Odoslať pozvánku</Click>.
        </Step>
        <Step n={2} title="Zmeniť rolu">
          V tabuľke členov klik na drop-down roly → vyberte novú. Zmena sa zapíše do audit logu ako <Code>role.change</Code>.
        </Step>
        <Step n={3} title="Odobrať člena">
          Klik <Click>...</Click> v poslednom stĺpci → <em>Odobrať z tímu</em>. Potvrďte v dialógu.
        </Step>
        <div className="not-prose">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b text-muted-foreground"><th className="py-1 pr-3">Rola</th><th>Práva</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-1 pr-3 font-medium">Owner</td><td>všetko vrátane mazania testov, fakturácie, pozývania</td></tr>
              <tr><td className="py-1 pr-3 font-medium">Editor</td><td>vytvára/upravuje testy, audiences; nemôže mazať</td></tr>
              <tr><td className="py-1 pr-3 font-medium">Viewer</td><td>iba čítanie dashboardov + export bez PII</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },

  {
    id: "respondent-flow", title: "Vyplnenie testu (pohľad respondenta)", icon: UserCheck, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>Verejný flow na <Code>/t/&lt;shareId&gt;</Code> má 5 fáz:</p>
        <Step n={1} title="Intro">
          Hlavička testu, popis, GDPR text (z účelu zvoleného v sprievodcovi). Respondent musí zaškrtnúť <Click>Súhlasím so spracovaním</Click> a voliteľne <Click>Súhlasím s anonymizovaným trackingom</Click>.
        </Step>
        <Step n={2} title="Heslo (ak je nastavené)">
          Pole na heslo + tlačidlo <Click>Pokračovať</Click>. Po 5 neúspešných pokusoch sa zobrazí captcha.
        </Step>
        <Step n={3} title="Intake formulár">
          Postupne vyplní intake polia. Validácia (email formát, povinné polia) je client-side aj server-side.
        </Step>
        <Step n={4} title="Otázky">
          Jedna otázka na obrazovku, hore progress bar <Code>3 / 12</Code> a (ak je nastavený) odpočet času. Tlačidlá <Click>← Späť</Click>, <Click>Ďalej →</Click>. Čas per-otázka sa meria od zobrazenia po klik Ďalej.
        </Step>
        <Step n={5} title="Výsledok">
          Skóre, hodnotenie (Prešiel/Neprešiel), prípadný certifikát (PDF download). Ak má test povolenú spätnú väzbu, zobrazia sa správne odpovede.
        </Step>
        <Tip>Respondent môže test prerušiť a pokračovať na rovnakom zariadení do 7 dní — session je podpísaná v URL.</Tip>
      </div>
    ),
  },

  {
    id: "notifications", title: "Notifikácie", icon: Bell, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>Otvorte <Link to="/app/notifications" className="text-primary underline">/app/notifications</Link>.</p>
        <Step n={1} title="Inbox">
          Zoznam notifikácií: <em>typ, test, čas</em>. Neprečítané majú modrú bodku. Klik na riadok ich označí ako prečítané.
        </Step>
        <Step n={2} title="Typy">
          <ul className="ml-4 list-disc space-y-0.5">
            <li><Code>new_respondent</Code> — niekto dokončil test</li>
            <li><Code>milestone</Code> — dosiahnuté 25/50/100 sessions</li>
            <li><Code>anomaly</Code> — podozrivo rýchle vyplnenie alebo rovnaké IP</li>
            <li><Code>dsr_request</Code> — nová GDPR žiadosť</li>
          </ul>
        </Step>
        <Step n={3} title="Nastavenie triggerov">
          V editore testu → <Click>Logika a notifikácie</Click>. Pre každý typ zapnete kanál: <em>In-app, Email, Webhook</em>. Webhook URL nastavíte v <Link to="/app/account/security" className="text-primary underline">/app/account/security</Link>.
        </Step>
      </div>
    ),
  },

  {
    id: "history", title: "Moja história", icon: History, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>Otvorte <Link to="/app/history" className="text-primary underline">/app/history</Link>.</p>
        <Step n={1} title="Zoznam vyplnení">
          Tabuľka testov, ktoré <em>vy ako prihlásený používateľ</em> ste vyplnili: <em>názov testu, dátum, skóre, status</em>.
        </Step>
        <Step n={2} title="Stiahnutie certifikátu">
          Pri úspešných testoch tlačidlo <Click>Certifikát PDF</Click> v poslednom stĺpci.
        </Step>
      </div>
    ),
  },

  {
    id: "exports", title: "Exporty (CSV / JSON / PDF)", icon: FileText, group: "Workspace /app",
    body: (
      <div className="space-y-3 text-sm">
        <p>V editore testu → tab <Click>Dashboard</Click> (alebo <Click>Exporty</Click>) sú vpravo hore 3 tlačidlá.</p>
        <Step n={1} title="CSV">
          Stĺpce: <em>session_id, respondent_email, started_at, finished_at, duration_s, score_pct, status</em> + 1 stĺpec per otázka. Vhodné na otvorenie v Exceli.
        </Step>
        <Step n={2} title="JSON">
          Strojový formát so štruktúrou <Code>{`{ sessions: [...], questions: [...] }`}</Code>. Vhodné pre BI a integrácie.
        </Step>
        <Step n={3} title="PDF report">
          Generuje sa cez <Code>jspdf</Code>. Obsahuje titulnú stranu, KPI, top/bottom 5 otázok, zoznam respondentov.
        </Step>
        <Tip>Stĺpce s <Code>PII</Code> sú v exporte označené <Code>*</Code>. Každé generovanie sa loguje do <Link to="/admin/audit" className="text-primary underline">audit logu</Link>.</Tip>
      </div>
    ),
  },

  /* ===== VEREJNÝ WEB ===== */
  {
    id: "web-home", title: "Domovská stránka subenai.sk", icon: Globe, group: "Verejný web subenai.sk",
    body: (
      <div className="space-y-3 text-sm">
        <p>Verejný web (URL <Code>https://subenai.sk</Code>) má sekcie: <em>Hero, Výhody, Ako to funguje, Cenník, Referencie, FAQ, Kontakt</em>.</p>
        <Step n={1} title="Editácia obsahu (pre adminov)">
          V admin paneli <Link to="/admin/pages" className="text-primary underline">/admin/pages</Link> → vyberte stránku so slugom <Code>home</Code>.
        </Step>
        <Step n={2} title="Bloky">
          Stránka sa skladá z blokov (Hero, Text, CTA, Galéria). Pretiahnutím <Click>≡</Click> zmeníte poradie. Tlačidlo <Click>+ Blok</Click> pridá nový.
        </Step>
        <Step n={3} title="Publikovať">
          Vpravo hore <Click>Uložiť ako draft</Click> alebo <Click>Publikovať</Click>. Po publikovaní sa zmena prejaví okamžite.
        </Step>
      </div>
    ),
  },

  {
    id: "web-pages", title: "Podstránky (O nás, Cenník, Blog, Kontakt, FAQ)", icon: FolderTree, group: "Verejný web subenai.sk",
    body: (
      <div className="space-y-3 text-sm">
        <p>Každá podstránka má vlastný záznam v <Link to="/admin/pages" className="text-primary underline">/admin/pages</Link>. Verejné URL: <Code>/s/&lt;slug&gt;</Code>.</p>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b text-muted-foreground"><th className="py-1 pr-3">Slug</th><th className="pr-3">Obsah</th><th>Špecifiká</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-1 pr-3"><Code>o-nas</Code></td><td className="pr-3">tím, misia, referencie</td><td>blok „Tím" s avatarmi</td></tr>
              <tr><td className="py-1 pr-3"><Code>cennik</Code></td><td className="pr-3">plány Free/Pro/Enterprise</td><td>blok „Cenník" s features</td></tr>
              <tr><td className="py-1 pr-3"><Code>blog</Code></td><td className="pr-3">výpis článkov</td><td>auto-vygenerovaný z článkov</td></tr>
              <tr><td className="py-1 pr-3"><Code>kontakt</Code></td><td className="pr-3">formulár + mapa</td><td>tikety idú do <Link to="/admin/support" className="text-primary underline">/admin/support</Link></td></tr>
              <tr><td className="py-1 pr-3"><Code>faq</Code></td><td className="pr-3">kategorizované Q&amp;A</td><td>accordion komponenta</td></tr>
            </tbody>
          </table>
        </div>
        <Example title="Pridanie referencie">
          <Click>/admin/pages</Click> → <em>o-nas</em> → blok „Referencie" → <Click>+ Položka</Click> → meno, firma, foto, citát → <Click>Uložiť</Click> → <Click>Publikovať</Click>.
        </Example>
      </div>
    ),
  },

  {
    id: "web-navigation", title: "Navigácia, hlavička a päta", icon: Navigation, group: "Verejný web subenai.sk",
    body: (
      <div className="space-y-3 text-sm">
        <ul className="ml-5 list-disc space-y-1">
          <li><Link to="/admin/header" className="text-primary underline">/admin/header</Link> — logo, primárne menu, CTA <em>Prihlásiť</em> / <em>Registrácia</em>.</li>
          <li><Link to="/admin/footer" className="text-primary underline">/admin/footer</Link> — stĺpce odkazov, sociálne siete, GDPR linky, copyright.</li>
          <li><Link to="/admin/navigation" className="text-primary underline">/admin/navigation</Link> — hierarchia (parent/child) pre mega-menu.</li>
        </ul>
        <Example title="Pridanie položky Pre školy do menu">
          <Click>/admin/navigation</Click> → <Click>+ Položka</Click> → label <Code>Pre školy</Code>, URL <Code>/s/pre-skoly</Code>, parent <em>Riešenia</em>, target <em>Same tab</em> → <Click>Uložiť</Click>.
          <Screen>položka sa okamžite objaví v hlavičke verejného webu.</Screen>
        </Example>
      </div>
    ),
  },

  {
    id: "web-share-card", title: "Zdieľacie karty (OG / Twitter)", icon: Share2, group: "Verejný web subenai.sk",
    body: (
      <div className="space-y-3 text-sm">
        <p>Otvorte <Link to="/admin/share-card" className="text-primary underline">/admin/share-card</Link>.</p>
        <Step n={1} title="Globálne defaulty">
          Polia: <em>OG titul (max 60 zn.), OG popis (max 160 zn.), OG obrázok (1200×630 px, JPG/PNG)</em>.
        </Step>
        <Step n={2} title="Override per-stránka">
          V <Link to="/admin/pages" className="text-primary underline">/admin/pages</Link> → konkrétna stránka → sekcia <em>SEO &amp; share</em> môžete prepísať.
        </Step>
        <Step n={3} title="Náhľad">
          Pravý panel ukazuje live náhľad pre Facebook, Twitter a LinkedIn.
        </Step>
      </div>
    ),
  },

  {
    id: "web-quick-test", title: "Rýchly test na webe (lead-magnet)", icon: Sparkles, group: "Verejný web subenai.sk",
    body: (
      <div className="space-y-3 text-sm">
        <p>Modul <Link to="/admin/quick-test" className="text-primary underline">/admin/quick-test</Link> embeduje 3–5 otázok priamo na landing.</p>
        <Step n={1} title="Konfigurácia">
          Vyberte <em>zdrojový test</em>, <em>počet otázok</em> (3–5), <em>CTA po dokončení</em> (napr. „Registruj sa pre plnú verziu").
        </Step>
        <Step n={2} title="Aktivácia">
          Prepínač <Click>Zobraziť na homepage</Click>. Quick test sa vloží do bloku „Hero CTA".
        </Step>
        <Tip>Po dokončení quick-testu uložíme email (ak ho zadal) do tabuľky leadov v <Link to="/admin/respondents" className="text-primary underline">/admin/respondents</Link>.</Tip>
      </div>
    ),
  },

  /* ===== ADMIN ===== */
  {
    id: "admin-questions", title: "Knižnica otázok (admin)", icon: Library, group: "Administrácia",
    body: (
      <div className="space-y-3 text-sm">
        <p>Otvorte <Link to="/admin/questions" className="text-primary underline">/admin/questions</Link>.</p>
        <Step n={1} title="Vytvorenie otázky">
          <Click>+ Nová otázka</Click> → vyberte typ → vyplňte text + odpovede → priraďte kategóriu, tagy, obtiažnosť, jazyk → <Click>Uložiť ako draft</Click>.
        </Step>
        <Step n={2} title="Schvaľovací flow">
          Statusy: <Code>draft → review → approved → archived</Code>. Iba <em>approved</em> otázky sú viditeľné pre autorov vo workspace.
          Tlačidlo <Click>Poslať na schválenie</Click> → reviewer dostane notifikáciu.
        </Step>
        <Step n={3} title="Verzionovanie">
          Pri úprave schválenej otázky sa vytvorí nová verzia <Code>v2</Code>. Staré verzie ostávajú viazané na už-publikované testy.
        </Step>
        <Tip>Hromadné akcie (schváliť, archivovať) — zaškrtnite riadky a použite drop-down <Click>Hromadne ▾</Click>.</Tip>
      </div>
    ),
  },

  {
    id: "admin-answer-sets", title: "Sady odpovedí", icon: ListChecks, group: "Administrácia",
    body: (
      <div className="space-y-3 text-sm">
        <p><Link to="/admin/answer-sets" className="text-primary underline">/admin/answer-sets</Link> — znovupoužiteľné odpovede (napr. Likertova škála).</p>
        <Step n={1} title="Vytvoriť sadu">
          <Click>+ Nová sada</Click> → názov („Likert 1–5"), pridajte položky <Click>+ Položka</Click>.
        </Step>
        <Step n={2} title="Použitie">
          Pri vytváraní otázky typu <em>single/multi choice</em> v drop-downe <em>Odpovede</em> vyberte existujúcu sadu.
        </Step>
      </div>
    ),
  },

  {
    id: "admin-categories", title: "Kategórie a tagy", icon: FolderTree, group: "Administrácia",
    body: (
      <div className="space-y-3 text-sm">
        <p><Link to="/admin/categories" className="text-primary underline">/admin/categories</Link> — hierarchická taxonómia (max 3 úrovne).</p>
        <Step n={1} title="Pridať kategóriu">
          <Click>+ Kategória</Click> → názov + parent (alebo žiadny pre top-level).
        </Step>
        <Step n={2} title="Drag &amp; drop">
          Pretiahnutím <Click>≡</Click> meníte hierarchiu aj poradie.
        </Step>
        <Example title="BOZP taxonómia">
          <em>Bezpečnosť práce</em> → <em>BOZP</em> → <em>Práca vo výškach</em> / <em>Práca s elektrinou</em> / <em>Chemikálie</em>.
        </Example>
      </div>
    ),
  },

  {
    id: "admin-respondents", title: "Respondenti (admin)", icon: Users, group: "Administrácia",
    body: (
      <div className="space-y-3 text-sm">
        <p><Link to="/admin/respondents" className="text-primary underline">/admin/respondents</Link> — globálny zoznam všetkých respondentov platformy.</p>
        <Step n={1} title="Vyhľadávanie">
          Pole hore (email, meno, externé ID). Filtre: <em>workspace</em>, <em>posledná aktivita</em>.
        </Step>
        <Step n={2} title="Prístup k PII">
          Email a telefón sú skryté za <Click>Zobraziť</Click>. Kliknutie sa loguje cez <Code>logPiiAccess</Code> do <Link to="/admin/audit" className="text-primary underline">audit logu</Link> s vašim user_id a dôvodom.
        </Step>
        <Step n={3} title="DSR akcie">
          Pri respondentovi tlačidlá <Click>Exportovať dáta</Click> a <Click>Anonymizovať</Click> — používané pri vybavovaní GDPR žiadostí.
        </Step>
      </div>
    ),
  },

  {
    id: "admin-reports", title: "Reporty platformy", icon: BarChart3, group: "Administrácia",
    body: (
      <div className="space-y-3 text-sm">
        <p><Link to="/admin/reports" className="text-primary underline">/admin/reports</Link> — agregované metriky cez všetky workspace.</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Aktívni autori (DAU/MAU)</li>
          <li>Počet sessions a konverzia z landingu</li>
          <li>Top 10 najpoužívanejších otázok</li>
          <li>Heatmapa využitia v čase</li>
        </ul>
        <Step n={1} title="Export reportu">
          Vpravo hore <Click>Export PDF</Click> alebo <Click>Naplánovať email</Click> (denne/týždenne).
        </Step>
      </div>
    ),
  },

  {
    id: "admin-trainings", title: "Školenia a certifikáty", icon: BookOpen, group: "Administrácia",
    body: (
      <div className="space-y-3 text-sm">
        <p><Link to="/admin/trainings" className="text-primary underline">/admin/trainings</Link>.</p>
        <Step n={1} title="Šablóna certifikátu">
          Klik <Click>+ Šablóna</Click> → nahrať PDF pozadie → umiestniť placeholdery <Code>{`{{meno}}`}</Code>, <Code>{`{{datum}}`}</Code>, <Code>{`{{nazov_testu}}`}</Code>.
        </Step>
        <Step n={2} title="Priradenie k testu">
          V editore testu → tab <Click>Logika</Click> → sekcia „Certifikát" → vyberte šablónu + podmienku (napr. <em>skóre ≥ 80%</em>).
        </Step>
      </div>
    ),
  },

  {
    id: "admin-support", title: "Support tikety", icon: LifeBuoy, group: "Administrácia",
    body: (
      <div className="space-y-3 text-sm">
        <p><Link to="/admin/support" className="text-primary underline">/admin/support</Link> — in-box pre tikety z kontakt formulára na verejnom webe.</p>
        <Step n={1} title="Spracovanie tiketu">
          Klik na tiket → zobrazí sa konverzácia. Píšte odpoveď → <Click>Odoslať</Click>. Email sa pošle žiadateľovi.
        </Step>
        <Step n={2} title="Statusy">
          <em>Nový → V riešení → Vyriešený → Zatvorený</em>. Filtre nad zoznamom.
        </Step>
      </div>
    ),
  },

  {
    id: "admin-settings", title: "Globálne nastavenia", icon: Settings, group: "Administrácia",
    body: (
      <div className="space-y-3 text-sm">
        <p><Link to="/admin/settings" className="text-primary underline">/admin/settings</Link> — branding, integrácie, feature flags.</p>
        <Step n={1} title="Branding">
          Logo (SVG/PNG, max 1 MB), primárna farba (hex), favicon. Po uložení sa zmena prejaví na verejnom webe a v workspace headeri.
        </Step>
        <Step n={2} title="SMTP">
          Host, port, user, heslo, from-email. Test cez <Click>Odoslať testovací email</Click>.
        </Step>
        <Step n={3} title="Webhooks">
          Endpointy pre <em>session.completed</em>, <em>test.published</em>, <em>dsr.created</em>. Každý webhook má secret pre HMAC podpis.
        </Step>
        <Step n={4} title="Feature flags">
          Prepínače <em>quick_test_enabled</em>, <em>certificates_enabled</em>, <em>two_factor_required</em>.
        </Step>
      </div>
    ),
  },

  /* ===== BEZPEČNOSŤ & GDPR ===== */
  {
    id: "security-account", title: "Bezpečnosť účtu", icon: Lock, group: "Bezpečnosť & GDPR",
    body: (
      <div className="space-y-3 text-sm">
        <p>Otvorte <Link to="/app/account/security" className="text-primary underline">/app/account/security</Link>.</p>
        <Step n={1} title="Zmena hesla">
          Polia <em>Staré heslo, Nové heslo, Potvrdiť</em>. Sila hesla sa kontroluje proti HIBP (Have I Been Pwned).
        </Step>
        <Step n={2} title="2FA (TOTP)">
          Klik <Click>Aktivovať 2FA</Click> → naskenujte QR v Google Authenticator → zadajte 6-miestny kód → <Click>Potvrdiť</Click>. Uložia sa backup kódy.
        </Step>
        <Step n={3} title="Aktívne sessions">
          Tabuľka: <em>zariadenie, IP, posledná aktivita</em>. Klik <Click>Odhlásiť</Click> ukončí konkrétne sezenie.
        </Step>
        <Step n={4} title="Webhook secret">
          Sekcia „Notifikácie" — vygenerujte secret pre HMAC podpis prichádzajúcich webhookov.
        </Step>
      </div>
    ),
  },

  {
    id: "security-test-password", title: "Per-test heslo", icon: KeyRound, group: "Bezpečnosť & GDPR",
    body: (
      <div className="space-y-3 text-sm">
        <Step n={1} title="Aktivácia">
          V editore testu → tab <Click>Zdieľanie</Click> → prepínač <Click>Vyžadovať heslo</Click> → vyplňte pole → <Click>Uložiť</Click>.
        </Step>
        <Step n={2} title="Distribúcia hesla">
          Heslo posielajte respondentom <strong>separátne</strong> od linku (napr. SMS-kou, ak link bol cez email).
        </Step>
        <Step n={3} title="Rate-limit">
          Po 5 nesprávnych pokusoch sa zobrazí captcha. Po 10 pokusoch session zablokovaná na 1 hodinu.
        </Step>
        <Tip>Heslá nikdy neukladáme v plaintext — používame bcrypt hash. Heslo nemôžete spätne získať, len resetovať.</Tip>
      </div>
    ),
  },

  {
    id: "gdpr-dsr", title: "GDPR — DSR žiadosti", icon: FileText, group: "Bezpečnosť & GDPR",
    body: (
      <div className="space-y-3 text-sm">
        <p>Respondent vytvorí žiadosť na <Link to="/app/legal/dsr" className="text-primary underline">/app/legal/dsr</Link>.</p>
        <Step n={1} title="Typy žiadostí">
          <em>Access</em> (export dát), <em>Erasure</em> (výmaz), <em>Rectification</em> (oprava), <em>Portability</em> (prenos do iného systému).
        </Step>
        <Step n={2} title="Workflow v admine">
          V <Link to="/admin/dsr" className="text-primary underline">/admin/dsr</Link> sa žiadosť objaví v stave <Code>received</Code>. Postup: <em>received → verified → in_progress → resolved</em>.
        </Step>
        <Step n={3} title="SLA">
          Vybavenie do <strong>30 dní</strong>. Pri prekročení sa žiadosť zvýrazní červeno a pošle eskalácia ownerovi.
        </Step>
        <Example title="Výmaz účtu">
          Žiadosť „Erasure" → admin v <Code>/admin/dsr</Code> klikne <Click>Anonymizovať</Click> → meno nahradené <Code>Anonym #1234</Code>, email zmazaný, IP hashované. Audit log zapíše <Code>dsr.anonymize</Code>.
        </Example>
      </div>
    ),
  },

  {
    id: "audit", title: "Audit log", icon: ListChecks, group: "Bezpečnosť & GDPR",
    body: (
      <div className="space-y-3 text-sm">
        <p><Link to="/admin/audit" className="text-primary underline">/admin/audit</Link> — chronologický záznam citlivých akcií.</p>
        <Step n={1} title="Stĺpce">
          <em>Čas, Aktér (user), Akcia, Cieľ, IP, Detaily</em>. Filter podľa akcie a dátumu.
        </Step>
        <Step n={2} title="Sledované akcie">
          <ul className="ml-4 list-disc space-y-0.5">
            <li><Code>test.publish</Code>, <Code>test.archive</Code>, <Code>test.delete</Code></li>
            <li><Code>pii_access</Code> — kto pozrel email/telefón respondenta</li>
            <li><Code>dsr.anonymize</Code>, <Code>dsr.export</Code></li>
            <li><Code>role.change</Code>, <Code>team.invite</Code></li>
            <li><Code>login.failed</Code> (5+ pokusov)</li>
          </ul>
        </Step>
        <Tip>Audit log nie je možné mazať. Export do externého SIEM cez webhook (Enterprise plán).</Tip>
      </div>
    ),
  },

  /* ===== DÁTA A SÚKROMIE ===== */
  {
    id: "data-overview", title: "Prehľad — čo o vás zbierame", icon: Database, group: "Dáta a súkromie",
    tags: ["gdpr", "súkromie", "dáta"],
    body: (
      <div className="space-y-3 text-sm">
        <p>Rozsah dát závisí od toho, <strong>v akej roli</strong> platformu používate:</p>
        <div className="not-prose grid gap-3 sm:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Návštevník verejného webu</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Iba technické a analytické cookies. Žiadne identifikujúce údaje, pokiaľ neodošlete formulár.</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Workspace používateľ</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Účet, profil, vytvorené testy, audiences, audit prístupov.</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4" /> Respondent</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Intake polia, odpovede, časy, IP (hashované). Možnosť úplnej anonymizácie.</CardContent></Card>
        </div>
        <Tip>Detail nájdete v 3 nasledujúcich sekciách. Vždy máte právo na výpis aj výmaz cez <Link to="/app/legal/dsr" className="text-primary underline">DSR žiadosť</Link>.</Tip>
      </div>
    ),
  },

  {
    id: "data-public", title: "Dáta — návštevník verejného webu", icon: Cookie, group: "Dáta a súkromie",
    body: (
      <div className="space-y-3 text-sm">
        <p>Pri prehliadaní <Code>subenai.sk</Code> bez prihlásenia zbierame minimum:</p>
        <DataTable rows={[
          { field: "session_id (cookie)", purpose: "Udržanie session počas návštevy", retention: "Do zatvorenia prehliadača", legal: "Oprávnený záujem — nevyhnutné" },
          { field: "consent (cookie)", purpose: "Záznam vášho súhlasu s cookies", retention: "12 mesiacov", legal: "Plnenie GDPR povinnosti" },
          { field: "IP adresa (hashovaná)", purpose: "Bezpečnosť, anti-bot, geolokácia na úroveň krajiny", retention: "30 dní (raw), 12 mes. (hash)", legal: "Oprávnený záujem" },
          { field: "User-Agent", purpose: "Optimalizácia pre prehliadače", retention: "30 dní v logoch", legal: "Oprávnený záujem" },
          { field: "Referrer", purpose: "Atribúcia zdroja návštevy", retention: "30 dní", legal: "Oprávnený záujem" },
          { field: "Analytika (Plausible/GA — opt-in)", purpose: "Anonymizovaná štatistika návštevnosti", retention: "12 mesiacov", legal: "Súhlas (banner)" },
        ]}/>
        <Step n={1} title="Cookie banner">
          Pri prvej návšteve sa zobrazí banner s tromi voľbami: <Click>Iba nevyhnutné</Click>, <Click>Prispôsobiť</Click>, <Click>Prijať všetky</Click>.
        </Step>
        <Step n={2} title="Kontaktný formulár (/s/kontakt)">
          Ak vyplníte: zbierame <em>meno, email, predmet, správa, časová pečiatka, IP</em>. Tikety idú do <Code>/admin/support</Code> a uchovávame ich 24 mesiacov alebo do vyriešenia + 6 mesiacov.
        </Step>
        <Step n={3} title="Newsletter prihláška">
          Zbierame <em>email</em> + double opt-in token. Odhlásenie 1 klikom v každom emaile.
        </Step>
        <Tip>Žiadne reklamné cookies tretích strán, žiadne fingerprinting, žiadny tracking medzi doménami.</Tip>
      </div>
    ),
  },

  {
    id: "data-workspace", title: "Dáta — Workspace /app používateľ", icon: LayoutDashboard, group: "Dáta a súkromie",
    body: (
      <div className="space-y-3 text-sm">
        <p>Po prihlásení do <Link to="/app" className="text-primary underline">/app</Link> spracúvame:</p>
        <DataTable rows={[
          { field: "Účet — email, hash hesla", purpose: "Autentifikácia", retention: "Po dobu existencie účtu", legal: "Plnenie zmluvy" },
          { field: "Profil — meno, avatar, jazyk, časová zóna", purpose: "Personalizácia UI", retention: "Po dobu existencie účtu", legal: "Plnenie zmluvy" },
          { field: "Tímová rola", purpose: "Kontrola prístupu (RBAC)", retention: "Po dobu členstva v tíme", legal: "Plnenie zmluvy" },
          { field: "Vytvorené testy, otázky, šablóny", purpose: "Vlastný obsah", retention: "Pokiaľ ich nezmažete", legal: "Plnenie zmluvy" },
          { field: "Skupiny respondentov (emaily)", purpose: "Distribúcia testov", retention: "Pokiaľ ich nezmažete", legal: "Oprávnený záujem správcu skupiny" },
          { field: "Session cookies (httpOnly, SameSite=Lax)", purpose: "Prihlásenie", retention: "30 dní (refresh), 1 hod (access)", legal: "Nevyhnutné" },
          { field: "Audit log — akcie nad PII a testami", purpose: "Bezpečnosť, GDPR accountability", retention: "24 mesiacov", legal: "Plnenie GDPR povinnosti" },
          { field: "Logy prihlásení (IP, UA, čas)", purpose: "Detekcia podvodov, 2FA výzvy", retention: "12 mesiacov", legal: "Oprávnený záujem" },
          { field: "Faktúry, billing údaje", purpose: "Účtovníctvo", retention: "10 rokov (zákonná povinnosť)", legal: "Zákonná povinnosť" },
          { field: "Notifikácie + ich nastavenia", purpose: "Funkcionalita aplikácie", retention: "Pokiaľ ich nezmažete", legal: "Plnenie zmluvy" },
        ]}/>
        <Step n={1} title="Stiahnutie vlastných dát">
          <Link to="/app/account/security" className="text-primary underline">/app/account/security</Link> → sekcia „Moje dáta" → <Click>Exportovať všetky moje dáta (ZIP)</Click>. Pripravíme JSON archív do 24 h.
        </Step>
        <Step n={2} title="Zmazanie účtu">
          <Click>Zmazať účet</Click> → potvrdenie cez email. Účet sa zmaže do 30 dní (soft-delete + final purge). Audit log zostane anonymizovaný.
        </Step>
        <Tip>Vaše testy a otázky nikdy nepoužívame na trénovanie AI bez explicitného opt-inu.</Tip>
      </div>
    ),
  },

  {
    id: "data-respondent", title: "Dáta — respondent (vyplnenie testu)", icon: UserCheck, group: "Dáta a súkromie",
    body: (
      <div className="space-y-3 text-sm">
        <p>Pri vyplnení testu cez <Code>/t/&lt;shareId&gt;</Code> spracúvame:</p>
        <DataTable rows={[
          { field: "Intake polia (definuje autor)", purpose: "Identifikácia respondenta v rámci testu", retention: "Podľa účelu testu (default 24 mes.)", legal: "Súhlas pred štartom" },
          { field: "Odpovede na otázky", purpose: "Vyhodnotenie testu", retention: "Spolu s testom", legal: "Súhlas" },
          { field: "Čas per-otázka (sekundy)", purpose: "Analýza náročnosti", retention: "Spolu s testom", legal: "Súhlas" },
          { field: "Začiatok / koniec sessionu", purpose: "Výpočet trvania, anti-fraud", retention: "Spolu s testom", legal: "Súhlas" },
          { field: "IP adresa (SHA-256 hash)", purpose: "Anti-fraud, anomálie", retention: "12 mesiacov", legal: "Oprávnený záujem" },
          { field: "User-Agent", purpose: "Kompatibilita, podpora", retention: "12 mesiacov", legal: "Oprávnený záujem" },
          { field: "GDPR súhlas (timestamp + verzia textu)", purpose: "Dôkaz súhlasu", retention: "5 rokov", legal: "Plnenie GDPR" },
          { field: "Tracking opt-in (voliteľný)", purpose: "Detailnejšia analýza (heatmapy)", retention: "12 mesiacov", legal: "Súhlas" },
          { field: "Certifikát (PDF)", purpose: "Doklad o absolvovaní", retention: "Po dobu platnosti certifikátu", legal: "Plnenie zmluvy s autorom" },
        ]}/>
        <Step n={1} title="Pred štartom">
          Respondent vidí presný zoznam intake polí + plnoznenie GDPR textu. Bez zaškrtnutia súhlasu sa test nedá spustiť.
        </Step>
        <Step n={2} title="Anonymný režim">
          Ak autor nezahrnie žiadne PII intake pole, session sa uloží len pod náhodným <Code>session_id</Code> a hash IP. Pre respondenta plne anonymné.
        </Step>
        <Step n={3} title="Práva respondenta">
          Cez link na konci výsledkov <em>„Spravovať moje dáta"</em> sa dostane na <Link to="/app/legal/dsr" className="text-primary underline">/app/legal/dsr</Link> kde môže žiadať export, opravu alebo výmaz.
        </Step>
        <Example title="Anonymizácia po žiadosti">
          Pôvodné: <Code>{`{ name: "Peter Novák", email: "peter@firma.sk", ip: "1.2.3.4" }`}</Code><br />
          Po anonymizácii: <Code>{`{ name: "Anonym #1234", email: null, ip: "sha256:abcd..." }`}</Code><br />
          Odpovede ostanú zachované pre štatistiku.
        </Example>
        <Tip>IP adresa sa nikdy neukladá v plaintext — okamžite ju hashujeme + soľ rotujeme každých 90 dní.</Tip>
      </div>
    ),
  },

  {
    id: "data-recipients", title: "Komu dáta posielame", icon: Share2, group: "Dáta a súkromie",
    body: (
      <div className="space-y-3 text-sm">
        <p>Vaše dáta zdieľame iba s nasledovnými spracovateľmi (všetci v EÚ alebo so SCC):</p>
        <DataTable rows={[
          { field: "Hosting (Cloudflare / Hetzner)", purpose: "Beh aplikácie", retention: "Po dobu zmluvy", legal: "Spracovateľská zmluva" },
          { field: "Databáza (Supabase EU)", purpose: "Uloženie dát", retention: "Po dobu zmluvy", legal: "Spracovateľská zmluva" },
          { field: "Email (Resend / SendGrid)", purpose: "Notifikácie, magic-link", retention: "30 dní (delivery log)", legal: "Spracovateľská zmluva" },
          { field: "Analytika (Plausible EU)", purpose: "Návštevnosť (opt-in)", retention: "12 mesiacov", legal: "Súhlas" },
          { field: "Audit log archív (S3 EU)", purpose: "Dlhodobé uchovanie audit logu", retention: "24 mesiacov", legal: "Plnenie GDPR" },
        ]}/>
        <Tip>Žiadne dáta neposielame mimo EÚ bez Štandardných zmluvných doložiek (SCC). Žiadny predaj dát tretím stranám — nikdy.</Tip>
      </div>
    ),
  },

  {
    id: "data-rights", title: "Vaše práva (GDPR)", icon: Shield, group: "Dáta a súkromie",
    body: (
      <div className="space-y-3 text-sm">
        <p>Ako dotknutá osoba máte podľa GDPR tieto práva. Všetky vykonáte cez <Link to="/app/legal/dsr" className="text-primary underline">/app/legal/dsr</Link> alebo emailom na <a href="mailto:dpo@subenai.sk" className="text-primary underline">dpo@subenai.sk</a>.</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Prístup</strong> (čl. 15) — výpis všetkých dát, ktoré o vás máme.</li>
          <li><strong>Oprava</strong> (čl. 16) — oprava nesprávnych údajov.</li>
          <li><strong>Výmaz / „byť zabudnutý"</strong> (čl. 17) — vymazanie všetkých dát.</li>
          <li><strong>Obmedzenie spracovania</strong> (čl. 18) — počas sporu o presnosti dát.</li>
          <li><strong>Prenosnosť</strong> (čl. 20) — export v JSON/CSV pre prenos do iného systému.</li>
          <li><strong>Námietka</strong> (čl. 21) — voči spracovaniu na základe oprávneného záujmu.</li>
          <li><strong>Odvolanie súhlasu</strong> — kedykoľvek, bez vplyvu na spätné spracovanie.</li>
          <li><strong>Sťažnosť na ÚOOÚ SR</strong> — <a href="https://dataprotection.gov.sk" className="text-primary underline" target="_blank" rel="noreferrer">dataprotection.gov.sk</a>.</li>
        </ul>
        <Tip>SLA pre vybavenie žiadosti: <strong>30 dní</strong>, v komplexných prípadoch s odôvodnením do 90 dní.</Tip>
      </div>
    ),
  },
];

const GROUPS: Group[] = [
  "Začíname",
  "Workspace /app",
  "Verejný web subenai.sk",
  "Administrácia",
  "Bezpečnosť & GDPR",
  "Dáta a súkromie",
];

/* ---------------- admin flag ---------------- */

const ADMIN_GROUPS: Group[] = ["Administrácia"];
const isAdminGroup = (g: Group) => ADMIN_GROUPS.includes(g);

function subscribeAdmin(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => { if (e.key === "subenai.isAdmin") cb(); };
  window.addEventListener("storage", handler);
  window.addEventListener("subenai:admin-change", cb);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("subenai:admin-change", cb);
  };
}
const getAdminSnapshot = () =>
  typeof window !== "undefined" && localStorage.getItem("subenai.isAdmin") === "1";
const useIsAdmin = () => useSyncExternalStore(subscribeAdmin, getAdminSnapshot, () => false);

/* ---------------- page ---------------- */

function DocsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const isAdmin = useIsAdmin();

  const visibleSections = useMemo(
    () => SECTIONS.filter((s) => isAdmin || !isAdminGroup(s.group)),
    [isAdmin],
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return visibleSections;
    const needle = q.toLowerCase();
    return visibleSections.filter((s) =>
      s.title.toLowerCase().includes(needle) ||
      s.group.toLowerCase().includes(needle) ||
      (s.tags ?? []).some((t) => t.includes(needle))
    );
  }, [q, visibleSections]);

  useEffect(() => {
    const exists = visibleSections.some((s) => s.id === active);
    if (!exists) setActive(visibleSections[0]?.id ?? SECTIONS[0].id);
  }, [visibleSections, active]);

  const rawActive = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const restricted = !isAdmin && isAdminGroup(rawActive.group);
  const activeSection = rawActive;
  const ActiveIcon = activeSection.icon;

  const handleLogoutAdmin = () => {
    try { localStorage.removeItem("subenai.isAdmin"); } catch { /* ignore */ }
    if (typeof window !== "undefined") window.dispatchEvent(new Event("subenai:admin-change"));
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <header className="border-b border-border/40 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </span>
            SubenAI · Docs
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/app">Workspace</Link></Button>
            {isAdmin ? (
              <>
                <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>
                <Button asChild variant="ghost" size="sm"><Link to="/admin">Admin panel</Link></Button>
                <Button variant="outline" size="sm" onClick={handleLogoutAdmin}>Odhlásiť admin</Button>
              </>
            ) : (
              <Button asChild size="sm"><Link to="/admin-login">Admin login</Link></Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Hľadať v dokumentácii…"
                className="pl-8"
              />
            </div>
            <nav className="mt-3 space-y-3 text-sm">
              {GROUPS.map((g) => {
                const items = filtered.filter((s) => s.group === g);
                if (items.length === 0) return null;
                return (
                  <div key={g}>
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g}</span>
                      {isAdminGroup(g) && <Shield className="h-3 w-3 text-primary" />}
                    </div>
                    <div className="space-y-0.5">
                      {items.map((s) => {
                        const Icon = s.icon;
                        const isActive = s.id === active;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setActive(s.id)}
                            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition ${isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{s.title}</span>
                            </span>
                            <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="px-2 py-4 text-xs text-muted-foreground">Žiadny výsledok pre „{q}".</p>
              )}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{activeSection.group}</Badge>
                {isAdminGroup(activeSection.group) && (
                  <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" /> Iba admin</Badge>
                )}
              </div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ActiveIcon className="h-5 w-5 text-primary" />
                {activeSection.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              {restricted ? (
                <div className="not-prose flex flex-col items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-foreground">Sekcia len pre administrátorov</div>
                    <p className="text-sm text-muted-foreground">
                      Návody pre admin panel (knižnica otázok, kategórie, CMS verejného webu, respondenti) sú dostupné
                      iba po prihlásení s admin rolou.
                    </p>
                  </div>
                  <Button asChild size="sm"><Link to="/admin-login">Prihlásiť sa ako admin</Link></Button>
                </div>
              ) : (
                activeSection.body
              )}
            </CardContent>
          </Card>

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Potrebujete pomoc?</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Pozrite si <Link to="/app/help" className="text-primary underline">Help centrum</Link> alebo napíšte na <a href="mailto:support@subenai.sk" className="text-primary underline">support@subenai.sk</a>.
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Vizuálne ukážky</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Screenshoty a video tutoriály pribudnú v ďalšej verzii. Pre ad-hoc demo kontaktujte <a href="mailto:demo@subenai.sk" className="text-primary underline">demo@subenai.sk</a>.
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
