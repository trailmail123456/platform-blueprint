import { useState, useEffect, useRef } from "react";
import { Send, Users, Sparkles, Plus, MessageCircle, ArrowUp, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  topic: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  mentor_led: boolean;
  participant_count: number;
  created_at: string;
}

interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: string;
  is_mentor_message: boolean;
  upvotes: number;
  created_at: string;
}

const defaultRooms: Omit<Room, "id" | "created_at">[] = [
  { name: "AI Startups", topic: "ai-startups", description: "Discuss AI/ML startup ideas, tools, and trends", icon: "🤖", is_active: true, mentor_led: false, participant_count: 34 },
  { name: "App Ideas", topic: "app-ideas", description: "Share and refine mobile & web app concepts", icon: "📱", is_active: true, mentor_led: false, participant_count: 28 },
  { name: "EdTech", topic: "edtech", description: "Innovation in education technology", icon: "📚", is_active: true, mentor_led: true, participant_count: 19 },
  { name: "Web3 & Crypto", topic: "web3", description: "Blockchain, DeFi, and decentralized apps", icon: "⛓️", is_active: true, mentor_led: false, participant_count: 22 },
  { name: "UI/UX Design", topic: "ui-ux", description: "Design thinking, prototyping, and user research", icon: "🎨", is_active: true, mentor_led: true, participant_count: 15 },
  { name: "Social Impact", topic: "social-impact", description: "Tech for good — sustainability, health, accessibility", icon: "🌍", is_active: true, mentor_led: false, participant_count: 12 },
];

const mockMessages: Record<string, { user: string; content: string; isMentor: boolean; time: string }[]> = {
  "ai-startups": [
    { user: "Aman K.", content: "Has anyone tried fine-tuning LLMs for domain-specific customer support?", isMentor: false, time: "2m ago" },
    { user: "Dr. Sharma", content: "Great question! Fine-tuning works well but consider RAG first — it's cheaper and often sufficient for support use cases.", isMentor: true, time: "1m ago" },
    { user: "Priya S.", content: "I built a prototype using RAG + Gemini. Happy to share the architecture!", isMentor: false, time: "30s ago" },
  ],
  "app-ideas": [
    { user: "Rahul M.", content: "What if we built a campus-specific lost & found app with image recognition?", isMentor: false, time: "5m ago" },
    { user: "Sneha T.", content: "Love it! Could integrate with campus security systems too.", isMentor: false, time: "3m ago" },
  ],
};

export const BrainstormRooms = () => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ user: string; content: string; isMentor: boolean; time: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "", topic: "" });
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedRoomData = defaultRooms.find(r => r.topic === selectedRoom);

  useEffect(() => {
    if (selectedRoom && mockMessages[selectedRoom]) {
      setMessages(mockMessages[selectedRoom]);
    } else {
      setMessages([]);
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      user: user?.email?.split("@")[0] || "You",
      content: newMessage,
      isMentor: false,
      time: "now",
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage("");
    toast.success("Message sent!");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCreateRoom = () => {
    if (!newRoom.name.trim()) return;
    toast.success(`Room "${newRoom.name}" created!`);
    setCreateOpen(false);
    setNewRoom({ name: "", description: "", topic: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Brainstorm Rooms
          </h2>
          <p className="text-muted-foreground">Join topic-based discussions and brainstorm with peers & mentors</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Brainstorm Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Room name" value={newRoom.name} onChange={e => setNewRoom(prev => ({ ...prev, name: e.target.value }))} />
              <Textarea placeholder="Description" value={newRoom.description} onChange={e => setNewRoom(prev => ({ ...prev, description: e.target.value }))} />
              <Button onClick={handleCreateRoom} className="w-full">Create Room</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Room List */}
        <div className="lg:col-span-1 space-y-3">
          {defaultRooms.map((room, i) => (
            <motion.div key={room.topic} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${selectedRoom === room.topic ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                onClick={() => setSelectedRoom(room.topic)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{room.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{room.name}</h3>
                        {room.mentor_led && (
                          <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                            <GraduationCap className="h-3 w-3" />
                            Mentor
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{room.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.participant_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {mockMessages[room.topic]?.length || 0}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedRoom ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{selectedRoomData?.icon}</span>
                    <div>
                      <h3 className="font-semibold">{selectedRoomData?.name}</h3>
                      <p className="text-xs text-muted-foreground">{selectedRoomData?.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedRoomData?.mentor_led && (
                      <Badge variant="accent" className="text-xs">Mentor-Led</Badge>
                    )}
                    <Badge variant="outline" className="text-xs gap-1">
                      <Users className="h-3 w-3" />
                      {selectedRoomData?.participant_count} online
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 group"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className={msg.isMentor ? "bg-primary text-primary-foreground" : "bg-muted"}>
                            {msg.user[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{msg.user}</span>
                            {msg.isMentor && (
                              <Badge variant="secondary" className="text-[10px] py-0 gap-1">
                                <GraduationCap className="h-2.5 w-2.5" />
                                Mentor
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{msg.time}</span>
                          </div>
                          <p className={`text-sm mt-1 ${msg.isMentor ? "bg-primary/5 p-2 rounded-lg border border-primary/20" : ""}`}>
                            {msg.content}
                          </p>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 mt-1 gap-1">
                            <ArrowUp className="h-3 w-3" /> Upvote
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Share your thoughts..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center space-y-3">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-lg font-semibold text-muted-foreground">Select a room to join</h3>
                <p className="text-sm text-muted-foreground/70">Pick a topic and start brainstorming with the community</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
