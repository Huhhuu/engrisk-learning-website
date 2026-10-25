"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrowRight, IconBook2, IconBrain, IconClock, IconSchool } from "@tabler/icons-react";
import { api, ApiError, type Enrollment, type LearningPlan } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage, tr } from "@/lib/language";

function message(reason: unknown) {
  if (reason instanceof ApiError && reason.status === 401) return tr("Hãy đăng nhập để xem kế hoạch học tập hôm nay.", "Please sign in to see today's study plan.");
  return reason instanceof Error ? reason.message : tr("Không thể tải kế hoạch hôm nay.", "Could not load today's plan.");
}

export function TodayPage() {
  const { t, label } = useLanguage();
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.learningPlan(), api.enrollments()])
      .then(([nextPlan, nextEnrollments]) => { setPlan(nextPlan); setEnrollments(nextEnrollments); })
      .catch((reason) => setError(message(reason)));
  }, []);

  const counts = (type: string) => plan?.items.filter((item) => item.type === type).length ?? 0;
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-[#006590] to-[#0891b2] p-7 text-white shadow-xl md:p-10">
        <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-cyan-100">{t("Kế hoạch hôm nay", "Today's plan")}</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight md:text-5xl">{t("Một phiên tập trung, tiến bộ rõ ràng.", "One focused session, clear progress.")}</h2>
        <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-white/15 px-4 py-2"><IconClock className="mr-2 inline h-5 w-5" />~{Math.max(5, (plan?.items.length ?? 0) * 3)} {t("phút", "min")}</span>
          <span className="rounded-full bg-white/15 px-4 py-2">{plan?.items.length ?? "…"} {t("hoạt động", "activities")}</span>
        </div>
      </section>
      {error && <p role="alert" className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={IconSchool} label={t("Giáo viên giao", "Teacher assigned")} value={counts("teacher_lesson") + counts("teacher_vocabulary_practice")} tone="bg-amber-100 text-amber-800" />
        <Metric icon={IconBrain} label={t("FSRS đến hạn", "FSRS due")} value={plan?.fsrs_due_total ?? counts("fsrs_review")} tone="bg-cyan-100 text-cyan-800" />
        <Metric icon={IconBook2} label={t("Bài tiếp theo", "Next lessons")} value={counts("course_activity")} tone="bg-emerald-100 text-emerald-800" />
      </section>
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold uppercase tracking-wider text-primary">{t("Luyện nghe", "Listening practice")}</p><h3 className="font-display text-2xl font-bold">{t("Học với video có phụ đề", "Learn with captioned videos")}</h3><p className="text-sm text-muted-foreground">{t("Nghe chủ động, dịch từng câu và luyện nói đuổi.", "Listen actively, translate each line and practise shadowing.")}</p></div><Button asChildCompat="a"><Link href="/listening">{t("Khám phá video", "Explore videos")}</Link></Button></Card>
      {(plan?.items.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("Ưu tiên hôm nay", "Today's priorities")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {plan?.items.map((item) => <PlanItem key={`${item.type}-${item.id}`} item={item} onError={setError} />)}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>{t("Lộ trình đang học", "Your courses")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {enrollments.length === 0 ? (
            <div className="rounded-2xl bg-muted p-6 text-center">
              <p className="font-bold">{t("Bạn chưa tham gia khóa học nào.", "You have not joined any course yet.")}</p>
              <Button asChildCompat="a" className="mt-4"><Link href="/courses">{t("Khám phá khóa học", "Explore courses")}</Link></Button>
            </div>
          ) : enrollments.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-2xl border-2 border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-wider text-primary">{label(item.status)}</p><h3 className="font-display text-xl font-bold">{item.title}</h3></div>
              <StartButton enrollment={item} onError={setError} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanItem({ item, onError }: { item: LearningPlan["items"][number]; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();
  const labels = {
    teacher_lesson: t("Bài học giáo viên giao", "Teacher-assigned lesson"),
    teacher_vocabulary_practice: t("Luyện từ vựng giáo viên giao", "Teacher-assigned vocabulary practice"),
    fsrs_review: t("Ôn tập FSRS", "FSRS review"),
    course_activity: t("Bài tiếp theo trong khóa học", "Next lesson in your course"),
    pronunciation_task: t("Luyện phát âm trong bài tiếp theo", "Pronunciation in your next lesson"),
    remediation: t("Ôn lại nội dung đang yếu", "Review weak content"),
  };
  if (item.type === "fsrs_review" || item.type === "remediation") {
    return <div className="flex items-center justify-between rounded-2xl border-2 border-border p-4"><span className="font-bold">{labels[item.type]}</span><Button asChildCompat="a"><Link href="/review">{t("Bắt đầu", "Start")}</Link></Button></div>;
  }
  async function start() {
    setBusy(true);
    try {
      const session = item.type === "course_activity" || item.type === "pronunciation_task"
        ? await api.startSession(item.id)
        : await api.startAssignment(item.id);
      window.location.href = `/session/${session.id}`;
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : tr("Không thể mở hoạt động.", "Could not open the activity."));
    }
    finally { setBusy(false); }
  }
  return <div className="flex items-center justify-between rounded-2xl border-2 border-border p-4"><span className="font-bold">{labels[item.type]}</span><Button onClick={start} disabled={busy}>{busy ? t("Đang mở…", "Opening…") : t("Bắt đầu", "Start")}</Button></div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof IconBrain; label: string; value: number; tone: string }) {
  return <Card className="p-5"><div className="flex items-center gap-4"><span className={`rounded-2xl p-3 ${tone}`}><Icon className="h-7 w-7" /></span><div><p className="text-3xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></div></Card>;
}

function StartButton({ enrollment, onError }: { enrollment: Enrollment; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();
  async function start() {
    setBusy(true);
    try { const session = await api.startSession(enrollment.id); window.location.href = `/session/${session.id}`; }
    catch (reason) { onError(reason instanceof Error ? reason.message : tr("Không thể mở phiên học.", "Could not open the session.")); }
    finally { setBusy(false); }
  }
  return <Button onClick={start} disabled={busy}>{busy ? t("Đang mở…", "Opening…") : t("Học tiếp", "Continue")}<IconArrowRight className="h-5 w-5" /></Button>;
}
