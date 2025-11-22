import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Users, Calendar, Clock, Mic, MicOff, VideoOff, Hand, MessageSquare, Monitor } from "lucide-react";

const mockUpcomingClasses = [
  {
    id: 1,
    title: "Data Structures - Arrays & Linked Lists",
    instructor: "Dr. Rajesh Kumar",
    time: "Today, 2:00 PM",
    duration: "90 min",
    attendees: 45,
    status: "live"
  },
  {
    id: 2,
    title: "Web Development - React Hooks Deep Dive",
    instructor: "Prof. Meera Shah",
    time: "Tomorrow, 10:00 AM",
    duration: "120 min",
    attendees: 38,
    status: "scheduled"
  },
  {
    id: 3,
    title: "Machine Learning Fundamentals",
    instructor: "Dr. Amit Verma",
    time: "Mar 25, 3:00 PM",
    duration: "90 min",
    attendees: 52,
    status: "scheduled"
  },
];

const mockRecordings = [
  {
    id: 1,
    title: "Introduction to Algorithms",
    instructor: "Dr. Priya Sharma",
    date: "Mar 18, 2024",
    duration: "85 min",
    views: 234
  },
  {
    id: 2,
    title: "Database Management Systems",
    instructor: "Prof. Suresh Reddy",
    date: "Mar 15, 2024",
    duration: "100 min",
    views: 189
  },
];

const VirtualClassroom = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

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
                  Live Learning
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Virtual{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Classroom
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Interactive live classes with screen sharing, whiteboard, and real-time collaboration.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" className="hover-scale">
                    <Video className="mr-2 h-4 w-4" />
                    Join Live Class
                  </Button>
                  <Button size="lg" variant="outline" className="hover-scale">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid gap-6 max-w-4xl mx-auto">
              {mockUpcomingClasses.map((classItem, index) => (
                <ScrollReveal key={classItem.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={classItem.status === "live" ? "default" : "secondary"}>
                              {classItem.status === "live" && <div className="h-2 w-2 rounded-full bg-destructive animate-pulse mr-1" />}
                              {classItem.status === "live" ? "LIVE NOW" : "Scheduled"}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold mb-1">{classItem.title}</h3>
                          <p className="text-sm text-muted-foreground">by {classItem.instructor}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{classItem.attendees} students</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        variant={classItem.status === "live" ? "default" : "outline"}
                        size="lg"
                      >
                        {classItem.status === "live" ? "Join Now" : "Set Reminder"}
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            {/* Live Class Controls Demo */}
            <ScrollReveal delay={0.4}>
              <Card className="max-w-4xl mx-auto mt-8">
                <CardHeader>
                  <h3 className="text-xl font-bold">Live Class Controls</h3>
                  <p className="text-sm text-muted-foreground">Available during active sessions</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button 
                      variant={isMuted ? "destructive" : "outline"} 
                      size="lg"
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover-scale"
                    >
                      {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                      {isMuted ? "Unmute" : "Mute"}
                    </Button>
                    <Button 
                      variant={isVideoOff ? "destructive" : "outline"} 
                      size="lg"
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className="hover-scale"
                    >
                      {isVideoOff ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                      {isVideoOff ? "Start Video" : "Stop Video"}
                    </Button>
                    <Button variant="outline" size="lg" className="hover-scale">
                      <Monitor className="mr-2 h-4 w-4" />
                      Share Screen
                    </Button>
                    <Button variant="outline" size="lg" className="hover-scale">
                      <Hand className="mr-2 h-4 w-4" />
                      Raise Hand
                    </Button>
                    <Button variant="outline" size="lg" className="hover-scale">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </TabsContent>

          <TabsContent value="recordings" className="space-y-6">
            <div className="mb-6 max-w-4xl mx-auto">
              <Input 
                placeholder="Search recordings..." 
                className="w-full"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {mockRecordings.map((recording, index) => (
                <ScrollReveal key={recording.id} delay={0.1 * (index + 1)}>
                  <Card className="hover-lift cursor-pointer">
                    <CardHeader>
                      <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">{recording.title}</h3>
                      <p className="text-sm text-muted-foreground">by {recording.instructor}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <span>{recording.date}</span>
                        <span>{recording.duration}</span>
                        <span>{recording.views} views</span>
                      </div>
                      <Button className="w-full">Watch Recording</Button>
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

export default VirtualClassroom;