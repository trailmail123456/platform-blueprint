import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export interface MentorRow {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  bio: string | null;
  expertise: string[];
  languages: string[];
  price_per_hour: number;
  rating: number;
  reviews_count: number;
  sessions_count: number;
  verified: boolean;
  availability_text: string | null;
  is_active: boolean;
  profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
}

export interface AvailabilitySlot {
  id: string;
  mentor_id: string;
  starts_at: string;
  ends_at: string;
  is_booked: boolean;
}

export const useMentors = () => {
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentors = useCallback(async () => {
    const { data, error } = await supabase
      .from("mentor_profiles")
      .select("*")
      .eq("is_active", true)
      .order("rating", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map((m: any) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);

    setMentors(
      data.map((m: any) => ({
        ...m,
        profile: profiles?.find((p: any) => p.id === m.user_id) || undefined,
      })) as MentorRow[]
    );
    setLoading(false);
  }, []);

  useRealtimeSync({
    channelName: "mentors-public",
    filters: [{ table: "mentor_profiles" }, { table: "mentor_reviews" }],
    onChange: fetchMentors,
    pollIntervalMs: 60000,
  });

  return { mentors, loading, refetch: fetchMentors };
};

export const useMentorAvailability = (mentorId: string | null) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!mentorId) return setSlots([]);
    setLoading(true);
    const { data } = await supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", mentorId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    setSlots((data || []) as AvailabilitySlot[]);
    setLoading(false);
  }, [mentorId]);

  useRealtimeSync({
    channelName: mentorId ? `mentor-slots-${mentorId}` : undefined,
    enabled: !!mentorId,
    filters: mentorId ? [{ table: "mentor_availability", filter: `mentor_id=eq.${mentorId}` }] : [],
    onChange: fetchSlots,
    pollIntervalMs: 30000,
  });

  return { slots, loading, refetch: fetchSlots };
};
