-- 1. Create children table
CREATE TABLE IF NOT EXISTS public.children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  gender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create growth_records table
CREATE TABLE IF NOT EXISTS public.growth_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  height NUMERIC,
  weight NUMERIC,
  percentile NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert initial children
INSERT INTO public.children (name, birth_year, gender) VALUES
  ('진솔', 2012, 'M'),
  ('오다겸', 2014, 'F'),
  ('오해솜', 2016, 'F'),
  ('진결', 2017, 'M');

-- 4. Enable Row Level Security (RLS) but allow public access for now (since no auth is implemented)
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on children" ON public.children FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on children" ON public.children FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on children" ON public.children FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on children" ON public.children FOR DELETE USING (true);

CREATE POLICY "Allow public read access on growth_records" ON public.growth_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on growth_records" ON public.growth_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on growth_records" ON public.growth_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on growth_records" ON public.growth_records FOR DELETE USING (true);

-- 5. Note on initial data:
-- You can seed the records using the app's UI or via an additional SQL script.
