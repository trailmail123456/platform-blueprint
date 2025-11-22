import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Calendar, Clock, Users, Star, BookOpen } from "lucide-react";

const mockSessions = [
  {
    id: 1,
    title: "System Design Fundamentals",
    mentor: "Rahul Verma",
    type: "Mentor Session",
    date: "Tomorrow, 4:00 PM",
    duration: "60 min",
    participants: 8,
    maxParticipants: 10,
    rating: 4.9,
    price: "Free",
    status: "upcoming"
  },
  {
    id: 2,
    title: "React Advanced Patterns",
    mentor: "Priya Singh",
    type: "Group Session",
    date: "Mar 25, 6:00 PM",
    duration: "90 min",
    participants: 15,
    maxParticipants: 20,
    rating: 4.8,
    price: "₹199",
    status: "upcoming"
  },
  {
    id: 3,
    title: "Interview Preparation",
    mentor: "Arjun Patel",
    type: "1-on-1 Session",
    date: "Mar 26, 2:00 PM",
    duration: "45 min",
    participants: 1,
    maxParticipants: 1,
    rating: 5.0,
    price: "₹499",
    status: "booked"
  }
];

const Sessions = () => {
  const [selectedTab, setSelectedTab] = useState("upcoming");

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
                  <Video className="mr-1 h-3 w-3" />
                  Learning Sessions
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Mentor &{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Peer Sessions
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Learn from experienced mentors and collaborate with peers in live interactive sessions.
                </p>
                <Button size="lg" className="hover-scale">
                  <Calendar className="mr-2 h-4 w-4" />
                  Book a Session
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {mockSessions.map((session, index) => (
                <ScrollReveal key={session.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary">{session.type}</Badge>
                        <Badge variant={session.status === "booked" ? "default" : "outline"}>
                          {session.price}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{session.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>by {session.mentor}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span>{session.rating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{session.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{session.duration}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{session.participants}/{session.maxParticipants} participants</span>
                        </div>
                        <Button className="w-full" variant={session.status === "booked" ? "default" : "outline"}>
                          {session.status === "booked" ? "Join Session" : "Book Now"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <p className="text-center text-muted-foreground">Past sessions will appear here</p>
          </TabsContent>

          <TabsContent value="recordings">
            <p className="text-center text-muted-foreground">Session recordings will appear here</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Sessions;
