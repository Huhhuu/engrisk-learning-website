"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { IconBulb, IconCheck, IconMicrophone, IconPlayerStop, IconRefresh, IconRobot, IconVolume } from "@tabler/icons-react";
import { api, type Assistance, type LearningSession, type PronunciationAssessment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage, tr } from "@/lib/language";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionId = Number(use(params).id);
  const { t } = useLanguage();
  const [session, setSession] = useState<LearningSession>();
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ is_correct: boolean }>();
  const [assistance, setAssistance] = useState<Assistance>();
  const [pronunciation, setPronunciation] = useState<PronunciationAssessment>();
  const [hint, setHint] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  const started = useRef(Date.now());
  const recorder = useRef<MediaRecorder | null>(null);

  const loadActivity = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      setSession(await api.nextActivity(sessionId));
      setAnswer("");
      setResult(undefined);
      setAssistance(undefined);
      setPronunciation(undefined);
      setHint("");
      setHintCount(0);
      started.current = Date.now();
      setState("ready");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : tr("Không thể tải hoạt động.", "Could not load the activity."));
      setState("error");
    }
  }, [sessionId]);

  useEffect(() => { void loadActivity(); }, [loadActivity]);
  const activity = session?.activity;

  async function submit() {
    if (!activity || !answer.trim()) return;
    setSubmitting(true);
    setMessage("");
    try {
      const attempt = await api.submitAttempt(sessionId, { activity_id: activity.id, answer, duration_ms: Date.now() - started.current, hint_count: hintCount });
      setResult(attempt);
      try {
        const feedback = await api.traceCag({ session_id: sessionId, activity_id: activity.id, input_type: "answer", text: answer });
        setAssistance(feedback.assistance);
      } catch {
        setMessage(tr("TraceCAG tạm thời không khả dụng; kết quả học vẫn đã được lưu.", "TraceCAG is temporarily unavailable; your result has still been saved."));
      }
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : tr("Không thể lưu câu trả lời.", "Could not save the answer."));
    } finally {
      setSubmitting(false);
    }
  }

  async function requestHint() {
    if (!activity || hint) return;
    setTranslating(true);
    setMessage("");
    try {
      const translated = await api.translate(activity.word);
      setHint(translated.translated_text || activity.meaning);
      setHintCount((count) => count + 1);
    } catch {
      setHint(activity.meaning);
      setMessage(tr("Đang dùng nghĩa đã lưu vì gợi ý AI tạm thời không khả dụng.", "Using the saved meaning because AI hints are temporarily unavailable."));
    } finally {
      setTranslating(false);
    }
  }

  function speakBrowser(text: string) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.onstart = () => {
        setMessage("");
      };
      utterance.onend = () => {
        setListening(false);
        setMessage("");
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        setListening(false);
        if (event.error === "canceled" || event.error === "interrupted") {
          return;
        }
        setMessage(tr("Không phát được âm thanh; bạn vẫn có thể tiếp tục bằng văn bản.", "Could not play audio; you can continue with text."));
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setListening(false);
      setMessage(tr("Không phát được âm thanh; bạn vẫn có thể tiếp tục bằng văn bản.", "Could not play audio; you can continue with text."));
    }
  }

  async function playAudio() {
    if (!activity) return;
    setListening(true);
    setMessage("");

    const audioUrl = activity.audio_url && typeof activity.audio_url === "string" ? activity.audio_url.trim() : null;
    const hasValidAudio = Boolean(audioUrl && (audioUrl.startsWith("http://") || audioUrl.startsWith("https://") || audioUrl.startsWith("/")));

    if (hasValidAudio && audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.addEventListener("ended", () => {
          setListening(false);
          setMessage("");
        }, { once: true });
        audio.addEventListener("error", () => speakBrowser(activity.word), { once: true });
        await audio.play();
        return;
      } catch {
        speakBrowser(activity.word);
        return;
      }
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speakBrowser(activity.word);
      return;
    }

    try {
      const source = await api.textToSpeech(activity.word);
      const audio = new Audio(source);
      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(source);
        setListening(false);
        setMessage("");
      }, { once: true });
      await audio.play();
    } catch {
      speakBrowser(activity.word);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    if (!activity || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage(tr("Trình duyệt không hỗ trợ ghi âm; hãy nhập câu trả lời bằng bàn phím.", "This browser cannot record audio; please type your answer."));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const nextRecorder = new MediaRecorder(stream);
      nextRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      nextRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audio = new Blob(chunks, { type: nextRecorder.mimeType || "audio/webm" });
        setVoiceBusy(true);
        try {
          const [transcription, assessment] = await Promise.all([
            api.speechToText(audio, sessionId, activity.id),
            api.assessPronunciation(audio, activity.word, sessionId, activity.id),
          ]);
          const transcript = transcription.transcript;
          if (transcript) setAnswer(transcript);
          if (Number.isFinite(assessment.score)) setPronunciation(assessment);
        } catch {
          setMessage(tr("AI giọng nói tạm thời không khả dụng; hãy tiếp tục bằng văn bản.", "Voice AI is temporarily unavailable; please continue with text."));
        } finally {
          setVoiceBusy(false);
        }
      };
      recorder.current = nextRecorder;
      nextRecorder.start();
      setRecording(true);
    } catch {
      setMessage(tr("Không truy cập được micro. Kiểm tra quyền trình duyệt hoặc nhập câu trả lời.", "Could not access the microphone. Check browser permissions or type your answer."));
    }
  }

  async function finish() {
    setFinishing(true);
    try {
      const completed = await api.completeSession(sessionId);
      sessionStorage.setItem(`session-summary:${sessionId}`, JSON.stringify(completed));
      window.location.href = `/session/${sessionId}/summary`;
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : tr("Không thể hoàn tất phiên.", "Could not finish the session."));
      setFinishing(false);
    }
  }

  if (state === "loading") return <Status text={t("Đang tải hoạt động tiếp theo…", "Loading next activity…")} />;
  if (state === "error") return <Status text={message} action={<Button onClick={loadActivity}><IconRefresh className="h-5 w-5" />{t("Thử lại", "Retry")}</Button>} />;
  if (!activity) return <Card className="mx-auto max-w-2xl p-10 text-center"><h2 className="font-display text-3xl font-bold">{t("Bạn đã hoàn tất mọi hoạt động", "You finished every activity")}</h2><p className="mt-2 text-muted-foreground">{t("Xem tổng kết để lưu tiến độ bài học.", "Open the summary to save lesson progress.")}</p>{message && <p role="alert" className="mt-4 text-red-700">{message}</p>}<Button className="mt-6" onClick={finish} disabled={finishing}>{finishing ? t("Đang lưu…", "Saving…") : t("Hoàn tất & xem tổng kết", "Finish & view summary")}</Button></Card>;

  const progress = session?.progress ?? { completed: 0, total: 1 };
  const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  return <div className="mx-auto max-w-3xl space-y-5">
    <header className="flex items-end justify-between gap-4"><div><p className="font-bold uppercase tracking-wider text-primary">{t("Phiên tập trung", "Focused session")}</p><h2 className="font-display text-3xl font-bold">{t("Nhớ lại chủ động", "Active recall")}</h2></div><span className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-primary tabular-nums">{progress.completed + 1}/{progress.total}</span></header>
    <div role="progressbar" aria-label={t("Tiến độ phiên học", "Session progress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-[width]" style={{ width: `${percent}%` }} /></div>
    {message && <p role="status" aria-live="polite" className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</p>}
    <Card className="p-7 md:p-10">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("Dịch sang tiếng Việt", "Translate into Vietnamese")}</p><p className="mt-6 break-words font-display text-5xl font-bold">{activity.word}</p></div><button type="button" onClick={playAudio} disabled={listening} aria-label={`${t("Phát âm", "Pronounce")} ${activity.word}`} className="rounded-2xl bg-accent p-3 text-primary hover:bg-primary/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"><IconVolume aria-hidden="true" /></button></div>
      <label className="mt-12 block font-bold" htmlFor="answer">{t("Câu trả lời", "Your answer")}</label>
      <div className="mt-2 flex gap-2"><Input id="answer" name="answer" autoComplete="off" className="h-14 text-lg" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={Boolean(result)} /><button type="button" onClick={toggleRecording} disabled={voiceBusy || Boolean(result)} aria-label={recording ? t("Dừng ghi âm", "Stop recording") : t("Trả lời bằng giọng nói", "Answer by voice")} className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${recording ? "bg-red-600 text-white" : "bg-accent text-primary"}`}>{recording ? <IconPlayerStop aria-hidden="true" /> : <IconMicrophone aria-hidden="true" />}</button></div>
      {!result && <div className="mt-3"><Button type="button" variant="ghost" onClick={requestHint} disabled={translating || Boolean(hint)}><IconBulb className="h-5 w-5" />{translating ? t("Đang dịch…", "Translating…") : hint ? t("Đã dùng gợi ý", "Hint used") : t("Gợi ý nghĩa", "Meaning hint")}</Button>{hint && <p role="status" className="mt-2 rounded-xl bg-amber-50 p-3 text-amber-900">{t("Gợi ý", "Hint")}: {hint}</p>}</div>}
      {pronunciation && <p className="mt-3 font-bold">{t("Phát âm", "Pronunciation")}: <span className="tabular-nums text-primary">{pronunciation.score.toFixed(0)}/100</span> · {pronunciation.score >= 80 ? t("Tốt", "Good") : pronunciation.score >= 60 ? t("Đang tiến bộ", "Improving") : t("Thử lại chậm hơn", "Try again more slowly")}{pronunciation.feedback && <span className="block text-sm font-normal text-muted-foreground">{pronunciation.feedback}</span>}</p>}
      {!result ? <Button className="mt-5 w-full" size="lg" onClick={submit} disabled={submitting || !answer.trim()}>{submitting ? t("Đang lưu…", "Saving…") : t("Kiểm tra", "Check")}</Button> : <div className={`mt-6 rounded-2xl border-2 p-5 ${result.is_correct ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
        <p className="flex items-center gap-2 font-display text-xl font-bold">{result.is_correct ? <IconCheck aria-hidden="true" className="text-emerald-700" /> : <IconBulb aria-hidden="true" className="text-amber-700" />}{result.is_correct ? t("Chính xác", "Correct") : `${t("Đáp án", "Answer")}: ${activity.meaning}`}</p>
        {assistance && <div className="mt-4 border-t border-current/10 pt-4"><p className="flex items-center gap-2 font-bold"><IconRobot aria-hidden="true" className="h-5 w-5" />{t("Trợ lý AI", "AI Coach")} {assistance.degraded ? t("· hướng dẫn dự phòng", "· fallback guidance") : ""}</p><p className="mt-1 text-pretty">{assistance.feedback}</p><details className="mt-3 text-sm"><summary className="cursor-pointer font-bold">{t("Xem phân tích và gợi ý", "See analysis and hints")}</summary><p className="mt-2">{assistance.diagnosis.summary}</p>{assistance.hints.map((item) => <p key={`${item.level}-${item.text}`} className="mt-1">• {item.text}</p>)}<p className="mt-2 font-bold">{t("Bước đề xuất", "Suggested step")}: {assistance.recommended_action}</p></details></div>}
        <Button className="mt-5 w-full" onClick={loadActivity}>{t("Hoạt động tiếp theo", "Next activity")}</Button>
      </div>}
    </Card>
  </div>;
}

function Status({ text, action }: { text: string; action?: React.ReactNode }) { return <Card className="mx-auto max-w-2xl p-10 text-center"><p role="status" className="font-bold">{text}</p>{action && <div className="mt-5">{action}</div>}</Card>; }
