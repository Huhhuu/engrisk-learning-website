import { useSyncExternalStore } from "react";

export type Language = "vi" | "en";

const LANGUAGE_STORAGE_KEY = "fsrspring.language";
const LANGUAGE_CHANGE_EVENT = "fsrspring:language-change";

// Fallback when localStorage is blocked (private mode, sandboxed iframe).
let memoryLanguage: Language = "vi";

function readLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "vi" || stored === "en" ? stored : memoryLanguage;
  } catch {
    return memoryLanguage;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setLanguage(language: Language) {
  memoryLanguage = language;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Keep the in-memory choice for this tab.
  }
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}

// Display names for enum values the API sends (statuses, FSRS states, roles, difficulty, severity).
const enumLabels: Record<string, [vi: string, en: string]> = {
  pending: ["Đang chờ", "Pending"],
  in_progress: ["Đang làm", "In progress"],
  completed: ["Hoàn thành", "Completed"],
  cancelled: ["Đã hủy", "Cancelled"],
  active: ["Đang học", "Active"],
  new: ["Mới", "New"],
  learning: ["Đang học", "Learning"],
  review: ["Ôn tập", "Review"],
  relearning: ["Học lại", "Relearning"],
  learner: ["Học viên", "Learner"],
  teacher: ["Giáo viên", "Teacher"],
  admin: ["Quản trị viên", "Admin"],
  super_admin: ["Super Admin", "Super Admin"],
  BEGINNER: ["Cơ bản", "Beginner"],
  INTERMEDIATE: ["Trung cấp", "Intermediate"],
  ADVANCED: ["Nâng cao", "Advanced"],
  DONE: ["Xong", "Done"],
  open: ["Đang mở", "Open"],
  resolved: ["Đã xử lý", "Resolved"],
  warning: ["Cảnh báo", "Warning"],
  critical: ["Nghiêm trọng", "Critical"],
};

/** `t(vi, en)` picks the string for the current UI language; the server render is always Vietnamese. */
export function useLanguage() {
  const language = useSyncExternalStore(subscribe, readLanguage, () => "vi" as Language);
  const t = (vi: string, en: string) => (language === "vi" ? vi : en);
  /** Translate an API enum value; unknown values are shown as-is. */
  const label = (value: string) => {
    const pair = enumLabels[value];
    return pair ? t(...pair) : value;
  };
  return { language, t, label };
}

/** Reads the stored language directly, for handlers, effects and helpers. The calling component must also use useLanguage() so it re-renders on change; not for server-rendered markup. */
// shortcut: messages already on screen keep their language after a switch; store { vi, en } in state if that matters.
export function tr(vi: string, en: string) {
  return typeof window !== "undefined" && readLanguage() === "en" ? en : vi;
}
