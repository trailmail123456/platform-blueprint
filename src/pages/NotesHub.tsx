import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  BookOpen,
  Upload,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  MoreVertical,
  Grid3x3,
  List,
  X,
  Users,
  Plus,
} from "lucide-react";
import { mockNotes } from "@/lib/mockData";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const NotesHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    if (data) {
      setNotes(data);
    } else {
      setNotes(mockNotes);
    }
  };

  const createStudySession = async () => {
    if (!user) {
      toast.error("Please sign in to create a study session");
      navigate("/auth");
      return;
    }

    if (!sessionName.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        note_id: selectedNote.id,
        host_id: user.id,
        session_name: sessionName,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create session");
    } else {
      toast.success("Study session created!");
      setShowSessionDialog(false);
      setSessionName("");
      navigate(`/study-session/${data.id}`);
    }
  };

  const subjects = Array.from(new Set(notes.map((note) => note.subject)));

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes by title, subject, or tags..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              {user && (
                <Button onClick={() => navigate("/auth")} variant="default" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Note
                </Button>
              )}
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSubject === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(null)}
            >
              All Subjects
            </Button>
            {subjects.map((subject) => (
              <Button
                key={subject}
                variant={selectedSubject === subject ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubject(subject)}
                className="relative"
              >
                {subject}
                {selectedSubject === subject && (
                  <X
                    className="ml-2 h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSubject(null);
                    }}
                  />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
        </div>

        {/* Notes Grid/List */}
        <div
          className={
            viewMode === "grid"
              ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
          }
        >
          {filteredNotes.map((note, index) => (
            <ScrollReveal key={note.id} delay={index * 0.05} direction="scale">
              <Card className="card-hover overflow-hidden transition-all bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold line-clamp-2">{note.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {note.subject}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Semester {note.semester}</Badge>
                  <Badge variant="outline">{note.branch}</Badge>
                  {note.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="accent">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span>{note.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{note.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    <span>{note.downloads}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3">
                <div className="flex w-full gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button variant="default" size="sm" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedNote(note)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Study Session</DialogTitle>
                        <DialogDescription>
                          Start a collaborative study session for {note.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Session Name</label>
                          <Input
                            placeholder="e.g., Final Exam Prep"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={createStudySession}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Session
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No notes found</h3>
            <p className="mb-4 text-muted-foreground">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedSubject(null);
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesHub;
