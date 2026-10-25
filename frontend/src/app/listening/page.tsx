"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { IconHeadphones, IconSearch } from "@tabler/icons-react";
import { api, ApiError, type YouTubeVideo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage, tr } from "@/lib/language";

export default function ListeningPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("English conversation");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [next, setNext] = useState<string>();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function search(pageToken?: string) {
    setLoading(true); setMessage("");
    try {
      const page = await api.youtubeSearch({ q: query, page_token: pageToken, per_page: 12 });
      setVideos(pageToken ? (items) => [...items, ...page.items] : page.items);
      setNext(page.next_page_token);
    } catch (reason) {
      setMessage(reason instanceof ApiError && reason.status === 503 ? tr("Tính năng luyện nghe chưa được bật cho tài khoản này.", "Listening practice is not enabled for this account.") : reason instanceof Error ? reason.message : tr("Không thể tải video.", "Could not load videos."));
    } finally { setLoading(false); }
  }
  useEffect(() => { void search(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function submit(event: FormEvent) { event.preventDefault(); void search(); }

  return <div className="mx-auto max-w-6xl space-y-7">
    <header><p className="font-bold uppercase tracking-[.14em] text-primary">{t("Luyện nghe", "Listening practice")}</p><h2 className="font-display text-4xl font-bold">{t("Nghe, đọc phụ đề, rồi nói đuổi", "Listen, read captions, then shadow")}</h2><p className="mt-2 text-muted-foreground">{t("Chọn video có phụ đề để bắt đầu một bài nghe.", "Pick a captioned video to start a listening lesson.")}</p></header>
    <form onSubmit={submit} className="flex gap-2"><Input aria-label={t("Tìm video luyện nghe", "Search listening videos")} value={query} onChange={(event) => setQuery(event.target.value)} /><Button disabled={loading || !query.trim()}><IconSearch className="h-5 w-5" />{t("Tìm", "Search")}</Button></form>
    {message && <p role="alert" className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">{message}</p>}
    {loading && <p role="status" aria-live="polite">{t("Đang tìm video…", "Searching videos…")}</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{videos.map((video) => <Card key={video.id} className="overflow-hidden">{video.thumbnail_url ? <img src={video.thumbnail_url} alt="" width={480} height={270} loading="lazy" className="aspect-video w-full object-cover" /> : <div className="grid aspect-video place-items-center bg-muted"><IconHeadphones /></div>}<div className="p-5"><h3 className="line-clamp-2 font-display text-lg font-bold">{video.title}</h3><p className="mt-1 text-sm text-muted-foreground">{video.channel}</p>{video.has_captions === false ? <p className="mt-4 text-sm font-bold text-amber-800">{t("Không có phụ đề · chưa thể bắt đầu", "No captions · cannot start yet")}</p> : <Button asChildCompat="a" className="mt-4 w-full"><Link href={`/listening/${encodeURIComponent(video.id)}?title=${encodeURIComponent(video.title)}&channel=${encodeURIComponent(video.channel || "")}&thumbnail=${encodeURIComponent(video.thumbnail_url || "")}&duration=${video.duration_seconds || 0}`}>{t("Bắt đầu bài nghe", "Start lesson")}</Link></Button>}</div></Card>)}</div>
    {next && <Button variant="outline" onClick={() => search(next)} disabled={loading}>{t("Xem thêm", "Load more")}</Button>}
  </div>;
}
