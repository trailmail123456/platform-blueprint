import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export interface LearningSessionRow {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  session_type: string;
  topic: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number;
  participant_count: number;
  price: number;
  status: string;
  video_link: string | null;
  recording_url: string | null;
  host_profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
  is_rsvped?: boolean;
}

export const useLearningSessions = (currentUserId: string | null | undefined) => {
  const [sessions, setSessions] = useState<LearningSessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("learning_sessions")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (!data) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const hostIds = [...new Set(data.map((s: any) => s.host_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", hostIds);

    let myRsvps: string[] = [];
    if (currentUserId) {
      const { data: rsvps } = await supabase
        .from("learning_session_participants")
        .select("session_id")
        .eq("user_id", currentUserId);
      myRsvps = rsvps?.map((r: any) => r.session_id) || [];
    }

    setSessions(
      data.map((s: any) => ({
        ...s,
        host_profile: profiles?.find((p: any) => p.id === s.host_id) || undefined,
        is_rsvped: myRsvps.includes(s.id),
      })) as LearningSessionRow[]
    );
    setLoading(false);
  }, [currentUserId]);

  useRealtimeSync({
    channelName: "learning-sessions-public",
    filters: [{ table: "learning_sessions" }, { table: "learning_session_participants" }],
    onChange: fetchSessions,
    pollIntervalMs: 30000,
  });

  const rsvp = async (sessionId: string) => {
    const { error } = await supabase.rpc("rsvp_learning_session", { _session_id: sessionId });
    if (!error) await fetchSessions();
    return error;
  };

  const cancelRsvp = async (sessionId: string) => {
    const { error } = await supabase.rpc("cancel_learning_session_rsvp", { _session_id: sessionId });
    if (!error) await fetchSessions();
    return error;
  };

  return { sessions, loading, refetch: fetchSessions, rsvp, cancelRsvp };
};
