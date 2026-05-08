import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "./useRealtimeSync";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface EventRow {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  type: string;
  mode: string;
  venue: string | null;
  starts_at: string;
  ends_at: string | null;
  registration_deadline: string | null;
  capacity: number;
  registration_count: number;
  prize: string | null;
  tags: string[];
  banner_url: string | null;
  featured: boolean;
  status: string;
}

export const useEvents = (typeFilter: string = "all") => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    let q = supabase.from("events").select("*").eq("status", "published").order("starts_at", { ascending: true });
    if (typeFilter !== "all") q = q.eq("type", typeFilter);
    const { data, error } = await q;
    if (!error && data) setEvents(data as EventRow[]);
    if (user) {
      const { data: regs } = await supabase.from("event_registrations").select("event_id").eq("user_id", user.id);
      if (regs) setMyRegistrations(new Set(regs.map((r: any) => r.event_id)));
    } else {
      setMyRegistrations(new Set());
    }
    setLoading(false);
  }, [typeFilter, user]);

  const status = useRealtimeSync({
    channelName: `events-${typeFilter}`,
    filters: [{ table: "events" }, { table: "event_registrations" }],
    onChange: fetchAll,
  });

  const register = async (eventId: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const { error } = await supabase.rpc("register_for_event", { _event_id: eventId });
    if (error) toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    else toast({ title: "Registered!" });
  };

  const cancel = async (eventId: string) => {
    if (!user) return;
    const { error } = await supabase.rpc("cancel_event_registration", { _event_id: eventId });
    if (error) toast({ title: "Cancel failed", description: error.message, variant: "destructive" });
    else toast({ title: "Registration cancelled" });
  };

  const createEvent = async (payload: Partial<EventRow>) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const { error } = await supabase.from("events").insert({
      organizer_id: user.id,
      title: payload.title!,
      description: payload.description || "",
      type: payload.type || "workshop",
      mode: payload.mode || "online",
      venue: payload.venue || null,
      starts_at: payload.starts_at!,
      ends_at: payload.ends_at || null,
      registration_deadline: payload.registration_deadline || null,
      capacity: payload.capacity || 100,
      prize: payload.prize || null,
      tags: payload.tags || [],
      featured: false,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Event created" });
  };

  return { events, myRegistrations, loading, status, register, cancel, createEvent, refetch: fetchAll };
};
