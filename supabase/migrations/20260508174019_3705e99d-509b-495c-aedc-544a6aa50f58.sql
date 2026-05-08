
-- ============= EVENTS =============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'workshop',
  mode TEXT NOT NULL DEFAULT 'online',
  venue TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  capacity INT NOT NULL DEFAULT 100,
  registration_count INT NOT NULL DEFAULT 0,
  prize TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  banner_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON public.events FOR SELECT USING (status = 'published' OR organizer_id = auth.uid());
CREATE POLICY "Authenticated can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizer can update own events" ON public.events FOR UPDATE USING (organizer_id = auth.uid());
CREATE POLICY "Organizer can delete own events" ON public.events FOR DELETE USING (organizer_id = auth.uid());
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own registrations" ON public.event_registrations FOR SELECT USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid()));
CREATE POLICY "Users register themselves" ON public.event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users cancel own registration" ON public.event_registrations FOR DELETE USING (user_id = auth.uid());

-- ============= STUDY GROUPS =============
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  privacy TEXT NOT NULL DEFAULT 'public',
  category TEXT,
  member_limit INT NOT NULL DEFAULT 50,
  member_count INT NOT NULL DEFAULT 1,
  active_room_count INT NOT NULL DEFAULT 0,
  banner_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_study_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.study_group_members WHERE group_id = _group_id AND user_id = _user_id);
$$;

CREATE POLICY "Public groups viewable by all" ON public.study_groups FOR SELECT USING (privacy = 'public' OR owner_id = auth.uid() OR public.is_study_group_member(id, auth.uid()));
CREATE POLICY "Authenticated can create groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update group" ON public.study_groups FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owner can delete group" ON public.study_groups FOR DELETE USING (owner_id = auth.uid());
CREATE TRIGGER trg_study_groups_updated BEFORE UPDATE ON public.study_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members visible to group viewers" ON public.study_group_members FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.study_groups g WHERE g.id = group_id AND (g.privacy = 'public' OR g.owner_id = auth.uid() OR public.is_study_group_member(g.id, auth.uid())))
);
CREATE POLICY "Users can join (handled via RPC)" ON public.study_group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave" ON public.study_group_members FOR DELETE USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.study_groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));

CREATE TABLE public.study_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read messages" ON public.study_group_messages FOR SELECT USING (public.is_study_group_member(group_id, auth.uid()));
CREATE POLICY "Members can post messages" ON public.study_group_messages FOR INSERT WITH CHECK (user_id = auth.uid() AND public.is_study_group_member(group_id, auth.uid()));
CREATE POLICY "Authors can delete own messages" ON public.study_group_messages FOR DELETE USING (user_id = auth.uid());

CREATE TABLE public.study_group_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  meeting_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_group_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view rooms" ON public.study_group_rooms FOR SELECT USING (public.is_study_group_member(group_id, auth.uid()) OR EXISTS(SELECT 1 FROM public.study_groups g WHERE g.id = group_id AND g.privacy = 'public'));
CREATE POLICY "Members can create rooms" ON public.study_group_rooms FOR INSERT WITH CHECK (created_by = auth.uid() AND public.is_study_group_member(group_id, auth.uid()));
CREATE POLICY "Creator can update room" ON public.study_group_rooms FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Creator or owner can delete room" ON public.study_group_rooms FOR DELETE USING (created_by = auth.uid() OR EXISTS(SELECT 1 FROM public.study_groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));

-- ============= VIRTUAL CLASSROOM =============
CREATE TABLE public.virtual_classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  description TEXT NOT NULL DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  max_participants INT NOT NULL DEFAULT 50,
  participant_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  meeting_link TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.virtual_classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classrooms viewable by all" ON public.virtual_classrooms FOR SELECT USING (true);
CREATE POLICY "Authenticated can host" ON public.virtual_classrooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update" ON public.virtual_classrooms FOR UPDATE USING (host_id = auth.uid());
CREATE POLICY "Host can delete" ON public.virtual_classrooms FOR DELETE USING (host_id = auth.uid());
CREATE TRIGGER trg_vc_updated BEFORE UPDATE ON public.virtual_classrooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.virtual_classroom_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.virtual_classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, user_id)
);
ALTER TABLE public.virtual_classroom_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants viewable by all" ON public.virtual_classroom_participants FOR SELECT USING (true);
CREATE POLICY "Users can join" ON public.virtual_classroom_participants FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave" ON public.virtual_classroom_participants FOR DELETE USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.virtual_classrooms v WHERE v.id = classroom_id AND v.host_id = auth.uid()));

-- ============= ATOMIC RPCs =============
CREATE OR REPLACE FUNCTION public.register_for_event(_event_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cap INT; _cnt INT; _dl TIMESTAMPTZ; _id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT capacity, registration_count, registration_deadline INTO _cap, _cnt, _dl
    FROM events WHERE id = _event_id FOR UPDATE;
  IF _cap IS NULL THEN RAISE EXCEPTION 'Event not found'; END IF;
  IF _dl IS NOT NULL AND _dl < now() THEN RAISE EXCEPTION 'Registration closed'; END IF;
  IF _cnt >= _cap THEN RAISE EXCEPTION 'Event full'; END IF;
  INSERT INTO event_registrations(event_id, user_id) VALUES (_event_id, auth.uid())
    ON CONFLICT (event_id, user_id) DO NOTHING RETURNING id INTO _id;
  IF _id IS NOT NULL THEN
    UPDATE events SET registration_count = registration_count + 1 WHERE id = _event_id;
  END IF;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_event_registration(_event_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS(SELECT 1 FROM event_registrations WHERE event_id = _event_id AND user_id = auth.uid()) THEN
    DELETE FROM event_registrations WHERE event_id = _event_id AND user_id = auth.uid();
    UPDATE events SET registration_count = GREATEST(registration_count - 1, 0) WHERE id = _event_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.join_study_group(_group_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lim INT; _cnt INT; _priv TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT member_limit, member_count, privacy INTO _lim, _cnt, _priv
    FROM study_groups WHERE id = _group_id FOR UPDATE;
  IF _lim IS NULL THEN RAISE EXCEPTION 'Group not found'; END IF;
  IF _priv = 'private' THEN RAISE EXCEPTION 'Private group requires invite'; END IF;
  IF _cnt >= _lim THEN RAISE EXCEPTION 'Group full'; END IF;
  IF NOT EXISTS(SELECT 1 FROM study_group_members WHERE group_id = _group_id AND user_id = auth.uid()) THEN
    INSERT INTO study_group_members(group_id, user_id, role) VALUES (_group_id, auth.uid(), 'member');
    UPDATE study_groups SET member_count = member_count + 1 WHERE id = _group_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.leave_study_group(_group_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS(SELECT 1 FROM study_group_members WHERE group_id = _group_id AND user_id = auth.uid()) THEN
    DELETE FROM study_group_members WHERE group_id = _group_id AND user_id = auth.uid();
    UPDATE study_groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = _group_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.join_virtual_classroom(_classroom_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _max INT; _cnt INT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT max_participants, participant_count INTO _max, _cnt
    FROM virtual_classrooms WHERE id = _classroom_id FOR UPDATE;
  IF _max IS NULL THEN RAISE EXCEPTION 'Classroom not found'; END IF;
  IF _cnt >= _max THEN RAISE EXCEPTION 'Classroom full'; END IF;
  IF NOT EXISTS(SELECT 1 FROM virtual_classroom_participants WHERE classroom_id = _classroom_id AND user_id = auth.uid()) THEN
    INSERT INTO virtual_classroom_participants(classroom_id, user_id) VALUES (_classroom_id, auth.uid());
    UPDATE virtual_classrooms SET participant_count = participant_count + 1 WHERE id = _classroom_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.leave_virtual_classroom(_classroom_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS(SELECT 1 FROM virtual_classroom_participants WHERE classroom_id = _classroom_id AND user_id = auth.uid()) THEN
    DELETE FROM virtual_classroom_participants WHERE classroom_id = _classroom_id AND user_id = auth.uid();
    UPDATE virtual_classrooms SET participant_count = GREATEST(participant_count - 1, 0) WHERE id = _classroom_id;
  END IF;
END $$;

-- Active room counter
CREATE OR REPLACE FUNCTION public.bump_group_room_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active THEN
    UPDATE study_groups SET active_room_count = active_room_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active THEN
    UPDATE study_groups SET active_room_count = GREATEST(active_room_count - 1, 0) WHERE id = OLD.group_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active <> OLD.is_active THEN
    IF NEW.is_active THEN
      UPDATE study_groups SET active_room_count = active_room_count + 1 WHERE id = NEW.group_id;
    ELSE
      UPDATE study_groups SET active_room_count = GREATEST(active_room_count - 1, 0) WHERE id = NEW.group_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_group_room_count AFTER INSERT OR UPDATE OR DELETE ON public.study_group_rooms FOR EACH ROW EXECUTE FUNCTION public.bump_group_room_count();

-- Owner auto-membership
CREATE OR REPLACE FUNCTION public.add_group_owner_as_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO study_group_members(group_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_group_owner_member AFTER INSERT ON public.study_groups FOR EACH ROW EXECUTE FUNCTION public.add_group_owner_as_member();

-- Realtime
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.event_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.study_groups REPLICA IDENTITY FULL;
ALTER TABLE public.study_group_members REPLICA IDENTITY FULL;
ALTER TABLE public.study_group_messages REPLICA IDENTITY FULL;
ALTER TABLE public.study_group_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.virtual_classrooms REPLICA IDENTITY FULL;
ALTER TABLE public.virtual_classroom_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classrooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_classroom_participants;

-- Indexes
CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_event_reg_user ON public.event_registrations(user_id);
CREATE INDEX idx_sg_messages_group ON public.study_group_messages(group_id, created_at DESC);
CREATE INDEX idx_sg_members_user ON public.study_group_members(user_id);
CREATE INDEX idx_vc_scheduled ON public.virtual_classrooms(scheduled_at);
