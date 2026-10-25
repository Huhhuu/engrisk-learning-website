"use client";

import type { CourseCard, LearningEvidence, LessonCard, TeacherLearnerProgress } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language";
import { Empty, MetricSmall } from "./teacher-workspace-lists";

export function TeacherEvidence({
  learnerName,
  progress,
  evidence,
}: {
  learnerName: string;
  progress?: TeacherLearnerProgress;
  evidence: LearningEvidence[];
}) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{learnerName} · {t("bằng chứng gần đây", "recent evidence")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <MetricSmall label={t("Bài đã xong", "Lessons completed")} value={progress?.completed_lessons ?? 0} />
          <MetricSmall label={t("Sự kiện · 7 ngày", "Events · 7 days")} value={progress?.recent_events ?? 0} />
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {evidence.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-3">
              <div className="flex justify-between gap-3">
                <strong>{item.event_type}</strong>
                <time dateTime={item.occurred_at} className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat(t("vi-VN", "en-US"), { dateStyle: "short", timeStyle: "short" }).format(
                    new Date(item.occurred_at)
                  )}
                </time>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("Đúng", "Correct")}: {item.is_correct == null ? "—" : item.is_correct ? t("Có", "Yes") : t("Không", "No")} {t("· Gợi ý:", "· Hint:")} {item.hint_level ?? 0} ·{" "}
                {item.duration_ms ?? 0} ms
              </p>
            </div>
          ))}
          {evidence.length === 0 && <Empty text={t("Chưa có bằng chứng học tập.", "No learning evidence yet.")} />}
        </div>
      </CardContent>
    </Card>
  );
}

export function TeacherAssignmentForm({
  learnerName,
  courses,
  courseId,
  lessonId,
  target,
  vocabularyId,
  vocabularies,
  lessons,
  dueAt,
  instructions,
  onChooseCourse,
  onChooseLesson,
  onSetTarget,
  onSetVocabularyId,
  onSetDueAt,
  onSetInstructions,
  onSubmit,
}: {
  learnerName: string;
  courses: CourseCard[];
  courseId: string;
  lessonId: string;
  target: "lesson" | "vocabulary";
  vocabularyId: string;
  vocabularies: Array<{ id: number; word: string }>;
  lessons: LessonCard[];
  dueAt: string;
  instructions: string;
  onChooseCourse: (id: string) => void;
  onChooseLesson: (id: string) => void;
  onSetTarget: (target: "lesson" | "vocabulary") => void;
  onSetVocabularyId: (id: string) => void;
  onSetDueAt: (dueAt: string) => void;
  onSetInstructions: (instructions: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Giao bài mới", "New assignment")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block font-bold" htmlFor="assignment-course">
            {t("Khóa học", "Course")}
          </label>
          <Select id="assignment-course" value={courseId} onChange={(e) => onChooseCourse(e.target.value)}>
            <option value="">{t("Chọn khóa học", "Choose a course")}</option>
            {courses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </Select>

          <label className="block font-bold" htmlFor="assignment-lesson">
            {t("Bài học", "Lesson")}
          </label>
          <Select id="assignment-lesson" value={lessonId} onChange={(e) => onChooseLesson(e.target.value)}>
            <option value="">{t("Chọn bài học", "Choose a lesson")}</option>
            {lessons.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </Select>

          <fieldset className="flex gap-4">
            <legend className="mb-2 font-bold">{t("Mục tiêu", "Target")}</legend>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={target === "lesson"}
                onChange={() => onSetTarget("lesson")}
              />{" "}
              {t("Bài học", "Lesson")}
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="target"
                checked={target === "vocabulary"}
                onChange={() => onSetTarget("vocabulary")}
              />{" "}
              {t("Từ vựng", "Vocabulary")}
            </label>
          </fieldset>

          {target === "vocabulary" && (
            <>
              <label className="block font-bold" htmlFor="assignment-word">
                {t("Từ vựng", "Vocabulary")}
              </label>
              <Select id="assignment-word" value={vocabularyId} onChange={(e) => onSetVocabularyId(e.target.value)}>
                <option value="">{t("Chọn từ", "Choose a word")}</option>
                {vocabularies.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.word}
                  </option>
                ))}
              </Select>
            </>
          )}

          <label className="block font-bold" htmlFor="assignment-due">
            {t("Hạn hoàn thành", "Due date")}
          </label>
          <Input
            id="assignment-due"
            name="due_at"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => onSetDueAt(e.target.value)}
          />

          <label className="block font-bold" htmlFor="assignment-instructions">
            {t("Hướng dẫn", "Instructions")}
          </label>
          <Textarea
            id="assignment-instructions"
            name="instructions"
            value={instructions}
            onChange={(e) => onSetInstructions(e.target.value)}
          />

          <Button type="submit" className="w-full">
            {t("Giao cho", "Assign to")} {learnerName}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function TeacherInterventionNoteForm({
  note,
  onSetNote,
  onSubmit,
}: {
  note: string;
  onSetNote: (note: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Ghi chú can thiệp", "Intervention note")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block font-bold" htmlFor="intervention-note">
            {t("Ghi chú hỗ trợ", "Support note")}
          </label>
          <Textarea
            id="intervention-note"
            name="note"
            value={note}
            onChange={(e) => onSetNote(e.target.value)}
          />
          <Button type="submit" variant="outline">
            {t("Lưu ghi chú", "Save note")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
