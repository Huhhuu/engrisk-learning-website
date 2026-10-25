'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { DataPanel, PageHeading, StateNotice, StatCard } from '@/components/AdminDataView';
import { adminLearning, type AdminProgressAnalytics } from '@/lib/api';
import { T, tr } from '@/lib/language';

export default function UserProgressPage() { return <AdminLayout title={<T vi="Tiến độ người dùng" en="User Progress" />}><PageContent /></AdminLayout>; }
function PageContent() {
  const [data, setData] = useState<AdminProgressAnalytics>(); const [error, setError] = useState('');
  const load = useCallback(() => { setError(''); return adminLearning.progress().then(setData).catch((e) => setError(e instanceof Error ? e.message : tr('Không thể tải phân tích tiến độ.', 'Could not load progress analytics.'))); }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  if (error) return <StateNotice state="error" message={error} retry={load} />;
  if (!data) return <StateNotice state="loading" />;
  return <div className="space-y-6"><PageHeading title={<T vi="Tiến độ học viên" en="Learner progress" />} description={<T vi="Tiến độ tổng hợp theo khóa học; không hiển thị hồ sơ hoặc bằng chứng cá nhân." en="Aggregate progress by course; no profiles or personal evidence shown." />} /><StatCard label={<T vi="Bài đã hoàn thành" en="Completed lessons" />} value={data.completed_lessons} accent="#1b5e20" /><DataPanel title={<T vi="Tỷ lệ hoàn thành khóa học" en="Course completion" />}>{data.by_course.length === 0 ? <StateNotice state="empty" /> : data.by_course.map((row) => <div key={row.course_id} className="flex justify-between gap-4 border-b py-3 last:border-0"><span className="font-bold">{row.course_title}</span><span className="tabular-nums">{row.completed_lessons ?? 0}</span></div>)}</DataPanel></div>;
}
