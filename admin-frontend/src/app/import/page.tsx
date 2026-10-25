'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AccessibleDialog from '@/components/AccessibleDialog';
import { DataPanel, StateNotice } from '@/components/AdminDataView';
import { useImportPolling } from '@/lib/useImportPolling';
import {
  adminImports, auth,
  type AdminImportCheckpoint, type AdminImportEntity, type AdminImportRun,
  type PageMeta, type StagedItem, type StagedItemClassification,
} from '@/lib/api';
import { EnumLabel, T, tr, useLanguage } from '@/lib/language';

export default function ImportPage() {
  return <AdminLayout title={<T vi="Tác vụ nhập" en="Import Jobs" />}><PageContent /></AdminLayout>;
}

function PageContent() {
  const { t } = useLanguage();
  const [checkpoints, setCheckpoints] = useState<AdminImportCheckpoint[]>([]);
  const [runs, setRuns] = useState<AdminImportRun[]>([]);
  const [entity, setEntity] = useState<AdminImportEntity>('courses');
  const [limit, setLimit] = useState(50);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [items, user] = await Promise.all([adminImports.checkpoints(), auth.adminMe()]);
      setCheckpoints(items);
      setSuperAdmin(user.role === 'super_admin');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : tr('Không thể tải điểm dừng nhập.', 'Could not load import checkpoints.'));
    } finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function start(reset = false) {
    setWorking(true);
    setMessage('');
    try {
      const run = reset ? await adminImports.reset(entity, limit) : await adminImports.resume(entity, limit);
      setRuns(items => [run, ...items.filter(item => item.id !== run.id)]);
      setMessage(tr(`Lượt nhập: ${run.status}. Yêu cầu ${run.request_id.slice(0, 8)}…`, `Import ${run.status}. Request ${run.request_id.slice(0, 8)}…`));
      await load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : tr('Không thể bắt đầu nhập.', 'Could not start import.'));
    } finally { setWorking(false); }
  }

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#006590]"><T vi="Nguồn bên ngoài" en="External provider" /></p><h2 className="mt-2 text-3xl font-black"><T vi="Nhập dữ liệu giữa các máy chủ" en="Server-to-server imports" /></h2><p className="mt-1 font-medium text-[#3e4850]"><T vi="Tiếp tục từ điểm dừng bền vững mà không vượt giới hạn tốc độ của nhà cung cấp." en="Resume from durable checkpoints without bypassing provider rate limits." /></p></div>
      <button onClick={() => void load()} disabled={loading} className="rounded-xl border-2 border-[#88ceff] px-5 py-3 font-bold text-[#006590] disabled:opacity-50"><T vi="Làm mới" en="Refresh" /></button>
    </header>

    {message && <p role="status" className="rounded-2xl bg-[#ffdf92] p-4 font-bold text-[#594400]">{message}</p>}

    <section className="rounded-3xl border-2 border-[#bdc8d2] bg-white p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_160px_auto_auto] md:items-end">
        <label className="font-bold"><T vi="Thực thể" en="Entity" /><select value={entity} onChange={event => setEntity(event.target.value as AdminImportEntity)} className="mt-2 w-full rounded-xl border-2 border-[#bdc8d2] px-4 py-3">{(['categories', 'courses', 'vocabulary', 'lessons'] as const).map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="font-bold"><T vi="Giới hạn" en="Limit" /><input type="number" min="1" max="100" value={limit} onChange={event => setLimit(Math.min(100, Math.max(1, Number(event.target.value))))} className="mt-2 w-full rounded-xl border-2 border-[#bdc8d2] px-4 py-3" /></label>
        <button onClick={() => void start()} disabled={working} className="rounded-xl bg-[#006590] px-6 py-3 font-black text-white disabled:opacity-50"><T vi="Bắt đầu / tiếp tục" en="Start / resume" /></button>
        {superAdmin && <button onClick={() => confirm(t(`Đặt lại điểm dừng ${entity} và nhập lại?`, `Reset ${entity} checkpoint and import again?`)) && void start(true)} disabled={working} className="rounded-xl bg-[#ba1a1a] px-6 py-3 font-black text-white disabled:opacity-50"><T vi="Đặt lại & thử lại" en="Reset & retry" /></button>}
      </div>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      {loading ? <p className="font-bold"><T vi="Đang tải điểm dừng…" en="Loading checkpoints…" /></p> : checkpoints.length === 0 ? <p><T vi="Không có điểm dừng nào." en="No checkpoints found." /></p> : checkpoints.map(item => <article key={item.entity} className="rounded-2xl border-2 border-[#bdc8d2] bg-white p-5"><h3 className="text-lg font-black capitalize"><EnumLabel value={item.entity} /></h3><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><dt><T vi="Con trỏ" en="Cursor" /></dt><dd className="text-right font-black">{item.cursor}</dd><dt><T vi="Lỗi" en="Failures" /></dt><dd className="text-right font-black">{item.failures}</dd><dt><T vi="Đồng bộ gần nhất" en="Last sync" /></dt><dd className="text-right font-bold">{item.last_synced_at ? new Date(item.last_synced_at).toLocaleString() : t('Chưa bao giờ', 'Never')}</dd></dl></article>)}
    </section>

    {runs.length > 0 && <section className="overflow-x-auto rounded-3xl border-2 border-[#bdc8d2] bg-white p-5"><h3 className="text-lg font-black"><T vi="Lượt chạy trong phiên này" en="Runs started in this session" /></h3><table className="mt-4 w-full text-left"><thead><tr>{[t('Thực thể', 'Entity'), t('Trạng thái', 'Status'), t('Đã xử lý', 'Processed'), t('Bỏ qua', 'Skipped'), t('Con trỏ', 'Cursor'), t('Lỗi', 'Error')].map(label => <th key={label} className="px-3 py-2 text-xs uppercase">{label}</th>)}</tr></thead><tbody>{runs.map(run => <LiveRunRow key={run.id} initial={run} />)}</tbody></table></section>}

    <RunHistoryPanel superAdmin={superAdmin} />
  </div>;
}

/** Polls a single active run until it reaches a terminal status, then stops. */
function LiveRunRow({ initial }: { initial: AdminImportRun }) {
  const active = initial.status === 'pending' || initial.status === 'running';
  const { run } = useImportPolling(active ? initial.id : null);
  const current = run ?? initial;
  return <tr className="border-t"><td className="px-3 py-3 font-bold">{current.entity}</td><td className="px-3 py-3">{current.status}</td><td className="px-3 py-3">{current.processed ?? '—'}</td><td className="px-3 py-3">{current.skipped ?? '—'}</td><td className="px-3 py-3">{current.result_cursor ?? current.starting_cursor}</td><td className="px-3 py-3 text-[#93000a]">{current.error_message ?? '—'}</td></tr>;
}

const HISTORY_PER_PAGE = 10;

function RunHistoryPanel({ superAdmin }: { superAdmin: boolean }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<AdminImportRun[]>();
  const [meta, setMeta] = useState<PageMeta>();
  const [error, setError] = useState('');
  const [entityFilter, setEntityFilter] = useState<AdminImportEntity | ''>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [diffRun, setDiffRun] = useState<AdminImportRun | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await adminImports.runs({
        entity: entityFilter || undefined,
        status: statusFilter || undefined,
        page,
        perPage: HISTORY_PER_PAGE,
      });
      setItems(result.data);
      setMeta(result.meta);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tr('Không thể tải lịch sử nhập.', 'Could not load import history.'));
    }
  }, [entityFilter, statusFilter, page]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  return <DataPanel title={t(`Lịch sử lượt chạy · ${meta?.total ?? items?.length ?? 0}`, `Run history · ${meta?.total ?? items?.length ?? 0}`)}>
    <div className="mb-5 flex flex-wrap gap-3">
      <label className="font-bold"><T vi="Thực thể" en="Entity" />
        <select value={entityFilter} onChange={event => { setPage(1); setEntityFilter(event.target.value as AdminImportEntity | ''); }} className="mt-1 block rounded-xl border-2 border-[#bdc8d2] px-3 py-2">
          <option value="">{t('Tất cả', 'All')}</option>
          {(['categories', 'courses', 'vocabulary', 'lessons'] as const).map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="font-bold"><T vi="Trạng thái" en="Status" />
        <select value={statusFilter} onChange={event => { setPage(1); setStatusFilter(event.target.value); }} className="mt-1 block rounded-xl border-2 border-[#bdc8d2] px-3 py-2">
          <option value="">{t('Tất cả', 'All')}</option>
          {['pending', 'running', 'review-ready', 'approved', 'failed'].map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    </div>

    {error && !items ? <StateNotice state="error" message={error} retry={load} />
      : !items ? <StateNotice state="loading" />
      : items.length === 0 ? <StateNotice state="empty" message={t('Chưa có lượt nhập nào khớp bộ lọc này.', 'No import runs match this filter yet.')} />
      : <>
        {error && <p role="alert" className="mb-4 rounded-xl bg-[#ffdad6] p-4 font-bold text-[#93000a]">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr>{[t('Thực thể', 'Entity'), t('Trạng thái', 'Status'), t('Đã xử lý', 'Processed'), t('Bỏ qua', 'Skipped'), t('Mới', 'New'), t('Đã cập nhật', 'Updated'), t('Không hợp lệ', 'Invalid'), t('Bắt đầu lúc', 'Started'), ''].map(label => <th key={label} className="px-3 py-2 text-xs uppercase">{label}</th>)}</tr></thead>
            <tbody>{items.map(run => {
              const stagedTotal = (run.staged_new_count ?? 0) + (run.staged_update_count ?? 0) + (run.staged_invalid_count ?? 0);
              return <tr key={run.id} className="border-t">
                <td className="px-3 py-3 font-bold"><EnumLabel value={run.entity} /></td>
                <td className="px-3 py-3"><EnumLabel value={run.status} /></td>
                <td className="px-3 py-3">{run.processed ?? '—'}</td>
                <td className="px-3 py-3">{run.skipped ?? '—'}</td>
                <td className="px-3 py-3">{run.staged_new_count ?? 0}</td>
                <td className="px-3 py-3">{run.staged_update_count ?? 0}</td>
                <td className="px-3 py-3">{run.staged_invalid_count ?? 0}</td>
                <td className="px-3 py-3"><time dateTime={run.created_at}>{new Date(run.created_at).toLocaleString()}</time></td>
                <td className="px-3 py-3">{stagedTotal > 0 && <button onClick={() => setDiffRun(run)} className="rounded-xl border-2 border-[#88ceff] px-3 py-2 text-xs font-bold text-[#006590]"><T vi="Xem khác biệt" en="View diff" /></button>}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="rounded-xl border-2 border-[#bdc8d2] px-4 py-2 font-bold disabled:opacity-40"><T vi="Trước" en="Prev" /></button>
          <span className="py-2 font-bold">{page}</span>
          <button disabled={items.length < HISTORY_PER_PAGE} onClick={() => setPage(value => value + 1)} className="rounded-xl border-2 border-[#bdc8d2] px-4 py-2 font-bold disabled:opacity-40"><T vi="Sau" en="Next" /></button>
        </div>
      </>}

    {diffRun && <StagedItemDiffDialog run={diffRun} superAdmin={superAdmin} onClose={() => setDiffRun(null)} onApplied={load} />}
  </DataPanel>;
}

const CLASSIFICATION_TABS: Array<{ value: StagedItemClassification | ''; label: { vi: string; en: string } }> = [
  { value: '', label: { vi: 'Tất cả', en: 'All' } },
  { value: 'new', label: { vi: 'Mới', en: 'New' } },
  { value: 'update', label: { vi: 'Đã cập nhật', en: 'Updated' } },
  { value: 'invalid', label: { vi: 'Không hợp lệ', en: 'Invalid' } },
];

/**
 * Staged-item diff viewer. Read-only for everyone except a super admin
 * reviewing a 'categories' run, who additionally gets an "Apply selected"
 * action (issue #45) — no other entity or role can apply from here.
 */
function StagedItemDiffDialog({ run, superAdmin, onClose, onApplied }: { run: AdminImportRun; superAdmin: boolean; onClose: () => void; onApplied: () => void }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<StagedItem[]>();
  const [error, setError] = useState('');
  const [classification, setClassification] = useState<StagedItemClassification | ''>('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const canApply = superAdmin && run.entity === 'categories';

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await adminImports.items(run.id, { classification: classification || undefined, perPage: 50 });
      setItems(result.data);
      setSelected(new Set());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tr('Không thể tải các mục chờ duyệt.', 'Could not load staged items.'));
    }
  }, [run.id, classification]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const applyableItems = items?.filter(item => item.status === 'staged' && (item.classification === 'new' || item.classification === 'update')) ?? [];

  function toggle(id: number) {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function apply() {
    if (selected.size === 0) return;
    setApplying(true);
    setApplyMessage('');
    try {
      const result = await adminImports.apply(run.id, Array.from(selected));
      setApplyMessage(tr(`Đã áp dụng ${result.applied.length}, lỗi thời ${result.stale.length}, thất bại ${result.failed.length}.`, `Applied ${result.applied.length}, stale ${result.stale.length}, failed ${result.failed.length}.`));
      onApplied();
      await load();
    } catch (reason) {
      setApplyMessage(reason instanceof Error ? reason.message : tr('Không thể áp dụng các mục đã chọn.', 'Could not apply the selected items.'));
    } finally { setApplying(false); }
  }

  return <AccessibleDialog title={t(`Mục chờ duyệt · ${run.entity}`, `Staged items · ${run.entity}`)} description={canApply ? t(`Lượt chạy ${run.request_id.slice(0, 8)}… — chọn mục để áp dụng`, `Run ${run.request_id.slice(0, 8)}… — select items to apply`) : t(`Lượt chạy ${run.request_id.slice(0, 8)}… (chỉ xem)`, `Run ${run.request_id.slice(0, 8)}… (read-only review)`)} onClose={onClose} className="max-w-3xl">
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {CLASSIFICATION_TABS.map(tab => <button key={tab.value} onClick={() => setClassification(tab.value)} className={`rounded-full px-3 py-1 text-xs font-black uppercase ${classification === tab.value ? 'bg-[#006590] text-white' : 'bg-[#e8f4ff] text-[#006590]'}`}><T vi={tab.label.vi} en={tab.label.en} /></button>)}
      </div>
      {canApply && applyableItems.length > 0 && <label className="text-sm font-bold"><input type="checkbox" className="mr-2" checked={selected.size === applyableItems.length} onChange={event => setSelected(event.target.checked ? new Set(applyableItems.map(item => item.id)) : new Set())} /><T vi="Chọn tất cả mục áp dụng được" en="Select all applyable" /></label>}
    </div>

    {applyMessage && <p role="status" className="mt-3 rounded-xl bg-[#ffdf92] p-3 font-bold text-[#594400]">{applyMessage}</p>}

    <div className="mt-5">
      {error && !items ? <StateNotice state="error" message={error} retry={load} />
        : !items ? <StateNotice state="loading" />
        : items.length === 0 ? <StateNotice state="empty" message={t('Không có mục chờ duyệt cho bộ lọc này.', 'No staged items for this filter.')} />
        : <ul className="space-y-4">{items.map(item => {
            const applyable = item.status === 'staged' && (item.classification === 'new' || item.classification === 'update');
            return <li key={item.id} className="rounded-2xl border-2 border-[#bdc8d2] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {canApply && applyable && <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} aria-label={t(`Chọn ${item.external_id ?? 'mục'}`, `Select ${item.external_id ?? 'item'}`)} />}
                  <span className="font-bold">{item.external_id ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#e8f4ff] px-3 py-1 text-xs font-black uppercase text-[#006590]"><EnumLabel value={item.classification} /></span>
                  {item.status !== 'staged' && <span className="rounded-full bg-[#ffdf92] px-3 py-1 text-xs font-black uppercase text-[#594400]"><EnumLabel value={item.status} /></span>}
                </div>
              </div>
              {item.errors && item.errors.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-[#93000a]">{item.errors.map((message, index) => <li key={index}>{message}</li>)}</ul>}
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <SnapshotColumn title={<T vi="Hiện có" en="Existing" />} snapshot={item.existing_snapshot} other={item.incoming_snapshot} />
                <SnapshotColumn title={<T vi="Mới nhập" en="Incoming" />} snapshot={item.incoming_snapshot} other={item.existing_snapshot} />
              </div>
            </li>;
          })}</ul>}
    </div>

    {canApply && applyableItems.length > 0 && <div className="mt-5 flex justify-end"><button onClick={() => void apply()} disabled={applying || selected.size === 0} className="rounded-xl bg-[#006590] px-6 py-3 font-black text-white disabled:opacity-50"><T vi="Áp dụng mục đã chọn (" en="Apply selected (" />{selected.size})</button></div>}
  </AccessibleDialog>;
}

function SnapshotColumn({ title, snapshot, other }: { title: React.ReactNode; snapshot: Record<string, unknown> | null; other: Record<string, unknown> | null }) {
  if (!snapshot) return <div><p className="text-xs font-black uppercase text-[#6e7881]">{title}</p><p className="mt-1 text-sm text-[#6e7881]">—</p></div>;
  const keys = Object.keys(snapshot);
  return <div>
    <p className="text-xs font-black uppercase text-[#6e7881]">{title}</p>
    <dl className="mt-1 space-y-1 text-sm">
      {keys.map(key => {
        const changed = JSON.stringify(snapshot[key]) !== JSON.stringify(other?.[key]);
        return <div key={key} className={changed ? 'rounded bg-[#ffdf92] px-2 py-1' : undefined}><dt className="inline font-bold">{key}: </dt><dd className="inline">{String(snapshot[key] ?? '—')}</dd></div>;
      })}
    </dl>
  </div>;
}
