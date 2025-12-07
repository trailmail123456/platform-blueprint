import { useState } from "react";
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  upvotes: number;
  tags: string[];
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}

interface IdeaCardProps {
  idea: Idea;
  onUpvote: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  mvp: "bg-success/10 text-success",
  funded: "bg-accent/10 text-accent",
};

export const IdeaCard = ({ idea, onUpvote, onComment, onShare }: IdeaCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [upvotes, setUpvotes] = useState(idea.upvotes);

  const handleUpvote = () => {
    setIsLiked(!isLiked);
    setUpvotes((prev) => (isLiked ? prev - 1 : prev + 1));
    onUpvote(idea.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={idea.user?.avatar_url || ""} />
                <AvatarFallback>
                  {idea.user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {idea.user?.username || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(idea.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[idea.status] || statusColors.draft}>
                {idea.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Join Team</DropdownMenuItem>
                  <DropdownMenuItem>Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Badge variant="secondary" className="mb-2">
              {idea.category}
            </Badge>
            <h3 className="font-bold text-lg leading-tight">{idea.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {idea.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {idea.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {idea.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{idea.tags.length - 4}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1 ${isLiked ? "text-destructive" : ""}`}
                onClick={handleUpvote}
              >
                <motion.div
                  whileTap={{ scale: 1.4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Heart
                    className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                  />
                </motion.div>
                <span className="text-xs">{upvotes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => onComment(idea.id)}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">12</span>
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSaved(!isSaved)}
              >
                <Bookmark
                  className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(idea.id)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
