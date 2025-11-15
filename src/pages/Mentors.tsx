import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookingModal } from "@/components/BookingModal";
import {
  Users,
  Star,
  CheckCircle2,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Video,
  MessageSquare,
  Award,
  Clock,
  DollarSign,
  Globe,
} from "lucide-react";
import { mockMentors, mockTimeSlots } from "@/lib/mockMentorData";
import type { Mentor } from "@/lib/mockMentorData";

const Mentors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [mentorToBook, setMentorToBook] = useState<Mentor | null>(null);

  const allExpertise = Array.from(
    new Set(mockMentors.flatMap((m) => m.expertise))
  );

  const filteredMentors = mockMentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise.some((exp) =>
        exp.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesExpertise =
      !selectedExpertise || mentor.expertise.includes(selectedExpertise);
    return matchesSearch && matchesExpertise;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const availableSlots = selectedMentor
    ? mockTimeSlots.filter(
        (slot) =>
          slot.mentorId === selectedMentor &&
          slot.available &&
          slot.date === selectedDate?.toISOString().split("T")[0]
      )
    : [];

  const handleBookSession = (mentor: Mentor, time: string) => {
    setMentorToBook(mentor);
    setSelectedTime(time);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />

      {/* Hero Section with Parallax */}
      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-3xl" />
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="down">
              <div className="mx-auto max-w-3xl text-center">
                <Badge variant="accent" className="mb-6">
                  <Users className="mr-1 h-3 w-3" />
                  Connect with Industry Experts
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                  Learn from the{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Best Mentors
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Get personalized guidance from experienced professionals in tech,
                  product, and career development. Book 1-on-1 sessions today.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </ParallaxSection>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <ScrollReveal delay={0.1}>
          <div className="mb-8 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, role, or expertise..."
                  className="pl-10 bg-card/50 backdrop-blur-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedExpertise === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedExpertise(null)}
              >
                All Skills
              </Button>
              {allExpertise.slice(0, 10).map((expertise) => (
                <Button
                  key={expertise}
                  variant={selectedExpertise === expertise ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedExpertise(expertise)}
                >
                  {expertise}
                </Button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.2}>
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, label: "Expert Mentors", value: "500+" },
              { icon: Video, label: "Sessions Booked", value: "10K+" },
              { icon: Award, label: "Success Stories", value: "5K+" },
            ].map((stat, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-sm border-primary/20"
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollReveal>

        {/* Mentors Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMentors.map((mentor, index) => (
            <ScrollReveal key={mentor.id} delay={index * 0.05} direction="scale">
              <Card className="card-hover overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                      <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-accent text-white">
                        {getInitials(mentor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{mentor.name}</h3>
                        {mentor.verified && (
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mentor.title}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {mentor.company}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-medium">{mentor.rating}</span>
                      <span className="text-muted-foreground">
                        ({mentor.reviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{mentor.sessions} sessions</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {mentor.bio}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {mentor.expertise.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mentor.expertise.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{mentor.availability}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>₹{mentor.pricePerHour}/hr</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {mentor.languages.join(", ")}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedMentor(mentor.id)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Book Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Book a Session with {mentor.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                              {getInitials(mentor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{mentor.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {mentor.title} at {mentor.company}
                            </p>
                            <p className="text-sm font-medium text-primary">
                              ₹{mentor.pricePerHour}/hour
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 font-medium">Select Date</h4>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) =>
                              date < new Date() ||
                              date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            }
                            className="rounded-lg border"
                          />
                        </div>

                        <div>
                          <h4 className="mb-3 font-medium">Available Time Slots</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {availableSlots.length > 0 ? (
                              availableSlots.map((slot) => (
                                <Button
                                  key={slot.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleBookSession(mentor, slot.time)}
                                >
                                  {slot.time}
                                </Button>
                              ))
                            ) : (
                              <p className="col-span-3 text-sm text-muted-foreground text-center py-4">
                                No slots available for this date. Try another day.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <ScrollReveal>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No mentors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        mentor={mentorToBook}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
      />
    </div>
  );
};

export default Mentors;
