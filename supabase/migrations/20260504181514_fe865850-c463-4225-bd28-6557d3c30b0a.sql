
-- ---------- mentor_profiles ----------
CREATE TABLE public.mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT,
  bio TEXT,
  expertise TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{English}',
  price_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_per_hour >= 0),
  rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INT NOT NULL DEFAULT 0,
  sessions_count INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  availability_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mentor_profiles_active ON public.mentor_profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_mentor_profiles_expertise ON public.mentor_profiles USING GIN(expertise);
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentor profiles viewable by everyone" ON public.mentor_profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their mentor profile" ON public.mentor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mentors can update their profile" ON public.mentor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Mentors can delete their profile" ON public.mentor_profiles FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_mentor_profiles_updated BEFORE UPDATE ON public.mentor_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- mentor_availability ----------
CREATE TABLE public.mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booking_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_slot_order CHECK (ends_at > starts_at)
);
CREATE INDEX idx_avail_mentor_starts ON public.mentor_availability(mentor_id, starts_at);
CREATE INDEX idx_avail_open ON public.mentor_availability(mentor_id) WHERE is_booked = false;
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Availability viewable by everyone" ON public.mentor_availability FOR SELECT USING (true);
CREATE POLICY "Mentors manage their availability" ON public.mentor_availability FOR ALL
  USING (EXISTS (SELECT 1 FROM public.mentor_profiles mp WHERE mp.id = mentor_id AND mp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mentor_profiles mp WHERE mp.id = mentor_id AND mp.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_availability_future()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.starts_at <= now() THEN
    RAISE EXCEPTION 'Slot must start in the future';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_avail_future BEFORE INSERT ON public.mentor_availability
FOR EACH ROW EXECUTE FUNCTION public.validate_availability_future();

-- ---------- mentor_bookings ----------
CREATE TABLE public.mentor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE RESTRICT,
  mentee_id UUID NOT NULL,
  slot_id UUID REFERENCES public.mentor_availability(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 15 AND 240),
  price_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  video_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_mentee ON public.mentor_bookings(mentee_id, scheduled_at DESC);
CREATE INDEX idx_bookings_mentor ON public.mentor_bookings(mentor_id, scheduled_at DESC);
CREATE INDEX idx_bookings_status ON public.mentor_bookings(status);
ALTER TABLE public.mentor_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentees see their bookings" ON public.mentor_bookings FOR SELECT
  USING (auth.uid() = mentee_id OR EXISTS (SELECT 1 FROM public.mentor_profiles mp WHERE mp.id = mentor_id AND mp.user_id = auth.uid()));
CREATE POLICY "Mentees can create bookings" ON public.mentor_bookings FOR INSERT
  WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Participants can update bookings" ON public.mentor_bookings FOR UPDATE
  USING (auth.uid() = mentee_id OR EXISTS (SELECT 1 FROM public.mentor_profiles mp WHERE mp.id = mentor_id AND mp.user_id = auth.uid()));
CREATE POLICY "Mentees can cancel bookings" ON public.mentor_bookings FOR DELETE
  USING (auth.uid() = mentee_id AND status IN ('pending','confirmed'));
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.mentor_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- mentor_reviews ----------
CREATE TABLE public.mentor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.mentor_bookings(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_mentor ON public.mentor_reviews(mentor_id);
ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.mentor_reviews FOR SELECT USING (true);
CREATE POLICY "Mentees can review completed bookings" ON public.mentor_reviews FOR INSERT
  WITH CHECK (auth.uid() = mentee_id AND EXISTS (
    SELECT 1 FROM public.mentor_bookings b WHERE b.id = booking_id AND b.mentee_id = auth.uid() AND b.status = 'completed'
  ));
CREATE POLICY "Mentees can edit own reviews" ON public.mentor_reviews FOR UPDATE USING (auth.uid() = mentee_id);
CREATE POLICY "Mentees can delete own reviews" ON public.mentor_reviews FOR DELETE USING (auth.uid() = mentee_id);

CREATE OR REPLACE FUNCTION public.recompute_mentor_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _mid UUID;
BEGIN
  _mid := COALESCE(NEW.mentor_id, OLD.mentor_id);
  UPDATE public.mentor_profiles SET
    rating = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.mentor_reviews WHERE mentor_id = _mid), 0),
    reviews_count = (SELECT COUNT(*) FROM public.mentor_reviews WHERE mentor_id = _mid)
  WHERE id = _mid;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_mentor_rating AFTER INSERT OR UPDATE OR DELETE ON public.mentor_reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_mentor_rating();

CREATE OR REPLACE FUNCTION public.bump_mentor_sessions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.mentor_profiles SET sessions_count = sessions_count + 1 WHERE id = NEW.mentor_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_bump_sessions AFTER UPDATE ON public.mentor_bookings
FOR EACH ROW EXECUTE FUNCTION public.bump_mentor_sessions();

CREATE OR REPLACE FUNCTION public.book_mentor_slot(
  _slot_id UUID, _duration INT DEFAULT 60, _price NUMERIC DEFAULT 0, _notes TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _booking_id UUID; _mentor_id UUID; _starts TIMESTAMPTZ; _meeting TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT mentor_id, starts_at INTO _mentor_id, _starts
  FROM public.mentor_availability WHERE id = _slot_id AND is_booked = false FOR UPDATE;
  IF _mentor_id IS NULL THEN RAISE EXCEPTION 'Slot unavailable'; END IF;
  _meeting := 'https://meet.studynexus.app/' || substr(md5(random()::text || _slot_id::text), 1, 10);
  INSERT INTO public.mentor_bookings (mentor_id, mentee_id, slot_id, scheduled_at, duration_minutes, price_paid, status, video_link, notes)
  VALUES (_mentor_id, auth.uid(), _slot_id, _starts, _duration, _price, 'confirmed', _meeting, _notes)
  RETURNING id INTO _booking_id;
  UPDATE public.mentor_availability SET is_booked = true, booking_id = _booking_id WHERE id = _slot_id;
  RETURN _booking_id;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_mentor_booking(_booking_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _slot UUID; _mentee UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT slot_id, mentee_id INTO _slot, _mentee FROM public.mentor_bookings WHERE id = _booking_id;
  IF _mentee != auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.mentor_bookings SET status = 'cancelled' WHERE id = _booking_id;
  IF _slot IS NOT NULL THEN
    UPDATE public.mentor_availability SET is_booked = false, booking_id = NULL WHERE id = _slot;
  END IF;
END $$;

-- ---------- learning_sessions ----------
CREATE TABLE public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL DEFAULT 'group' CHECK (session_type IN ('mentor','group','one_on_one','workshop')),
  topic TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 15 AND 240),
  max_participants INT NOT NULL DEFAULT 10 CHECK (max_participants > 0),
  participant_count INT NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','ended','cancelled')),
  video_link TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ls_status ON public.learning_sessions(status, scheduled_at);
CREATE INDEX idx_ls_host ON public.learning_sessions(host_id);
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions viewable by everyone" ON public.learning_sessions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can host sessions" ON public.learning_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their sessions" ON public.learning_sessions FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their sessions" ON public.learning_sessions FOR DELETE USING (auth.uid() = host_id);
CREATE TRIGGER trg_ls_updated BEFORE UPDATE ON public.learning_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.learning_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);
CREATE INDEX idx_lsp_user ON public.learning_session_participants(user_id);
ALTER TABLE public.learning_session_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants viewable by everyone" ON public.learning_session_participants FOR SELECT USING (true);
CREATE POLICY "Users can RSVP" ON public.learning_session_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel RSVP" ON public.learning_session_participants FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.rsvp_learning_session(_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _max INT; _count INT; _status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT max_participants, participant_count, status INTO _max, _count, _status
  FROM public.learning_sessions WHERE id = _session_id FOR UPDATE;
  IF _status NOT IN ('upcoming','live') THEN RAISE EXCEPTION 'Session not open'; END IF;
  IF _count >= _max THEN RAISE EXCEPTION 'Session full'; END IF;
  INSERT INTO public.learning_session_participants (session_id, user_id) VALUES (_session_id, auth.uid())
    ON CONFLICT (session_id, user_id) DO NOTHING;
  UPDATE public.learning_sessions SET participant_count = participant_count + 1 WHERE id = _session_id;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_learning_session_rsvp(_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.learning_session_participants WHERE session_id = _session_id AND user_id = auth.uid()) THEN
    DELETE FROM public.learning_session_participants WHERE session_id = _session_id AND user_id = auth.uid();
    UPDATE public.learning_sessions SET participant_count = GREATEST(participant_count - 1, 0) WHERE id = _session_id;
  END IF;
END $$;

-- ---------- AMA votes table + RPCs ----------
CREATE TABLE public.ama_question_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.ama_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);
CREATE INDEX idx_ama_votes_user ON public.ama_question_votes(user_id);
ALTER TABLE public.ama_question_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ama votes" ON public.ama_question_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.ama_question_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own vote" ON public.ama_question_votes FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.toggle_ama_question_vote(_question_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.ama_question_votes WHERE question_id = _question_id AND user_id = auth.uid()) INTO _exists;
  IF _exists THEN
    DELETE FROM public.ama_question_votes WHERE question_id = _question_id AND user_id = auth.uid();
    UPDATE public.ama_questions SET upvotes = GREATEST(COALESCE(upvotes,0) - 1, 0) WHERE id = _question_id;
    RETURN jsonb_build_object('action','removed');
  ELSE
    INSERT INTO public.ama_question_votes (question_id, user_id) VALUES (_question_id, auth.uid());
    UPDATE public.ama_questions SET upvotes = COALESCE(upvotes,0) + 1 WHERE id = _question_id;
    RETURN jsonb_build_object('action','added');
  END IF;
END $$;

ALTER TABLE public.ama_participants ADD CONSTRAINT uq_ama_participants UNIQUE (session_id, user_id);

CREATE OR REPLACE FUNCTION public.join_ama_session(_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _max INT; _count INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT max_participants, participant_count INTO _max, _count
  FROM public.ama_sessions WHERE id = _session_id FOR UPDATE;
  IF _count >= _max THEN RAISE EXCEPTION 'AMA full'; END IF;
  INSERT INTO public.ama_participants (session_id, user_id) VALUES (_session_id, auth.uid())
    ON CONFLICT DO NOTHING;
  UPDATE public.ama_sessions SET participant_count = participant_count + 1 WHERE id = _session_id;
END $$;

CREATE OR REPLACE FUNCTION public.leave_ama_session(_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.ama_participants WHERE session_id = _session_id AND user_id = auth.uid()) THEN
    DELETE FROM public.ama_participants WHERE session_id = _session_id AND user_id = auth.uid();
    UPDATE public.ama_sessions SET participant_count = GREATEST(participant_count - 1, 0) WHERE id = _session_id;
  END IF;
END $$;

-- Realtime publication (only for new tables)
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_availability;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_session_participants;

ALTER TABLE public.mentor_bookings REPLICA IDENTITY FULL;
ALTER TABLE public.mentor_availability REPLICA IDENTITY FULL;
ALTER TABLE public.learning_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.learning_session_participants REPLICA IDENTITY FULL;
