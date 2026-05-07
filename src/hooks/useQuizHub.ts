import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync, SyncStatus } from "./useRealtimeSync";

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  duration_minutes: number;
  attempts_count: number;
  question_count: number;
  is_public: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  position: number;
}

export const useQuizzes = (): { quizzes: Quiz[]; loading: boolean; status: SyncStatus; refetch: () => Promise<void> } => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    setQuizzes((data || []) as Quiz[]);
    setLoading(false);
  }, []);

  const status = useRealtimeSync({
    channelName: "quizzes-public",
    filters: [{ table: "quizzes" }],
    onChange: fetchAll,
  });

  return { quizzes, loading, status, refetch: fetchAll };
};

export const fetchQuizQuestions = async (quizId: string): Promise<QuizQuestion[]> => {
  const { data } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });
  return ((data || []) as any[]).map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] }));
};

export const createQuiz = async (input: {
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  questions: { question: string; options: string[]; correct_index: number; explanation?: string }[];
}) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      user_id: user.user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      duration_minutes: input.duration_minutes,
    })
    .select()
    .single();
  if (error) throw error;
  if (input.questions.length) {
    const rows = input.questions.map((q, i) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
      position: i,
    }));
    await supabase.from("quiz_questions").insert(rows);
  }
  return quiz;
};

export const recordAttempt = async (quizId: string, score: number, total: number, timeSeconds: number, answers: number[]) => {
  const { data, error } = await supabase.rpc("record_quiz_attempt", {
    _quiz_id: quizId,
    _score: score,
    _total: total,
    _time_seconds: timeSeconds,
    _answers: answers as any,
  });
  if (error) throw error;
  return data;
};
