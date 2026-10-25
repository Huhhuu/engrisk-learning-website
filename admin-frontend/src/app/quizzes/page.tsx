'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { DataPanel, PageHeading, StateNotice, StatCard } from '@/components/AdminDataView';
import { adminLearning, type AdminQuizAnalytics } from '@/lib/api';
import Link from 'next/link';
import { T, tr } from '@/lib/language';

export default function QuizzesPage() { return <AdminLayout title={<T vi="Quiz" en="Quizzes" />}><PageContent /></AdminLayout>; }
function PageContent() {
  const [data, setData] = useState<AdminQuizAnalytics>(); const [error, setError] = useState('');
  const load = useCallback(() => { setError(''); return adminLearning.quizzes().then(setData).catch((e) => setError(e instanceof Error ? e.message : tr('Không thể tải phân tích quiz.', 'Could not load quiz analytics.'))); }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  if (error) return <StateNotice state="error" message={error} retry={load} />;
  if (!data) return <StateNotice state="loading" />;
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><PageHeading title={<T vi="Hiệu quả quiz" en="Quiz performance" />} description={<T vi="Hiệu suất quiz tổng hợp theo khóa học trong 30 ngày gần nhất." en="Aggregate quiz performance by course over the last 30 days." />} /><Link href="/quiz-management" className="rounded-xl bg-[#006590] px-5 py-3 font-bold text-white"><T vi="Soạn quiz" en="Author quizzes" /></Link></div><section className="grid gap-4 sm:grid-cols-2"><StatCard label={<T vi="Lượt làm" en="Attempts" />} value={data.attempts} /><StatCard label={<T vi="Khóa học có lượt làm" en="Courses with attempts" />} value={data.by_course.length} accent="#843ab4" /></section><DataPanel title={<T vi="Chi tiết theo khóa học" en="Course breakdown" />}>{data.by_course.length === 0 ? <StateNotice state="empty" /> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="p-3"><T vi="Khóa học" en="Course" /></th><th className="p-3"><T vi="Lượt làm" en="Attempts" /></th><th className="p-3"><T vi="Điểm trung bình" en="Average score" /></th></tr></thead><tbody>{data.by_course.map((row) => <tr key={row.course_id} className="border-t"><td className="p-3 font-bold">{row.course_title}</td><td className="p-3">{row.attempts ?? 0}</td><td className="p-3">{row.average_score == null ? '—' : `${row.average_score}%`}</td></tr>)}</tbody></table></div>}</DataPanel></div>;
}
