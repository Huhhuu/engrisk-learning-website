"use client";

import { setLanguage, useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, t } = useLanguage();
  return (
    <div role="group" aria-label={t("Ngôn ngữ", "Language")} className={cn("flex rounded-full border-2 border-border bg-card p-0.5 font-display text-xs font-bold", className)}>
      {(["vi", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
          className={cn(
            "rounded-full px-3 py-1 uppercase transition",
            language === code ? "bg-primary text-primary-foreground" : "text-[#404a52] hover:text-primary"
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
