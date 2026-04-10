
-- Feedback Circles table
CREATE TABLE public.feedback_circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  meeting_time TEXT,
  week_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback circles"
  ON public.feedback_circles FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create circles"
  ON public.feedback_circles FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their circles"
  ON public.feedback_circles FOR UPDATE
  TO authenticated USING (created_by = auth.uid());

-- Feedback Circle Members
CREATE TABLE public.feedback_circle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.feedback_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  project_name TEXT,
  skills TEXT[] DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

ALTER TABLE public.feedback_circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view circle members"
  ON public.feedback_circle_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join circles"
  ON public.feedback_circle_members FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave circles"
  ON public.feedback_circle_members FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Circle Feedback
CREATE TABLE public.circle_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.feedback_circles(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.circle_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view feedback"
  ON public.circle_feedback FOR SELECT USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can submit feedback"
  ON public.circle_feedback FOR INSERT
  TO authenticated WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can delete own feedback"
  ON public.circle_feedback FOR DELETE
  TO authenticated USING (from_user_id = auth.uid());

-- Enable realtime for circles
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_circles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_circle_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_feedback;
