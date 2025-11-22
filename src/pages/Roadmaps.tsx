import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Download, BookOpen, Code, Brain, Rocket, CheckCircle2 } from "lucide-react";

const mockRoadmaps = [
  {
    id: 1,
    title: "Full Stack Web Development",
    category: "Web Development",
    difficulty: "Intermediate",
    duration: "6 months",
    steps: 12,
    completed: 5,
    description: "Complete roadmap from HTML/CSS to MERN stack",
    topics: ["HTML/CSS", "JavaScript", "React", "Node.js", "MongoDB"]
  },
  {
    id: 2,
    title: "Data Science & ML",
    category: "Data Science",
    difficulty: "Advanced",
    duration: "8 months",
    steps: 15,
    completed: 3,
    description: "Master Python, statistics, and machine learning",
    topics: ["Python", "NumPy", "Pandas", "Scikit-learn", "TensorFlow"]
  },
  {
    id: 3,
    title: "Android Development",
    category: "Mobile Development",
    difficulty: "Beginner",
    duration: "4 months",
    steps: 10,
    completed: 0,
    description: "Build Android apps with Kotlin and Jetpack Compose",
    topics: ["Kotlin", "Android SDK", "Jetpack Compose", "Firebase"]
  }
];

const mockCheatSheets = [
  {
    id: 1,
    title: "Git Commands Cheat Sheet",
    category: "Version Control",
    downloads: 1250,
    pages: 2,
    format: "PDF"
  },
  {
    id: 2,
    title: "Python Quick Reference",
    category: "Programming",
    downloads: 2340,
    pages: 4,
    format: "PDF"
  },
  {
    id: 3,
    title: "SQL Queries Reference",
    category: "Database",
    downloads: 1890,
    pages: 3,
    format: "PDF"
  }
];

const Roadmaps = () => {
  const [selectedTab, setSelectedTab] = useState("roadmaps");
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
                  <Map className="mr-1 h-3 w-3" />
                  Learning Paths
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Roadmaps &{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Cheat Sheets
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Follow structured learning paths and access quick reference guides for any technology.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="roadmaps">Roadmaps</TabsTrigger>
            <TabsTrigger value="cheatsheets">Cheat Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="roadmaps" className="space-y-6">
            <div className="mb-6 max-w-2xl mx-auto">
              <Input
                placeholder="Search roadmaps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {mockRoadmaps.map((roadmap, index) => (
                <ScrollReveal key={roadmap.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary">{roadmap.category}</Badge>
                        <Badge variant="outline">{roadmap.difficulty}</Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{roadmap.title}</h3>
                      <p className="text-sm text-muted-foreground">{roadmap.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{roadmap.completed}/{roadmap.steps} steps</span>
                        </div>
                        <Progress value={(roadmap.completed / roadmap.steps) * 100} />
                        
                        <div className="flex flex-wrap gap-2">
                          {roadmap.topics.slice(0, 3).map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {roadmap.topics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{roadmap.topics.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button className="flex-1" size="sm">
                            <BookOpen className="mr-2 h-4 w-4" />
                            View Path
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cheatsheets" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {mockCheatSheets.map((sheet, index) => (
                <ScrollReveal key={sheet.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary">{sheet.category}</Badge>
                        <Badge variant="outline">{sheet.format}</Badge>
                      </div>
                      <h3 className="text-lg font-bold">{sheet.title}</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span>{sheet.pages} pages</span>
                        <span>{sheet.downloads} downloads</span>
                      </div>
                      <Button className="w-full" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Roadmaps;
