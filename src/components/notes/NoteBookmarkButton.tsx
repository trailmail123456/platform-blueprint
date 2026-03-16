import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoteBookmarkButtonProps {
  noteId: string;
  size?: "sm" | "icon";
  className?: string;
}

export const NoteBookmarkButton = ({ noteId, size = "icon", className }: NoteBookmarkButtonProps) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("note_bookmarks")
      .select("id")
      .eq("note_id", noteId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setBookmarked(!!data));
  }, [noteId, user]);

  const toggle = async () => {
    if (!user) { toast.error("Please sign in to bookmark notes"); return; }
    setLoading(true);
    try {
      if (bookmarked) {
        await supabase.from("note_bookmarks").delete().eq("note_id", noteId).eq("user_id", user.id);
        setBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        await supabase.from("note_bookmarks").insert({ note_id: noteId, user_id: user.id } as any);
        setBookmarked(true);
        toast.success("Note bookmarked!");
      }
    } catch {
      toast.error("Failed to update bookmark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn("h-7 w-7", className)}
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      disabled={loading}
    >
      <Bookmark className={cn("h-3.5 w-3.5 transition-colors", bookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
    </Button>
  );
};
