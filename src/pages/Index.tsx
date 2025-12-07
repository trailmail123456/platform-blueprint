import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnboardingModal } from "@/components/OnboardingModal";
import {
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Lightbulb,
  Award,
  Target,
  Zap,
  ArrowRight,
} from "lucide-react";

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleOnboardingComplete = (preferences: any) => {
    console.log("Onboarding completed with preferences:", preferences);
  };

  const features = [
    {
      icon: BookOpen,
      title: "Notes Hub",
      description: "Share and access quality study materials from peers across all subjects",
      color: "text-primary",
    },
    {
      icon: Calendar,
      title: "Events & Hackathons",
      description: "Never miss opportunities - track competitions and events with registration",
      color: "text-accent",
    },
    {
      icon: MessageSquare,
      title: "Community Forum",
      description: "Connect with students, ask questions, and share knowledge in vibrant discussions",
      color: "text-success",
    },
    {
      icon: Lightbulb,
      title: "Innovation Hub",
      description: "Showcase your startup ideas, find co-founders, and get mentor guidance",
      color: "text-warning",
    },
    {
      icon: TrendingUp,
      title: "Career Resources",
      description: "Access jobs, internships, resume tips, and ATS optimization tools",
      color: "text-primary",
    },
    {
      icon: Users,
      title: "Study Groups",
      description: "Form teams, join virtual study rooms, and collaborate on projects",
      color: "text-accent",
    },
  ];

  const stats = [
    { label: "Active Students", value: "10K+", icon: Users },
    { label: "Study Resources", value: "5K+", icon: BookOpen },
    { label: "Events Listed", value: "500+", icon: Calendar },
    { label: "Success Stories", value: "2K+", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>
      
      <OnboardingModal onComplete={handleOnboardingComplete} />
      <Header />

      {/* Hero Section */}
      <ParallaxSection speed={0.3}>
        <section className="relative overflow-hidden py-20 md:py-32">
          <ScrollReveal direction="down">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-4xl text-center">
                <Badge variant="accent" className="mb-6 animate-fade-in">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Your All-in-One Student Platform
                </Badge>
                <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                  Where Students{" "}
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse-glow">
                    Succeed Together
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                  Connect, learn, and grow with a comprehensive platform designed for student success. Access notes, join events, find mentors, and build your career - all in one place.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button variant="hero" size="xl" className="group">
                    Explore Platform
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button variant="outline" size="xl">
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </ParallaxSection>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <ScrollReveal key={index} delay={index * 0.1} direction="scale">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <ParallaxSection speed={0.2}>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <ScrollReveal direction="up">
              <div className="mb-12 text-center">
                <Badge variant="outline" className="mb-4">
                  <Target className="mr-1 h-3 w-3" />
                  Platform Features
                </Badge>
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                  Everything You Need to Succeed
                </h2>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  A comprehensive suite of tools and resources designed to support your academic journey and career growth
                </p>
              </div>
            </ScrollReveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <ScrollReveal key={index} delay={index * 0.05} direction="scale">
                  <div className="group card-hover rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10 ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                    <Button variant="ghost" size="sm" className="mt-4 group-hover:text-primary">
                      Learn more
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ParallaxSection>

      {/* CTA Section */}
      <ParallaxSection speed={0.1}>
        <section className="border-t border-border/40 bg-card/30 backdrop-blur-sm py-20">
          <div className="container mx-auto px-4">
              <ScrollReveal direction="up">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-glow">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                    Ready to Transform Your Student Experience?
                  </h2>
                  <p className="mb-8 text-lg text-muted-foreground">
                    Join thousands of students already using StudentHub to excel in their academics and career
                  </p>
                  <Button variant="hero" size="xl" className="group">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </ParallaxSection>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">StudentHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering students with the tools they need to succeed.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/notes" className="hover:text-foreground">Notes Hub</Link></li>
                <li><Link to="/events" className="hover:text-foreground">Events</Link></li>
                <li><Link to="/community" className="hover:text-foreground">Community</Link></li>
                <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            © 2025 StudentHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
