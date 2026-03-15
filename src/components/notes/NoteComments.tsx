import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2, ThumbsUp, Reply, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NoteCommentsProps {
  noteId: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  upvotes: number;
  created_at: string;
  parent_id: string | null;
  profile?: { username: string | null; full_name: string | null };
}

export const NoteComments = ({ noteId }: NoteCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();

    const channel = supabase
      .channel(`note-comments-${noteId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "note_comments", filter: `note_id=eq.${noteId}` }, () => {
        loadComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [noteId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from("note_comments")
      .select("*")
      .eq("note_id", noteId)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const enriched = data.map(c => ({
        ...c,
        profile: profileMap.get(c.user_id) || { username: null, full_name: null },
      }));
      setComments(enriched);
    }
    setLoading(false);
  };

  const handleSubmit = async (content: string, parentId: string | null = null) => {
    if (!user) { toast.error("Please sign in to comment"); return; }
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("note_comments").insert({
        note_id: noteId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
      } as any);

      if (error) throw error;
      if (parentId) { setReplyContent(""); setReplyTo(null); }
      else { setNewComment(""); }
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("note_comments").delete().eq("id", commentId);
    if (error) toast.error("Failed to delete");
    else toast.success("Comment deleted");
  };

  const handleUpvote = async (commentId: string, currentUpvotes: number) => {
    if (!user) { toast.error("Please sign in"); return; }
    await supabase.from("note_comments").update({ upvotes: currentUpvotes + 1 } as any).eq("id", commentId);
    loadComments();
  };

  const getDisplayName = (comment: Comment) => {
    return comment.profile?.full_name || comment.profile?.username || "Anonymous";
  };

  const getInitials = (comment: Comment) => {
    const name = getDisplayName(comment);
    return name.slice(0, 2).toUpperCase();
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? "ml-10 mt-2" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(comment)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{getDisplayName(comment)}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => handleUpvote(comment.id, comment.upvotes)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ThumbsUp className="h-3 w-3" />
            {comment.upvotes > 0 && comment.upvotes}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Reply className="h-3 w-3" />Reply
            </button>
          )}
          {user?.id === comment.user_id && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        {replyTo === comment.id && (
          <div className="flex gap-2 mt-2">
            <Textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={() => handleSubmit(replyContent, comment.id)} disabled={submitting || !replyContent.trim()}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
        )}
        {getReplies(comment.id).map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-sm">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </h3>

      {/* New comment input */}
      {user ? (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user.email?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this note..."
              rows={2}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={() => handleSubmit(newComment)}
              disabled={submitting || !newComment.trim()}
              className="self-end"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to join the discussion.</p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : topLevel.length > 0 ? (
        <div className="space-y-4">
          {topLevel.map(comment => <CommentItem key={comment.id} comment={comment} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first to share your thoughts!</p>
      )}
    </div>
  );
};
