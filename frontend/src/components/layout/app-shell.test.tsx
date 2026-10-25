import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";
import { ApiError, auth } from "@/lib/api";
import { setLanguage } from "@/lib/language";

let pathname = "/";
const replace = vi.fn();
const router = { replace, refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams()
}));
vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a> }));
vi.mock("@/components/ui/cat-loader", () => ({ CatLoader: ({ label }: { label: string }) => <p role="status">{label}</p> }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, auth: { ...actual.auth, me: vi.fn(), logout: vi.fn() } };
});

describe("AppShell public access", () => {
  beforeEach(() => {
    pathname = "/";
    vi.clearAllMocks();
    setLanguage("vi");
  });

  it("renders public children for guests", async () => {
    vi.mocked(auth.me).mockRejectedValue(new ApiError(401, "Unauthenticated"));
    render(<AppShell><p>Public catalog</p></AppShell>);
    expect(await screen.findByText("Public catalog")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("link", { name: "Đăng nhập" })).toBeInTheDocument());
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects protected routes before mounting children", async () => {
    pathname = "/profile";
    vi.mocked(auth.me).mockRejectedValue(new ApiError(401, "Unauthenticated"));
    render(<AppShell><p>Private profile</p></AppShell>);
    expect(screen.queryByText("Private profile")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?next=%2Fprofile"));
  });

  it("keeps public content available when auth is unavailable", async () => {
    vi.mocked(auth.me).mockRejectedValue(new Error("offline"));
    render(<AppShell><p>Public catalog</p></AppShell>);
    expect(await screen.findByText("Public catalog")).toBeInTheDocument();
  });

  it("keeps the login page above the persistent background", async () => {
    pathname = "/login";
    render(<AppShell><p>Login form</p></AppShell>);

    expect((await screen.findByText("Login form")).parentElement).toHaveClass("app-shell");
  });

  it("switches headings and nav between Vietnamese and English and remembers the choice", async () => {
    vi.mocked(auth.me).mockRejectedValue(new ApiError(401, "Unauthenticated"));
    const { unmount } = render(<AppShell><p>Public catalog</p></AppShell>);
    expect(await screen.findByRole("heading", { level: 1, name: "Hôm nay" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Khóa học/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "en" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Today" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Courses/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(window.localStorage.getItem("fsrspring.language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");

    unmount();
    render(<AppShell><p>Public catalog</p></AppShell>);
    expect(await screen.findByRole("heading", { level: 1, name: "Today" })).toBeInTheDocument();
  });
});
