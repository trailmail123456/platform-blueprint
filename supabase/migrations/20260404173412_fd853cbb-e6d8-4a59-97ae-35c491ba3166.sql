
-- Create idea_messages table for per-idea live chat
CREATE TABLE public.idea_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.idea_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view idea messages"
  ON public.idea_messages FOR SELECT
  TO public USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON public.idea_messages FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.idea_messages FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_messages;
