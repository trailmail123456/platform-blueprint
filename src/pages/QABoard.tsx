import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, ThumbsUp, Award, Search, Plus, TrendingUp } from "lucide-react";

const mockQuestions = [
  {
    id: 1,
    title: "How to prepare for campus placements in final year?",
    author: "Priya Sharma",
    category: "Placements",
    upvotes: 45,
    answers: 12,
    tags: ["Career", "Tips", "DSA"],
    isExpert: true,
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    title: "Best resources for learning React in 2024?",
    author: "Rahul Kumar",
    category: "Technology",
    upvotes: 38,
    answers: 8,
    tags: ["React", "Web Dev", "Learning"],
    isExpert: false,
    timestamp: "5 hours ago"
  },
  {
    id: 3,
    title: "How to balance academics with coding practice?",
    author: "Ananya Singh",
    category: "Study Tips",
    upvotes: 52,
    answers: 15,
    tags: ["Time Management", "Study"],
    isExpert: true,
    timestamp: "1 day ago"
  },
];

const QABoard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const categories = ["All", "Placements", "Technology", "Study Tips", "Projects", "Internships"];
  
  const filteredQuestions = mockQuestions.filter(q => 
    (selectedCategory === "All" || q.category === selectedCategory) &&
    (q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

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
                  Community Q&A
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Ask, Learn &{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Grow Together
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Get answers from seniors, peers, and experts. Share your knowledge and help others succeed.
                </p>
                
                <div className="flex gap-4 justify-center items-center flex-wrap">
                  <div className="relative flex-1 min-w-[300px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="hover-scale">
                        <Plus className="mr-2 h-4 w-4" />
                        Ask Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Ask Your Question</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input placeholder="Question title..." />
                        <Textarea placeholder="Describe your question in detail..." rows={6} />
                        <Input placeholder="Tags (comma separated)" />
                        <Button className="w-full">Post Question</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        {/* Category Filters */}
        <ScrollReveal>
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="hover-scale"
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollReveal>

        {/* Questions Grid */}
        <div className="grid gap-6 max-w-4xl mx-auto">
          {filteredQuestions.map((question, index) => (
            <ScrollReveal key={question.id} delay={0.1 * (index + 1)}>
              <Card className="hover-lift cursor-pointer transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{question.category}</Badge>
                        {question.isExpert && (
                          <Badge variant="default" className="gap-1">
                            <Award className="h-3 w-3" />
                            Expert
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                        {question.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {question.author} · {question.timestamp}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{question.upvotes} upvotes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{question.answers} answers</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* Trending Topics */}
        <ScrollReveal delay={0.3}>
          <Card className="mt-12 max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">Trending Topics</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["DSA", "System Design", "Resume Tips", "Interview Prep", "Open Source", "Hackathons"].map((topic) => (
                  <Badge key={topic} variant="secondary" className="cursor-pointer hover-scale">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default QABoard;