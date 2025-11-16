-- Create notes table for storing uploaded notes
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  semester integer,
  branch text,
  content_url text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  rating numeric DEFAULT 0,
  views integer DEFAULT 0,
  downloads integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create annotations table for note highlights and comments
CREATE TABLE public.annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_number integer NOT NULL,
  position jsonb NOT NULL, -- {x, y, width, height}
  color text DEFAULT '#fbbf24',
  text_content text,
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create study sessions table for collaborative study rooms
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_name text NOT NULL,
  is_active boolean DEFAULT true,
  current_page integer DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create session participants table
CREATE TABLE public.session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.study_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, user_id)
);

-- Create chat messages table for study session chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.study_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Notes are viewable by everyone" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Users can create their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for annotations
CREATE POLICY "Annotations are viewable by everyone" ON public.annotations FOR SELECT USING (true);
CREATE POLICY "Users can create annotations" ON public.annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own annotations" ON public.annotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own annotations" ON public.annotations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study sessions
CREATE POLICY "Sessions are viewable by everyone" ON public.study_sessions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their sessions" ON public.study_sessions FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for session participants
CREATE POLICY "Participants viewable by everyone" ON public.session_participants FOR SELECT USING (true);
CREATE POLICY "Users can join sessions" ON public.session_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave sessions" ON public.session_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat messages
CREATE POLICY "Chat messages viewable by session participants" ON public.chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.session_participants 
      WHERE session_id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );
CREATE POLICY "Session participants can send messages" ON public.chat_messages 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.session_participants 
      WHERE session_id = chat_messages.session_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON public.annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE public.annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create storage bucket for notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', true);

-- Storage policies for notes bucket
CREATE POLICY "Anyone can view notes" ON storage.objects FOR SELECT USING (bucket_id = 'notes');
CREATE POLICY "Authenticated users can upload notes" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'notes' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own notes" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own notes" ON storage.objects 
  FOR DELETE USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);