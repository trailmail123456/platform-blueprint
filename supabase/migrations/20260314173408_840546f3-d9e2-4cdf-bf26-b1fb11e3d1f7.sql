
-- AMA Sessions table
CREATE TABLE public.ama_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'upcoming',
  max_participants INTEGER DEFAULT 100,
  participant_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AMA Questions table
CREATE TABLE public.ama_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ama_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  upvotes INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AMA Participants table
CREATE TABLE public.ama_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ama_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- RLS for ama_sessions
ALTER TABLE public.ama_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ama sessions" ON public.ama_sessions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create ama sessions" ON public.ama_sessions FOR INSERT TO authenticated WITH CHECK (mentor_id = auth.uid());
CREATE POLICY "Mentors can update their sessions" ON public.ama_sessions FOR UPDATE TO authenticated USING (mentor_id = auth.uid());

-- RLS for ama_questions
ALTER TABLE public.ama_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions" ON public.ama_questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can ask questions" ON public.ama_questions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their questions" ON public.ama_questions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Session mentors can answer questions" ON public.ama_questions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ama_sessions WHERE id = ama_questions.session_id AND mentor_id = auth.uid())
);

-- RLS for ama_participants
ALTER TABLE public.ama_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.ama_participants FOR SELECT USING (true);
CREATE POLICY "Users can join sessions" ON public.ama_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave sessions" ON public.ama_participants FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ama_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ama_participants;
