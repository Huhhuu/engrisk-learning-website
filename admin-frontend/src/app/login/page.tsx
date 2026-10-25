'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { auth } from '@/lib/api';
import { T, tr, useLanguage } from '@/lib/language';
import LanguageToggle from '@/components/LanguageToggle';

const errors: Record<string, { vi: string; en: string }> = {
  denied: { vi: 'Tài khoản Google này không có quyền truy cập trang quản trị.', en: 'This Google account does not have access to the admin area.' },
  configuration: { vi: 'Đăng nhập quản trị chưa được cấu hình. Vui lòng liên hệ người vận hành.', en: 'Admin sign-in is not configured. Please contact the operator.' },
};

function LoginCard() {
  const params = useSearchParams();
  const router = useRouter();
  const [handoffError, setHandoffError] = useState('');
  const handoff = params.get('handoff');
  const { t } = useLanguage();
  const error = errors[params.get('error') ?? ''] || (params.has('forbidden') ? errors.denied : undefined);
  const message = error ? t(error.vi, error.en) : '';

  useEffect(() => {
    if (!handoff) return;
    window.history.replaceState({}, '', '/login');
    auth.completeGoogleAdmin(handoff)
      .then(({ return: target }) => router.replace(target))
      .catch(() => setHandoffError(tr('Không thể hoàn tất phiên Google. Vui lòng đăng nhập lại.', 'Could not finish the Google session. Please sign in again.')));
  }, [handoff, router]);

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#fbf9f9] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#006590] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border-[70px] border-white/10" />
        <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-[#1cb0f6]/45" />
        <div className="relative z-10">
          <p className="font-display text-4xl font-bold">Englisk-Studi</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-sky-100"><T vi="Trung tâm quản trị" en="Admin control center" /></p>
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="material-symbols-outlined text-[76px] text-[#ffdf92]">admin_panel_settings</span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.08]"><T vi="Vận hành việc học," en="Run learning operations," /><br /><T vi="không làm gián đoạn người học." en="without disrupting learners." /></h1>
          <p className="mt-6 max-w-lg text-lg font-semibold leading-relaxed text-sky-100"><T vi="Quản lý khóa học, người dùng và hệ thống AI từ một không gian bảo mật riêng." en="Manage courses, users and AI systems from one dedicated secure space." /></p>
        </div>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-4xl font-bold text-[#006590]">Englisk-Studi</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#56636d]"><T vi="Trung tâm quản trị" en="Admin control center" /></p>
          </div>

          <div className="learning-card p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e8f4ff] text-[#006590]">
                <span className="material-symbols-outlined text-3xl">shield_lock</span>
              </div>
              <LanguageToggle />
            </div>
            <h2 className="mt-6 font-display text-3xl font-bold text-[#1b1c1c]"><T vi="Đăng nhập quản trị" en="Admin sign-in" /></h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-[#56636d]"><T vi="Tiếp tục bằng tài khoản Google được cấp quyền quản trị." en="Continue with a Google account that has admin access." /></p>

            {(message || handoffError) && (
              <div role="alert" className="mt-5 rounded-xl border-2 border-[#ffb4ab] bg-[#fff0ee] p-4 text-sm font-bold text-[#93000a]">{message || handoffError}</div>
            )}

            <a href="/api/v1/auth/oauth/google/admin" aria-disabled={Boolean(handoff)} className="btn-tactile mt-7 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#bdc8d2] bg-white px-5 py-4 font-display font-bold text-[#1b1c1c] shadow-[0_4px_0_#9ca7b0] transition hover:border-[#006590] disabled:opacity-60">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#4285f4] text-sm font-black text-white">G</span>
              {handoff ? <T vi="Đang hoàn tất đăng nhập…" en="Finishing sign-in…" /> : <T vi="Tiếp tục với Google" en="Continue with Google" />}
            </a>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#bdc8d2]/50" /></div>
              <span className="relative bg-white px-3 text-xs font-bold uppercase tracking-wider text-[#56636d]"><T vi="Dành cho Dev" en="For developers" /></span>
            </div>

            <a
              href="/auth/dev-admin-login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#006590] bg-[#e8f4ff] px-5 py-3.5 font-display text-sm font-bold text-[#006590] transition hover:bg-[#d5ebff]"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              <T vi="Đăng nhập nhanh Super Admin (Local Dev)" en="Quick Super Admin sign-in (Local Dev)" />
            </a>

          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginCard /></Suspense>;
}
