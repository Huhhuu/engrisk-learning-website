"use client";

import { IconDeviceFloppy, IconReload, IconSearch, IconSparkles, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShellLoading } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, fetchCapabilities } from "@/lib/api";
import type { AiFlashcard, FsrsCard, QuizWord } from "@/lib/api";
import { useLanguage, tr } from "@/lib/language";

const TRUSTED_INITIAL = 3;
const TRUSTED_BATCH = 3;

const ratings = [
  { value: 1, label: { vi: "Quên", en: "Again" }, hint: { vi: "< 1 ngày", en: "< 1 day" }, className: "bg-red-500 hover:bg-red-600 btn-press-red" },
  { value: 2, label: { vi: "Khó", en: "Hard" }, hint: { vi: "~2 ngày", en: "~2 days" }, className: "bg-orange-500 hover:bg-orange-600 btn-press-orange" },
  { value: 3, label: { vi: "Tốt", en: "Good" }, hint: { vi: "~5 ngày", en: "~5 days" }, className: "bg-emerald-500 hover:bg-emerald-600 btn-press-green" },
  { value: 4, label: { vi: "Dễ", en: "Easy" }, hint: { vi: "~2 tuần", en: "~2 weeks" }, className: "bg-blue-500 hover:bg-blue-600 btn-press-sky" }
];

function uniqueTrustedCards(cards: QuizWord[]) {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = card.word.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function FlashcardsPage() {
  const { language, t, label } = useLanguage();
  const [due, setDue] = useState<FsrsCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [trusted, setTrusted] = useState<QuizWord[]>([]);
  const [visibleCount, setVisibleCount] = useState(TRUSTED_INITIAL);
  const [search, setSearch] = useState("");
  // searchQuery is the committed value used in API calls.
  // Separating it from `search` prevents API calls on every keystroke.
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(10);
  const [aiCards, setAiCards] = useState<AiFlashcard[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Same rule as the nav: hide only when the backend reports the feature unconfigured.
    fetchCapabilities().then((caps) => setAiEnabled(!caps.ai || caps.ai.status !== "unconfigured"));
  }, []);

  const load = useCallback(async () => {
    const [dueWords, cards] = await Promise.all([api.fsrsDue(30).then((result) => result.data).catch(() => []), api.flashcardRecommendations(searchQuery).catch(() => [])]);
    setDue(dueWords);
    setTrusted(uniqueTrustedCards(cards));
    setVisibleCount(TRUSTED_INITIAL);
    setIndex(0);
    setFlipped(false);
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    load().catch(() => { setLoading(false); toast(tr("Không thể tải thẻ từ máy chủ. Đang hiển thị dữ liệu trống.", "Could not load flashcards from the backend. Showing empty data."), "warning"); });
  }, [load, toast]);

  const current = due[index];
  const progress = due.length ? (index / due.length) * 100 : 0;

  async function review(rating: number) {
    if (!current) return;
    try {
      await api.fsrsReview(current, (["again", "hard", "good", "easy"] as const)[rating - 1]);
      toast(tr(`Đã lưu đánh giá: ${rating}`, `Saved rating: ${rating}`), "success");
      setFlipped(false);
      setIndex((value) => Math.min(value + 1, due.length));
    } catch {
      toast(tr("Không thể lưu đánh giá. Vui lòng thử lại.", "Could not save the rating. Please try again."), "error");
    }
  }

  async function importTrusted() {
    if (importing) return;
    setImporting(true);
    setTrusted([]);
    setVisibleCount(TRUSTED_INITIAL);
    try {
      const cards = uniqueTrustedCards(await api.flashcardRecommendations(searchQuery));
      setTrusted(cards);
      toast(cards.length ? tr("Đã nhập bộ thẻ tin cậy.", "Trusted flashcards imported.") : tr("Không có flashcard mới từ API ngoài.", "No new flashcards from the external API."), cards.length ? "success" : "warning");
    } catch {
      toast(tr("Không thể nhập bộ thẻ.", "Could not import flashcards."), "error");
    } finally {
      setImporting(false);
    }
  }

  async function saveTrusted(id: number) {
    if (savingId) return;
    setSavingId(id);
    try {
      await api.saveFlashcardRecommendation(id);
      toast(tr("Đã lưu vào từ vựng.", "Saved to vocabulary."), "success");
      setTrusted((cards) => uniqueTrustedCards(cards.filter((card) => card.id !== id)));
      const dueWords = await api.fsrsDue(30).then((result) => result.data).catch(() => due);
      setDue(dueWords);
      setIndex(0);
      setFlipped(false);
    } catch (error) {
      const message = error instanceof ApiError && error.status === 401
        ? tr("Bạn cần đăng nhập để lưu flashcard vào từ vựng.", "You need to sign in to save flashcards to your vocabulary.")
        : tr("Không thể lưu flashcard.", "Could not save flashcards.");
      toast(message, "error");
    } finally {
      setSavingId(null);
    }
  }

  async function generateAi() {
    if (!aiTopic.trim() || aiBusy) return;
    setAiBusy(true);
    try {
      const cards = await api.aiFlashcards(aiTopic.trim(), aiCount);
      setAiCards(cards);
      toast(cards.length ? tr(`AI đã tạo ${cards.length} flashcard.`, `AI generated ${cards.length} flashcards.`) : tr("AI không tạo được flashcard nào.", "AI could not generate any flashcards."), cards.length ? "success" : "warning");
    } catch (error) {
      toast(error instanceof ApiError && error.status === 503 ? tr("Tính năng AI đang tắt.", "The AI feature is turned off.") : tr("Không thể tạo flashcard bằng AI.", "Could not generate flashcards with AI."), "error");
    } finally {
      setAiBusy(false);
    }
  }

  async function saveAi() {
    if (!aiCards.length || aiBusy) return;
    setAiBusy(true);
    try {
      const result = await api.commitImport({
        sourceType: "PASTE",
        targetSet: { name: `AI: ${aiTopic.trim()}`.slice(0, 120) },
        rows: aiCards.map((card, i) => ({ clientRowId: `ai-${i}`, ...card }))
      });
      toast(tr(`Đã lưu ${result.createdCount} flashcard mới${result.skippedCount ? `, ${result.skippedCount} thẻ đã có sẵn` : ""}.`, `Saved ${result.createdCount} new flashcards${result.skippedCount ? `, ${result.skippedCount} already existed` : ""}.`), "success");
      setAiCards([]);
      setDue(await api.fsrsDue(30).then((res) => res.data).catch(() => due));
      setIndex(0);
      setFlipped(false);
    } catch {
      toast(tr("Không thể lưu flashcard.", "Could not save flashcards."), "error");
    } finally {
      setAiBusy(false);
    }
  }

  const sessionDone = due.length > 0 && index >= due.length;
  const filteredTrusted = useMemo(() => trusted.slice(0, visibleCount), [trusted, visibleCount]);
  const hasMoreTrusted = visibleCount < trusted.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreTrusted) {
          setVisibleCount((prev) => Math.min(prev + TRUSTED_BATCH, trusted.length));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreTrusted, trusted.length]);

  if (loading) return <AppShellLoading label={t("Đang tải thẻ ghi nhớ...", "Loading flashcards...")} />;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <section className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("Ôn tập FSRS", "FSRS Review")}</CardTitle>
                  <p className="text-sm font-semibold text-muted-foreground">{Math.min(index, due.length)} / {due.length} {t("thẻ", "cards")}</p>
                </div>
                <Button variant="outline" onClick={load}><IconReload className="h-4 w-4" /> {t("Tải lại", "Reload")}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <Progress value={progress} />
              {sessionDone ? (
                <div className="rounded-xl bg-accent p-8 text-center">
                  <h2 className="font-display text-2xl font-bold text-primary">{t("Hoàn thành phiên ôn", "Session complete")}</h2>
                  <p className="mt-2 font-semibold text-muted-foreground">{t("Không còn thẻ đến hạn trong hàng đợi này.", "No more due cards in this queue.")}</p>
                </div>
              ) : current ? (
                <>
                  <button
                    type="button"
                    onClick={() => setFlipped((value) => !value)}
                    className="group w-full [perspective:1200px]"
                    aria-expanded={flipped}
                    aria-label={t("Lật thẻ", "Flip flashcard")}
                  >
                    <span className={`relative block min-h-80 rounded-xl transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 bg-card p-8 text-center shadow-lifted [backface-visibility:hidden] transition-colors group-hover:border-primary">
                        <p className="font-display text-3xl font-bold text-primary">{current.word}</p>
                        {current.pronunciation ? <p className="mt-4 font-mono text-muted-foreground">{current.pronunciation}</p> : null}
                        <p className="mt-6 font-bold text-muted-foreground">{t("Nhấn để lật", "Click to flip")}</p>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-primary bg-card p-8 text-center shadow-lifted [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <p className="font-display text-3xl font-bold">{current.meaning || t("Chưa có nghĩa", "No translation yet")}</p>
                        {current.example ? <p className="text-lg italic text-muted-foreground">&quot;{current.example}&quot;</p> : null}
                        <div className="flex justify-center gap-2">
                          <Badge>{label(current.state || "learning")}</Badge>
                        </div>
                      </div>
                    </span>
                  </button>
                  <div className="grid gap-2 sm:grid-cols-4" role="group" aria-label={t("Đánh giá mức độ ghi nhớ", "Rate your recall")}>
                    {ratings.map((rating) => (
                      <button
                        key={rating.value}
                        className={`rounded-xl px-3 py-4 text-white transition ${rating.className}`}
                        onClick={() => review(rating.value)}
                      >
                        <span className="block font-display text-lg font-bold">{rating.label[language]}</span>
                        <span className="text-xs font-semibold opacity-90">{rating.hint[language]}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-muted p-10 text-center font-bold text-muted-foreground">{t("Hiện chưa có thẻ đến hạn.", "No due cards right now.")}</div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          {aiEnabled ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("Thẻ ghi nhớ AI", "AI Flashcards")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={aiTopic}
                    maxLength={100}
                    aria-label={t("Chủ đề flashcard", "Flashcard topic")}
                    placeholder={t("Chủ đề, ví dụ: du lịch, nhà bếp...", "Topic, e.g. travel, kitchen...")}
                    onChange={(e) => setAiTopic(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") generateAi(); }}
                  />
                  <Select value={String(aiCount)} aria-label={t("Số lượng thẻ", "Number of cards")} onChange={(e) => setAiCount(Number(e.target.value))}>
                    {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} {t("thẻ", "cards")}</option>)}
                  </Select>
                </div>
                <Button className="w-full" variant="secondary" onClick={generateAi} disabled={aiBusy || !aiTopic.trim()}>
                  <IconSparkles className="h-4 w-4" /> {aiBusy && !aiCards.length ? t("Đang tạo...", "Generating...") : t("Tạo bằng AI", "Generate with AI")}
                </Button>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {aiCards.map((card, i) => (
                    <div key={`${card.word}-${i}`} className="flex items-start justify-between gap-3 rounded-xl border-2 bg-card p-4">
                      <div>
                        <p className="font-display font-bold">
                          {card.word} {card.pronunciation ? <span className="font-mono text-sm font-normal text-muted-foreground">{card.pronunciation}</span> : null}
                        </p>
                        <p className="text-sm font-semibold text-muted-foreground">{card.partOfSpeech ? `(${card.partOfSpeech}) ` : ""}{card.translation}</p>
                        {card.example ? <p className="mt-2 text-sm italic text-muted-foreground">&quot;{card.example}&quot;</p> : null}
                      </div>
                      <Button size="sm" variant="outline" aria-label={t(`Bỏ thẻ ${card.word}`, `Remove card ${card.word}`)} onClick={() => setAiCards((cards) => cards.filter((_, j) => j !== i))}>
                        <IconX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {aiCards.length ? (
                  <Button className="w-full" onClick={saveAi} disabled={aiBusy}>
                    <IconDeviceFloppy className="h-4 w-4" /> {aiBusy ? t("Đang lưu...", "Saving...") : t(`Lưu ${aiCards.length} thẻ vào flashcard`, `Save ${aiCards.length} cards to flashcards`)}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>{t("Bộ thẻ tin cậy", "Trusted Flashcards")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <label className="relative flex-1">
                  <IconSearch className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setSearchQuery(search.trim()); }}
                    placeholder={t("Tìm thẻ tin cậy", "Search trusted cards")}
                  />
                </label>
                <Button variant="outline" onClick={() => setSearchQuery(search.trim())}>{t("Tìm", "Search")}</Button>
              </div>
              <Button className="w-full" variant="secondary" onClick={importTrusted} disabled={importing}>
                <IconSparkles className="h-4 w-4" /> {importing ? t("Đang nhập...", "Importing...") : t("Nhập bộ thẻ tin cậy", "Import Trusted Set")}
              </Button>
              <div className="relative overflow-hidden rounded-xl border border-border" style={{ maxHeight: "calc(3 * 136px + 2 * 12px)" }}>
                <div className="overflow-y-auto space-y-3 p-1" style={{ maxHeight: "calc(3 * 136px + 2 * 12px)" }}>
                  {filteredTrusted.map((card) => (
                    <div key={card.id} className="rounded-xl border-2 bg-card p-4">
                      <p className="font-display font-bold">{card.word}</p>
                      <p className="text-sm font-semibold text-muted-foreground">{card.translation || card.definition}</p>
                      {card.example ? <p className="mt-2 text-sm italic text-muted-foreground">&quot;{card.example}&quot;</p> : null}
                      <Button className="mt-3" size="sm" variant="outline" onClick={() => saveTrusted(card.id)} disabled={savingId === card.id}>
                        {savingId === card.id ? t("Đang lưu...", "Saving...") : t("Lưu vào từ vựng", "Save to vocab")}
                      </Button>
                    </div>
                  ))}
                  {hasMoreTrusted ? (
                    <div ref={sentinelRef} className="py-2 text-center">
                      <span className="text-xs font-semibold text-muted-foreground">{t("Đang tải thêm...", "Loading more...")}</span>
                    </div>
                  ) : (
                    <div ref={sentinelRef} />
                  )}
                  {!filteredTrusted.length ? <p className="p-2 font-semibold text-muted-foreground">{t("Chưa tải thẻ tin cậy nào.", "No trusted flashcards loaded.")}</p> : null}
                </div>
              </div>
              {trusted.length > 0 && (
                <p className="text-center text-xs font-semibold text-muted-foreground">
                  {Math.min(visibleCount, trusted.length)} / {trusted.length} {t("thẻ", "cards")}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
    </div>
  );
}
