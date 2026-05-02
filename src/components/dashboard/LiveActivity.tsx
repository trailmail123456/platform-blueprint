import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Radio, MessageSquare, Users, ArrowRight, Zap } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface ActiveRoom {
  id: string;
  name: string;
  topic: string;
  icon: string | null;
  participant_count: number | null;
  mentor_led: boolean | null;
}

interface ActiveSession {
  id: string;
  title: string;
  topic: string;
  status: string;
  participant_count: number | null;
}

export const LiveActivity = () => {
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    const [roomsRes, sessionsRes] = await Promise.all([
      supabase.from("brainstorm_rooms").select("id, name, topic, icon, participant_count, mentor_led").eq("is_active", true).limit(5),
      supabase.from("ama_sessions").select("id, title, topic, status, participant_count").eq("status", "live").limit(5),
    ]);
    setRooms(roomsRes.data || []);
    setSessions(sessionsRes.data || []);
    setLoading(false);
  }, []);

  // Public live data — no per-user filter required (RLS allows all to read).
  useRealtimeSync({
    channelName: "dashboard-live-activity",
    filters: [
      { table: "brainstorm_rooms" },
      { table: "brainstorm_participants" },
      { table: "ama_participants" },
    ],
    onChange: fetchActivity,
    pollIntervalMs: 20000, // ama_sessions not in realtime publication
  });

  const hasActivity = rooms.length > 0 || sessions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radio className="h-5 w-5 text-green-500 animate-pulse" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : !hasActivity ? (
          <div className="text-center py-8">
            <Zap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No live activity right now</p>
            <Link to="/innovation-hub">
              <Button variant="outline" size="sm" className="gap-1">
                Start a Brainstorm <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <Link to="/innovation-hub" key={room.id}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors cursor-pointer">
                  <span className="text-xl">{room.icon || "💡"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{room.topic}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {room.mentor_led && <Badge className="text-[10px] bg-purple-500/10 text-purple-600">Mentor</Badge>}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {room.participant_count || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {sessions.map((session) => (
              <Link to="/mentors" key={session.id}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                  <MessageSquare className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{session.topic}</p>
                  </div>
                  <Badge className="text-[10px] bg-red-500/10 text-red-500">LIVE</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
