
-- ============ Q&A BOARD ============
CREATE TABLE public.qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  upvotes INT NOT NULL DEFAULT 0,
  answer_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qa_questions_created ON public.qa_questions(created_at DESC);
CREATE INDEX idx_qa_questions_category ON public.qa_questions(category);
ALTER TABLE public.qa_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_questions_select" ON public.qa_questions FOR SELECT USING (true);
CREATE POLICY "qa_questions_insert" ON public.qa_questions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "qa_questions_update_own" ON public.qa_questions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "qa_questions_delete_own" ON public.qa_questions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.qa_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  upvotes INT NOT NULL DEFAULT 0,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qa_answers_question ON public.qa_answers(question_id);
ALTER TABLE public.qa_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_answers_select" ON public.qa_answers FOR SELECT USING (true);
CREATE POLICY "qa_answers_insert" ON public.qa_answers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "qa_answers_update_own" ON public.qa_answers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "qa_answers_delete_own" ON public.qa_answers FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.qa_question_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);
ALTER TABLE public.qa_question_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_qvotes_select" ON public.qa_question_votes FOR SELECT USING (true);
CREATE POLICY "qa_qvotes_insert" ON public.qa_question_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "qa_qvotes_delete" ON public.qa_question_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.qa_answer_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(answer_id, user_id)
);
ALTER TABLE public.qa_answer_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_avotes_select" ON public.qa_answer_votes FOR SELECT USING (true);
CREATE POLICY "qa_avotes_insert" ON public.qa_answer_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "qa_avotes_delete" ON public.qa_answer_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.toggle_qa_question_vote(_question_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM qa_question_votes WHERE question_id=_question_id AND user_id=auth.uid()) INTO _exists;
  IF _exists THEN
    DELETE FROM qa_question_votes WHERE question_id=_question_id AND user_id=auth.uid();
    UPDATE qa_questions SET upvotes = GREATEST(upvotes-1,0) WHERE id=_question_id;
    RETURN jsonb_build_object('action','removed');
  ELSE
    INSERT INTO qa_question_votes(question_id,user_id) VALUES(_question_id,auth.uid());
    UPDATE qa_questions SET upvotes = upvotes+1 WHERE id=_question_id;
    RETURN jsonb_build_object('action','added');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.toggle_qa_answer_vote(_answer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM qa_answer_votes WHERE answer_id=_answer_id AND user_id=auth.uid()) INTO _exists;
  IF _exists THEN
    DELETE FROM qa_answer_votes WHERE answer_id=_answer_id AND user_id=auth.uid();
    UPDATE qa_answers SET upvotes = GREATEST(upvotes-1,0) WHERE id=_answer_id;
    RETURN jsonb_build_object('action','removed');
  ELSE
    INSERT INTO qa_answer_votes(answer_id,user_id) VALUES(_answer_id,auth.uid());
    UPDATE qa_answers SET upvotes = upvotes+1 WHERE id=_answer_id;
    RETURN jsonb_build_object('action','added');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.bump_qa_answer_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE qa_questions SET answer_count=answer_count+1 WHERE id=NEW.question_id;
  ELSIF TG_OP='DELETE' THEN UPDATE qa_questions SET answer_count=GREATEST(answer_count-1,0) WHERE id=OLD.question_id;
  END IF;
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER trg_qa_answer_count AFTER INSERT OR DELETE ON public.qa_answers
  FOR EACH ROW EXECUTE FUNCTION public.bump_qa_answer_count();

CREATE OR REPLACE FUNCTION public.increment_qa_question_views(_question_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE qa_questions SET view_count=view_count+1 WHERE id=_question_id;
$$;

-- ============ FORUM ============
CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  reply_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_forum_threads_activity ON public.forum_threads(last_activity_at DESC);
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_threads_select" ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "forum_threads_insert" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_threads_update_own" ON public.forum_threads FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "forum_threads_delete_own" ON public.forum_threads FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  parent_id UUID,
  like_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_forum_replies_thread ON public.forum_replies(thread_id, created_at);
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_replies_select" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "forum_replies_insert" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_replies_update_own" ON public.forum_replies FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "forum_replies_delete_own" ON public.forum_replies FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.forum_thread_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);
ALTER TABLE public.forum_thread_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_tlikes_select" ON public.forum_thread_likes FOR SELECT USING (true);
CREATE POLICY "forum_tlikes_insert" ON public.forum_thread_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_tlikes_delete" ON public.forum_thread_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.toggle_forum_thread_like(_thread_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM forum_thread_likes WHERE thread_id=_thread_id AND user_id=auth.uid()) INTO _exists;
  IF _exists THEN
    DELETE FROM forum_thread_likes WHERE thread_id=_thread_id AND user_id=auth.uid();
    UPDATE forum_threads SET like_count=GREATEST(like_count-1,0) WHERE id=_thread_id;
    RETURN jsonb_build_object('action','removed');
  ELSE
    INSERT INTO forum_thread_likes(thread_id,user_id) VALUES(_thread_id,auth.uid());
    UPDATE forum_threads SET like_count=like_count+1 WHERE id=_thread_id;
    RETURN jsonb_build_object('action','added');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.bump_forum_reply_meta()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    UPDATE forum_threads SET reply_count=reply_count+1, last_activity_at=now() WHERE id=NEW.thread_id;
  ELSIF TG_OP='DELETE' THEN
    UPDATE forum_threads SET reply_count=GREATEST(reply_count-1,0) WHERE id=OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER trg_forum_reply_meta AFTER INSERT OR DELETE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.bump_forum_reply_meta();

CREATE OR REPLACE FUNCTION public.increment_forum_thread_views(_thread_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE forum_threads SET view_count=view_count+1 WHERE id=_thread_id;
$$;

-- ============ COMMUNITY ============
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_posts_select" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "community_posts_insert" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "community_posts_update_own" ON public.community_posts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "community_posts_delete_own" ON public.community_posts FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_comments_post ON public.community_post_comments(post_id, created_at);
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_comments_select" ON public.community_post_comments FOR SELECT USING (true);
CREATE POLICY "community_comments_insert" ON public.community_post_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "community_comments_delete_own" ON public.community_post_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_likes_select" ON public.community_post_likes FOR SELECT USING (true);
CREATE POLICY "community_likes_insert" ON public.community_post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "community_likes_delete" ON public.community_post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.toggle_community_post_like(_post_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT EXISTS(SELECT 1 FROM community_post_likes WHERE post_id=_post_id AND user_id=auth.uid()) INTO _exists;
  IF _exists THEN
    DELETE FROM community_post_likes WHERE post_id=_post_id AND user_id=auth.uid();
    UPDATE community_posts SET like_count=GREATEST(like_count-1,0) WHERE id=_post_id;
    RETURN jsonb_build_object('action','removed');
  ELSE
    INSERT INTO community_post_likes(post_id,user_id) VALUES(_post_id,auth.uid());
    UPDATE community_posts SET like_count=like_count+1 WHERE id=_post_id;
    RETURN jsonb_build_object('action','added');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.bump_community_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE community_posts SET comment_count=comment_count+1 WHERE id=NEW.post_id;
  ELSIF TG_OP='DELETE' THEN UPDATE community_posts SET comment_count=GREATEST(comment_count-1,0) WHERE id=OLD.post_id;
  END IF;
  RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER trg_community_comment_count AFTER INSERT OR DELETE ON public.community_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.bump_community_comment_count();

-- updated_at triggers
CREATE TRIGGER trg_qa_questions_updated BEFORE UPDATE ON public.qa_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_qa_answers_updated BEFORE UPDATE ON public.qa_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_forum_threads_updated BEFORE UPDATE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_forum_replies_updated BEFORE UPDATE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_community_posts_updated BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.qa_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.qa_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_comments;
