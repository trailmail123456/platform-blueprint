import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Users,
  ThumbsUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  Pin,
  Send,
  Calendar,
  Radio,
  Plus,
  ArrowUp,
} from "lucide-react";
import { formatDistanceToNow, format, isPast, isFuture } from "date-fns";

interface AMASession {
  id: string;
  mentor_id: string;
  title: string;
  description: string | null;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  max_participants: number;
  participant_count: number;
  is_active: boolean;
  created_at: string;
}

interface AMAQuestion {
  id: string;
  session_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  upvotes: number;
  is_answered: boolean;
  is_pinned: boolean;
  created_at: string;
  user?: { username: string | null; avatar_url: string | null };
}

// Mock upcoming AMA sessions with mentor info
const mockAMASessions = [
  {
    id: "ama-1",
    mentor_id: "m1",
    title: "Ask Me Anything: Breaking into FAANG",
    description: "Senior engineer shares insider tips on cracking FAANG interviews, building projects, and career strategies.",
    topic: "Career",
    scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    status: "live",
    max_participants: 100,
    participant_count: 47,
    is_active: true,
    created_at: new Date().toISOString(),
    mentorName: "Priya Sharma",
    mentorTitle: "Senior Software Engineer",
    mentorCompany: "Google",
  },
  {
    id: "ama-2",
    mentor_id: "m2",
    title: "Product Management Career Path AMA",
    description: "From engineer to PM — learn about transitioning, skills needed, and interview prep for top product roles.",
    topic: "Product",
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 90,
    status: "upcoming",
    max_participants: 80,
    participant_count: 23,
    is_active: true,
    created_at: new Date().toISOString(),
    mentorName: "Rahul Verma",
    mentorTitle: "Product Manager",
    mentorCompany: "Microsoft",
  },
  {
    id: "ama-3",
    mentor_id: "m3",
    title: "AI/ML Research: From Academics to Industry",
    description: "PhD researcher discusses bridging the gap between academic ML research and industry applications.",
    topic: "AI/ML",
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    status: "upcoming",
    max_participants: 120,
    participant_count: 56,
    is_active: true,
    created_at: new Date().toISOString(),
    mentorName: "Dr. Ananya Rao",
    mentorTitle: "ML Research Scientist",
    mentorCompany: "DeepMind",
  },
  {
    id: "ama-4",
    mentor_id: "m4",
    title: "Startup Founding: 0 to 1 Journey",
    description: "YC-backed founder shares lessons from building a startup from scratch — fundraising, hiring, and product-market fit.",
    topic: "Startups",
    scheduled_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 75,
    status: "upcoming",
    max_participants: 150,
    participant_count: 89,
    is_active: true,
    created_at: new Date().toISOString(),
    mentorName: "Vikram Patel",
    mentorTitle: "Founder & CEO",
    mentorCompany: "TechStartup (YC W24)",
  },
];

const mockQuestions: Record<string, { user: string; question: string; answer: string | null; upvotes: number; isAnswered: boolean; isPinned: boolean; time: string }[]> = {
  "ama-1": [
    { user: "Aarav", question: "What's the single most important thing to focus on for FAANG prep?", answer: "Data structures and algorithms are table stakes, but what really sets you apart is system design thinking and being able to communicate your thought process clearly.", upvotes: 34, isAnswered: true, isPinned: true, time: "5 min ago" },
    { user: "Meera", question: "How many hours per day did you study for interviews?", answer: "I did about 3-4 hours of focused practice daily for 3 months. Quality over quantity matters more.", upvotes: 21, isAnswered: true, isPinned: false, time: "8 min ago" },
    { user: "Karan", question: "Is a CS degree strictly necessary for FAANG?", answer: null, upvotes: 18, isAnswered: false, isPinned: false, time: "2 min ago" },
    { user: "Sneha", question: "How do you handle rejection after multiple rounds?", answer: null, upvotes: 12, isAnswered: false, isPinned: false, time: "1 min ago" },
  ],
  "ama-2": [
    { user: "Ravi", question: "What skills should an engineer develop to transition to PM?", answer: null, upvotes: 8, isAnswered: false, isPinned: false, time: "12 min ago" },
  ],
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "live":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"><Radio className="mr-1 h-3 w-3" /> LIVE NOW</Badge>;
    case "upcoming":
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Upcoming</Badge>;
    case "ended":
      return <Badge variant="outline"><CheckCircle2 className="mr-1 h-3 w-3" /> Ended</Badge>;
    default:
      return null;
  }
};

export const MentorAMA = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [questions, setQuestions] = useState<typeof mockQuestions["ama-1"]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [joinedSessions, setJoinedSessions] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedSession && mockQuestions[selectedSession]) {
      setQuestions([...mockQuestions[selectedSession]]);
    } else {
      setQuestions([]);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [questions]);

  const handleJoinSession = (sessionId: string) => {
    setJoinedSessions((prev) => new Set(prev).add(sessionId));
    setSelectedSession(sessionId);
    toast({ title: "Joined AMA Session! 🎙️", description: "You can now ask questions and upvote others." });
  };

  const handleAskQuestion = () => {
    if (!newQuestion.trim()) return;
    const newQ = {
      user: "You",
      question: newQuestion,
      answer: null,
      upvotes: 0,
      isAnswered: false,
      isPinned: false,
      time: "Just now",
    };
    setQuestions((prev) => [...prev, newQ]);
    setNewQuestion("");
    toast({ title: "Question submitted! 🙋", description: "The mentor will answer it soon." });
  };

  const handleUpvote = (index: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
  };

  const selectedSessionData = mockAMASessions.find((s) => s.id === selectedSession);

  return (
    <div className="space-y-8">
      {/* AMA Sessions Grid */}
      {!selectedSession ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mentor AMA Sessions</h2>
              <p className="text-muted-foreground">Join live Q&A sessions with industry experts</p>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Request AMA
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {mockAMASessions.map((session, index) => (
              <ScrollReveal key={session.id} delay={index * 0.05}>
                <Card className="card-hover overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 group relative">
                  {session.status === "live" && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse" />
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
                            {session.mentorName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{session.mentorName}</p>
                          <p className="text-xs text-muted-foreground">{session.mentorTitle}</p>
                          <p className="text-xs text-primary font-medium">{session.mentorCompany}</p>
                        </div>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <CardTitle className="text-lg mb-1">{session.title}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">{session.topic}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {session.duration_minutes} min
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {session.status === "live"
                            ? "Happening now"
                            : format(new Date(session.scheduled_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{session.participant_count}/{session.max_participants}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant={session.status === "live" ? "default" : "outline"}
                      onClick={() => handleJoinSession(session.id)}
                    >
                      {session.status === "live" ? (
                        <>
                          <Radio className="mr-2 h-4 w-4" />
                          Join Live AMA
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          RSVP & Set Reminder
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </>
      ) : (
        /* Live AMA Room */
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
            ← Back to Sessions
          </Button>

          {selectedSessionData && (
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        {selectedSessionData.mentorName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{selectedSessionData.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        with <span className="text-primary font-medium">{selectedSessionData.mentorName}</span> · {selectedSessionData.mentorTitle} at {selectedSessionData.mentorCompany}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedSessionData.status)}
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {selectedSessionData.participant_count} joined
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Q&A Area */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Questions List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Questions ({questions.length})
                </h3>
                <Badge variant="outline" className="text-xs">
                  Sorted by upvotes
                </Badge>
              </div>

              <div ref={scrollRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {[...questions]
                    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.upvotes - a.upvotes)
                    .map((q, index) => (
                      <motion.div
                        key={`${q.question}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className={`bg-card/50 backdrop-blur-sm border-border/50 ${q.isPinned ? "ring-1 ring-primary/30" : ""} ${q.isAnswered ? "border-l-2 border-l-green-500" : ""}`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <Avatar className="h-8 w-8 mt-0.5">
                                  <AvatarFallback className="text-xs bg-secondary">{q.user[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">{q.user}</span>
                                    <span className="text-xs text-muted-foreground">{q.time}</span>
                                    {q.isPinned && <Pin className="h-3 w-3 text-primary" />}
                                    {q.isAnswered && (
                                      <Badge className="text-[10px] h-5 bg-green-500/20 text-green-400 border-green-500/30">
                                        <CheckCircle2 className="mr-1 h-3 w-3" /> Answered
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm">{q.question}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 hover:text-primary"
                                onClick={() => handleUpvote(questions.indexOf(q))}
                              >
                                <ArrowUp className="h-4 w-4" />
                                <span className="text-xs font-bold">{q.upvotes}</span>
                              </Button>
                            </div>

                            {q.answer && (
                              <div className="ml-11 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2 mb-1">
                                  <Mic className="h-3 w-3 text-primary" />
                                  <span className="text-xs font-semibold text-primary">Mentor's Answer</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{q.answer}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </AnimatePresence>

                {questions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No questions yet</p>
                    <p className="text-sm">Be the first to ask!</p>
                  </div>
                )}
              </div>

              {/* Ask Question Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your question for the mentor..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  className="bg-card/50 backdrop-blur-sm"
                />
                <Button onClick={handleAskQuestion} disabled={!newQuestion.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Session Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p>📌 Pinned questions are answered first</p>
                  <p>⬆️ Upvote questions you want answered</p>
                  <p>🎯 Keep questions concise and relevant</p>
                  <p>🤝 Be respectful to the mentor and others</p>
                  <p>⏰ Session lasts {selectedSessionData?.duration_minutes} minutes</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Session Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-bold">{questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Answered</span>
                    <span className="font-bold text-green-400">{questions.filter((q) => q.isAnswered).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Participants</span>
                    <span className="font-bold">{selectedSessionData?.participant_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Upvotes</span>
                    <span className="font-bold">{questions.reduce((sum, q) => sum + q.upvotes, 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
