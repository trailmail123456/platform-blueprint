
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.brainstorm_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '💡',
  is_active BOOLEAN DEFAULT true,
  mentor_led BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.brainstorm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.brainstorm_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_mentor_message BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.brainstorm_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.brainstorm_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_mentor BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.brainstorm_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brainstorm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brainstorm_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rooms" ON public.brainstorm_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON public.brainstorm_rooms FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can update their rooms" ON public.brainstorm_rooms FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Anyone can view room messages" ON public.brainstorm_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post messages" ON public.brainstorm_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view participants" ON public.brainstorm_participants FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON public.brainstorm_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave rooms" ON public.brainstorm_participants FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.brainstorm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brainstorm_participants;

CREATE TRIGGER update_brainstorm_rooms_updated_at
  BEFORE UPDATE ON public.brainstorm_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
