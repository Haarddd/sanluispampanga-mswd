-- Add resubmit_fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN resubmit_fields text[] DEFAULT '{}'::text[];

-- Create resubmissions table
CREATE TABLE public.resubmissions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT null,
    resubmitted_data jsonb NOT null,
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resubmissions ENABLE ROW LEVEL SECURITY;

-- Policies for resubmissions
CREATE POLICY "Users can view own resubmissions" 
ON public.resubmissions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own resubmissions" 
ON public.resubmissions 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins have full access to resubmissions" 
ON public.resubmissions 
FOR ALL 
TO authenticated 
USING (public.is_admin());
