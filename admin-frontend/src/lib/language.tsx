'use client';

import { useSyncExternalStore } from 'react';

export type Language = 'vi' | 'en';

const LANGUAGE_STORAGE_KEY = 'admin.language';
const LANGUAGE_CHANGE_EVENT = 'admin:language-change';

// Fallback when localStorage is blocked (private mode, sandboxed iframe).
let memoryLanguage: Language = 'vi';

function readLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'vi' || stored === 'en' ? stored : memoryLanguage;
  } catch {
    return memoryLanguage;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
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

// Display names for enum values the API sends (statuses, roles, import classifications, severity).
const enumLabels: Record<string, [vi: string, en: string]> = {
  draft: ['Bản nháp', 'Draft'],
  published: ['Đã xuất bản', 'Published'],
  archived: ['Đã lưu trữ', 'Archived'],
  pending: ['Đang chờ', 'Pending'],
  running: ['Đang chạy', 'Running'],
  succeeded: ['Thành công', 'Succeeded'],
  'review-ready': ['Chờ duyệt', 'Review ready'],
  approved: ['Đã duyệt', 'Approved'],
  failed: ['Thất bại', 'Failed'],
  staged: ['Chờ áp dụng', 'Staged'],
  applied: ['Đã áp dụng', 'Applied'],
  stale: ['Lỗi thời', 'Stale'],
  new: ['Mới', 'New'],
  update: ['Cập nhật', 'Update'],
  invalid: ['Không hợp lệ', 'Invalid'],
  conflict: ['Xung đột', 'Conflict'],
  unchanged: ['Không đổi', 'Unchanged'],
  categories: ['Danh mục', 'Categories'],
  courses: ['Khóa học', 'Courses'],
  vocabulary: ['Từ vựng', 'Vocabulary'],
  lessons: ['Bài học', 'Lessons'],
  file_catalog: ['Danh mục từ tệp', 'File catalog'],
  learner: ['Học viên', 'Learner'],
  teacher: ['Giáo viên', 'Teacher'],
  admin: ['Quản trị viên', 'Admin'],
  super_admin: ['Super Admin', 'Super Admin'],
  info: ['Thông tin', 'Info'],
  warning: ['Cảnh báo', 'Warning'],
  critical: ['Nghiêm trọng', 'Critical'],
};

/** `t(vi, en)` picks the string for the current UI language; the server render is always Vietnamese. */
export function useLanguage() {
  const language = useSyncExternalStore(subscribe, readLanguage, (): Language => 'vi');
  const t = (vi: string, en: string) => (language === 'vi' ? vi : en);
  /** Translate an API enum value; unknown values are shown as-is. */
  const label = (value: string) => {
    const pair = enumLabels[value];
    return pair ? t(...pair) : value;
  };
  return { language, t, label };
}

/** Inline translation for JSX children, so parent components need no hook. */
export function T({ vi, en }: { vi: string; en: string }) {
  return useLanguage().t(vi, en);
}

/** Enum value rendered in the current UI language, for components without the hook. */
export function EnumLabel({ value }: { value: string }) {
  return useLanguage().label(value);
}

/** Reads the stored language directly, for handlers, effects and helpers. The calling component must also use useLanguage() so it re-renders on change; not for server-rendered markup. */
// shortcut: messages already on screen keep their language after a switch; store { vi, en } in state if that matters.
export function tr(vi: string, en: string) {
  return typeof window !== 'undefined' && readLanguage() === 'en' ? en : vi;
}
