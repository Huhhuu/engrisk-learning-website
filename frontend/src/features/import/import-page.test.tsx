import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { ApiError, api } from "@/lib/api";
import { ImportPage } from "./import-page";

vi.mock("@/components/ui/cat-loader", () => ({ CatLoader: ({ label }: { label: string }) => <p role="status">{label}</p> }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { ...actual.api, catalogTopics: vi.fn(), importJobs: vi.fn(), translate: vi.fn() } };
});

describe("ImportPage translate missing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.catalogTopics).mockResolvedValue([]);
    vi.mocked(api.importJobs).mockResolvedValue([]);
    window.localStorage.setItem("fsrspring-import-draft", JSON.stringify({
      text: "",
      rows: [{ clientRowId: "a", word: "apple" }, { clientRowId: "b", word: "banana" }]
    }));
  });

  it("keeps translations that succeeded when others are rate limited", async () => {
    vi.mocked(api.translate).mockImplementation(async (word) => {
      if (word === "banana") throw new ApiError(429, "AI service rate limit reached.");
      return { translated_text: "quả táo", source_lang: "en", target_lang: "vi" };
    });
    render(<ToastProvider><ImportPage /></ToastProvider>);

    fireEvent.click(await screen.findByRole("button", { name: /Dịch phần thiếu/ }));

    await waitFor(() => expect(screen.getByDisplayValue("quả táo")).toBeInTheDocument());
    expect(await screen.findByText(/1 dòng chưa dịch được/)).toBeInTheDocument();
    expect(api.translate).toHaveBeenCalledTimes(2);
  });
});
