import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "./useRealtimeSync";
import { toast } from "sonner";

export interface QAQuestion {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  upvotes: number;
  answer_count: number;
  view_count: number;
  is_resolved: boolean;
  is_pinned: boolean;
  created_at: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export interface QAAnswer {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

export function useQuestions(category?: string) {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    let q = supabase.from("qa_questions").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(100);
    if (category && category !== "All") q = q.eq("category", category);
    const { data, error } = await q;
    if (error) { setLoading(false); return; }
    const ids = [...new Set((data || []).map((d: any) => d.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id,username,full_name,avatar_url").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profiles || []).map((p: any) => [p.id, p]));
    setQuestions((data || []).map((d: any) => ({ ...d, author: map.get(d.user_id) || null })));
    setLoading(false);
  }, [category]);

  const status = useRealtimeSync({
    channelName: `qa-questions-${category || "all"}`,
    filters: [
      { table: "qa_questions", event: "*" },
      { table: "qa_answers", event: "*" },
    ],
    onChange: fetchQuestions,
  });

  return { questions, loading, status, refetch: fetchQuestions };
}

export async function createQuestion(input: { title: string; body: string; category: string; tags: string[] }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Please sign in"); return null; }
  const { data, error } = await supabase.from("qa_questions").insert({ ...input, user_id: user.id }).select().single();
  if (error) { toast.error(error.message); return null; }
  toast.success("Question posted");
  return data;
}

export async function toggleQuestionVote(questionId: string) {
  const { error } = await supabase.rpc("toggle_qa_question_vote", { _question_id: questionId });
  if (error) toast.error(error.message);
}

export async function incrementQuestionViews(questionId: string) {
  await supabase.rpc("increment_qa_question_views", { _question_id: questionId });
}

export function useAnswers(questionId: string | null) {
  const [answers, setAnswers] = useState<QAAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnswers = useCallback(async () => {
    if (!questionId) { setAnswers([]); setLoading(false); return; }
    const { data } = await supabase.from("qa_answers").select("*").eq("question_id", questionId).order("is_accepted", { ascending: false }).order("upvotes", { ascending: false });
    const ids = [...new Set((data || []).map((d: any) => d.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id,username,full_name,avatar_url").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profiles || []).map((p: any) => [p.id, p]));
    setAnswers((data || []).map((d: any) => ({ ...d, author: map.get(d.user_id) || null })));
    setLoading(false);
  }, [questionId]);

  const status = useRealtimeSync({
    channelName: questionId ? `qa-answers-${questionId}` : "qa-answers-none",
    filters: questionId ? [{ table: "qa_answers", filter: `question_id=eq.${questionId}`, event: "*" }] : [],
    onChange: fetchAnswers,
    enabled: !!questionId,
  });

  return { answers, loading, status, refetch: fetchAnswers };
}

export async function postAnswer(questionId: string, body: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Please sign in"); return null; }
  if (!body.trim()) { toast.error("Answer cannot be empty"); return null; }
  const { data, error } = await supabase.from("qa_answers").insert({ question_id: questionId, user_id: user.id, body: body.trim() }).select().single();
  if (error) { toast.error(error.message); return null; }
  toast.success("Answer posted");
  return data;
}

export async function toggleAnswerVote(answerId: string) {
  const { error } = await supabase.rpc("toggle_qa_answer_vote", { _answer_id: answerId });
  if (error) toast.error(error.message);
}
