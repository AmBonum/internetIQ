// Clipboard wrapper. Centralised so we can:
//   1. Test it with a single vi.mock (no jsdom navigator-mutation gymnastics).
//   2. Apply the iOS / older-Safari `execCommand("copy")` fallback in one
//      place instead of repeating it at every call site.
//   3. Surface a single Boolean result so callers don't need to handle
//      Permissions API / SecurityError per call.

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path. Permissions can deny clipboard-write
    // in cross-origin iframes or insecure contexts; the textarea+execCommand
    // route is allowed in those cases.
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
