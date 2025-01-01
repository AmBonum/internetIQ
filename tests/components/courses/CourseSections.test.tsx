import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseSectionView } from "@/components/courses/sections/CourseSections";
import type { CourseSection } from "@/content/courses";

describe("CourseSectionView — every CourseSection kind", () => {
  it("intro renders heading and body", () => {
    const section: CourseSection = { kind: "intro", heading: "Úvod", body: "Telo úvodu." };
    render(<CourseSectionView section={section} idx={0} />);
    expect(screen.getByRole("heading", { name: "Úvod" })).toBeInTheDocument();
    expect(screen.getByText("Telo úvodu.")).toBeInTheDocument();
  });

  it("checklist renders one row per item with good/bad icon", () => {
    const section: CourseSection = {
      kind: "checklist",
      heading: "Kontrola",
      items: [
        { good: true, text: "Doména súhlasí" },
        { good: false, text: "Subdoména je iná" },
      ],
    };
    render(<CourseSectionView section={section} idx={0} />);
    expect(screen.getByText("Doména súhlasí")).toBeInTheDocument();
    expect(screen.getByText("Subdoména je iná")).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
  });

  it("redflags renders all flags as list items", () => {
    const section: CourseSection = {
      kind: "redflags",
      heading: "Varovné signály",
      flags: ["Súrnosť", "Žiadosť o kód", "Skoro správna doména"],
    };
    render(<CourseSectionView section={section} idx={0} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Súrnosť")).toBeInTheDocument();
  });

  it("do_dont renders both columns", () => {
    const section: CourseSection = {
      kind: "do_dont",
      heading: "Pravidlá",
      do: ["Volaj banke priamo"],
      dont: ["Klikať na linky zo SMS"],
    };
    render(<CourseSectionView section={section} idx={0} />);
    expect(screen.getByText("Áno")).toBeInTheDocument();
    expect(screen.getByText("Nie")).toBeInTheDocument();
    expect(screen.getByText("Volaj banke priamo")).toBeInTheDocument();
    expect(screen.getByText("Klikať na linky zo SMS")).toBeInTheDocument();
  });

  it("scenario renders story and right_action box", () => {
    const section: CourseSection = {
      kind: "scenario",
      heading: "Scenár",
      story: "Príde ti SMS s linkom.",
      right_action: "Zavolaj banke.",
    };
    render(<CourseSectionView section={section} idx={0} />);
    expect(screen.getByText("Príde ti SMS s linkom.")).toBeInTheDocument();
    expect(screen.getByText("Zavolaj banke.")).toBeInTheDocument();
    expect(screen.getByText("Správna reakcia")).toBeInTheDocument();
  });

  it("section frame uses unique id derived from heading + index", () => {
    const a: CourseSection = { kind: "intro", heading: "Prvá", body: "x" };
    const b: CourseSection = { kind: "intro", heading: "Druhá", body: "y" };
    const { container } = render(
      <>
        <CourseSectionView section={a} idx={0} />
        <CourseSectionView section={b} idx={1} />
      </>,
    );
    const sections = container.querySelectorAll("section[id]");
    const ids = [...sections].map((s) => s.getAttribute("id"));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
