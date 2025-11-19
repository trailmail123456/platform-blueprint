-- Add collections table for organizing notes
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add collection_notes junction table
CREATE TABLE public.collection_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, note_id)
);

-- Enable RLS
ALTER TABLE public.collection_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collection_notes
CREATE POLICY "Users can view their collection notes" 
ON public.collection_notes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = collection_notes.collection_id 
  AND collections.user_id = auth.uid()
));

CREATE POLICY "Users can add notes to their collections" 
ON public.collection_notes 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = collection_notes.collection_id 
  AND collections.user_id = auth.uid()
));

CREATE POLICY "Users can remove notes from their collections" 
ON public.collection_notes 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE collections.id = collection_notes.collection_id 
  AND collections.user_id = auth.uid()
));

-- Add analytics fields to notes
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS study_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- Create AI-generated content table
CREATE TABLE public.note_ai_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  summary TEXT,
  quiz_data JSONB,
  flashcards JSONB,
  related_notes UUID[],
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id)
);

-- Enable RLS
ALTER TABLE public.note_ai_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for note_ai_content
CREATE POLICY "AI content is viewable by everyone" 
ON public.note_ai_content 
FOR SELECT 
USING (true);

CREATE POLICY "System can create AI content" 
ON public.note_ai_content 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update AI content" 
ON public.note_ai_content 
FOR UPDATE 
USING (true);

-- Add trigger for collections updated_at
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();