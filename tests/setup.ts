import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom does not implement layout/scroll APIs that React components reach
// for during smooth-scroll UX (Element.scrollIntoView, Element.scrollTo).
// Stub them globally so a test that triggers an expand/scroll flow does
// not surface a TypeError from inside a setTimeout that runs after the
// assertion is already done.
if (typeof window !== "undefined") {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  // jsdom DOES define window.scrollTo, but its implementation logs
  // "Not implemented" to stderr — overwrite unconditionally so QuestionCard's
  // scroll-reset effect (and similar UX hooks) doesn't pollute test output.
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}

afterEach(() => {
  cleanup();
});
