import { Header } from "@/components/layout/Header";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, MessageSquare, AlertCircle, TrendingUp, Activity } from "lucide-react";

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-accent/5">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <ScrollReveal>
          <div className="mb-8">
            <Badge variant="default" className="mb-4">
              <Activity className="mr-1 h-3 w-3" />
              Admin Dashboard
            </Badge>
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage platform content, users, and analytics</p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ScrollReveal delay={0.1}>
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 mb-3 text-primary" />
                <p className="text-3xl font-bold mb-1">1,234</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <FileText className="h-8 w-8 mb-3 text-accent" />
                <p className="text-3xl font-bold mb-1">567</p>
                <p className="text-sm text-muted-foreground">Content Items</p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <MessageSquare className="h-8 w-8 mb-3 text-success" />
                <p className="text-3xl font-bold mb-1">2,890</p>
                <p className="text-sm text-muted-foreground">Active Discussions</p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <AlertCircle className="h-8 w-8 mb-3 text-destructive" />
                <p className="text-3xl font-bold mb-1">12</p>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.5}>
            <Card className="hover-lift">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 mb-3 text-warning" />
                <p className="text-3xl font-bold mb-1">+24%</p>
                <p className="text-sm text-muted-foreground">Growth This Month</p>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.6}>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Recent Activity</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity feed will appear here</p>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default AdminPanel;
