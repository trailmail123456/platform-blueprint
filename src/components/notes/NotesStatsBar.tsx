import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { FileText, Eye, Download, FolderOpen } from "lucide-react";

interface NotesStatsBarProps {
  totalNotes: number;
  totalViews: number;
  totalDownloads: number;
  totalSubjects: number;
}

export const NotesStatsBar = ({
  totalNotes,
  totalViews,
  totalDownloads,
  totalSubjects,
}: NotesStatsBarProps) => {
  const stats = [
    { icon: FileText, label: "Total Notes", value: totalNotes, color: "bg-primary/10 text-primary" },
    { icon: Eye, label: "Total Views", value: totalViews, color: "bg-accent/10 text-accent-foreground" },
    { icon: Download, label: "Downloads", value: totalDownloads, color: "bg-secondary/50 text-secondary-foreground" },
    { icon: FolderOpen, label: "Subjects", value: totalSubjects, color: "bg-primary/10 text-primary" },
  ];

  return (
    <ScrollReveal>
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollReveal>
  );
};
