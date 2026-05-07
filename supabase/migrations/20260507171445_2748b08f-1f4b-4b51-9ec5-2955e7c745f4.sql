
-- ==========================================
-- BATCH 3: Quiz Hub, Flashcards, Roadmaps
-- ==========================================

-- QUIZZES
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  duration_minutes INT NOT NULL DEFAULT 30,
  attempts_count INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (is_public OR user_id = auth.uid());
CREATE POLICY "quizzes_insert" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "quizzes_update_own" ON public.quizzes FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "quizzes_delete_own" ON public.quizzes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INT NOT NULL DEFAULT 0,
  explanation TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qq_select" ON public.quiz_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_id AND (q.is_public OR q.user_id = auth.uid()))
);
CREATE POLICY "qq_modify_own" ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_id AND q.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_id AND q.user_id = auth.uid()));

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  user_id UUID NOT NULL,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_select_own" ON public.quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "qa_insert_own" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- FLASHCARDS
CREATE TABLE public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  is_public BOOLEAN NOT NULL DEFAULT true,
  card_count INT NOT NULL DEFAULT 0,
  study_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fd_select" ON public.flashcard_decks FOR SELECT USING (is_public OR user_id = auth.uid());
CREATE POLICY "fd_insert" ON public.flashcard_decks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "fd_update" ON public.flashcard_decks FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "fd_delete" ON public.flashcard_decks FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fc_select" ON public.flashcards FOR SELECT USING (
  EXISTS (SELECT 1 FROM flashcard_decks d WHERE d.id = deck_id AND (d.is_public OR d.user_id = auth.uid()))
);
CREATE POLICY "fc_modify_own" ON public.flashcards FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM flashcard_decks d WHERE d.id = deck_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM flashcard_decks d WHERE d.id = deck_id AND d.user_id = auth.uid()));

CREATE TABLE public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL,
  user_id UUID NOT NULL,
  ease INT NOT NULL DEFAULT 3,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (card_id, user_id)
);
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fr_select_own" ON public.flashcard_reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "fr_upsert_own" ON public.flashcard_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "fr_update_own" ON public.flashcard_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "fr_delete_own" ON public.flashcard_reviews FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ROADMAPS
CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'Beginner',
  duration TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}'::text[],
  step_count INT NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rm_select" ON public.roadmaps FOR SELECT USING (is_public OR user_id = auth.uid());
CREATE POLICY "rm_insert" ON public.roadmaps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rm_update" ON public.roadmaps FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rm_delete" ON public.roadmaps FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rs_select" ON public.roadmap_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM roadmaps r WHERE r.id = roadmap_id AND (r.is_public OR r.user_id = auth.uid()))
);
CREATE POLICY "rs_modify_own" ON public.roadmap_steps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM roadmaps r WHERE r.id = roadmap_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM roadmaps r WHERE r.id = roadmap_id AND r.user_id = auth.uid()));

CREATE TABLE public.roadmap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  roadmap_id UUID NOT NULL,
  step_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, step_id)
);
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rp_select_own" ON public.roadmap_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rp_insert_own" ON public.roadmap_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rp_update_own" ON public.roadmap_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rp_delete_own" ON public.roadmap_progress FOR DELETE TO authenticated USING (user_id = auth.uid());

-- CHEAT SHEETS
CREATE TABLE public.cheat_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  file_url TEXT,
  format TEXT NOT NULL DEFAULT 'PDF',
  pages INT NOT NULL DEFAULT 1,
  downloads INT NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cheat_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_select" ON public.cheat_sheets FOR SELECT USING (is_public OR user_id = auth.uid());
CREATE POLICY "cs_insert" ON public.cheat_sheets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cs_update_own" ON public.cheat_sheets FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "cs_delete_own" ON public.cheat_sheets FOR DELETE TO authenticated USING (user_id = auth.uid());

-- TRIGGERS for updated_at + counters
CREATE TRIGGER trg_quizzes_updated BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_decks_updated BEFORE UPDATE ON public.flashcard_decks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_roadmaps_updated BEFORE UPDATE ON public.roadmaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cs_updated BEFORE UPDATE ON public.cheat_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- counter triggers
CREATE OR REPLACE FUNCTION public.bump_quiz_question_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE quizzes SET question_count=question_count+1 WHERE id=NEW.quiz_id;
  ELSIF TG_OP='DELETE' THEN UPDATE quizzes SET question_count=GREATEST(question_count-1,0) WHERE id=OLD.quiz_id;
  END IF;
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER trg_qq_count AFTER INSERT OR DELETE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.bump_quiz_question_count();

CREATE OR REPLACE FUNCTION public.bump_deck_card_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE flashcard_decks SET card_count=card_count+1 WHERE id=NEW.deck_id;
  ELSIF TG_OP='DELETE' THEN UPDATE flashcard_decks SET card_count=GREATEST(card_count-1,0) WHERE id=OLD.deck_id;
  END IF;
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER trg_fc_count AFTER INSERT OR DELETE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.bump_deck_card_count();

CREATE OR REPLACE FUNCTION public.bump_roadmap_step_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE roadmaps SET step_count=step_count+1 WHERE id=NEW.roadmap_id;
  ELSIF TG_OP='DELETE' THEN UPDATE roadmaps SET step_count=GREATEST(step_count-1,0) WHERE id=OLD.roadmap_id;
  END IF;
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER trg_rs_count AFTER INSERT OR DELETE ON public.roadmap_steps FOR EACH ROW EXECUTE FUNCTION public.bump_roadmap_step_count();

-- ATOMIC RPCs
CREATE OR REPLACE FUNCTION public.record_quiz_attempt(_quiz_id uuid, _score int, _total int, _time_seconds int, _answers jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO quiz_attempts(quiz_id,user_id,score,total,time_taken_seconds,answers)
    VALUES(_quiz_id,auth.uid(),_score,_total,_time_seconds,_answers) RETURNING id INTO _id;
  UPDATE quizzes SET attempts_count=attempts_count+1 WHERE id=_quiz_id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.toggle_roadmap_step(_roadmap_id uuid, _step_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS(SELECT 1 FROM roadmap_progress WHERE user_id=auth.uid() AND step_id=_step_id) THEN
    DELETE FROM roadmap_progress WHERE user_id=auth.uid() AND step_id=_step_id;
    RETURN jsonb_build_object('action','removed');
  ELSE
    INSERT INTO roadmap_progress(user_id,roadmap_id,step_id) VALUES(auth.uid(),_roadmap_id,_step_id);
    RETURN jsonb_build_object('action','added');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.bump_cheatsheet_downloads(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE cheat_sheets SET downloads=downloads+1 WHERE id=_id;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flashcard_decks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flashcards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flashcard_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmaps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cheat_sheets;

CREATE INDEX idx_qq_quiz ON public.quiz_questions(quiz_id, position);
CREATE INDEX idx_qa_user ON public.quiz_attempts(user_id, completed_at DESC);
CREATE INDEX idx_fc_deck ON public.flashcards(deck_id, position);
CREATE INDEX idx_fr_user ON public.flashcard_reviews(user_id, next_review_at);
CREATE INDEX idx_rs_rm ON public.roadmap_steps(roadmap_id, position);
CREATE INDEX idx_rp_user ON public.roadmap_progress(user_id, roadmap_id);
