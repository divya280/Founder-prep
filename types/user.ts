export interface UserProfile {
  id: string;
  email: string;
  name: string;
  business_type: string | null;
  domain: string | null;
  state: string | null;
  team_size: string | null;
  funding_stage: string | null;
  revenue: string | null;
  created_at: string;
}
