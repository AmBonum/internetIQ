import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { RespondentRow } from "@/lib/edu/types";

type SortKey = "name" | "score" | "created_at";
type SortDir = "asc" | "desc";

interface Props {
  rows: RespondentRow[];
  passingThreshold: number;
  onDelete: (attemptId: string) => Promise<boolean>;
}

export function RespondentsTable({ rows, passingThreshold, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.respondent_name.toLowerCase().includes(q) || r.respondent_email.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return a.respondent_name.localeCompare(b.respondent_name, "sk") * dir;
        case "score":
          return (a.final_score - b.final_score) * dir;
        case "created_at":
        default:
          return a.created_at.localeCompare(b.created_at) * dir;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  async function handleDelete(row: RespondentRow) {
    if (
      !window.confirm(
        `Naozaj zmazať respondenta ${row.respondent_name} (${row.respondent_email})? Akciu nedá vrátiť.`,
      )
    ) {
      return;
    }
    setPendingDelete(row.id);
    try {
      await onDelete(row.id);
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <section aria-labelledby="resp-h" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="resp-h" className="text-lg font-semibold text-foreground">
            Respondenti ({filtered.length})
          </h2>
          <p className="text-sm text-muted-foreground">Klik na hlavičku stĺpca = zoradenie.</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hľadať podľa mena alebo e-mailu…"
          aria-label="Filtrovať respondentov"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm sm:max-w-xs"
        />
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
          {rows.length === 0
            ? "Zatiaľ žiadne odpovede. Pošli respondentom verejný link."
            : "Filter nenašiel žiadny záznam."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Respondenti edu testu zoradení podľa{" "}
              {sortKey === "name" ? "mena" : sortKey === "score" ? "skóre" : "dátumu"}
            </caption>
            <thead className="bg-muted/30 text-left">
              <tr>
                <SortableTh ariaSort={ariaSort("name")} onClick={() => toggleSort("name")}>
                  Meno
                </SortableTh>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Email
                </th>
                <SortableTh ariaSort={ariaSort("score")} onClick={() => toggleSort("score")}>
                  Skóre
                </SortableTh>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Vyhovel?
                </th>
                <SortableTh
                  ariaSort={ariaSort("created_at")}
                  onClick={() => toggleSort("created_at")}
                >
                  Dátum
                </SortableTh>
                <th scope="col" className="px-3 py-2 font-semibold">
                  <span className="sr-only">Akcie</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const passed = r.final_score >= passingThreshold;
                return (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-3 py-2 font-medium text-foreground">{r.respondent_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.respondent_email}</td>
                    <td className="px-3 py-2 font-bold tabular-nums text-foreground">
                      {r.final_score}%
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          passed
                            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500"
                            : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-500"
                        }
                      >
                        {passed ? "áno" : "nie"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("sk-SK")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        disabled={pendingDelete === r.id}
                        aria-label={`Zmazať respondenta ${r.respondent_name}`}
                        className="inline-flex items-center justify-center rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SortableTh({
  children,
  ariaSort,
  onClick,
}: {
  children: React.ReactNode;
  ariaSort: "ascending" | "descending" | "none";
  onClick: () => void;
}) {
  return (
    <th scope="col" aria-sort={ariaSort} className="px-3 py-2 font-semibold">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 hover:text-primary"
      >
        {children}
        <span aria-hidden className="text-xs">
          {ariaSort === "ascending" ? "↑" : ariaSort === "descending" ? "↓" : "↕"}
        </span>
      </button>
    </th>
  );
}
