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

-- 3. Enable RLS and public policies
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

-- 4. Seed Data (Children)
DO $$
DECLARE
  sol_id UUID := gen_random_uuid();
  kyeom_id UUID := gen_random_uuid();
  som_id UUID := gen_random_uuid();
  gyeol_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.children (id, name, birth_year, gender) VALUES
    (sol_id, '진솔', 2012, 'M'),
    (kyeom_id, '오다겸', 2014, 'F'),
    (som_id, '오해솜', 2016, 'F'),
    (gyeol_id, '진결', 2017, 'M');

  -- 2023-04-09
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (sol_id, '2023-04-09', 144.3);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (kyeom_id, '2023-04-09', 132);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (som_id, '2023-04-09', 118.6);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (gyeol_id, '2023-04-09', 121.4);

  -- 2023-10-01
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (sol_id, '2023-10-01', 146.5);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (kyeom_id, '2023-10-01', 134.2);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (som_id, '2023-10-01', 120.8);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (gyeol_id, '2023-10-01', 123.9);

  -- 2024-03-17
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (sol_id, '2024-03-17', 149.8);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (kyeom_id, '2024-03-17', 137.4);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (som_id, '2024-03-17', 122.5);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (gyeol_id, '2024-03-17', 127.6);

  -- 2024-05-24
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (sol_id, '2024-05-24', 149.8);
  INSERT INTO public.growth_records (child_id, record_date, height) VALUES (gyeol_id, '2024-05-24', 129);

  -- 2024-10-04
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (som_id, '2024-10-04', 125.4, 24.59);
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (gyeol_id, '2024-10-04', 130.5, 31.5);
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (sol_id, '2024-10-04', 151, 53.4);
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (kyeom_id, '2024-10-04', 140.4, 30.5);

  -- 2024-11-13
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (gyeol_id, '2024-11-13', 132.5, 33);
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (sol_id, '2024-11-13', 152.1, 54.63);

  -- 2024-12-17
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (gyeol_id, '2024-12-17', 133.2, 34.51);
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (sol_id, '2024-12-17', 153.4, 55.35);

  -- 2025-01-09
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (gyeol_id, '2025-01-09', 133.4, 35.34);
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (sol_id, '2025-01-09', 153.4, 55.98);

  -- 2025-03-02
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (sol_id, '2025-03-02', 153.9, 58.23, 95.67);
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (kyeom_id, '2025-03-02', 141.7, 31.55);
  INSERT INTO public.growth_records (child_id, record_date, height, weight) VALUES (som_id, '2025-03-02', 128.4, 25.30);
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2025-03-02', 133.7, 36.21, 97.49);

  -- 2025-03-08
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (sol_id, '2025-03-08', 154.3, 56.08, 98.22);

  -- 2025-04-05
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (sol_id, '2025-04-05', 154.0, 56.2, 97.8);
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2025-04-05', 134.8, 36.5, 98.3);

  -- 2025-05-20
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2025-05-20', 135.4, 35.7, 99.7);

  -- 2025-08-08
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2025-08-08', 136.3, 36.15, 100.15);

  -- 2025-09-20
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (sol_id, '2025-09-20', 156.7, 60.3, 96.4);
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2025-09-20', 137.1, 36.3, 100.8);

  -- 2025-12-13
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (sol_id, '2025-12-13', 157.8, 63.9, 93.9);
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2025-12-13', 138.8, 40.5, 98.3);

  -- 2026-01-10
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (sol_id, '2026-01-10', 158.2, 63.9, 94.3);
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2026-01-10', 139.5, 41.3, 98.2);

  -- 2026-02-07
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (sol_id, '2026-02-07', 158.8, 65.3, 93.5);
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2026-02-07', 139.5, 42.6, 96.9);

  -- 2026-03-07
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (sol_id, '2026-03-07', 159.3, 66.2, 93.1);
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2026-03-07', 139.9, 41.5, 98.4);

  -- 2026-04-04
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2026-04-04', 140.8, 42.3, 98.5);

  -- 2026-05-04
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2026-05-04', 141, 43.2, 97.8);

  -- 2026-05-30
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2026-05-30', 141.4, 41.7, 99.7);

  -- 2026-06-27
  INSERT INTO public.growth_records (child_id, record_date, height, weight, percentile) VALUES (gyeol_id, '2026-06-27', 142.3, 41.5, 100.8);

END $$;
