import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingInput } from "@/lib/validations/onboarding";
import type { UserProfile } from "@/types/user";

export default async function OnboardingPage() {
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

  // Already onboarded (business_type is the first thing set) → send to dashboard.
  // The founder can still revisit later via an explicit "edit profile" action.
  if (userProfile?.business_type) {
    redirect("/dashboard");
  }

  // Pre-fill any fields already present so a resumed onboarding keeps its state.
  const initial: Partial<OnboardingInput> = {};
  if (userProfile?.domain) initial.domain = userProfile.domain as OnboardingInput["domain"];
  if (userProfile?.state) initial.state = userProfile.state as OnboardingInput["state"];
  if (userProfile?.team_size)
    initial.team_size = userProfile.team_size as OnboardingInput["team_size"];
  if (userProfile?.funding_stage)
    initial.funding_stage = userProfile.funding_stage as OnboardingInput["funding_stage"];
  if (userProfile?.revenue)
    initial.revenue = userProfile.revenue as OnboardingInput["revenue"];

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17201b]">
      <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
        <div className="mb-6">
          <span className="text-lg font-semibold tracking-wide">FounderPrep</span>
          <p className="mt-1 text-sm text-[#526057]">
            A few quick questions so we can build your compliance roadmap.
          </p>
        </div>

        <OnboardingForm userId={user.id} initial={initial} />
      </section>
    </main>
  );
}
