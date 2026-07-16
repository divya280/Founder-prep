"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BUSINESS_TYPES,
  DOMAINS,
  STATES,
  TEAM_SIZES,
  FUNDING_STAGES,
  REVENUES,
} from "@/lib/onboarding/options";
import { onboardingSchema } from "@/lib/validations/onboarding";
import type { OnboardingInput } from "@/lib/validations/onboarding";

interface OnboardingFormProps {
  userId: string;
  /** Auth email/name — used to (re)create the users row if it's missing. */
  email: string;
  name: string;
  /** Pre-fill if the founder is editing a partially-completed profile. */
  initial?: Partial<OnboardingInput>;
  /**
   * "resume" — first visit or unfinished profile: start at the first
   * unanswered step and autosave each completed step so abandoning the form
   * doesn't lose progress. "edit" — a fully-onboarded founder revising their
   * profile from the dashboard: start at step 1, save only on Finish.
   */
  mode?: "resume" | "edit";
}

type FieldKey = keyof OnboardingInput;

interface Step {
  title: string;
  heading: string;
  subtitle: string;
  fields: FieldKey[];
}

const STEPS: Step[] = [
  {
    title: "Business",
    heading: "What kind of business are you building?",
    subtitle: "Your legal structure drives which registrations you need first.",
    fields: ["business_type"],
  },
  {
    title: "Domain",
    heading: "Which sector are you in?",
    subtitle: "Some licenses (FSSAI, NBFC, etc.) are sector-specific.",
    fields: ["domain"],
  },
  {
    title: "Location",
    heading: "Where is your business based?",
    subtitle: "Thresholds and portals vary by state and union territory.",
    fields: ["state"],
  },
  {
    title: "Team & funding",
    heading: "Tell us about your team, stage and revenue",
    subtitle:
      "Headcount, funding stage and revenue band affect labour, tax and reporting obligations.",
    fields: ["team_size", "funding_stage", "revenue"],
  },
];

/** Index of the first step with an unanswered field (step 1 if all answered). */
function firstIncompleteStep(data: Partial<OnboardingInput>): number {
  const index = STEPS.findIndex((s) => s.fields.some((f) => !data[f]));
  return index === -1 ? 0 : index;
}

export function OnboardingForm({
  userId,
  email,
  name,
  initial = {},
  mode = "resume",
}: OnboardingFormProps) {
  const router = useRouter();

  const [step, setStep] = useState(() =>
    mode === "edit" ? 0 : firstIncompleteStep(initial),
  );
  const [data, setData] = useState<Partial<OnboardingInput>>(initial);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  function setField<K extends FieldKey>(field: K, value: OnboardingInput[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Validate the whole profile but only surface errors for the current step's
  // fields, so a founder isn't warned about steps they haven't reached yet.
  function validateStep(): boolean {
    const result = onboardingSchema.safeParse(data);
    const stepErrors: Partial<Record<FieldKey, string>> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && current.fields.includes(key as FieldKey)) {
          stepErrors[key as FieldKey] = issue.message;
        }
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  // Persist profile fields. Update-first; if no row came back the signup
  // trigger never created one (UPDATE matches zero rows and "succeeds", which
  // used to loop founders back to onboarding forever) — self-heal by inserting
  // the row, which the "Users insert own row" RLS policy permits.
  async function persistProfile(
    fields: Partial<Record<FieldKey, string>>,
  ): Promise<boolean> {
    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from("users")
      .update(fields)
      .eq("id", userId)
      .select("id");
    if (error) return false;
    if (updated && updated.length > 0) return true;

    const { error: insertError } = await supabase
      .from("users")
      .insert({ id: userId, email, name, ...fields });
    return !insertError;
  }

  // Best-effort autosave of the current step's answers, so a founder who
  // abandons onboarding partway resumes here next login instead of at step 1.
  // Failures are ignored — the Finish save is the authoritative write.
  async function saveStepFields() {
    const partial: Partial<Record<FieldKey, string>> = {};
    for (const field of current.fields) {
      const value = data[field];
      if (value) partial[field] = value;
    }
    if (Object.keys(partial).length === 0) return;
    await persistProfile(partial);
  }

  function handleNext() {
    if (!validateStep()) return;
    if (mode === "resume") void saveStepFields();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setFormError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleFinish() {
    if (!validateStep()) return;

    const parsed = onboardingSchema.safeParse(data);
    if (!parsed.success) {
      // A field from an earlier step is missing/invalid — say so instead of
      // silently doing nothing, and jump back to the offending step.
      const badField = parsed.error.issues[0]?.path[0];
      const badStep = STEPS.findIndex((s) =>
        s.fields.includes(badField as FieldKey),
      );
      setFormError(
        "Some answers are missing. Please review the highlighted steps.",
      );
      if (badStep >= 0) setStep(badStep);
      return;
    }

    setFormError("");
    setLoading(true);

    const saved = await persistProfile(parsed.data);
    if (!saved) {
      setFormError(
        "We couldn't save your profile. Please try again in a moment.",
      );
      setLoading(false);
      return;
    }

    // On an edited profile, flag the change so the dashboard can prompt an
    // explicit checklist regeneration (never regenerate silently).
    const changed =
      mode === "edit" &&
      (Object.keys(parsed.data) as FieldKey[]).some(
        (key) => parsed.data[key] !== initial[key],
      );

    router.push(changed ? "/dashboard?profileUpdated=1" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="border border-[#d9ded4] bg-white p-8 shadow-sm">
      <StepIndicator steps={STEPS} activeStep={step} />

      <div className="mt-8">
        <h1 className="text-2xl font-semibold">{current.heading}</h1>
        <p className="mt-2 text-sm text-[#526057]">{current.subtitle}</p>
      </div>

      {formError ? (
        <div className="mt-6 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <div className="mt-6 space-y-8">
        {step === 0 ? (
          <OptionCards
            options={BUSINESS_TYPES}
            value={data.business_type}
            onSelect={(v) => setField("business_type", v)}
            error={errors.business_type}
          />
        ) : null}

        {step === 1 ? (
          <OptionCards
            options={DOMAINS}
            value={data.domain}
            onSelect={(v) => setField("domain", v)}
            error={errors.domain}
            columns={2}
          />
        ) : null}

        {step === 2 ? (
          <SelectField
            label="State / Union Territory"
            placeholder="Select a state or UT"
            options={STATES}
            value={data.state ?? ""}
            onSelect={(v) => setField("state", v)}
            error={errors.state}
          />
        ) : null}

        {step === 3 ? (
          <>
            <OptionCards
              label="Team size"
              options={TEAM_SIZES}
              value={data.team_size}
              onSelect={(v) => setField("team_size", v)}
              error={errors.team_size}
              columns={2}
            />
            <OptionCards
              label="Funding stage"
              options={FUNDING_STAGES}
              value={data.funding_stage}
              onSelect={(v) => setField("funding_stage", v)}
              error={errors.funding_stage}
              columns={2}
            />
            <OptionCards
              label="Annual revenue"
              options={REVENUES}
              value={data.revenue}
              onSelect={(v) => setField("revenue", v)}
              error={errors.revenue}
              columns={2}
            />
          </>
        ) : null}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0 || loading}
          className="text-sm font-medium text-[#526057] transition hover:text-[#17201b] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="bg-[#427a5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#356549] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Save changes"
                : "Finish & view dashboard"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="bg-[#427a5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#356549]"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  steps,
  activeStep,
}: {
  steps: Step[];
  activeStep: number;
}) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const isDone = i < activeStep;
        const isActive = i === activeStep;
        return (
          <li key={s.title} className="flex flex-1 flex-col gap-2">
            <div
              className={`h-1.5 w-full rounded-full transition ${
                isDone || isActive ? "bg-[#427a5b]" : "bg-[#e4e8e0]"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                isActive ? "text-[#17201b]" : "text-[#8a978c]"
              }`}
            >
              {i + 1}. {s.title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

interface OptionCardsProps<T extends string> {
  label?: string;
  options: readonly { value: T; label: string; description?: string }[];
  value: T | undefined;
  onSelect: (value: T) => void;
  error?: string;
  columns?: 1 | 2;
}

function OptionCards<T extends string>({
  label,
  options,
  value,
  onSelect,
  error,
  columns = 1,
}: OptionCardsProps<T>) {
  return (
    <div>
      {label ? (
        <p className="mb-3 text-sm font-medium text-[#17201b]">{label}</p>
      ) : null}
      <div
        className={`grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : "grid-cols-1"}`}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`flex flex-col items-start border px-4 py-3 text-left transition ${
                selected
                  ? "border-[#427a5b] bg-[#427a5b]/5 ring-1 ring-[#427a5b]"
                  : "border-[#d9ded4] bg-white hover:border-[#427a5b]/50"
              }`}
            >
              <span className="text-sm font-medium text-[#17201b]">
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-0.5 text-xs text-[#5c6b61]">
                  {option.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  placeholder: string;
  options: readonly { value: T; label: string }[];
  value: T | "";
  onSelect: (value: T) => void;
  error?: string;
}

function SelectField<T extends string>({
  label,
  placeholder,
  options,
  value,
  onSelect,
  error,
}: SelectFieldProps<T>) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#17201b]">{label}</label>
      <select
        value={value}
        onChange={(event) => onSelect(event.target.value as T)}
        className="mt-1.5 w-full border border-[#d9ded4] bg-white px-3 py-2 text-sm outline-none focus:border-[#427a5b] focus:ring-1 focus:ring-[#427a5b]"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
