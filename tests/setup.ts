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
  if (!window.scrollTo) {
    window.scrollTo = () => {};
  }
}

afterEach(() => {
  cleanup();
});
