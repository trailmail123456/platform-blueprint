
-- Create note_bookmarks table
CREATE TABLE public.note_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, note_id)
);

-- Enable RLS
ALTER TABLE public.note_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their bookmarks" ON public.note_bookmarks
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can bookmark notes" ON public.note_bookmarks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove bookmarks" ON public.note_bookmarks
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Enable realtime for notes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_bookmarks;
