import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Users, Video, MessageSquare, Lock, Globe } from "lucide-react";

const mockGroups = [
  {
    id: 1,
    name: "DSA Study Group",
    members: 24,
    privacy: "Public",
    activeRooms: 2,
    description: "Daily DSA practice and doubt solving sessions",
  },
  {
    id: 2,
    name: "Web Dev Learners",
    members: 45,
    privacy: "Public",
    activeRooms: 3,
    description: "Learn modern web development together",
  },
  {
    id: 3,
    name: "AI/ML Research",
    members: 18,
    privacy: "Private",
    activeRooms: 1,
    description: "Deep learning paper discussions and implementations",
  },
];

const StudyGroups = () => {
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
                  <Users className="mr-1 h-3 w-3" />
                  Collaborative Learning
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Study{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Together
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Join study groups, virtual rooms, and collaborate with peers.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockGroups.map((group, index) => (
            <ScrollReveal key={group.id} delay={0.1 * (index + 1)}>
              <Card className="hover-scale">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={group.privacy === "Public" ? "secondary" : "outline"}>
                      {group.privacy === "Public" ? (
                        <Globe className="mr-1 h-3 w-3" />
                      ) : (
                        <Lock className="mr-1 h-3 w-3" />
                      )}
                      {group.privacy}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.members}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{group.name}</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    <span className="text-sm">{group.activeRooms} active rooms</span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Button>
                  <Button size="sm" className="flex-1">Join Group</Button>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;
