import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync, SyncStatus } from "./useRealtimeSync";

export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  duration: string | null;
  topics: string[];
  step_count: number;
  is_public: boolean;
  created_at: string;
}

export interface RoadmapStep {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  resources: { label: string; url: string }[];
  position: number;
}

export interface CheatSheet {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  format: string;
  pages: number;
  downloads: number;
}

export const useRoadmaps = (): {
  roadmaps: Roadmap[];
  loading: boolean;
  status: SyncStatus;
  completedSteps: Set<string>;
  refetch: () => Promise<void>;
} => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [{ data: rms }, { data: { user } }] = await Promise.all([
      supabase.from("roadmaps").select("*").eq("is_public", true).order("created_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setRoadmaps((rms || []) as Roadmap[]);
    if (user) {
      const { data: progress } = await supabase
        .from("roadmap_progress")
        .select("step_id")
        .eq("user_id", user.id);
      setCompletedSteps(new Set((progress || []).map((p: any) => p.step_id)));
    }
    setLoading(false);
  }, []);

  const status = useRealtimeSync({
    channelName: "roadmaps",
    filters: [{ table: "roadmaps" }, { table: "roadmap_progress" }],
    onChange: fetchAll,
  });

  return { roadmaps, loading, status, completedSteps, refetch: fetchAll };
};

export const fetchSteps = async (roadmapId: string): Promise<RoadmapStep[]> => {
  const { data } = await supabase
    .from("roadmap_steps")
    .select("*")
    .eq("roadmap_id", roadmapId)
    .order("position", { ascending: true });
  return ((data || []) as any[]).map((s) => ({
    ...s,
    resources: Array.isArray(s.resources) ? s.resources : [],
  }));
};

export const createRoadmap = async (input: {
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  duration?: string;
  topics: string[];
  steps: { title: string; description?: string }[];
}) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data: rm, error } = await supabase
    .from("roadmaps")
    .insert({
      user_id: user.user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      duration: input.duration,
      topics: input.topics,
    })
    .select()
    .single();
  if (error) throw error;
  if (input.steps.length) {
    await supabase.from("roadmap_steps").insert(
      input.steps.map((s, i) => ({
        roadmap_id: rm.id,
        title: s.title,
        description: s.description,
        position: i,
      }))
    );
  }
  return rm;
};

export const toggleStep = async (roadmapId: string, stepId: string) => {
  const { data, error } = await supabase.rpc("toggle_roadmap_step", {
    _roadmap_id: roadmapId,
    _step_id: stepId,
  });
  if (error) throw error;
  return data;
};

export const useCheatSheets = (): { sheets: CheatSheet[]; loading: boolean; status: SyncStatus; refetch: () => Promise<void> } => {
  const [sheets, setSheets] = useState<CheatSheet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("cheat_sheets")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    setSheets((data || []) as CheatSheet[]);
    setLoading(false);
  }, []);

  const status = useRealtimeSync({
    channelName: "cheat-sheets",
    filters: [{ table: "cheat_sheets" }],
    onChange: fetchAll,
  });

  return { sheets, loading, status, refetch: fetchAll };
};

export const downloadCheatSheet = async (id: string, fileUrl: string | null) => {
  await supabase.rpc("bump_cheatsheet_downloads", { _id: id });
  if (fileUrl) window.open(fileUrl, "_blank", "noopener");
};
