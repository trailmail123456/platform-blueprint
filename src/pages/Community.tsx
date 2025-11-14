import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  ArrowBigUp,
  Pin,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { mockThreads } from "@/lib/mockData";

const Community = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { value: "all", label: "All Topics" },
    { value: "Career", label: "Career" },
    { value: "Learning", label: "Learning" },
    { value: "Study Groups", label: "Study Groups" },
    { value: "Technical", label: "Technical" },
  ];

  const filteredThreads =
    selectedCategory === "all"
      ? mockThreads
      : mockThreads.filter((thread) => thread.category === selectedCategory);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Community Forum</h1>
          </div>
          <Button variant="hero" size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            New Thread
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">5,234</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold">12,456</div>
                <div className="text-sm text-muted-foreground">Total Threads</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">89%</div>
                <div className="text-sm text-muted-foreground">Questions Solved</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start">
              {categories.map((category) => (
                <TabsTrigger key={category.value} value={category.value}>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Threads List */}
        <div className="space-y-4">
          {filteredThreads.map((thread, index) => (
            <Card
              key={thread.id}
              className={`card-hover transition-all animate-fade-in ${
                thread.isPinned ? "border-2 border-accent/30 bg-accent/5" : ""
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Left Section - Stats */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex h-auto flex-col gap-1 px-2 py-2"
                    >
                      <ArrowBigUp className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-semibold">{thread.upvotes}</span>
                    </Button>
                    <div className="flex flex-col items-center text-sm text-muted-foreground">
                      <Eye className="h-4 w-4 mb-1" />
                      <span>{thread.views}</span>
                    </div>
                  </div>

                  {/* Middle Section - Content */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {thread.isPinned && (
                            <Pin className="h-4 w-4 text-accent" />
                          )}
                          {thread.isSolved && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                          <Badge variant="secondary">{thread.category}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                          {thread.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {thread.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {thread.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(thread.author)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <span className="font-medium">{thread.author}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {formatTimeAgo(thread.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{thread.replies}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredThreads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No threads found</h3>
            <p className="mb-4 text-muted-foreground">
              Be the first to start a discussion in this category
            </p>
            <Button variant="hero">Create Thread</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
