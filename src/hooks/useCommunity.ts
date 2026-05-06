import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "./useRealtimeSync";
import { toast } from "sonner";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  tags: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
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

export function useCommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) { setLoading(false); return; }
    setPosts(await attachAuthors(data || []));
    setLoading(false);
  }, []);

  const status = useRealtimeSync({
    channelName: "community-feed",
    filters: [
      { table: "community_posts", event: "*" },
      { table: "community_post_comments", event: "*" },
    ],
    onChange: fetchPosts,
  });

  return { posts, loading, status, refetch: fetchPosts };
}

export async function createPost(input: { content: string; tags?: string[]; image_url?: string | null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Please sign in"); return null; }
  if (!input.content.trim()) { toast.error("Post cannot be empty"); return null; }
  const { data, error } = await supabase.from("community_posts").insert({
    user_id: user.id, content: input.content.trim(), tags: input.tags || [], image_url: input.image_url || null,
  }).select().single();
  if (error) { toast.error(error.message); return null; }
  toast.success("Posted");
  return data;
}

export async function togglePostLike(postId: string) {
  const { error } = await supabase.rpc("toggle_community_post_like", { _post_id: postId });
  if (error) toast.error(error.message);
}

export function usePostComments(postId: string | null) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!postId) { setComments([]); setLoading(false); return; }
    const { data } = await supabase.from("community_post_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    setComments(await attachAuthors(data || []));
    setLoading(false);
  }, [postId]);

  const status = useRealtimeSync({
    channelName: postId ? `community-comments-${postId}` : "community-comments-none",
    filters: postId ? [{ table: "community_post_comments", filter: `post_id=eq.${postId}`, event: "*" }] : [],
    onChange: fetchComments,
    enabled: !!postId,
  });

  return { comments, loading, status, refetch: fetchComments };
}

export async function postComment(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Please sign in"); return null; }
  if (!content.trim()) { toast.error("Comment cannot be empty"); return null; }
  const { data, error } = await supabase.from("community_post_comments").insert({
    post_id: postId, user_id: user.id, content: content.trim(),
  }).select().single();
  if (error) { toast.error(error.message); return null; }
  return data;
}
