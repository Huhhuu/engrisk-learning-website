'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { ApiError, auth, fetchCapabilities, type User } from '@/lib/api';
import { T, useLanguage, tr } from '@/lib/language';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export default function AdminLayout({ children, title, requiredRole }: AdminLayoutProps) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User>();
  const [menuOpen, setMenuOpen] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    Promise.all([auth.adminMe(), fetchCapabilities()]).then(([user]: [User, unknown]) => {
      if (cancelled) return;
      if (!['admin', 'super_admin'].includes(user.role ?? '')) {
        setMessage(tr('Khu vực này chỉ dành cho quản trị viên.', 'This area is restricted to administrators.'));
        void auth.logout().finally(() => router.replace('/login?forbidden=1'));
        return;
      }
      if (requiredRole && user.role !== requiredRole) {
        router.replace('/dashboard?forbidden=1');
        return;
      }
      setUser(user);
      setState('ready');
    }).catch((error) => {
      if (cancelled) return;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) router.replace('/login');
      else {
        setMessage(tr('Không thể kết nối máy chủ. Vui lòng thử lại.', 'Could not reach the server. Please retry.'));
        setState('error');
      }
    });
    return () => { cancelled = true; };
  }, [requiredRole, router]);

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  if (state !== 'ready') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="font-bold">{message || <T vi="Đang kiểm tra quyền quản trị..." en="Checking administrator access..." />}</p>
          {state === 'error' && <button className="mt-4 rounded-xl bg-[#006590] px-4 py-2 font-bold text-white" onClick={() => window.location.reload()}><T vi="Thử lại" en="Retry" /></button>}
        </div>
      </main>
    );
  }

  return (
    <div className="admin-shell min-h-screen">
      <Sidebar role={user?.role} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="min-h-screen lg:ml-64">
        <TopBar title={title} user={user!} menuOpen={menuOpen} onMenu={() => setMenuOpen((open) => !open)} />
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-10 lg:pt-28">
          {children}
        </div>
      </main>
    </div>
  );
}
