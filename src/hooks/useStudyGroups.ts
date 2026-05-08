import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "./useRealtimeSync";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface StudyGroupRow {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  privacy: string;
  category: string | null;
  member_limit: number;
  member_count: number;
  active_room_count: number;
  banner_url: string | null;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const useStudyGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroupRow[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase.from("study_groups").select("*").order("created_at", { ascending: false });
    if (data) setGroups(data as StudyGroupRow[]);
    if (user) {
      const { data: m } = await supabase.from("study_group_members").select("group_id").eq("user_id", user.id);
      if (m) setMyGroupIds(new Set(m.map((x: any) => x.group_id)));
    }
    setLoading(false);
  }, [user]);

  const status = useRealtimeSync({
    channelName: "study-groups",
    filters: [{ table: "study_groups" }, { table: "study_group_members" }],
    onChange: fetchAll,
  });

  const join = async (gid: string) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const { error } = await supabase.rpc("join_study_group", { _group_id: gid });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Joined group" });
  };
  const leave = async (gid: string) => {
    const { error } = await supabase.rpc("leave_study_group", { _group_id: gid });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Left group" });
  };

  const createGroup = async (payload: Partial<StudyGroupRow>) => {
    if (!user) return toast({ title: "Sign in required", variant: "destructive" });
    const { error } = await supabase.from("study_groups").insert({
      owner_id: user.id,
      name: payload.name!,
      description: payload.description || "",
      privacy: payload.privacy || "public",
      category: payload.category || null,
      member_limit: payload.member_limit || 50,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Group created" });
  };

  return { groups, myGroupIds, loading, status, join, leave, createGroup, refetch: fetchAll };
};

export const useGroupMessages = (groupId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const fetchMsgs = useCallback(async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from("study_group_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data as GroupMessage[]);
  }, [groupId]);

  useRealtimeSync({
    channelName: `group-msg-${groupId}`,
    filters: groupId ? [{ table: "study_group_messages", filter: `group_id=eq.${groupId}` }] : [],
    onChange: fetchMsgs,
    enabled: !!groupId,
  });

  const send = async (content: string) => {
    if (!user || !groupId || !content.trim()) return;
    await supabase.from("study_group_messages").insert({ group_id: groupId, user_id: user.id, content: content.trim() });
  };

  return { messages, send };
};
