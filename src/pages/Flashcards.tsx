import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, ChevronLeft, ChevronRight, Brain, Sparkles } from "lucide-react";

const Flashcards = () => {
  const [flipped, setFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  const flashcards = [
    { front: "What is React?", back: "A JavaScript library for building user interfaces" },
    { front: "What is JSX?", back: "A syntax extension for JavaScript that looks like HTML" },
    { front: "What is a Hook?", back: "Functions that let you use state and other React features" },
  ];

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
                  Active Learning
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Flashcards &{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Mind Maps
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Create, study, and share flashcards. Build visual mind maps for better understanding.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <ScrollReveal delay={0.1}>
          <div className="mb-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Card {currentCard + 1} of {flashcards.length}
            </p>
            <Card
              className="max-w-2xl mx-auto h-96 cursor-pointer hover-scale"
              onClick={() => setFlipped(!flipped)}
            >
              <CardContent className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <p className="text-2xl font-bold mb-4">
                    {flipped ? flashcards[currentCard].back : flashcards[currentCard].front}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {flipped ? "Answer" : "Question"} • Click to flip
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
                disabled={currentCard === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFlipped(!flipped)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1))}
                disabled={currentCard === flashcards.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <Card className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">Mind Map Creator</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Create visual connections between concepts for better retention
              </p>
              <Button className="w-full">Create New Mind Map</Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Flashcards;
