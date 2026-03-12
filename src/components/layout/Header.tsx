import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { GraduationCap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    title: "Academic & Career",
    items: [
      { title: "Notes Hub", href: "/notes", desc: "Share and access study materials" },
      { title: "Resume Builder", href: "/resume-builder", desc: "ATS-optimized resume tips" },
      { title: "College Insights", href: "/college-insights", desc: "Reviews and comparisons" },
      { title: "Innovation Hub", href: "/innovation-hub", desc: "Startup ideas and pitches" },
      { title: "Events & Hackathons", href: "/events", desc: "Competitions and workshops" },
      { title: "Scholarships", href: "/scholarships", desc: "Find funding opportunities" },
      { title: "Courses & Internships", href: "/courses", desc: "Learning resources" },
      { title: "Roadmaps", href: "/roadmaps", desc: "Career path guidance" },
      { title: "Mentors", href: "/mentors", desc: "Book guidance sessions" },
      { title: "Community Forum", href: "/community", desc: "Ask and discuss" },
      { title: "Jobs Portal", href: "/jobs", desc: "Career opportunities" },
      { title: "Placement Cell", href: "/placement", desc: "Interview prep resources" },
    ],
  },
  {
    title: "Learning & Skills",
    items: [
      { title: "Quiz & Tests", href: "/quiz", desc: "Mock exams and practice" },
      { title: "Skill Zone", href: "/skills", desc: "Video courses and certifications" },
      { title: "Tech News", href: "/news", desc: "Latest AI and tech updates" },
      { title: "Virtual Classroom", href: "/virtual-classroom", desc: "Live learning sessions" },
      { title: "Flashcards", href: "/flashcards", desc: "Spaced repetition study" },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { title: "Study Groups", href: "/study-groups", desc: "Virtual study rooms" },
      { title: "Team Hunt", href: "/team-hunt", desc: "Find collaborators" },
      { title: "Tech Vault", href: "/tech-vault", desc: "Code snippets and docs" },
      { title: "Skill Swap", href: "/skill-swap", desc: "Exchange knowledge" },
      { title: "Creators Zone", href: "/creators", desc: "Content platform" },
      { title: "Q&A Board", href: "/qa-board", desc: "Stack Overflow style" },
      { title: "Forum", href: "/forum", desc: "Discussion threads" },
    ],
  },
  {
    title: "Engagement",
    items: [
      { title: "Daily Hacks", href: "/daily-hacks", desc: "Tips and showcases" },
      { title: "Gamification", href: "/gamification", desc: "Points and badges" },
      { title: "Wellness Tracker", href: "/wellness", desc: "Mental health support" },
      { title: "Sessions", href: "/sessions", desc: "Study & mentoring sessions" },
    ],
  },
  {
    title: "Local Services",
    items: [
      { title: "Room Rentals", href: "/room-rentals", desc: "Find accommodation" },
      { title: "Hostel Info", href: "/hostels", desc: "Campus housing" },
      { title: "Food & Restaurants", href: "/food", desc: "Student discounts" },
      { title: "Transport", href: "/transport", desc: "Bus routes and shuttles" },
      { title: "Repair Services", href: "/repair", desc: "Maintenance help" },
      { title: "Shopping", href: "/shopping", desc: "Local stores" },
    ],
  },
  {
    title: "More",
    items: [
      { title: "Post Your Skill", href: "/post-skill", desc: "Freelance services" },
      { title: "Find Roommate", href: "/roommate-finder", desc: "Connect with peers" },
      { title: "Dashboard", href: "/dashboard", desc: "Your personal hub" },
      { title: "Analytics", href: "/analytics", desc: "Your study stats" },
      { title: "Admin Panel", href: "/admin", desc: "Platform management" },
    ],
  },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow transition-all group-hover:scale-110">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StudentHub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block">
          <NavigationMenu>
            <NavigationMenuList>
              {navigationGroups.map((group) => (
                <NavigationMenuItem key={group.title}>
                  <NavigationMenuTrigger className="text-sm font-medium">
                    {group.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[600px] gap-3 p-6 md:grid-cols-2">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.href}
                              className={cn(
                                "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all hover:bg-accent/50 hover:translate-x-1",
                                location.pathname === item.href && "bg-accent/30"
                              )}
                            >
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {item.desc}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="hero" size="sm" className="hidden md:inline-flex">
              Get Started
            </Button>
          </Link>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl lg:hidden max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {navigationGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "block rounded-lg p-3 transition-all hover:bg-accent/50",
                          location.pathname === item.href && "bg-accent/30"
                        )}
                      >
                        <div className="font-medium">{item.title}</div>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
              <Link to="/auth">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
