CREATE OR REPLACE FUNCTION public.increment_idea_upvotes(_idea_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.ideas
  SET upvotes = COALESCE(upvotes, 0) + 1
  WHERE id = _idea_id;
$$;