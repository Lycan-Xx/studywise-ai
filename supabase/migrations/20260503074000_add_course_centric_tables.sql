-- Create Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  source_filename TEXT,
  source_file_type TEXT,
  source_content TEXT NOT NULL,
  user_context TEXT,
  parsing_status TEXT DEFAULT 'processing',
  total_modules INTEGER DEFAULT 0,
  used_fallback BOOLEAN DEFAULT false,
  parsing_error TEXT,
  last_studied_at TIMESTAMP WITH TIME ZONE,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist in case the table was created previously without them
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS source_filename TEXT,
ADD COLUMN IF NOT EXISTS source_file_type TEXT,
ADD COLUMN IF NOT EXISTS source_content TEXT,
ADD COLUMN IF NOT EXISTS user_context TEXT,
ADD COLUMN IF NOT EXISTS parsing_status TEXT DEFAULT 'processing',
ADD COLUMN IF NOT EXISTS total_modules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parsing_error TEXT,
ADD COLUMN IF NOT EXISTS last_studied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create Modules Table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  module_order INTEGER NOT NULL DEFAULT 1,
  word_count INTEGER DEFAULT 0,
  estimated_read_time INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist in case the table was created previously without them
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS module_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_read_time INTEGER DEFAULT 1;

-- Alter Tests table to link to courses/modules
ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;

-- Add RLS Policies for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own courses" ON public.courses;
CREATE POLICY "Users can view own courses" ON public.courses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own courses" ON public.courses;
CREATE POLICY "Users can create own courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;
CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE USING (auth.uid() = user_id);

-- Add RLS Policies for modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own modules" ON public.modules;
CREATE POLICY "Users can view own modules" ON public.modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can create own modules" ON public.modules;
CREATE POLICY "Users can create own modules" ON public.modules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update own modules" ON public.modules;
CREATE POLICY "Users can update own modules" ON public.modules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can delete own modules" ON public.modules;
CREATE POLICY "Users can delete own modules" ON public.modules FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.user_id = auth.uid())
);

-- Update search vectors trigger
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'tests' THEN
    NEW.search_vector = to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.description, '') || ' ' || 
      COALESCE(NEW.subject, '') || ' ' ||
      COALESCE(array_to_string(NEW.tags, ' '), '')
    );
  ELSIF TG_TABLE_NAME = 'study_materials' THEN
    NEW.search_vector = to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.content, '') || ' ' ||
      COALESCE(array_to_string(NEW.tags, ' '), '')
    );
  ELSIF TG_TABLE_NAME = 'courses' THEN
    NEW.search_vector = to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.source_content, '') || ' ' ||
      COALESCE(NEW.user_context, '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to courses
DROP TRIGGER IF EXISTS handle_courses_updated_at ON public.courses;
CREATE TRIGGER handle_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger to modules
DROP TRIGGER IF EXISTS handle_modules_updated_at ON public.modules;
CREATE TRIGGER handle_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Search vector trigger for courses
DROP TRIGGER IF EXISTS update_courses_search_vector ON public.courses;
CREATE TRIGGER update_courses_search_vector
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_search_vector();
