import Link from "next/link";
import { redirect } from "next/navigation";
import { ChecklistView } from "@/components/compliance/ChecklistView";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import {
  BUSINESS_TYPE_LABELS,
  DOMAIN_LABELS,
  STATE_LABELS,
  TEAM_SIZE_LABELS,
  FUNDING_STAGE_LABELS,
  REVENUE_LABELS,
} from "@/lib/onboarding/options";
import { isOnboardingComplete } from "@/lib/onboarding/profile";
import type { UserProfile } from "@/types/user";

// value → label lookup so the dashboard shows readable text, not stored keys.
// Falls back to the raw key if an unknown value ever slips through.
function labelFor(
  labels: Record<string, string>,
  value: string | null,
): string | null {
  if (!value) return null;
  return labels[value] ?? value;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ profileUpdated?: string }>;
}) {
  const { profileUpdated } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const userProfile = profile as UserProfile | null;

  // Onboarding incomplete (never finished, or the row was created via another
  // path) → resume it. Onboarding only sends founders back here once every
  // field is set, so this can't loop.
  if (!userProfile || !isOnboardingComplete(userProfile)) {
    redirect("/onboarding");
  }

  const displayName =
    userProfile?.name || user.user_metadata?.name || "Founder";

  const profileFields: { label: string; value: string | null }[] = [
    { label: "Business type", value: labelFor(BUSINESS_TYPE_LABELS, userProfile.business_type) },
    { label: "Domain", value: labelFor(DOMAIN_LABELS, userProfile.domain) },
    { label: "State", value: labelFor(STATE_LABELS, userProfile.state) },
    { label: "Team size", value: labelFor(TEAM_SIZE_LABELS, userProfile.team_size) },
    { label: "Funding stage", value: labelFor(FUNDING_STAGE_LABELS, userProfile.funding_stage) },
    { label: "Annual revenue", value: labelFor(REVENUE_LABELS, userProfile.revenue) },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17201b]">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-y-3 border-b border-[#d9ded4] pb-5">
          <span className="text-lg font-semibold tracking-wide">
            FounderPrep
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/calendar"
              className="text-sm font-medium text-[#427a5b] hover:underline"
            >
              Calendar
            </Link>
            <Link
              href="/vault"
              className="text-sm font-medium text-[#427a5b] hover:underline"
            >
              Vault
            </Link>
            <Link
              href="/assistant"
              className="text-sm font-medium text-[#427a5b] hover:underline"
            >
              AI Assistant
            </Link>
            <LogoutButton />
          </div>
        </header>

        <div className="py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#427a5b]">
            Dashboard
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Welcome, {displayName}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-[#526057]">
            You are signed in as {user.email}. Generate your personalized
            compliance roadmap below, grounded in official Indian sources.
          </p>

          <div className="mt-10 border border-[#d9ded4] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your profile</h2>
              <Link
                href="/onboarding?edit=1"
                className="text-sm font-medium text-[#427a5b] hover:underline"
              >
                Edit
              </Link>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              {profileFields.map((field, index) => (
                <div
                  key={field.label}
                  className={`flex justify-between ${
                    index < profileFields.length - 1
                      ? "border-b border-[#eef0eb] pb-3"
                      : ""
                  }`}
                >
                  <dt className="text-[#5c6b61]">{field.label}</dt>
                  <dd className="font-medium">{field.value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <DashboardWidgets />

          <ChecklistView profileUpdated={profileUpdated === "1"} />
        </div>
      </section>
    </main>
  );
}
