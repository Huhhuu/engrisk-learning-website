"use client";

import { IconPlayerPlay, IconPuzzle } from "@tabler/icons-react";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import type { CatalogTopic as Topic } from "@/lib/api";
import { useLanguage } from "@/lib/language";

export type QuizType = "en-vi" | "vi-en";

export interface QuizConfig {
  count: number;
  category: string;
  difficulty: string;
  topicId: number | null;
  cefr: string;
  quizType: QuizType;
}

interface QuizSetupScreenProps {
  categories: string[];
  topics: Topic[];
  starting: boolean;
  onStart: (config: QuizConfig) => void;
}

function QuizHero() {
  const { t } = useLanguage();
  return (
    <div className="mb-6 flex items-center gap-6 rounded-xl bg-primary p-6">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent">
        <IconPuzzle className="h-9 w-9 text-primary" />
      </div>
      <div>
        <h2 className="font-display text-[24px] font-bold text-primary-foreground">{t("Trắc nghiệm từ vựng", "Vocabulary Quiz")}</h2>
        <p className="font-body text-[17px] text-accent">{t("Kiểm tra kiến thức bằng câu hỏi trắc nghiệm", "Test your knowledge with multiple choice")}</p>
      </div>
    </div>
  );
}

export function QuizSetupScreen({ categories, topics, starting, onStart }: QuizSetupScreenProps) {
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [topicId, setTopicId] = useState<number | null>(null);
  const [cefr, setCefr] = useState("");
  const [count, setCount] = useState(10);
  const [quizType, setQuizType] = useState<QuizType>("en-vi");
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-lg">
        <QuizHero />
        <div className="rounded-xl border-2 border-border bg-white p-6">
          <h3 className="mb-5 font-display text-xl font-bold text-foreground">{t("Thiết lập quiz", "Quiz Setup")}</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("Danh mục", "Category")}
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t("Tất cả danh mục", "All Categories")}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("Độ khó", "Difficulty")}
              </label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">{t("Tất cả cấp độ", "All Levels")}</option>
                <option value="BEGINNER">{t("Cơ bản", "Beginner")}</option>
                <option value="INTERMEDIATE">{t("Trung cấp", "Intermediate")}</option>
                <option value="ADVANCED">{t("Nâng cao", "Advanced")}</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("Chủ đề", "Topic")}
              </label>
              <Select
                value={topicId ?? ""}
                onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t("Tất cả chủ đề", "All Topics")}</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("Cấp độ CEFR", "CEFR Level")}
              </label>
              <Select
                value={cefr}
                onChange={(e) => setCefr(e.target.value)}
              >
                <option value="">{t("Tất cả CEFR", "All CEFR")}</option>
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("Số câu", "Questions")}
                </label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={count}
                  onChange={(e) =>
                    setCount(Math.max(5, Math.min(50, Number(e.target.value))))
                  }
                  className="rounded-xl border-2 border-border bg-muted px-3 py-2.5 font-body text-[17px] text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("Kiểu", "Type")}
                </label>
                <Select
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as QuizType)}
                >
                  <option value="en-vi">{t("Anh → Việt", "EN to VI")}</option>
                  <option value="vi-en">{t("Việt → Anh", "VI to EN")}</option>
                </Select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onStart({ count, category, difficulty, topicId, cefr, quizType })}
              disabled={starting}
              className="btn-press mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-[17px] font-bold uppercase tracking-[0.02em] text-primary-foreground"
            >
              <IconPlayerPlay className="h-5 w-5" />
              {starting ? t("Đang bắt đầu...", "Starting...") : t("Bắt đầu quiz", "Start Quiz")}
            </button>
          </div>
        </div>
    </div>
  );
}
