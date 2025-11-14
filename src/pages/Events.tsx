import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { mockEvents } from "@/lib/mockData";

const Events = () => {
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredEvents =
    selectedType === "all"
      ? mockEvents
      : mockEvents.filter((event) => event.type === selectedType);

  const getEventTypeColor = (type: string) => {
    const colors = {
      hackathon: "accent",
      competition: "warning",
      workshop: "success",
      seminar: "secondary",
    };
    return colors[type as keyof typeof colors] || "default";
  };

  const getModeIcon = (mode: string) => {
    return mode === "online" ? "🌐" : mode === "offline" ? "📍" : "🔄";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8">
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="hackathon">Hackathons</TabsTrigger>
                <TabsTrigger value="competition">Competitions</TabsTrigger>
                <TabsTrigger value="workshop">Workshops</TabsTrigger>
                <TabsTrigger value="seminar">Seminars</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </Tabs>
        </div>

        {/* Featured Events */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Featured Events
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {filteredEvents
              .filter((event) => event.featured)
              .map((event) => (
                <Card
                  key={event.id}
                  className="card-hover overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 animate-fade-in"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant={getEventTypeColor(event.type) as any}>
                            {event.type}
                          </Badge>
                          <Badge variant="outline">
                            {getModeIcon(event.mode)} {event.mode}
                          </Badge>
                          {event.prize && (
                            <Badge variant="success">
                              <Trophy className="mr-1 h-3 w-3" />
                              {event.prize}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-bold">{event.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-warning" />
                        <span>{getDaysUntil(event.deadline)} days left</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.registrations}/{event.capacity}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3">
                    <Button variant="hero" className="w-full group">
                      Register Now
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </div>

        {/* All Events */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">
            Upcoming Events
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents
              .filter((event) => !event.featured)
              .map((event) => (
                <Card
                  key={event.id}
                  className="card-hover overflow-hidden animate-fade-in"
                >
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={getEventTypeColor(event.type) as any}>
                        {event.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getModeIcon(event.mode)} {event.mode}
                      </Badge>
                    </div>
                    <h3 className="font-semibold line-clamp-2">{event.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    {event.prize && (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <Trophy className="h-4 w-4" />
                        <span>{event.prize}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-3">
                    <Button variant="default" size="sm" className="w-full">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No events found</h3>
            <p className="text-muted-foreground">
              Try selecting a different category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
