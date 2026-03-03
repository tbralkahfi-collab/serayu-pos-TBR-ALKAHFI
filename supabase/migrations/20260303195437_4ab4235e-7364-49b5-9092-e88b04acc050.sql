
-- Add approved column to user_roles (default false for new users, but existing users are approved)
ALTER TABLE public.user_roles ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Approve existing users
UPDATE public.user_roles SET approved = true;

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND approved = true
  )
$$;
