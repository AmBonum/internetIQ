import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Session, Test, Question, Respondent } from "./types";

const downloadBlob = (data: BlobPart, type: string, filename: string) => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export function exportSessionsCSV(test: Test, sessions: Session[], questions: Question[], respondents: Respondent[]) {
  const qids = test.question_ids;
  const header = ["session_id", "respondent_email", "started_at", "finished_at", "status", "score", "segment", ...qids.map((q) => `q_${q}`)];
  const rows = sessions.map((s) => {
    const r = respondents.find((x) => x.id === s.respondent_id);
    const ans = Object.fromEntries(s.answers.map((a) => [a.question_id, a.value]));
    return [
      s.id, r?.email ?? "", s.started_at, s.finished_at ?? "", s.status,
      s.score?.toString() ?? "", s.segment ?? "", ...qids.map((q) => ans[q] ?? ""),
    ];
  });
  const csv = [header, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob("\ufeff" + csv, "text/csv;charset=utf-8", `${test.slug}-sessions.csv`);
}

export function exportSessionsJSON(test: Test, sessions: Session[]) {
  downloadBlob(JSON.stringify({ test, sessions }, null, 2), "application/json", `${test.slug}-sessions.json`);
}

export function exportSummaryPDF(test: Test, sessions: Session[], questions: Question[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`SubenAI — ${test.title}`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Verzia ${test.version} · Status: ${test.status} · ${sessions.length} session-ov`, 14, 25);

  const completed = sessions.filter((s) => s.status === "completed");
  const avg = completed.length ? Math.round(completed.reduce((a, s) => a + (s.score ?? 0), 0) / completed.length) : 0;
  const passRate = completed.length ? Math.round((completed.filter((s) => (s.score ?? 0) >= 70).length / completed.length) * 100) : 0;

  autoTable(doc, {
    startY: 32,
    head: [["Metrika", "Hodnota"]],
    body: [
      ["Dokončené", String(completed.length)],
      ["Priemerné skóre", `${avg}%`],
      ["Pass rate (≥70%)", `${passRate}%`],
      ["GDPR účel", test.gdpr_purpose],
    ],
    theme: "grid",
    headStyles: { fillColor: [99, 102, 241] },
  });

  const qStats = test.question_ids.map((qid) => {
    const q = questions.find((x) => x.id === qid);
    const all = sessions.flatMap((s) => s.answers.filter((a) => a.question_id === qid));
    const correct = all.filter((a) => a.is_correct).length;
    const acc = all.length ? Math.round((correct / all.length) * 100) : 0;
    const avgMs = all.length ? Math.round(all.reduce((a, x) => a + x.time_ms, 0) / all.length) : 0;
    return [q?.prompt.slice(0, 60) ?? qid, `${acc}%`, `${(avgMs / 1000).toFixed(1)}s`];
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
    head: [["Otázka", "Presnosť", "Priem. čas"]],
    body: qStats,
    theme: "striped",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  doc.save(`${test.slug}-summary.pdf`);
}
