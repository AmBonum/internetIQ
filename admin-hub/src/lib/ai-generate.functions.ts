import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  topic: z.string().min(3).max(500),
  category: z.string().min(1).max(80),
  correctCount: z.number().int().min(1).max(6).default(3),
  incorrectCount: z.number().int().min(1).max(8).default(5),
});

const OutputSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  body: z.string(),
  correct_answers: z.array(z.object({ text: z.string(), explanation: z.string().optional() })),
  incorrect_answers: z.array(z.object({ text: z.string(), explanation: z.string().optional() })),
});

export type GeneratedQuestion = z.infer<typeof OutputSchema>;

export const generateQuestionWithAnswers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<GeneratedQuestion> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Chýba LOVABLE_API_KEY na serveri.");
    }

    const system = `Si expert na kybernetickú bezpečnosť a tvoríš vzdelávací obsah pre slovenskú platformu subenai.sk. Generuješ kvalitné edukatívne otázky o internetových podvodoch s realistickými správnymi a nesprávnymi odpoveďami. Vždy odpovedaj iba čistým JSON podľa schémy, bez markdownu, bez komentárov.`;

    const user = `Vygeneruj jednu otázku v slovenčine na tému: "${data.topic}".
Branža/kontext: ${data.category}.
Otázka má pomôcť používateľovi rozpoznať reálny podvod alebo správne reagovať.

Vráť VÝLUČNE JSON v tvare:
{
  "title": "krátky názov otázky (max 110 znakov)",
  "excerpt": "jednovetový sumár (max 180 znakov)",
  "body": "2-4 vety s kontextom situácie",
  "correct_answers": [ { "text": "...", "explanation": "..." }, ... ${data.correctCount}x ],
  "incorrect_answers": [ { "text": "...", "explanation": "..." }, ... ${data.incorrectCount}x ]
}
Presný počet odpovedí: ${data.correctCount} správnych a ${data.incorrectCount} nesprávnych. Odpovede sú krátke (max 140 znakov) a navzájom rôzne.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI Gateway: prekročený limit požiadaviek. Skúste o chvíľu.");
    if (res.status === 402) throw new Error("AI Gateway: vyčerpané kredity workspace.");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI Gateway zlyhala (${res.status}): ${text.slice(0, 200)}`);
    }

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = payload?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }
    return OutputSchema.parse(parsed);
  });
