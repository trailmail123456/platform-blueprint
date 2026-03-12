import { useState } from "react";
import { Users, RefreshCw, Calendar, Star, MessageSquare, ChevronRight, UserPlus, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

interface CircleMember {
  name: string;
  avatar: string;
  project: string;
  skills: string[];
}

interface FeedbackCircle {
  id: string;
  name: string;
  weekNumber: number;
  members: CircleMember[];
  status: "active" | "completed" | "upcoming";
  topic: string;
  meetingTime: string;
  feedbackGiven: number;
  feedbackTotal: number;
}

const mockCircles: FeedbackCircle[] = [
  {
    id: "1",
    name: "Innovation Circle A",
    weekNumber: 12,
    status: "active",
    topic: "MVP Validation",
    meetingTime: "Wed 6:00 PM",
    feedbackGiven: 3,
    feedbackTotal: 5,
    members: [
      { name: "Priya S.", avatar: "", project: "AI Study Buddy", skills: ["AI/ML", "Python"] },
      { name: "Aman K.", avatar: "", project: "Smart Attendance", skills: ["IoT", "React"] },
      { name: "Sneha T.", avatar: "", project: "Code Review Platform", skills: ["Full-Stack", "DevOps"] },
      { name: "Rahul M.", avatar: "", project: "Campus Food Network", skills: ["Mobile", "UX"] },
      { name: "Kavya R.", avatar: "", project: "Mental Health Bot", skills: ["NLP", "Psychology"] },
    ],
  },
  {
    id: "2",
    name: "Innovation Circle B",
    weekNumber: 12,
    status: "upcoming",
    topic: "User Research Findings",
    meetingTime: "Thu 5:00 PM",
    feedbackGiven: 0,
    feedbackTotal: 4,
    members: [
      { name: "Vikram J.", avatar: "", project: "Campus Marketplace", skills: ["E-commerce", "React"] },
      { name: "Neha P.", avatar: "", project: "Resume Optimizer", skills: ["AI", "Design"] },
      { name: "Rohan D.", avatar: "", project: "Virtual Lab", skills: ["WebGL", "Physics"] },
      { name: "Anita G.", avatar: "", project: "Study Planner", skills: ["Mobile", "UX"] },
    ],
  },
  {
    id: "3",
    name: "Innovation Circle C",
    weekNumber: 11,
    status: "completed",
    topic: "Pitch Deck Review",
    meetingTime: "Tue 7:00 PM",
    feedbackGiven: 6,
    feedbackTotal: 6,
    members: [
      { name: "Dev P.", avatar: "", project: "EduGamify", skills: ["Gaming", "React"] },
      { name: "Sara K.", avatar: "", project: "GreenCampus", skills: ["Sustainability", "Data"] },
      { name: "Mohit L.", avatar: "", project: "PeerTutor", skills: ["EdTech", "Video"] },
      { name: "Riya N.", avatar: "", project: "HealthTrack", skills: ["Health", "Mobile"] },
      { name: "Arjun B.", avatar: "", project: "SkillBridge", skills: ["Career", "AI"] },
      { name: "Pooja M.", avatar: "", project: "EventSync", skills: ["Events", "Full-Stack"] },
    ],
  },
];

const statusConfig = {
  active: { label: "Active Now", variant: "default" as const, color: "bg-green-500" },
  upcoming: { label: "Upcoming", variant: "secondary" as const, color: "bg-blue-500" },
  completed: { label: "Completed", variant: "outline" as const, color: "bg-muted-foreground" },
};

export const FeedbackCircles = () => {
  const [selectedCircle, setSelectedCircle] = useState<FeedbackCircle | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<CircleMember | null>(null);

  const handleJoinCircle = () => {
    toast.success("You've been added to the matching queue! You'll be matched with a circle by next Monday.");
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) return;
    toast.success(`Feedback sent to ${feedbackTarget?.name}!`);
    setFeedbackText("");
    setFeedbackDialogOpen(false);
    setFeedbackTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-primary" />
            Feedback Circles
          </h2>
          <p className="text-muted-foreground">Get matched with 4-6 peers weekly for structured project feedback</p>
        </div>
        <Button onClick={handleJoinCircle} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Join Next Circle
        </Button>
      </div>

      {/* How it Works */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">How Feedback Circles Work</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Get Matched", desc: "Matched with 4-6 peers every Monday" },
              { step: "2", title: "Share Progress", desc: "Present your project updates" },
              { step: "3", title: "Give Feedback", desc: "Provide structured feedback to peers" },
              { step: "4", title: "Improve", desc: "Apply insights to your project" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {item.step}
                </div>
                <h4 className="text-sm font-semibold">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Circles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCircles.map((circle, i) => {
          const config = statusConfig[circle.status];
          return (
            <ScrollReveal key={circle.id} delay={i * 0.1}>
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${selectedCircle?.id === circle.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedCircle(circle)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{circle.name}</CardTitle>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Week {circle.weekNumber} • {circle.meetingTime}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">This week's topic</p>
                    <Badge variant="outline">{circle.topic}</Badge>
                  </div>

                  {/* Members */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Members ({circle.members.length})</p>
                    <div className="flex -space-x-2">
                      {circle.members.map((member, j) => (
                        <Avatar key={j} className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Feedback Progress</span>
                      <span className="font-medium">{circle.feedbackGiven}/{circle.feedbackTotal}</span>
                    </div>
                    <Progress value={(circle.feedbackGiven / circle.feedbackTotal) * 100} className="h-1.5" />
                  </div>

                  <Button variant="outline" size="sm" className="w-full gap-1">
                    View Details <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Selected Circle Detail */}
      <AnimatePresence>
        {selectedCircle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedCircle.name} — Members</CardTitle>
                  <Badge variant={statusConfig[selectedCircle.status].variant}>
                    {statusConfig[selectedCircle.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCircle.members.map((member, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{member.name}</h4>
                              <p className="text-xs text-muted-foreground">{member.project}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {member.skills.map((skill) => (
                                  <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                                ))}
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Dialog open={feedbackDialogOpen && feedbackTarget?.name === member.name} onOpenChange={(open) => {
                                  setFeedbackDialogOpen(open);
                                  if (!open) setFeedbackTarget(null);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs gap-1 h-7"
                                      onClick={() => setFeedbackTarget(member)}
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                      Give Feedback
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Feedback for {member.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-2">
                                      <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm font-medium">Project: {member.project}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Topic: {selectedCircle.topic}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Your Feedback</label>
                                        <Textarea
                                          placeholder="Share constructive feedback on their project..."
                                          value={feedbackText}
                                          onChange={(e) => setFeedbackText(e.target.value)}
                                          rows={5}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Rating</label>
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Button key={star} variant="ghost" size="icon" className="h-8 w-8">
                                              <Star className={`h-4 w-4 ${star <= 4 ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                      <Button onClick={handleSubmitFeedback} className="w-full">
                                        Submit Feedback
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
