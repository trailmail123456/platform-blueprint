
-- Add new columns to note_comments
ALTER TABLE public.note_comments
  ADD COLUMN IF NOT EXISTS downvotes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_helpful boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_reported boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;

-- Create comment_votes table for deduplication
CREATE TABLE public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES public.note_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.comment_votes
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can vote" ON public.comment_votes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can change their vote" ON public.comment_votes
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can remove their vote" ON public.comment_votes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Function to handle voting with atomic count updates
CREATE OR REPLACE FUNCTION public.toggle_comment_vote(_comment_id uuid, _user_id uuid, _vote_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_vote text;
  result jsonb;
BEGIN
  SELECT vote_type INTO existing_vote
  FROM public.comment_votes
  WHERE comment_id = _comment_id AND user_id = _user_id;

  IF existing_vote IS NULL THEN
    -- New vote
    INSERT INTO public.comment_votes (comment_id, user_id, vote_type)
    VALUES (_comment_id, _user_id, _vote_type);
    IF _vote_type = 'up' THEN
      UPDATE public.note_comments SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = _comment_id;
    ELSE
      UPDATE public.note_comments SET downvotes = COALESCE(downvotes, 0) + 1 WHERE id = _comment_id;
    END IF;
    result := jsonb_build_object('action', 'voted', 'vote_type', _vote_type);

  ELSIF existing_vote = _vote_type THEN
    -- Remove vote (toggle off)
    DELETE FROM public.comment_votes WHERE comment_id = _comment_id AND user_id = _user_id;
    IF _vote_type = 'up' THEN
      UPDATE public.note_comments SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0) WHERE id = _comment_id;
    ELSE
      UPDATE public.note_comments SET downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0) WHERE id = _comment_id;
    END IF;
    result := jsonb_build_object('action', 'removed', 'vote_type', _vote_type);

  ELSE
    -- Switch vote
    UPDATE public.comment_votes SET vote_type = _vote_type WHERE comment_id = _comment_id AND user_id = _user_id;
    IF _vote_type = 'up' THEN
      UPDATE public.note_comments SET upvotes = COALESCE(upvotes, 0) + 1, downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0) WHERE id = _comment_id;
    ELSE
      UPDATE public.note_comments SET downvotes = COALESCE(downvotes, 0) + 1, upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0) WHERE id = _comment_id;
    END IF;
    result := jsonb_build_object('action', 'switched', 'vote_type', _vote_type);
  END IF;

  RETURN result;
END;
$$;

-- Enable realtime for comment_votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_votes;
