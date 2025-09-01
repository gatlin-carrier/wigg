-- Add hidden media types to profiles for user-controlled visibility
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hidden_media_types jsonb DEFAULT '[]'::jsonb;

