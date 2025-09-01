-- Add media preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_media_types text[] DEFAULT ARRAY['Movie', 'TV Show', 'Game', 'Book', 'Podcast'];