import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Brain, Clock, Trophy, Target, Play } from "lucide-react";

const mockQuizzes = [
  {
    id: 1,
    title: "Data Structures Mock Test",
    questions: 50,
    duration: "60 min",
    difficulty: "Medium",
    attempts: 1240,
    category: "CS Fundamentals",
  },
  {
    id: 2,
    title: "Aptitude Practice Quiz",
    questions: 30,
    duration: "45 min",
    difficulty: "Easy",
    attempts: 2100,
    category: "Aptitude",
  },
  {
    id: 3,
    title: "Advanced Algorithms Test",
    questions: 40,
    duration: "90 min",
    difficulty: "Hard",
    attempts: 680,
    category: "Advanced",
  },
];

const QuizHub = () => {
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
                  <Brain className="mr-1 h-3 w-3" />
                  Test Your Knowledge
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Quiz &{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Mock Tests
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Practice with timed mock tests and detailed analytics to ace your exams.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockQuizzes.map((quiz, index) => (
            <ScrollReveal key={quiz.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">{quiz.category}</Badge>
                  <h3 className="text-xl font-bold">{quiz.title}</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.questions} Questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={
                        quiz.difficulty === "Easy" ? "secondary" : 
                        quiz.difficulty === "Medium" ? "default" : 
                        "destructive"
                      }
                    >
                      {quiz.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      <span>{quiz.attempts} attempts</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    Start Quiz
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

export default QuizHub;
