-- Add graph_type column to profiles for user visualization preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS graph_type text DEFAULT 'curve' CHECK (graph_type IN ('curve', 'bars', 'pulse', 'barcode'));

-- Update existing profiles to have default graph_type if null
UPDATE public.profiles 
SET graph_type = 'curve' 
WHERE graph_type IS NULL;