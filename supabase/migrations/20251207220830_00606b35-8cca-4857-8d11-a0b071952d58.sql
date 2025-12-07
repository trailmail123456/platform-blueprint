-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'founder', 'co_founder', 'designer', 'developer', 'marketer', 'analyst', 'researcher');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone"
ON public.teams FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Create team members table
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '{"edit_idea": false, "manage_team": false, "publish_updates": false, "access_pitch": false, "approve_tasks": false}'::jsonb,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by team members"
ON public.team_members FOR SELECT USING (true);

CREATE POLICY "Team founders can manage members"
ON public.team_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('founder', 'co_founder', 'admin')
    )
);

CREATE POLICY "Users can join teams"
ON public.team_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create team messages table for real-time chat
CREATE TABLE public.team_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    file_url TEXT,
    reply_to UUID REFERENCES public.team_messages(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view messages"
ON public.team_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_messages.team_id
        AND tm.user_id = auth.uid()
    )
);

CREATE POLICY "Team members can send messages"
ON public.team_messages FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_messages.team_id
        AND tm.user_id = auth.uid()
    )
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create ideas table
CREATE TABLE public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    upvotes INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public ideas are viewable by everyone"
ON public.ideas FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create ideas"
ON public.ideas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their ideas"
ON public.ideas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their ideas"
ON public.ideas FOR DELETE
USING (auth.uid() = user_id);

-- Create tasks table for team taskboard
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id),
    required_skills TEXT[] DEFAULT '{}',
    due_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view tasks"
ON public.tasks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = tasks.team_id
        AND tm.user_id = auth.uid()
    )
);

CREATE POLICY "Team members can manage tasks"
ON public.tasks FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = tasks.team_id
        AND tm.user_id = auth.uid()
    )
);

-- Enable realtime for chat and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Add updated_at triggers
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_messages_updated_at
BEFORE UPDATE ON public.team_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
BEFORE UPDATE ON public.ideas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();