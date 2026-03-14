import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, BookOpen, Calendar, MessageSquare, Trophy, TrendingUp,
  Clock, Award, Lightbulb, Users, Flame, Zap, Target, ArrowRight,
  FileText, GraduationCap, Briefcase, Heart, Star, Bell, ChevronRight,
} from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [notesCount, setNotesCount] = useState(0);
  const [ideasCount, setIdeasCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      // Fetch notes count
      const { count: notes } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setNotesCount(notes || 0);

      // Fetch ideas count
      const { count: ideas } = await supabase
        .from("ideas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setIdeasCount(ideas || 0);

      // Fetch teams count
      const { count: teams } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTeamsCount(teams || 0);

      // Fetch unread notifications
      const { count: notifs } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotificationsCount(notifs || 0);
    };

    fetchDashboardData();
  }, [user]);

  // Quick links that map to all major pages
  const quickLinks = [
    { title: "Notes Hub", href: "/notes", icon: BookOpen, desc: "Access study materials", color: "text-primary" },
    { title: "Innovation Hub", href: "/innovation-hub", icon: Lightbulb, desc: "Ideas & startups", color: "text-yellow-500" },
    { title: "Events", href: "/events", icon: Calendar, desc: "Hackathons & workshops", color: "text-accent" },
    { title: "Jobs Portal", href: "/jobs", icon: Briefcase, desc: "Career opportunities", color: "text-green-500" },
    { title: "Study Groups", href: "/study-groups", icon: Users, desc: "Collaborate with peers", color: "text-blue-500" },
    { title: "Mentors", href: "/mentors", icon: GraduationCap, desc: "Book sessions", color: "text-purple-500" },
    { title: "Quiz Hub", href: "/quiz", icon: Target, desc: "Test your knowledge", color: "text-orange-500" },
    { title: "Forum", href: "/forum", icon: MessageSquare, desc: "Discuss & share", color: "text-pink-500" },
    { title: "Founder's Passport", href: "/founders-passport", icon: Flame, desc: "Your innovation ID", color: "text-orange-500" },
  ];
  const recentActivity = [
    { action: "Uploaded a note", item: "OS Process Scheduling", time: "2h ago", icon: FileText, page: "/notes" },
    { action: "Posted an idea", item: "AI Study Companion", time: "5h ago", icon: Lightbulb, page: "/innovation-hub" },
    { action: "Joined team", item: "Team InnovatorsX", time: "1d ago", icon: Users, page: "/team-hunt" },
    { action: "Registered for", item: "HackInnovate 2026", time: "2d ago", icon: Calendar, page: "/events" },
    { action: "Completed quiz", item: "Data Structures Mock", time: "3d ago", icon: Target, page: "/quiz" },
    { action: "Gave feedback in", item: "Innovation Circle A", time: "4d ago", icon: MessageSquare, page: "/innovation-hub" },
  ];

  const upcomingEvents = [
    { title: "HackInnovate 2026", date: "Mar 20, 2026", type: "Hackathon", href: "/events" },
    { title: "AI/ML Workshop", date: "Mar 25, 2026", type: "Workshop", href: "/events" },
    { title: "Feedback Circle Meeting", date: "Mar 14, 2026", type: "Circle", href: "/innovation-hub" },
    { title: "Mentor Session — Dr. Sharma", date: "Mar 16, 2026", type: "Mentoring", href: "/mentors" },
  ];

  const achievements = [
    { title: "Early Bird", desc: "Registered 10 events", icon: "🐦", earned: true },
    { title: "Knowledge Sharer", desc: "Uploaded 5 notes", icon: "📚", earned: true },
    { title: "Community Helper", desc: "50 forum replies", icon: "💬", earned: true },
    { title: "Innovator", desc: "Posted 3 startup ideas", icon: "💡", earned: ideasCount >= 3 },
    { title: "Team Player", desc: "Joined 2 teams", icon: "🤝", earned: teamsCount >= 2 },
    { title: "Streak Master", desc: "7-day login streak", icon: "🔥", earned: false },
  ];

  const platformStats = [
    { label: "My Notes", value: notesCount.toString(), icon: BookOpen, href: "/notes", color: "bg-primary/10 text-primary" },
    { label: "My Ideas", value: ideasCount.toString(), icon: Lightbulb, href: "/innovation-hub", color: "bg-yellow-500/10 text-yellow-500" },
    { label: "My Teams", value: teamsCount.toString(), icon: Users, href: "/team-hunt", color: "bg-blue-500/10 text-blue-500" },
    { label: "Notifications", value: notificationsCount.toString(), icon: Bell, href: "#", color: "bg-red-500/10 text-red-500" },
  ];

  const weeklyProgress = {
    studyHours: 12,
    studyGoal: 20,
    quizzesCompleted: 3,
    quizGoal: 5,
    feedbackGiven: 4,
    feedbackGoal: 5,
    notesUploaded: 2,
    notesGoal: 3,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <ScrollReveal>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                <LayoutDashboard className="h-7 w-7 text-primary" />
                {user ? `Welcome back!` : "Your Dashboard"}
              </h1>
              <p className="text-muted-foreground">Your personalized hub — everything across StudentHub in one place</p>
            </div>
            {!user && (
              <Link to="/auth">
                <Button className="gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Sign In to Sync
                </Button>
              </Link>
            )}
          </div>
        </ScrollReveal>

        {/* Stats Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          {platformStats.map((stat, index) => (
            <ScrollReveal key={index} delay={index * 0.05} direction="scale">
              <Link to={stat.href}>
                <Card className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="explore">Quick Links</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Activity */}
                <ScrollReveal delay={0.1}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                          <Link to={activity.page} key={index}>
                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                <activity.icon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  {activity.action} <span className="font-medium">{activity.item}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>

                {/* Upcoming Events */}
                <ScrollReveal delay={0.2}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        Upcoming Events
                      </CardTitle>
                      <Link to="/events">
                        <Button variant="ghost" size="sm" className="gap-1">
                          View All <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {upcomingEvents.map((event, index) => (
                          <Link to={event.href} key={index}>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                              <div>
                                <p className="font-medium text-sm">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{event.date}</p>
                              </div>
                              <Badge variant="outline">{event.type}</Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Weekly Progress */}
                <ScrollReveal delay={0.15}>
                  <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5" />
                        Weekly Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "Study Hours", current: weeklyProgress.studyHours, goal: weeklyProgress.studyGoal, unit: "hrs" },
                        { label: "Quizzes", current: weeklyProgress.quizzesCompleted, goal: weeklyProgress.quizGoal, unit: "" },
                        { label: "Feedback Given", current: weeklyProgress.feedbackGiven, goal: weeklyProgress.feedbackGoal, unit: "" },
                        { label: "Notes Uploaded", current: weeklyProgress.notesUploaded, goal: weeklyProgress.notesGoal, unit: "" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">{item.current}/{item.goal}{item.unit}</span>
                          </div>
                          <Progress value={(item.current / item.goal) * 100} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </ScrollReveal>

                {/* Achievements */}
                <ScrollReveal delay={0.25}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Award className="h-5 w-5" />
                        Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {achievements.map((achievement, index) => (
                          <div key={index} className={`flex items-start gap-3 ${!achievement.earned ? "opacity-40" : ""}`}>
                            <span className="text-xl">{achievement.icon}</span>
                            <div>
                              <p className="font-medium text-sm">{achievement.title}</p>
                              <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                            </div>
                            {achievement.earned && <Star className="h-4 w-4 fill-primary text-primary ml-auto shrink-0" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Full Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.concat([
                    { action: "Joined brainstorm room", item: "AI Startups", time: "5d ago", icon: Zap, page: "/innovation-hub" },
                    { action: "Earned badge", item: "Knowledge Sharer", time: "1w ago", icon: Award, page: "/gamification" },
                    { action: "Swapped skill", item: "React for Figma", time: "1w ago", icon: Heart, page: "/skill-swap" },
                    { action: "Watched session", item: "Intro to System Design", time: "2w ago", icon: GraduationCap, page: "/sessions" },
                  ]).map((activity, index) => (
                    <Link to={activity.page} key={index}>
                      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-2 border-primary/30">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <activity.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.action} <span className="font-semibold">{activity.item}</span></p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Streaks & Consistency
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl">
                    <p className="text-5xl font-bold text-orange-500">7</p>
                    <p className="text-sm text-muted-foreground mt-1">Day Streak 🔥</p>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                      <div key={i} className="text-center">
                        <div className={`h-8 w-8 mx-auto rounded-lg flex items-center justify-center text-xs font-medium ${i < 5 ? "bg-primary text-primary-foreground" : i === 5 ? "bg-primary/50 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {day}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Gamification Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Total XP", value: "2,450", icon: Zap },
                      { label: "Level", value: "12", icon: Star },
                      { label: "Badges", value: "8", icon: Award },
                      { label: "Rank", value: "#42", icon: Trophy },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-3 bg-muted/50 rounded-lg">
                        <stat.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <Link to="/gamification">
                    <Button variant="outline" className="w-full gap-2">
                      View Full Stats <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Platform Engagement Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                      { section: "Notes", count: notesCount, href: "/notes", icon: BookOpen },
                      { section: "Ideas", count: ideasCount, href: "/innovation-hub", icon: Lightbulb },
                      { section: "Teams", count: teamsCount, href: "/team-hunt", icon: Users },
                      { section: "Quizzes", count: 7, href: "/quiz", icon: Target },
                      { section: "Sessions", count: 3, href: "/sessions", icon: GraduationCap },
                      { section: "Forum Posts", count: 12, href: "/forum", icon: MessageSquare },
                    ].map((item) => (
                      <Link to={item.href} key={item.section}>
                        <div className="text-center p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
                          <item.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-xl font-bold">{item.count}</p>
                          <p className="text-xs text-muted-foreground">{item.section}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Links Tab */}
          <TabsContent value="explore">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickLinks.map((link, i) => (
                <ScrollReveal key={link.href} delay={i * 0.05}>
                  <Link to={link.href}>
                    <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                      <CardContent className="p-6 text-center">
                        <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-muted ${link.color}`}>
                          <link.icon className="h-7 w-7" />
                        </div>
                        <h3 className="font-semibold text-sm">{link.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{link.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
