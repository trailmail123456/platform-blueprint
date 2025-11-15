import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Lightbulb, Rocket, Users, Heart, MessageSquare, Share2 } from "lucide-react";

const mockIdeas = [
  {
    id: 1,
    title: "AI-Powered Study Buddy",
    description: "An AI assistant that creates personalized study plans and quizzes based on your learning style.",
    category: "EdTech",
    author: "Priya S.",
    likes: 145,
    comments: 23,
    tags: ["AI", "Machine Learning", "Education"],
  },
  {
    id: 2,
    title: "Campus Food Delivery Network",
    description: "Connect students who cook with those who need meals. Sustainable and affordable food sharing.",
    category: "Social Impact",
    author: "Rahul M.",
    likes: 89,
    comments: 15,
    tags: ["Food", "Sustainability", "Community"],
  },
];

const InnovationHub = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />

      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-3xl" />
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Lightbulb className="mr-1 h-3 w-3" />
                  Innovation & Startups
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Share Your{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Big Ideas
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Connect with fellow innovators, find co-founders, and bring your startup ideas to life.
                </p>
                <Button size="lg" className="gap-2">
                  <Rocket className="h-5 w-5" />
                  Post Your Idea
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockIdeas.map((idea, index) => (
            <ScrollReveal key={idea.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">{idea.category}</Badge>
                  <h3 className="text-xl font-bold">{idea.title}</h3>
                  <p className="text-sm text-muted-foreground">by {idea.author}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{idea.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {idea.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Heart className="h-4 w-4" />
                    {idea.likes}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {idea.comments}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 ml-auto">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InnovationHub;
