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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Upload, Search, Star, Download, Eye,
  Grid3x3, List, X, Users, Plus, Sparkles,
  FileText, TrendingUp, FolderOpen, Tag, Pencil, Trash2, Bookmark,
} from "lucide-react";
import { mockNotes } from "@/lib/mockData";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NoteUploadDialog } from "@/components/NoteUploadDialog";
import { NotePreviewer } from "@/components/NotePreviewer";
import { BatchUploadDialog } from "@/components/BatchUploadDialog";
import { NoteAIFeatures } from "@/components/NoteAIFeatures";
import { NoteEditDialog } from "@/components/notes/NoteEditDialog";
import { NoteDetailDialog } from "@/components/notes/NoteDetailDialog";
import { NoteRating } from "@/components/notes/NoteRating";
import { NoteBookmarkButton } from "@/components/notes/NoteBookmarkButton";

const NotesHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [notes, setNotes] = useState<any[]>([]);
  const [bookmarkedNoteIds, setBookmarkedNoteIds] = useState<Set<string>>(new Set());
  const [myNotes, setMyNotes] = useState<any[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewNote, setPreviewNote] = useState<any>(null);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [aiNote, setAiNote] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("browse");
  // New states
  const [editNote, setEditNote] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteNote, setDeleteNote] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [detailNote, setDetailNote] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    loadNotes();
    loadBookmarks();

    // Real-time subscription for notes
    const channel = supabase
      .channel("notes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, () => {
        loadNotes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadNotes = async () => {
    const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setNotes(data);
      if (user) {
        setMyNotes(data.filter((n: any) => n.user_id === user.id));
      }
    } else {
      setNotes(mockNotes as any[]);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase.from("note_bookmarks").select("note_id").eq("user_id", user.id);
    if (data) setBookmarkedNoteIds(new Set(data.map(b => b.note_id)));
  };

  const createStudySession = async () => {
    if (!user) { toast.error("Please sign in"); navigate("/auth"); return; }
    if (!sessionName.trim()) { toast.error("Please enter a session name"); return; }
    const { data, error } = await supabase.from("study_sessions").insert({
      note_id: selectedNote.id, host_id: user.id, session_name: sessionName,
    }).select().single();
    if (error) toast.error("Failed to create session");
    else { toast.success("Study session created!"); setShowSessionDialog(false); setSessionName(""); navigate(`/study-session/${data.id}`); }
  };

  const handleDeleteNote = async () => {
    if (!deleteNote) return;
    try {
      const { error } = await supabase.from("notes").delete().eq("id", deleteNote.id);
      if (error) throw error;
      toast.success("Note deleted successfully!");
      setShowDeleteDialog(false);
      setDeleteNote(null);
      loadNotes();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete note");
    }
  };

  const subjects = Array.from(new Set(notes.map((n) => n.subject)));
  const categories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));

  const getFilteredNotes = (notesList: any[]) => {
    let filtered = notesList.filter((note) => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = !selectedSubject || note.subject === selectedSubject;
      const matchesCategory = !selectedCategory || note.category === selectedCategory;
      return matchesSearch && matchesSubject && matchesCategory;
    });
    switch (sortBy) {
      case "popular": filtered.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
      case "top-rated": filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "most-downloaded": filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0)); break;
      case "oldest": filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      default: filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return filtered;
  };

  const filteredNotes = getFilteredNotes(notes);
  const filteredMyNotes = getFilteredNotes(myNotes);
  const bookmarkedNotes = notes.filter(n => bookmarkedNoteIds.has(n.id));
  const filteredBookmarks = getFilteredNotes(bookmarkedNotes);
  const totalViews = notes.reduce((sum, n) => sum + (n.views || 0), 0);
  const totalDownloads = notes.reduce((sum, n) => sum + (n.downloads || 0), 0);

  const NoteCard = ({ note, index, isOwner = false }: { note: any; index: number; isOwner?: boolean }) => (
    <ScrollReveal key={note.id} delay={index * 0.03} direction="scale">
      <Card className="card-hover overflow-hidden transition-all bg-card/50 backdrop-blur-sm group h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {note.category && <Badge variant="outline" className="text-xs shrink-0">{note.category}</Badge>}
                {note.file_type && <Badge variant="secondary" className="text-xs shrink-0 uppercase">{note.file_type || "pdf"}</Badge>}
              </div>
              <h3
                className="font-semibold line-clamp-2 text-sm cursor-pointer hover:text-primary transition-colors"
                onClick={() => { setDetailNote(note); setShowDetailDialog(true); }}
              >
                {note.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{note.subject}</p>
            </div>
            <div className="flex gap-1 ml-2">
              <NoteBookmarkButton noteId={note.id} />
              {isOwner && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditNote(note); setShowEditDialog(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setDeleteNote(note); setShowDeleteDialog(true); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3 flex-1">
          {note.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{note.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {note.semester && <Badge variant="secondary" className="text-xs">Sem {note.semester}</Badge>}
            {note.branch && <Badge variant="outline" className="text-xs">{note.branch}</Badge>}
            {note.university && <Badge variant="outline" className="text-xs">{note.university}</Badge>}
            {note.tags?.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="accent" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" /><span>{Number(note.rating || 0).toFixed(1)}</span></div>
            <div className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /><span>{note.views || 0}</span></div>
            <div className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /><span>{note.downloads || 0}</span></div>
          </div>
        </CardContent>
        <CardFooter className="pt-3 border-t border-border/50">
          <div className="flex w-full gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setPreviewNote(note); setShowPreviewDialog(true); }}>
              <Eye className="mr-1 h-3 w-3" />Preview
            </Button>
            <Button variant="default" size="sm" className="flex-1 text-xs" onClick={() => { setDetailNote(note); setShowDetailDialog(true); }}>
              <Star className="mr-1 h-3 w-3" />Rate & Comment
            </Button>
            <Button variant="secondary" size="sm" className="text-xs px-2" onClick={() => { setAiNote(note); setShowAIFeatures(true); }}>
              <Sparkles className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs px-2" onClick={() => { setSelectedNote(note); setShowSessionDialog(true); }}>
              <Users className="h-3 w-3" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </ScrollReveal>
  );

  const renderNotesList = (notesList: any[], isOwner = false) => (
    <>
      {notesList.length > 0 ? (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
          {notesList.map((note, index) => <NoteCard key={note.id} note={note} index={index} isOwner={isOwner} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No notes found</h3>
          <p className="mb-4 text-muted-foreground text-sm">Try adjusting your search or filters, or upload the first note!</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedSubject(null); setSelectedCategory(null); }}>Clear Filters</Button>
            {user && <Button onClick={() => setShowUploadDialog(true)}><Upload className="mr-2 h-4 w-4" />Upload Note</Button>}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />
      <div className="container mx-auto px-4 py-6">
        {/* Hero Stats */}
        <ScrollReveal>
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: FileText, label: "Total Notes", value: notes.length, color: "bg-primary/10 text-primary" },
              { icon: Eye, label: "Total Views", value: totalViews, color: "bg-accent/10 text-accent-foreground" },
              { icon: Download, label: "Downloads", value: totalDownloads, color: "bg-secondary/50 text-secondary-foreground" },
              { icon: FolderOpen, label: "Subjects", value: subjects.length, color: "bg-primary/10 text-primary" },
            ].map((stat, i) => (
              <Card key={i} className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollReveal>

        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search notes by title, subject, description..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="popular">Most Viewed</SelectItem>
                  <SelectItem value="top-rated">Top Rated</SelectItem>
                  <SelectItem value="most-downloaded">Most Downloaded</SelectItem>
                </SelectContent>
              </Select>
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("grid")}><Grid3x3 className="h-4 w-4" /></Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
              {user && (
                <>
                  <Button onClick={() => setShowUploadDialog(true)} size="sm" className="h-9"><Upload className="mr-1.5 h-3.5 w-3.5" />Upload</Button>
                  <Button onClick={() => setShowBatchUpload(true)} variant="secondary" size="sm" className="h-9"><Upload className="mr-1.5 h-3.5 w-3.5" />Batch</Button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedSubject === null ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setSelectedSubject(null)}>All Subjects</Button>
            {subjects.map((subject) => (
              <Button key={subject} variant={selectedSubject === subject ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setSelectedSubject(subject)}>
                {subject}
                {selectedSubject === subject && <X className="ml-1 h-3 w-3" onClick={(e) => { e.stopPropagation(); setSelectedSubject(null); }} />}
              </Button>
            ))}
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground mt-1" />
              <Button variant={selectedCategory === null ? "secondary" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setSelectedCategory(null)}>All Categories</Button>
              {categories.map((cat) => (
                <Button key={cat} variant={selectedCategory === cat ? "secondary" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setSelectedCategory(cat as string)}>
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="browse"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Browse All ({filteredNotes.length})</TabsTrigger>
            {user && <TabsTrigger value="my-notes"><FolderOpen className="mr-1.5 h-3.5 w-3.5" />My Notes ({filteredMyNotes.length})</TabsTrigger>}
            {user && <TabsTrigger value="bookmarks"><Bookmark className="mr-1.5 h-3.5 w-3.5" />Bookmarks ({filteredBookmarks.length})</TabsTrigger>}
          </TabsList>
          <TabsContent value="browse" className="mt-4">
            {renderNotesList(filteredNotes)}
          </TabsContent>
          {user && (
            <TabsContent value="my-notes" className="mt-4">
              {filteredMyNotes.length === 0 && searchQuery === "" && !selectedSubject && !selectedCategory ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">You haven't uploaded any notes yet</h3>
                  <p className="mb-4 text-muted-foreground text-sm">Share your notes with the community and help fellow students!</p>
                  <Button onClick={() => setShowUploadDialog(true)}><Upload className="mr-2 h-4 w-4" />Upload Your First Note</Button>
                </div>
              ) : renderNotesList(filteredMyNotes, true)}
            </TabsContent>
          )}
          {user && (
            <TabsContent value="bookmarks" className="mt-4">
              {filteredBookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Bookmark className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">No bookmarked notes</h3>
                  <p className="mb-4 text-muted-foreground text-sm">Click the bookmark icon on any note to save it for later!</p>
                </div>
              ) : renderNotesList(filteredBookmarks)}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <NoteUploadDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} onSuccess={loadNotes} />
      <NotePreviewer open={showPreviewDialog} onOpenChange={setShowPreviewDialog} note={previewNote} />
      <BatchUploadDialog open={showBatchUpload} onOpenChange={setShowBatchUpload} onSuccess={loadNotes} />
      <NoteDetailDialog open={showDetailDialog} onOpenChange={setShowDetailDialog} note={detailNote} onRefresh={loadNotes} />

      {showEditDialog && editNote && (
        <NoteEditDialog open={showEditDialog} onOpenChange={setShowEditDialog} note={editNote} onSuccess={loadNotes} />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteNote?.title}"? This action cannot be undone. All ratings and comments will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAIFeatures} onOpenChange={setShowAIFeatures}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{aiNote?.title} - AI Features</DialogTitle></DialogHeader>
          {aiNote && <NoteAIFeatures noteId={aiNote.id} noteTitle={aiNote.title} />}
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Study Session</DialogTitle>
            <DialogDescription>Start a collaborative study session for {selectedNote?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Session Name</label>
              <Input placeholder="e.g., Final Exam Prep" value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createStudySession}><Plus className="mr-2 h-4 w-4" />Create Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesHub;
