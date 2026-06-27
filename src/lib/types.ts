export interface Child {
  id: string;
  name: string;
  birth_year: number;
  gender: string;
}

export interface GrowthRecord {
  id: string;
  child_id: string;
  record_date: string;
  height: number | null;
  weight: number | null;
  percentile: number | null;
  created_at?: string;
}
