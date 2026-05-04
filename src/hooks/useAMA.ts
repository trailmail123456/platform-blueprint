import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export interface AMASessionRow {
  id: string;
  mentor_id: string;
  title: string;
  description: string | null;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  max_participants: number;
  participant_count: number;
  is_active: boolean;
  mentor_profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
  mentor_meta?: { title: string; company: string | null };
}

export interface AMAQuestionRow {
  id: string;
  session_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  upvotes: number;
  is_answered: boolean;
  is_pinned: boolean;
  created_at: string;
  user_profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
  has_voted?: boolean;
}

export const useAMASessions = () => {
  const [sessions, setSessions] = useState<AMASessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("ama_sessions")
      .select("*")
      .eq("is_active", true)
      .order("scheduled_at", { ascending: true });

    if (!data) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const mentorUserIds = [...new Set(data.map((s: any) => s.mentor_id))];
    const [{ data: profiles }, { data: mentorMeta }] = await Promise.all([
      supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", mentorUserIds),
      supabase.from("mentor_profiles").select("user_id, title, company").in("user_id", mentorUserIds),
    ]);

    setSessions(
      data.map((s: any) => ({
        ...s,
        mentor_profile: profiles?.find((p: any) => p.id === s.mentor_id) || undefined,
        mentor_meta: mentorMeta?.find((m: any) => m.user_id === s.mentor_id) || undefined,
      })) as AMASessionRow[]
    );
    setLoading(false);
  }, []);

  useRealtimeSync({
    channelName: "ama-sessions-public",
    filters: [{ table: "ama_sessions" }],
    onChange: fetchSessions,
    pollIntervalMs: 30000,
  });

  return { sessions, loading, refetch: fetchSessions };
};

export const useAMAQuestions = (sessionId: string | null, currentUserId: string | null | undefined) => {
  const [questions, setQuestions] = useState<AMAQuestionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    if (!sessionId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("ama_questions")
      .select("*")
      .eq("session_id", sessionId)
      .order("upvotes", { ascending: false });

    if (!data) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map((q: any) => q.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);

    let myVotes: string[] = [];
    if (currentUserId) {
      const { data: votes } = await supabase
        .from("ama_question_votes")
        .select("question_id")
        .eq("user_id", currentUserId)
        .in("question_id", data.map((q: any) => q.id));
      myVotes = votes?.map((v: any) => v.question_id) || [];
    }

    setQuestions(
      data.map((q: any) => ({
        ...q,
        user_profile: profiles?.find((p: any) => p.id === q.user_id) || undefined,
        has_voted: myVotes.includes(q.id),
      })) as AMAQuestionRow[]
    );
    setLoading(false);
  }, [sessionId, currentUserId]);

  useRealtimeSync({
    channelName: sessionId ? `ama-q-${sessionId}` : undefined,
    enabled: !!sessionId,
    filters: sessionId
      ? [
          { table: "ama_questions", filter: `session_id=eq.${sessionId}` },
          { table: "ama_question_votes" },
        ]
      : [],
    onChange: fetchQuestions,
    pollIntervalMs: 15000,
  });

  const askQuestion = async (question: string) => {
    if (!sessionId || !currentUserId) return { error: new Error("Not signed in") };
    const trimmed = question.trim();
    if (trimmed.length < 5 || trimmed.length > 500) return { error: new Error("Question must be 5–500 chars") };
    const { error } = await supabase
      .from("ama_questions")
      .insert({ session_id: sessionId, user_id: currentUserId, question: trimmed });
    if (!error) await fetchQuestions();
    return { error };
  };

  const toggleVote = async (questionId: string) => {
    const { error } = await supabase.rpc("toggle_ama_question_vote", { _question_id: questionId });
    if (!error) await fetchQuestions();
    return { error };
  };

  return { questions, loading, refetch: fetchQuestions, askQuestion, toggleVote };
};
