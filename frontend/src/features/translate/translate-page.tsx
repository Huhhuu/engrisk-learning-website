"use client";

import { IconArrowsExchange, IconLanguage } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ApiError, api } from "@/lib/api";
import { useLanguage, tr } from "@/lib/language";

type Lang = "vi" | "en";

const languageNames: Record<Lang, Record<Lang, string>> = {
  vi: { vi: "Tiếng Việt", en: "Vietnamese" },
  en: { vi: "Tiếng Anh", en: "English" }
};

export function TranslatePage() {
  const { language, t } = useLanguage();
  const [source, setSource] = useState<Lang>("vi");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const target: Lang = source === "vi" ? "en" : "vi";

  function swap() {
    setSource(target);
    setText(result);
    setResult(text);
  }

  async function translate() {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      setResult((await api.translate(text.trim(), source, target)).translated_text);
    } catch (error) {
      toast(error instanceof ApiError && error.status === 503 ? tr("Tính năng AI đang tắt.", "The AI feature is turned off.") : tr("Không thể dịch. Vui lòng thử lại.", "Could not translate. Please try again."), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{languageNames[source][language]} → {languageNames[target][language]}</CardTitle>
          <Button variant="outline" onClick={swap} aria-label={t("Đổi chiều dịch", "Swap direction")}>
            <IconArrowsExchange className="h-4 w-4" /> {t("Đổi chiều", "Swap")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Textarea
            rows={10}
            maxLength={5000}
            aria-label={t(`Văn bản ${languageNames[source].vi}`, `${languageNames[source].en} text`)}
            placeholder={source === "vi" ? t("Nhập tiếng Việt...", "Type Vietnamese...") : t("Nhập tiếng Anh...", "Type English...")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) translate(); }}
          />
          <Textarea rows={10} readOnly aria-label={t(`Bản dịch ${languageNames[target].vi}`, `${languageNames[target].en} translation`)} placeholder={t("Bản dịch", "Translation")} value={result} />
        </div>
        <Button onClick={translate} disabled={loading || !text.trim()}>
          <IconLanguage className="h-4 w-4" /> {loading ? t("Đang dịch...", "Translating...") : t("Dịch (Ctrl + Enter)", "Translate (Ctrl + Enter)")}
        </Button>
      </CardContent>
    </Card>
  );
}
