import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type SortMode = "top" | "new" | "discussed";

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  upvotes: number;
  downvotes: number;
  is_helpful: boolean;
  is_reported: boolean;
  is_edited: boolean;
  created_at: string;
  parent_id: string | null;
  note_id: string;
  profile?: { username: string | null; full_name: string | null };
  userVote?: "up" | "down" | null;
  replyCount?: number;
}

const PAGE_SIZE = 15;

export const useNoteComments = (noteId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("top");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const loadComments = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) setPage(0);

    setLoading(true);

    // Get total count
    const { count } = await supabase
      .from("note_comments")
      .select("*", { count: "exact", head: true })
      .eq("note_id", noteId);
    setTotalCount(count || 0);

    // Determine sort
    let query = supabase
      .from("note_comments")
      .select("*")
      .eq("note_id", noteId)
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    switch (sortMode) {
      case "top":
        query = query.order("is_helpful", { ascending: false }).order("upvotes", { ascending: false });
        break;
      case "new":
        query = query.order("created_at", { ascending: false });
        break;
      case "discussed":
        query = query.order("upvotes", { ascending: false }).order("created_at", { ascending: false });
        break;
    }

    const { data } = await query;

    if (data) {
      setHasMore(data.length === PAGE_SIZE);

      // Enrich with profiles
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Load user's votes
      let userVotes = new Map<string, string>();
      if (user) {
        const commentIds = data.map(c => c.id);
        const { data: votes } = await supabase
          .from("comment_votes" as any)
          .select("comment_id, vote_type")
          .eq("user_id", user.id)
          .in("comment_id", commentIds);
        if (votes) {
          (votes as any[]).forEach(v => userVotes.set(v.comment_id, v.vote_type));
        }
      }

      const enriched: Comment[] = data.map(c => ({
        ...c,
        downvotes: (c as any).downvotes || 0,
        is_helpful: (c as any).is_helpful || false,
        is_reported: (c as any).is_reported || false,
        is_edited: (c as any).is_edited || false,
        profile: profileMap.get(c.user_id) || { username: null, full_name: null },
        userVote: (userVotes.get(c.id) as "up" | "down") || null,
      }));

      if (reset || currentPage === 0) {
        setComments(enriched);
      } else {
        setComments(prev => [...prev, ...enriched]);
      }
    }
    setLoading(false);
  }, [noteId, sortMode, page, user]);

  useEffect(() => {
    loadComments(true);

    const channel = supabase
      .channel(`comments-${noteId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "note_comments", filter: `note_id=eq.${noteId}` }, () => {
        loadComments(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [noteId, sortMode]);

  const addComment = async (content: string, parentId: string | null = null) => {
    if (!user) { toast.error("Please sign in to comment"); return; }
    if (!content.trim()) return;

    // Limit nesting depth to 2
    if (parentId) {
      const parent = comments.find(c => c.id === parentId);
      if (parent?.parent_id) {
        // Already a reply — attach to root instead
        const grandparent = comments.find(c => c.id === parent.parent_id);
        if (grandparent?.parent_id) {
          parentId = grandparent.parent_id;
        } else {
          parentId = parent.parent_id;
        }
      }
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("note_comments").insert({
        note_id: noteId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
      } as any);
      if (error) throw error;
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const editComment = async (commentId: string, content: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("note_comments")
      .update({ content: content.trim(), is_edited: true } as any)
      .eq("id", commentId);
    if (error) toast.error("Failed to edit");
    else toast.success("Comment updated");
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from("note_comments").delete().eq("id", commentId);
    if (error) toast.error("Failed to delete");
    else toast.success("Comment deleted");
  };

  const vote = async (commentId: string, voteType: "up" | "down") => {
    if (!user) { toast.error("Please sign in to vote"); return; }
    await supabase.rpc("toggle_comment_vote" as any, {
      _comment_id: commentId,
      _user_id: user.id,
      _vote_type: voteType,
    });
    loadComments(true);
  };

  const markHelpful = async (commentId: string, isHelpful: boolean) => {
    const { error } = await supabase
      .from("note_comments")
      .update({ is_helpful: !isHelpful } as any)
      .eq("id", commentId);
    if (error) toast.error("Failed to update");
    else toast.success(isHelpful ? "Unmarked as helpful" : "Marked as helpful!");
  };

  const reportComment = async (commentId: string) => {
    const { error } = await supabase
      .from("note_comments")
      .update({ is_reported: true } as any)
      .eq("id", commentId);
    if (error) toast.error("Failed to report");
    else toast.success("Comment reported. Thank you!");
  };

  const loadMore = () => {
    setPage(p => p + 1);
    loadComments(false);
  };

  // Computed: top-level and replies
  const topLevel = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return {
    comments,
    topLevel,
    getReplies,
    loading,
    submitting,
    sortMode,
    setSortMode,
    totalCount,
    hasMore,
    loadMore,
    addComment,
    editComment,
    deleteComment,
    vote,
    markHelpful,
    reportComment,
    user,
  };
};
