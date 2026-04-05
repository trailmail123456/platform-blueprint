import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface IdeaRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string | null;
  upvotes: number | null;
  tags: string[] | null;
  created_at: string;
  user_id: string;
  team_id: string | null;
  is_public: boolean | null;
}

interface IdeaWithProfile extends IdeaRow {
  profile?: { username: string | null; avatar_url: string | null };
}

export const useIdeas = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<IdeaWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles for all idea authors
      const userIds = [...new Set(data.map(i => i.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const enriched: IdeaWithProfile[] = data.map(idea => ({
        ...idea,
        profile: profiles?.find(p => p.id === idea.user_id) || undefined,
      }));
      setIdeas(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeas();

    // Real-time subscription
    const channel = supabase
      .channel("ideas-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ideas",
      }, async (payload) => {
        const newIdea = payload.new as IdeaRow;
        if (!newIdea.is_public) return;
        // Fetch profile for new idea
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", newIdea.user_id)
          .single();
        setIdeas(prev => [{ ...newIdea, profile: profile || undefined }, ...prev]);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "ideas",
      }, (payload) => {
        setIdeas(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } : i));
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "ideas",
      }, (payload) => {
        setIdeas(prev => prev.filter(i => i.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchIdeas]);

  const upvoteIdea = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const newVotes = (idea.upvotes || 0) + 1;
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, upvotes: newVotes } : i));
    await supabase.rpc("increment_idea_upvotes", { _idea_id: ideaId });
  };

  return { ideas, loading, refetch: fetchIdeas, upvoteIdea };
};
