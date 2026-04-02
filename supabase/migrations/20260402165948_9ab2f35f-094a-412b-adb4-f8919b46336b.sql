
-- Reports table for content moderation
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('note', 'comment')),
  content_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can create reports
CREATE POLICY "Authenticated users can report" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Users can see their own reports
CREATE POLICY "Users can view their reports" ON public.reports
  FOR SELECT TO authenticated
  USING (reported_by = auth.uid());

-- Admins can see all reports
CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update reports (review/dismiss)
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete reports
CREATE POLICY "Admins can delete reports" ON public.reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Quality score function
CREATE OR REPLACE FUNCTION public.compute_note_quality_score(_note_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (COALESCE(rating, 0) * 0.5) + 
    (LEAST(COALESCE(downloads, 0), 1000) / 1000.0 * 3.0) + 
    (LEAST(COALESCE(views, 0), 5000) / 5000.0 * 2.0),
    0
  )::NUMERIC(5,2)
  FROM public.notes
  WHERE id = _note_id;
$$;

-- Add report_count to notes for quick filtering
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
