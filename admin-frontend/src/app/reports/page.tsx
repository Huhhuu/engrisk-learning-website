'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { DataPanel, DateRange, PageHeading } from '@/components/AdminDataView';
import { adminLearning } from '@/lib/api';
import { T, tr } from '@/lib/language';

export default function ReportsPage() { return <AdminLayout title={<T vi="Báo cáo" en="Reports" />}><PageContent /></AdminLayout>; }
function PageContent() {
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle'); const [message, setMessage] = useState('');
  async function download() {
    setState('loading'); setMessage('');
    try {
      const blob = await adminLearning.report(from || undefined, to || undefined);
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'learning-report.csv'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); setState('idle');
    } catch (error) { setMessage(error instanceof Error ? error.message : tr('Không thể tải báo cáo.', 'Could not load the report.')); setState('error'); }
  }
  return <div className="space-y-6"><PageHeading title={<T vi="Báo cáo học tập" en="Learning reports" />} description={<T vi="Xuất CSV tổng hợp theo khóa học; không bao gồm thông tin cá nhân của người học." en="Export aggregate CSV by course; no learner PII included." />} /><DataPanel title={<T vi="Báo cáo CSV" en="CSV report" />}><div className="space-y-5"><DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} onApply={() => void download()} /><p className="text-sm text-[#3e4850]"><T vi="Các cột: kỳ (period), khóa học (course), lượt ghi danh (enrollments), đã bắt đầu (started), đã hoàn thành (completed), tỷ lệ hoàn thành (completion rate) và điểm trung bình (average score)." en="Columns: period, course, enrollments, started, completed, completion rate and average score." /></p>{message && <p role="alert" className="rounded-xl bg-[#ffdad6] p-4 font-bold text-[#93000a]">{message}</p>}<button disabled={state === 'loading'} onClick={() => void download()} className="rounded-xl bg-[#006590] px-5 py-3 font-bold text-white disabled:opacity-50">{state === 'loading' ? <T vi="Đang tạo…" en="Generating…" /> : <T vi="Tải CSV" en="Download CSV" />}</button></div></DataPanel></div>;
}
