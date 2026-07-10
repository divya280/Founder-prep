import {
  BUSINESS_TYPE_LABELS,
  DOMAIN_LABELS,
  STATE_LABELS,
  TEAM_SIZE_LABELS,
  FUNDING_STAGE_LABELS,
  REVENUE_LABELS,
  type BusinessType,
  type Domain,
  type StateCode,
  type TeamSize,
  type FundingStage,
  type RevenueBucket,
} from "@/lib/onboarding/options";
import type { UserProfile } from "@/types/user";

// Turns a founder's stored profile (option KEYS) into a natural-language
// retrieval query built from the human LABELS — the embedding model matches on
// meaning, so "Private Limited Company" retrieves far better than "private_limited".

/** Safely map a stored key to its label, falling back to the raw key. */
function label<T extends string>(
  labels: Record<T, string>,
  value: string | null,
): string | null {
  if (!value) return null;
  return (labels as Record<string, string>)[value] ?? value;
}

export interface ComplianceProfile {
  businessType: string;
  domain: string;
  state: string;
  teamSize: string;
  fundingStage: string;
  revenue: string;
}

/** Extract the labelled profile, or null if onboarding is incomplete. */
export function toComplianceProfile(
  profile: UserProfile,
): ComplianceProfile | null {
  const businessType = label<BusinessType>(BUSINESS_TYPE_LABELS, profile.business_type);
  const domain = label<Domain>(DOMAIN_LABELS, profile.domain);
  const state = label<StateCode>(STATE_LABELS, profile.state);
  const teamSize = label<TeamSize>(TEAM_SIZE_LABELS, profile.team_size);
  const fundingStage = label<FundingStage>(FUNDING_STAGE_LABELS, profile.funding_stage);
  const revenue = label<RevenueBucket>(REVENUE_LABELS, profile.revenue);

  if (!businessType || !domain || !state || !teamSize || !fundingStage || !revenue) {
    return null;
  }
  return { businessType, domain, state, teamSize, fundingStage, revenue };
}

/** Build the retrieval query string fed to embed → match_documents. */
export function buildComplianceQuery(profile: ComplianceProfile): string {
  return [
    `Compliance, registration, licensing and statutory filing requirements in India`,
    `for a ${profile.businessType} in the ${profile.domain} sector,`,
    `based in ${profile.state}, with ${profile.teamSize},`,
    `at ${profile.fundingStage} funding stage and ${profile.revenue}.`,
    `Which registrations, licenses, tax registrations and periodic filings are required,`,
    `in what order, by when, and what are the penalties for non-compliance?`,
  ].join(" ");
}
