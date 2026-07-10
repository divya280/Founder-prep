// Onboarding option sets. For each field:
//   * `<field>Values`  — the stable keys stored in `users` (source of the union)
//   * `<FIELD>_LABELS` — a separate display-label map, keyed by the union type
//   * `<FIELDS>`       — the render list for the form, derived from the two above
//
// Keys are what the M6 RAG query builder consumes; labels are display-only.
// Don't rename a key without a data migration (and update the DB check
// constraints in migrations 001/004 that mirror these).

export interface Option<T extends string = string> {
  value: T;
  label: string;
  /** Short helper line shown under the label in the picker. */
  description?: string;
}

/** Build the form's render list from a values tuple + its label map. */
function toOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
  descriptions?: Partial<Record<T, string>>,
): Option<T>[] {
  return values.map((value) => ({
    value,
    label: labels[value],
    description: descriptions?.[value],
  }));
}

// --- Business type (legal structure) -------------------------------------
export const businessTypeValues = [
  "private_limited",
  "llp",
  "opc",
  "partnership",
  "sole_proprietorship",
  "not_registered",
] as const;
export type BusinessType = (typeof businessTypeValues)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  private_limited: "Private Limited Company",
  llp: "Limited Liability Partnership",
  opc: "One Person Company",
  partnership: "Partnership Firm",
  sole_proprietorship: "Sole Proprietorship",
  not_registered: "Not yet registered",
};

const BUSINESS_TYPE_DESCRIPTIONS: Record<BusinessType, string> = {
  private_limited: "Most common for VC-funded startups",
  llp: "LLP — partners with limited liability",
  opc: "Single-founder company (OPC)",
  partnership: "Two or more partners",
  sole_proprietorship: "Individually owned, simplest structure",
  not_registered: "Still deciding / pre-incorporation",
};

export const BUSINESS_TYPES: Option<BusinessType>[] = toOptions(
  businessTypeValues,
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_DESCRIPTIONS,
);

// --- Domain (sector) -----------------------------------------------------
export const domainValues = [
  "fintech",
  "healthtech",
  "edtech",
  "ecommerce",
  "foodtech",
  "saas",
  "manufacturing",
  "services",
  "other",
] as const;
export type Domain = (typeof domainValues)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  fintech: "Fintech / Financial Services",
  healthtech: "Healthtech / Medical",
  edtech: "Edtech / Education",
  ecommerce: "E-commerce / D2C",
  foodtech: "Foodtech / F&B",
  saas: "SaaS / Software",
  manufacturing: "Manufacturing",
  services: "Professional Services",
  other: "Other",
};

export const DOMAINS: Option<Domain>[] = toOptions(domainValues, DOMAIN_LABELS);

// --- State / UT ----------------------------------------------------------
// Full list of Indian states + union territories. Thresholds and portals vary
// by state (e.g. profession tax, shops & establishment), so this matters.
export const stateValues = [
  "andhra_pradesh",
  "arunachal_pradesh",
  "assam",
  "bihar",
  "chhattisgarh",
  "goa",
  "gujarat",
  "haryana",
  "himachal_pradesh",
  "jharkhand",
  "karnataka",
  "kerala",
  "madhya_pradesh",
  "maharashtra",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "odisha",
  "punjab",
  "rajasthan",
  "sikkim",
  "tamil_nadu",
  "telangana",
  "tripura",
  "uttar_pradesh",
  "uttarakhand",
  "west_bengal",
  "andaman_nicobar",
  "chandigarh",
  "dadra_nagar_haveli_daman_diu",
  "delhi",
  "jammu_kashmir",
  "ladakh",
  "lakshadweep",
  "puducherry",
] as const;
export type StateCode = (typeof stateValues)[number];

export const STATE_LABELS: Record<StateCode, string> = {
  andhra_pradesh: "Andhra Pradesh",
  arunachal_pradesh: "Arunachal Pradesh",
  assam: "Assam",
  bihar: "Bihar",
  chhattisgarh: "Chhattisgarh",
  goa: "Goa",
  gujarat: "Gujarat",
  haryana: "Haryana",
  himachal_pradesh: "Himachal Pradesh",
  jharkhand: "Jharkhand",
  karnataka: "Karnataka",
  kerala: "Kerala",
  madhya_pradesh: "Madhya Pradesh",
  maharashtra: "Maharashtra",
  manipur: "Manipur",
  meghalaya: "Meghalaya",
  mizoram: "Mizoram",
  nagaland: "Nagaland",
  odisha: "Odisha",
  punjab: "Punjab",
  rajasthan: "Rajasthan",
  sikkim: "Sikkim",
  tamil_nadu: "Tamil Nadu",
  telangana: "Telangana",
  tripura: "Tripura",
  uttar_pradesh: "Uttar Pradesh",
  uttarakhand: "Uttarakhand",
  west_bengal: "West Bengal",
  andaman_nicobar: "Andaman & Nicobar Islands",
  chandigarh: "Chandigarh",
  dadra_nagar_haveli_daman_diu: "Dadra & Nagar Haveli and Daman & Diu",
  delhi: "Delhi (NCT)",
  jammu_kashmir: "Jammu & Kashmir",
  ladakh: "Ladakh",
  lakshadweep: "Lakshadweep",
  puducherry: "Puducherry",
};

export const STATES: Option<StateCode>[] = toOptions(stateValues, STATE_LABELS);

// --- Team size -----------------------------------------------------------
// Bands chosen around compliance thresholds: 10+ (ESI), 20+ (PF/gratuity).
export const teamSizeValues = ["solo", "2-10", "11-20", "21-50", "51-200", "200+"] as const;
export type TeamSize = (typeof teamSizeValues)[number];

export const TEAM_SIZE_LABELS: Record<TeamSize, string> = {
  solo: "Just me",
  "2-10": "2–10 employees",
  "11-20": "11–20 employees",
  "21-50": "21–50 employees",
  "51-200": "51–200 employees",
  "200+": "200+ employees",
};

export const TEAM_SIZES: Option<TeamSize>[] = toOptions(teamSizeValues, TEAM_SIZE_LABELS);

// --- Funding stage -------------------------------------------------------
export const fundingStageValues = [
  "bootstrapped",
  "pre_seed",
  "seed",
  "series_a",
  "series_b_plus",
] as const;
export type FundingStage = (typeof fundingStageValues)[number];

export const FUNDING_STAGE_LABELS: Record<FundingStage, string> = {
  bootstrapped: "Bootstrapped",
  pre_seed: "Pre-seed",
  seed: "Seed",
  series_a: "Series A",
  series_b_plus: "Series B and beyond",
};

export const FUNDING_STAGES: Option<FundingStage>[] = toOptions(
  fundingStageValues,
  FUNDING_STAGE_LABELS,
);

// --- Annual revenue (bucketed) -------------------------------------------
// Bands, not a number — chosen around Indian compliance thresholds: GST
// registration (~₹20L/₹40L), MSME classification, and statutory audit limits.
export const revenueValues = [
  "pre_revenue",
  "under_10l",
  "10l_1cr",
  "1cr_10cr",
  "over_10cr",
] as const;
export type RevenueBucket = (typeof revenueValues)[number];

export const REVENUE_LABELS: Record<RevenueBucket, string> = {
  pre_revenue: "Pre-revenue",
  under_10l: "Under ₹10 lakh / year",
  "10l_1cr": "₹10 lakh – ₹1 crore / year",
  "1cr_10cr": "₹1 crore – ₹10 crore / year",
  over_10cr: "Over ₹10 crore / year",
};

export const REVENUES: Option<RevenueBucket>[] = toOptions(revenueValues, REVENUE_LABELS);
