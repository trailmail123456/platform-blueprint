import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "./useRealtimeSync";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface ClassroomRow {
  id: string;
  host_id: string;
  title: string;
  subject: string | null;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number;
  participant_count: number;
  status: string;
  meeting_link: string | null;
  recording_url: string | null;
}

export const useVirtualClassroom = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase.from("virtual_classrooms").select("*").order("scheduled_at", { ascending: true });
    if (data) setClassrooms(data as ClassroomRow[]);
    if (user) {
      const { data: p } = await supabase.from("virtual_classroom_participants").select("classroom_id").eq("user_id", user.id);
      if (p) setJoined(new Set(p.map((x: any) => x.classroom_id)));
    }
    setLoading(false);
  }, [user]);

  const status = useRealtimeSync({
    channelName: "virtual-classrooms",
    filters: [{ table: "virtual_classrooms" }, { table: "virtual_classroom_participants" }],
    onChange: fetchAll,
  });

  const join = async (id: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const { error } = await supabase.rpc("join_virtual_classroom", { _classroom_id: id });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Joined classroom" });
  };
  const leave = async (id: string) => {
    const { error } = await supabase.rpc("leave_virtual_classroom", { _classroom_id: id });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Left classroom" });
  };

  const create = async (payload: Partial<ClassroomRow>) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const meeting = `https://meet.studynexus.app/${Math.random().toString(36).slice(2, 12)}`;
    const { error } = await supabase.from("virtual_classrooms").insert({
      host_id: user.id,
      title: payload.title!,
      subject: payload.subject || null,
      description: payload.description || "",
      scheduled_at: payload.scheduled_at!,
      duration_minutes: payload.duration_minutes || 60,
      max_participants: payload.max_participants || 50,
      meeting_link: meeting,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Classroom scheduled" });
  };

  return { classrooms, joined, loading, status, join, leave, create, refetch: fetchAll };
};
