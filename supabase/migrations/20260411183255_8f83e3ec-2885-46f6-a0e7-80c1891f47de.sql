
-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Circle members can view feedback" ON public.circle_feedback;

-- Allow circle members to view all feedback in their circles
CREATE POLICY "Circle members can view circle feedback"
ON public.circle_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.feedback_circle_members
    WHERE feedback_circle_members.circle_id = circle_feedback.circle_id
      AND feedback_circle_members.user_id = auth.uid()
  )
  OR from_user_id = auth.uid()
  OR to_user_id = auth.uid()
);

-- Public function to count feedback per circle (for unauthenticated users too)
CREATE OR REPLACE FUNCTION public.count_circle_feedback(_circle_ids uuid[])
RETURNS TABLE(circle_id uuid, feedback_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cf.circle_id, COUNT(*)::bigint as feedback_count
  FROM public.circle_feedback cf
  WHERE cf.circle_id = ANY(_circle_ids)
  GROUP BY cf.circle_id;
$$;
