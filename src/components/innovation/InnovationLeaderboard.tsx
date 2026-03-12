import { useState } from "react";
import { Trophy, Flame, Zap, TrendingUp, Medal, Crown, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const topIdeas = [
  { rank: 1, title: "AI-Powered Study Buddy", author: "Priya S.", upvotes: 342, comments: 67, category: "EdTech", avatar: "", streak: 14 },
  { rank: 2, title: "Campus Food Delivery Network", author: "Rahul M.", upvotes: 289, comments: 45, category: "Social Impact", avatar: "", streak: 9 },
  { rank: 3, title: "Smart Attendance System", author: "Aman K.", upvotes: 234, comments: 38, category: "IoT", avatar: "", streak: 21 },
  { rank: 4, title: "Peer Code Review Platform", author: "Sneha T.", upvotes: 198, comments: 29, category: "DevTools", avatar: "", streak: 7 },
  { rank: 5, title: "Mental Health Check-in Bot", author: "Kavya R.", upvotes: 176, comments: 52, category: "HealthTech", avatar: "", streak: 11 },
  { rank: 6, title: "Campus Marketplace", author: "Vikram J.", upvotes: 154, comments: 21, category: "Commerce", avatar: "", streak: 5 },
  { rank: 7, title: "AI Resume Optimizer", author: "Neha P.", upvotes: 143, comments: 33, category: "Career", avatar: "", streak: 8 },
  { rank: 8, title: "Virtual Lab Simulator", author: "Rohan D.", upvotes: 128, comments: 19, category: "EdTech", avatar: "", streak: 3 },
];

const activeCreators = [
  { rank: 1, name: "Priya S.", ideas: 12, contributions: 89, streak: 21, points: 4520, level: "Innovator" },
  { rank: 2, name: "Aman K.", ideas: 8, contributions: 76, streak: 14, points: 3890, level: "Builder" },
  { rank: 3, name: "Sneha T.", ideas: 10, contributions: 65, streak: 18, points: 3450, level: "Innovator" },
  { rank: 4, name: "Rahul M.", ideas: 6, contributions: 54, streak: 9, points: 2980, level: "Thinker" },
  { rank: 5, name: "Kavya R.", ideas: 7, contributions: 48, streak: 11, points: 2650, level: "Builder" },
  { rank: 6, name: "Vikram J.", ideas: 5, contributions: 41, streak: 7, points: 2200, level: "Thinker" },
];

const fastestPrototypes = [
  { rank: 1, title: "QuickNote App", team: "Team Alpha", days: 3, techStack: ["React", "Firebase"], status: "Live" },
  { rank: 2, title: "StudyMatch", team: "InnovatorsX", days: 5, techStack: ["Next.js", "Supabase"], status: "Beta" },
  { rank: 3, title: "CampusEats", team: "FoodTech Crew", days: 7, techStack: ["Flutter", "Node.js"], status: "MVP" },
  { rank: 4, title: "SkillSwap Bot", team: "DevHustlers", days: 10, techStack: ["Python", "Telegram"], status: "Live" },
  { rank: 5, title: "EventRadar", team: "CampusConnect", days: 12, techStack: ["React Native", "AWS"], status: "Beta" },
];

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
};

const getRankBg = (rank: number) => {
  if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
  if (rank === 2) return "bg-gray-400/10 border-gray-400/30";
  if (rank === 3) return "bg-amber-600/10 border-amber-600/30";
  return "";
};

export const InnovationLeaderboard = () => {
  const [tab, setTab] = useState("ideas");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Innovation Leaderboard</h2>
          <p className="text-muted-foreground">Top performers across the Innovation Hub</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Ideas", value: "1,247", icon: Star, color: "text-yellow-500" },
          { label: "Active Creators", value: "389", icon: Flame, color: "text-orange-500" },
          { label: "Prototypes Built", value: "67", icon: Zap, color: "text-blue-500" },
          { label: "This Week", value: "+42", icon: TrendingUp, color: "text-green-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ideas" className="gap-2"><Star className="h-4 w-4" /> Top Ideas</TabsTrigger>
          <TabsTrigger value="creators" className="gap-2"><Flame className="h-4 w-4" /> Active Creators</TabsTrigger>
          <TabsTrigger value="prototypes" className="gap-2"><Zap className="h-4 w-4" /> Fastest Prototypes</TabsTrigger>
        </TabsList>

        {/* Top Ideas */}
        <TabsContent value="ideas" className="space-y-3 mt-4">
          {topIdeas.map((idea, i) => (
            <motion.div key={idea.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`${getRankBg(idea.rank)} transition-all hover:shadow-md`}>
                <CardContent className="p-4 flex items-center gap-4">
                  {getRankIcon(idea.rank)}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={idea.avatar} />
                    <AvatarFallback>{idea.author[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{idea.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{idea.author}</span>
                      <Badge variant="outline" className="text-[10px]">{idea.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <div className="text-center">
                      <p className="font-bold text-primary">{idea.upvotes}</p>
                      <p className="text-[10px] text-muted-foreground">upvotes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{idea.comments}</p>
                      <p className="text-[10px] text-muted-foreground">comments</p>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{idea.streak}d</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Active Creators */}
        <TabsContent value="creators" className="space-y-3 mt-4">
          {activeCreators.map((creator, i) => (
            <motion.div key={creator.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`${getRankBg(creator.rank)} transition-all hover:shadow-md`}>
                <CardContent className="p-4 flex items-center gap-4">
                  {getRankIcon(creator.rank)}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{creator.name}</h4>
                      <Badge variant="secondary" className="text-[10px]">{creator.level}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Progress value={(creator.points / 5000) * 100} className="h-1.5 flex-1 max-w-[120px]" />
                      <span className="text-xs text-muted-foreground">{creator.points} pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <div className="text-center">
                      <p className="font-bold">{creator.ideas}</p>
                      <p className="text-[10px] text-muted-foreground">ideas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{creator.contributions}</p>
                      <p className="text-[10px] text-muted-foreground">contrib.</p>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{creator.streak}d</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Fastest Prototypes */}
        <TabsContent value="prototypes" className="space-y-3 mt-4">
          {fastestPrototypes.map((proto, i) => (
            <motion.div key={proto.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`${getRankBg(proto.rank)} transition-all hover:shadow-md`}>
                <CardContent className="p-4 flex items-center gap-4">
                  {getRankIcon(proto.rank)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{proto.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">by {proto.team}</p>
                    <div className="flex gap-1 mt-2">
                      {proto.techStack.map(tech => (
                        <Badge key={tech} variant="outline" className="text-[10px]">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="font-bold text-primary">{proto.days}</p>
                      <p className="text-[10px] text-muted-foreground">days</p>
                    </div>
                    <Badge variant={proto.status === "Live" ? "default" : "secondary"} className="text-xs">
                      {proto.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
