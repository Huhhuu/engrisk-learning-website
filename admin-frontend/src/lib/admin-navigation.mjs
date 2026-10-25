export const adminNavigation = [
  {
    label: { vi: 'Tổng quan', en: 'Overview' },
    items: [
      { href: '/dashboard', icon: 'dashboard', label: { vi: 'Bảng điều khiển', en: 'Dashboard' } },
      { href: '/analytics', icon: 'query_stats', label: { vi: 'Phân tích', en: 'Analytics' } },
    ],
  },
  {
    label: { vi: 'Nội dung', en: 'Content' },
    items: [
      { href: '/courses', icon: 'auto_stories', label: { vi: 'Khóa học', en: 'Courses' } },
      { href: '/lessons', icon: 'menu_book', label: { vi: 'Bài học', en: 'Lessons' } },
      { href: '/levels', icon: 'layers', label: { vi: 'Cấp độ', en: 'Levels' } },
      { href: '/topics', icon: 'topic', label: { vi: 'Chủ đề', en: 'Topics' } },
      { href: '/flashcards', icon: 'translate', label: { vi: 'Từ vựng', en: 'Vocabulary' } },
      { href: '/decks', icon: 'style', label: { vi: 'Bộ thẻ', en: 'Decks' } },
      { href: '/import', icon: 'cloud_download', label: { vi: 'Tác vụ nhập', en: 'Import Jobs' } },
      { href: '/import-file', icon: 'upload_file', label: { vi: 'Nhập từ tệp', en: 'File Import' } },
      { href: '/content', icon: 'dynamic_feed', label: { vi: 'Nguồn nội dung', en: 'Content Feed' } },
    ],
  },
  {
    label: { vi: 'Học tập', en: 'Learning' },
    items: [
      { href: '/quizzes', icon: 'quiz', label: { vi: 'Quiz', en: 'Quizzes' } },
      { href: '/quiz-management', icon: 'edit_note', label: { vi: 'Quản lý quiz', en: 'Quiz Management' } },
      { href: '/spaced-repetition', icon: 'event_repeat', label: { vi: 'Lặp lại ngắt quãng', en: 'Spaced Repetition' } },
      { href: '/user-progress', icon: 'school', label: { vi: 'Tiến độ học viên', en: 'Learner Progress' } },
      { href: '/reports', icon: 'bar_chart', label: { vi: 'Báo cáo', en: 'Reports' } },
    ],
  },
  {
    label: { vi: 'Con người', en: 'People' },
    items: [{ href: '/users', icon: 'group', label: { vi: 'Người dùng', en: 'Users' } }],
  },
  {
    label: { vi: 'Tài khoản', en: 'Account' },
    items: [
      { href: '/notifications', icon: 'notifications', label: { vi: 'Thông báo', en: 'Notifications' } },
      { href: '/settings', icon: 'settings', label: { vi: 'Cài đặt', en: 'Settings' } },
    ],
  },
  {
    label: { vi: 'Super Admin', en: 'Super Admin' },
    role: 'super_admin',
    items: [
      { href: '/super-admin', icon: 'shield', label: { vi: 'Bảng điều khiển Super Admin', en: 'Super Dashboard' } },
      { href: '/roles', icon: 'admin_panel_settings', label: { vi: 'Vai trò & phạm vi giáo viên', en: 'Roles & Teacher Scope' } },
      { href: '/operations', icon: 'monitor_heart', label: { vi: 'AI, giám sát & điều khiển', en: 'AI, Monitoring & Controls' } },
      { href: '/audit-logs', icon: 'history', label: { vi: 'Lịch sử kiểm toán', en: 'Audit Trail' } },
    ],
  },
];

export const adminAliases = {
  '/progress': '/user-progress',
  '/quiz': '/quizzes',
  '/vocabulary': '/flashcards',
  '/vocabulary-sets': '/decks',
};

export function navigationForRole(role) {
  return adminNavigation.filter((group) => !group.role || group.role === role);
}
