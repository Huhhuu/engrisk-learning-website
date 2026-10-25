'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { DataPanel, PageHeading, StateNotice, StatCard } from '@/components/AdminDataView';
import { adminLearning, type AdminFsrsAnalytics, type AdminLearningOverview, type AdminQuizAnalytics, type AdminProgressAnalytics } from '@/lib/api';
import { T, useLanguage } from '@/lib/language';

export default function AnalyticsPage() { return <AdminLayout title={<T vi="Phân tích" en="Analytics" />}><PageContent /></AdminLayout>; }

function PageContent() {
  const { t } = useLanguage();
  const [data, setData] = useState<{ overview?: AdminLearningOverview; quizzes?: AdminQuizAnalytics; fsrs?: AdminFsrsAnalytics; progress?: AdminProgressAnalytics }>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setErrors([]);
    const results = await Promise.allSettled([adminLearning.overview(), adminLearning.quizzes(), adminLearning.fsrs(), adminLearning.progress()]);
    const next: typeof data = {}; const failed: string[] = [];
    const keys = ['overview', 'quizzes', 'fsrs', 'progress'] as const;
    results.forEach((result, index) => result.status === 'fulfilled' ? next[keys[index]] = result.value as never : failed.push(keys[index]));
    setData(next); setErrors(failed); setLoading(false);
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  if (loading) return <StateNotice state="loading" />;
  if (!Object.keys(data).length) return <StateNotice state="error" message={t('Không thể tải dữ liệu phân tích.', 'Could not load analytics.')} retry={load} />;
  return <div className="space-y-6"><PageHeading title={<T vi="Phân tích học tập" en="Learning analytics" />} description={<T vi="Số liệu tổng hợp toàn hệ thống, không chứa dữ liệu nhận dạng người học." en="System-wide aggregate figures, with no learner-identifying data." />} />
    {errors.length > 0 && <p role="status" className="rounded-xl bg-[#ffdf92] p-4 font-bold text-[#594400]"><T vi="Một số bảng chưa tải được:" en="Some panels failed to load:" /> {errors.join(', ')}.</p>}
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4"><StatCard label={<T vi="Lượt ghi danh" en="Enrollments" />} value={data.overview?.enrollments ?? '—'} /><StatCard label={<T vi="Hoàn thành" en="Completion" />} value={data.overview ? `${data.overview.completion_rate}%` : '—'} accent="#1b5e20" /><StatCard label={<T vi="Lượt làm quiz" en="Quiz attempts" />} value={data.quizzes?.attempts ?? data.overview?.quiz_attempts ?? '—'} accent="#843ab4" /><StatCard label={<T vi="Lượt ôn FSRS" en="FSRS reviews" />} value={data.fsrs?.reviews ?? '—'} accent="#755b00" /></section>
    <section className="grid gap-6 xl:grid-cols-2"><DataPanel title={<T vi="Quiz theo khóa học" en="Quiz by course" />}><CourseRows rows={data.quizzes?.by_course ?? []} metric="attempts" /></DataPanel><DataPanel title={<T vi="Bài đã hoàn thành theo khóa học" en="Completed lessons by course" />}><CourseRows rows={data.progress?.by_course ?? []} metric="completed_lessons" /></DataPanel></section>
  </div>;
}

function CourseRows({ rows, metric }: { rows: Array<{ course_id: number; course_title: string; attempts?: number; completed_lessons?: number }>; metric: 'attempts' | 'completed_lessons' }) {
  if (!rows.length) return <p className="py-5 text-center text-sm text-[#6e7881]"><T vi="Chưa có dữ liệu." en="No data yet." /></p>;
  return <div>{rows.map((row) => <div key={row.course_id} className="flex justify-between gap-4 border-b py-3 last:border-0"><span className="font-bold">{row.course_title}</span><span className="tabular-nums">{row[metric] ?? 0}</span></div>)}</div>;
}
