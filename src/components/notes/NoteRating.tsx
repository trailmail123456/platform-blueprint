import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteRatingProps {
  noteId: string;
  currentRating: number;
  compact?: boolean;
  onRated?: () => void;
}

export const NoteRating = ({ noteId, currentRating, compact = false, onRated }: NoteRatingProps) => {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [avgRating, setAvgRating] = useState(currentRating);

  useEffect(() => {
    loadRatingData();
  }, [noteId, user]);

  const loadRatingData = async () => {
    // Get total ratings count and average
    const { data: ratings } = await supabase
      .from("note_ratings")
      .select("rating")
      .eq("note_id", noteId);

    if (ratings) {
      setTotalRatings(ratings.length);
      if (ratings.length > 0) {
        setAvgRating(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length);
      }
    }

    // Get user's own rating
    if (user) {
      const { data } = await supabase
        .from("note_ratings")
        .select("rating")
        .eq("note_id", noteId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setUserRating(data.rating);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      toast.error("Please sign in to rate notes");
      return;
    }

    try {
      if (userRating > 0) {
        await supabase.from("note_ratings").update({ rating } as any).eq("note_id", noteId).eq("user_id", user.id);
      } else {
        await supabase.from("note_ratings").insert({ note_id: noteId, user_id: user.id, rating } as any);
      }
      setUserRating(rating);
      toast.success(`Rated ${rating} star${rating > 1 ? "s" : ""}!`);
      loadRatingData();
      onRated?.();
    } catch {
      toast.error("Failed to submit rating");
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 hover:scale-110 transition-transform"
          >
            <Star className={cn(
              "h-4 w-4 transition-colors",
              (hoverRating || userRating) >= star
                ? "fill-warning text-warning"
                : "text-muted-foreground/30"
            )} />
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-1">({avgRating.toFixed(1)})</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 hover:scale-125 transition-transform"
            >
              <Star className={cn(
                "h-5 w-5 transition-colors",
                (hoverRating || userRating) >= star
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/30"
              )} />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({totalRatings} rating{totalRatings !== 1 ? "s" : ""})</span>
      </div>
      {userRating > 0 && (
        <p className="text-xs text-muted-foreground">Your rating: {userRating}/5</p>
      )}
    </div>
  );
};
