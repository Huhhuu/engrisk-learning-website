'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { operations, type ContractStatus, type OperationsOverview, type OperationsUsage } from '@/lib/api';
import { T, tr, useLanguage } from '@/lib/language';

type SuperAdminData = {
  overview?: OperationsOverview;
  usage?: OperationsUsage;
  contract?: ContractStatus;
  auditCount?: number;
};

export default function SuperAdminPage() {
  return <AdminLayout title={<T vi="Bảng điều khiển Super Admin" en="Super Dashboard" />} requiredRole="super_admin"><PageContent /></AdminLayout>;
}

function PageContent() {
  const { t } = useLanguage();
  const [data, setData] = useState<SuperAdminData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([operations.overview(), operations.usage(), operations.contracts(), operations.audits()])
      .then(([overview, usage, contract, audits]) => {
        if (!active) return;
        setData({
          overview: overview.status === 'fulfilled' ? overview.value : undefined,
          usage: usage.status === 'fulfilled' ? usage.value : undefined,
          contract: contract.status === 'fulfilled' ? contract.value : undefined,
          auditCount: audits.status === 'fulfilled' ? audits.value.meta.total : undefined,
        });
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const services = data.overview?.services;
  const healthy = services ? Object.values(services).filter(Boolean).length : undefined;
  const total = services ? Object.keys(services).length : undefined;

  return <div className="space-y-7">
    <header className="rounded-3xl border-2 border-[#88ceff] bg-[#e8f4ff] p-7 md:p-9">
      <p className="text-xs font-black uppercase tracking-[.2em] text-[#006590]">Super Admin</p>
      <h2 className="mt-2 text-3xl font-black text-[#00364d] md:text-4xl"><T vi="Tổng quan hệ thống" en="System overview" /></h2>
      <p className="mt-2 max-w-2xl font-medium text-[#3e4850]"><T vi="Tình trạng dịch vụ, mức dùng AI, hợp đồng TraceCAG và thao tác đặc quyền mà không lộ thông tin xác thực." en="Service health, AI usage, TraceCAG contract and privileged operations without exposing credentials." /></p>
    </header>

    <section aria-label={t('Chỉ số hệ thống', 'System metrics')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon="dns" label={<T vi="Dịch vụ ổn định" en="Services healthy" />} value={loading ? '…' : healthy === undefined ? 'Unavailable' : `${healthy}/${total}`} />
      <Metric icon="smart_toy" label={<T vi="Yêu cầu AI · 24h" en="AI requests · 24h" />} value={loading ? '…' : value(data.usage?.last_24_hours)} />
      <Metric icon="warning" label={<T vi="Cảnh báo mở" en="Open alerts" />} value={loading ? '…' : value(data.overview?.open_alerts)} />
      <Metric icon="history" label={<T vi="Sự kiện kiểm toán gần đây" en="Recent audit events" />} value={loading ? '…' : value(data.auditCount)} />
    </section>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border-2 border-[#bdc8d2] bg-white p-6">
        <h3 className="text-xl font-black"><T vi="Trạng thái dịch vụ" en="Service status" /></h3>
        <div className="mt-4 space-y-3">
          {!loading && !services && <Unavailable />}
          {services && Object.entries(services).map(([service, configured]) => <div key={service} className="flex items-center justify-between rounded-xl bg-[#f5f3f3] px-4 py-3"><span className="font-bold capitalize">{service.replaceAll('_', ' ')}</span><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${configured ? 'bg-[#c5f7dc] text-[#075e36]' : 'bg-[#ffdad6] text-[#93000a]'}`}>{configured ? t('Đã cấu hình', 'Configured') : t('Không khả dụng', 'Unavailable')}</span></div>)}
        </div>
      </section>
      <section className="rounded-3xl border-2 border-[#bdc8d2] bg-white p-6">
        <h3 className="text-xl font-black"><T vi="Hợp đồng AI" en="AI contracts" /></h3>
        {loading ? <p className="mt-4 font-bold"><T vi="Đang tải…" en="Loading…" /></p> : data.contract ? <div className="mt-4 rounded-xl bg-[#f5f3f3] p-4"><p className="font-black">TraceCAG {data.contract.trace_cag.version}</p><p className="mt-1 break-all font-mono text-xs text-[#5f6b74]"><T vi="Lược đồ" en="Schema" /> {data.contract.trace_cag.sha256 ?? 'unavailable'}</p></div> : <Unavailable />}
      </section>
    </div>

    <section className="flex flex-wrap gap-3">
      <Action href="/operations" icon="monitor_heart" label={<T vi="Mở AI & vận hành" en="Open AI & Operations" />} />
      <Action href="/roles" icon="admin_panel_settings" label={<T vi="Quản lý vai trò" en="Manage roles" />} />
      <Action href="/audit-logs" icon="history" label={<T vi="Xem lịch sử kiểm toán" en="View audit trail" />} />
      <Action href="/dashboard" icon="dashboard" label={<T vi="Bảng điều khiển quản trị" en="Admin dashboard" />} />
    </section>
  </div>;
}

function value(metric: number | undefined) {
  return metric === undefined ? 'Unavailable' : new Intl.NumberFormat(tr('vi-VN', 'en-US')).format(metric);
}

function Metric({ icon, label, value: metric }: { icon: string; label: React.ReactNode; value: string }) {
  return <article className="rounded-2xl border-2 border-[#bdc8d2] border-t-4 border-t-[#006590] bg-white p-5"><span className="material-symbols-outlined text-[#006590]">{icon}</span><p className="mt-4 text-xs font-black uppercase tracking-wider text-[#5f6b74]">{label}</p><p className={`mt-2 font-black ${metric === 'Unavailable' ? 'text-sm text-[#93000a]' : 'text-3xl'}`}>{metric === 'Unavailable' ? <T vi="Không khả dụng" en="Unavailable" /> : metric}</p></article>;
}

function Action({ href, icon, label }: { href: string; icon: string; label: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-2 rounded-xl border-2 border-[#006590] bg-white px-4 py-3 font-black text-[#006590] hover:bg-[#e8f4ff]"><span className="material-symbols-outlined">{icon}</span>{label}</Link>;
}

function Unavailable() {
  return <p className="mt-4 rounded-xl bg-[#ffdad6] p-4 text-sm font-bold text-[#93000a]"><T vi="Chỉ số này hiện không khả dụng." en="This metric is currently unavailable." /></p>;
}
