import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "./useRealtimeSync";
import { toast } from "sonner";

export interface ForumThread {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  reply_count: number;
  view_count: number;
  like_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_activity_at: string;
  created_at: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  like_count: number;
  created_at: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

async function attachAuthors<T extends { user_id: string }>(rows: T[]): Promise<(T & { author: any })[]> {
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (!ids.length) return rows.map((r) => ({ ...r, author: null }));
  const { data } = await supabase.from("profiles").select("id,username,full_name,avatar_url").in("id", ids);
  const map = new Map((data || []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({ ...r, author: map.get(r.user_id) || null }));
}

export function useForumThreads(category?: string, sort: "recent" | "trending" | "unanswered" = "recent") {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    let q = supabase.from("forum_threads").select("*").order("is_pinned", { ascending: false });
    if (sort === "trending") q = q.order("like_count", { ascending: false });
    else if (sort === "unanswered") q = q.eq("reply_count", 0).order("created_at", { ascending: false });
    else q = q.order("last_activity_at", { ascending: false });
    q = q.limit(100);
    if (category && category !== "All") q = q.eq("category", category);
    const { data, error } = await q;
    if (error) { setLoading(false); return; }
    setThreads(await attachAuthors(data || []));
    setLoading(false);
  }, [category, sort]);

  const status = useRealtimeSync({
    channelName: `forum-threads-${category || "all"}-${sort}`,
    filters: [
      { table: "forum_threads", event: "*" },
      { table: "forum_replies", event: "*" },
    ],
    onChange: fetchThreads,
  });

  return { threads, loading, status, refetch: fetchThreads };
}

export async function createThread(input: { title: string; body: string; category: string; tags: string[] }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Please sign in"); return null; }
  const { data, error } = await supabase.from("forum_threads").insert({ ...input, user_id: user.id }).select().single();
  if (error) { toast.error(error.message); return null; }
  toast.success("Thread posted");
  return data;
}

export async function toggleThreadLike(threadId: string) {
  const { error } = await supabase.rpc("toggle_forum_thread_like", { _thread_id: threadId });
  if (error) toast.error(error.message);
}

export async function incrementThreadViews(threadId: string) {
  await supabase.rpc("increment_forum_thread_views", { _thread_id: threadId });
}

export function useForumReplies(threadId: string | null) {
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReplies = useCallback(async () => {
    if (!threadId) { setReplies([]); setLoading(false); return; }
    const { data } = await supabase.from("forum_replies").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
    setReplies(await attachAuthors(data || []));
    setLoading(false);
  }, [threadId]);

  const status = useRealtimeSync({
    channelName: threadId ? `forum-replies-${threadId}` : "forum-replies-none",
    filters: threadId ? [{ table: "forum_replies", filter: `thread_id=eq.${threadId}`, event: "*" }] : [],
    onChange: fetchReplies,
    enabled: !!threadId,
  });

  return { replies, loading, status, refetch: fetchReplies };
}

export async function postReply(threadId: string, body: string, parentId?: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Please sign in"); return null; }
  if (!body.trim()) { toast.error("Reply cannot be empty"); return null; }
  const { data, error } = await supabase.from("forum_replies").insert({
    thread_id: threadId, user_id: user.id, body: body.trim(), parent_id: parentId || null,
  }).select().single();
  if (error) { toast.error(error.message); return null; }
  return data;
}
