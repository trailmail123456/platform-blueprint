
-- Atomic increment functions for view and download tracking
CREATE OR REPLACE FUNCTION public.increment_note_views(_note_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notes
  SET views = COALESCE(views, 0) + 1,
      last_viewed_at = now()
  WHERE id = _note_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_note_downloads(_note_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notes
  SET downloads = COALESCE(downloads, 0) + 1
  WHERE id = _note_id;
$$;
