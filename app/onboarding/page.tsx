import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { createClient } from "@/lib/supabase/server";
import {
  isOnboardingComplete,
  profileToOnboardingInitial,
} from "@/lib/onboarding/profile";
import type { UserProfile } from "@/types/user";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
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
  const complete = isOnboardingComplete(userProfile);

  // Fully onboarded founders skip straight to the dashboard — unless they
  // explicitly came to edit their profile (?edit=1 from the dashboard).
  const isEdit = edit === "1" && complete;
  if (complete && !isEdit) {
    redirect("/dashboard");
  }

  // Pre-fill every valid answered field so a resumed onboarding continues
  // from where the founder left off instead of restarting at step 1.
  const initial = profileToOnboardingInitial(userProfile);

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#17201b]">
      <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
        <div className="mb-6">
          <span className="text-lg font-semibold tracking-wide">FounderPrep</span>
          <p className="mt-1 text-sm text-[#526057]">
            {isEdit
              ? "Update your founder profile. If anything changes, you can regenerate your checklist afterwards."
              : "A few quick questions so we can build your compliance roadmap."}
          </p>
        </div>

        <OnboardingForm
          userId={user.id}
          email={user.email ?? ""}
          name={
            typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : ""
          }
          initial={initial}
          mode={isEdit ? "edit" : "resume"}
        />
      </section>
    </main>
  );
}
