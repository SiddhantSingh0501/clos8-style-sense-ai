    -- Create clothing_items table
CREATE TABLE IF NOT EXISTS public.clothing_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  image_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('upper', 'bottom')),
  category_id TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create clothing_categories table if missing
CREATE TABLE IF NOT EXISTS public.clothing_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Create clothing_subcategories table if missing
CREATE TABLE IF NOT EXISTS public.clothing_subcategories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES public.clothing_categories(id)
);

-- Create outfits table
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  upper JSONB NOT NULL, -- JSON object representing upper ClothingItem
  bottom JSONB NOT NULL, -- JSON object representing bottom ClothingItem
  day TEXT NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Set up Row Level Security (RLS) for clothing_items
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;

-- Check if policies exist before creating them
DO $$
BEGIN
    -- Create policy to allow users to select their own clothing items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clothing_items' 
        AND policyname = 'Users can view their own clothing items'
    ) THEN
        CREATE POLICY "Users can view their own clothing items"
        ON public.clothing_items
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    -- Create policy to allow users to insert their own clothing items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clothing_items' 
        AND policyname = 'Users can insert their own clothing items'
    ) THEN
        CREATE POLICY "Users can insert their own clothing items"
        ON public.clothing_items
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Create policy to allow users to update their own clothing items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clothing_items' 
        AND policyname = 'Users can update their own clothing items'
    ) THEN
        CREATE POLICY "Users can update their own clothing items"
        ON public.clothing_items
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    -- Create policy to allow users to delete their own clothing items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clothing_items' 
        AND policyname = 'Users can delete their own clothing items'
    ) THEN
        CREATE POLICY "Users can delete their own clothing items"
        ON public.clothing_items
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Set up Row Level Security (RLS) for outfits
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

-- Check if policies exist before creating them for outfits
DO $$
BEGIN
    -- Create policy to allow users to select their own outfits
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'outfits' 
        AND policyname = 'Users can view their own outfits'
    ) THEN
        CREATE POLICY "Users can view their own outfits"
        ON public.outfits
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    -- Create policy to allow users to insert their own outfits
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'outfits' 
        AND policyname = 'Users can insert their own outfits'
    ) THEN
        CREATE POLICY "Users can insert their own outfits"
        ON public.outfits
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Create policy to allow users to update their own outfits
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'outfits' 
        AND policyname = 'Users can update their own outfits'
    ) THEN
        CREATE POLICY "Users can update their own outfits"
        ON public.outfits
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    -- Create policy to allow users to delete their own outfits
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'outfits' 
        AND policyname = 'Users can delete their own outfits'
    ) THEN
        CREATE POLICY "Users can delete their own outfits"
        ON public.outfits
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS clothing_items_user_id_idx ON public.clothing_items (user_id);
CREATE INDEX IF NOT EXISTS outfits_user_id_idx ON public.outfits (user_id);
CREATE INDEX IF NOT EXISTS clothing_items_type_idx ON public.clothing_items (type);
CREATE INDEX IF NOT EXISTS outfits_day_idx ON public.outfits (day);