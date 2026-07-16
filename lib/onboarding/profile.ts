import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validations/onboarding";
import type { UserProfile } from "@/types/user";

// Onboarding completeness is judged against the same schema the form enforces:
// every profile field must hold a known option key. A profile with only some
// fields set (form abandoned partway, or the row was created via another path)
// is incomplete — the founder gets sent back to onboarding to resume, not
// treated as onboarded because one field happens to be present.

export function isOnboardingComplete(profile: UserProfile | null): boolean {
  return onboardingSchema.safeParse(profile ?? {}).success;
}

/** Validate one stored field against its option enum; undefined if unusable. */
function pick<K extends keyof OnboardingInput>(
  key: K,
  value: string | null,
): OnboardingInput[K] | undefined {
  const parsed = onboardingSchema.shape[key].safeParse(value);
  return parsed.success ? (parsed.data as OnboardingInput[K]) : undefined;
}

/**
 * Extract the valid, already-answered fields from a stored profile so the
 * onboarding form can pre-fill them and resume from the first unanswered step.
 */
export function profileToOnboardingInitial(
  profile: UserProfile | null,
): Partial<OnboardingInput> {
  if (!profile) return {};
  return {
    business_type: pick("business_type", profile.business_type),
    domain: pick("domain", profile.domain),
    state: pick("state", profile.state),
    team_size: pick("team_size", profile.team_size),
    funding_stage: pick("funding_stage", profile.funding_stage),
    revenue: pick("revenue", profile.revenue),
  };
}
