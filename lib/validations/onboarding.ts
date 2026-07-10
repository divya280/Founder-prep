import { z } from "zod";
import {
  businessTypeValues,
  domainValues,
  stateValues,
  teamSizeValues,
  fundingStageValues,
  revenueValues,
} from "@/lib/onboarding/options";

// Runtime validation for the onboarding profile. Every field must be one of the
// known option keys — this is the trust boundary between the form and `users`,
// and it also guards the RAG query builder (M6) against junk values.

export const onboardingSchema = z.object({
  business_type: z.enum(businessTypeValues, {
    message: "Select your business type",
  }),
  domain: z.enum(domainValues, {
    message: "Select your domain",
  }),
  state: z.enum(stateValues, {
    message: "Select your state",
  }),
  team_size: z.enum(teamSizeValues, {
    message: "Select your team size",
  }),
  funding_stage: z.enum(fundingStageValues, {
    message: "Select your funding stage",
  }),
  revenue: z.enum(revenueValues, {
    message: "Select your annual revenue",
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
