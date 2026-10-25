import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LanguageToggle from './LanguageToggle';
import Sidebar from './Sidebar';
import { setLanguage } from '@/lib/language';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

function renderShell() {
  return render(<><LanguageToggle /><Sidebar role="admin" open onClose={() => {}} /></>);
}

describe('LanguageToggle', () => {
  beforeEach(() => setLanguage('vi'));

  it('switches the admin navigation between Vietnamese and English and remembers the choice', () => {
    const { unmount } = renderShell();
    expect(screen.getByRole('link', { name: /Bảng điều khiển/ })).toBeInTheDocument();
    expect(screen.getByText('Nội dung')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'en' }));

    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'en' })).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem('admin.language')).toBe('en');

    unmount();
    renderShell();
    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
  });
});
