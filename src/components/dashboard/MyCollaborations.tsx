import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Handshake, ArrowRight } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface Collaboration {
  team_id: string;
  role: string;
  team_name: string;
  idea_title: string | null;
  idea_category: string | null;
}

const roleColors: Record<string, string> = {
  founder: "bg-primary/10 text-primary",
  co_founder: "bg-accent/10 text-accent-foreground",
  developer: "bg-blue-500/10 text-blue-600",
  designer: "bg-pink-500/10 text-pink-600",
  marketer: "bg-green-500/10 text-green-600",
  analyst: "bg-orange-500/10 text-orange-600",
  researcher: "bg-purple-500/10 text-purple-600",
  user: "bg-muted text-muted-foreground",
};

export const MyCollaborations = ({ userId }: { userId: string }) => {
  const [collabs, setCollabs] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamIds, setTeamIds] = useState<string[]>([]);

  const fetchCollabs = useCallback(async () => {
    const { data: memberships } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", userId);

    if (memberships && memberships.length > 0) {
      const ids = memberships.map(m => m.team_id);
      setTeamIds(ids);
      const [{ data: teams }, { data: ideas }] = await Promise.all([
        supabase.from("teams").select("id, name").in("id", ids),
        supabase.from("ideas").select("team_id, title, category").in("team_id", ids),
      ]);

      const result: Collaboration[] = memberships.map(m => {
        const team = teams?.find(t => t.id === m.team_id);
        const idea = ideas?.find(i => i.team_id === m.team_id);
        return {
          team_id: m.team_id,
          role: m.role,
          team_name: team?.name || "Unknown Team",
          idea_title: idea?.title || null,
          idea_category: idea?.category || null,
        };
      });
      setCollabs(result);
    } else {
      setTeamIds([]);
      setCollabs([]);
    }
    setLoading(false);
  }, [userId]);

  // Tighten ideas filter to teams the user actually belongs to.
  // When teamIds is empty we still subscribe to membership changes so we re-fetch.
  useRealtimeSync({
    channelName: `my-collabs-${userId}-${teamIds.join(",")}`,
    filters: [
      { table: "team_members", filter: `user_id=eq.${userId}` },
      ...(teamIds.length > 0
        ? [{ table: "ideas" as const, filter: `team_id=in.(${teamIds.join(",")})` }]
        : []),
    ],
    onChange: fetchCollabs,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Handshake className="h-5 w-5 text-primary" />
          My Collaborations ({collabs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
        ) : collabs.length === 0 ? (
          <div className="text-center py-8">
            <Handshake className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Not collaborating on any ideas yet</p>
            <Link to="/team-hunt">
              <Button variant="outline" size="sm" className="gap-1">
                Find Teams <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {collabs.map((c) => (
              <div
                key={c.team_id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate">{c.team_name}</h4>
                  {c.idea_title && (
                    <p className="text-xs text-muted-foreground truncate">
                      Working on: {c.idea_title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.idea_category && <Badge variant="outline" className="text-[10px]">{c.idea_category}</Badge>}
                  <Badge className={`text-[10px] ${roleColors[c.role] || roleColors.user}`}>
                    {c.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
