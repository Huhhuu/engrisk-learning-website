"use client";

import { IconArrowsExchange, IconLanguage } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ApiError, api } from "@/lib/api";

type Lang = "vi" | "en";

const languageNames: Record<Lang, string> = { vi: "Tiếng Việt", en: "English" };

export function TranslatePage() {
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
      toast(error instanceof ApiError && error.status === 503 ? "Tính năng AI đang tắt." : "Không thể dịch. Vui lòng thử lại.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{languageNames[source]} → {languageNames[target]}</CardTitle>
          <Button variant="outline" onClick={swap} aria-label="Đổi chiều dịch">
            <IconArrowsExchange className="h-4 w-4" /> Đổi chiều
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Textarea
            rows={10}
            maxLength={5000}
            aria-label={`Văn bản ${languageNames[source]}`}
            placeholder={source === "vi" ? "Nhập tiếng Việt..." : "Type English..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) translate(); }}
          />
          <Textarea rows={10} readOnly aria-label={`Bản dịch ${languageNames[target]}`} placeholder="Bản dịch" value={result} />
        </div>
        <Button onClick={translate} disabled={loading || !text.trim()}>
          <IconLanguage className="h-4 w-4" /> {loading ? "Đang dịch..." : "Dịch (Ctrl + Enter)"}
        </Button>
      </CardContent>
    </Card>
  );
}
