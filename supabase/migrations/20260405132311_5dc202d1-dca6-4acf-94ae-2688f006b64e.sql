
-- Join requests table for Innovation Hub team applications
CREATE TABLE public.join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT,
  requested_role TEXT DEFAULT 'developer',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Idea owners can view requests for their ideas
CREATE POLICY "Idea owners can view join requests"
  ON public.join_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = join_requests.idea_id
      AND ideas.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Users can create join requests
CREATE POLICY "Users can create join requests"
  ON public.join_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Idea owners can update (accept/reject) requests
CREATE POLICY "Idea owners can update join requests"
  ON public.join_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = join_requests.idea_id
      AND ideas.user_id = auth.uid()
    )
  );

-- Users can delete their own pending requests
CREATE POLICY "Users can delete own pending requests"
  ON public.join_requests FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Enable realtime for join_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;
