import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export interface BookingRow {
  id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  price_paid: number;
  status: string;
  video_link: string | null;
  notes: string | null;
  mentor?: { title: string; company: string | null; user_id: string };
  mentor_profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
}

export const useMyBookings = (userId: string | null | undefined) => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("mentor_bookings")
      .select("*")
      .eq("mentee_id", userId)
      .order("scheduled_at", { ascending: true });

    if (!data) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const mentorIds = [...new Set(data.map((b: any) => b.mentor_id))];
    const { data: mentors } = await supabase
      .from("mentor_profiles")
      .select("id, title, company, user_id")
      .in("id", mentorIds);

    const userIds = [...new Set((mentors || []).map((m: any) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);

    setBookings(
      data.map((b: any) => {
        const m = mentors?.find((x: any) => x.id === b.mentor_id);
        return {
          ...b,
          mentor: m,
          mentor_profile: m ? profiles?.find((p: any) => p.id === m.user_id) : undefined,
        };
      }) as BookingRow[]
    );
    setLoading(false);
  }, [userId]);

  useRealtimeSync({
    channelName: userId ? `my-bookings-${userId}` : undefined,
    enabled: !!userId,
    filters: userId ? [{ table: "mentor_bookings", filter: `mentee_id=eq.${userId}` }] : [],
    onChange: fetchBookings,
    pollIntervalMs: 30000,
  });

  const cancel = async (bookingId: string) => {
    const { error } = await supabase.rpc("cancel_mentor_booking", { _booking_id: bookingId });
    if (!error) await fetchBookings();
    return error;
  };

  return { bookings, loading, refetch: fetchBookings, cancel };
};
