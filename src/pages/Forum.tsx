import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ThumbsUp, Pin, Clock, TrendingUp } from "lucide-react";

const mockThreads = [
  {
    id: 1,
    title: "Best resources for learning React in 2024?",
    author: "Priya Sharma",
    category: "Web Development",
    replies: 24,
    views: 1250,
    likes: 45,
    isPinned: true,
    timeAgo: "2 hours ago",
    tags: ["React", "JavaScript", "Frontend"]
  },
  {
    id: 2,
    title: "How to prepare for campus placements?",
    author: "Arjun Patel",
    category: "Career Advice",
    replies: 67,
    views: 3420,
    likes: 128,
    isPinned: false,
    timeAgo: "5 hours ago",
    tags: ["Placements", "Interview", "Career"]
  },
  {
    id: 3,
    title: "Semester exam tips and tricks",
    author: "Sneha Reddy",
    category: "Academic",
    replies: 15,
    views: 890,
    likes: 32,
    isPinned: false,
    timeAgo: "1 day ago",
    tags: ["Exams", "Study Tips"]
  }
];

const Forum = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-3xl" />
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="default" className="mb-6">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Community Discussion
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Student{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Forum
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Connect with peers, share knowledge, and get answers to your questions.
                </p>
                <Button size="lg" className="hover-scale">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start New Thread
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-6 max-w-4xl mx-auto">
          <Input
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8 max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {mockThreads.map((thread, index) => (
              <ScrollReveal key={thread.id} delay={0.1 * (index + 1)}>
                <Card className="hover-lift cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {thread.isPinned && <Pin className="h-4 w-4 text-primary" />}
                          <Badge variant="secondary">{thread.category}</Badge>
                        </div>
                        <h3 className="text-lg font-bold mb-2">{thread.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {thread.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          by {thread.author} • {thread.timeAgo}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{thread.replies} replies</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{thread.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{thread.views} views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </TabsContent>

          <TabsContent value="trending">
            <p className="text-center text-muted-foreground">Trending discussions will appear here</p>
          </TabsContent>

          <TabsContent value="recent">
            <p className="text-center text-muted-foreground">Recent discussions will appear here</p>
          </TabsContent>

          <TabsContent value="unanswered">
            <p className="text-center text-muted-foreground">Unanswered questions will appear here</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Forum;
