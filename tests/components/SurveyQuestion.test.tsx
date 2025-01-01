import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SurveyQuestion } from "@/components/quiz/SurveyQuestion";

const opts = [
  { id: "a", label: "Option A" },
  { id: "b", label: "Option B" },
  { id: "c", label: "Option C" },
];

describe("SurveyQuestion — single", () => {
  it("renders a radiogroup with one radio per option", () => {
    render(
      <SurveyQuestion type="single" label="Test" options={opts} value="" onChange={() => {}} />,
    );
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("calls onChange with the option id on click", () => {
    const onChange = vi.fn();
    render(
      <SurveyQuestion type="single" label="Test" options={opts} value="" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Option B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("clicking the selected option toggles it off (passes empty string)", () => {
    const onChange = vi.fn();
    render(
      <SurveyQuestion type="single" label="Test" options={opts} value="b" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Option B" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("reflects selection via aria-checked", () => {
    render(
      <SurveyQuestion type="single" label="Test" options={opts} value="a" onChange={() => {}} />,
    );
    expect(screen.getByRole("radio", { name: "Option A" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Option B" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

describe("SurveyQuestion — multi", () => {
  it("renders a group with one toggle button per option", () => {
    render(
      <SurveyQuestion type="multi" label="Test" options={opts} value={[]} onChange={() => {}} />,
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("adds an option to the array on click and removes it on second click", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SurveyQuestion type="multi" label="Test" options={opts} value={[]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Option A" }));
    expect(onChange).toHaveBeenLastCalledWith(["a"]);

    rerender(
      <SurveyQuestion type="multi" label="Test" options={opts} value={["a"]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Option B" }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);

    rerender(
      <SurveyQuestion
        type="multi"
        label="Test"
        options={opts}
        value={["a", "b"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Option A" }));
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
  });

  it("reflects multi-selection via aria-pressed", () => {
    render(
      <SurveyQuestion
        type="multi"
        label="Test"
        options={opts}
        value={["a", "c"]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Option A" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Option B" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Option C" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("SurveyQuestion — yesno", () => {
  it("renders a radiogroup with Áno + Nie", () => {
    render(<SurveyQuestion type="yesno" label="Test" value={null} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "Áno" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Nie" })).toBeInTheDocument();
  });

  it("calls onChange(true) for Áno and onChange(false) for Nie", () => {
    const onChange = vi.fn();
    render(<SurveyQuestion type="yesno" label="Test" value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Áno" }));
    expect(onChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("radio", { name: "Nie" }));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("aria-checked reflects current value (boolean | null)", () => {
    const { rerender } = render(
      <SurveyQuestion type="yesno" label="Test" value={null} onChange={() => {}} />,
    );
    expect(screen.getByRole("radio", { name: "Áno" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "Nie" })).toHaveAttribute("aria-checked", "false");

    rerender(<SurveyQuestion type="yesno" label="Test" value={true} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "Áno" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Nie" })).toHaveAttribute("aria-checked", "false");
  });
});

describe("SurveyQuestion — text", () => {
  it("calls onChange on each keystroke", () => {
    const onChange = vi.fn();
    render(<SurveyQuestion type="text" label="Mesto" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Košice" } });
    expect(onChange).toHaveBeenCalledWith("Košice");
  });

  it("enforces maxLength via the input attribute", () => {
    render(
      <SurveyQuestion type="text" label="Mesto" value="" onChange={() => {}} maxLength={80} />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "80");
  });

  it("renders placeholder when provided", () => {
    render(
      <SurveyQuestion
        type="text"
        label="Mesto"
        value=""
        onChange={() => {}}
        placeholder="napr. Košice"
      />,
    );
    expect(screen.getByPlaceholderText("napr. Košice")).toBeInTheDocument();
  });

  it("marks the input aria-invalid when error is set", () => {
    render(
      <SurveyQuestion type="text" label="Mesto" value="" onChange={() => {}} error="Required" />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("SurveyQuestion — shared concerns", () => {
  it("renders the label and an asterisk when required is true", () => {
    render(
      <SurveyQuestion
        type="single"
        label="Pohlavie"
        options={opts}
        value=""
        onChange={() => {}}
        required
      />,
    );
    expect(screen.getByText("Pohlavie")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
  });

  it("renders an inline destructive error message under the field", () => {
    render(
      <SurveyQuestion
        type="single"
        label="Pohlavie"
        options={opts}
        value=""
        onChange={() => {}}
        error="Vyber aspoň jednu možnosť."
      />,
    );
    const err = screen.getByRole("alert");
    expect(err).toHaveTextContent("Vyber aspoň jednu možnosť.");
    expect(err.className).toContain("text-destructive");
  });

  it("renders a hint when provided", () => {
    render(
      <SurveyQuestion
        type="multi"
        label="Témy"
        options={opts}
        value={[]}
        onChange={() => {}}
        hint="Vyber všetky ktoré ťa zaujímajú."
      />,
    );
    expect(screen.getByText("Vyber všetky ktoré ťa zaujímajú.")).toBeInTheDocument();
  });
});
