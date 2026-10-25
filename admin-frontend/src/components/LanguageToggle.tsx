'use client';

import { setLanguage, useLanguage } from '@/lib/language';

export default function LanguageToggle() {
  const { language, t } = useLanguage();
  return (
    <div role="group" aria-label={t('Ngôn ngữ', 'Language')} className="flex rounded-full border-2 border-[#bdc8d2] bg-white p-0.5 text-[11px] font-black uppercase">
      {(['vi', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
          className={`rounded-full px-3 py-1 uppercase transition ${language === code ? 'bg-[#006590] text-white' : 'text-[#3e4850] hover:text-[#006590]'}`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
