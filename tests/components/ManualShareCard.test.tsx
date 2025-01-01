import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ManualShareCard } from "@/components/quiz/ManualShareCard";

const url = "https://internetiq.sk/r/ABC12345";
const text = "Som Internet Ninja v Internet IQ teste — 75/100. Zvládneš to lepšie? 👇";

let writeTextSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeTextSpy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: writeTextSpy },
  });
});

describe("ManualShareCard", () => {
  it("renders the IG/TikTok header, both CTA buttons and the 4-step ordered list", () => {
    render(
      <ManualShareCard
        url={url}
        text={text}
        onDownloadStory={vi.fn().mockResolvedValue(undefined)}
        downloading={false}
      />,
    );
    expect(screen.getByText(/Instagram & TikTok/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Stiahnuť IG Story obrázok/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Skopírovať caption/i })).toBeInTheDocument();
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(4);
  });

  it("calls onDownloadStory when the download button is clicked", () => {
    const onDownload = vi.fn().mockResolvedValue(undefined);
    render(
      <ManualShareCard url={url} text={text} onDownloadStory={onDownload} downloading={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Stiahnuť IG Story obrázok/i }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("disables the download button while downloading and shows the in-progress label", () => {
    render(
      <ManualShareCard
        url={url}
        text={text}
        onDownloadStory={vi.fn().mockResolvedValue(undefined)}
        downloading={true}
      />,
    );
    const btn = screen.getByRole("button", { name: /Stiahnuť IG Story obrázok/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/Generujem/);
  });

  it("copies caption + bare URL (no UTM) to clipboard and shows a confirmation toast", async () => {
    render(
      <ManualShareCard
        url={url}
        text={text}
        onDownloadStory={vi.fn().mockResolvedValue(undefined)}
        downloading={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Skopírovať caption/i }));

    await waitFor(() => expect(writeTextSpy).toHaveBeenCalledTimes(1));
    const [payload] = writeTextSpy.mock.calls[0];
    expect(payload).toBe(`${text} ${url}`);
    // No UTM noise in IG/TikTok captions — the link isn't clickable there.
    expect(payload).not.toContain("utm_source");

    expect(await screen.findByText(/✅ Skopírované/)).toBeInTheDocument();
  });

  it("clears the toast after 1.8s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(
        <ManualShareCard
          url={url}
          text={text}
          onDownloadStory={vi.fn().mockResolvedValue(undefined)}
          downloading={false}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /Skopírovať caption/i }));
      await waitFor(() => expect(screen.getByText(/✅ Skopírované/)).toBeInTheDocument());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1900);
      });
      expect(screen.queryByText(/✅ Skopírované/)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
