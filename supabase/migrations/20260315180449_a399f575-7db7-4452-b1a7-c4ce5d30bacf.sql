
-- Note ratings table
CREATE TABLE public.note_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(note_id, user_id)
);

ALTER TABLE public.note_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" ON public.note_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON public.note_ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their rating" ON public.note_ratings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their rating" ON public.note_ratings FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Note comments table
CREATE TABLE public.note_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES public.note_comments(id) ON DELETE CASCADE,
  upvotes integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.note_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.note_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their comments" ON public.note_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their comments" ON public.note_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_comments;

-- Function to update average rating on notes table
CREATE OR REPLACE FUNCTION public.update_note_average_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notes
  SET rating = (
    SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
    FROM public.note_ratings
    WHERE note_id = COALESCE(NEW.note_id, OLD.note_id)
  )
  WHERE id = COALESCE(NEW.note_id, OLD.note_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_note_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.note_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_note_average_rating();
