import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface AdminNote {
  id: string;
  title: string;
  subject: string;
  category: string | null;
  rating: number;
  views: number;
  downloads: number;
  report_count: number;
  created_at: string;
  user_id: string;
  profile?: { username: string | null; full_name: string | null };
  quality_score?: number;
}

export interface AdminComment {
  id: string;
  content: string;
  note_id: string;
  user_id: string;
  upvotes: number;
  downvotes: number;
  is_reported: boolean;
  is_helpful: boolean;
  created_at: string;
  profile?: { username: string | null; full_name: string | null };
  note_title?: string;
}

export interface AdminReport {
  id: string;
  content_type: string;
  content_id: string;
  reported_by: string;
  reason: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  reporter_profile?: { username: string | null; full_name: string | null };
}

export interface AdminUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  notes_count: number;
  avg_rating: number;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ totalNotes: 0, totalUsers: 0, pendingReports: 0, flaggedNotes: 0 });

  const checkAdmin = useCallback(async () => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    setIsAdmin(!!data);
    setLoading(false);
  }, [user]);

  const loadNotes = useCallback(async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;

    // Enrich with profiles
    const userIds = [...new Set(data.map((n) => n.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const enriched: AdminNote[] = data.map((n) => ({
      ...n,
      rating: Number(n.rating) || 0,
      views: n.views || 0,
      downloads: n.downloads || 0,
      report_count: (n as any).report_count || 0,
      profile: profileMap.get(n.user_id) || null,
      quality_score: Number(((Number(n.rating) || 0) * 0.5 + Math.min(n.downloads || 0, 1000) / 1000 * 3 + Math.min(n.views || 0, 5000) / 5000 * 2).toFixed(2)),
    }));
    setNotes(enriched);
  }, []);

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from("note_comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!data) return;

    const userIds = [...new Set(data.map((c) => c.user_id))];
    const noteIds = [...new Set(data.map((c) => c.note_id))];
    const [{ data: profiles }, { data: noteData }] = await Promise.all([
      supabase.from("profiles").select("id, username, full_name").in("id", userIds),
      supabase.from("notes").select("id, title").in("id", noteIds),
    ]);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const noteMap = new Map((noteData || []).map((n) => [n.id, n.title]));

    setComments(data.map((c) => ({
      ...c,
      upvotes: c.upvotes || 0,
      downvotes: c.downvotes || 0,
      is_reported: c.is_reported || false,
      is_helpful: c.is_helpful || false,
      profile: profileMap.get(c.user_id) || null,
      note_title: noteMap.get(c.note_id) || "Unknown",
    })));
  }, []);

  const loadReports = useCallback(async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;

    const reporterIds = [...new Set(data.map((r: any) => r.reported_by))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", reporterIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    setReports(data.map((r: any) => ({
      ...r,
      reporter_profile: profileMap.get(r.reported_by) || null,
    })));
  }, []);

  const loadUsers = useCallback(async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!profiles) return;

    const { data: notesData } = await supabase.from("notes").select("user_id, rating");

    const userStats = new Map<string, { count: number; totalRating: number }>();
    (notesData || []).forEach((n) => {
      const s = userStats.get(n.user_id) || { count: 0, totalRating: 0 };
      s.count++;
      s.totalRating += Number(n.rating) || 0;
      userStats.set(n.user_id, s);
    });

    setUsers(profiles.map((p) => {
      const s = userStats.get(p.id) || { count: 0, totalRating: 0 };
      return {
        ...p,
        notes_count: s.count,
        avg_rating: s.count > 0 ? Number((s.totalRating / s.count).toFixed(1)) : 0,
      };
    }));
  }, []);

  const loadStats = useCallback(async () => {
    const [{ count: notesCount }, { count: usersCount }, { data: reportsData }, { data: flaggedData }] = await Promise.all([
      supabase.from("notes").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("id").eq("status", "pending"),
      supabase.from("notes").select("id").gt("report_count", 0),
    ]);
    setStats({
      totalNotes: notesCount || 0,
      totalUsers: usersCount || 0,
      pendingReports: reportsData?.length || 0,
      flaggedNotes: flaggedData?.length || 0,
    });
  }, []);

  useEffect(() => { checkAdmin(); }, [checkAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([loadNotes(), loadComments(), loadReports(), loadUsers(), loadStats()]);
  }, [isAdmin, loadNotes, loadComments, loadReports, loadUsers, loadStats]);

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) { toast.error("Failed to delete note"); return; }
    toast.success("Note deleted");
    loadNotes();
    loadStats();
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from("note_comments").delete().eq("id", commentId);
    if (error) { toast.error("Failed to delete comment"); return; }
    toast.success("Comment deleted");
    loadComments();
  };

  const updateReportStatus = async (reportId: string, status: string, adminNote?: string) => {
    const updateData: any = { status };
    if (adminNote) updateData.admin_note = adminNote;
    const { error } = await supabase.from("reports").update(updateData).eq("id", reportId);
    if (error) { toast.error("Failed to update report"); return; }
    toast.success(`Report ${status}`);
    loadReports();
    loadStats();
  };

  const deleteReportedContent = async (report: AdminReport) => {
    if (report.content_type === "note") {
      await supabase.from("notes").delete().eq("id", report.content_id);
    } else {
      await supabase.from("note_comments").delete().eq("id", report.content_id);
    }
    await updateReportStatus(report.id, "reviewed", "Content deleted by admin");
    loadNotes();
    loadComments();
  };

  return {
    isAdmin, loading, notes, comments, reports, users, stats,
    deleteNote, deleteComment, updateReportStatus, deleteReportedContent,
    refresh: () => Promise.all([loadNotes(), loadComments(), loadReports(), loadUsers(), loadStats()]),
  };
};
