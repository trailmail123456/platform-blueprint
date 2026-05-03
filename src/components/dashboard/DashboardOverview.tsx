import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  BookOpen, Eye, Star, Lightbulb, Users, Bell, Download,
} from "lucide-react";

interface Stats {
  notesCount: number;
  notesViews: number;
  notesDownloads: number;
  notesAvgRating: number;
  ideasCount: number;
  teamsCount: number;
  notificationsCount: number;
}

const icons = [BookOpen, Eye, Download, Star, Lightbulb, Users, Bell];
const colors = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent-foreground",
  "bg-secondary/50 text-secondary-foreground",
  "bg-primary/10 text-primary",
  "bg-yellow-500/10 text-yellow-500",
  "bg-blue-500/10 text-blue-500",
  "bg-red-500/10 text-red-500",
];
const links = ["/notes", "/notes", "/notes", "/notes", "/innovation-hub", "/team-hunt", "#"];

export const DashboardOverview = ({ stats }: { stats: Stats }) => {
  const items = [
    { key: "notes", label: "My Notes", value: stats.notesCount },
    { key: "views", label: "Note Views", value: stats.notesViews },
    { key: "downloads", label: "Downloads", value: stats.notesDownloads },
    { key: "rating", label: "Avg Rating", value: stats.notesAvgRating.toFixed(1) },
    { key: "ideas", label: "My Ideas", value: stats.ideasCount },
    { key: "teams", label: "My Teams", value: stats.teamsCount },
    { key: "notifications", label: "Notifications", value: stats.notificationsCount },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {items.map((stat, i) => {
        const Icon = icons[i];
        return (
          <ScrollReveal key={i} delay={i * 0.04} direction="scale">
            <Link to={links[i]}>
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[i]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div
                      className="text-xl font-bold"
                      data-testid={`stat-${stat.key}`}
                      data-value={stat.value}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </ScrollReveal>
        );
      })}
    </div>
  );
};
